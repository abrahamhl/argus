const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * ARGUS Professional PDF Converter
 * Converts self-contained ARGUS HTML client and engineer reports into publication-grade PDFs.
 * Zero external network calls.
 */
async function convertHtmlToPdf(htmlFilePath, outputPdfPath) {
  if (!fs.existsSync(htmlFilePath)) {
    console.error(`[ARGUS PDF Error] File not found: ${htmlFilePath}`);
    process.exit(1);
  }

  console.log(`[ARGUS PDF] Rendering publication-grade PDF from: ${htmlFilePath}...`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const content = fs.readFileSync(htmlFilePath, 'utf-8');
  await page.setContent(content, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
  });
  
  await browser.close();
  console.log(`[✓] PDF generated successfully: ${outputPdfPath}`);
}

const htmlFile = process.argv[2];
const outputPdf = process.argv[3] || 'argus_report.pdf';

if (!htmlFile) {
  console.log('Usage: node scripts/generate_legal_pdf.js <path-to-report.html> [output.pdf]');
  process.exit(1);
}

convertHtmlToPdf(htmlFile, outputPdf).catch(console.error);
