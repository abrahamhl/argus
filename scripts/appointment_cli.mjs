#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
if (!fs.existsSync(DATA_FILE)) {
  console.error('Error: Appointment scan results not found at', DATA_FILE);
  process.exit(1);
}

const leads = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Format helpers
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const SKY = '\x1b[38;5;39m';
const VIOLET = '\x1b[38;5;135m';

function printHeader() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  ARGUS APPOINTMENT ENGINE · HIGH-TICKET BOOKING & COMMISSIONS${RESET}`);
  console.log(`${GRAY}  Esthetiek · Tandartsen · Fysio · Luxe Salons · Boutique Hotels${RESET}`);
  console.log(`${GRAY}  Commercieel Model: Setup (90/10) + Retainer (€149/mnd) + 15% Succesfee${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);
}

function showSummary() {
  printHeader();
  const total = leads.length;
  const missing = leads.filter(l => !l.booking?.hasOnlineBooking).length;
  const phones = leads.filter(l => l.phone_public).length;

  console.log(`${BOLD}📊 APPOINTMENT ENGINE SAMENVATTING (Gelderland & NRW):${RESET}`);
  console.log(`  • Totaal geverifieerde zorg- & servicebedrijven: ${BOLD}${total}${RESET}`);
  console.log(`  • ❌ Zonder online boekingswidget:               ${BOLD}${RED}${missing}${RESET} (${Math.round((missing / total) * 100)}% - directe verkoopkans!)`);
  console.log(`  • ✅ Met bestaand boekingssysteem:              ${BOLD}${GREEN}${total - missing}${RESET}`);
  console.log(`  • 📞 Direct bereikbaar via telefoon:            ${BOLD}${phones}${RESET} (${Math.round((phones / total) * 100)}%)\n`);

  const sectors = {};
  leads.forEach(l => {
    sectors[l.sector_name] = (sectors[l.sector_name] || 0) + 1;
  });

  console.log(`${BOLD}Verdeling per Specialisme:${RESET}`);
  Object.entries(sectors).forEach(([sec, cnt]) => {
    console.log(`  • ${sec.padEnd(42)}: ${cnt} bedrijven`);
  });

  console.log(`\n${BOLD}Beschikbare opdrachten:${RESET}`);
  console.log(`  node scripts/appointment_cli.mjs --top20                  (Top 20 kansen)`);
  console.log(`  node scripts/appointment_cli.mjs --sector aesthetics       (Klinieken & Esthetiek)`);
  console.log(`  node scripts/appointment_cli.mjs --sector dental           (Tandartsen & Mondzorg)`);
  console.log(`  node scripts/appointment_cli.mjs --sector hotel            (Boutique Hotels)`);
  console.log(`  node scripts/appointment_cli.mjs --city nijmegen          (Filter op Nijmegen)`);
  console.log(`  node scripts/appointment_cli.mjs --company <naam>          (Detail dossier + 15% ROI)\n`);
}

function showTop20(sectorFilter = null, cityFilter = null) {
  printHeader();
  let filtered = [...leads];

  if (sectorFilter) {
    filtered = filtered.filter(l => (l.sector_id || '').toLowerCase().includes(sectorFilter.toLowerCase()) || (l.sector_name || '').toLowerCase().includes(sectorFilter.toLowerCase()));
  }
  if (cityFilter) {
    filtered = filtered.filter(l => (l.city || '').toLowerCase().includes(cityFilter.toLowerCase()));
  }

  // Prioritize missing booking and highest ticket
  filtered.sort((a, b) => {
    if (a.booking?.hasOnlineBooking !== b.booking?.hasOnlineBooking) {
      return a.booking?.hasOnlineBooking ? 1 : -1;
    }
    return (b.avg_ticket_eur || 0) - (a.avg_ticket_eur || 0);
  });

  const top20 = filtered.slice(0, 20);
  console.log(`${BOLD}🎯 TOP 20 APPOINTMENT LEADS (SETUP + RETAINER + 15% SUCCESFEE):${RESET}\n`);
  console.log(`${BOLD}${'#'.padEnd(3)} ${'STAD'.padEnd(11)} ${'BEDRIJF'.padEnd(23)} ${'SECTOR'.padEnd(20)} ${'STATUS'.padEnd(16)} ${'SETUP (90/10)'.padEnd(18)} ${'15% COMM/MND'.padEnd(14)} TOTAAL MND${RESET}`);
  console.log(`${GRAY}${''.padEnd(120, '-')}${RESET}`);

  let totalSetup = 0;
  let totalMonthlyPotential = 0;

  top20.forEach((r, idx) => {
    const opp = r.opportunity;
    totalSetup += opp.setupFeeEur;
    totalMonthlyPotential += opp.estTotalMonthlyIncomeEur;

    const statusStr = !r.booking?.hasOnlineBooking ? `${RED}Geen Agenda${RESET}` : `${GREEN}Heeft Widget${RESET}`;
    console.log(
      `${String(idx + 1).padEnd(3)} ` +
      `${(r.city || 'Arnhem').padEnd(11).slice(0, 10)} ` +
      `${BOLD}${r.business_name.padEnd(23).slice(0, 22)}${RESET} ` +
      `${r.sector_id.padEnd(20).slice(0, 19)} ` +
      `${statusStr.padEnd(25)} ` +
      `€${opp.setupFeeEur} (${SKY}€${opp.abrahamSetupEur.toFixed(0)}${RESET}/${GREEN}€${opp.debbieSetupEur.toFixed(0)}${RESET}) ` +
      `${VIOLET}€${String(opp.estMonthlyCommissionEur).padEnd(12)}${RESET} ` +
      `€${opp.estTotalMonthlyIncomeEur}/mnd`
    );
  });

  console.log(`${GRAY}${''.padEnd(120, '-')}${RESET}`);
  console.log(`${BOLD}TOTALE POTENTIE VAN DEZE SELECTIE:${RESET}`);
  console.log(`  • Eenmalige Setup Omzet: ${BOLD}€${totalSetup.toLocaleString('nl-NL')}${RESET} (Abraham 90%: €${(totalSetup * 0.9).toLocaleString('nl-NL')} | Debbie 10%: €${(totalSetup * 0.1).toLocaleString('nl-NL')})`);
  console.log(`  • Maandelijkse Inkomsten (Retainers + 15% Commissie): ${BOLD}${VIOLET}€${totalMonthlyPotential.toLocaleString('nl-NL')}/mnd${RESET}\n`);
}

