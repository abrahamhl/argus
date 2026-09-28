import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function auditAppointmentBiz(biz) {
  const domain = biz.domain;
  const auditTime = new Date().toISOString();

  const resObj = {
    ...biz,
    auditTimestamp: auditTime,
    dns: { resolved: false, ip: null, error: null, spf: null, dmarc: null },
    tls: { authorized: false, validTo: null, daysRemaining: null },
    http: {
      reachable: false,
      statusCode: null,
      hsts: false,
      server: null
    },
    booking: {
      hasOnlineBooking: false,
      detectedEngine: null,
      hasPhoneLink: false,
      hasEmailLink: false,
      brokenMobileAction: false,
      hasViewport: false
    },
    privacy: {
      preConsentRisk: false,
      trackers: []
    },
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
      debbiePitchNL: '',
      businessRoiPitchNL: '',
      abrahamTechFix: ''
    }
  };

  // 1. DNS (SPF & DMARC)
  try {
    const a = await dns.resolve4(domain).catch(() => []);
    if (a.length > 0) {
      resObj.dns.resolved = true;
      resObj.dns.ip = a[0];
    }
  } catch {}

  try {
    const txt = await dns.resolveTxt(domain).catch(() => []);
    const flat = txt.map(r => r.join(''));
    const spf = flat.find(t => t.startsWith('v=spf1'));
    if (spf) resObj.dns.spf = spf;
  } catch {}

  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flat = dmarcTxt.map(r => r.join(''));
    const dmarc = flat.find(t => t.startsWith('v=DMARC1'));
    if (dmarc) resObj.dns.dmarc = dmarc;
  } catch {}

  // 2. Fast TLS
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
          resObj.tls.authorized = socket.authorized;
          const exp = new Date(cert.valid_to).getTime();
          resObj.tls.daysRemaining = Math.round((exp - Date.now()) / (1000 * 60 * 60 * 24));
        }
      } catch {}
      socket.destroy();
      resolve();
    });
    socket.on('error', () => { socket.destroy(); resolve(); });
    socket.on('timeout', () => { socket.destroy(); resolve(); });
  });

  // 3. HTTP HTML fetch to detect booking engines & contact forms
  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const resp = await fetch(`https://${domain}`, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/128.0)'
      }
    });
    clearTimeout(timeout);

    resObj.http.reachable = true;
    resObj.http.statusCode = resp.status;
    resObj.http.hsts = resp.headers.has('strict-transport-security');

    html = await resp.text();
  } catch {}

  // 4. Booking & Conversion Inspection
  if (html) {
    resObj.booking.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    resObj.booking.hasPhoneLink = /href=["']tel:[^"']+["']/i.test(html);
    resObj.booking.hasEmailLink = /href=["']mailto:[^"']+["']/i.test(html);
    resObj.booking.brokenMobileAction = !resObj.booking.hasPhoneLink && !resObj.booking.hasOnlineBooking;

    // Detect Booking Engine Widgets
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
        resObj.booking.hasOnlineBooking = true;
        resObj.booking.detectedEngine = be.name;
        break;
      }
    }

    // Generic booking button check
    if (!resObj.booking.hasOnlineBooking && /online-afspraak|afspraak-maken|online-boeken|termin-buchen|online-termin/i.test(html)) {
      resObj.booking.hasOnlineBooking = true;
      resObj.booking.detectedEngine = 'Eigen Boekingsformulier';
    }

    // Trackers
    if (/google-analytics|googletagmanager|connect\.facebook\.net/i.test(html) && !/cookiebot|complianz|onetrust|usercentrics/i.test(html)) {
      resObj.privacy.preConsentRisk = true;
    }
  }

  // 5. Commercial Packaging & Pricing Engine
  const ticketEur = biz.avg_ticket_eur || 150;
  const commissionPerBooking = Math.round(ticketEur * 0.15 * 100) / 100;
  const estBookings = biz.sector_id === 'HOSPITALITY' ? 30 : (biz.sector_id === 'AESTHETICS' ? 20 : 25);
  const estMonthlyCommission = Math.round(commissionPerBooking * estBookings);

  let setupFee = 795;
  let packName = 'Modern Boekingssysteem & Mobiele Conversie';
  let abrahamFix = 'Drop-in Cal.com / custom Next.js afsprakenwidget met iDEAL/Stripe aanbetaling en SMS-bevestiging.';
  let debbiePitch = 'Veel cliënten zoeken \'s avonds op hun mobiel naar een behandeling. Zonder directe online agenda bellen ze niet meer, maar gaan ze naar een collega die wel een directe boekknop heeft.';
  let roiPitch = `Met gemiddeld €${ticketEur} per behandeling levert een stijging van slechts 5 online boekingen per week al ruim € 3.000 extra omzet per maand op.`;

  if (!resObj.booking.hasOnlineBooking && !resObj.dns.dmarc) {
    packName = 'Compleet Conversie- & Boekingsplatform (Agenda + E-mailslot + SMS)';
    setupFee = 1195;
    abrahamFix = 'Ontwikkeling van een moderne mobiele landingspagina, afsprakenmodule, DMARC/SPF e-mailauthenticatie (zodat afspraakbevestigingen nooit spamboxen raken) en automatische herinneringen.';
    debbiePitch = 'Uw website mist nog een online boekingsagenda en de bevestigingsmails hebben geen beveiligingsslot, waardoor afspraakherinneringen in de spamfilter kunnen belanden.';
    roiPitch = 'Geen gemiste telefoontjes meer tijdens behandelingen, 80% minder no-shows door SMS-herinneringen en directe toename van nieuwe cliënten.';
  } else if (!resObj.booking.hasOnlineBooking) {
    packName = 'Online Agenda & Patiënten-Intake Funnel';
    setupFee = 895;
    abrahamFix = 'Koppeling van een gebruiksvriendelijke boekingskalender die direct synchroniseert met Google/Outlook Agenda en mobiele betaaloptie.';
    debbiePitch = 'Patiënten en cliënten willen anno 2026 direct een tijdslot kunnen kiezen zonder heen-en-weer te hoeven mailen of bellen.';
    roiPitch = 'Bespaart de assistente of baliemedewerker minimaal 8 uur telefoontijd per week en trekt direct jongere, koopkrachtige cliënten aan.';
  } else if (!resObj.booking.hasViewport || resObj.booking.brokenMobileAction) {
    packName = 'Mobiele UX & Boekingsoptimalisatie';
    setupFee = 595;
    abrahamFix = 'Mobile-first herontwerp van de menubalk, sticky "Boek Nu"-knop onderin beeld op smartphones en directe belknop.';
    debbiePitch = 'U heeft wel een systeem, maar op mobiele telefoons is de boekingsknop lastig te vinden of te bedienen.';
    roiPitch = 'Meer dan 70% van de afspraken wordt via mobiel gemaakt. Een directe sticky knop verhoogt de afronding direct met 25-40%.';
  } else {
    packName = 'Lokale SEO & Boekings-Conversie Retainer';
    setupFee = 495;
    abrahamFix = 'Lokale Google Maps ranking optimalisatie, gestructureerde data (LocalBusiness schema) en performance versnelling.';
    debbiePitch = 'Uw agenda werkt netjes; wij zorgen dat uw praktijk bovenaan staat in Google wanneer mensen in de regio zoeken naar uw specialisme.';
    roiPitch = 'Structurele instroom van nieuwe cliënten uit de directe omgeving via organische Google Maps posities.';
  }

  const abrahamSetup = Math.round(setupFee * 0.90 * 100) / 100;
  const debbieSetup = Math.round(setupFee * 0.10 * 100) / 100;

  resObj.opportunity = {
    packageRecommended: packName,
    setupFeeEur: setupFee,
    abrahamSetupEur: abrahamSetup,
    debbieSetupEur: debbieSetup,
    monthlyRetainerEur: 149,
    abrahamMonthlyEur: 134.10,
    debbieMonthlyEur: 14.90,
    commissionPct: 15,
    commissionPerBookingEur: commissionPerBooking,
    estMonthlyBookings: estBookings,
    estMonthlyCommissionEur: estMonthlyCommission,
    estTotalMonthlyIncomeEur: 149 + estMonthlyCommission,
    debbiePitchNL: debbiePitch,
    businessRoiPitchNL: roiPitch,
    abrahamTechFix: abrahamFix
  };

  return resObj;
}

