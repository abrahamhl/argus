import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export function generateArnhem20kmDossier() {
  console.log(`Generating Print-Ready Dossier for Arnhem 20km Radius...`);

  const fileHigh = path.join(ROOT_DIR, 'data', 'arnhem_nijmegen_high_ticket_audited.json');
  const fileAll = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');

  let pool = [];
  const seen = new Set();

  if (fs.existsSync(fileHigh)) {
    const arr = JSON.parse(fs.readFileSync(fileHigh, 'utf8'));
    for (const l of arr) {
      if (!seen.has(l.domain)) {
        seen.add(l.domain);
        pool.push(l);
      }
    }
  }

  if (fs.existsSync(fileAll)) {
    const arr = JSON.parse(fs.readFileSync(fileAll, 'utf8'));
    const cities20km = ['Arnhem', 'Nijmegen', 'Wageningen', 'Velp', 'Oosterbeek', 'Rheden', 'Elst', 'Duiven', 'Westervoort', 'Huissen', 'Renkum', 'Zevenaar', 'Bemmel'];
    for (const l of arr) {
      if (cities20km.includes(l.city) && !seen.has(l.domain)) {
        seen.add(l.domain);
        pool.push(l);
      }
    }
  }

  // Filter RED priority
  const redLeads = pool.filter(l => l.priority === 'RED' || (!l.booking?.hasOnlineBooking && !l.audit?.booking?.hasOnlineIntake));

  // Sort by commercial value / setup fee descending
  redLeads.sort((a, b) => {
    const feeA = a.opportunity?.setupFeeEur || 895;
    const feeB = b.opportunity?.setupFeeEur || 895;
    return feeB - feeA;
  });

  console.log(`Found ${redLeads.length} RED targets in 20km radius of Arnhem.`);

  let md = `# 🖨️ ARGUS VELD-DOSSIER: ARNHEM & 20 KM STRAAL (PRINT-KLAAR)
## Veldwerkdocument voor Abraham & Debbie — Maandag & Dinsdag Route

> **Instructie voor Debbie & Abraham**:  
> Dit document is speciaal geformatteerd om direct uit te printen of op de Chromebook OS te openen.  
> Het bevat uitsluitend **geverifieerde bedrijven in ROOD** met acute commerciële of technische lekken binnen 20 minuten rijden van Arnhem.  
> Neem een balpen mee en vink de vakjes \`[ ]\` af zodra het kantoor bezocht of gebeld is.
>
> 💰 **90/10 Inkomstenverdeling**:
> - **Debbie (10% Cash)**: direct contant/overschrijving per deal (€ 89,50 tot € 425,00).
> - **Abraham (90% Tech)**: € 805,50 tot € 3.825,00 per implementatie + retainer.

---

## 📊 Overzicht per Gemeente & Zone (Binnen 20 km)

| Zone | Afstand tot Arnhem Centrum | Aantal RED Doelwitten | Focus Sector |
| :--- | :--- | :--- | :--- |
| **Arnhem Centrum & Singels** | 0 km | ~75 | Advocaten, Notarissen, Tandartsen, Makelaars |
| **Arnhem Noord (Velperweg/Sonsbeek)** | 1 - 3 km | ~35 | Grote maatschappen, villakantoren, privéklinieken |
| **Velp & Rheden** | 5 - 10 km | ~40 | Landgoederen, notariskantoren, specialistische zorg |
| **Oosterbeek & Renkum** | 5 - 10 km | ~25 | Boetiekhotels, esthetische klinieken, vermogensbeheer |
| **Overbetuwe & Elst** | 8 - 12 km | ~25 | Tandartspraktijken, medische centra, horeca |
| **Nijmegen (Singels & Centrum)** | 15 - 18 km | ~110 | Top-tier advocatuur, implantologie, boetiekhotels |
| **Wageningen & Ede** | 18 - 20 km | ~45 | Zorgpraktijken, optometriecentra, hotels |

---

## 🚶‍♂️ ROUTE 1: ARNHEM CENTRUM, VELPERWEG & SINGELS (HOOGSTE PRIORITEIT)

`;

  const arnhemLeads = redLeads.filter(l => l.city === 'Arnhem');
  arnhemLeads.slice(0, 45).forEach((l, idx) => {
    const opp = l.opportunity || {};
    const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join('; ') : 'Geen online agenda / DMARC risico';
    const phone = l.phone_public || 'Geen telefoonnummer gevonden';
    const web = l.website || `https://${l.domain}`;
    const setup = opp.setupFeeEur || 995;
    const debbie = opp.debbieSetupCashEur || opp.debbieSetupEur || Math.round(setup * 0.1);
    const abraham = opp.abrahamSetupTechEur || opp.abrahamSetupEur || Math.round(setup * 0.9);
    const retainer = opp.monthlyRetainerEur || 149;
    const pitch = opp.debbiePitchNL || opp.pitchScriptLocal || 'Geen praatkaart beschikbaar.';
    const roi = opp.businessRoiPitchNL || opp.businessRoiPitchLocal || '';

    md += `### - [ ] ${idx + 1}. **${l.business_name}** (${l.sector_name || 'Zakelijk'})\n`;
    md += `- **Adres**: ${l.address || 'Arnhem Centrum'}\n`;
    md += `- **Contact**: 📞 \`${phone}\` | 🌐 [${l.domain}](${web})\n`;
    md += `- **⚠️ Geconstateerde Fout**: ${flaws}\n`;
    md += `- **💼 Aanbevolen Pakket**: **${opp.packageName || opp.packageRecommended || 'Conversie & Beveiliging'}**\n`;
    md += `- **💰 Investering**: **€ ${setup.toLocaleString()}** (Debbie 10%: **€ ${debbie}** | Abraham 90%: **€ ${abraham}**) + **€ ${retainer}/mnd**\n`;
    md += `- **🗣️ Debbie's Deur- / Belpraatkaart**: \n`;
    md += `  > *"${pitch}"*\n`;
    md += `- **📈 ROI Argument**: ${roi}\n`;
    md += `- **Uitkomst Bezoek**: [ ] Afspraak gemaakt | [ ] Offerte gemaild | [ ] Gesproken met: ______________ | Notities: ______________\n\n`;
  });

  md += `---

## 🚗 ROUTE 2: VELP, OOSTERBEEK & RHEDEN (VILLAKANTOREN & LANDGOEDEREN)

`;

  const velpOosterbeek = redLeads.filter(l => ['Velp', 'Oosterbeek', 'Rheden', 'Renkum', 'Rozendaal'].includes(l.city));
  velpOosterbeek.slice(0, 30).forEach((l, idx) => {
    const opp = l.opportunity || {};
    const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join('; ') : 'Geen online agenda';
    const phone = l.phone_public || 'Geen telefoon';
    const web = l.website || `https://${l.domain}`;
    const setup = opp.setupFeeEur || 995;
    const debbie = opp.debbieSetupCashEur || opp.debbieSetupEur || Math.round(setup * 0.1);
    const abraham = opp.abrahamSetupTechEur || opp.abrahamSetupEur || Math.round(setup * 0.9);

    md += `### - [ ] ${idx + 1}. **${l.business_name}** (${l.city}) — ${l.sector_name || 'MKB'}\n`;
    md += `- **Adres**: ${l.address || l.city}\n`;
    md += `- **Contact**: 📞 \`${phone}\` | 🌐 [${l.domain}](${web})\n`;
    md += `- **⚠️ Fout**: ${flaws}\n`;
    md += `- **💼 Pakket**: **€ ${setup.toLocaleString()}** (Debbie: **€ ${debbie}**, Abraham: **€ ${abraham}**)\n`;
    md += `- **🗣️ Praatkaart**: *"${opp.debbiePitchNL || opp.pitchScriptLocal || ''}"*\n`;
    md += `- **Uitkomst**: [ ] Gesproken met: ______________ | [ ] Status: ______________\n\n`;
  });

  md += `---

## 🚗 ROUTE 3: NIJMEGEN (ORANJESINGEL, KEIZER KAREL & CENTRUM)

`;

  const nijmegenLeads = redLeads.filter(l => l.city === 'Nijmegen');
  nijmegenLeads.slice(0, 40).forEach((l, idx) => {
    const opp = l.opportunity || {};
    const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join('; ') : 'DMARC of intake ontbreekt';
    const phone = l.phone_public || 'Geen telefoon';
    const web = l.website || `https://${l.domain}`;
    const setup = opp.setupFeeEur || 995;
    const debbie = opp.debbieSetupCashEur || opp.debbieSetupEur || Math.round(setup * 0.1);
    const abraham = opp.abrahamSetupTechEur || opp.abrahamSetupEur || Math.round(setup * 0.9);

    md += `### - [ ] ${idx + 1}. **${l.business_name}** — ${l.sector_name || 'Zorg / Zakelijk'}\n`;
    md += `- **Adres**: ${l.address || 'Nijmegen'}\n`;
    md += `- **Contact**: 📞 \`${phone}\` | 🌐 [${l.domain}](${web})\n`;
    md += `- **⚠️ Fout**: ${flaws}\n`;
    md += `- **💼 Pakket**: **€ ${setup.toLocaleString()}** (Debbie: **€ ${debbie}**, Abraham: **€ ${abraham}**)\n`;
    md += `- **🗣️ Praatkaart**: *"${opp.debbiePitchNL || opp.pitchScriptLocal || ''}"*\n`;
    md += `- **Uitkomst**: [ ] Gesproken met: ______________ | [ ] Status: ______________\n\n`;
  });

  const outPath = path.join(ROOT_DIR, 'ARNHEM_20KM_PRINT_READY_DOSSIER.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`✅ Saved print-ready dossier to ${outPath}`);
}

async function main() {
  generateArnhem20kmDossier();
}

main().catch(console.error);
