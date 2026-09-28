import fs from 'node:fs';
import path from 'node:path';

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
          'User-Agent': 'ArgusAppointmentAudit/1.0 (audit@auxdesign.net)'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(10000)
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

async function fetchCityAppointments(cityName, areaQuery, limit = 100) {
  console.log(`\n--- Fetching Appointment Leads for ${cityName} (limit ${limit}) ---`);
  const query = `[out:json][timeout:25];
${areaQuery}
(
  node["amenity"~"clinic|dentist|doctors|spa"]["website"](area.searchArea);
  way["amenity"~"clinic|dentist|doctors|spa"]["website"](area.searchArea);
  node["healthcare"]["website"](area.searchArea);
  way["healthcare"]["website"](area.searchArea);
  node["shop"~"beauty|hairdresser|optician"]["website"](area.searchArea);
  way["shop"~"beauty|hairdresser|optician"]["website"](area.searchArea);
  node["tourism"~"hotel|guest_house"]["website"](area.searchArea);
  way["tourism"~"hotel|guest_house"]["website"](area.searchArea);
);
out center ${limit};`;

  const data = await queryOverpass(query);
  console.log(`Fetched ${data.elements?.length || 0} appointment elements for ${cityName}`);
  return data.elements || [];
}

async function main() {
  const targets = [
    { city: 'Arnhem', query: 'area["name"="Arnhem"]->.searchArea;', limit: 120 },
    { city: 'Nijmegen', query: 'area["name"="Nijmegen"]->.searchArea;', limit: 120 },
    { city: 'Wageningen', query: 'area["name"="Wageningen"]->.searchArea;', limit: 80 },
    { city: 'Ede', query: 'area["name"="Ede"]->.searchArea;', limit: 80 },
    { city: 'Kleve', query: 'area["name"="Kleve"]["admin_level"="8"]->.searchArea;', limit: 80 },
    { city: 'Emmerich am Rhein', query: 'area["name"="Emmerich am Rhein"]->.searchArea;', limit: 60 }
  ];

  const outputPath = 'data/raw_appointment_leads_osm.json';
  let results = {};
  if (fs.existsSync(outputPath)) {
    try {
      results = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch {}
  }

  for (const t of targets) {
    if (results[t.city] && results[t.city].length > 0) {
      console.log(`Already have ${results[t.city].length} elements for ${t.city}, skipping fetch.`);
      continue;
    }
    results[t.city] = await fetchCityAppointments(t.city, t.query, t.limit);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    await sleep(2000);
  }

  console.log(`\n✅ Saved raw appointment leads to ${outputPath}`);
}

main().catch(console.error);
