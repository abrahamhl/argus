import fs from 'node:fs';
import path from 'node:path';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function cleanDomain(urlOrDomain) {
  if (!urlOrDomain) return null;
  let d = urlOrDomain.trim().toLowerCase();
  if (d.startsWith('http://') || d.startsWith('https://')) {
    try {
      d = new URL(d).hostname;
    } catch {
      d = d.replace(/^https?:\/\//, '').split('/')[0];
    }
  } else {
    d = d.split('/')[0];
  }
  return d.replace(/^www\./, '').trim();
}

// 1. Load OSM businesses
const osmPath = path.resolve('osm_arnhem_clean.json');
let osmList = [];
if (fs.existsSync(osmPath)) {
  osmList = JSON.parse(fs.readFileSync(osmPath, 'utf8'));
}

// 2. Load Arnhem50 businesses
const arnhem50Path = 'c:/dev/recruiter-evidence/arnhem-biz-radar/data/arnhem50.js';
let arnhem50List = [];
if (fs.existsSync(arnhem50Path)) {
  const content = fs.readFileSync(arnhem50Path, 'utf8');
  const match = content.match(/const ARNHEM_BUSINESSES = (\[[\s\S]*?\]);/);
  if (match) {
    arnhem50List = JSON.parse(match[1]);
  }
}

console.log(`Loaded ${osmList.length} OSM businesses and ${arnhem50List.length} Arnhem50 businesses.`);

const canonicalMap = new Map();

// Helper to assign cohort
function assignCohort(categoryStr, sectorStr) {
  const text = `${categoryStr || ''} ${sectorStr || ''}`.toLowerCase();
  if (/horeca|restaurant|cafe|bar|pub|eten|bistro|grand caf|koffiehuis|pizzeria|tapas/.test(text)) {
    return { id: 2, name: 'Horeca & Gastvrijheid' };
  }
  if (/advocat|juridisch|notaris|arbeidsrecht|legal|letselschade|maatschap/.test(text)) {
    return { id: 3, name: 'Juridische Dienstverlening' };
  }
  if (/zorg|kliniek|tandarts|fysio|oogheelk|mondzorg|psycholog|esthetiek|podotherap|dierenkliniek|arts/.test(text)) {
    return { id: 4, name: 'Gezondheidszorg & Welzijn' };
  }
  if (/administratie|fiscaal|boekhoud|accountant|tax|salaris|cijfers|makelaar|vastgoed|consulting/.test(text)) {
    return { id: 5, name: 'Financieel, Fiscaal & Zakelijk' };
  }
  return { id: 1, name: 'Winkels & Detailhandel' };
}

// Map any cohort name to canonical 5
const STANDARD_COHORTS = {
  1: 'Winkels & Detailhandel',
  2: 'Horeca & Gastvrijheid',
  3: 'Juridische Dienstverlening',
  4: 'Gezondheidszorg & Welzijn',
  5: 'Financieel, Fiscaal & Zakelijk'
};

// Ingest Arnhem50 entries first
for (const b of arnhem50List) {
  const domain = cleanDomain(b.website);
  if (!domain) continue;

  const cohortId = b.cohort || assignCohort(b.sector, b.name).id;
  const cohortName = STANDARD_COHORTS[cohortId];
  const slug = `arnhem-${slugify(b.name)}`;

  canonicalMap.set(domain, {
    company_id: slug,
    business_name: b.name,
    domain: domain,
    website: `https://${domain}`,
    address: b.address || 'Arnhem Centrum',
    city: 'Arnhem',
    cohort_id: cohortId,
    category: cohortName,
    phone_public: b.phone || null,
    public_contact: b.email || null,
    source: 'ArnhemBizRadar',
    latitude: 51.9851,
    longitude: 5.8987,
    last_checked: new Date().toISOString()
  });
}

// Ingest OSM entries (enrich or add)
for (const b of osmList) {
  const domain = cleanDomain(b.domain || b.website);
  if (!domain) continue;

  const cohort = assignCohort(b.category, b.name);
  const slug = `arnhem-${slugify(b.name)}`;

  if (canonicalMap.has(domain)) {
    // Enrich with verified physical address & coordinates
    const existing = canonicalMap.get(domain);
    if (b.street && b.street.trim()) existing.address = b.street.trim() + ', Arnhem';
    if (b.phone && !existing.phone_public) existing.phone_public = b.phone;
    if (b.email && !existing.public_contact) existing.public_contact = b.email;
    existing.latitude = b.lat || existing.latitude;
    existing.longitude = b.lon || existing.longitude;
    existing.source = 'OSM_Verified_Merge';
  } else {
    canonicalMap.set(domain, {
      company_id: slug,
      business_name: b.name,
      domain: domain,
      website: `https://${domain}`,
      address: (b.street && b.street.trim()) ? `${b.street.trim()}, Arnhem` : 'Arnhem, Gelderland',
      city: b.city || 'Arnhem',
      cohort_id: cohort.id,
      category: cohort.name,
      phone_public: b.phone || null,
      public_contact: b.email || null,
      source: 'OSM_Arnhem_Registry',
      latitude: b.lat || 51.9851,
      longitude: b.lon || 5.8987,
      last_checked: new Date().toISOString()
    });
  }
}

// Ensure unique IDs
const finalBusinesses = [];
const seenIds = new Set();

for (const b of canonicalMap.values()) {
  let uniqueId = b.company_id;
  let counter = 2;
  while (seenIds.has(uniqueId)) {
    uniqueId = `${b.company_id}-${counter++}`;
  }
  seenIds.add(uniqueId);
  b.company_id = uniqueId;
  finalBusinesses.push(b);
}

// Sort by cohort, then name
finalBusinesses.sort((a, b) => a.cohort_id - b.cohort_id || a.business_name.localeCompare(b.business_name));

const outDir = path.resolve('data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'canonical_arnhem_businesses.json');
fs.writeFileSync(outFile, JSON.stringify(finalBusinesses, null, 2));

console.log(`Saved ${finalBusinesses.length} canonical Arnhem businesses to data/canonical_arnhem_businesses.json`);

// Summary by cohort
const cohortCounts = {};
finalBusinesses.forEach(b => {
  cohortCounts[b.category] = (cohortCounts[b.category] || 0) + 1;
});
console.log('Cohort breakdown:', cohortCounts);
