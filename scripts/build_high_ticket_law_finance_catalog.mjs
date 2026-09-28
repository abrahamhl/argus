import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function classifyHighTicketSector(tags, name) {
  const text = `${tags.office || ''} ${tags.amenity || ''} ${tags.tourism || ''} ${tags.shop || ''} ${name || ''}`.toLowerCase();

  if (/advocaat|advocaten|lawyer|attorney|juridisch|rechtsbijstand|pleiter|advocatuur/.test(text)) {
    return {
      sectorId: 'LEGAL',
      sectorName: 'Advocatenkantoren & Juridische Zaken',
      avgTicketEur: 2400,
      annualRevenueEstimate: '€ 1.2M - € 6.5M',
      clientCapacity: 'Zeer hoog (uurtarief € 220 - € 450/uur)',
      primaryPain: 'DMARC e-maillek (offertes/contracten in spam), AVG cookie-aansprakelijkheid en hopeloos verouderde websites uit 2015.'
    };
  }

  if (/notaris|notariskantoor|notarieel|notary|estate|boedel/.test(text)) {
    return {
      sectorId: 'NOTARY',
      sectorName: 'Notariskantoren & Estate Planning',
      avgTicketEur: 1800,
      annualRevenueEstimate: '€ 1.5M - € 8M',
      clientCapacity: 'Zeer vermogend (vaste aktetarieven € 900 - € 3.500)',
      primaryPain: 'Strikte geheimhoudingsplicht: ontbrekende DMARC leidt tot risico op factuurfraude en AP-berispingen.'
    };
  }

  if (/accountant|belasting|tax|fiscalist|boekhoud|financieel|administratiekantoor|vermogen|estate|wealth/.test(text)) {
    return {
      sectorId: 'TAX_FINANCE',
      sectorName: 'Belastingadviseurs, Accountants & Vermogensbeheer',
      avgTicketEur: 1500,
      annualRevenueEstimate: '€ 800K - € 4.5M',
      clientCapacity: 'Hoog (zakelijke retainers € 300 - € 1.500/mnd per cliënt)',
      primaryPain: 'Klantcommunicatie met gevoelige fiscale data; geen digitaal intake-portaal.'
    };
  }

  if (/makelaar|vastgoed|renting|lease|leasing|hypotheek|invest|onroerend|real_estate/.test(text)) {
    return {
      sectorId: 'LEASING_REAL_ESTATE',
      sectorName: 'Vastgoed, Makelaars, Renting & Hypotheken',
      avgTicketEur: 3200,
      annualRevenueEstimate: '€ 1.0M - € 5.0M',
      clientCapacity: 'Zeer hoog (courtages 1.2% - 1.8% van koopsommen € 400K+)',
      primaryPain: 'Lage mobiele conversie; bezichtigingsaanvragen gaan via omslachtige e-mails in plaats van directe agenda.'
    };
  }

  if (/tandarts|dentist|mondzorg|ortho|dental|implant|implantolog|tandheel/.test(text)) {
    return {
      sectorId: 'DENTAL_SURGERY',
      sectorName: 'Tandartsen, Implantologie & Orthodontie',
      avgTicketEur: 350,
      annualRevenueEstimate: '€ 600K - € 2.8M',
      clientCapacity: 'Hoog (particuliere en verzekerde behandelingen € 150 - € 3.000)',
      primaryPain: 'Geen online patiëntenagenda; receptie overbelast met telefoontjes tijdens behandelingen.'
    };
  }

  if (/hotel|landgoed|kasteel|boutique|resort|wellness|b&b|pension/.test(text)) {
    return {
      sectorId: 'LUXURY_HOTEL',
      sectorName: 'Boetiekhotels, Landgoederen & Luxe Gastvrijheid',
      avgTicketEur: 280,
      annualRevenueEstimate: '€ 900K - € 7.5M',
      clientCapacity: 'Zeer hoog (kamerprijzen € 140 - € 450 per nacht)',
      primaryPain: 'Verlies van 18% tot 22% commissie per overnachting aan Booking.com door ontbreken van een moderne directe boekingsengine.'
    };
  }

  return {
    sectorId: 'CORPORATE_SERVICES',
    name: 'Zakelijke Dienstverlening & Zorg',
    avgTicketEur: 850,
    annualRevenueEstimate: '€ 500K - € 2.0M',
    clientCapacity: 'Midden tot hoog',
    primaryPain: 'Verouderde webtechnologie en ontbrekende e-mailauthenticatie.'
  };
}

function formatPhone(rawPhone, city) {
  if (!rawPhone) return null;
  let p = rawPhone.trim().replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (p.startsWith('0')) p = '+31 ' + p.slice(1);
  else if (!p.startsWith('+31') && !p.startsWith('+')) p = '+31 ' + p;
  return p;
}

