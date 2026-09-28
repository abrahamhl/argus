import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateCommandCenterHtml } from './build_command_center_html.mjs';
import { generateCsvAndMarkdown } from './generate_csv_and_markdown_reports.mjs';
import { generateExpandedMasterExcel } from './generate_expanded_master_excel.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 COMPILING ALL ARGUS COMMERCIAL & TECHNICAL OUTPUTS`);
  console.log(`======================================================\n`);

  const expandedPath = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');
  const appointmentPath = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
  const targetPath = fs.existsSync(expandedPath) ? expandedPath : appointmentPath;

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: No audit results found at ${targetPath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  console.log(`Loaded ${raw.length} audited leads from ${path.basename(targetPath)}`);

  // 1. Build Standalone Interactive HTML Command Center
  const htmlOut = path.join(ROOT_DIR, 'ARGUS_LEAD_COMMAND_CENTER.html');
  generateCommandCenterHtml(raw, htmlOut);

  // 2. Build UTF-8 BOM CSVs & Markdown Dossier
  generateCsvAndMarkdown(raw);

  // 3. Build Multi-Sheet Excel Master
  const excelOut = path.join(ROOT_DIR, 'ARGUS_EXPANDED_MASTER_LEADS.xlsx');
  await generateExpandedMasterExcel(raw, excelOut);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL DELIVERABLES GENERATED SUCCESSFULLY:`);
  console.log(`- HTML Command Center: ARGUS_LEAD_COMMAND_CENTER.html`);
  console.log(`- Immediate ROI Red CSV: ARGUS_RED_IMMEDIATE_ROI_TARGETS.csv`);
  console.log(`- Full Catalog CSV: ARGUS_ALL_LEADS_MASTER.csv`);
  console.log(`- Markdown Action Dossier: ARGUS_TOP_RED_TARGETS.md`);
  console.log(`- Master Excel Workbook: ARGUS_EXPANDED_MASTER_LEADS.xlsx`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
