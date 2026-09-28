import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import ExcelJS from local node_modules
import ExcelJS from '../apps/console/node_modules/exceljs/excel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CATALOG_FILE = path.join(ROOT_DIR, 'data', 'canonical_appointment_leads.json');
const AUDIT_FILE = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
const EXCEL_FILE = path.join(ROOT_DIR, 'ARGUS_APPOINTMENT_LEAD_ENGINE.xlsx');

test('Appointment Leads: Canonical catalog structure and coverage', () => {
  assert.ok(fs.existsSync(CATALOG_FILE), 'canonical_appointment_leads.json must exist');
  const leads = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

  assert.ok(leads.length >= 350, `Expected at least 350 appointment leads, found ${leads.length}`);

  const cities = new Set(leads.map(l => l.city));
  assert.ok(cities.has('Arnhem'), 'Must include Arnhem');
  assert.ok(cities.has('Nijmegen'), 'Must include Nijmegen');
  assert.ok(cities.has('Wageningen'), 'Must include Wageningen');
  assert.ok(cities.has('Ede'), 'Must include Ede');
  assert.ok(cities.has('Kleve'), 'Must include Kleve');
  assert.ok(cities.has('Emmerich am Rhein'), 'Must include Emmerich am Rhein');

  const sectors = new Set(leads.map(l => l.sector_id));
  assert.ok(sectors.has('AESTHETICS'), 'Must include Aesthetics & Skin clinics');
  assert.ok(sectors.has('DENTAL'), 'Must include Dental & Ortho practices');
  assert.ok(sectors.has('PHYSIO'), 'Must include Physiotherapy');
  assert.ok(sectors.has('HOSPITALITY'), 'Must include Boutique Hotels');
  assert.ok(sectors.has('SALON_SPA'), 'Must include Luxury Salons & Spas');

  for (const l of leads) {
    assert.ok(l.company_id, 'Lead must have company_id');
    assert.ok(l.business_name, 'Lead must have name');
    assert.ok(l.domain, 'Lead must have domain');
    assert.ok(l.city, 'Lead must have city');
    assert.ok(l.avg_ticket_eur >= 50, `Average ticket must be realistic (>= 50): ${l.avg_ticket_eur}`);
  }
});

test('Appointment Audit: Booking detection and commercial packaging', () => {
  assert.ok(fs.existsSync(AUDIT_FILE), 'argus_appointment_audit_results.json must exist');
  const results = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));

  assert.ok(results.length >= 350, `Expected at least 350 audited leads, found ${results.length}`);

  const missingBooking = results.filter(r => !r.booking?.hasOnlineBooking);
  assert.ok(missingBooking.length >= 200, `Expected high volume of missing booking widgets, found ${missingBooking.length}`);

  for (const r of results) {
    const opp = r.opportunity;
    assert.ok(opp, `Lead must have opportunity package: ${r.domain}`);
    assert.ok(opp.setupFeeEur >= 495, `Setup fee must be >= 495: ${opp.setupFeeEur}`);
    assert.equal(
      Math.round((opp.abrahamSetupEur + opp.debbieSetupEur) * 100) / 100,
      opp.setupFeeEur,
      'Abraham + Debbie setup split must equal total setup fee'
    );
    assert.equal(opp.abrahamSetupEur, Math.round(opp.setupFeeEur * 0.90 * 100) / 100, 'Abraham gets 90% setup');
    assert.equal(opp.debbieSetupEur, Math.round(opp.setupFeeEur * 0.10 * 100) / 100, 'Debbie gets 10% setup');

    assert.equal(opp.monthlyRetainerEur, 149, 'Standard retainer is 149');
    assert.equal(opp.abrahamMonthlyEur, 134.10, 'Abraham gets 90% retainer');
    assert.equal(opp.debbieMonthlyEur, 14.90, 'Debbie gets 10% retainer');

    assert.ok(opp.commissionPerBookingEur > 0, 'Must calculate 15% commission per booking');
    assert.ok(opp.debbiePitchNL, 'Must have Dutch pitch for Debbie');
    assert.ok(opp.businessRoiPitchNL, 'Must have ROI pitch for business owner');
  }
});

test('Appointment Master Excel: Worksheets and calculation integrity', async () => {
  assert.ok(fs.existsSync(EXCEL_FILE), 'ARGUS_APPOINTMENT_LEAD_ENGINE.xlsx must exist');
  const stats = fs.statSync(EXCEL_FILE);
  assert.ok(stats.size > 70000, `Excel size should be > 70KB, found ${stats.size} bytes`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);

  const expectedSheets = [
    'MASTER_APPOINTMENT_LEADS',
    'TOP_KLINIEKEN_EN_TANDARTSEN',
    'HOTELS_DIRECT_BOOKING',
    'COMMISSION_AND_ROI_MODELS',
    'TECH_STACK_BOOKING_BLUEPRINT',
    'DEBBIE_SALES_PLAYBOOK_NL'
  ];

  for (const name of expectedSheets) {
    const ws = workbook.getWorksheet(name);
    assert.ok(ws, `Worksheet ${name} must exist in appointment workbook`);
  }

  const masterSheet = workbook.getWorksheet('MASTER_APPOINTMENT_LEADS');
  assert.ok(masterSheet.rowCount >= 350, `Master sheet should have >= 350 rows, got ${masterSheet.rowCount}`);
});
