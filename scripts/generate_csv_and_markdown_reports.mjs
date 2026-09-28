import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

export function generateCsvAndMarkdown(leads) {
  console.log(`Generating CSV and Markdown reports for ${leads.length} leads...`);

  // Filter RED leads
  const redLeads = leads.filter(l => l.priority === 'RED' || (l.booking && !l.booking.hasOnlineBooking));
  console.log(`Identified ${redLeads.length} Urgent RED Leads with Immediate ROI potential.`);

  // Headers for CSV
  const headers = [
    'Prioriteit',
    'Bedrijfsnaam',
    'Stad',
    'Land',
    'Regio',
    'Sector',
    'Telefoon',
    'Website',
    'Geconstateerde_Fout',
    'Aanbevolen_Pakket',
    'Setup_Fee_EUR',
    'Debbie_Cash_EUR',
    'Abraham_Tech_EUR',
    'Maandelijkse_Retainer_EUR',
    'Booking_Commissie_15pct_EUR',
    'Geschatte_Extra_Omzet_Klant_EUR',
    'Debbie_Verkooppraatkaart_NL_DE',
    'Abraham_Technische_Oplossing'
  ];

  function leadToCsvRow(l) {
    const opp = l.opportunity || {};
    const flaws = (l.redFlags && l.redFlags.length > 0)
      ? l.redFlags.join(' | ')
      : (!l.booking?.hasOnlineBooking ? 'Geen directe online boekingsagenda' : 'DMARC of privacy audit risico');

    const ticket = l.avg_ticket_eur || 180;
    const estGain = ticket * (opp.estMonthlyBookings || 20);

    return [
      escapeCsvField(l.priority || 'RED'),
      escapeCsvField(l.business_name),
      escapeCsvField(l.city),
      escapeCsvField(l.country || 'NL'),
      escapeCsvField(l.region || ''),
      escapeCsvField(l.sector_name || 'MKB'),
      escapeCsvField(l.phone_public || 'Geen telefoon'),
      escapeCsvField(l.website || `https://${l.domain}`),
      escapeCsvField(flaws),
      escapeCsvField(opp.packageRecommended || 'Conversie & Veiligheid'),
      escapeCsvField(opp.setupFeeEur || 895),
      escapeCsvField(opp.debbieSetupEur || 89.5),
      escapeCsvField(opp.abrahamSetupEur || 805.5),
      escapeCsvField(opp.monthlyRetainerEur || 149),
      escapeCsvField(opp.commissionPerBookingEur || (ticket * 0.15)),
      escapeCsvField(estGain),
      escapeCsvField(opp.pitchScriptLocal || opp.debbiePitchNL || ''),
      escapeCsvField(opp.abrahamTechFix || '')
    ].join(',');
  }

  // 1. Build CSV string for RED ONLY (with UTF-8 BOM so Excel opens it with perfect accents)
  const BOM = '\uFEFF';
  const redCsvContent = BOM + [headers.join(','), ...redLeads.map(leadToCsvRow)].join('\r\n');

  fs.writeFileSync(path.join(ROOT_DIR, 'ARGUS_RED_IMMEDIATE_ROI_TARGETS.csv'), redCsvContent, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'data', 'ARGUS_RED_IMMEDIATE_ROI_TARGETS.csv'), redCsvContent, 'utf8');
  console.log(`✅ Saved ARGUS_RED_IMMEDIATE_ROI_TARGETS.csv (${redLeads.length} rows) to root & data/`);

  // 2. Build CSV string for ALL LEADS
  const allCsvContent = BOM + [headers.join(','), ...leads.map(leadToCsvRow)].join('\r\n');
  fs.writeFileSync(path.join(ROOT_DIR, 'ARGUS_ALL_LEADS_MASTER.csv'), allCsvContent, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'data', 'ARGUS_ALL_LEADS_MASTER.csv'), allCsvContent, 'utf8');
  console.log(`✅ Saved ARGUS_ALL_LEADS_MASTER.csv (${leads.length} rows) to root & data/`);

  // 3. Build Markdown Report ARGUS_TOP_RED_TARGETS.md
  let md = `# 🔴 ARGUS LEAD ENGINE: TOP TARGETS MET ACUUT ROI-POTENTIEEL

> **Belangrijk voor Abraham & Debbie**: Dit document is direct leesbaar in uw editor en overal offline te gebruiken.  
> Het bevat uitsluitend gekwalificeerde bedrijven in Gelderland, Overijssel en Nordrhein-Westfalen met **acute commerciële en technische tekortkomingen** (ontbrekende online afsprakenmodule, spambox-risico door ontbrekend DMARC-slot, of pre-consent tracking boetes).
>
> 💡 **90/10 Inkomstenverdeling**:
> - **Debbie (10% Cash Direct)**: € 80 - € 150 per gesloten deal direct handje contantje / bank + € 15 - € 30 maandelijkse commissie.
> - **Abraham (90% Tech & Infrastructuur)**: € 720 - € 1.350 per implementatie + € 135 - € 270/mnd retainer + 15% booking fee.

---

## 📊 Snelle Samenvatting van het Pipeline-Potentieel

| Metriek | Waarde | Toelichting |
| :--- | :--- | :--- |
| **Totaal Geauditeerde Bedrijven** | **${leads.length}** | Arnhem, Nijmegen, Apeldoorn, Deventer, Enschede, Kleve, Bocholt, etc. |
| **🔴 Acute RED Doelwitten** | **${redLeads.length}** | Direct benaderbaar voor afsprakenmodule / e-mailbeveiliging |
| **Totale Setup Pipeline** | **€ ${(redLeads.length * 995).toLocaleString()}** | Op basis van gemiddelde setup van € 995 |
| **Debbie Directe Cash Potentieel (10%)** | **€ ${(redLeads.length * 99.5).toLocaleString()}** | Commissie bij 100% conversie |
| **Abraham Engineering Omzet (90%)** | **€ ${(redLeads.length * 895.5).toLocaleString()}** | Backend & funnel engineering |

---

## 🎯 Top Geselecteerde RED Doelwitten per Regio

`;

  // Group by city
  const cityGroups = {};
  for (const l of redLeads) {
    if (!cityGroups[l.city]) cityGroups[l.city] = [];
    cityGroups[l.city].push(l);
  }

  for (const [cityName, cityLeads] of Object.entries(cityGroups)) {
    const isDE = cityLeads[0].country === 'DE';
    md += `### ${isDE ? '🇩🇪' : '🇳🇱'} ${cityName} (${cityLeads.length} RED doelwitten)\n\n`;
    md += `| Bedrijf | Sector | Telefoon | Website | Geconstateerde Fout | Setup Fee (90/10) | Praatkaart |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    // Take top leads for table
    for (const l of cityLeads.slice(0, 15)) {
      const opp = l.opportunity || {};
      const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags[0] : 'Geen online booking';
      const phone = l.phone_public ? `[\`${l.phone_public}\`](tel:${l.phone_public.replace(/\s+/g, '')})` : '*Geen tel*';
      const web = `[${l.domain}](${l.website})`;
      const setup = `€${opp.setupFeeEur || 895} (D: €${opp.debbieSetupEur || 89.5} / A: €${opp.abrahamSetupEur || 805.5})`;
      const scriptPreview = (opp.pitchScriptLocal || opp.debbiePitchNL || '').slice(0, 75) + '...';

      md += `| **${l.business_name}** | ${l.sector_name || 'MKB'} | ${phone} | ${web} | ⚠️ ${flaws} | ${setup} | *"${scriptPreview}"* |\n`;
    }
    md += `\n`;
  }

  md += `---

## 🛠️ Hoe Debbie & Abraham de Deur Binnenstappen

### Scenario 1: De Kliniek / Tandarts / Schoonheidsspecialiste zonder Online Agenda
1. **Debbie belt of stapt binnen**:  
   *"Goedemorgen! Ik zag dat jullie praktijk ontzettend goede reviews heeft, maar toen ik gisteravond om 21:00 een afspraak wilde inplannen, kon dat nergens op de site. Uit onderzoek blijkt dat meer dan 65% van de patiënten 's avonds op hun mobiel zoekt. Als ze dan niet direct een tijdslot kunnen reserveren, bellen ze overdag bijna nooit meer terug, maar boeken ze bij een andere kliniek in de stad. Wij koppelen binnen 48 uur een modern boekingssysteem dat automatisch synchroniseert met jullie agenda."*
2. **De Zakelijke Rekensom voor de Eigenaar**:  
   - Gemiddelde intake/behandeling: € 180 - € 350.  
   - Slechts 3 extra online boekingen per week = **€ 2.100 - € 4.200 extra omzet per maand**.  
   - Investering: eenmalig € 895 - € 1.195 + € 149/mnd onderhoud.  
   - Terugverdientijd: **binnen 10 dagen**.

### Scenario 2: De Zakelijke Dienstverlener / Kantoor met Spam & DMARC Probleem
1. **Debbie belt**:  
   *"Goedemiddag! Onze beveiligingsaudit toonde aan dat uw e-maildomein het nieuwe Google & Microsoft DMARC-veiligheidsslot mist. Sinds dit voorjaar weigeren Gmail en Outlook massaal zakelijke offertes en facturen van domeinen zonder dit slot. Heeft u de laatste tijd offertes gestuurd die klanten zeiden niet te hebben ontvangen? Onze engineer Abraham lost dit binnen 24 uur op zonder dat uw huidige e-mail eruit ligt."*

---

*Gegenereerd door ARGUS Intelligence Engine op ${new Date().toLocaleString('nl-NL')}*
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'ARGUS_TOP_RED_TARGETS.md'), md, 'utf8');
  console.log(`✅ Saved ARGUS_TOP_RED_TARGETS.md to root!`);
}

async function main() {
  const expandedPath = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');
  const appointmentPath = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
  const targetPath = fs.existsSync(expandedPath) ? expandedPath : appointmentPath;
  if (fs.existsSync(targetPath)) {
    const raw = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    generateCsvAndMarkdown(raw);
  }
}

main().catch(console.error);