async function auditDomain(domain) {
  const res = {
    resolved: false,
    ip: null,
    spf: null,
    dmarc: null,
    tlsValid: false,
    tlsDays: null,
    reachable: false,
    statusCode: null,
    hsts: false,
    hasViewport: false,
    hasPhoneLink: false,
    hasOnlineIntake: false,
    preConsentRisk: false,
    html: ''
  };

  try {
    const a = await dns.resolve4(domain).catch(() => []);
    if (a.length > 0) { res.resolved = true; res.ip = a[0]; }
  } catch {}

  try {
    const txt = await dns.resolveTxt(domain).catch(() => []);
    const flat = txt.map(r => r.join(''));
    res.spf = flat.find(t => t.startsWith('v=spf1')) || null;
  } catch {}

  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flat = dmarcTxt.map(r => r.join(''));
    res.dmarc = flat.find(t => t.startsWith('v=DMARC1')) || null;
  } catch {}

  await new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 3000,
      rejectUnauthorized: false
    }, () => {
      try {
        const cert = socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          res.tlsValid = socket.authorized;
          const exp = new Date(cert.valid_to).getTime();
          res.tlsDays = Math.round((exp - Date.now()) / (1000 * 60 * 60 * 24));
        }
      } catch {}
      socket.destroy();
      resolve();
    });
    socket.on('error', () => { socket.destroy(); resolve(); });
    socket.on('timeout', () => { socket.destroy(); resolve(); });
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(`https://${domain}`, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/128.0)'
      }
    });
    clearTimeout(timeout);
    res.reachable = true;
    res.statusCode = resp.status;
    res.hsts = resp.headers.has('strict-transport-security');
    const html = await resp.text();
    res.html = html;

    res.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    res.hasPhoneLink = /href=["']tel:[^"']+["']/i.test(html);

    if (/cal\.com|calendly|salonized|treatwell|doctolib|simplybook|timify|supersaas|afspraak|intake|reserveren|direct-boeken/i.test(html)) {
      res.hasOnlineIntake = true;
    }

    if (/google-analytics|googletagmanager|connect\.facebook\.net/i.test(html) && !/cookiebot|complianz|onetrust|usercentrics/i.test(html)) {
      res.preConsentRisk = true;
    }
  } catch {}

  return res;
}

