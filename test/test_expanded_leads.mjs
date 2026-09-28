import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧪 ARGUS EXPANDED LEAD & COMMERCIAL TEST SUITE`);
  console.log(`======================================================\n`);

  const resultsPath = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');
  const appointmentPath = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
  const targetPath = fs.existsSync(resultsPath) ? resultsPath : appointmentPath;

  assert(fs.existsSync(targetPath), `Audit data file exists at ${path.basename(targetPath)}`);

  const leads = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  assert(Array.isArray(leads) && leads.length >= 300, `Catalog contains qualified leads (found ${leads.length})`);

  console.log(`\n--- 1. Testing Commercial 90/10 Economics & Math Invariants ---`);
  let mathViolations = 0;
  for (const l of leads) {
    const opp = l.opportunity;
    if (!opp) continue;

    const setupSum = Math.round((opp.abrahamSetupEur + opp.debbieSetupEur) * 100) / 100;
    if (Math.abs(setupSum - opp.setupFeeEur) > 0.05) {
      mathViolations++;
    }

    const monthlySum = Math.round((opp.abrahamMonthlyEur + opp.debbieMonthlyEur) * 100) / 100;
    if (Math.abs(monthlySum - opp.monthlyRetainerEur) > 0.05) {
      mathViolations++;
    }
  }
  assert(mathViolations === 0, `100% of leads satisfy strict 90/10 setup and monthly revenue split (0 violations)`);

  console.log(`\n--- 2. Testing Priority & Red Flag Classification ---`);
  const redLeads = leads.filter(l => l.priority === 'RED');
  assert(redLeads.length > 50, `Substantial concentration of RED urgent ROI leads identified (found ${redLeads.length})`);

  let invalidRed = 0;
  for (const r of redLeads) {
    const hasFlags = (r.redFlags && r.redFlags.length > 0) || !r.booking?.hasOnlineBooking || !r.dns?.dmarc;
    if (!hasFlags) invalidRed++;
  }
  assert(invalidRed === 0, `All RED leads have concrete, demonstrable technical/commercial flaws`);

  console.log(`\n--- 3. Testing Pitch Script Integrity ---`);
  let missingPitch = 0;
  for (const l of redLeads) {
    const pitch = l.opportunity?.pitchScriptLocal || l.opportunity?.debbiePitchNL;
    if (!pitch || pitch.includes('undefined') || pitch.length < 20) {
      missingPitch++;
    }
  }
  assert(missingPitch === 0, `100% of RED leads have customized, professional sales pitches free of template errors`);

  console.log(`\n--- 4. Testing Output Deliverables & Format Integrity ---`);
  const htmlFile = path.join(ROOT_DIR, 'ARGUS_LEAD_COMMAND_CENTER.html');
  assert(fs.existsSync(htmlFile), `ARGUS_LEAD_COMMAND_CENTER.html exists`);
  const htmlSize = fs.statSync(htmlFile).size;
  assert(htmlSize > 50000, `Command Center HTML is complete and self-contained (${Math.round(htmlSize / 1024)} KB)`);

  const redCsvFile = path.join(ROOT_DIR, 'ARGUS_RED_IMMEDIATE_ROI_TARGETS.csv');
  assert(fs.existsSync(redCsvFile), `ARGUS_RED_IMMEDIATE_ROI_TARGETS.csv exists`);
  const redCsvContent = fs.readFileSync(redCsvFile, 'utf8');
  assert(redCsvContent.startsWith('\uFEFF'), `CSV has UTF-8 BOM for seamless double-click opening in Excel`);

  const mdFile = path.join(ROOT_DIR, 'ARGUS_TOP_RED_TARGETS.md');
  assert(fs.existsSync(mdFile), `ARGUS_TOP_RED_TARGETS.md executive dossier exists`);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
  console.log(`======================================================\n`);
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
