import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('data/raw_regional_osm.json', 'utf8'));

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
  // Filter out social networks or generic platforms
  if (/facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|google\.com|wikipedia\.org|wikidata\.org/.test(d)) {
    return null;
  }
  return d;
}

function assignCategory(tags) {
  const text = `${tags.amenity || ''} ${tags.shop || ''} ${tags.office || ''} ${tags.craft || ''} ${tags.healthcare || ''} ${tags.tourism || ''} ${tags.name || ''}`.toLowerCase();
  if (/restaurant|cafe|bar|pub|bistro|hotel|motel|eetcafe|gaststätte|brauhaus|konditorei|bäckerei|bakery|fast_food|pizzeria/.test(text)) {
    return 'Horeca & Gastvrijheid';
  }
  if (/lawyer|advocaat|notar|rechtsanwalt|juridisch|steuerberater|tax|consulting/.test(text)) {
    return 'Juridische & Zakelijke Dienstverlening';
  }
  if (/doctor|dentist|tandarts|apotheke|pharmacy|optician|optometrist|fysio|hospital|krankenhaus|klinik|care|therapist|zorg/.test(text)) {
    return 'Gezondheidszorg & Welzijn';
  }
  if (/accountant|bank|insurance|makelaar|immobilien|finan|estate_agent/.test(text)) {
    return 'Financieel & Vastgoed';
  }
  return 'Winkels & Lokale Handel';
}

for (const [cityKey, items] of Object.entries(raw)) {
  const valid = [];
  for (const item of items) {
    const tags = item.tags || {};
    if (tags.place === 'town' || tags.place === 'village' || tags.place === 'city' || tags.place === 'suburb') continue;
    const domain = cleanDomain(tags.website);
    if (!domain) continue;

    const phone = tags['contact:phone'] || tags.phone || null;
    const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || tags['addr:postcode'] || null;

    valid.push({
      name: tags.name,
      domain,
      website: tags.website,
      city: cityKey,
      street,
      phone,
      category: assignCategory(tags),
      lat: item.lat || item.center?.lat,
      lon: item.lon || item.center?.lon
    });
  }
  console.log(`City: ${cityKey} -> Valid businesses: ${valid.length} (with phone: ${valid.filter(x => x.phone).length})`);
}
