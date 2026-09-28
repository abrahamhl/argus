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
      console.log(`Querying Overpass via ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ArgusLeadExpansion/2.0 (audit@argus-intel.eu)'
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

// Target regions: high-density cities in Gelderland/Overijssel (NL) and Niederrhein/Ruhr border (DE)
const REGIONS = [
  // Netherlands
  { city: 'Apeldoorn', country: 'NL', query: 'area["name"="Apeldoorn"]["admin_level"~"8|10"]->.searchArea;', limit: 140 },
  { city: 'Deventer', country: 'NL', query: 'area["name"="Deventer"]["admin_level"~"8|10"]->.searchArea;', limit: 120 },
  { city: 'Zutphen', country: 'NL', query: 'area["name"="Zutphen"]["admin_level"~"8|10"]->.searchArea;', limit: 90 },
  { city: 'Enschede', country: 'NL', query: 'area["name"="Enschede"]["admin_level"~"8|10"]->.searchArea;', limit: 140 },
  { city: 'Zwolle', country: 'NL', query: 'area["name"="Zwolle"]["admin_level"~"8|10"]->.searchArea;', limit: 140 },
  { city: 'Doetinchem', country: 'NL', query: 'area["name"="Doetinchem"]["admin_level"~"8|10"]->.searchArea;', limit: 90 },
  { city: 'Ede', country: 'NL', query: 'area["name"="Ede"]["admin_level"~"8|10"]->.searchArea;', limit: 100 },
  // Germany (NRW Border)
  { city: 'Bocholt', country: 'DE', query: 'area["name"="Bocholt"]["admin_level"~"8|10"]->.searchArea;', limit: 120 },
  { city: 'Wesel', country: 'DE', query: 'area["name"="Wesel"]["admin_level"~"8|10"]->.searchArea;', limit: 120 },
  { city: 'Krefeld', country: 'DE', query: 'area["name"="Krefeld"]["admin_level"~"8|10"]->.searchArea;', limit: 150 },
  { city: 'Moers', country: 'DE', query: 'area["name"="Moers"]["admin_level"~"8|10"]->.searchArea;', limit: 120 },
  { city: 'Dinslaken', country: 'DE', query: 'area["name"="Dinslaken"]["admin_level"~"8|10"]->.searchArea;', limit: 100 },
  { city: 'Goch', country: 'DE', query: 'area["name"="Goch"]["admin_level"~"8|10"]->.searchArea;', limit: 70 },
  { city: 'Geldern', country: 'DE', query: 'area["name"="Geldern"]["admin_level"~"8|10"]->.searchArea;', limit: 70 }
];

async function fetchRegionData(target) {
  console.log(`\n========================================`);
  console.log(`Fetching High-Value Leads for ${target.city} (${target.country}) [Limit: ${target.limit}]`);
  console.log(`========================================`);

  // Target high ticket healthcare, aesthetics, beauty, hotels, legal/professional
  const query = `[out:json][timeout:35];
${target.query}
(
  node["amenity"~"clinic|dentist|doctors|spa"]["website"](area.searchArea);
  way["amenity"~"clinic|dentist|doctors|spa"]["website"](area.searchArea);
  node["healthcare"]["website"](area.searchArea);
  way["healthcare"]["website"](area.searchArea);
  node["shop"~"beauty|hairdresser|optician|massage"]["website"](area.searchArea);
  way["shop"~"beauty|hairdresser|optician|massage"]["website"](area.searchArea);
  node["tourism"~"hotel|guest_house"]["website"](area.searchArea);
  way["tourism"~"hotel|guest_house"]["website"](area.searchArea);
  node["office"~"lawyer|notary|tax_advisor|accountant"]["website"](area.searchArea);
  way["office"~"lawyer|notary|tax_advisor|accountant"]["website"](area.searchArea);
);
out center ${target.limit};`;

  const data = await queryOverpass(query);
  const elements = data.elements || [];
  console.log(`Found ${elements.length} raw elements for ${target.city}`);
  return elements;
}

async function main() {
  const outputPath = path.join(ROOT_DIR, 'data', 'raw_expanded_leads_osm.json');
  let cache = {};
  if (fs.existsSync(outputPath)) {
    try {
      cache = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch {}
  }

  let totalFetched = 0;
  for (const region of REGIONS) {
    if (cache[region.city] && cache[region.city].length > 0) {
      console.log(`Cache exists for ${region.city} (${cache[region.city].length} items). Skipping fetch.`);
      totalFetched += cache[region.city].length;
      continue;
    }

    try {
      const items = await fetchRegionData(region);
      cache[region.city] = items;
      totalFetched += items.length;
      fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
      console.log(`Progress: Saved ${region.city}. Total elements so far: ${totalFetched}`);
      await sleep(2500); // Respect Overpass rate limits
    } catch (err) {
      console.error(`Failed to fetch ${region.city}:`, err.message);
    }
  }

  console.log(`\n✅ Finished fetching expanded regions. Total raw elements: ${totalFetched}`);
}

main().catch(console.error);
