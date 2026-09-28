import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function auditSingleLead(lead) {
  const domain = lead.domain;
  const isDE = lead.country === 'DE';
  const auditTime = new Date().toISOString();

  const res = {
    ...lead,
    auditTimestamp: auditTime,
    priority: 'GREEN',
    redFlags: [],
    dns: { resolved: false, ip: null, spf: null, dmarc: null },
    tls: { authorized: false, validTo: null, daysRemaining: null },
    http: { reachable: false, statusCode: null, hsts: false, server: null },
    booking: {
      hasOnlineBooking: false,
      detectedEngine: null,
      hasPhoneLink: false,
      hasEmailLink: false,
      brokenMobileAction: false,
      hasViewport: false
    },
    privacy: { preConsentRisk: false, trackers: [] },
    opportunity: {
      packageRecommended: '',
      setupFeeEur: 0,
      abrahamSetupEur: 0,
      debbieSetupEur: 0,
      monthlyRetainerEur: 149,
      abrahamMonthlyEur: 134.10,
      debbieMonthlyEur: 14.90,
      commissionPct: 15,
      commissionPerBookingEur: 0,
      estMonthlyBookings: 20,
      estMonthlyCommissionEur: 0,
      estTotalMonthlyIncomeEur: 0,
      pitchScriptLocal: '',
      businessRoiPitchLocal: '',
      abrahamTechFix: ''
    }
  };

  // 1. DNS Resolution (A, SPF, DMARC)
  try {
    const a = await dns.resolve4(domain).catch(() => []);
    if (a.length > 0) {
      res.dns.resolved = true;
      res.dns.ip = a[0];
    }
  } catch {}

  try {
    const txt = await dns.resolveTxt(domain).catch(() => []);
    const flat = txt.map(r => r.join(''));
    const spf = flat.find(t => t.startsWith('v=spf1'));
    if (spf) res.dns.spf = spf;
  } catch {}

  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flat = dmarcTxt.map(r => r.join(''));
    const dmarc = flat.find(t => t.startsWith('v=DMARC1'));
    if (dmarc) res.dns.dmarc = dmarc;
  } catch {}

  // 2. TLS Check
  await new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 3500,
      rejectUnauthorized: false
    }, () => {
      try {
        const cert = socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          res.tls.authorized = socket.authorized;
          const exp = new Date(cert.valid_to).getTime();
          res.tls.daysRemaining = Math.round((exp - Date.now()) / (1000 * 60 * 60 * 24));
        }
      } catch {}
      socket.destroy();
      resolve();
    });
    socket.on('error', () => { socket.destroy(); resolve(); });
    socket.on('timeout', () => { socket.destroy(); resolve(); });
  });

  // 3. HTTP Fetch & HTML Analysis
  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(`https://${domain}`, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/128.0)'
      }
    });
    clearTimeout(timeout);

    res.http.reachable = true;
    res.http.statusCode = resp.status;
    res.http.hsts = resp.headers.has('strict-transport-security');
    res.http.server = resp.headers.get('server');

    html = await resp.text();
  } catch {}

  // 4. Booking & Conversion Inspection
  if (html) {
    res.booking.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    res.booking.hasPhoneLink = /href=["']tel:[^"']+["']/i.test(html);
    res.booking.hasEmailLink = /href=["']mailto:[^"']+["']/i.test(html);

    const bookingEngines = [
      { name: 'Salonized', regex: /salonized\.com|widget\.salonized/i },
      { name: 'Treatwell', regex: /treatwell\.nl|treatwell\.de|widget\.treatwell/i },
      { name: 'Doctolib', regex: /doctolib\./i },
      { name: 'Cal.com', regex: /cal\.com/i },
      { name: 'Calendly', regex: /calendly\.com/i },
      { name: 'Phorest', regex: /phorest\.com/i },
      { name: 'Fresha', regex: /fresha\.com/i },
      { name: 'SimplyBook', regex: /simplybook\.me/i },
      { name: 'Timify', regex: /timify\.com/i },
      { name: 'SuperSaaS', regex: /supersaas\.com/i },
      { name: 'Resengo', regex: /resengo\.com/i },
      { name: 'Formitable', regex: /formitable\.com/i },
      { name: 'Mews', regex: /mews\.li|mews\.com/i },
      { name: 'Cloudbeds', regex: /cloudbeds\.com/i },
      { name: 'Cubilis', regex: /cubilis\.com/i }
    ];

    for (const be of bookingEngines) {
      if (be.regex.test(html)) {
        res.booking.hasOnlineBooking = true;
        res.booking.detectedEngine = be.name;
        break;
      }
    }

    if (!res.booking.hasOnlineBooking && /online-afspraak|afspraak-maken|online-boeken|termin-buchen|online-termin|online-reservierung/i.test(html)) {
      res.booking.hasOnlineBooking = true;
      res.booking.detectedEngine = 'In-House Boekingsmodule';
    }

    res.booking.brokenMobileAction = !res.booking.hasPhoneLink && !res.booking.hasOnlineBooking;

    // Trackers vs Consent
    if (/google-analytics|googletagmanager|connect\.facebook\.net|gtag/i.test(html) && !/cookiebot|complianz|onetrust|usercentrics|borlabs|cookieyes/i.test(html)) {
      res.privacy.preConsentRisk = true;
    }
  }

  // 5. RED Flag Evaluation
  const redFlags = [];
  const orangeFlags = [];

  const appointmentSectors = ['DENTAL', 'AESTHETICS', 'HOSPITALITY', 'PHYSIO', 'MEDICAL', 'SALON_SPA', 'PRIVATE_WELLNESS_LOUNGE', 'SPECIALTY_CARE'];

  if (appointmentSectors.includes(res.sector_id) && !res.booking.hasOnlineBooking) {
    redFlags.push('Geen directe online boekingsagenda (klanten haken massaal af na 18:00)');
  }
  if (!res.dns.dmarc) {
    redFlags.push('DMARC record ontbreekt (bevestigingsmails en facturen belanden in SPAM)');
  }
  if (res.privacy.preConsentRisk) {
    redFlags.push('Tracking scripts actief vóór cookie-toestemming (AP/DSGVO boeterisico)');
  }
  if (!res.tls.authorized || (res.tls.daysRemaining !== null && res.tls.daysRemaining <= 14)) {
    redFlags.push('SSL-certificaat onveilig of verloopt binnenkort');
  }

  if (!res.http.hsts) {
    orangeFlags.push('Geen HSTS-header (beveiligingsdowngrade mogelijk)');
  }
  if (!res.booking.hasPhoneLink) {
    orangeFlags.push('Telefoonnummer niet direct klikbaar op smartphones');
  }
  if (!res.booking.hasViewport) {
    orangeFlags.push('Geen mobiele viewport (site schaalt slecht op mobiel)');
  }

  res.redFlags = redFlags;

  if (redFlags.length > 0) {
    res.priority = 'RED';
  } else if (orangeFlags.length > 0) {
    res.priority = 'ORANGE';
  } else {
    res.priority = 'GREEN';
  }

  // 6. Pricing, Commission & Pitch Generation
  const ticketEur = res.avg_ticket_eur || 160;
  const commissionPerBooking = Math.round(ticketEur * 0.15 * 100) / 100;
  const estBookings = res.sector_id === 'HOSPITALITY' ? 35 : (res.sector_id === 'AESTHETICS' ? 25 : 20);
  const estMonthlyCommission = Math.round(commissionPerBooking * estBookings);

  let setupFee = 895;
  let packName = '';
  let abrahamFix = '';
  let pitchScript = '';
  let roiPitch = '';

  if (res.priority === 'RED') {
    if (!res.booking.hasOnlineBooking && !res.dns.dmarc) {
      packName = isDE
        ? 'Premium Buchungs- & E-Mail-Sicherheits-Suite (Online-Termine + DMARC Schutz + SMS)'
        : 'Compleet Conversie- & Boekingsplatform (Agenda + E-mailslot + SMS)';
      setupFee = 1295;
      abrahamFix = 'Integratie van moderne responsive boekingsagenda (Cal.com / custom Next.js), DNS DMARC/SPF/DKIM hardening voor 100% inbox deliverability, en geautomatiseerde SMS-bevestigingen.';
      pitchScript = isDE
        ? `Guten Tag! Ich habe gesehen, dass Ihre Praxis ${res.business_name} noch keine direkte Online-Terminbuchung anbietet und die E-Mail-Domain keinen DMARC-Schutz hat. Das bedeutet: Patienten können abends nicht buchen und Bestätigungen landen im Spam.`
        : `Goedendag! Ik zag dat ${res.business_name} nog geen directe online afsprakenagenda heeft en dat uw e-maildomein het DMARC-beveiligingsslot mist. Hierdoor bellen klanten na 18:00 niet meer en raken bevestigingsmails vaak in de spam.`;
      roiPitch = isDE
        ? `Mit einem Durchschnittswert von €${ticketEur} pro Termin bringen bereits 5 zusätzliche Online-Buchungen pro Woche über €${ticketEur * 20} monatlichen Mehrumsatz.`
        : `Met gemiddeld €${ticketEur} per afspraak levert een toename van slechts 5 online boekingen per week al ruim €${ticketEur * 20} extra netto omzet per maand op.`;
    } else if (!res.booking.hasOnlineBooking) {
      packName = isDE
        ? 'Direkt-Buchungs-System & Patienten-Intake Funnel'
        : 'Online Agenda & Patiënten-Intake Funnel';
      setupFee = 995;
      abrahamFix = 'Configuratie van veilige, directe online boekingskalender met realtime agendakoppeling (Google/Outlook/EHR) en optionele iDEAL/Stripe aanbetaling.';
      pitchScript = isDE
        ? `Guten Tag! Über 65% der Terminsuchen finden abends auf dem Smartphone statt. Da bei ${res.business_name} kein Online-Kalender hinterlegt ist, buchen Neukunden oft direkt bei Wettbewerbern.`
        : `Goedendag! Ruim 65% van uw cliënten zoekt 's avonds via smartphone. Zonder directe online boekknop bellen ze overdag zelden, maar boeken ze bij een concurrent die wel een online agenda heeft.`;
      roiPitch = isDE
        ? `Spart der Rezeption wöchentlich 8-10 Stunden Telefonzeit und füllt Terminausfälle automatisch über Online-Nachrücker.`
        : `Bespaart uw praktijk minimaal 8 uur telefoontijd per week en vermindert no-shows met 75% via automatische herinneringen.`;
    } else if (res.privacy.preConsentRisk) {
      packName = isDE
        ? 'DSGVO & Abmahnschutz-Paket (Consent Management & Datensicherheit)'
        : 'AP & Privacy Compliantie Paket (Consent Manager & Tracker Isolatie)';
      setupFee = 795;
      abrahamFix = 'Volledige sanering van pre-consent tracking; implementatie van compliant consent management (Complianz/Usercentrics) en bijwerken van privacyverklaring.';
      pitchScript = isDE
        ? `Guten Tag! Auf ${res.domain} werden Analysetools aktiv, bevor der Besucher zustimmt. Das birgt im Münsterland/Niederrhein akute Abmahnrisiken nach DSGVO.`
        : `Goedendag! Uw website laadt direct trackingcookies voordat bezoekers toestemming geven. De Autoriteit Persoonsgegevens handhaaft hier momenteel streng op.`;
      roiPitch = isDE
        ? `Schützt die Geschäftsleitung sofort vor teuren DSGVO-Abmahnungen (€ 1.500 - € 5.000) und stellt Rechtssicherheit her.`
        : `Voorkomt boetes van de toezichthouder en herstelt direct het vertrouwen van uw cliënten.`;
    } else {
      packName = isDE ? 'E-Mail & Web-Integritäts-Paket' : 'Zakelijk E-mail & Webbeveiligingspakket';
      setupFee = 895;
      abrahamFix = 'Configuratie van DMARC policy, SSL-certificaat verlenging en HSTS preload.';
      pitchScript = isDE
        ? `Guten Tag! Ihre Domain hat keine moderne DMARC-Signatur, wodurch Gmail und Microsoft geschäftliche Angebote abweisen.`
        : `Goedendag! Uw zakelijke mail mist DMARC-authenticatie, waardoor offertes en facturen bij klanten in de spambox verdwijnen.`;
      roiPitch = isDE
        ? `Garantiert 100% Posteingangs-Zustellung für alle geschäftlichen Angebote und Rechnungen.`
        : `Garandeert dat 100% van uw offertes en communicatie direct in de inbox van de klant aankomt.`;
    }
  } else {
    // Orange or Green
    packName = isDE ? 'Mobile UX & Conversie Audit' : 'Mobiele Optimalisatie & Onderhoud';
    setupFee = 650;
    abrahamFix = 'Optimalisatie van mobiele viewport, klikbare actieknoppen en performance caching.';
    pitchScript = isDE ? `Guten Tag! Wir haben einige Optimierungspotenziale in der mobilen Darstellung identifiziert.` : `Goedendag! Wij zien kansen om uw mobiele conversie te verbeteren.`;
    roiPitch = isDE ? `Erhöht die mobile Kontaktquote um ca. 20-30%.` : `Verhoogt het aantal contactmomenten vanaf mobiele telefoons met 20-30%.`;
  }

  const abrahamSetup = Math.round(setupFee * 0.9 * 100) / 100;
  const debbieSetup = Math.round(setupFee * 0.1 * 100) / 100;

  const monthlyFee = 149;
  const abrahamMonthly = Math.round(monthlyFee * 0.9 * 100) / 100;
  const debbieMonthly = Math.round(monthlyFee * 0.1 * 100) / 100;

  res.opportunity = {
    packageRecommended: packName,
    setupFeeEur: setupFee,
    abrahamSetupEur: abrahamSetup,
    debbieSetupEur: debbieSetup,
    monthlyRetainerEur: monthlyFee,
    abrahamMonthlyEur: abrahamMonthly,
    debbieMonthlyEur: debbieMonthly,
    commissionPct: 15,
    commissionPerBookingEur: commissionPerBooking,
    estMonthlyBookings: estBookings,
    estMonthlyCommissionEur: estMonthlyCommission,
    estTotalMonthlyIncomeEur: monthlyFee + estMonthlyCommission,
    pitchScriptLocal: pitchScript,
    businessRoiPitchLocal: roiPitch,
    abrahamTechFix: abrahamFix
  };

  return res;
}

export async function runExpandedAudit() {
  const inputFile = path.join(ROOT_DIR, 'data', 'canonical_expanded_all_leads.json');
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file ${inputFile} not found!`);
    return [];
  }

  const leads = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  console.log(`Starting High-Performance Audit on ${leads.length} Leads...`);

  const results = [];
  const CONCURRENCY = 15;

  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const batch = leads.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.all(batch.map(auditSingleLead));
    results.push(...batchRes);

    const redCount = results.filter(r => r.priority === 'RED').length;
    console.log(`Audited ${results.length}/${leads.length} leads | 🔴 RED targets found: ${redCount}`);
    await sleep(200);
  }

  const outFile = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Saved comprehensive audit results to ${outFile}`);
  return results;
}

async function main() {
  await runExpandedAudit();
}

main().catch(console.error);
