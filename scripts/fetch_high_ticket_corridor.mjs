import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
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
          'User-Agent': 'ArgusHighTicketIntel/1.0 (audit@argus-security.nl)'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(20000)
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

// Arnhem, Nijmegen, and wealthy surrounding direct suburbs
const TARGET_AREAS = [
  { name: 'Arnhem', query: 'area["name"="Arnhem"]->.searchArea;', limit: 180 },
  { name: 'Nijmegen', query: 'area["name"="Nijmegen"]->.searchArea;', limit: 180 },
  { name: 'Oosterbeek-Renkum', query: 'area["name"="Renkum"]->.searchArea;', limit: 90 },
  { name: 'Rheden-Velp', query: 'area["name"="Rheden"]->.searchArea;', limit: 90 },
  { name: 'Overbetuwe-Elst', query: 'area["name"="Overbetuwe"]->.searchArea;', limit: 80 },
  { name: 'Berg en Dal', query: 'area["name"="Berg en Dal"]->.searchArea;', limit: 80 },
  { name: 'Wijchen', query: 'area["name"="Wijchen"]->.searchArea;', limit: 80 }
];

async function fetchHighTicketArea(target) {
  console.log(`\n========================================`);
  console.log(`Fetching Legal, Financial & High-Net Leads for ${target.name} [Limit: ${target.limit}]`);
  console.log(`========================================`);

  const query = `[out:json][timeout:35];
${target.query}
(
  node["office"~"lawyer|notary|tax_advisor|accountant|financial|estate_agent|insurance"]["website"](area.searchArea);
  way["office"~"lawyer|notary|tax_advisor|accountant|financial|estate_agent|insurance"]["website"](area.searchArea);
  node["amenity"~"dentist|clinic"]["website"](area.searchArea);
  way["amenity"~"dentist|clinic"]["website"](area.searchArea);
  node["tourism"~"hotel|guest_house"]["website"](area.searchArea);
  way["tourism"~"hotel|guest_house"]["website"](area.searchArea);
);
out center ${target.limit};`;

  const data = await queryOverpass(query);
  const elements = data.elements || [];
  console.log(`Found ${elements.length} raw elements for ${target.name}`);
  return elements;
}

async function main() {
  const outputPath = path.join(ROOT_DIR, 'data', 'raw_arnhem_nijmegen_high_ticket.json');
  let cache = {};
  if (fs.existsSync(outputPath)) {
    try {
      cache = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch {}
  }

  let total = 0;
  for (const t of TARGET_AREAS) {
    if (cache[t.name] && cache[t.name].length > 0) {
      console.log(`Cache exists for ${t.name} (${cache[t.name].length} items). Skipping fetch.`);
      total += cache[t.name].length;
      continue;
    }
    const items = await fetchHighTicketArea(t);
    cache[t.name] = items;
    total += items.length;
    fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
    await sleep(2000);
  }

  console.log(`\n✅ Finished fetching High-Ticket leads. Total elements: ${total}`);
}

main().catch(console.error);
