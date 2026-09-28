import fs from 'node:fs';
import path from 'node:path';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

async function queryOverpass(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ArgusLeadIntel/1.0 (argus@audit.local)'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`Endpoint ${endpoint} returned status ${res.status}`);
    } catch (err) {
      console.warn(`Endpoint ${endpoint} failed: ${err.message}`);
    }
  }
  throw new Error('All Overpass endpoints failed');
}

async function fetchCity(cityName, areaQuery, limit = 150) {
  console.log(`\n--- Fetching ${cityName} (limit ${limit}) ---`);
  const query = `[out:json][timeout:35];
${areaQuery}
(
  node["website"]["name"](area.searchArea);
  way["website"]["name"](area.searchArea);
);
out center ${limit};`;

  const data = await queryOverpass(query);
  console.log(`Fetched ${data.elements?.length || 0} raw elements for ${cityName}`);
  return data.elements || [];
}

async function main() {
  const results = {
    nijmegen: await fetchCity('Nijmegen', 'area["name"="Nijmegen"]->.searchArea;', 120),
    wageningen: await fetchCity('Wageningen', 'area["name"="Wageningen"]->.searchArea;', 80),
    kleve: await fetchCity('Kleve', 'area["name"="Kleve"]->.searchArea;', 80),
    emmerich: await fetchCity('Emmerich am Rhein', 'area["name"="Emmerich am Rhein"]->.searchArea;', 60)
  };

  fs.writeFileSync('data/raw_regional_osm.json', JSON.stringify(results, null, 2));
  console.log('\nSaved raw data to data/raw_regional_osm.json');
}

main().catch(console.error);
