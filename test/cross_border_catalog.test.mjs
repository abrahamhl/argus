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

const CATALOG_FILE = path.join(ROOT_DIR, 'data', 'canonical_cross_border_businesses.json');
const SCANNED_FILE = path.join(ROOT_DIR, 'data', 'argus_cross_border_scanned_results.json');
const EXCEL_FILE = path.join(ROOT_DIR, 'ARGUS_CROSS_BORDER_MASTER_LEADS.xlsx');

test('Cross-Border Dataset: canonical catalog verification', () => {
  assert.ok(fs.existsSync(CATALOG_FILE), 'canonical_cross_border_businesses.json must exist');
  const businesses = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

  assert.ok(businesses.length >= 400, `Expected at least 400 businesses, found ${businesses.length}`);

  const cities = new Set(businesses.map(b => b.city));
  assert.ok(cities.has('Arnhem'), 'Must include Arnhem');
  assert.ok(cities.has('Nijmegen'), 'Must include Nijmegen');
  assert.ok(cities.has('Wageningen'), 'Must include Wageningen');
  assert.ok(cities.has('Kleve'), 'Must include Kleve (Germany)');
  assert.ok(cities.has('Emmerich am Rhein'), 'Must include Emmerich am Rhein (Germany)');

  // Verify fields
  for (const b of businesses) {
    assert.ok(b.company_id, `Business must have company_id: ${JSON.stringify(b)}`);
    assert.ok(b.business_name, `Business must have name: ${b.company_id}`);
    assert.ok(b.domain, `Business must have domain: ${b.company_id}`);
    assert.ok(b.city, `Business must have city: ${b.company_id}`);
    assert.ok(b.category, `Business must have category: ${b.company_id}`);
    assert.ok(b.country === 'Nederland' || b.country === 'Duitsland', `Country must be NL or DE: ${b.country}`);

    if (b.phone_public) {
      if (b.country === 'Nederland') {
        assert.ok(b.phone_public.startsWith('+31') || b.phone_public.startsWith('0'), `Dutch phone format valid: ${b.phone_public}`);
      } else if (b.country === 'Duitsland') {
        assert.ok(b.phone_public.startsWith('+49') || b.phone_public.startsWith('0'), `German phone format valid: ${b.phone_public}`);
      }
    }
  }
});

test('Cross-Border Dataset: scanned results and findings verification', () => {
  assert.ok(fs.existsSync(SCANNED_FILE), 'argus_cross_border_scanned_results.json must exist');
  const results = JSON.parse(fs.readFileSync(SCANNED_FILE, 'utf8'));

  assert.ok(results.length >= 400, `Expected at least 400 scanned results, found ${results.length}`);

  const totalFindings = results.reduce((acc, r) => acc + (r.findings?.length || 0), 0);
  assert.ok(totalFindings >= 1000, `Expected at least 1000 findings, found ${totalFindings}`);

  const redLeads = results.filter(r => r.scores?.priorityColor === '🟥');
  assert.ok(redLeads.length >= 50, `Expected at least 50 red leads, found ${redLeads.length}`);

  // Test Debbie pitch and technical remediation
  for (const r of results) {
    assert.ok(r.scores, `Must have scores object: ${r.domain}`);
    assert.ok(r.scores.salesPriority >= 0 && r.scores.salesPriority <= 100, 'Score must be 0-100');
    assert.ok(r.debbiePitch, `Must have debbiePitch: ${r.domain}`);
    assert.ok(r.debbiePitch.oneLinerNL, `Debbie pitch must have Dutch one-liner: ${r.domain}`);
    assert.ok(r.debbiePitch.whyCareNL, `Debbie pitch must explain why care: ${r.domain}`);
  }
});

test('Master Excel: 8-sheet architecture and 90/10 math invariants', async () => {
  assert.ok(fs.existsSync(EXCEL_FILE), 'ARGUS_CROSS_BORDER_MASTER_LEADS.xlsx must exist');
  const stats = fs.statSync(EXCEL_FILE);
  assert.ok(stats.size > 150000, `Excel size should be > 150KB, found ${stats.size} bytes`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);

  const expectedSheets = [
    'MASTER_LEADS_ALL_CITIES',
    'ROSETTA_STONE_3_SECTORS',
    'CITY_ARNHEM',
    'CITY_NIJMEGEN',
    'CITY_WAGENINGEN',
    'CITY_NRW_GERMANY',
    'ALL_SCANNED_FINDINGS',
    'COMMERCIAL_MODEL_90_10'
  ];

  for (const name of expectedSheets) {
    const ws = workbook.getWorksheet(name);
    assert.ok(ws, `Worksheet ${name} must exist`);
  }

  // Verify Master Leads sheet data and 90/10 math
  const masterSheet = workbook.getWorksheet('MASTER_LEADS_ALL_CITIES');
  assert.ok(masterSheet.rowCount >= 400, `Master sheet must have >= 400 rows, got ${masterSheet.rowCount}`);

  masterSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Header
    const totalEur = Number(row.getCell(11).value);
    const abrahamShare = Number(row.getCell(12).value);
    const debbieShare = Number(row.getCell(13).value);

    assert.ok([450, 495, 650, 795, 995].includes(totalEur), `Valid package pricing: ${totalEur}`);
    assert.equal(Math.round((abrahamShare + debbieShare) * 100) / 100, totalEur, 'Abraham + Debbie must equal total price');
    assert.equal(abrahamShare, Math.round(totalEur * 0.90 * 100) / 100, 'Abraham gets exactly 90%');
    assert.equal(debbieShare, Math.round(totalEur * 0.10 * 100) / 100, 'Debbie gets exactly 10%');
  });

  // Verify Rosetta Stone 3 Sectors
  const rosetta = workbook.getWorksheet('ROSETTA_STONE_3_SECTORS');
  assert.ok(rosetta.rowCount >= 8, 'Rosetta stone must cover all key scopes');
});
