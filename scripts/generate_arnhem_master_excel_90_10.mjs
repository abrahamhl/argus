import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import ExcelJS from local node_modules
import ExcelJS from '../apps/console/node_modules/exceljs/excel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_arnhem_scanned_results.json');
const OUTPUT_EXCEL = path.join(ROOT_DIR, 'ARGUS_ARNHEM_LEADS.xlsx');

const rawData = fs.readFileSync(DATA_FILE, 'utf8');
const businesses = JSON.parse(rawData);

console.log(`Building enhanced Master Excel with 90/10 model for ${businesses.length} Arnhem businesses...`);

function calculateEconomics(biz) {
  let totalEur = biz.debbiePitch?.indicativePriceEur || 495;
  let serviceName = biz.debbiePitch?.estimatedService || 'E-mail & Website Beveiliging';

  const hasDmarcIssue = biz.findings.some(f => f.category === 'EMAIL_SECURITY');
  const hasPrivacyIssue = biz.findings.some(f => f.category === 'PRIVACY_CONFIGURATION');
  const hasHardeningIssue = biz.findings.some(f => f.category === 'WEB_SECURITY_HARDENING');

  if (hasDmarcIssue && hasPrivacyIssue && hasHardeningIssue) {
    serviceName = 'Compleet Beveiligings- & Compliancepakket (E-mail + Privacy + Headers)';
    totalEur = 995;
  } else if (hasPrivacyIssue && !hasDmarcIssue) {
    serviceName = 'AVG Privacy & Cookie Compliance Inrichting';
    totalEur = 650;
  } else if (hasDmarcIssue) {
    serviceName = 'E-mail Authenticatie & Anti-Spoofing (DMARC / SPF / DKIM)';
    totalEur = 495;
  } else if (totalEur < 350) {
    totalEur = 450;
  }

  const abrahamShare = Math.round(totalEur * 0.90 * 100) / 100;
  const debbieShare = Math.round(totalEur * 0.10 * 100) / 100;

  const monthlyRetainerEur = 149;
  const monthlyAbraham = 134.10;
  const monthlyDebbie = 14.90;

  return {
    serviceName,
    totalEur,
    abrahamShare,
    debbieShare,
    monthlyRetainerEur,
    monthlyAbraham,
    monthlyDebbie
  };
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ARGUS Autonomous Intelligence Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Common styling rules
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

  // -------------------------------------------------------------
  // SHEET 1: SALES & 90/10 MODEL (Abraham & Debbie)
  // -------------------------------------------------------------
  const sheetSales = workbook.addWorksheet('SALES_ABRAHAM_DEBBIE', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }]
  });

  sheetSales.columns = [
    { header: 'Prioriteit', key: 'priority', width: 12 },
    { header: 'Score', key: 'score', width: 9 },
    { header: 'Bedrijfsnaam', key: 'company', width: 28 },
    { header: 'Sector / Categorie', key: 'category', width: 22 },
    { header: 'Adres in Arnhem', key: 'address', width: 30 },
    { header: 'Telefoon (Geverifieerd)', key: 'phone', width: 22 },
    { header: 'Website / Domein', key: 'website', width: 24 },
    { header: 'Aanbevolen Dienst', key: 'service', width: 34 },
    { header: 'Vaste Prijs (€)', key: 'totalEur', width: 15 },
    { header: 'Omzet Abraham (90% €)', key: 'abrahamShare', width: 20 },
    { header: 'Commissie Debbie (10% €)', key: 'debbieShare', width: 20 },
    { header: 'Maandabonnement (€)', key: 'monthlyTotal', width: 18 },
    { header: 'Abraham Mnd (90%)', key: 'monthlyAbraham', width: 18 },
    { header: 'Debbie Mnd (10%)', key: 'monthlyDebbie', width: 18 },
    { header: 'Debbie Praatkaart (30s NL)', key: 'debbiePitch', width: 44 },
    { header: 'Zakelijke Impact (Waarom betalen)', key: 'whyCare', width: 42 },
    { header: 'Garantie & Oplossing Abraham', key: 'abrahamFix', width: 40 },
    { header: 'Directie Brief Dossier', key: 'briefPath', width: 30 },
    { header: 'Pipeline Status', key: 'pipelineStage', width: 16 }
  ];

  sheetSales.getRow(1).height = 32;
  sheetSales.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  // Sort by priority (Red > Orange > Yellow > Green > Gray) then by sales score
  const priorityOrder = { '🟥': 1, '🟧': 2, '🟨': 3, '🟩': 4, '⬜': 5 };
  const sortedSales = [...businesses].sort((a, b) => {
    const pA = priorityOrder[a.scores?.priorityColor] || 99;
    const pB = priorityOrder[b.scores?.priorityColor] || 99;
    if (pA !== pB) return pA - pB;
    return (b.scores?.salesPriority || 0) - (a.scores?.salesPriority || 0);
  });

  sortedSales.forEach((r, idx) => {
    const eco = calculateEconomics(r);
    const row = sheetSales.addRow({
      priority: r.scores?.priorityColor || '⬜',
      score: r.scores?.salesPriority || 0,
      company: r.business_name,
      category: r.category,
      address: r.address || 'Arnhem',
      phone: r.phone_public || (r.public_contact ? `E-mail: ${r.public_contact}` : 'Fysiek Binnenlopen'),
      website: r.website || `https://${r.domain}`,
      service: eco.serviceName,
      totalEur: eco.totalEur,
      abrahamShare: eco.abrahamShare,
      debbieShare: eco.debbieShare,
      monthlyTotal: eco.monthlyRetainerEur,
      monthlyAbraham: eco.monthlyAbraham,
      monthlyDebbie: eco.monthlyDebbie,
      debbiePitch: r.debbiePitch?.oneLinerNL || 'Controleer e-mail authenticatie en headers.',
      whyCare: r.debbiePitch?.whyCareNL || 'Grote mailservers zoals Gmail weren onbetrouwbare afzenders.',
      abrahamFix: r.findings?.[0]?.suggested_remediation || 'Configureer DNS TXT DMARC record en TLS headers.',
      briefPath: `reports/${r.company_id}/BRIEF_AAN_DIRECTIE.html`,
      pipelineStage: idx < 15 ? 'VANDAAG CONTACT' : 'NIEUW'
    });

    row.height = 24;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };

      // Number formatting
      if ([9, 10, 11, 12, 13, 14].includes(colNum)) {
        cell.numFmt = '€#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // Priority formatting
      if (colNum === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (r.scores?.priorityColor === '🟥') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { bold: true, color: { argb: 'FF991B1B' } };
        } else if (r.scores?.priorityColor === '🟧') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
          cell.font = { bold: true, color: { argb: 'FF9A3412' } };
        } else if (r.scores?.priorityColor === '🟨') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
          cell.font = { bold: true, color: { argb: 'FF854D0E' } };
        } else if (r.scores?.priorityColor === '🟩') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { bold: true, color: { argb: 'FF166534' } };
        }
      }

      // Highlight Abraham (90%) and Debbie (10%) columns
      if (colNum === 10) {
        cell.font = { bold: true, color: { argb: 'FF0284C7' } }; // Sky-600
      }
      if (colNum === 11) {
        cell.font = { bold: true, color: { argb: 'FF16A34A' } }; // Green-600
      }
    });
  });

  sheetSales.autoFilter = { from: 'A1', to: 'S1' };

  // -------------------------------------------------------------
  // SHEET 2: TECHNICAL (Diagnostics & Evidence)
  // -------------------------------------------------------------
  const sheetTech = workbook.addWorksheet('TECHNICAL_DIAGNOSTICS', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
  });

  sheetTech.columns = [
    { header: 'Bedrijfsnaam', key: 'company', width: 26 },
    { header: 'Domein', key: 'domain', width: 22 },
    { header: 'IP Adres', key: 'ip', width: 16 },
    { header: 'HTTP Bereikbaar', key: 'reachable', width: 15 },
    { header: 'Status Code', key: 'status', width: 12 },
    { header: 'HTTPS Verplicht', key: 'https', width: 15 },
    { header: 'TLS Certificaatgeldigheid (Dagen)', key: 'tlsDays', width: 20 },
    { header: 'TLS Uitgever', key: 'tlsIssuer', width: 20 },
    { header: 'HSTS Header', key: 'hsts', width: 14 },
    { header: 'CSP Header', key: 'csp', width: 14 },
    { header: 'X-Frame-Options', key: 'xfo', width: 15 },
    { header: 'X-Content-Type', key: 'xcto', width: 14 },
    { header: 'SPF Record', key: 'spf', width: 34 },
    { header: 'DMARC Record', key: 'dmarc', width: 34 },
    { header: 'Waargenomen Trackers', key: 'trackers', width: 26 },
    { header: 'Cookiebanner Aanwezig', key: 'banner', width: 18 },
    { header: 'Pre-consent Risico', key: 'preConsent', width: 16 },
    { header: 'Aantal Bevindingen', key: 'findingCount', width: 16 }
  ];

  sheetTech.getRow(1).height = 32;
  sheetTech.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  sortedSales.forEach((r) => {
    const row = sheetTech.addRow({
      company: r.business_name,
      domain: r.domain,
      ip: r.dns?.ip || 'NXDOMAIN',
      reachable: r.http?.reachable ? 'JA' : 'NEE',
      status: r.http?.statusCode || 0,
      https: r.http?.httpsEnforced ? 'JA' : 'NEE',
      tlsDays: r.tls?.daysRemaining !== null ? r.tls?.daysRemaining : 'N/A',
      tlsIssuer: r.tls?.issuer || 'Onbekend',
      hsts: r.http?.hsts ? 'Actief' : 'Ontbreekt',
      csp: r.http?.csp ? 'Actief' : 'Ontbreekt',
      xfo: r.http?.xfo ? 'Actief' : 'Ontbreekt',
      xcto: r.http?.xcto ? 'Actief' : 'Ontbreekt',
      spf: r.dns?.spf || 'Geen',
      dmarc: r.dns?.dmarc || 'Geen',
      trackers: r.privacy?.thirdPartyTrackers?.join(', ') || 'Geen gedetecteerd',
      banner: r.privacy?.consentBannerDetected ? 'Ja' : 'Nee',
      preConsent: r.privacy?.preConsentTrackingRisk ? 'JA (Aandacht)' : 'Nee',
      findingCount: r.findings?.length || 0
    });

    row.height = 20;
    row.eachCell((cell) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle' };
    });
  });

  sheetTech.autoFilter = { from: 'A1', to: 'R1' };

  // -------------------------------------------------------------
  // SHEET 3: FINDINGS (All 672 Normalized Observations)
  // -------------------------------------------------------------
  const sheetFindings = workbook.addWorksheet('ALL_FINDINGS', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetFindings.columns = [
    { header: 'Finding ID', key: 'id', width: 28 },
    { header: 'Bedrijfsnaam', key: 'company', width: 26 },
    { header: 'Domein', key: 'domain', width: 22 },
    { header: 'Categorie', key: 'category', width: 24 },
    { header: 'Titel van de Bevinding', key: 'title', width: 34 },
    { header: 'Ernst (Geverifieerd)', key: 'severity', width: 16 },
    { header: 'Betrouwbaarheid', key: 'confidence', width: 16 },
    { header: 'Locatie van Bewijs', key: 'location', width: 26 },
    { header: 'Gewone Mensentaal Uitleg', key: 'plainDesc', width: 42 },
    { header: 'Zakelijke Impact', key: 'impact', width: 40 },
    { header: 'Aanbevolen Oplossing', key: 'remediation', width: 40 },
    { header: 'Geschatte Complexiteit', key: 'complexity', width: 18 }
  ];

  sheetFindings.getRow(1).height = 32;
  sheetFindings.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  sortedSales.forEach((r) => {
    (r.findings || []).forEach((f) => {
      const row = sheetFindings.addRow({
        id: f.finding_id,
        company: r.business_name,
        domain: r.domain,
        category: f.category,
        title: f.finding_title,
        severity: f.severity_if_confirmed,
        confidence: f.confidence,
        location: f.evidence_location,
        plainDesc: f.plain_language_description,
        impact: f.customer_impact,
        remediation: f.suggested_remediation,
        complexity: f.estimated_remediation_complexity
      });

      row.height = 22;
      row.eachCell((cell, colNum) => {
        cell.border = cellBorder;
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (colNum === 6) {
          if (f.severity_if_confirmed === 'HIGH') {
            cell.font = { bold: true, color: { argb: 'FFDC2626' } };
          } else if (f.severity_if_confirmed === 'MEDIUM') {
            cell.font = { bold: true, color: { argb: 'FFD97706' } };
          }
        }
      });
    });
  });

  sheetFindings.autoFilter = { from: 'A1', to: 'L1' };

  // -------------------------------------------------------------
  // SHEET 4: COMMERCIAL_MODEL_90_10 (Revenue Projections)
  // -------------------------------------------------------------
  const sheetModel = workbook.addWorksheet('COMMERCIAL_MODEL_90_10');
  sheetModel.columns = [
    { header: 'Scenario', key: 'scenario', width: 25 },
    { header: 'Gesloten Deals', key: 'deals', width: 16 },
    { header: 'Totale Omzet (€)', key: 'totalRevenue', width: 20 },
    { header: 'Omzet Abraham (90% €)', key: 'abrahamRevenue', width: 24 },
    { header: 'Commissie Debbie (10% €)', key: 'debbieCommission', width: 24 },
    { header: 'Maandelijkse Retainers (€/mnd)', key: 'monthlyTotal', width: 24 },
    { header: 'Abraham MRR (90% €/mnd)', key: 'abrahamMrr', width: 24 },
    { header: 'Debbie MRR (10% €/mnd)', key: 'debbieMrr', width: 24 }
  ];

  sheetModel.getRow(1).height = 32;
  sheetModel.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const scenarios = [
    { name: 'Maandag Kickstart (Conservatief)', deals: 3, avgPrice: 650 },
    { name: 'Arnhem Week 1 Doelstelling', deals: 8, avgPrice: 650 },
    { name: 'Volledige 40 Rode Leads Conversie (25%)', deals: 10, avgPrice: 750 },
    { name: 'Grote Maandcampagne (50% van Rode Leads)', deals: 20, avgPrice: 850 }
  ];

  scenarios.forEach(sc => {
    const tot = sc.deals * sc.avgPrice;
    const abr = tot * 0.90;
    const deb = tot * 0.10;
    const mTotal = sc.deals * 149;
    const mAbr = mTotal * 0.90;
    const mDeb = mTotal * 0.10;

    const row = sheetModel.addRow({
      scenario: sc.name,
      deals: sc.deals,
      totalRevenue: tot,
      abrahamRevenue: abr,
      debbieCommission: deb,
      monthlyTotal: mTotal,
      abrahamMrr: mAbr,
      debbieMrr: mDeb
    });

    row.height = 26;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle' };
      if ([3, 4, 5, 6, 7, 8].includes(colNum)) {
        cell.numFmt = '€#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (colNum === 4) cell.font = { bold: true, color: { argb: 'FF0284C7' } };
      if (colNum === 5) cell.font = { bold: true, color: { argb: 'FF16A34A' } };
    });
  });

  // -------------------------------------------------------------
  // SHEET 5: DEFINITIONS & ROSETTA STONE
  // -------------------------------------------------------------
  const sheetDef = workbook.addWorksheet('DEBBIE_ROSETTA_STONE', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetDef.columns = [
    { header: 'Technisch Begrip', key: 'term', width: 24 },
    { header: 'Eenvoudig Nederlands (Debbie)', key: 'simpleNl', width: 34 },
    { header: 'Wat het Betekent voor de Klant', key: 'businessMeaning', width: 44 },
    { header: 'Wat Absoluut NIET te Zeggen (Anti-Alarmisme)', key: 'whatNotToSay', width: 45 },
    { header: 'Oplossing door Abraham', key: 'fixByAbraham', width: 38 }
  ];

  sheetDef.getRow(1).height = 32;
  sheetDef.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const definitions = [
    {
      term: 'DMARC (Missing / p=none)',
      simpleNl: 'Anti-spookmail en e-mailslot',
      businessMeaning: 'Zonder DMARC kan iedereen e-mails sturen die eruitzien alsof ze van uw domein komen (bijv. valse facturen naar cliënten).',
      whatNotToSay: 'Zeg NOOIT: "Uw e-mail is gehackt." Zeg WEL: "Uw domein heeft nog geen actief slot tegen identiteitsnabootsing."',
      fixByAbraham: 'DNS TXT record instellen met quarantine/reject en RUA rapportage.'
    },
    {
      term: 'SPF (Sender Policy Framework)',
      simpleNl: 'Lijst met goedgekeurde mailservers',
      businessMeaning: 'Bepaalt welke servers namens uw bedrijf e-mails mogen afleveren.',
      whatNotToSay: 'Zeg NOOIT: "U overtreedt de telecomwet." Zeg WEL: "Uw e-mailverzendlijst is nog niet sluitend geconfigureerd."',
      fixByAbraham: 'SPF record strak zetten met -all in plaats van ~all.'
    },
    {
      term: 'HSTS (HTTP Strict Transport Security)',
      simpleNl: 'Gedwongen versleuteling',
      businessMeaning: 'Zorgt ervoor dat browsers ALTIJD via HTTPS verbinden en niet kunnen worden teruggeduwd naar onveilig HTTP op openbare wifi.',
      whatNotToSay: 'Zeg NOOIT: "Uw certificaat is lek." Zeg WEL: "De automatische dwang voor de allerbeste versleuteling ontbreekt nog."',
      fixByAbraham: 'Webserver header Strict-Transport-Security toevoegen.'
    },
    {
      term: 'Pre-consent Trackers (AVG/GDPR)',
      simpleNl: 'Marketingcookies vóór toestemming',
      businessMeaning: 'Analytische scripts van Google of Meta laden al in voordat de bezoeker akkoord heeft kunnen klikken op een banner.',
      whatNotToSay: 'Zeg NOOIT: "U krijgt een miljoenenboete van de Autoriteit Persoonsgegevens." Zeg WEL: "Uw cookie-instelling kan AVG-vriendelijker worden ingericht."',
      fixByAbraham: 'Nette AVG banner inrichten die cookies pauzeert tot akkoord.'
    },
    {
      term: 'X-Frame-Options (Clickjacking)',
      simpleNl: 'Bescherming tegen onzichtbaar nabootsen',
      businessMeaning: 'Voorkomt dat kwaadwillende websites uw site in een onzichtbaar kader laden om valse klikken van bezoekers uit te lokken.',
      whatNotToSay: 'Zeg NOOIT: "Uw site wordt overgenomen." Zeg WEL: "Er ontbreekt een vinkje dat voorkomt dat anderen uw site inlijsten."',
      fixByAbraham: 'Header X-Frame-Options: SAMEORIGIN instellen.'
    }
  ];

  definitions.forEach(d => {
    const row = sheetDef.addRow(d);
    row.height = 24;
    row.eachCell((cell) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  sheetDef.autoFilter = { from: 'A1', to: 'E1' };

  await workbook.xlsx.writeFile(OUTPUT_EXCEL);
  console.log(`✅ ARGUS_ARNHEM_LEADS.xlsx successfully updated at ${OUTPUT_EXCEL}!`);
}

main().catch(err => {
  console.error('Error generating Excel:', err);
  process.exit(1);
});
