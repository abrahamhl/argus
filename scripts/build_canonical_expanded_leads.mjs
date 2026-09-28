import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function slugify(text) {
  return (text || 'lead')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function cleanDomain(url) {
  if (!url) return null;
  let d = url.trim().toLowerCase();
  try {
    if (d.startsWith('http://') || d.startsWith('https://')) {
      d = new URL(d).hostname;
    } else {
      d = d.split('/')[0];
    }
  } catch {
    d = d.replace(/^https?:\/\//, '').split('/')[0];
  }
  d = d.replace(/^www\./, '').trim();
  if (/facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|google\.com|wikipedia\.org|wikidata\.org|tiktok\.com|overpass-api\.de/.test(d)) {
    return null;
  }
  return d;
}

function classifySector(tags, name) {
  const text = `${tags.amenity || ''} ${tags.healthcare || ''} ${tags.shop || ''} ${tags.tourism || ''} ${tags.office || ''} ${name || ''}`.toLowerCase();

  // 1. Legal, Notary & Tax Consultancies (High Ticket Corporate)
  if (/advocaat|advocaten|notaris|notar|steuerberater|rechtsanwalt|steuer|steuerberatung|tax|juridisch|belasting/.test(text)) {
    return {
      sectorId: 'LEGAL_TAX',
      name: 'Advocaten, Notarissen & Steuerberater',
      ticketAvgEur: 850,
      treatmentType: 'Zakelijk juridisch advies & fiscale audit'
    };
  }

  // 2. High-end Dental & Orthodontics
  if (/tandarts|dentist|mondzorg|ortho|dental|tandheel|zahnarzt|kieferorth/.test(text)) {
    return {
      sectorId: 'DENTAL',
      name: 'Tandartsen & Mondzorgpraktijken',
      ticketAvgEur: 220,
      treatmentType: 'Periodieke controle, implantologie & esthetisch mondzorg'
    };
  }

  // 3. Aesthetic, Cosmetic & Laser Clinics
  if (/esthetiek|kliniek|cosmetic|beauty|huidtherapie|skin|laser|botox|inject|filler|schoonheid|dermatolog|plastisch|kosmetik|haarentfernung/.test(text)) {
    return {
      sectorId: 'AESTHETICS',
      name: 'Klinieken, Esthetiek & Huidtherapie',
      ticketAvgEur: 320,
      treatmentType: 'Huidverbetering, injectable intakes & laserbehandelingen'
    };
  }

  // 4. Boutique Hotels, Resorts & B&Bs
  if (/hotel|guest_house|pension|b&b|hostel|resort|boutique|landgoed|zimmer/.test(text)) {
    return {
      sectorId: 'HOSPITALITY',
      name: 'Boutique Hotels & Directe Reserveringen',
      ticketAvgEur: 210,
      treatmentType: 'Directe overnachtingsreservering (zonder 18% OTA-commissie)'
    };
  }

  // 5. Physiotherapy, Chiropractic & Rehabilitation
  if (/fysio|podotherap|chiropract|osteopath|oefentherap|logoped|manueel|physio|krankengymnastik/.test(text)) {
    return {
      sectorId: 'PHYSIO',
      name: 'Fysiotherapie, Revalidatie & Podotherapie',
      ticketAvgEur: 75,
      treatmentType: 'Intake, diagnostiek & specialistische zitting'
    };
  }

  // 6. Medical Specialists & Private Practices
  if (/huisarts|arts|dokter|doctor|gezondheidscentrum|artsenpraktijk|therapist|psycholog|arzt|praxis|klinik|facharzt|augenarzt/.test(text)) {
    return {
      sectorId: 'MEDICAL',
      name: 'Huisartsen & Medisch Specialisten',
      ticketAvgEur: 110,
      treatmentType: 'Diagnostisch spreekuur & specialistisch consult'
    };
  }

  // 7. Salons, Spa & High-End Wellness
  if (/kapper|hairdresser|barbier|hairstudio|spa|wellness|sauna|massage|friseur/.test(text)) {
    return {
      sectorId: 'SALON_SPA',
      name: 'Luxe Kapsalons, Spa & Wellness Boutiques',
      ticketAvgEur: 125,
      treatmentType: 'VIP styling, wellness arrangementen & ontspanningssessies'
    };
  }

  // 8. Regulated Wellness / Adult Studios (Legal NL/DE high discretion)
  if (/studio|relax|saunaclub|privatclub|lounge|escort|bureau|discreet/.test(text)) {
    return {
      sectorId: 'PRIVATE_WELLNESS_LOUNGE',
      name: 'Gereguleerde Wellness Studios & Discreet Boeken',
      ticketAvgEur: 250,
      treatmentType: 'Discreet intake & geautomatiseerd reserveringsslot'
    };
  }

  return {
    sectorId: 'SPECIALTY_CARE',
    name: 'Gespecialiseerde Diensten & Optometrie',
    ticketAvgEur: 140,
    treatmentType: 'Specialistisch adviesgesprek op afspraak'
  };
}

function formatPhone(rawPhone, city, country) {
  if (!rawPhone) return null;
  let p = rawPhone.trim().replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();
  if (p.startsWith('00')) p = '+' + p.slice(2);

  if (country === 'NL' || ['Arnhem', 'Nijmegen', 'Wageningen', 'Ede', 'Apeldoorn', 'Deventer', 'Zutphen', 'Enschede', 'Zwolle', 'Doetinchem'].includes(city)) {
    if (p.startsWith('0')) p = '+31 ' + p.slice(1);
    else if (!p.startsWith('+31') && !p.startsWith('+')) p = '+31 ' + p;
  } else if (country === 'DE' || ['Kleve', 'Emmerich am Rhein', 'Bocholt', 'Wesel', 'Krefeld', 'Moers', 'Dinslaken', 'Goch', 'Geldern'].includes(city)) {
    if (p.startsWith('0')) p = '+49 ' + p.slice(1);
    else if (!p.startsWith('+49') && !p.startsWith('+')) p = '+49 ' + p;
  }
  return p;
}

function getCityMeta(city) {
  const meta = {
    // NL
    'Arnhem': { country: 'NL', region: 'Gelderland' },
    'Nijmegen': { country: 'NL', region: 'Gelderland' },
    'Wageningen': { country: 'NL', region: 'Gelderland' },
    'Ede': { country: 'NL', region: 'Gelderland' },
    'Apeldoorn': { country: 'NL', region: 'Gelderland' },
    'Deventer': { country: 'NL', region: 'Overijssel' },
    'Zutphen': { country: 'NL', region: 'Gelderland' },
    'Enschede': { country: 'NL', region: 'Overijssel' },
    'Zwolle': { country: 'NL', region: 'Overijssel' },
    'Doetinchem': { country: 'NL', region: 'Gelderland' },
    // DE
    'Kleve': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Emmerich am Rhein': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Bocholt': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Wesel': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Krefeld': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Moers': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Dinslaken': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Goch': { country: 'DE', region: 'Nordrhein-Westfalen' },
    'Geldern': { country: 'DE', region: 'Nordrhein-Westfalen' }
  };
  return meta[city] || { country: 'NL', region: 'Gelderland / NRW' };
}

export function buildCanonicalMasterCatalog() {
  const seenDomains = new Set();
  const seenNames = new Set();
  const leads = [];

  // Helper to process an array of elements for a city
  function ingestCityElements(elements, cityName) {
    const { country, region } = getCityMeta(cityName);
    for (const el of elements) {
      const tags = el.tags || {};
      const name = tags.name || tags.brand || tags.operator;
      if (!name) continue;

      const website = tags.website || tags['contact:website'] || tags.url;
      const domain = cleanDomain(website);
      if (!domain) continue;

      const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenDomains.has(domain) || seenNames.has(normName)) {
        continue;
      }

      seenDomains.add(domain);
      seenNames.add(normName);

      const sector = classifySector(tags, name);
      const phone = formatPhone(tags.phone || tags['contact:phone'] || tags['phone:mobile'], cityName, country);

      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const postcode = tags['addr:postcode'] || '';
      const address = [street, housenumber, postcode, cityName].filter(Boolean).join(' ') || `${cityName}, ${region}`;

      const lat = el.lat || el.center?.lat || null;
      const lon = el.lon || el.center?.lon || null;

      leads.push({
        company_id: `biz-${country.toLowerCase()}-${slugify(cityName)}-${slugify(name)}`,
        business_name: name,
        domain: domain,
        website: website.startsWith('http') ? website : `https://${domain}`,
        address: address,
        city: cityName,
        region: region,
        country: country,
        sector_id: sector.sectorId,
        sector_name: sector.name,
        avg_ticket_eur: sector.ticketAvgEur,
        treatment_type: sector.treatmentType,
        phone_public: phone,
        public_contact: phone ? `Tel: ${phone}` : 'Website contactformulier',
        latitude: lat,
        longitude: lon,
        source: 'OSM Overpass Verified POI'
      });
    }
  }

  // 1. Ingest existing canonical datasets first
  const existingFiles = [
    path.join(ROOT_DIR, 'data', 'canonical_appointment_leads.json'),
    path.join(ROOT_DIR, 'data', 'canonical_cross_border_businesses.json'),
    path.join(ROOT_DIR, 'data', 'canonical_arnhem_businesses.json')
  ];

  for (const f of existingFiles) {
    if (fs.existsSync(f)) {
      try {
        const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
        for (const item of arr) {
          const domain = cleanDomain(item.domain || item.website);
          if (!domain || seenDomains.has(domain)) continue;
          seenDomains.add(domain);
          const normName = (item.business_name || item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normName) seenNames.add(normName);

          const { country, region } = getCityMeta(item.city);
          const sector = classifySector({}, item.business_name || item.name || '');

          leads.push({
            company_id: item.company_id || `biz-${country.toLowerCase()}-${slugify(item.city)}-${slugify(item.business_name || item.name)}`,
            business_name: item.business_name || item.name,
            domain: domain,
            website: item.website || `https://${domain}`,
            address: item.address || `${item.city}, ${region}`,
            city: item.city,
            region: item.region || region,
            country: item.country || country,
            sector_id: item.sector_id || sector.sectorId,
            sector_name: item.sector_name || sector.name,
            avg_ticket_eur: item.avg_ticket_eur || sector.ticketAvgEur,
            treatment_type: item.treatment_type || sector.treatmentType,
            phone_public: item.phone_public || item.phone || null,
            public_contact: item.public_contact || (item.phone_public ? `Tel: ${item.phone_public}` : 'Website contactformulier'),
            latitude: item.latitude || null,
            longitude: item.longitude || null,
            source: item.source || 'Canonical Registry'
          });
        }
      } catch (err) {
        console.warn(`Could not read ${f}:`, err.message);
      }
    }
  }

  // 2. Ingest raw appointment leads osm
  const rawApp = path.join(ROOT_DIR, 'data', 'raw_appointment_leads_osm.json');
  if (fs.existsSync(rawApp)) {
    try {
      const data = JSON.parse(fs.readFileSync(rawApp, 'utf8'));
      for (const [city, elems] of Object.entries(data)) {
        if (Array.isArray(elems)) ingestCityElements(elems, city);
      }
    } catch {}
  }

  // 3. Ingest raw expanded leads osm
  const rawExp = path.join(ROOT_DIR, 'data', 'raw_expanded_leads_osm.json');
  if (fs.existsSync(rawExp)) {
    try {
      const data = JSON.parse(fs.readFileSync(rawExp, 'utf8'));
      for (const [city, elems] of Object.entries(data)) {
        if (Array.isArray(elems)) ingestCityElements(elems, city);
      }
    } catch {}
  }

  return leads;
}

async function main() {
  const masterList = buildCanonicalMasterCatalog();
  const outPath = path.join(ROOT_DIR, 'data', 'canonical_expanded_all_leads.json');
  fs.writeFileSync(outPath, JSON.stringify(masterList, null, 2));
  console.log(`\n🎉 Built Master Canonical Catalog with ${masterList.length} unique businesses!`);
  console.log(`Saved to ${outPath}`);

  // Summary by city & country
  const byCity = {};
  for (const l of masterList) {
    byCity[l.city] = (byCity[l.city] || 0) + 1;
  }
  console.log('Breakdown by City:', byCity);
}

main().catch(console.error);
