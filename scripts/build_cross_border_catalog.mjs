import fs from 'node:fs';
import path from 'node:path';

function slugify(text) {
  return (text || 'biz')
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
  // Filter out social networks or generic platforms
  if (/facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|google\.com|wikipedia\.org|wikidata\.org|tiktok\.com|pinterest\.com/.test(d)) {
    return null;
  }
  return d;
}

function assignCohort(tags, name) {
  const text = `${tags.amenity || ''} ${tags.shop || ''} ${tags.office || ''} ${tags.craft || ''} ${tags.healthcare || ''} ${tags.tourism || ''} ${name || ''}`.toLowerCase();
  if (/restaurant|cafe|bar|pub|bistro|hotel|motel|eetcafe|gaststätte|brauhaus|konditorei|bäckerei|bakery|fast_food|pizzeria|food|eten|lunch/.test(text)) {
    return { id: 2, name: 'Horeca & Gastvrijheid' };
  }
  if (/lawyer|advocaat|notar|rechtsanwalt|juridisch|steuerberater|tax|consulting|arbeidsrecht|legal|letselschade|maatschap/.test(text)) {
    return { id: 3, name: 'Juridische Dienstverlening' };
  }
  if (/doctor|dentist|tandarts|apotheke|pharmacy|optician|optometrist|fysio|hospital|krankenhaus|klinik|care|therapist|zorg|oogheelk|mondzorg|psycholog|esthetiek|podotherap|dierenkliniek|arts/.test(text)) {
    return { id: 4, name: 'Gezondheidszorg & Welzijn' };
  }
  if (/accountant|bank|insurance|makelaar|immobilien|finan|estate_agent|administratie|fiscaal|boekhoud|salaris|cijfers|vastgoed/.test(text)) {
    return { id: 5, name: 'Financieel, Fiscaal & Zakelijk' };
  }
  return { id: 1, name: 'Winkels & Detailhandel' };
}

function formatPhone(rawPhone, city) {
  if (!rawPhone) return null;
  let p = rawPhone.trim().replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();
  if (p.startsWith('00')) p = '+' + p.slice(2);
  
  // Format Dutch numbers
  if (city === 'Arnhem' || city === 'Nijmegen' || city === 'Wageningen') {
    if (p.startsWith('0')) {
      p = '+31 ' + p.slice(1);
    } else if (!p.startsWith('+31') && !p.startsWith('+')) {
      p = '+31 ' + p;
    }
  }
  // Format German numbers
  if (city === 'Kleve' || city === 'Emmerich am Rhein' || city === 'Goch') {
    if (p.startsWith('0')) {
      p = '+49 ' + p.slice(1);
    } else if (!p.startsWith('+49') && !p.startsWith('+')) {
      p = '+49 ' + p;
    }
  }
  return p;
}

