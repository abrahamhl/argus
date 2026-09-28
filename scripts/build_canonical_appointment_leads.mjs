import fs from 'node:fs';
import path from 'node:path';

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
  if (/facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|google\.com|wikipedia\.org|wikidata\.org|tiktok\.com/.test(d)) {
    return null;
  }
  return d;
}

function classifyAppointmentSector(tags, name) {
  const text = `${tags.amenity || ''} ${tags.healthcare || ''} ${tags.shop || ''} ${tags.tourism || ''} ${name || ''}`.toLowerCase();
  
  if (/tandarts|dentist|mondzorg|ortho|dental|tandheel/.test(text)) {
    return {
      sectorId: 'DENTAL',
      name: 'Tandartsen & Mondzorgpraktijken',
      ticketAvgEur: 180,
      treatmentType: 'Periodieke controle & mondhygiëne / esthetisch'
    };
  }
  if (/esthetiek|kliniek|cosmetic|beauty|huidtherapie|skin|laser|botox|inject|filler|schoonheid|dermatolog/.test(text)) {
    return {
      sectorId: 'AESTHETICS',
      name: 'Klinieken, Esthetiek & Huidtherapie',
      ticketAvgEur: 250,
      treatmentType: 'Huidverbetering, laser & esthetische behandelingen'
    };
  }
  if (/fysio|podotherap|chiropract|osteopath|oefentherap|logoped|manueel/.test(text)) {
    return {
      sectorId: 'PHYSIO',
      name: 'Fysiotherapie, Podotherapie & Revalidatie',
      ticketAvgEur: 65,
      treatmentType: 'Intake & specialistische behandelzitting'
    };
  }
  if (/huisarts|arts|dokter|doctor|gezondheidscentrum|artsenpraktijk|therapist|psycholog|mental/.test(text)) {
    return {
      sectorId: 'MEDICAL',
      name: 'Huisartsenpraktijken & Medische Zorg',
      ticketAvgEur: 95,
      treatmentType: 'Spreekuur & consultatie op afspraak'
    };
  }
  if (/kapper|hairdresser|barbier|hairstudio|spa|wellness|sauna|massage/.test(text)) {
    return {
      sectorId: 'SALON_SPA',
      name: 'Luxe Kapsalons, Spa & Wellness Boutiques',
      ticketAvgEur: 110,
      treatmentType: 'Styling, wellness arrangement & behandelingen'
    };
  }
  if (/hotel|guest_house|pension|b&b|hostel|resort/.test(text)) {
    return {
      sectorId: 'HOSPITALITY',
      name: 'Boutique Hotels & Directe Reserveringen',
      ticketAvgEur: 195,
      treatmentType: 'Directe overnachtingsboeking zonder 18% commissie'
    };
  }
  return {
    sectorId: 'SPECIALTY_CARE',
    name: 'Specialistische Zorg & Optometrie',
    ticketAvgEur: 120,
    treatmentType: 'Oogmeting & specialistisch advies op afspraak'
  };
}

function formatPhone(rawPhone, city) {
  if (!rawPhone) return null;
  let p = rawPhone.trim().replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (['Arnhem', 'Nijmegen', 'Wageningen', 'Ede'].includes(city)) {
    if (p.startsWith('0')) p = '+31 ' + p.slice(1);
    else if (!p.startsWith('+31') && !p.startsWith('+')) p = '+31 ' + p;
  }
  if (['Kleve', 'Emmerich am Rhein', 'Goch'].includes(city)) {
    if (p.startsWith('0')) p = '+49 ' + p.slice(1);
    else if (!p.startsWith('+49') && !p.startsWith('+')) p = '+49 ' + p;
  }
  return p;
}

const raw = JSON.parse(fs.readFileSync('data/raw_appointment_leads_osm.json', 'utf8'));
const leadsMap = new Map();

const cityMeta = {
  Arnhem: { region: 'Gelderland', country: 'Nederland', lat: 51.9851, lon: 5.8987 },
  Nijmegen: { region: 'Gelderland', country: 'Nederland', lat: 51.8426, lon: 5.8637 },
  Wageningen: { region: 'Gelderland', country: 'Nederland', lat: 51.9692, lon: 5.6654 },
  Ede: { region: 'Gelderland', country: 'Nederland', lat: 52.0442, lon: 5.6706 },
  Kleve: { region: 'Nordrhein-Westfalen', country: 'Duitsland', lat: 51.7889, lon: 6.1389 },
  'Emmerich am Rhein': { region: 'Nordrhein-Westfalen', country: 'Duitsland', lat: 51.8319, lon: 6.2464 }
};

for (const [cityName, items] of Object.entries(raw)) {
  const meta = cityMeta[cityName] || { region: 'Regio', country: 'Nederland', lat: 52.0, lon: 5.9 };
  for (const item of items) {
    const tags = item.tags || {};
    if (tags.place) continue;
    if (!tags.name) continue;

    const domain = cleanDomain(tags.website);
    if (!domain) continue;

    if (leadsMap.has(domain)) continue;

    const sector = classifyAppointmentSector(tags, tags.name);
    const streetParts = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean);
    let address = streetParts.join(' ');
    if (tags['addr:postcode']) {
      address = address ? `${address}, ${tags['addr:postcode']} ${cityName}` : `${tags['addr:postcode']} ${cityName}`;
    } else {
      address = address ? `${address}, ${cityName}` : `${cityName} Centrum`;
    }

    const phone = formatPhone(tags['contact:phone'] || tags.phone, cityName);
    const email = tags.email || null;
    const lat = item.lat || item.center?.lat || meta.lat;
    const lon = item.lon || item.center?.lon || meta.lon;

    const countryCode = meta.country === 'Duitsland' ? 'de' : 'nl';
    const companyId = `book-${countryCode}-${slugify(cityName)}-${slugify(tags.name)}`;

    leadsMap.set(domain, {
      company_id: companyId,
      business_name: tags.name,
      domain: domain,
      website: tags.website.startsWith('http') ? tags.website : `https://${tags.website}`,
      address: address,
      city: cityName,
      region: meta.region,
      country: meta.country,
      sector_id: sector.sectorId,
      sector_name: sector.name,
      avg_ticket_eur: sector.ticketAvgEur,
      treatment_type: sector.treatmentType,
      phone_public: phone,
      public_contact: email,
      latitude: lat,
      longitude: lon,
      source: 'OSM_Appointment_Registry'
    });
  }
}

const allAppointmentLeads = Array.from(leadsMap.values());
console.log(`\nTotal Valid Appointment Leads: ${allAppointmentLeads.length}`);

// Breakdown by City
const cityCounts = {};
for (const b of allAppointmentLeads) cityCounts[b.city] = (cityCounts[b.city] || 0) + 1;
console.log('Breakdown by City:', cityCounts);

// Breakdown by Sector
const sectorCounts = {};
for (const b of allAppointmentLeads) sectorCounts[b.sector_name] = (sectorCounts[b.sector_name] || 0) + 1;
console.log('\nBreakdown by Sector:', sectorCounts);

const phoneCount = allAppointmentLeads.filter(b => b.phone_public).length;
console.log(`Leads with verified phone numbers: ${phoneCount} (${Math.round((phoneCount / allAppointmentLeads.length) * 100)}%)`);

fs.writeFileSync('data/canonical_appointment_leads.json', JSON.stringify(allAppointmentLeads, null, 2));
console.log('Saved to data/canonical_appointment_leads.json');
