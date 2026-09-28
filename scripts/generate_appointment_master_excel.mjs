import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import ExcelJS from local node_modules
import ExcelJS from '../apps/console/node_modules/exceljs/excel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
const OUTPUT_EXCEL = path.join(ROOT_DIR, 'ARGUS_APPOINTMENT_LEAD_ENGINE.xlsx');

const rawData = fs.readFileSync(DATA_FILE, 'utf8');
const leads = JSON.parse(rawData);

console.log(`Generating Dedicated Appointment & Booking Master Excel for ${leads.length} high-ticket businesses...`);

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ARGUS Autonomous Intelligence & Conversion Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Styles
  const headerStyle = {
    font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }, // Slate-900
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF38BDF8' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    }
  };

  const cellBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // Sort leads: Missing booking first, then by avg ticket descending
  const sortedLeads = [...leads].sort((a, b) => {
    if (a.booking?.hasOnlineBooking !== b.booking?.hasOnlineBooking) {
      return a.booking?.hasOnlineBooking ? 1 : -1; // Missing booking widget comes first!
    }
    return (b.avg_ticket_eur || 0) - (a.avg_ticket_eur || 0);
  });

  // Helper to populate appointment sheet
  function populateAppointmentSheet(sheet, leadList) {
    sheet.columns = [
      { header: 'Prioriteit', key: 'priority', width: 12 },
      { header: 'Stad', key: 'city', width: 16 },
      { header: 'Land & Regio', key: 'region', width: 20 },
      { header: 'Bedrijfsnaam', key: 'company', width: 28 },
      { header: 'Specialisme / Sector', key: 'sector', width: 26 },
      { header: 'Volledig Adres', key: 'address', width: 32 },
      { header: 'Telefoon (Direct)', key: 'phone', width: 20 },
      { header: 'Website / Domein', key: 'website', width: 24 },
      { header: 'Huidige Boekingsstatus', key: 'bookingStatus', width: 28 },
      { header: 'Gedetecteerd Systeem', key: 'engine', width: 18 },
      { header: 'Gem. Behandelprijs (€)', key: 'ticketEur', width: 18 },
      { header: 'Aanbevolen Conversiepakket', key: 'package', width: 34 },
      { header: 'Vaste Setup (€)', key: 'setupFee', width: 15 },
      { header: 'Omzet Abraham (90% Setup)', key: 'abrahamSetup', width: 22 },
      { header: 'Commissie Debbie (10% Setup)', key: 'debbieSetup', width: 22 },
      { header: 'Maand Retainer (€)', key: 'monthlyRetainer', width: 16 },
      { header: 'Abraham Mnd (90%)', key: 'abrahamMonthly', width: 18 },
      { header: 'Debbie Mnd (10%)', key: 'debbieMonthly', width: 18 },
      { header: '15% Succesfee per Boeking (€)', key: 'commissionPerBooking', width: 24 },
      { header: 'Geschatte Boekingen/Mnd', key: 'estBookings', width: 20 },
      { header: 'Geschatte Commissie/Mnd (€)', key: 'estCommission', width: 24 },
      { header: 'Totale Maandinkomsten (€/mnd)', key: 'totalMonthly', width: 25 },
      { header: 'Debbie Praatkaart (30s NL)', key: 'debbiePitch', width: 44 },
      { header: 'Zakelijke ROI Pitch (Directie)', key: 'roiPitch', width: 44 },
      { header: 'Technische Oplossing Abraham (Engineering)', key: 'abrahamFix', width: 42 },
      { header: 'Pipeline Status', key: 'stage', width: 16 }
    ];

    sheet.getRow(1).height = 34;
    sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

    leadList.forEach((r, idx) => {
      const opp = r.opportunity;
      const isMissingBooking = !r.booking?.hasOnlineBooking;
      const priorityBadge = isMissingBooking ? '🟥' : (r.booking?.brokenMobileAction ? '🟧' : '🟨');
      const bookingLabel = isMissingBooking ? '❌ Geen Boekingswidget (Alleen Bellen)' : (r.booking?.brokenMobileAction ? '⚠️ Widget Onvindbaar op Mobiel' : '✅ Boekingssysteem Actief');

      const row = sheet.addRow({
        priority: priorityBadge,
        city: r.city,
        region: `${r.country === 'Duitsland' ? 'DE' : 'NL'} - ${r.region || 'Regio'}`,
        company: r.business_name,
        sector: r.sector_name,
        address: r.address || `${r.city} Centrum`,
        phone: r.phone_public || (r.public_contact ? `E-mail: ${r.public_contact}` : 'Fysiek Binnenlopen'),
        website: r.website || `https://${r.domain}`,
        bookingStatus: bookingLabel,
        engine: r.booking?.detectedEngine || 'Geen',
        ticketEur: r.avg_ticket_eur,
        package: opp.packageRecommended,
        setupFee: opp.setupFeeEur,
        abrahamSetup: opp.abrahamSetupEur,
        debbieSetup: opp.debbieSetupEur,
        monthlyRetainer: opp.monthlyRetainerEur,
        abrahamMonthly: opp.abrahamMonthlyEur,
        debbieMonthly: opp.debbieMonthlyEur,
        commissionPerBooking: opp.commissionPerBookingEur,
        estBookings: opp.estMonthlyBookings,
        estCommission: opp.estMonthlyCommissionEur,
        totalMonthly: opp.estTotalMonthlyIncomeEur,
        debbiePitch: opp.debbiePitchNL,
        roiPitch: opp.businessRoiPitchNL,
        abrahamFix: opp.abrahamTechFix,
        stage: idx < 20 ? 'VANDAAG CONTACT' : (idx < 60 ? 'DEZE WEEK' : 'PIPELINE')
      });

      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.border = cellBorder;
        cell.alignment = { vertical: 'middle', wrapText: true };

        // Currency formatting
        if ([11, 13, 14, 15, 16, 17, 18, 19, 21, 22].includes(colNum)) {
          cell.numFmt = '€#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }

        // Priority badges
        if (colNum === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (priorityBadge === '🟥') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { bold: true, color: { argb: 'FF991B1B' } };
          } else if (priorityBadge === '🟧') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
            cell.font = { bold: true, color: { argb: 'FF9A3412' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
            cell.font = { bold: true, color: { argb: 'FF854D0E' } };
          }
        }

        // Booking status color
        if (colNum === 9) {
          if (isMissingBooking) {
            cell.font = { bold: true, color: { argb: 'FFDC2626' } };
          } else {
            cell.font = { color: { argb: 'FF16A34A' } };
          }
        }

        // Highlight Abraham (90%) and Debbie (10%)
        if (colNum === 14) cell.font = { bold: true, color: { argb: 'FF0284C7' } }; // Sky-600
        if (colNum === 15) cell.font = { bold: true, color: { argb: 'FF16A34A' } }; // Green-600
        if (colNum === 22) cell.font = { bold: true, color: { argb: 'FF7C3AED' } }; // Violet-600 (Total Monthly)
      });
    });

    sheet.autoFilter = { from: 'A1', to: 'Z1' };
  }

  // -------------------------------------------------------------
  // SHEET 1: MASTER_APPOINTMENT_LEADS (All 361 Leads)
  // -------------------------------------------------------------
  const sheetMaster = workbook.addWorksheet('MASTER_APPOINTMENT_LEADS', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 4 }]
  });
  populateAppointmentSheet(sheetMaster, sortedLeads);

  // -------------------------------------------------------------
  // SHEET 2: TOP_ESTHETIEK_EN_KLINIEKEN (Highest Ticket Leads)
  // -------------------------------------------------------------
  const aestheticsLeads = sortedLeads.filter(l => l.sector_id === 'AESTHETICS' || l.sector_id === 'DENTAL');
  const sheetAesthetics = workbook.addWorksheet('TOP_KLINIEKEN_EN_TANDARTSEN', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 4 }]
  });
  populateAppointmentSheet(sheetAesthetics, aestheticsLeads);

  // -------------------------------------------------------------
  // SHEET 3: TOP_HOTELS_DIRECT_BOOKING (Direct Booking vs Booking.com)
  // -------------------------------------------------------------
  const hotelLeads = sortedLeads.filter(l => l.sector_id === 'HOSPITALITY');
  const sheetHotels = workbook.addWorksheet('HOTELS_DIRECT_BOOKING', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 4 }]
  });
  populateAppointmentSheet(sheetHotels, hotelLeads);

  // -------------------------------------------------------------
  // SHEET 4: COMMISSION_AND_ROI_MODELS (Business Case Matrix)
  // -------------------------------------------------------------
  const sheetRoi = workbook.addWorksheet('COMMISSION_AND_ROI_MODELS');
  sheetRoi.columns = [
    { header: 'Sector & Typologie', key: 'sector', width: 30 },
    { header: 'Gem. Behandelticket (€)', key: 'avgTicket', width: 22 },
    { header: 'Nieuwe Boekingen/Mnd', key: 'bookings', width: 22 },
    { header: 'Extra Omzet voor Klant (€/mnd)', key: 'clientRevenue', width: 28 },
    { header: '15% Succesfee AUX (€/mnd)', key: 'feeAux', width: 24 },
    { header: 'Maand Retainer (€/mnd)', key: 'retainer', width: 22 },
    { header: 'Totale Maandomzet AUX (€/mnd)', key: 'totalAux', width: 26 },
    { header: 'Abraham 90% (€/mnd)', key: 'abrahamShare', width: 22 },
    { header: 'Debbie 10% (€/mnd)', key: 'debbieShare', width: 22 },
    { header: 'Netto ROI voor Bedrijfseigenaar', key: 'netRoi', width: 28 }
  ];

  sheetRoi.getRow(1).height = 34;
  sheetRoi.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const sectorCases = [
    { name: 'Kliniek voor Esthetiek & Huidverbetering', ticket: 250, bookings: 20 },
    { name: 'Tandartspraktijk / Implantologie', ticket: 180, bookings: 25 },
    { name: 'Boutique Hotel (Directe Kamerreservering)', ticket: 195, bookings: 30 },
    { name: 'Luxe Kapsalon & Beauty Boutique', ticket: 110, bookings: 30 },
    { name: 'Fysiotherapie & Specialistische Revalidatie', ticket: 65, bookings: 35 },
    { name: 'Optometrie & Specialistische Oogzorg', ticket: 120, bookings: 25 }
  ];

  sectorCases.forEach(sc => {
    const clientRev = sc.ticket * sc.bookings;
    const feeAux = Math.round(clientRev * 0.15);
    const retainer = 149;
    const totalAux = feeAux + retainer;
    const abr = Math.round(totalAux * 0.90 * 100) / 100;
    const deb = Math.round(totalAux * 0.10 * 100) / 100;
    const netProfitClient = clientRev - totalAux;
    const roiMultiplier = (clientRev / totalAux).toFixed(1) + 'x ROI';

    const row = sheetRoi.addRow({
      sector: sc.name,
      avgTicket: sc.ticket,
      bookings: sc.bookings,
      clientRevenue: clientRev,
      feeAux: feeAux,
      retainer: retainer,
      totalAux: totalAux,
      abrahamShare: abr,
      debbieShare: deb,
      netRoi: `${roiMultiplier} (+€${netProfitClient.toLocaleString('nl-NL')} winst)`
    });

    row.height = 26;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle' };
      if ([2, 4, 5, 6, 7, 8, 9].includes(colNum)) {
        cell.numFmt = '€#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (colNum === 7) cell.font = { bold: true, color: { argb: 'FF7C3AED' } };
      if (colNum === 8) cell.font = { bold: true, color: { argb: 'FF0284C7' } };
      if (colNum === 9) cell.font = { bold: true, color: { argb: 'FF16A34A' } };
      if (colNum === 10) cell.font = { bold: true, color: { argb: 'FF059669' } };
    });
  });

  // Section 2: Portfolio Scale Models
  const spacerRow = sheetRoi.addRow({});
  spacerRow.height = 15;

  const headerScale = sheetRoi.addRow({
    sector: 'PORTFOLIO OPSCHALING (Corridor Gelderland & NRW)',
    avgTicket: '',
    bookings: '',
    clientRevenue: '',
    feeAux: '',
    retainer: '',
    totalAux: '',
    abrahamShare: '',
    debbieShare: '',
    netRoi: ''
  });
  headerScale.height = 28;
  headerScale.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };

  const scaleScenarios = [
    { deals: 5, label: 'Eerste Cohort (5 Klinieken/Salons)' },
    { deals: 15, label: 'Maand 1 Doelstelling (15 Zorgondernemers)' },
    { deals: 35, label: 'Regionale Hub (35 Actieve Klanten)' },
    { deals: 60, label: 'Corridor Schaal (60 Klanten Gelderland + NRW)' }
  ];

  scaleScenarios.forEach(sc => {
    const avgSetup = 895;
    const totalSetup = sc.deals * avgSetup;
    const abrSetup = totalSetup * 0.90;
    const debSetup = totalSetup * 0.10;

    const avgMonthlyRetainer = 149;
    const avgMonthlyFee = 600; // conservative 15% commission per clinic
    const mTotal = sc.deals * (avgMonthlyRetainer + avgMonthlyFee);
    const mAbr = mTotal * 0.90;
    const mDeb = mTotal * 0.10;

    const row = sheetRoi.addRow({
      sector: sc.label,
      avgTicket: sc.deals,
      bookings: totalSetup,
      clientRevenue: abrSetup,
      feeAux: debSetup,
      retainer: sc.deals * avgMonthlyRetainer,
      totalAux: mTotal,
      abrahamShare: mAbr,
      debbieShare: mDeb,
      netRoi: `Jaarlijkse Waarde: €${(totalSetup + mTotal * 12).toLocaleString('nl-NL')}`
    });

    row.height = 26;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle' };
      if ([3, 4, 5, 6, 7, 8, 9].includes(colNum)) {
        cell.numFmt = '€#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (colNum === 7) cell.font = { bold: true, color: { argb: 'FF7C3AED' } };
      if (colNum === 8) cell.font = { bold: true, color: { argb: 'FF0284C7' } };
      if (colNum === 9) cell.font = { bold: true, color: { argb: 'FF16A34A' } };
    });
  });

  // -------------------------------------------------------------
  // SHEET 5: TECH_STACK_BOOKING_BLUEPRINT
  // -------------------------------------------------------------
  const sheetTech = workbook.addWorksheet('TECH_STACK_BOOKING_BLUEPRINT');
  sheetTech.columns = [
    { header: 'Component', key: 'comp', width: 24 },
    { header: 'Technologie & Tooling', key: 'tech', width: 30 },
    { header: 'Functie in de Funnel', key: 'role', width: 42 },
    { header: 'AVG/DSGVO & Beveiligingseisen', key: 'security', width: 44 }
  ];

  sheetTech.getRow(1).height = 32;
  sheetTech.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const blueprint = [
    {
      comp: 'Frontend Boekings-UI',
      tech: 'Next.js / Vite + TailwindCSS / Cal.com Embed',
      role: 'Lichtgewicht, mobiel-geoptimaliseerd afsprakenscherm dat direct laadt (<1.0s) en sticky zichtbaar is op telefoons.',
      security: 'Geen externe trackers vóór toestemming; CSP frame-ancestors restricties.'
    },
    {
      comp: 'Patiënt / Cliënt Intake',
      tech: 'Type-safe React Hook Form + Zod',
      role: 'Korte intakevragen vooraf (behandeling, voorkeurstijd, medische bijzonderheden).',
      security: 'AVG Art. 9: Medische intakegegevens strikt gescheiden van marketing-ID\'s en versleuteld in transit (TLS 1.3).'
    },
    {
      comp: 'Aanbetaling & No-Show Stop',
      tech: 'Stripe Elements / Mollie iDEAL & Bancontact',
      role: 'Aanbetaling van €25 - €50 of volledige vooruitbetaling, waardoor no-shows met meer dan 85% dalen.',
      security: 'PCI-DSS SAQ-A compliant; kaart- en bankgegevens gaan direct via beveiligde tokenisatie.'
    },
    {
      comp: 'Automatische Herinneringen',
      tech: 'Twilio / MessageBird SMS & WhatsApp API',
      role: 'Directe SMS-bevestiging + WhatsApp herinnering 24 uur en 2 uur vóór de behandeling.',
      security: 'Opt-in vinkje bij boeking; DPA (verwerkersovereenkomst) met SMS-gateway.'
    },
    {
      comp: 'Atributie & Commissietracking',
      tech: 'Server-side Event Tracking (Stape.io / Supabase)',
      role: 'Registreert organische en campagne-boekingen via beveiligde sessietokens om de 15% commissie transparant te auditeren.',
      security: 'Cookieloze server-side hashes; privacy-first en volledig compliant met de Telecommunicatiewet.'
    },
    {
      comp: 'E-mail Aflevergarantie',
      tech: 'DMARC (p=quarantine), SPF (-all), DKIM',
      role: 'Garandeert dat bevestigingsmails en facturen direct in de inbox van Gmail/Outlook landen en niet in de spambox.',
      security: 'RFC 7489, RFC 7208; afzenderidentiteit 100% cryptografisch geverifieerd.'
    }
  ];

  blueprint.forEach(b => {
    const row = sheetTech.addRow(b);
    row.height = 30;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (colNum === 1) cell.font = { bold: true };
      if (colNum === 2) cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF0369A1' } };
    });
  });

  // -------------------------------------------------------------
  // SHEET 6: DEBBIE_SALES_PLAYBOOK_NL
  // -------------------------------------------------------------
  const sheetPlaybook = workbook.addWorksheet('DEBBIE_SALES_PLAYBOOK_NL');
  sheetPlaybook.columns = [
    { header: 'Situatie / Doelgroep', key: 'situation', width: 28 },
    { header: '30-Seconden Baliegesprek (Debbie in Gewone Taal)', key: 'pitch', width: 48 },
    { header: 'Bezwaar van de Praktijkhouder', key: 'objection', width: 34 },
    { header: 'Het Wervende Antwoord van Debbie', key: 'response', width: 46 }
  ];

  sheetPlaybook.getRow(1).height = 32;
  sheetPlaybook.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const playbook = [
    {
      situation: 'Kliniek voor Esthetiek (Botox, Laser, Huidtherapie)',
      pitch: '"Goedemorgen! We zagen dat uw kliniek prachtige behandelingen biedt, maar \'s avonds op de smartphone kunnen mensen niet direct een intake inplannen. Jonge, drukke cliënten bellen overdag niet meer en boeken dan bij een kliniek die wel een directe boekknop heeft."',
      objection: '"We willen eerst zelf bellen om te screenen wie er komt."',
      response: '"Heel begrijpelijk! Ons systeem vraagt eerst de intakevragen uit die u wenst, en vraagt eventueel een kleine aanbetaling van €25 om no-shows te voorkomen. U behoudt altijd de regie."'
    },
    {
      situation: 'Tandartsenpraktijk & Mondhygiëne',
      pitch: '"Goedemorgen, veel praktijken hebben de telefoonlijn overbelast tijdens het ochtendspreekuur. Wij richten een mobiele agenda in waarmee patiënten voor periodieke controles en mondhygiëne zelf 24/7 hun tijdslot kunnen kiezen."',
      objection: '"Patiënten moeten ons gewoon bellen tijdens openingstijden."',
      response: '"Juist! En daardoor staat uw assistente de hele ochtend aan de telefoon in plaats van stoelassistentie te verlenen. Ons systeem haalt 40% van die telefoondruk weg."'
    },
    {
      situation: 'Boutique Hotel & B&B',
      pitch: '"Goedemiddag, we zagen dat u schitterende kamers heeft, maar op uw website ontbreekt een eigen directe boekingsmodule. Daardoor boekt iedereen via Booking.com en betaalt u 15% tot 18% commissie."',
      objection: '"Booking.com brengt ons de meeste gasten, we kunnen niet zonder hen."',
      response: '"U hoeft Booking.com ook niet uit te zetten! Maar terugkerende gasten en mond-tot-mond gasten boeken nu óók via Booking.com. Met uw eigen directe knop bespaart u duizenden euro\'s per jaar aan afdrachten."'
    },
    {
      situation: 'Luxe Kapsalon & Beauty Salon',
      pitch: '"Hoi! Als styliste sta je de hele dag met je handen in het haar en kan je de telefoon niet opnemen als er een klant belt. Met onze online agenda boeken klanten \'s avonds op de bank en krijgen ze automatisch een SMS-herinnering."',
      objection: '"We hebben al een contactformulier op de site staan."',
      response: '"Een contactformulier is helaas een dood spoor: u moet dan na het werk nog heen en weer mailen over welke datum kan. Met een live tijdslot is de afspraak direct definitief bevestigd."'
    }
  ];

  playbook.forEach(p => {
    const row = sheetPlaybook.addRow(p);
    row.height = 36;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (colNum === 1) cell.font = { bold: true };
      if (colNum === 2) cell.font = { italic: true, color: { argb: 'FF15803D' } };
      if (colNum === 4) cell.font = { bold: true, color: { argb: 'FF0369A1' } };
    });
  });

  await workbook.xlsx.writeFile(OUTPUT_EXCEL);
  console.log(`\n✅ Dedicated Appointment Master Excel saved to ${OUTPUT_EXCEL}!`);
}

main().catch(err => {
  console.error('Error generating Excel:', err);
  process.exit(1);
});
