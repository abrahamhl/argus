import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function queryOverpass(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ArgusMadridIntel/2.0 (madrid@argus-audit.es)'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`Endpoint ${endpoint} returned status ${res.status}`);
      await sleep(1500);
    } catch (err) {
      console.warn(`Endpoint ${endpoint} failed: ${err.message}`);
      await sleep(1000);
    }
  }
  return { elements: [] };
}

// Bounding boxes for high-wealth Madrid districts (instant execution, zero timeouts)
const MADRID_BOXES = [
  { name: 'Centro-Retiro', bbox: '40.405,-3.715,40.425,-3.675', limit: 120 },
  { name: 'Salamanca-Chamberi-Prime', bbox: '40.425,-3.715,40.445,-3.670', limit: 140 },
  { name: 'Castellana-Chamartin-Cuzco', bbox: '40.445,-3.700,40.475,-3.680', limit: 120 },
  { name: 'Moncloa-Argüelles-Almagro', bbox: '40.425,-3.730,40.445,-3.700', limit: 100 }
];

async function fetchBox(target) {
  console.log(`\n========================================`);
  console.log(`Fetching Madrid [${target.name}] bbox:${target.bbox} (limit: ${target.limit})`);
  console.log(`========================================`);

  const query = `[out:json][timeout:25][bbox:${target.bbox}];
(
  node["office"~"lawyer|notary|tax_advisor|accountant|estate_agent|financial"]["website"];
  way["office"~"lawyer|notary|tax_advisor|accountant|estate_agent|financial"]["website"];
  node["amenity"~"dentist|clinic"]["website"];
  way["amenity"~"dentist|clinic"]["website"];
  node["shop"~"beauty|hairdresser"]["website"];
  way["shop"~"beauty|hairdresser"]["website"];
  node["tourism"~"hotel|guest_house"]["website"];
  way["tourism"~"hotel|guest_house"]["website"];
);
out center ${target.limit};`;

  const data = await queryOverpass(query);
  const elements = data.elements || [];
  console.log(`Found ${elements.length} elements for ${target.name}`);
  return elements;
}

async function main() {
  const outputPath = path.join(ROOT_DIR, 'data', 'raw_madrid_leads.json');
  let cache = {};
  if (fs.existsSync(outputPath)) {
    try {
      cache = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch {}
  }

  let total = 0;
  for (const b of MADRID_BOXES) {
    if (cache[b.name] && cache[b.name].length > 0) {
      console.log(`Cache exists for ${b.name} (${cache[b.name].length} items). Skipping.`);
      total += cache[b.name].length;
      continue;
    }
    const items = await fetchBox(b);
    cache[b.name] = items;
    total += items.length;
    fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
    await sleep(2000);
  }

  console.log(`\n✅ Finished fetching Madrid leads. Total elements across boxes: ${total}`);
}

main().catch(console.error);
