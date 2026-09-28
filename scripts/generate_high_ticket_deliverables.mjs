import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

export function generateHighTicketDeliverables(leads) {
  console.log(`\n======================================================`);
  console.log(`📑 GENERATING HIGH-TICKET FIELD CHECKLIST, CSV & HTML`);
  console.log(`======================================================\n`);

  const redLeads = leads.filter(l => l.priority === 'RED');
  console.log(`Total High-Ticket Leads: ${leads.length} | 🔴 RED Urgent: ${redLeads.length}`);

  // 1. Generate Physical Field Checklist (Markdown)
  let md = `# 📋 HIGH-TICKET VELD-CHECKLIST: ARNHEM, NIJMEGEN & REGIO
## Voor Abraham & Debbie — Chromebook OS & Fysieke Routekaart

> **Doel**: Met de Chromebook OS en deze afvinklijst direct langs kantoren gaan of gericht nabellen.  
> **Doelgroep**: Bedrijven met **veel kapitaal ("pasta")**: Advocatenkantoren, Notarissen, Belastingadviseurs, Tandartsen / Implantologen, Luxe Hotels en Vastgoed/Renting.  
> **Commercieel Model (90/10)**:
> - **Debbie (10% Direct Cash)**: € 285 tot € 485 contant/direct per gesloten kantoor.
> - **Abraham (90% Engineering)**: € 2.565 tot € 4.365 per implementatie + € 200 - € 300/mnd retainer.

---

## 📊 Totaaloverzicht van het Marktpotentieel

| Sector | Aantal Bedrijven | Gemiddeld Setup Pakket | Totale Pipeline Waarde | Debbie Cash Potentieel (10%) |
| :--- | :--- | :--- | :--- | :--- |
| ⚖️ **Advocatenkantoren** | ${leads.filter(l => l.sector_id === 'LEGAL').length} | € 4.250 | € ${(leads.filter(l => l.sector_id === 'LEGAL').length * 4250).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'LEGAL').length * 425).toLocaleString()} |
| 📜 **Notariskantoren** | ${leads.filter(l => l.sector_id === 'NOTARY').length} | € 4.250 | € ${(leads.filter(l => l.sector_id === 'NOTARY').length * 4250).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'NOTARY').length * 425).toLocaleString()} |
| 💼 **Fiscalisten & Accountants** | ${leads.filter(l => l.sector_id === 'TAX_FINANCE').length} | € 3.450 | € ${(leads.filter(l => l.sector_id === 'TAX_FINANCE').length * 3450).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'TAX_FINANCE').length * 345).toLocaleString()} |
| 🦷 **Tandartsen & Implantologie** | ${leads.filter(l => l.sector_id === 'DENTAL_SURGERY').length} | € 2.850 | € ${(leads.filter(l => l.sector_id === 'DENTAL_SURGERY').length * 2850).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'DENTAL_SURGERY').length * 285).toLocaleString()} |
| 🏨 **Boetiekhotels & Landgoederen** | ${leads.filter(l => l.sector_id === 'LUXURY_HOTEL').length} | € 3.450 | € ${(leads.filter(l => l.sector_id === 'LUXURY_HOTEL').length * 3450).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'LUXURY_HOTEL').length * 345).toLocaleString()} |
| 🏢 **Vastgoed, Renting & Makelaars** | ${leads.filter(l => l.sector_id === 'LEASING_REAL_ESTATE').length} | € 2.950 | € ${(leads.filter(l => l.sector_id === 'LEASING_REAL_ESTATE').length * 2950).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'LEASING_REAL_ESTATE').length * 295).toLocaleString()} |
| **TOTAAL GEAUDITEERD** | **${leads.length}** | **€ 3.550 (gem)** | **€ ${(leads.length * 3550).toLocaleString()}** | **€ ${(leads.length * 355).toLocaleString()}** |

---

## 🗺️ Fysieke Wandel- en Bezoekroutes per Wijk / Boulevard

`;

  // Group by city and street
  const cityGroups = {};
  for (const l of leads) {
    const c = l.city || 'Arnhem';
    if (!cityGroups[c]) cityGroups[c] = [];
    cityGroups[c].push(l);
  }

  for (const [cityName, cityLeads] of Object.entries(cityGroups)) {
    md += `### 📍 ${cityName} (${cityLeads.length} High-Ticket Doelwitten)\n\n`;

    cityLeads.forEach((l, index) => {
      const opp = l.opportunity || {};
      const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join('; ') : 'Optimalisatie nodig';
      const phoneStr = l.phone_public ? `[\`${l.phone_public}\`](tel:${l.phone_public.replace(/\s+/g, '')})` : '*Geen tel*';
      const webStr = `[${l.domain}](${l.website})`;

      md += `#### - [ ] ${index + 1}. **${l.business_name}** — ${l.sector_name}\n`;
      md += `- **Adres**: ${l.address || cityName}\n`;
      md += `- **Contact**: Telefoon: ${phoneStr} | Website: ${webStr}\n`;
      md += `- **⚠️ Geconstateerde Fout**: ${flaws}\n`;
      md += `- **💼 Aanbevolen Pakket**: **${opp.packageName}** — **€ ${opp.setupFeeEur?.toLocaleString()}** (Debbie 10%: **€ ${opp.debbieSetupCashEur}**, Abraham 90%: **€ ${opp.abrahamSetupTechEur}**) + **€ ${opp.monthlyRetainerEur}/mnd**\n`;
      md += `- **🗣️ Debbie's Deurpraatkaart**: \n`;
      md += `  > *"${opp.debbiePitchNL}"*\n`;
      md += `- **💰 Harde Commerciële ROI**: ${opp.businessRoiPitchNL}\n`;
      md += `- **Notities Bezoek**: [ ] Niet thuis | [ ] Gesproken met: _____________ | [ ] Vervolgafspraak: _____________\n\n`;
    });
  }

  const checklistPath = path.join(ROOT_DIR, 'ARNHEM_NIJMEGEN_HIGH_TICKET_CHECKLIST.md');
  fs.writeFileSync(checklistPath, md, 'utf8');
  console.log(`✅ Saved physical field checklist to ${checklistPath}`);

  // 2. Generate High-Ticket CSV (with UTF-8 BOM)
  const BOM = '\uFEFF';
  const csvHeaders = [
    'Prioriteit',
    'Bedrijfsnaam',
    'Sector',
    'Stad',
    'Adres',
    'Telefoon',
    'Website',
    'Geconstateerde_Fout',
    'Aanbevolen_Pakket',
    'Setup_Fee_EUR',
    'Debbie_Direct_Cash_EUR',
    'Abraham_Tech_EUR',
    'Maandfee_EUR',
    'Debbie_Praatkaart_NL',
    'Commerciele_ROI'
  ];

  const csvRows = leads.map(l => {
    const opp = l.opportunity || {};
    const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join(' | ') : 'Geen directe fouten';
    return [
      escapeCsv(l.priority),
      escapeCsv(l.business_name),
      escapeCsv(l.sector_name),
      escapeCsv(l.city),
      escapeCsv(l.address),
      escapeCsv(l.phone_public || ''),
      escapeCsv(l.website),
      escapeCsv(flaws),
      escapeCsv(opp.packageName),
      escapeCsv(opp.setupFeeEur),
      escapeCsv(opp.debbieSetupCashEur),
      escapeCsv(opp.abrahamSetupTechEur),
      escapeCsv(opp.monthlyRetainerEur),
      escapeCsv(opp.debbiePitchNL),
      escapeCsv(opp.businessRoiPitchNL)
    ].join(',');
  });

  const csvContent = BOM + [csvHeaders.join(','), ...csvRows].join('\r\n');
  const csvPath = path.join(ROOT_DIR, 'ARNHEM_NIJMEGEN_HIGH_TICKET_LEADS.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'data', 'ARNHEM_NIJMEGEN_HIGH_TICKET_LEADS.csv'), csvContent, 'utf8');
  console.log(`✅ Saved high-ticket CSV to ${csvPath}`);

  // 3. Generate High-Ticket Interactive HTML Command Center
  const serialized = JSON.stringify(leads).replace(/</g, '\\u003c');
  const totalPipeline = leads.reduce((acc, l) => acc + (l.opportunity?.setupFeeEur || 0), 0);
  const totalDebbie = leads.reduce((acc, l) => acc + (l.opportunity?.debbieSetupCashEur || 0), 0);
  const totalAbraham = leads.reduce((acc, l) => acc + (l.opportunity?.abrahamSetupTechEur || 0), 0);

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARGUS High-Ticket Command Center | Arnhem & Nijmegen Legal, Dental & Luxury</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --card-border: #1f2937;
      --card-hover: #1e293b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --red: #ef4444;
      --gold: #f59e0b;
      --green: #10b981;
      --blue: #38bdf8;
      --purple: #8b5cf6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .brand-title { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
    .gold-badge { background: linear-gradient(135deg, #d97706, #f59e0b); color: #000; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; }
    .kpi-title { font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 6px; }
    .kpi-val { font-size: 26px; font-weight: 800; }
    .kpi-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .controls { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
    .search-input { width: 100%; background: #070a12; border: 1px solid #334155; color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; outline: none; }
    .pills-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pill { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .pill.active { background: var(--blue); color: #000; font-weight: 700; border-color: var(--blue); }
    .pill-red.active { background: var(--red); color: #fff; border-color: var(--red); }
    .table-container { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #0c1220; color: #94a3b8; padding: 12px 16px; border-bottom: 1px solid var(--card-border); text-transform: uppercase; font-size: 11px; }
    td { padding: 14px 16px; border-bottom: 1px solid #1a2234; vertical-align: middle; }
    tr:hover td { background: var(--card-hover); }
    .badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
    .badge-org { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
    .btn { background: #1e293b; color: #fff; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
    .btn:hover { background: #334155; }
    .btn-gold { background: #d97706; border-color: #f59e0b; color: #fff; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-card { background: #111827; border: 1px solid #374151; border-radius: 16px; max-width: 650px; width: 100%; padding: 24px; position: relative; }
    .modal-close { position: absolute; top: 16px; right: 16px; background: #1f2937; border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; }
  </style>
</head>
<body>

  <header>
    <div>
      <div class="brand-title">
        ARGUS High-Ticket Command Center
        <span class="gold-badge">💎 Vermogende Doelgroep</span>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
        Advocaten, Notarissen, Belastingadviseurs, Tandartsen & Boetiekhotels in Arnhem & Nijmegen
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <a href="ARNHEM_NIJMEGEN_HIGH_TICKET_CHECKLIST.md" class="btn">📋 Veld Checklist (MD)</a>
      <button class="btn btn-gold" onclick="exportCsv()">📥 Download CSV</button>
    </div>
  </header>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-title">Totaal High-Ticket Kantoren</div>
      <div class="kpi-val" style="color: var(--blue);">${leads.length}</div>
      <div class="kpi-sub">Arnhem, Nijmegen, Velp, Oosterbeek</div>
    </div>
    <div class="kpi-card" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
      <div class="kpi-title" style="color: var(--red);">🔴 Acute RED Urgente Leads</div>
      <div class="kpi-val" style="color: var(--red);">${redLeads.length}</div>
      <div class="kpi-sub">DMARC spamlek of ontbrekende intake</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Totale Pipeline Waarde</div>
      <div class="kpi-val" style="color: var(--gold);">€ ${totalPipeline.toLocaleString()}</div>
      <div class="kpi-sub">Gemiddeld € 3.550 per dossier</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Debbie 10% Cash Potentieel</div>
      <div class="kpi-val" style="color: var(--green);">€ ${Math.round(totalDebbie).toLocaleString()}</div>
      <div class="kpi-sub">Abraham 90%: € ${Math.round(totalAbraham).toLocaleString()}</div>
    </div>
  </div>

  <div class="controls">
    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Zoek op kantoornaam, advocaat, notaris, straat of specifieke fout..." oninput="filterData()">
    <div class="pills-row">
      <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Sector:</span>
      <button class="pill active" onclick="setSector('ALL')">Alle Sectoren</button>
      <button class="pill" onclick="setSector('LEGAL')">⚖️ Advocaten</button>
      <button class="pill" onclick="setSector('NOTARY')">📜 Notarissen</button>
      <button class="pill" onclick="setSector('TAX_FINANCE')">💼 Fiscalisten & Accountants</button>
      <button class="pill" onclick="setSector('DENTAL_SURGERY')">🦷 Tandartsen</button>
      <button class="pill" onclick="setSector('LUXURY_HOTEL')">🏨 Boetiekhotels</button>
      <button class="pill" onclick="setSector('LEASING_REAL_ESTATE')">🏢 Vastgoed / Makelaars</button>
    </div>
    <div class="pills-row">
      <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Stad:</span>
      <button class="pill active" onclick="setCity('ALL')">Alle Steden</button>
      <button class="pill" onclick="setCity('Arnhem')">Arnhem</button>
      <button class="pill" onclick="setCity('Nijmegen')">Nijmegen</button>
      <button class="pill" onclick="setCity('Velp')">Velp / Rheden</button>
      <button class="pill" onclick="setCity('Oosterbeek')">Oosterbeek</button>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Prioriteit</th>
          <th>Kantoor / Bedrijf</th>
          <th>Stad & Adres</th>
          <th>Telefoon</th>
          <th>Geconstateerde Fout</th>
          <th>Pakket & 90/10 Inkomsten</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <!-- Modal -->
  <div class="modal-overlay" id="modal" onclick="closeModal()">
    <div class="modal-card" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h3 id="mTitle" style="font-size: 18px; margin-bottom: 4px;">Kantoornaam</h3>
      <div id="mSub" style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Sector | Stad</div>

      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">🗣️ Debbie's Deurpraatkaart:</div>
      <div style="background: #070a12; border: 1px solid #1f2937; border-radius: 8px; padding: 14px; margin: 8px 0 16px; font-size: 14px; line-height: 1.5;" id="mPitch">
      </div>
      <button class="btn btn-gold" onclick="copyPitch()" style="width: 100%; justify-content: center; margin-bottom: 16px;">📋 Kopieer Praatkaart naar Klembord</button>

      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">💰 Commercieel ROI Argument:</div>
      <div style="background: #0f172a; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 6px;" id="mRoi"></div>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <a id="mCall" href="tel:" class="btn btn-gold">📞 Direct Bellen</a>
        <button class="btn" onclick="closeModal()">Sluiten</button>
      </div>
    </div>
  </div>

  <script>
    const LEADS = ${serialized};
    let curSector = 'ALL';
    let curCity = 'ALL';
    let searchQ = '';

    function renderTable(data) {
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';
      data.forEach((l, idx) => {
        const opp = l.opportunity || {};
        const tr = document.createElement('tr');
        const badge = l.priority === 'RED' ? '<span class="badge-red">🔴 RED</span>' : '<span class="badge-org">🟡 ORG</span>';
        const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags[0] : 'Optimalisatie';
        const phone = l.phone_public ? \`<a href="tel:\${l.phone_public}" style="color:var(--blue); font-family:monospace;">📞 \${l.phone_public}</a>\` : '<span style="color:#6b7280;">Geen tel.</span>';

        tr.innerHTML = \`
          <td>\${badge}</td>
          <td>
            <strong>\${l.business_name}</strong><br>
            <a href="\${l.website}" target="_blank" style="color:var(--blue); text-decoration:none; font-size:12px;">🌐 \${l.domain} ↗</a><br>
            <span style="font-size:11px; color:var(--text-muted);">\${l.sector_name}</span>
          </td>
          <td>
            <strong>\${l.city}</strong><br>
            <span style="font-size:11px; color:var(--text-muted);">\${l.address || ''}</span>
          </td>
          <td>\${phone}</td>
          <td><span style="color:#fca5a5; font-size:12px;">⚠️ \${flaws}</span></td>
          <td>
            <strong>€ \${opp.setupFeeEur?.toLocaleString()}</strong> setup<br>
            <span style="font-size:11px; color:#34d399;">Debbie (10%): €\${opp.debbieSetupCashEur} | Abraham (90%): €\${opp.abrahamSetupTechEur}</span><br>
            <span style="font-size:11px; color:var(--text-muted);">+ €\${opp.monthlyRetainerEur}/mnd</span>
          </td>
          <td>
            <button class="btn btn-gold" onclick="openModal(\${l._idx})">🗣️ Praatkaart</button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    LEADS.forEach((l, i) => l._idx = i);

    function filterData() {
      searchQ = document.getElementById('searchInput').value.toLowerCase().trim();
      const filtered = LEADS.filter(l => {
        if (curSector !== 'ALL' && l.sector_id !== curSector) return false;
        if (curCity !== 'ALL' && !l.city.includes(curCity)) return false;
        if (searchQ) {
          const matchName = l.business_name.toLowerCase().includes(searchQ);
          const matchDomain = l.domain.toLowerCase().includes(searchQ);
          const matchAddr = (l.address || '').toLowerCase().includes(searchQ);
          if (!matchName && !matchDomain && !matchAddr) return false;
        }
        return true;
      });
      renderTable(filtered);
    }

    function setSector(sec) {
      curSector = sec;
      document.querySelectorAll('.pills-row:nth-of-type(1) .pill').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      filterData();
    }

    function setCity(city) {
      curCity = city;
      document.querySelectorAll('.pills-row:nth-of-type(2) .pill').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      filterData();
    }

    function openModal(idx) {
      const l = LEADS[idx];
      document.getElementById('mTitle').innerText = l.business_name;
      document.getElementById('mSub').innerText = \`\${l.sector_name} | \${l.address || l.city}\`;
      document.getElementById('mPitch').innerText = l.opportunity?.debbiePitchNL || 'Geen praatkaart.';
      document.getElementById('mRoi').innerText = l.opportunity?.businessRoiPitchNL || '';
      const c = document.getElementById('mCall');
      if (l.phone_public) {
        c.href = 'tel:' + l.phone_public;
        c.style.display = 'inline-flex';
      } else {
        c.style.display = 'none';
      }
      document.getElementById('modal').style.display = 'flex';
    }

    function closeModal() { document.getElementById('modal').style.display = 'none'; }
    function copyPitch() {
      navigator.clipboard.writeText(document.getElementById('mPitch').innerText);
      alert('Praatkaart gekopieerd!');
    }
    function exportCsv() {
      window.location.href = 'ARNHEM_NIJMEGEN_HIGH_TICKET_LEADS.csv';
    }

    filterData();
  </script>
</body>
</html>`;

  const htmlPath = path.join(ROOT_DIR, 'ARNHEM_NIJMEGEN_HIGH_TICKET_VIEWER.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`✅ Saved high-ticket interactive HTML viewer to ${htmlPath}`);
}

async function main() {
  const jsonPath = path.join(ROOT_DIR, 'data', 'arnhem_nijmegen_high_ticket_audited.json');
  if (fs.existsSync(jsonPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    generateHighTicketDeliverables(raw);
  }
}

main().catch(console.error);
