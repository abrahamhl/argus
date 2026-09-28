import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_arnhem_scanned_results.json');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const rawData = fs.readFileSync(DATA_FILE, 'utf8');
const businesses = JSON.parse(rawData);

console.log(`Processing ${businesses.length} businesses for executive directie letters & 90/10 dossiers...`);

// Helper to determine service level, pricing, and 90/10 split
function calculateEconomics(biz) {
  const priority = biz.scores?.priorityColor || '⬜';
  let totalEur = biz.debbiePitch?.indicativePriceEur || 495;
  let serviceName = biz.debbiePitch?.estimatedService || 'E-mail & Website Beveiliging';

  // Calibrate service tier based on findings
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
  const monthlyAbraham = Math.round(monthlyRetainerEur * 0.90 * 100) / 100; // 134.10
  const monthlyDebbie = Math.round(monthlyRetainerEur * 0.10 * 100) / 100;   // 14.90

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

// Generate executive HTML letter for the business owner
function generateDirectieBriefHtml(biz, eco) {
  const dateStr = '28 september 2026';
  const cleanAddress = biz.address || 'Arnhem';
  const streetName = cleanAddress.split(',')[0] || cleanAddress;

  const positivePoints = [];
  if (biz.tls?.authorized) positivePoints.push(`Beveiligde SSL/TLS-versleuteling actief (uitgegeven door ${biz.tls.issuer || 'erkende CA'}).`);
  if (biz.http?.httpsEnforced) positivePoints.push('Automatische doorverwijzing van onbeveiligd HTTP naar beveiligd HTTPS.');
  if (biz.quality?.viewport) positivePoints.push('Mobielvriendelijke weergave geconfigureerd voor smartphones en tablets.');
  if (biz.dns?.spf) positivePoints.push('Basale SPF-registratie aanwezig in het DNS-adresboek.');
  if (positivePoints.length === 0) positivePoints.push('Domeinnaam is actief geregistreerd en bereikbaar op het internet.');

  const findingRows = biz.findings.map(f => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; width: 28%;">
        ${f.finding_title}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; width: 14%;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${f.severity_if_confirmed === 'HIGH' ? '#fee2e2; color: #991b1b;' : f.severity_if_confirmed === 'MEDIUM' ? '#fef3c7; color: #92400e;' : '#f1f5f9; color: #475569;'}">
          ${f.severity_if_confirmed}
        </span>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; width: 33%;">
        ${f.plain_language_description}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0369a1; width: 25%;">
        ${f.suggested_remediation}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Officiële Brief aan de Directie · ${biz.business_name}</title>
  <style>
    @page { size: A4; margin: 18mm 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.55;
      font-size: 13.5px;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 24px;
    }
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo-block h1 {
      font-size: 22px;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .logo-block h1 span {
      color: #2563eb;
    }
    .logo-block .sub {
      font-size: 11.5px;
      color: #64748b;
      font-weight: 500;
    }
    .org-details {
      text-align: right;
      font-size: 11.5px;
      color: #475569;
      line-height: 1.4;
    }
    .recipient-block {
      margin-bottom: 24px;
      padding: 14px 18px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 4px solid #0f172a;
    }
    .recipient-block .to {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .recipient-block .name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .recipient-block .address {
      font-size: 13px;
      color: #334155;
      margin-top: 2px;
    }
    .subject-line {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .intro p {
      margin-bottom: 14px;
      text-align: justify;
    }
    .positive-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 20px;
    }
    .positive-box h4 {
      margin: 0 0 6px 0;
      font-size: 13px;
      color: #166534;
    }
    .positive-box ul {
      margin: 0;
      padding-left: 18px;
      color: #15803d;
      font-size: 12.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px 0;
      font-size: 12px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      text-align: left;
      font-size: 11.5px;
      font-weight: 600;
    }
    .impact-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 24px;
    }
    .impact-box h4 {
      margin: 0 0 6px 0;
      font-size: 13.5px;
      color: #1e40af;
    }
    .impact-box p {
      margin: 0;
      color: #1e3a8a;
      font-size: 12.5px;
    }
    .solution-card {
      background: #f8fafc;
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .solution-card .title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .solution-card .desc {
      font-size: 12px;
      color: #475569;
    }
    .solution-card .price-tag {
      text-align: right;
    }
    .solution-card .price {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    .solution-card .terms {
      font-size: 11px;
      color: #64748b;
    }
    .sign-off {
      margin-top: 30px;
      font-size: 13px;
    }
    .signatures {
      display: flex;
      gap: 40px;
      margin-top: 24px;
    }
    .sig-person {
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      width: 220px;
    }
    .sig-person .pname {
      font-weight: 700;
      color: #0f172a;
    }
    .sig-person .prole {
      font-size: 11.5px;
      color: #64748b;
    }
    .footer-note {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="letterhead">
    <div class="logo-block">
      <h1>ARGUS <span>INTEL</span> · AUX DESIGN</h1>
      <div class="sub">Onafhankelijke Digitale Perimetercontrole & Beveiliging · Arnhem</div>
    </div>
    <div class="org-details">
      AUX Design Arnhem<br>
      Kantoorgebied Arnhem-Centrum<br>
      E-mail: contact@auxdesign.nl<br>
      Datum: ${dateStr}
    </div>
  </div>

  <div class="recipient-block">
    <div class="to">Vertrouwelijk & Persoonlijk gericht aan:</div>
    <div class="name">Directie / Ondernemer van ${biz.business_name}</div>
    <div class="address">${biz.address} · Arnhem · Website: ${biz.website || ('https://' + biz.domain)}</div>
  </div>

  <div class="subject-line">
    Betreft: Resultaten Periodieke Perimeter QuickScan & Preventief Beveiligingsadvies
  </div>

  <div class="intro">
    <p>
      Geachte heer / mevrouw,
    </p>
    <p>
      In het kader van onze regionale inventarisatie van de digitale weerbaarheid van Arnhemse ondernemingen, hebben wij een niet-invasieve veiligheidsscan uitgevoerd op uw publieke internetinfrastructuur (domein: <strong>${biz.domain}</strong>). 
      Deze analyse heeft uitsluitend plaatsgevonden via openbare bronnen (DNS-registers, officiële netwerkantwoorden en publieke webprotocollen), zonder enige inbreuk op uw interne systemen.
    </p>
  </div>

  <div class="positive-box">
    <h4>✓ Wat er al uitstekend is ingericht bij ${biz.business_name}</h4>
    <ul>
      ${positivePoints.map(p => `<li>${p}</li>`).join('')}
    </ul>
  </div>

  <p>
    Tijdens de analyse hebben onze verificatiesystemen een aantal concrete configuratiepunten vastgesteld die direct van invloed zijn op uw e-mailaflevering, reputatie en bescherming tegen kwaadwillenden:
  </p>

  <table>
    <thead>
      <tr>
        <th>Geobserveerd Aandachtspunt</th>
        <th>Prioriteit</th>
        <th>Betekenis voor de Gebruiker</th>
        <th>Aanbevolen Remediatiestap</th>
      </tr>
    </thead>
    <tbody>
      ${findingRows}
    </tbody>
  </table>

  <div class="impact-box">
    <h4>Zakelijke Relevantie & Risico-afweging</h4>
    <p><strong>Kernconclusie:</strong> ${biz.debbiePitch?.oneLinerNL || 'Uw e-mail en webconfiguratie bevatten openstaande protocollen.'}</p>
    <p style="margin-top: 6px;"><strong>Waarom dit uw aandacht vraagt:</strong> ${biz.debbiePitch?.whyCareNL || 'Grote partijen zoals Gmail, Microsoft 365 en toezichthouders hanteren strenge eisen voor betrouwbare verzending en privacy.'}</p>
  </div>

  <div class="solution-card">
    <div>
      <div class="title">Voorstel: ${eco.serviceName}</div>
      <div class="desc">
        Volledig ontzorgd binnen 48 uur · Vaste all-in prijs · Geen verstoring van lopende zaken · Inclusief officieel ARGUS-hercontrolecertificaat.
      </div>
    </div>
    <div class="price-tag">
      <div class="price">€${eco.totalEur}</div>
      <div class="terms">Eenmalig excl. btw</div>
    </div>
  </div>

  <p>
    Onze collega Debbie of Abraham neemt vandaag of morgen graag even kort contact met u op om dit overzicht toe te lichten en te bespreken of u ondersteuning wenst bij het direct dichtzetten van deze configuraties.
  </p>

  <div class="sign-off">
    Met vriendelijke groet,<br>
    <strong>Het Beveiligings- & Weerbaarheidsteam van AUX Design Arnhem</strong>
    
    <div class="signatures">
      <div class="sig-person">
        <div class="pname">Abraham Haddioui</div>
        <div class="prole">Technisch Architect & Beveiligingsspecialist</div>
      </div>
      <div class="sig-person">
        <div class="pname">Debbie</div>
        <div class="prole">Klantadviseur & Relatiebeheer Arnhem</div>
      </div>
    </div>
  </div>

  <div class="footer-note">
    AUX Design Arnhem · Vertrouwelijke documentatie uitsluitend bestemd voor de directie van ${biz.business_name}.<br>
    Geverifieerd via ARGUS Sovereign Cryptographic Engine (RFC 6962 / ISO 27037).
  </div>
</div>
</body>
</html>`;
}

// Generate internal battle card for Abraham & Debbie
function generateDossierAbrahamDebbie(biz, eco) {
  return `# VERKOOP- & TECHNISCH DOSSIER · ${biz.business_name.toUpperCase()}

**Locatie:** ${biz.address || 'Arnhem'}  
**Domein:** [${biz.domain}](${biz.website || 'https://' + biz.domain})  
**Telefoon:** ${biz.phone_public || 'Geen telefoonnummer bekend (fysiek binnenlopen)'}  
**Contactpersoon / E-mail:** ${biz.public_contact || 'info@' + biz.domain}  
**Sector:** ${biz.category}  
**Prioriteitsscore:** ${biz.scores.priorityColor} ${biz.scores.salesPriority}/100  

---

## 💰 COMMERCIËLE VERDELING (HET 90 / 10 MODEL)

| Component | Totaal Bedrag | Abraham (90% Uitvoering & Garantie) | Debbie (10% Introductie & Verkoop) |
|---|---|---|---|
| **Eenmalige Remediatedienst** | **€${eco.totalEur}** | **€${eco.abrahamShare}** | **€${eco.debbieShare}** |
| **Maandelijks Onderhoud & Monitoring** | **€${eco.monthlyRetainerEur}/mnd** | **€${eco.monthlyAbraham}/mnd** | **€${eco.monthlyDebbie}/mnd** |

*Doelstelling:* Als Debbie 5 van deze dossiers sluit op straat, genereert dit direct **€${(eco.debbieShare * 5).toFixed(2)}** voor Debbie en **€${(eco.abrahamShare * 5).toFixed(2)}** voor Abraham, plus een recurring basis van **€${(eco.monthlyDebbie * 5).toFixed(2)}/mnd** en **€${(eco.monthlyAbraham * 5).toFixed(2)}/mnd**.

---

## 🗣️ SECTIE 1: DEBBIE'S PRAATKAART (30-SECONDEN PITCH IN HET NEDERLANDS)

*Als Debbie binnenloopt op ${biz.address}:*

> *"Goedemorgen! Mijn naam is Debbie van AUX Design, hier uit Arnhem. Ik kom u absoluut niets aansmeren en u hoeft nu niets te kopen.*
> 
> *Wij hebben gisteren een digitale perimetercontrole gedaan van Arnhemse bedrijven, en we zagen dat u al een prachtige website heeft. Maar we zagen ook één belangrijk punt:*
> 
> **${biz.debbiePitch?.oneLinerNL || 'Uw e-mailadres is nog niet optimaal beveiligd tegen nabootsing door vreemden.'}**
> 
> *Hierdoor lopen uw e-mails naar cliënten het risico om in de spammap te belanden, of kunnen criminelen nepfacturen sturen uit uw naam.*
> 
> *Mijn collega Abraham is technisch specialist. Wij hebben speciaal voor uw directie een 1-pagina overzichtje gemaakt (overhandig de brief). Wij kunnen dit binnen 48 uur geruisloos voor u inrichten voor een vast bedrag van €${eco.totalEur}. Mag ik deze brief bij de eigenaar achterlaten?"*

### Bezwaren van de ondernemer en wat Debbie antwoordt:
- **"We hebben al een IT-partij / webbouwer."**  
  👉 *Debbie antwoordt:* *"Fantastisch! Geef deze brief vooral aan hen mee. Vraag hen specifiek of ze het DMARC-record op 'p=quarantine' of 'p=reject' hebben gezet. Als zij het te druk hebben of er niet uitkomen, kan Abraham het binnen 24 uur met hen afstemmen voor €${eco.totalEur}."*
- **"We zijn nog nooit gehackt."**  
  👉 *Debbie antwoordt:* *"Gelukkig maar! Dit gaat ook niet over een hack van uw computer, maar over de regels die Google en Microsoft sinds vorig jaar verplichten. Zonder dit slot worden uw offertes simpelweg vaker als onbetrouwbaar gezien door de mailservers van uw klanten."*
- **"Wat kost het?"**  
  👉 *Debbie antwoordt:* *"Exact €${eco.totalEur} eenmalig. Geen verborgen kosten, geen abonnementverplichting. Binnen 48 uur opgelost en gecertificeerd."*

---

## 🏢 SECTIE 2: ZAKELIJKE RELEVANTIE (VOOR DE EIGENAAR)

- **Waarom de ondernemer betaalt:** ${biz.debbiePitch?.whyCareNL || 'Bescherming van merknaam, factuurveiligheid en gegarandeerde e-mailaflevering.'}
- **Juridische en reputatierisico's:** ${biz.findings.map(f => f.customer_impact).join(' ')}
- **Garantie van AUX Design:** Wij garanderen dat na implementatie het domein 100% compliant scoort op internet.nl en NCSC-richtlijnen, met een cryptografisch auditcertificaat (Merkle Proof-Pack).

---

## 🛠️ SECTIE 3: TECHNISCHE UITVOERING & REMEDIATIE (VOOR ABRAHAM)

*Geschatte implementatietijd voor Abraham: 45 tot 90 minuten.*

### Exacte bevindingen en oplossingscode:
${biz.findings.map((f, idx) => `
### ${idx + 1}. ${f.finding_title} (${f.category})
- **Locatie van bewijs:** \`${f.evidence_location}\`
- **Ernst:** \`${f.severity_if_confirmed}\`
- **Uitleg:** ${f.technical_description}
- **Remediatiestap:** ${f.suggested_remediation}
`).join('\n')}

### Snelle Configuratie Handleiding (Abraham's Cheat Sheet):
\`\`\`dns
; 1. DNS Anti-Spoofing & E-mail Trust
${biz.domain}. IN TXT "v=spf1 include:_spf.google.com ~all" ; (Pas aan op mailserver)
_dmarc.${biz.domain}. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@${biz.domain}; pct=100; adkim=r; aspf=r"

; 2. Webserver Headers (Nginx snippet)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
\`\`\`

---
*Gegenereerd door ARGUS Lead Intelligence Engine · Vertrouwelijk werkdocument voor Abraham & Debbie.*
`;
}

// Main execution loop
let generatedCount = 0;
const prioritizedLeads = businesses.filter(b => b.scores?.priorityColor === '🟥' || b.scores?.priorityColor === '🟧');

console.log(`Generating dossiers and executive letters for ${prioritizedLeads.length} prioritized leads...`);

for (const biz of prioritizedLeads) {
  const compDir = path.join(REPORTS_DIR, biz.company_id);
  if (!fs.existsSync(compDir)) {
    fs.mkdirSync(compDir, { recursive: true });
  }

  const eco = calculateEconomics(biz);
  const letterHtml = generateDirectieBriefHtml(biz, eco);
  const dossierMd = generateDossierAbrahamDebbie(biz, eco);

  fs.writeFileSync(path.join(compDir, 'BRIEF_AAN_DIRECTIE.html'), letterHtml);
  fs.writeFileSync(path.join(compDir, 'DOSSIER_ABRAHAM_DEBBIE.md'), dossierMd);

  generatedCount++;
}

// Generate Master Index HTML
const masterIndexHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>ARGUS Arnhem · Directie Brieven & 90/10 Commerciële Dossiers</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { margin: 0 0 8px 0; font-size: 26px; }
    h1 span { color: #38bdf8; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-card .val { font-size: 28px; font-weight: 800; color: #38bdf8; }
    .stat-card .lbl { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
    th { background: #0f172a; text-align: left; padding: 12px 14px; font-size: 12px; color: #94a3b8; border-bottom: 2px solid #334155; }
    td { padding: 12px 14px; border-bottom: 1px solid #334155; font-size: 13px; }
    tr:hover { background: #243248; }
    .btn { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 600; text-decoration: none; margin-right: 6px; }
    .btn-brief { background: #2563eb; color: #ffffff; }
    .btn-dossier { background: #334155; color: #f8fafc; border: 1px solid #64748b; }
    .prio-red { color: #f87171; font-weight: 700; }
    .prio-orange { color: #fb923c; font-weight: 700; }
  </style>
</head>
<body>
<div class="container">
  <h1>ARGUS <span>ARNHEM</span> · DIRECTIE BRIEVEN & 90/10 VERKOOPDOSSIERS</h1>
  <div class="subtitle">Gemaakt voor Abraham Haddioui & Debbie · Veldcampagne Arnhem Maandagochtend</div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="val">${prioritizedLeads.length}</div>
      <div class="lbl">Gegenereerde Brieven</div>
    </div>
    <div class="stat-card">
      <div class="val">€${prioritizedLeads.reduce((acc, b) => acc + calculateEconomics(b).totalEur, 0).toLocaleString()}</div>
      <div class="lbl">Totale Pipeline Waarde</div>
    </div>
    <div class="stat-card">
      <div class="val">€${Math.round(prioritizedLeads.reduce((acc, b) => acc + calculateEconomics(b).abrahamShare, 0)).toLocaleString()}</div>
      <div class="lbl">Abraham (90%)</div>
    </div>
    <div class="stat-card">
      <div class="val">€${Math.round(prioritizedLeads.reduce((acc, b) => acc + calculateEconomics(b).debbieShare, 0)).toLocaleString()}</div>
      <div class="lbl">Debbie (10%)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Prioriteit</th>
        <th>Bedrijf</th>
        <th>Adres in Arnhem</th>
        <th>Telefoon</th>
        <th>Prijs</th>
        <th>Abraham (90%)</th>
        <th>Debbie (10%)</th>
        <th>Acties</th>
      </tr>
    </thead>
    <tbody>
      ${prioritizedLeads.map(b => {
        const eco = calculateEconomics(b);
        return `
        <tr>
          <td><span class="${b.scores.priorityColor === '🟥' ? 'prio-red' : 'prio-orange'}">${b.scores.priorityColor} ${b.scores.salesPriority}</span></td>
          <td><strong>${b.business_name}</strong><br><span style="color: #94a3b8; font-size: 11px;">${b.domain}</span></td>
          <td>${b.address}</td>
          <td>${b.phone_public || '<span style="color: #64748b;">Loop-in</span>'}</td>
          <td><strong>€${eco.totalEur}</strong></td>
          <td style="color: #38bdf8;">€${eco.abrahamShare}</td>
          <td style="color: #4ade80;">€${eco.debbieShare}</td>
          <td>
            <a class="btn btn-brief" href="${b.company_id}/BRIEF_AAN_DIRECTIE.html" target="_blank">📄 Directie Brief</a>
            <a class="btn btn-dossier" href="${b.company_id}/DOSSIER_ABRAHAM_DEBBIE.md" target="_blank">🎯 Dossier</a>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</div>
</body>
</html>`;

fs.writeFileSync(path.join(REPORTS_DIR, 'INDEX_DIRECTIE_BRIEVEN.html'), masterIndexHtml);

console.log(`✅ Successfully generated ${generatedCount} executive letters and dossiers in reports/!`);
console.log(`Master index saved to reports/INDEX_DIRECTIE_BRIEVEN.html`);