export async function processHighTicketCatalog() {
  console.log(`\n======================================================`);
  console.log(`💎 BUILDING HIGH-TICKET CORRIDOR: ARNHEM & NIJMEGEN`);
  console.log(`======================================================\n`);

  const seenDomains = new Set();
  const rawLeads = [];

  // 1. Ingest newly fetched high ticket data
  const rawHighTicketFile = path.join(ROOT_DIR, 'data', 'raw_arnhem_nijmegen_high_ticket.json');
  if (fs.existsSync(rawHighTicketFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(rawHighTicketFile, 'utf8'));
      for (const [area, elems] of Object.entries(data)) {
        if (!Array.isArray(elems)) continue;
        const defaultCity = area.includes('Nijmegen') || area.includes('Wijchen') || area.includes('Berg en Dal') ? 'Nijmegen' : 'Arnhem';
        for (const el of elems) {
          const tags = el.tags || {};
          const name = tags.name || tags.brand || tags.operator;
          if (!name) continue;
          const website = tags.website || tags['contact:website'] || tags.url;
          const domain = cleanDomain(website);
          if (!domain || seenDomains.has(domain)) continue;
          seenDomains.add(domain);

          const city = tags['addr:city'] || defaultCity;
          const street = tags['addr:street'] || '';
          const number = tags['addr:housenumber'] || '';
          const postcode = tags['addr:postcode'] || '';
          const address = [street, number, postcode, city].filter(Boolean).join(' ') || `${city}, Gelderland`;

          const phone = formatPhone(tags.phone || tags['contact:phone'] || tags['phone:mobile'], city);
          const sector = classifyHighTicketSector(tags, name);

          rawLeads.push({
            business_name: name,
            domain: domain,
            website: website.startsWith('http') ? website : `https://${domain}`,
            address: address,
            street_address: [street, number].filter(Boolean).join(' ') || 'Centrum',
            city: city,
            region: 'Gelderland',
            country: 'NL',
            sector_id: sector.sectorId,
            sector_name: sector.sectorName || 'Zakelijk',
            avg_ticket_eur: sector.avgTicketEur,
            annual_rev_est: sector.annualRevenueEstimate,
            capacity: sector.clientCapacity,
            phone_public: phone,
            latitude: el.lat || el.center?.lat || null,
            longitude: el.lon || el.center?.lon || null
          });
        }
      }
    } catch (err) {
      console.warn('Error reading raw high ticket file:', err.message);
    }
  }

  // 2. Ingest existing high-ticket businesses from master catalog in Arnhem and Nijmegen
  const existingMaster = path.join(ROOT_DIR, 'data', 'canonical_expanded_all_leads.json');
  if (fs.existsSync(existingMaster)) {
    try {
      const existing = JSON.parse(fs.readFileSync(existingMaster, 'utf8'));
      const targetCities = ['Arnhem', 'Nijmegen', 'Velp', 'Oosterbeek', 'Elst', 'Wijchen', 'Rheden'];
      for (const item of existing) {
        if (!targetCities.includes(item.city)) continue;
        const domain = cleanDomain(item.domain || item.website);
        if (!domain || seenDomains.has(domain)) continue;

        const isHighTicket = ['LEGAL_TAX', 'DENTAL', 'HOSPITALITY', 'AESTHETICS'].includes(item.sector_id) ||
          /advocaat|notaris|notar|tandarts|hotel|landgoed|makelaar|accountant/i.test(item.business_name);

        if (!isHighTicket) continue;
        seenDomains.add(domain);

        const sector = classifyHighTicketSector({}, item.business_name);
        rawLeads.push({
          business_name: item.business_name,
          domain: domain,
          website: item.website || `https://${domain}`,
          address: item.address,
          street_address: item.address ? item.address.split(',')[0] : 'Centrum',
          city: item.city,
          region: 'Gelderland',
          country: 'NL',
          sector_id: sector.sectorId,
          sector_name: sector.sectorName || item.sector_name,
          avg_ticket_eur: sector.avgTicketEur,
          annual_rev_est: sector.annualRevenueEstimate,
          capacity: sector.clientCapacity,
          phone_public: item.phone_public,
          latitude: item.latitude,
          longitude: item.longitude
        });
      }
    } catch {}
  }

  console.log(`Auditing and Packaging ${rawLeads.length} High-Ticket Corporate Leads...`);

  const auditedLeads = [];
  const CONCURRENCY = 10;

  for (let i = 0; i < rawLeads.length; i += CONCURRENCY) {
    const batch = rawLeads.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.all(batch.map(async (lead) => {
      const audit = await auditDomain(lead.domain);

      const redFlags = [];
      if (!audit.dmarc) {
        redFlags.push('Geen DMARC (zakelijke contracten/facturen landen in spam of kunnen gespooft worden)');
      }
      if (audit.preConsentRisk) {
        redFlags.push('Pre-consent tracking cookies (acute AP-boete en NOvA tuchtrecht aansprakelijkheid)');
      }
      if (!audit.hasOnlineIntake) {
        redFlags.push('Geen online intake/afspraakmodule (verlies van 65% avondbezoekers)');
      }
      if (!audit.tlsValid || (audit.tlsDays !== null && audit.tlsDays < 15)) {
        redFlags.push('SSL-certificaat ongeldig of verloopt binnenkort');
      }
      if (!audit.hasViewport) {
        redFlags.push('Verouderde desktop-only layout (onleesbaar op mobiele telefoons)');
      }

      const priority = redFlags.length > 0 ? 'RED' : 'ORANGE';

      // High-Ticket Commercial Pricing & Packaging
      let packName = 'Enterprise Web, Intake & Ciberbeveiliging Suite';
      let setupFee = 3850;
      let monthlyFee = 249;
      let abrahamFix = '';
      let debbiePitch = '';
      let roiPitch = '';

      if (lead.sector_id === 'LEGAL' || lead.sector_id === 'NOTARY') {
        packName = 'Confidential Legal Web & DMARC Defense Suite';
        setupFee = 4250;
        monthlyFee = 295;
        abrahamFix = 'Volledige Next.js / Tailwind herbouw met beveiligde cliënt-intake, DMARC/SPF hardening (bescherming tegen CEO- en declaratiespoofing) en AVG-compliant cookie management.';
        debbiePitch = `Goedendag! Mijn naam is Debbie. Wij hebben een beveiligingsaudit uitgevoerd op ${lead.domain}. Uw kantoor mist momenteel het DMARC-beveiligingsslot, waardoor declaraties en vertrouwelijke processtukken bij cliënten in de spambox belanden of misbruikt kunnen worden voor spoofing. Daarnaast mist de website een beveiligde intake-module voor nieuwe zakelijke cliënten.`;
        roiPitch = 'Met een gemiddeld uurtarief van € 250 - € 400 levert het winnen van slechts 2 nieuwe zakelijke dossiers per kwartaal al € 15.000+ extra honorarium op.';
      } else if (lead.sector_id === 'LUXURY_HOTEL') {
        packName = 'Direct Booking Suite (Ontwijkt 18-22% Booking.com Commissie)';
        setupFee = 3450;
        monthlyFee = 249;
        abrahamFix = 'Custom snelle boekingsengine geïntegreerd in de website met iDEAL/Creditcard, directe kamerselectie en geautomatiseerde welkomst-SMS.';
        debbiePitch = `Goedendag! Wij zien dat gasten van ${lead.business_name} voor directe reserveringen worden doorverwezen of moeten bellen. Hierdoor boekt ruim 70% via Booking.com, wat u 18% tot 22% commissie per overnachting kost.`;
        roiPitch = 'Bij 40 kamers en € 200 per nacht bespaart een toename van slechts 15 directe boekingen per maand ruim € 1.500 tot € 2.200 aan pure commissiekosten.';
      } else if (lead.sector_id === 'DENTAL_SURGERY') {
        packName = 'Patiënten-Intake & Implantologie Conversie Platform';
        setupFee = 2850;
        monthlyFee = 195;
        abrahamFix = 'Moderne mobiele praktijkwebsite met online afsprakenkalender, intakevragenlijst en SMS-herinneringen.';
        debbiePitch = `Goedendag! Uw praktijk ${lead.business_name} heeft een uitstekende reputatie, maar potentiële patiënten kunnen 's avonds geen afspraak inplannen. Meer dan 65% zoekt na 18:00 uur en boekt dan direct bij een praktijk die wél een online agenda heeft.`;
        roiPitch = 'Slechts 3 extra intake-gesprekken per week voor esthetische mondzorg of implantaten betekent al € 4.500 extra maandelijkse praktijkomzet.';
      } else {
        packName = 'High-Net Corporate Reputation & Security Suite';
        setupFee = 2950;
        monthlyFee = 195;
        abrahamFix = 'Moderne Next.js landingspagina, DMARC-beveiliging en interactieve afsprakenmodule.';
        debbiePitch = `Goedendag! Wij zien dat ${lead.business_name} potentiële vermogende cliënten verliest door een verouderde mobiele weergave en ontbrekende e-mailauthenticatie.`;
        roiPitch = 'Eén enkele extra transactie of adviesopdracht dekt de complete investering direct meervoudig af.';
      }

      const debbieSetup = Math.round(setupFee * 0.1 * 100) / 100;
      const abrahamSetup = Math.round(setupFee * 0.9 * 100) / 100;
      const debbieMonthly = Math.round(monthlyFee * 0.1 * 100) / 100;
      const abrahamMonthly = Math.round(monthlyFee * 0.9 * 100) / 100;

      return {
        ...lead,
        priority: priority,
        redFlags: redFlags,
        audit: {
          dns: { resolved: audit.resolved, ip: audit.ip, spf: audit.spf, dmarc: audit.dmarc },
          tls: { valid: audit.tlsValid, days: audit.tlsDays },
          http: { reachable: audit.reachable, hsts: audit.hsts, status: audit.statusCode },
          booking: { hasOnlineIntake: audit.hasOnlineIntake, hasPhoneLink: audit.hasPhoneLink, hasViewport: audit.hasViewport },
          privacy: { preConsentRisk: audit.preConsentRisk }
        },
        opportunity: {
          packageName: packName,
          setupFeeEur: setupFee,
          debbieSetupCashEur: debbieSetup,
          abrahamSetupTechEur: abrahamSetup,
          monthlyRetainerEur: monthlyFee,
          debbieMonthlyCashEur: debbieMonthly,
          abrahamMonthlyTechEur: abrahamMonthly,
          debbiePitchNL: debbiePitch,
          businessRoiPitchNL: roiPitch,
          abrahamTechFix: abrahamFix
        }
      };
    }));

    auditedLeads.push(...batchRes);
    console.log(`Processed ${auditedLeads.length}/${rawLeads.length} leads...`);
    await sleep(200);
  }

  // Sort by priority RED, then sector
  auditedLeads.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'RED' ? -1 : 1;
    return (b.opportunity?.setupFeeEur || 0) - (a.opportunity?.setupFeeEur || 0);
  });

  // Save JSON
  const jsonPath = path.join(ROOT_DIR, 'data', 'arnhem_nijmegen_high_ticket_audited.json');
  fs.writeFileSync(jsonPath, JSON.stringify(auditedLeads, null, 2));
  console.log(`\n✅ Saved audited high-ticket JSON to ${jsonPath}`);

  return auditedLeads;
}

async function main() {
  await processHighTicketCatalog();
}

main().catch(console.error);