async function main() {
  const inputPath = path.resolve('data/canonical_appointment_leads.json');
  const leads = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  console.log(`Starting Appointment & Booking Audit for ${leads.length} high-ticket businesses...`);

  const results = [];
  const CONCURRENCY = 20;
  const queue = [...leads];
  let completed = 0;

  async function worker() {
    while (queue.length > 0) {
      const biz = queue.shift();
      if (!biz) break;
      try {
        const audited = await auditAppointmentBiz(biz);
        results.push(audited);
      } catch (err) {
        console.error(`Error on ${biz.domain}: ${err.message}`);
      }
      completed++;
      if (completed % 30 === 0 || queue.length === 0) {
        console.log(`[Audit Pool] Audited ${completed}/${leads.length} appointment leads...`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const missingBooking = results.filter(r => !r.booking.hasOnlineBooking).length;
  console.log(`\nAudit Complete!`);
  console.log(`Total Audited: ${results.length}`);
  console.log(`Missing Online Booking Widget: ${missingBooking} (${Math.round((missingBooking / results.length) * 100)}% - ENORME COMMERCIËLE KANS!)`);
  console.log(`With Existing Booking Widget: ${results.length - missingBooking}`);

  const outputPath = 'data/argus_appointment_audit_results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved audit results to ${outputPath}`);
}

main().catch(console.error);
