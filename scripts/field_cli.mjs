#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_cross_border_scanned_results.json');
const FALLBACK_FILE = path.join(ROOT_DIR, 'data', 'argus_arnhem_scanned_results.json');

const targetFile = fs.existsSync(DATA_FILE) ? DATA_FILE : FALLBACK_FILE;
if (!fs.existsSync(targetFile)) {
  console.error('Error: Scan results not found at', targetFile);
  console.error('Run `node scripts/run_cross_border_scan.mjs` first.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

// Format helpers
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const ORANGE = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const SKY = '\x1b[38;5;39m';

function printHeader() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  ARGUS CROSS-BORDER FIELD INTELLIGENCE · REGIONAL LEAD EXPLORER${RESET}`);
  console.log(`${GRAY}  Arnhem · Nijmegen · Wageningen · Nordrhein-Westfalen (DE)${RESET}`);
  console.log(`${GRAY}  Commercieel Model: 90% Abraham (Techniek) · 10% Debbie (Introductie)${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);
}

function calculateEco(r) {
  let totalEur = r.debbiePitch?.indicativePriceEur || 495;
  const findings = r.findings || [];
  const hasDmarc = findings.some(f => f.category === 'EMAIL_SECURITY');
  const hasPrivacy = findings.some(f => f.category === 'PRIVACY_CONFIGURATION');
  const hasHardening = findings.some(f => f.category === 'WEB_SECURITY_HARDENING');

  if (hasDmarc && hasPrivacy && hasHardening) totalEur = 995;
  else if (hasDmarc && hasPrivacy) totalEur = 795;
  else if (hasPrivacy) totalEur = 650;
  else if (hasDmarc) totalEur = 495;
  else if (totalEur < 450) totalEur = 450;

  const abrahamShare = Math.round(totalEur * 0.90 * 100) / 100;
  const debbieShare = Math.round(totalEur * 0.10 * 100) / 100;
  return { totalEur, abrahamShare, debbieShare, monthlyRetainer: 149 };
}

function listByColor(colorFilter, cityFilter = null) {
  printHeader();
  let filtered = results.filter(r => r.scores.priorityColor === colorFilter);
  if (cityFilter) {
    filtered = filtered.filter(r => (r.city || '').toLowerCase().includes(cityFilter.toLowerCase()));
  }
  filtered.sort((a, b) => b.scores.salesPriority - a.scores.salesPriority);

  const cityLabel = cityFilter ? ` in ${cityFilter.toUpperCase()}` : ' (Alle regio\'s)';
  console.log(`${BOLD}Overzicht leads met prioriteit ${colorFilter}${cityLabel} (${filtered.length} bedrijven):${RESET}\n`);
  console.log(`${BOLD}${'ID'.padEnd(24)} ${'STAD'.padEnd(14)} ${'BEDRIJF'.padEnd(24)} ${'PRIO'.padEnd(6)} ${'VAST (€)'.padEnd(10)} ${'ABRAHAM 90%'.padEnd(12)} ${'DEBBIE 10%'.padEnd(12)} HOOFDPUNT${RESET}`);
  console.log(`${GRAY}${''.padEnd(125, '-')}${RESET}`);

  filtered.forEach((r) => {
    const eco = calculateEco(r);
    const mainIssue = r.findings[0] ? r.findings[0].finding_title : 'Geen acute kwetsbaarheden';
    const shortIssue = mainIssue.length > 32 ? mainIssue.slice(0, 29) + '...' : mainIssue;
    console.log(
      `${CYAN}${r.company_id.padEnd(24).slice(0, 23)}${RESET} ` +
      `${(r.city || 'Arnhem').padEnd(14).slice(0, 13)} ` +
      `${BOLD}${r.business_name.padEnd(24).slice(0, 23)}${RESET} ` +
      `${colorFilter} ${String(r.scores.salesPriority).padStart(3)} ` +
      `€${String(eco.totalEur).padEnd(8)} ` +
      `${SKY}€${String(eco.abrahamShare).padEnd(10)}${RESET} ` +
      `${GREEN}€${String(eco.debbieShare).padEnd(10)}${RESET} ` +
      `${shortIssue}`
    );
  });

  console.log(`\n${GRAY}Gebruik: node scripts/field_cli.mjs --company <ID> om een dossier te openen.${RESET}\n`);
}

function showTop20(cityFilter = null) {
  printHeader();
  let filtered = [...results];
  if (cityFilter) {
    filtered = filtered.filter(r => (r.city || '').toLowerCase().includes(cityFilter.toLowerCase()));
  }
  
  // Sort by priority color then sales score
  const priorityOrder = { '🟥': 1, '🟧': 2, '🟨': 3, '🟩': 4, '⬜': 5 };
  filtered.sort((a, b) => {
    const pA = priorityOrder[a.scores.priorityColor] || 99;
    const pB = priorityOrder[b.scores.priorityColor] || 99;
    if (pA !== pB) return pA - pB;
    return b.scores.salesPriority - a.scores.salesPriority;
  });

  const top20 = filtered.slice(0, 20);
  const cityLabel = cityFilter ? `VOOR ${cityFilter.toUpperCase()}` : 'OVER ALLE REGIO\'S';

  console.log(`${BOLD}🎯 TOP 20 COMMERCIËLE LEADS ${cityLabel} (90/10 REVENUE SPLIT):${RESET}\n`);
  console.log(`${BOLD}${'#'.padEnd(3)} ${'STAD'.padEnd(12)} ${'BEDRIJF'.padEnd(22)} ${'TELEFOON'.padEnd(18)} ${'PRIO'.padEnd(5)} ${'PRIJS'.padEnd(8)} ${'ABRAHAM (90%)'.padEnd(14)} ${'DEBBIE (10%)'.padEnd(12)} MRR (€149)${RESET}`);
  console.log(`${GRAY}${''.padEnd(120, '-')}${RESET}`);

  let totalRevenue = 0;
  let totalAbraham = 0;
  let totalDebbie = 0;

  top20.forEach((r, idx) => {
    const eco = calculateEco(r);
    totalRevenue += eco.totalEur;
    totalAbraham += eco.abrahamShare;
    totalDebbie += eco.debbieShare;

    const phoneStr = (r.phone_public || 'Lokaal binnenlopen').slice(0, 17);
    console.log(
      `${String(idx + 1).padEnd(3)} ` +
      `${(r.city || 'Arnhem').padEnd(12).slice(0, 11)} ` +
      `${BOLD}${r.business_name.padEnd(22).slice(0, 21)}${RESET} ` +
      `${phoneStr.padEnd(18)} ` +
      `${r.scores.priorityColor}   ` +
      `€${String(eco.totalEur).padEnd(6)} ` +
      `${SKY}€${String(eco.abrahamShare.toFixed(2)).padEnd(12)}${RESET} ` +
      `${GREEN}€${String(eco.debbieShare.toFixed(2)).padEnd(10)}${RESET} ` +
      `€134.10 / €14.90`
    );
  });

  console.log(`${GRAY}${''.padEnd(120, '-')}${RESET}`);
  console.log(`${BOLD}TOTALE POTENTIE TOP 20 LEADS:${RESET}`);
  console.log(`  • Vaste Eénmalige Omzet: ${BOLD}€${totalRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}${RESET}`);
  console.log(`  • Abraham (90% Uitvoering & Garantie): ${BOLD}${SKY}€${totalAbraham.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}${RESET}`);
  console.log(`  • Debbie (10% Introductie & Baliegesprek): ${BOLD}${GREEN}€${totalDebbie.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}${RESET}`);
  console.log(`  • Maandelijks Retainer Potentieel: €${(top20.length * 149).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}/mnd (Abraham: €${(top20.length * 134.10).toFixed(2)} / Debbie: €${(top20.length * 14.90).toFixed(2)})\n`);
}

function viewCompany(companyId) {
  const r = results.find(b => b.company_id === companyId || b.domain === companyId || b.business_name.toLowerCase().includes(companyId.toLowerCase()));
  if (!r) {
    console.error(`Bedrijf niet gevonden: '${companyId}'`);
    process.exit(1);
  }

  const eco = calculateEco(r);
  printHeader();
  console.log(`${BOLD}BEDRIJF:${RESET} ${BOLD}${r.business_name}${RESET} (${r.scores.priorityColor} Prioriteit ${r.scores.salesPriority}/100)`);
  console.log(`${BOLD}STAD/REGIO:${RESET} ${r.city} (${r.country === 'Duitsland' ? 'Duitsland - NRW' : 'Nederland - Gelderland'})`);
  console.log(`${BOLD}DOMEIN:${RESET}  https://${r.domain} (Status: ${r.http.statusCode || 'N/A'})`);
  console.log(`${BOLD}LOCATIE:${RESET} ${r.address}`);
  console.log(`${BOLD}SECTOR:${RESET}  ${r.category}`);
  console.log(`${BOLD}CONTACT:${RESET} ${r.phone_public || 'Geen telefoon'} | ${r.public_contact || 'Geen e-mail'}`);
  console.log(`${GRAY}${''.padEnd(80, '-')}${RESET}`);

  console.log(`\n${BOLD}💰 VERDELINGSMODEL (90/10 REVENUE SPLIT):${RESET}`);
  console.log(`  • Aanbevolen Pakket: ${BOLD}${eco.totalEur === 995 ? 'Compleet Beveiligingspakket' : (eco.totalEur === 795 ? 'E-mail + AVG Inrichting' : 'E-mail Authenticatie (DMARC/SPF)')}${RESET}`);
  console.log(`  • Totale Vaste Prijs: ${BOLD}€${eco.totalEur.toFixed(2)}${RESET}`);
  console.log(`  • Abraham (90% Techniek & Herstel): ${BOLD}${SKY}€${eco.abrahamShare.toFixed(2)}${RESET}`);
  console.log(`  • Debbie (10% Introductie & Lead):   ${BOLD}${GREEN}€${eco.debbieShare.toFixed(2)}${RESET}`);
  console.log(`  • Maandabonnement (€149/mnd):        Abraham: €134.10/mnd · Debbie: €14.90/mnd`);

  console.log(`\n${BOLD}⚡ PRAATKAART DEBBIE (30-Seconden Baliegesprek in Gewone Mensentaal):${RESET}`);
  console.log(`  • ${BOLD}Wat te zeggen:${RESET} "${r.debbiePitch?.oneLinerNL || 'Het zakelijke e-mailadres is nog niet beschermd tegen nabootsing.'}"`);
  console.log(`  • ${BOLD}Waarom belangrijk:${RESET} "${r.debbiePitch?.whyCareNL || 'Kwaadwillenden kunnen uit uw naam facturen versturen naar klanten.'}"`);
  console.log(`  • ${BOLD}Wat wij doen:${RESET} "${r.debbiePitch?.whatWeOfferNL || 'We richten binnen 48 uur het officiële DMARC-slot in en monitoren dit continu.'}"`);
  console.log(`  • ${BOLD}Actie:${RESET} ${r.debbiePitch?.nextAction || 'Gratis 1-pagina scan overhandigen en vragen wie over de website gaat.'}`);

  console.log(`\n${BOLD}🛠️ TECHNISCHE OPLOSSING ABRAHAM (Drop-in Engineering Fix):${RESET}`);
  if (r.findings && r.findings.length > 0) {
    r.findings.forEach((f, i) => {
      console.log(`  [${i + 1}] ${BOLD}${f.finding_title}${RESET} (${f.severity_if_confirmed})`);
      console.log(`      Bewijs: ${f.evidence_location}`);
      console.log(`      Oplossing: ${CYAN}${f.suggested_remediation}${RESET}`);
    });
  } else {
    console.log(`  Geen acute kwetsbaarheden geconstateerd.`);
  }

  console.log(`\n${GRAY}Directie-brief dossier: reports/${r.company_id}/BRIEF_AAN_DIRECTIE.html${RESET}\n`);
}

function showSummary() {
  printHeader();
  const total = results.length;
  const red = results.filter(r => r.scores.priorityColor === '🟥').length;
  const orange = results.filter(r => r.scores.priorityColor === '🟧').length;
  const yellow = results.filter(r => r.scores.priorityColor === '🟨').length;
  const green = results.filter(r => r.scores.priorityColor === '🟩').length;
  const phones = results.filter(r => r.phone_public).length;

  console.log(`${BOLD}📊 CATALOGUS SAMENVATTING (Gelderland & NRW):${RESET}`);
  console.log(`  • Totale geverifieerde bedrijven: ${BOLD}${total}${RESET}`);
  console.log(`  • Direct bereikbaar via telefoon: ${BOLD}${phones}${RESET} (${Math.round((phones / total) * 100)}%)`);
  console.log(`  • 🟥 Dringende Leads (Rood):     ${BOLD}${RED}${red}${RESET} (Directe verkoopkans Maandag)`);
  console.log(`  • 🟧 Hoge Leads (Oranje):        ${BOLD}${ORANGE}${orange}${RESET}`);
  console.log(`  • 🟨 Matige Leads (Geel):        ${BOLD}${yellow}${RESET}`);
  console.log(`  • 🟩 Gezonde Domeinen (Groen):   ${BOLD}${GREEN}${green}${RESET}`);

  // By city
  const cities = {};
  results.forEach(r => {
    cities[r.city] = (cities[r.city] || 0) + 1;
  });
  console.log(`\n${BOLD}Verdeling per Stad:${RESET}`);
  Object.entries(cities).forEach(([city, count]) => {
    console.log(`  • ${city.padEnd(20)}: ${count} bedrijven`);
  });

  console.log(`\n${BOLD}Beschikbare opdrachten:${RESET}`);
  console.log(`  node scripts/field_cli.mjs --top20                     (Top 20 alle steden)`);
  console.log(`  node scripts/field_cli.mjs --top20 --city nijmegen    (Top 20 Nijmegen)`);
  console.log(`  node scripts/field_cli.mjs --top20 --city wageningen  (Top 20 Wageningen)`);
  console.log(`  node scripts/field_cli.mjs --top20 --city nrw         (Top 20 Kleve/Emmerich)`);
  console.log(`  node scripts/field_cli.mjs --red                      (Alle rode leads)`);
  console.log(`  node scripts/field_cli.mjs --orange                   (Alle oranje leads)`);
  console.log(`  node scripts/field_cli.mjs --company <ID>             (Detail dossier bekijken)\n`);
}

// Argument parsing
const args = process.argv.slice(2);
const cityArgIdx = args.indexOf('--city');
const cityFilter = cityArgIdx !== -1 && args[cityArgIdx + 1] ? args[cityArgIdx + 1] : null;

if (args.includes('--top20')) {
  showTop20(cityFilter);
} else if (args.includes('--red')) {
  listByColor('🟥', cityFilter);
} else if (args.includes('--orange')) {
  listByColor('🟧', cityFilter);
} else if (args.includes('--yellow')) {
  listByColor('🟨', cityFilter);
} else if (args.includes('--green')) {
  listByColor('🟩', cityFilter);
} else if (args.includes('--company')) {
  const idx = args.indexOf('--company');
  if (idx !== -1 && args[idx + 1]) {
    viewCompany(args[idx + 1]);
  } else {
    console.error('Specificeer een company ID: node scripts/field_cli.mjs --company <ID>');
  }
} else {
  showSummary();
}
