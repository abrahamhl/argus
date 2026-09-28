import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export function generateCommandCenterHtml(leads, outputPath) {
  console.log(`Compiling ARGUS Lead Command Center HTML for ${leads.length} leads...`);

  const redCount = leads.filter(l => l.priority === 'RED').length;
  const orangeCount = leads.filter(l => l.priority === 'ORANGE').length;
  const greenCount = leads.filter(l => l.priority === 'GREEN').length;

  const totalSetupPipeline = leads.reduce((sum, l) => sum + (l.opportunity?.setupFeeEur || 0), 0);
  const totalDebbieCash = leads.reduce((sum, l) => sum + (l.opportunity?.debbieSetupEur || 0), 0);
  const totalAbrahamCash = leads.reduce((sum, l) => sum + (l.opportunity?.abrahamSetupEur || 0), 0);

  const serializedData = JSON.stringify(leads).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARGUS Lead Intelligence & Commercial Command Center</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --card-hover: #1e293b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.12);
      --red-border: rgba(239, 68, 68, 0.35);
      --orange: #f59e0b;
      --orange-bg: rgba(245, 158, 11, 0.12);
      --orange-border: rgba(245, 158, 11, 0.35);
      --green: #10b981;
      --green-bg: rgba(16, 185, 129, 0.12);
      --green-border: rgba(16, 185, 129, 0.35);
      --blue: #38bdf8;
      --blue-bg: rgba(56, 189, 248, 0.12);
      --purple: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; padding: 24px; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #fff; box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-subtitle { font-size: 13px; color: var(--text-muted); }
    .header-actions { display: flex; gap: 12px; }
    .btn { background: #1e293b; color: #fff; border: 1px solid #334155; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
    .btn:hover { background: #334155; border-color: #475569; }
    .btn-primary { background: #0284c7; border-color: #38bdf8; color: #fff; }
    .btn-primary:hover { background: #0369a1; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; }
    .kpi-title { font-size: 12px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; }
    .kpi-value { font-size: 28px; font-weight: 800; }
    .kpi-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .val-red { color: var(--red); }
    .val-orange { color: var(--orange); }
    .val-green { color: var(--green); }
    .val-blue { color: var(--blue); }

    /* Controls & Filters */
    .controls { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px; }
    .search-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 280px; background: #0b0f19; border: 1px solid #334155; color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; outline: none; }
    .search-input:focus { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pill-label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-right: 4px; }
    .pill { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .pill:hover { background: #334155; color: #fff; }
    .pill.active { background: var(--blue); border-color: var(--blue); color: #090d16; font-weight: 700; }
    .pill-red.active { background: var(--red); border-color: var(--red); color: #fff; }
    .pill-orange.active { background: var(--orange); border-color: var(--orange); color: #fff; }
    .pill-green.active { background: var(--green); border-color: var(--green); color: #fff; }

    /* Results Table */
    .table-container { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden; }
    .table-header-info { padding: 14px 18px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-muted); }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #0d1322; color: #94a3b8; font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--card-border); text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    td { padding: 14px 16px; border-bottom: 1px solid #1a2234; vertical-align: middle; }
    tr:hover td { background-color: var(--card-hover); }

    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .badge-red { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
    .badge-orange { background: var(--orange-bg); color: var(--orange); border: 1px solid var(--orange-border); }
    .badge-green { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }

    .company-cell { display: flex; flex-direction: column; gap: 2px; }
    .company-name { font-weight: 700; font-size: 14px; color: #fff; }
    .company-domain { color: var(--blue); text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
    .company-domain:hover { text-decoration: underline; }
    .sector-tag { font-size: 11px; color: var(--text-muted); }

    .phone-link { color: #38bdf8; text-decoration: none; font-weight: 600; font-family: monospace; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; background: rgba(56, 189, 248, 0.08); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.2); }
    .phone-link:hover { background: rgba(56, 189, 248, 0.2); }

    .flaws-list { display: flex; flex-direction: column; gap: 4px; }
    .flaw-tag { font-size: 11px; color: #fca5a5; display: inline-flex; align-items: center; gap: 4px; }

    .price-box { display: flex; flex-direction: column; }
    .price-main { font-weight: 800; color: #fff; font-size: 14px; }
    .price-sub { font-size: 11px; color: var(--text-muted); }
    .split-pill { font-size: 10px; color: #34d399; font-weight: 600; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-card { background: #111827; border: 1px solid #374151; border-radius: 16px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; padding: 24px; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .modal-close { position: absolute; top: 18px; right: 18px; background: #1f2937; border: 1px solid #374151; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; font-weight: bold; }
    .modal-title { font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #fff; }
    .modal-subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
    .script-box { background: #090d16; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #e5e7eb; position: relative; }
    .copy-btn { position: absolute; top: 12px; right: 12px; background: #0284c7; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .copy-btn:hover { background: #0369a1; }
    .tech-box { background: #0f172a; border-left: 4px solid var(--blue); padding: 14px; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.5; color: #94a3b8; margin-top: 14px; }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-logo">A</div>
      <div>
        <div class="brand-title">ARGUS Lead Intelligence & Commercial Command Center</div>
        <div class="brand-subtitle">High-ROI Local Cyber, Web & Booking Intelligence Platform | Arnhem, Gelderland & NRW Border</div>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn" onclick="exportFilteredCSV()">📥 Export Filtered CSV</button>
      <button class="btn btn-primary" onclick="filterByPriority('RED')">🔴 Focus Red Leads</button>
    </div>
  </header>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Audited Leads</div>
      <div class="kpi-value val-blue" id="kpiTotal">${leads.length}</div>
      <div class="kpi-sub">Cross-Border High-Ticket Businesses</div>
    </div>
    <div class="kpi-card" style="border-color: var(--red-border); background: var(--red-bg);">
      <div class="kpi-title" style="color: var(--red);">🔴 Red Urgency (Immediate ROI)</div>
      <div class="kpi-value val-red" id="kpiRed">${redCount}</div>
      <div class="kpi-sub">Missing Booking, DMARC or Privacy Fault</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">🟡 Orange Moderate Leads</div>
      <div class="kpi-value val-orange" id="kpiOrange">${orangeCount}</div>
      <div class="kpi-sub">Missing HSTS or Mobile Optimization</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Setup Revenue Pipeline (90/10)</div>
      <div class="kpi-value val-green">€${totalSetupPipeline.toLocaleString()}</div>
      <div class="kpi-sub">Abraham: €${Math.round(totalAbrahamCash).toLocaleString()} | Debbie: €${Math.round(totalDebbieCash).toLocaleString()}</div>
    </div>
  </div>

  <div class="controls">
    <div class="search-row">
      <input type="text" id="searchInput" class="search-input" placeholder="🔍 Instant search company name, domain, city, phone, or specific flaw..." oninput="applyFilters()">
    </div>
    <div class="filter-pills">
      <span class="pill-label">Priority:</span>
      <button class="pill pill-red active" id="pillRed" onclick="toggleFilter('priority', 'RED')">🔴 RED Urgency (${redCount})</button>
      <button class="pill pill-orange" id="pillOrange" onclick="toggleFilter('priority', 'ORANGE')">🟡 ORANGE (${orangeCount})</button>
      <button class="pill pill-green" id="pillGreen" onclick="toggleFilter('priority', 'GREEN')">🟢 GREEN (${greenCount})</button>
      <button class="pill" id="pillAllPri" onclick="toggleFilter('priority', 'ALL')">ALL Priorities</button>
    </div>
    <div class="filter-pills">
      <span class="pill-label">Country:</span>
      <button class="pill active" id="pillCountryAll" onclick="toggleFilter('country', 'ALL')">All Countries</button>
      <button class="pill" id="pillCountryNL" onclick="toggleFilter('country', 'NL')">🇳🇱 Netherlands</button>
      <button class="pill" id="pillCountryDE" onclick="toggleFilter('country', 'DE')">🇩🇪 Germany</button>
    </div>
    <div class="filter-pills" id="cityPillsContainer">
      <span class="pill-label">Top Cities:</span>
      <button class="pill active" onclick="toggleFilter('city', 'ALL')">All Cities</button>
      <button class="pill" onclick="toggleFilter('city', 'Arnhem')">Arnhem</button>
      <button class="pill" onclick="toggleFilter('city', 'Nijmegen')">Nijmegen</button>
      <button class="pill" onclick="toggleFilter('city', 'Apeldoorn')">Apeldoorn</button>
      <button class="pill" onclick="toggleFilter('city', 'Deventer')">Deventer</button>
      <button class="pill" onclick="toggleFilter('city', 'Enschede')">Enschede</button>
      <button class="pill" onclick="toggleFilter('city', 'Zwolle')">Zwolle</button>
      <button class="pill" onclick="toggleFilter('city', 'Kleve')">Kleve</button>
      <button class="pill" onclick="toggleFilter('city', 'Bocholt')">Bocholt</button>
      <button class="pill" onclick="toggleFilter('city', 'Wesel')">Wesel</button>
      <button class="pill" onclick="toggleFilter('city', 'Krefeld')">Krefeld</button>
    </div>
  </div>

  <div class="table-container">
    <div class="table-header-info">
      <div>Showing <strong id="visibleCount">${leads.length}</strong> qualified leads</div>
      <div id="filterSummaryText">Filter: 🔴 RED Priority</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Bedrijf / Website</th>
          <th>Stad & Regio</th>
          <th>Telefoon</th>
          <th>Geconstateerde Fout (Audit)</th>
          <th>Aanbevolen Pakket & 90/10 Split</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody id="leadsTableBody">
      </tbody>
    </table>
  </div>

  <!-- Modal for Pitch Script & Tech Fix -->
  <div class="modal-overlay" id="leadModal" onclick="closeModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-close" onclick="closeModal()">✕</div>
      <div class="badge" id="modalBadge">🔴 RED URGENCY</div>
      <h2 class="modal-title" id="modalTitle">Bedrijfsnaam</h2>
      <div class="modal-subtitle" id="modalSubtitle">Arnhem, Netherlands | Tandartsen</div>

      <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); margin-top: 14px;">📞 DEBBIE'S VERKOOPPRAATKAART (TELEFOON / DEUR):</div>
      <div class="script-box">
        <button class="copy-btn" onclick="copyModalScript()">📋 Kopieer Praatkaart</button>
        <div id="modalScript">Praatkaart tekst...</div>
      </div>

      <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); margin-top: 14px;">💰 COMMERCIËLE REKENSOM & ROI:</div>
      <div style="background: #090d16; padding: 12px; border-radius: 8px; border: 1px solid #1f2937; margin-top: 6px; font-size: 13px;" id="modalRoi">
        ROI tekst...
      </div>

      <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); margin-top: 14px;">🛠️ ABRAHAM'S TECHNISCHE OPLOSSING & ARTIFACT:</div>
      <div class="tech-box" id="modalTech">
        Technische oplossing...
      </div>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <a id="modalCallBtn" href="tel:" class="btn btn-primary">📞 Direct Bellen</a>
        <button class="btn" onclick="closeModal()">Sluiten</button>
      </div>
    </div>
  </div>

  <script>
    const ALL_LEADS = ${serializedData};
    let currentFilters = {
      priority: 'RED', // Default to RED for immediate ROI focus!
      country: 'ALL',
      city: 'ALL',
      search: ''
    };

    function renderTable(leadsToRender) {
      const tbody = document.getElementById('leadsTableBody');
      tbody.innerHTML = '';

      document.getElementById('visibleCount').innerText = leadsToRender.length;

      leadsToRender.forEach((lead, idx) => {
        const tr = document.createElement('tr');

        // Priority Badge
        let badgeClass = 'badge-green';
        let badgeText = '🟢 GREEN';
        if (lead.priority === 'RED') { badgeClass = 'badge-red'; badgeText = '🔴 RED'; }
        else if (lead.priority === 'ORANGE') { badgeClass = 'badge-orange'; badgeText = '🟡 ORG'; }

        // Flaws
        const flawsHtml = (lead.redFlags && lead.redFlags.length > 0)
          ? lead.redFlags.map(f => \`<div class="flaw-tag">⚠️ \${f}</div>\`).join('')
          : (lead.priority === 'ORANGE' ? '<div style="color:#f59e0b; font-size:11px;">⚠️ Mobiele/HSTS optimalisatie</div>' : '<div style="color:#10b981; font-size:11px;">✓ Geen acute kritieke fouten</div>');

        // Phone
        const phoneHtml = lead.phone_public 
          ? \`<a href="tel:\${lead.phone_public}" class="phone-link">📞 \${lead.phone_public}</a>\`
          : \`<span style="color:#6b7280; font-size:11px;">Geen tel. gevonden</span>\`;

        // Price
        const opp = lead.opportunity || {};
        const setup = opp.setupFeeEur || 895;
        const abraham = opp.abrahamSetupEur || Math.round(setup * 0.9);
        const debbie = opp.debbieSetupEur || Math.round(setup * 0.1);

        tr.innerHTML = \`
          <td><span class="badge \${badgeClass}">\${badgeText}</span></td>
          <td>
            <div class="company-cell">
              <span class="company-name">\${lead.business_name}</span>
              <a href="\${lead.website}" target="_blank" class="company-domain">🌐 \${lead.domain} ↗</a>
              <span class="sector-tag">\${lead.sector_name || 'MKB'}</span>
            </div>
          </td>
          <td>
            <strong>\${lead.city}</strong><br>
            <span style="font-size:11px; color:#9ca3af;">\${lead.country === 'NL' ? '🇳🇱 NL' : '🇩🇪 DE'} | \${lead.region || ''}</span>
          </td>
          <td>\${phoneHtml}</td>
          <td><div class="flaws-list">\${flawsHtml}</div></td>
          <td>
            <div class="price-box">
              <span class="price-main">€\${setup.toLocaleString()} setup</span>
              <span class="price-sub">Debbie (10%): €\${debbie} | Abraham (90%): €\${abraham}</span>
              <span class="split-pill">+ €\${opp.monthlyRetainerEur || 149}/mnd (+15% booking)</span>
            </div>
          </td>
          <td>
            <button class="btn btn-primary" style="font-size:11px; padding:6px 10px;" onclick="openLeadModal(\${lead._index})">📞 Praatkaart</button>
          </td>
        \`;

        tbody.appendChild(tr);
      });
    }

    // Tag indices
    ALL_LEADS.forEach((l, i) => l._index = i);

    function applyFilters() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      currentFilters.search = q;

      const filtered = ALL_LEADS.filter(l => {
        if (currentFilters.priority !== 'ALL' && l.priority !== currentFilters.priority) return false;
        if (currentFilters.country !== 'ALL' && l.country !== currentFilters.country) return false;
        if (currentFilters.city !== 'ALL' && l.city !== currentFilters.city) return false;

        if (q) {
          const matchName = (l.business_name || '').toLowerCase().includes(q);
          const matchDomain = (l.domain || '').toLowerCase().includes(q);
          const matchCity = (l.city || '').toLowerCase().includes(q);
          const matchPhone = (l.phone_public || '').includes(q);
          const matchFlaws = (l.redFlags || []).some(f => f.toLowerCase().includes(q));
          if (!matchName && !matchDomain && !matchCity && !matchPhone && !matchFlaws) return false;
        }
        return true;
      });

      renderTable(filtered);
    }

    function toggleFilter(type, value) {
      if (type === 'priority') {
        currentFilters.priority = value;
        document.querySelectorAll('.filter-pills:nth-of-type(1) .pill').forEach(p => p.classList.remove('active'));
        if (value === 'RED') document.getElementById('pillRed').classList.add('active');
        else if (value === 'ORANGE') document.getElementById('pillOrange').classList.add('active');
        else if (value === 'GREEN') document.getElementById('pillGreen').classList.add('active');
        else document.getElementById('pillAllPri').classList.add('active');
      } else if (type === 'country') {
        currentFilters.country = value;
        document.querySelectorAll('.filter-pills:nth-of-type(2) .pill').forEach(p => p.classList.remove('active'));
        if (value === 'ALL') document.getElementById('pillCountryAll').classList.add('active');
        else if (value === 'NL') document.getElementById('pillCountryNL').classList.add('active');
        else if (value === 'DE') document.getElementById('pillCountryDE').classList.add('active');
      } else if (type === 'city') {
        currentFilters.city = value;
        document.querySelectorAll('#cityPillsContainer .pill').forEach(p => p.classList.remove('active'));
        event.target.classList.add('active');
      }
      applyFilters();
    }

    function filterByPriority(pri) {
      toggleFilter('priority', pri);
    }

    function openLeadModal(idx) {
      const lead = ALL_LEADS[idx];
      if (!lead) return;

      document.getElementById('modalTitle').innerText = lead.business_name;
      document.getElementById('modalSubtitle').innerText = \`\${lead.city}, \${lead.country} | \${lead.sector_name} | \${lead.domain}\`;

      const badge = document.getElementById('modalBadge');
      badge.className = 'badge ' + (lead.priority === 'RED' ? 'badge-red' : (lead.priority === 'ORANGE' ? 'badge-orange' : 'badge-green'));
      badge.innerText = lead.priority === 'RED' ? '🔴 RED URGENCY' : (lead.priority === 'ORANGE' ? '🟡 ORANGE' : '🟢 GREEN');

      const opp = lead.opportunity || {};
      document.getElementById('modalScript').innerText = opp.pitchScriptLocal || 'Geen praatkaart beschikbaar.';
      document.getElementById('modalRoi').innerText = opp.businessRoiPitchLocal || 'Geen ROI pitch berekend.';
      document.getElementById('modalTech').innerHTML = \`<strong>Oplossing:</strong> \${opp.abrahamTechFix || 'Technische analyse'} <br><br><strong>Aanbevolen Pakket:</strong> \${opp.packageRecommended}\`;

      const callBtn = document.getElementById('modalCallBtn');
      if (lead.phone_public) {
        callBtn.href = \`tel:\${lead.phone_public}\`;
        callBtn.style.display = 'inline-flex';
        callBtn.innerText = \`📞 Bel \${lead.phone_public}\`;
      } else {
        callBtn.style.display = 'none';
      }

      document.getElementById('leadModal').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('leadModal').style.display = 'none';
    }

    function copyModalScript() {
      const text = document.getElementById('modalScript').innerText;
      navigator.clipboard.writeText(text).then(() => {
        alert('Praatkaart gekopieerd naar klembord!');
      });
    }

    function exportFilteredCSV() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const filtered = ALL_LEADS.filter(l => {
        if (currentFilters.priority !== 'ALL' && l.priority !== currentFilters.priority) return false;
        if (currentFilters.country !== 'ALL' && l.country !== currentFilters.country) return false;
        if (currentFilters.city !== 'ALL' && l.city !== currentFilters.city) return false;
        if (q) {
          const matchName = (l.business_name || '').toLowerCase().includes(q);
          const matchDomain = (l.domain || '').toLowerCase().includes(q);
          const matchCity = (l.city || '').toLowerCase().includes(q);
          if (!matchName && !matchDomain && !matchCity) return false;
        }
        return true;
      });

      let csv = 'Status,Bedrijf,Domein,Stad,Land,Telefoon,Sector,Geconstateerde_Fouten,Setup_EUR,Debbie_Cash_EUR,Abraham_Tech_EUR,Maandfee_EUR,Praatkaart\\n';
      filtered.forEach(l => {
        const opp = l.opportunity || {};
        const flaws = (l.redFlags || []).join('; ').replace(/"/g, '""');
        const script = (opp.pitchScriptLocal || '').replace(/"/g, '""');
        csv += \`"\${l.priority}","\${l.business_name}","\${l.domain}","\${l.city}","\${l.country}","\${l.phone_public || ''}","\${l.sector_name || ''}","\${flaws}","\${opp.setupFeeEur || 895}","\${opp.debbieSetupEur || 89.5}","\${opp.abrahamSetupEur || 805.5}","\${opp.monthlyRetainerEur || 149}","\${script}"\\n\`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`ARGUS_EXPORT_\${currentFilters.priority}_\${Date.now()}.csv\`;
      a.click();
    }

    // Initial render
    applyFilters();
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Saved standalone Command Center HTML to ${outputPath}`);
}

async function main() {
  const expandedPath = path.join(ROOT_DIR, 'data', 'argus_expanded_audit_results.json');
  const appointmentPath = path.join(ROOT_DIR, 'data', 'argus_appointment_audit_results.json');
  const targetPath = fs.existsSync(expandedPath) ? expandedPath : appointmentPath;
  if (fs.existsSync(targetPath)) {
    const raw = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    generateCommandCenterHtml(raw, path.join(ROOT_DIR, 'ARGUS_LEAD_COMMAND_CENTER.html'));
  }
}

main().catch(console.error);
