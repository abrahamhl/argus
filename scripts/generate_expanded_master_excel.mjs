import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import ExcelJS from local node_modules
import ExcelJS from '../apps/console/node_modules/exceljs/excel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export async function generateExpandedMasterExcel(leads, outputPath) {
  console.log(`Generating ARGUS Expanded Master Excel for ${leads.length} businesses...`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ARGUS Autonomous Lead Intelligence & Conversion Engine';
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

  const columnsDef = [
    { header: 'Prioriteit', key: 'priority', width: 14 },
    { header: 'Bedrijfsnaam', key: 'company', width: 30 },
    { header: 'Stad', key: 'city', width: 18 },
    { header: 'Land & Regio', key: 'region', width: 22 },
    { header: 'Sector / Branche', key: 'sector', width: 28 },
    { header: 'Telefoon (Direct)', key: 'phone', width: 20 },
    { header: 'Website URL', key: 'website', width: 28 },
    { header: 'Geconstateerde Tekortkoming', key: 'flaws', width: 38 },
    { header: 'Aanbevolen Oplossing', key: 'package', width: 34 },
    { header: 'Setup Prijs', key: 'setup', width: 16 },
    { header: 'Debbie (10%)', key: 'debbieSetup', width: 16 },
    { header: 'Abraham (90%)', key: 'abrahamSetup', width: 16 },
    { header: 'Maandfee (Retainer)', key: 'monthly', width: 18 },
    { header: 'Booking Comm. (15%)', key: 'commission', width: 18 },
    { header: 'Geschatte Extra Omzet', key: 'gain', width: 22 },
    { header: 'Debbie Verkooppraatkaart (NL/DE)', key: 'pitch', width: 55 },
    { header: 'Abraham Tech Oplossing', key: 'tech', width: 50 }
  ];

  function populateSheet(sheet, items) {
    sheet.columns = columnsDef;
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell(cell => {
      Object.assign(cell, headerStyle);
    });

    items.forEach((l, index) => {
      const opp = l.opportunity || {};
      const flaws = (l.redFlags && l.redFlags.length > 0)
        ? l.redFlags.join(' | ')
        : (!l.booking?.hasOnlineBooking ? 'Geen directe online boekingsagenda' : 'DMARC of AP-privacy risico');

      const ticket = l.avg_ticket_eur || 180;
      const estGain = ticket * (opp.estMonthlyBookings || 20);

      const row = sheet.addRow({
        priority: l.priority || 'RED',
        company: l.business_name,
        city: l.city,
        region: `${l.country === 'NL' ? '🇳🇱 NL' : '🇩🇪 DE'} - ${l.region || ''}`,
        sector: l.sector_name || 'MKB',
        phone: l.phone_public || 'Geen tel. gevonden',
        website: l.website || `https://${l.domain}`,
        flaws: flaws,
        package: opp.packageRecommended || 'Conversie & Beveiliging',
        setup: opp.setupFeeEur || 895,
        debbieSetup: opp.debbieSetupEur || 89.5,
        abrahamSetup: opp.abrahamSetupEur || 805.5,
        monthly: opp.monthlyRetainerEur || 149,
        commission: opp.commissionPerBookingEur || (ticket * 0.15),
        gain: estGain,
        pitch: opp.pitchScriptLocal || opp.debbiePitchNL || '',
        tech: opp.abrahamTechFix || ''
      });

      row.height = 24;

      // Formatting
      row.getCell('setup').numFmt = '€#,##0';
      row.getCell('debbieSetup').numFmt = '€#,##0';
      row.getCell('abrahamSetup').numFmt = '€#,##0';
      row.getCell('monthly').numFmt = '€#,##0';
      row.getCell('commission').numFmt = '€#,##0.00';
      row.getCell('gain').numFmt = '€#,##0';

      // Alignment
      row.getCell('priority').alignment = { horizontal: 'center' };
      row.getCell('city').alignment = { horizontal: 'center' };
      row.getCell('region').alignment = { horizontal: 'center' };
      row.getCell('phone').alignment = { horizontal: 'center' };

      // Priority color highlight
      const priCell = row.getCell('priority');
      if (l.priority === 'RED') {
        priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        priCell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF991B1B' } };
      } else if (l.priority === 'ORANGE') {
        priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        priCell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF92400E' } };
      } else {
        priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        priCell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF065F46' } };
      }

      // Debbie cash cut highlight
      row.getCell('debbieSetup').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      row.getCell('debbieSetup').font = { bold: true, color: { argb: 'FF047857' } };

      row.eachCell(cell => {
        cell.border = cellBorder;
      });
    });
  }

  // Sheet 1: 🔴 RED PRIORITY (IMMEDIATE ROI TARGETS)
  const redLeads = leads.filter(l => l.priority === 'RED' || (!l.booking?.hasOnlineBooking));
  const sheetRed = workbook.addWorksheet('🔴 ACUTE RED TARGETS');
  populateSheet(sheetRed, redLeads);

  // Sheet 2: 🇳🇱 NEDERLAND (Gelderland & Overijssel)
  const nlLeads = leads.filter(l => l.country === 'NL');
  const sheetNL = workbook.addWorksheet('🇳🇱 NEDERLAND (NL)');
  populateSheet(sheetNL, nlLeads);

  // Sheet 3: 🇩🇪 DUITSLAND (Nordrhein-Westfalen)
  const deLeads = leads.filter(l => l.country === 'DE');
  const sheetDE = workbook.addWorksheet('🇩🇪 DUITSLAND (DE)');
  populateSheet(sheetDE, deLeads);

  // Sheet 4: 🏥 KLINIEKEN & TANDARTSEN
  const clinicLeads = leads.filter(l => ['DENTAL', 'AESTHETICS', 'PHYSIO', 'MEDICAL'].includes(l.sector_id));
  const sheetClinics = workbook.addWorksheet('🏥 ZORG & KLINIEKEN');
  populateSheet(sheetClinics, clinicLeads);

  // Sheet 5: 🏨 BOUTIQUE HOTELS
  const hotelLeads = leads.filter(l => l.sector_id === 'HOSPITALITY');
  const sheetHotels = workbook.addWorksheet('🏨 BOUTIQUE HOTELS');
  populateSheet(sheetHotels, hotelLeads);

  // Sheet 6: ⚖️ ADVOCATEN & TAX
  const legalLeads = leads.filter(l => l.sector_id === 'LEGAL_TAX');
  const sheetLegal = workbook.addWorksheet('⚖️ JURIDISCH & FISCAAL');
  populateSheet(sheetLegal, legalLeads);

  // Sheet 7: 💰 90/10 ECONOMISCH MODEL
  const sheetModel = workbook.addWorksheet('💰 90-10 ECONOMICS');
  sheetModel.columns = [
    { header: 'Pakket / Oplossing', key: 'pack', width: 38 },
    { header: 'Totale Prijs', key: 'total', width: 18 },
    { header: 'Debbie Direct Cash (10%)', key: 'debbie', width: 25 },
    { header: 'Abraham Tech (90%)', key: 'abraham', width: 25 },
    { header: 'Maandelijkse Retainer', key: 'retainer', width: 22 },
    { header: 'Debbie Retainer (10%)', key: 'debbieRet', width: 22 },
    { header: 'Abraham Retainer (90%)', key: 'abrahamRet', width: 22 },
    { header: '15% Booking Commissie', key: 'comm', width: 25 }
  ];
  sheetModel.views = [{ state: 'frozen', ySplit: 1 }];
  const mHRow = sheetModel.getRow(1);
  mHRow.height = 30;
  mHRow.eachCell(cell => Object.assign(cell, headerStyle));

  const modelRows = [
    { pack: 'Online Agenda & Patiënten-Intake Funnel', total: 895, debbie: 89.5, abraham: 805.5, retainer: 149, debbieRet: 14.9, abrahamRet: 134.1, comm: '15% per intake' },
    { pack: 'Compleet Conversie- & Boekingsplatform (+ DMARC & SMS)', total: 1195, debbie: 119.5, abraham: 1075.5, retainer: 189, debbieRet: 18.9, abrahamRet: 170.1, comm: '15% per boeking' },
    { pack: 'Boutique Hotel Direct Reserveren Suite (Ontwijkt 18% OTA)', total: 1495, debbie: 149.5, abraham: 1345.5, retainer: 249, debbieRet: 24.9, abrahamRet: 224.1, comm: '10% per directe kamer' },
    { pack: 'DMARC & E-mail Inbox Beveiliging (Spam Preventie)', total: 695, debbie: 69.5, abraham: 625.5, retainer: 99, debbieRet: 9.9, abrahamRet: 89.1, comm: 'N.v.t.' },
    { pack: 'AP & DSGVO Privacy Sanering (Pre-consent Compliance)', total: 795, debbie: 79.5, abraham: 715.5, retainer: 129, debbieRet: 12.9, abrahamRet: 116.1, comm: 'N.v.t.' }
  ];

  modelRows.forEach(mr => {
    const r = sheetModel.addRow(mr);
    r.height = 24;
    r.getCell('total').numFmt = '€#,##0';
    r.getCell('debbie').numFmt = '€#,##0.00';
    r.getCell('abraham').numFmt = '€#,##0.00';
    r.getCell('retainer').numFmt = '€#,##0';
    r.getCell('debbieRet').numFmt = '€#,##0.00';
    r.getCell('abrahamRet').numFmt = '€#,##0.00';

    r.getCell('debbie').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
    r.getCell('debbie').font = { bold: true, color: { argb: 'FF047857' } };

    r.eachCell(c => c.border = cellBorder);
  });

  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Saved Expanded Master Excel to ${outputPath}`);
}

async function main() {
  const expandedPath = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');
  const appointmentPath = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
  const targetPath = fs.existsSync(expandedPath) ? expandedPath : appointmentPath;
  if (fs.existsSync(targetPath)) {
    const raw = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    await generateExpandedMasterExcel(raw, path.join(ROOT_DIR, 'ARGUS_EXPANDED_MASTER_LEADS.xlsx'));
  }
}

main().catch(console.error);