function main() {
  const canonicalMap = new Map();

  // 1. Load existing Arnhem canonical businesses
  const arnhemPath = path.resolve('data/canonical_arnhem_businesses.json');
  if (fs.existsSync(arnhemPath)) {
    const arnhemList = JSON.parse(fs.readFileSync(arnhemPath, 'utf8'));
    console.log(`Loaded ${arnhemList.length} canonical Arnhem businesses.`);
    for (const b of arnhemList) {
      if (!b.domain) continue;
      canonicalMap.set(b.domain, {
        company_id: b.company_id || `arnhem-${slugify(b.business_name)}`,
        business_name: b.business_name,
        domain: b.domain,
        website: b.website || `https://${b.domain}`,
        address: b.address || 'Arnhem Centrum',
        city: 'Arnhem',
        region: 'Gelderland',
        country: 'Nederland',
        cohort_id: b.cohort_id || 1,
        category: b.category || 'Winkels & Detailhandel',
        phone_public: b.phone_public || null,
        public_contact: b.public_contact || null,
        source: b.source || 'Arnhem_Canonical',
        latitude: b.latitude || 51.9851,
        longitude: b.longitude || 5.8987,
        last_checked: new Date().toISOString()
      });
    }
  }

  // 2. Load raw regional OSM
  const rawRegionalPath = path.resolve('data/raw_regional_osm.json');
  if (fs.existsSync(rawRegionalPath)) {
    const rawRegional = JSON.parse(fs.readFileSync(rawRegionalPath, 'utf8'));

    const cityMeta = {
      nijmegen: { name: 'Nijmegen', region: 'Gelderland', country: 'Nederland', defaultLat: 51.8426, defaultLon: 5.8637 },
      wageningen: { name: 'Wageningen', region: 'Gelderland', country: 'Nederland', defaultLat: 51.9692, defaultLon: 5.6654 },
      kleve: { name: 'Kleve', region: 'Nordrhein-Westfalen', country: 'Duitsland', defaultLat: 51.7889, defaultLon: 6.1389 },
      emmerich: { name: 'Emmerich am Rhein', region: 'Nordrhein-Westfalen', country: 'Duitsland', defaultLat: 51.8319, defaultLon: 6.2464 }
    };

    for (const [key, elements] of Object.entries(rawRegional)) {
      const meta = cityMeta[key] || { name: key, region: 'Regio', country: 'Nederland', defaultLat: 51.9, defaultLon: 6.0 };
      let addedForCity = 0;

      for (const item of elements) {
        const tags = item.tags || {};
        if (tags.place === 'town' || tags.place === 'village' || tags.place === 'city' || tags.place === 'suburb') continue;
        if (!tags.name) continue;

        const domain = cleanDomain(tags.website);
        if (!domain) continue;

        if (canonicalMap.has(domain)) {
          // If already in map, enrich phone or contact if missing
          const existing = canonicalMap.get(domain);
          if (!existing.phone_public && (tags['contact:phone'] || tags.phone)) {
            existing.phone_public = formatPhone(tags['contact:phone'] || tags.phone, meta.name);
          }
          if (!existing.public_contact && tags.email) {
            existing.public_contact = tags.email;
          }
          continue;
        }

        const cohort = assignCohort(tags, tags.name);
        const streetParts = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean);
        let address = streetParts.join(' ');
        if (tags['addr:postcode']) {
          address = address ? `${address}, ${tags['addr:postcode']} ${meta.name}` : `${tags['addr:postcode']} ${meta.name}`;
        } else {
          address = address ? `${address}, ${meta.name}` : `${meta.name} Centrum`;
        }

        const phone = formatPhone(tags['contact:phone'] || tags.phone, meta.name);
        const email = tags.email || null;
        const lat = item.lat || item.center?.lat || meta.defaultLat;
        const lon = item.lon || item.center?.lon || meta.defaultLon;

        const slugPrefix = meta.country === 'Duitsland' ? `nrw-${slugify(meta.name)}` : slugify(meta.name);
        const companyId = `${slugPrefix}-${slugify(tags.name)}`;

        canonicalMap.set(domain, {
          company_id: companyId,
          business_name: tags.name,
          domain: domain,
          website: tags.website.startsWith('http') ? tags.website : `https://${tags.website}`,
          address: address,
          city: meta.name,
          region: meta.region,
          country: meta.country,
          cohort_id: cohort.id,
          category: cohort.name,
          phone_public: phone,
          public_contact: email,
          source: `OSM_${meta.name}_Registry`,
          latitude: lat,
          longitude: lon,
          last_checked: new Date().toISOString()
        });

        addedForCity++;
      }
      console.log(`Added ${addedForCity} businesses for ${meta.name} (${meta.country}).`);
    }
  }

  const allBusinesses = Array.from(canonicalMap.values());
  console.log(`\nTotal Cross-Border Canonical Businesses: ${allBusinesses.length}`);

  // Summary by city
  const cityCounts = {};
  for (const b of allBusinesses) {
    cityCounts[b.city] = (cityCounts[b.city] || 0) + 1;
  }
  console.log('Breakdown by City:', cityCounts);

  // Summary by cohort
  const cohortCounts = {};
  for (const b of allBusinesses) {
    cohortCounts[b.category] = (cohortCounts[b.category] || 0) + 1;
  }
  console.log('Breakdown by Category:', cohortCounts);

  const phoneCount = allBusinesses.filter(b => b.phone_public).length;
  console.log(`Businesses with verified phone numbers: ${phoneCount} (${Math.round((phoneCount / allBusinesses.length) * 100)}%)`);

  fs.writeFileSync('data/canonical_cross_border_businesses.json', JSON.stringify(allBusinesses, null, 2));
  console.log('Saved to data/canonical_cross_border_businesses.json');
}

main();