function viewCompany(query) {
  const r = leads.find(b => b.company_id === query || b.domain === query || b.business_name.toLowerCase().includes(query.toLowerCase()));
  if (!r) {
    console.error(`Bedrijf niet gevonden: '${query}'`);
    process.exit(1);
  }

  const opp = r.opportunity;
  printHeader();
  console.log(`${BOLD}BEDRIJF:${RESET}     ${BOLD}${r.business_name}${RESET}`);
  console.log(`${BOLD}SECTOR:${RESET}      ${r.sector_name} (Gem. Behandeling: €${r.avg_ticket_eur})`);
  console.log(`${BOLD}LOCATIE:${RESET}     ${r.address}, ${r.city} (${r.country})`);
  console.log(`${BOLD}TELEFOON:${RESET}    ${r.phone_public || 'Geen telefoon geregistreerd'}`);
  console.log(`${BOLD}WEBSITE:${RESET}     https://${r.domain} (Status: ${r.http.statusCode || 'N/A'})`);
  console.log(`${BOLD}AGENDA STATUS:${RESET} ${!r.booking.hasOnlineBooking ? `${RED}Geen online boekingswidget aangetroffen${RESET}` : `${GREEN}Widget aanwezig (${r.booking.detectedEngine})${RESET}`}`);
  console.log(`${GRAY}${''.padEnd(80, '-')}${RESET}`);

  console.log(`\n${BOLD}💰 VERDIENMODEL & COMMISSIES (Setup + Retainer + 15% Succesfee):${RESET}`);
  console.log(`  • Aanbevolen Pakket: ${BOLD}${opp.packageRecommended}${RESET}`);
  console.log(`  • Eenmalige Vaste Setup: €${opp.setupFeeEur.toFixed(2)} (${SKY}Abraham 90%: €${opp.abrahamSetupEur.toFixed(2)}${RESET} | ${GREEN}Debbie 10%: €${opp.debbieSetupEur.toFixed(2)}${RESET})`);
  console.log(`  • Maandelijks Retainer:  €${opp.monthlyRetainerEur.toFixed(2)}/mnd (${SKY}Abraham: €${opp.abrahamMonthlyEur.toFixed(2)}${RESET} | ${GREEN}Debbie: €${opp.debbieMonthlyEur.toFixed(2)}${RESET})`);
  console.log(`  • 15% Succesfee per Boeking: ${BOLD}€${opp.commissionPerBookingEur.toFixed(2)} per nieuwe cliënt/gast${RESET}`);
  console.log(`  • Geschat bij ${opp.estMonthlyBookings} boekingen/mnd: ${VIOLET}€${opp.estMonthlyCommissionEur.toFixed(2)} extra commissie/mnd${RESET}`);
  console.log(`  • ${BOLD}Totale Verwachte Maandomzet:${RESET} ${VIOLET}€${opp.estTotalMonthlyIncomeEur.toFixed(2)}/mnd${RESET}`);

  console.log(`\n${BOLD}⚡ PRAATKAART VOOR DEBBIE (30-Seconden Baliegesprek):${RESET}`);
  console.log(`  "${opp.debbiePitchNL}"`);

  console.log(`\n${BOLD}📈 ZAKELIJKE ROI PITCH VOOR DE PRAKTIJKHOUDER:${RESET}`);
  console.log(`  "${opp.businessRoiPitchNL}"`);

  console.log(`\n${BOLD}🛠️ TECHNISCHE DROP-IN OPLOSSING (Abraham):${RESET}`);
  console.log(`  ${CYAN}${opp.abrahamTechFix}${RESET}\n`);
}

// Arg parsing
const args = process.argv.slice(2);
const sectorIdx = args.indexOf('--sector');
const sectorFilter = sectorIdx !== -1 && args[sectorIdx + 1] ? args[sectorIdx + 1] : null;

const cityIdx = args.indexOf('--city');
const cityFilter = cityIdx !== -1 && args[cityIdx + 1] ? args[cityIdx + 1] : null;

if (args.includes('--top20')) {
  showTop20(sectorFilter, cityFilter);
} else if (args.includes('--company')) {
  const cIdx = args.indexOf('--company');
  if (cIdx !== -1 && args[cIdx + 1]) viewCompany(args[cIdx + 1]);
} else if (sectorFilter) {
  showTop20(sectorFilter, cityFilter);
} else {
  showSummary();
}
