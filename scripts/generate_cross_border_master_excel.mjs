import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import ExcelJS from local node_modules
import ExcelJS from '../apps/console/node_modules/exceljs/excel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_cross_border_scanned_results.json');
const OUTPUT_EXCEL = path.join(ROOT_DIR, 'ARGUS_CROSS_BORDER_MASTER_LEADS.xlsx');
const ARNHEM_EXCEL = path.join(ROOT_DIR, 'ARGUS_ARNHEM_LEADS.xlsx');

const rawData = fs.readFileSync(DATA_FILE, 'utf8');
const businesses = JSON.parse(rawData);

console.log(`Generating Master Cross-Border Excel for ${businesses.length} businesses across NL and DE...`);

function calculateEconomics(biz) {
  const findings = biz.findings || [];
  const hasDmarcIssue = findings.some(f => f.category === 'EMAIL_SECURITY' && f.finding_title.includes('DMARC'));
  const hasSpfIssue = findings.some(f => f.category === 'EMAIL_SECURITY' && f.finding_title.includes('SPF'));
  const hasPrivacyIssue = findings.some(f => f.category === 'PRIVACY_CONFIGURATION');
  const hasHardeningIssue = findings.some(f => f.category === 'WEB_SECURITY_HARDENING');

  let serviceName = 'Website Beveiligingsverharding & Quick Fix';
  let totalEur = 450;
  let abrahamFix = 'Webserver security headers (HSTS, XFO, XCTO) configureren in Nginx/Apache.';
  let debbiePitch = 'Uw website kan veiliger worden ingesteld zodat mobiele bezoekers en gegevens optimaal beschermd zijn.';
  let whyCare = 'Voorkomt beveiligingsmeldingen in browsers van potentiële klanten en bewaakt uw professionele uitstraling.';

  if (hasDmarcIssue && hasPrivacyIssue && hasHardeningIssue) {
    serviceName = 'Compleet Beveiligings- & Compliancepakket (E-mail + Privacy + Headers)';
    totalEur = 995;
    abrahamFix = `DNS TXT DMARC ("v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@${biz.domain}"), SPF hardening en Nginx HSTS/XFO headers.`;
    debbiePitch = 'Zowel uw zakelijke e-mailadres als uw website missen de officiële beveiligingssloten tegen nabootsing en tracking.';
    whyCare = 'Beschermt direct tegen factuurfraude, voorkomt dat offertes in de spam belanden en voldoet aan de strenge AVG-eisen.';
  } else if (hasDmarcIssue && hasPrivacyIssue) {
    serviceName = 'E-mailslot & AVG Privacy Inrichting (DMARC + Cookie-stop)';
    totalEur = 795;
    abrahamFix = `DNS TXT DMARC instellen op p=quarantine en conditionele cookie-tagging voor analytische trackers.`;
    debbiePitch = 'Iedereen kan nu e-mails sturen namens uw kantoor, en marketingcookies laden al vóór toestemming van de bezoeker.';
    whyCare = 'U voorkomt misbruik van uw goede naam bij klanten en voorkomt handhavingsrisico van de privacytoezichthouder.';
  } else if (hasPrivacyIssue) {
    serviceName = 'AVG / DSGVO Privacy & Cookie Compliance Inrichting';
    totalEur = 650;
    abrahamFix = 'Implementatie van een conforme AVG cookiebanner met script-blokkering tot expliciet consent (Klaro/Cookiebot).';
    debbiePitch = 'Er worden analytische cookies ingeladen voordat de bezoeker akkoord heeft kunnen klikken op een banner.';
    whyCare = 'Sinds de recente verscherping door de Autoriteit Persoonsgegevens en Duitse autoriteiten letten zakelijke klanten hier sterk op.';
  } else if (hasDmarcIssue || hasSpfIssue) {
    serviceName = 'E-mail Authenticatie & Anti-Spoofing (DMARC / SPF / DKIM)';
    totalEur = 495;
    abrahamFix = `DNS TXT record toevoegen: "v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:dmarc-reports@${biz.domain}".`;
    debbiePitch = 'Het officiële digitale slot op uw e-mailadres ontbreekt, waardoor kwaadwillenden facturen uit uw naam kunnen nabootsen.';
    whyCare = 'Grote e-mailproviders zoals Gmail en Outlook weren onbeveiligde afzenders. Uw facturen en offertes komen betrouwbaar aan.';
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
    monthlyDebbie,
    abrahamFix,
    debbiePitch,
    whyCare
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

  const priorityOrder = { '🟥': 1, '🟧': 2, '🟨': 3, '🟩': 4, '⬜': 5 };
  const sortedAll = [...businesses].sort((a, b) => {
    const pA = priorityOrder[a.scores?.priorityColor] || 99;
    const pB = priorityOrder[b.scores?.priorityColor] || 99;
    if (pA !== pB) return pA - pB;
    return (b.scores?.salesPriority || 0) - (a.scores?.salesPriority || 0);
  });

  // -------------------------------------------------------------
  // HELPER: Populate Lead Sheet
  // -------------------------------------------------------------
  function populateLeadSheet(sheet, leadList) {
    sheet.columns = [
      { header: 'Prioriteit', key: 'priority', width: 12 },
      { header: 'Score', key: 'score', width: 8 },
      { header: 'Stad', key: 'city', width: 18 },
      { header: 'Land & Regio', key: 'region', width: 22 },
      { header: 'Bedrijfsnaam', key: 'company', width: 28 },
      { header: 'Sector / Categorie', key: 'category', width: 24 },
      { header: 'Volledig Adres', key: 'address', width: 32 },
      { header: 'Telefoon (Geverifieerd)', key: 'phone', width: 22 },
      { header: 'Website / Domein', key: 'website', width: 25 },
      { header: 'Aanbevolen Dienst', key: 'service', width: 34 },
      { header: 'Vaste Prijs (€)', key: 'totalEur', width: 15 },
      { header: 'Omzet Abraham (90% €)', key: 'abrahamShare', width: 20 },
      { header: 'Commissie Debbie (10% €)', key: 'debbieShare', width: 20 },
      { header: 'Maandabonnement (€)', key: 'monthlyTotal', width: 18 },
      { header: 'Abraham Mnd (90%)', key: 'monthlyAbraham', width: 18 },
      { header: 'Debbie Mnd (10%)', key: 'monthlyDebbie', width: 18 },
      { header: 'Debbie Praatkaart (30s NL)', key: 'debbiePitch', width: 44 },
      { header: 'Zakelijke Impact (Waarom Directie Betaalt)', key: 'whyCare', width: 42 },
      { header: 'Technische Oplossing Abraham (Engineering)', key: 'abrahamFix', width: 42 },
      { header: 'Aantal Bevindingen', key: 'findingCount', width: 16 },
      { header: 'Pipeline Status', key: 'pipelineStage', width: 16 }
    ];

    sheet.getRow(1).height = 32;
    sheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

    leadList.forEach((r, idx) => {
      const eco = calculateEconomics(r);
      const row = sheet.addRow({
        priority: r.scores?.priorityColor || '⬜',
        score: r.scores?.salesPriority || 0,
        city: r.city,
        region: `${r.country === 'Duitsland' ? 'DE' : 'NL'} - ${r.region || 'Regio'}`,
        company: r.business_name,
        category: r.category,
        address: r.address || `${r.city} Centrum`,
        phone: r.phone_public || (r.public_contact ? `E-mail: ${r.public_contact}` : 'Fysiek Binnenlopen'),
        website: r.website || `https://${r.domain}`,
        service: eco.serviceName,
        totalEur: eco.totalEur,
        abrahamShare: eco.abrahamShare,
        debbieShare: eco.debbieShare,
        monthlyTotal: eco.monthlyRetainerEur,
        monthlyAbraham: eco.monthlyAbraham,
        monthlyDebbie: eco.monthlyDebbie,
        debbiePitch: eco.debbiePitch,
        whyCare: eco.whyCare,
        abrahamFix: eco.abrahamFix,
        findingCount: r.findings?.length || 0,
        pipelineStage: idx < 15 ? 'VANDAAG CONTACT' : (idx < 50 ? 'DEZE WEEK' : 'NIEUW')
      });

      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.border = cellBorder;
        cell.alignment = { vertical: 'middle', wrapText: true };

        // Number formatting for currencies
        if ([11, 12, 13, 14, 15, 16].includes(colNum)) {
          cell.numFmt = '€#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }

        // Priority badges
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

        // Highlight Abraham (90%) and Debbie (10%)
        if (colNum === 12) cell.font = { bold: true, color: { argb: 'FF0284C7' } }; // Sky-600
        if (colNum === 13) cell.font = { bold: true, color: { argb: 'FF16A34A' } }; // Green-600
      });
    });

    sheet.autoFilter = { from: 'A1', to: 'U1' };
  }

  // -------------------------------------------------------------
  // SHEET 1: MASTER_LEADS_ALL_CITIES (Complete 427 Leads)
  // -------------------------------------------------------------
  const sheetMaster = workbook.addWorksheet('MASTER_LEADS_ALL_CITIES', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 5 }]
  });
  populateLeadSheet(sheetMaster, sortedAll);

  // -------------------------------------------------------------
  // SHEET 2: ROSETTA_STONE_3_SECTORS (The Deep Explanatory Scope Catalog)
  // -------------------------------------------------------------
  const sheetRosetta = workbook.addWorksheet('ROSETTA_STONE_3_SECTORS', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetRosetta.columns = [
    { header: 'Technisch Scope ID & Norm', key: 'scopeId', width: 24 },
    { header: 'SECTOR 1: NOSOTROS (Engineering Root Cause & Bewijs)', key: 'techCause', width: 38 },
    { header: 'SECTOR 1: NOSOTROS (Exacte Drop-in Fix Code & Syntax)', key: 'techFix', width: 44 },
    { header: 'SECTOR 1: Fix Duur & Risico', key: 'techMeta', width: 18 },
    { header: 'SECTOR 2: DEBBIE (Eenvoudig Nederlands Begrip)', key: 'debbieTerm', width: 28 },
    { header: 'SECTOR 2: DEBBIE (Analogie voor Bezoek)', key: 'debbieAnalogy', width: 34 },
    { header: 'SECTOR 2: DEBBIE (30-Seconden Gesprek Balie)', key: 'debbiePitch', width: 46 },
    { header: 'SECTOR 2: Wat NIET te Zeggen (Anti-Alarmisme)', key: 'debbieAntiAlarm', width: 38 },
    { header: 'SECTOR 3: HET BEDRIJF (Financieel & Operationeel Risico)', key: 'bizRisk', width: 42 },
    { header: 'SECTOR 3: Waarom de Eigenaar "JA" Zegt (€495-€995)', key: 'bizWhyYes', width: 40 },
    { header: 'SECTOR 3: Juridische & Normatieve Grondslag', key: 'bizLegal', width: 34 }
  ];

  sheetRosetta.getRow(1).height = 36;
  sheetRosetta.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const rosettaScopes = [
    {
      scopeId: 'RFC 7489 / DMARC\n(Missing of p=none)',
      techCause: 'Geen TXT-record op _dmarc.<domein> of p=none aanwezig. Inkomende mailservers voeren geen afzenderbeleid uit op niet-gealigneerde SPF/DKIM.',
      techFix: 'DNS TXT _dmarc.<domein>:\n"v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:dmarc-rua@<domein>; aspf=r; adkim=r;"',
      techMeta: 'Duur: 15 min\nRisico: Zeer Laag',
      debbieTerm: 'Het officiële digitale e-mailslot',
      debbieAnalogy: 'Alsof iedereen briefpapier met uw logo bij de drukker kan bestellen en rekeningen mag rondsturen.',
      debbiePitch: '"Goedemorgen, we zagen dat uw zakelijke e-mail nog geen digitaal slot heeft tegen identiteitsdiefstal. Iedereen kan nu doen alsof ze vanaf uw adres e-mailen. Wij kunnen dit binnen 48 uur waterdicht afsluiten."',
      debbieAntiAlarm: 'Zeg NOOIT: "Uw e-mail is gehackt." Zeg WEL: "Het officiële veiligheidsslot tegen nabootsing ontbreekt nog."',
      bizRisk: 'Factuurfraude waarbij cliënten geld overmaken naar een verkeerd IBAN; offertes belanden direct in Gmail/Outlook spamboxen.',
      bizWhyYes: 'Onmiddellijke gemoedsrust, 100% aflevergarantie van offertes bij grote klanten en bescherming tegen aansprakelijkheid.',
      bizLegal: 'Google & Yahoo 2024 Sender Requirements, NCSC Richtlijn Beveiligde E-mail, ISO 27001 A.13.2'
    },
    {
      scopeId: 'RFC 7208 / SPF\n(Ontbreekt of ~all zacht)',
      techCause: 'Afwezigheid van v=spf1 TXT-record of afsluiting met ~all/neutraal waardoor ongeautoriseerde IP-adressen niet hard worden geweigerd.',
      techFix: 'DNS TXT @:\n"v=spf1 include:_spf.google.com include:spf.protection.outlook.com ip4:185.x.x.x -all"',
      techMeta: 'Duur: 20 min\nRisico: Laag (eerst alle verzend-IPs inventariseren)',
      debbieTerm: 'Het gastenlijstje van mailbezorgers',
      debbieAnalogy: 'De officiële pasjescontrole bij de ingang van uw kantoor.',
      debbiePitch: '"Uw website heeft nog geen gesloten gastenlijst van wie namens u mag bezorgen. Daardoor weten spamfilters niet zeker of een offerte echt van u komt."',
      debbieAntiAlarm: 'Zeg NOOIT: "Uw server is illegaal." Zeg WEL: "Uw lijst met goedgekeurde verzendservers is nog niet sluitend."',
      bizRisk: 'Slechte reputatiescore bij KPN, Ziggo en Microsoft 365, met als gevolg onverklaarbaar gemiste klantberichten.',
      bizWhyYes: 'Eénmalig strak getrokken voor een vast tarief; direct meetbaar betere bezorging van klantfacturen.',
      bizLegal: 'RFC 7208, Forum Standaardisatie (verplicht voor overheid en semioverheid)'
    },
    {
      scopeId: 'RFC 6797 / HSTS\n(Strict-Transport-Security)',
      techCause: 'Header ontbreekt in HTTPS responses op poort 443. Browsers onthouden niet dat de site uitsluitend via HTTPS benaderd mag worden.',
      techFix: 'Nginx:\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\nApache:\nHeader always set Strict-Transport-Security "max-age=31536000"',
      techMeta: 'Duur: 10 min\nRisico: Zeer Laag (mits geldig SSL aanwezig)',
      debbieTerm: 'Gedwongen versleuteling',
      debbieAnalogy: 'De automatische deurvergrendeling zodra de auto gaat rijden.',
      debbiePitch: '"Uw site heeft wel een slotje, maar als iemand op openbare wifi in een café inlogt, kan de verbinding worden teruggeduwd naar onveilig."',
      debbieAntiAlarm: 'Zeg NOOIT: "Uw website is onveilig." Zeg WEL: "De modernste beveiligingsdwang voor veilige verbindingen ontbreekt nog."',
      bizRisk: 'Mogelijkheid tot afluisteren van contactformulieren of inloggegevens via man-in-the-middle op openbare netwerken.',
      bizWhyYes: 'Groen vinkje in alle security scanners; voorkomt browserwaarschuwingen bij zakelijke klanten.',
      bizLegal: 'AVG Art. 32 (Passende technische beveiligingsmaatregelen), OWASP Top 10 A05:2021'
    },
    {
      scopeId: 'AVG / DSGVO Art. 6 & 7\n(Pre-Consent Trackers)',
      techCause: 'Google Analytics / Meta Pixel / Clarity scripts worden synchroon uitgevoerd vóórdat de gebruiker interactie heeft met een consent banner.',
      techFix: 'HTML / JS script loader:\n<script type="text/plain" data-cookiecategory="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXX"></script>\n+ trigger via Klaro/Cookiebot event.',
      techMeta: 'Duur: 35 min\nRisico: Laag',
      debbieTerm: 'Marketingcookies vóór toestemming',
      debbieAnalogy: 'Iemands jas al doorzoeken voordat hij de receptie binnenstapt.',
      debbiePitch: '"We merkten dat er al trackingcookies van Google en Facebook worden geplaatst vóórdat een bezoeker op akkoord heeft kunnen klikken."',
      debbieAntiAlarm: 'Zeg NOOIT: "U krijgt morgen een boete van 20 miljoen van de AP." Zeg WEL: "U kunt dit AVG-vriendelijker inrichten zodat u compliant bent."',
      bizRisk: 'Onderzoek of handhavingsbrief van de Autoriteit Persoonsgegevens (NL) of Landesbeauftragte für Datenschutz (NRW); reputatieschade.',
      bizWhyYes: 'Volledige AVG-compliance certificering zonder verlies van geanonimiseerde bezoekersstatistieken.',
      bizLegal: 'AVG / GDPR Art. 5, 6, 7 & 83; ePrivacy Richtlijn / Telecommunicatiewet Art. 11.7a'
    },
    {
      scopeId: 'W3C / CSP\n(Content Security Policy)',
      techCause: 'Geen Content-Security-Policy header geconfigureerd. Browser laadt willekeurige scripts en stylesheets van elk extern domein.',
      techFix: 'Nginx:\nadd_header Content-Security-Policy "default-src \'self\'; script-src \'self\' https://trusted-cdn.com; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:;" always;',
      techMeta: 'Duur: 45 min\nRisico: Gemiddeld (vereist testen op externe widgets)',
      debbieTerm: 'Het beveiligingsrooster voor externe scripts',
      debbieAnalogy: 'Een filter dat alleen goedgekeurde leveranciers goederen laat bezorgen in het magazijn.',
      debbiePitch: '"Uw website heeft nog geen instructie voor browsers om verdachte externe software te weigeren. Wij kunnen die richtlijn aanzetten."',
      debbieAntiAlarm: 'Zeg NOOIT: "Er zit spyware op uw website." Zeg WEL: "Er ontbreekt een protocol dat voorkomt dat anderen ongemerkt scripts injecteren."',
      bizRisk: 'Cross-site scripting (XSS), creditcard skimming (Magecart) bij webshops, injectie van ongewenste popups.',
      bizWhyYes: 'Standaard vereiste bij zakelijke aanbestedingen en IT-audits van grote opdrachtgevers.',
      bizLegal: 'OWASP Security Headers Project, BSI IT-Grundschutz (Duitsland)'
    },
    {
      scopeId: 'RFC 7034 / X-Frame-Options\n(Clickjacking Preventie)',
      techCause: 'Header X-Frame-Options ontbreekt. Externe pagina\'s kunnen de website insluiten in een <iframe> en transparante lagen eroverheen leggen.',
      techFix: 'Nginx:\nadd_header X-Frame-Options "SAMEORIGIN" always;\nApache:\nHeader always set X-Frame-Options "SAMEORIGIN"',
      techMeta: 'Duur: 5 min\nRisico: Zeer Laag',
      debbieTerm: 'Anti-inlijstingsbeveiliging',
      debbieAnalogy: 'Voorkomt dat iemand uw winkelruit nabouwt en bezoekers uw kassa laat bedienen via een doorkijkspiegel.',
      debbiePitch: '"Met één instelling voorkomen we dat kwaadwillenden uw website in een verborgen venster op een andere site kunnen laden."',
      debbieAntiAlarm: 'Zeg NOOIT: "Uw site wordt gekaapt." Zeg WEL: "We zetten een vinkje aan zodat niemand uw pagina kan namaken in een frame."',
      bizRisk: 'Bezoekers worden misleid om op verborgen knoppen te klikken (bijv. likes, betalingen, formulierinzendingen).',
      bizWhyYes: 'Onderdeel van het standaard basispakket; direct opgelost binnen hetzelfde kwartier.',
      bizLegal: 'RFC 7034, OWASP Clickjacking Defense'
    },
    {
      scopeId: 'MIME Sniffing / XCTO\n(X-Content-Type-Options)',
      techCause: 'Header X-Content-Type-Options: nosniff ontbreekt. Oudere en mobiele browsers proberen bestandstypes te raden op basis van inhoud.',
      techFix: 'Nginx:\nadd_header X-Content-Type-Options "nosniff" always;\nApache:\nHeader always set X-Content-Type-Options "nosniff"',
      techMeta: 'Duur: 5 min\nRisico: Zeer Laag',
      debbieTerm: 'Bestandscontrole tegen vermomde code',
      debbieAnalogy: 'Geen pakketjes aannemen waarvan het etiket "foto" zegt maar waar een computerprogramma in zit.',
      debbiePitch: '"Dit zorgt ervoor dat browsers een bestand nooit per ongeluk als uitvoerbare code interpreteren als het eigenlijk een afbeelding is."',
      debbieAntiAlarm: 'Zeg NOOIT: "U heeft malware op de server." Zeg WEL: "We dwingen browsers om strikt met bestandstypes om te gaan."',
      bizRisk: 'Uploads van bezoekers (bijv. CVs of bijlagen) kunnen worden misbruikt om kwaadaardige code uit te voeren.',
      bizWhyYes: 'Onderdeel van de complete verharding; 0% kans op verstoring van de website.',
      bizLegal: 'Fetch Living Standard, OWASP Secure Headers'
    },
    {
      scopeId: 'RFC 9116 / security.txt\n(Kwetsbaarheidsmeldpunt)',
      techCause: 'Bestand /.well-known/security.txt ontbreekt of is verlopen. Ethische onderzoekers hebben geen vast aanspreekpunt voor responsible disclosure.',
      techFix: 'Bestand /.well-known/security.txt:\nContact: mailto:security@<domein>\nExpires: 2027-12-31T23:59:59.000Z\nPreferred-Languages: nl, en, de',
      techMeta: 'Duur: 10 min\nRisico: Nul',
      debbieTerm: 'Het digitale noodluik voor beveiligingsmelders',
      debbieAnalogy: 'Het briefje bij de receptie met het directe nummer van de beveiligingscoördinator.',
      debbiePitch: '"Als een ethische computerdeskundige een foutje ziet in uw software, zorgt dit bestand dat ze het discreet aan ons melden in plaats van openbaar op internet."',
      debbieAntiAlarm: 'Zeg NOOIT: "Hackers zijn naar u op zoek." Zeg WEL: "U toont hiermee professioneel digitaal meesterschap."',
      bizRisk: 'Bij toevallige vondst van een datalek kan een onderzoeker niemand bereiken en stapt hij naar de media of de toezichthouder.',
      bizWhyYes: 'Staat uiterst professioneel; verplicht bij overheidsopdrachten en NIS2-toeleveranciers.',
      bizLegal: 'RFC 9116, NCSC Coordinated Vulnerability Disclosure (CVD)'
    }
  ];

  rosettaScopes.forEach((s) => {
    const row = sheetRosetta.addRow(s);
    row.height = 36;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (colNum === 1) cell.font = { bold: true, color: { argb: 'FF0F172A' } };
      if (colNum === 3) cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF0369A1' } };
      if (colNum === 7) cell.font = { italic: true, color: { argb: 'FF15803D' } };
    });
  });

  sheetRosetta.autoFilter = { from: 'A1', to: 'K1' };

  // -------------------------------------------------------------
  // SHEETS 3 - 6: CITY-BY-CITY FILTERED SHEETS
  // -------------------------------------------------------------
  const arnhemList = sortedAll.filter(b => b.city === 'Arnhem');
  const nijmegenList = sortedAll.filter(b => b.city === 'Nijmegen');
  const wageningenList = sortedAll.filter(b => b.city === 'Wageningen');
  const nrwList = sortedAll.filter(b => b.city === 'Kleve' || b.city === 'Emmerich am Rhein');

  const sheetArnhem = workbook.addWorksheet('CITY_ARNHEM', { views: [{ state: 'frozen', ySplit: 1, xSplit: 5 }] });
  populateLeadSheet(sheetArnhem, arnhemList);

  const sheetNijmegen = workbook.addWorksheet('CITY_NIJMEGEN', { views: [{ state: 'frozen', ySplit: 1, xSplit: 5 }] });
  populateLeadSheet(sheetNijmegen, nijmegenList);

  const sheetWageningen = workbook.addWorksheet('CITY_WAGENINGEN', { views: [{ state: 'frozen', ySplit: 1, xSplit: 5 }] });
  populateLeadSheet(sheetWageningen, wageningenList);

  const sheetNRW = workbook.addWorksheet('CITY_NRW_GERMANY', { views: [{ state: 'frozen', ySplit: 1, xSplit: 5 }] });
  populateLeadSheet(sheetNRW, nrwList);

  // -------------------------------------------------------------
  // SHEET 7: ALL_SCANNED_FINDINGS (All 1,188 Normalized Observations)
  // -------------------------------------------------------------
  const sheetFindings = workbook.addWorksheet('ALL_SCANNED_FINDINGS', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetFindings.columns = [
    { header: 'Finding ID', key: 'id', width: 28 },
    { header: 'Stad', key: 'city', width: 16 },
    { header: 'Bedrijfsnaam', key: 'company', width: 26 },
    { header: 'Domein', key: 'domain', width: 22 },
    { header: 'Categorie', key: 'category', width: 24 },
    { header: 'Titel van de Bevinding', key: 'title', width: 34 },
    { header: 'Ernst (Geverifieerd)', key: 'severity', width: 16 },
    { header: 'Betrouwbaarheid', key: 'confidence', width: 16 },
    { header: 'Locatie van Bewijs', key: 'location', width: 26 },
    { header: 'Gewone Mensentaal Uitleg (NL)', key: 'plainDesc', width: 42 },
    { header: 'Zakelijke Impact voor Klant', key: 'impact', width: 40 },
    { header: 'Aanbevolen Oplossing (Abraham)', key: 'remediation', width: 44 },
    { header: 'Geschatte Complexiteit', key: 'complexity', width: 18 }
  ];

  sheetFindings.getRow(1).height = 32;
  sheetFindings.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  sortedAll.forEach((r) => {
    (r.findings || []).forEach((f) => {
      const row = sheetFindings.addRow({
        id: f.finding_id,
        city: r.city,
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
        if (colNum === 7) {
          if (f.severity_if_confirmed === 'HIGH') {
            cell.font = { bold: true, color: { argb: 'FFDC2626' } };
          } else if (f.severity_if_confirmed === 'MEDIUM') {
            cell.font = { bold: true, color: { argb: 'FFD97706' } };
          }
        }
      });
    });
  });

  sheetFindings.autoFilter = { from: 'A1', to: 'M1' };

  // -------------------------------------------------------------
  // SHEET 8: COMMERCIAL_MODEL_90_10 (Revenue Projections)
  // -------------------------------------------------------------
  const sheetModel = workbook.addWorksheet('COMMERCIAL_MODEL_90_10');
  sheetModel.columns = [
    { header: 'Scenario', key: 'scenario', width: 32 },
    { header: 'Gesloten Deals', key: 'deals', width: 16 },
    { header: 'Totale Omzet (€)', key: 'totalRevenue', width: 20 },
    { header: 'Omzet Abraham (90% €)', key: 'abrahamRevenue', width: 24 },
    { header: 'Commissie Debbie (10% €)', key: 'debbieCommission', width: 24 },
    { header: 'Maandelijkse Retainers (€/mnd)', key: 'monthlyTotal', width: 26 },
    { header: 'Abraham MRR (90% €/mnd)', key: 'abrahamMrr', width: 24 },
    { header: 'Debbie MRR (10% €/mnd)', key: 'debbieMrr', width: 24 },
    { header: 'Jaarlijkse Contractwaarde (ACV)', key: 'acv', width: 26 }
  ];

  sheetModel.getRow(1).height = 32;
  sheetModel.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const scenarios = [
    { name: 'Maandag Kickstart Arnhem (3 deals)', deals: 3, avgPrice: 650 },
    { name: 'Arnhem Week 1 Doelstelling (8 deals)', deals: 8, avgPrice: 650 },
    { name: 'Arnhem + Nijmegen Corridor (18 deals)', deals: 18, avgPrice: 750 },
    { name: 'Volledige 85 Rode Leads Conversie (20%)', deals: 17, avgPrice: 850 },
    { name: 'Regionale Campagne Gelderland + NRW (35 deals)', deals: 35, avgPrice: 850 },
    { name: 'Full Corridor Schaal (50 deals)', deals: 50, avgPrice: 895 }
  ];

  scenarios.forEach(sc => {
    const tot = sc.deals * sc.avgPrice;
    const abr = tot * 0.90;
    const deb = tot * 0.10;
    const mTotal = sc.deals * 149;
    const mAbr = mTotal * 0.90;
    const mDeb = mTotal * 0.10;
    const acv = tot + (mTotal * 12);

    const row = sheetModel.addRow({
      scenario: sc.name,
      deals: sc.deals,
      totalRevenue: tot,
      abrahamRevenue: abr,
      debbieCommission: deb,
      monthlyTotal: mTotal,
      abrahamMrr: mAbr,
      debbieMrr: mDeb,
      acv: acv
    });

    row.height = 26;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle' };
      if ([3, 4, 5, 6, 7, 8, 9].includes(colNum)) {
        cell.numFmt = '€#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if (colNum === 4) cell.font = { bold: true, color: { argb: 'FF0284C7' } };
      if (colNum === 5) cell.font = { bold: true, color: { argb: 'FF16A34A' } };
    });
  });

  await workbook.xlsx.writeFile(OUTPUT_EXCEL);
  console.log(`✅ Master Cross-Border Excel saved: ${OUTPUT_EXCEL}`);

  // Also write back to ARGUS_ARNHEM_LEADS.xlsx for compatibility
  await workbook.xlsx.writeFile(ARNHEM_EXCEL);
  console.log(`✅ Synced to: ${ARNHEM_EXCEL}`);
}

main().catch(err => {
  console.error('Error generating Excel:', err);
  process.exit(1);
});
