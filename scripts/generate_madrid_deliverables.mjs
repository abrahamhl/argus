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

export function generateMadridDeliverables(leads) {
  console.log(`\n======================================================`);
  console.log(`🇪🇸 GENERANDO ENTREGABLES DE MADRID (HERMANO & POLA)`);
  console.log(`======================================================\n`);

  const redLeads = leads.filter(l => l.priority === 'RED');
  console.log(`Total Leads Madrid: ${leads.length} | 🔴 ROJO Urgente: ${redLeads.length}`);

  // 1. Dossier Checklist Imprimible en Markdown
  let md = `# 🇪🇸 DOSSIER DE COMBATE COMERCIAL: MADRID (HERMANO & POLA)
## Catálogo de Clientes Reales Verificados en ROJO — Mínimo 200 Negocios

> **Destinatarios**: Hermano de Abraham & Pola (Madrid)  
> **Área Geográfica**: Madrid Capital (Barrio de Salamanca, Chamberí, Chamartín, Centro, Retiro, Castellana)  
> **Sectores**: Bufetes de Abogados, Notarías, Clínicas Dentales/Implantes, Clínicas de Medicina Estética, Asesorías Fiscales y Hoteles Boutique.  
> **Modelo Económico para Hermano & Pola**:
> - **Comisión en mano por cierre (20%)**: **€ 370 a € 570 directos** por cada negocio firmado.
> - **Ejecución Técnica Abraham (80%)**: **€ 1.480 a € 2.280** (Abraham implementa toda la web, DMARC y agenda en 48h).

---

## 📊 Resumen del Mercado Auditado en Madrid

| Sector en Madrid | Negocios Auditados | Ticket Medio Setup | Valor Total Pipeline | Comisión Hermano & Pola (20%) |
| :--- | :--- | :--- | :--- | :--- |
| ⚖️ **Bufetes de Abogados** | ${leads.filter(l => l.sector_id === 'LEGAL').length} | € 2.850 | € ${(leads.filter(l => l.sector_id === 'LEGAL').length * 2850).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'LEGAL').length * 570).toLocaleString()} |
| 📜 **Notarías de Madrid** | ${leads.filter(l => l.sector_id === 'NOTARY').length} | € 2.850 | € ${(leads.filter(l => l.sector_id === 'NOTARY').length * 2850).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'NOTARY').length * 570).toLocaleString()} |
| 🦷 **Clínicas Dentales & Implantes** | ${leads.filter(l => l.sector_id === 'DENTAL').length} | € 1.950 | € ${(leads.filter(l => l.sector_id === 'DENTAL').length * 1950).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'DENTAL').length * 390).toLocaleString()} |
| 💉 **Medicina Estética & Cirugía** | ${leads.filter(l => l.sector_id === 'AESTHETICS').length} | € 2.150 | € ${(leads.filter(l => l.sector_id === 'AESTHETICS').length * 2150).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'AESTHETICS').length * 430).toLocaleString()} |
| 💼 **Asesorías Fiscales & Gestorías** | ${leads.filter(l => l.sector_id === 'TAX_FINANCE').length} | € 1.850 | € ${(leads.filter(l => l.sector_id === 'TAX_FINANCE').length * 1850).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'TAX_FINANCE').length * 370).toLocaleString()} |
| 🏨 **Hoteles Boutique & Suites** | ${leads.filter(l => l.sector_id === 'HOTEL').length} | € 2.850 | € ${(leads.filter(l => l.sector_id === 'HOTEL').length * 2850).toLocaleString()} | € ${(leads.filter(l => l.sector_id === 'HOTEL').length * 570).toLocaleString()} |
| **TOTAL AUDITADO MADRID** | **${leads.length}** | **€ 2.350 (prom)** | **€ ${(leads.length * 2350).toLocaleString()}** | **€ ${(leads.length * 470).toLocaleString()}** |

---

## 🗺️ LISTA DE COMBATE CALLE POR CALLE CON CASILLAS PARA TACHAR [ ]

`;

  // Group by zone/district
  const zones = {};
  for (const l of leads) {
    const z = l.zone || 'Madrid Central';
    if (!zones[z]) zones[z] = [];
    zones[z].push(l);
  }

  for (const [zoneName, zoneLeads] of Object.entries(zones)) {
    md += `### 📍 Zona: ${zoneName} (${zoneLeads.length} Negocios Calificados)\n\n`;

    zoneLeads.forEach((l, idx) => {
      const opp = l.opportunity || {};
      const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join('; ') : 'Revisión DMARC y Web necesaria';
      const phoneStr = l.phone_public ? `[\`${l.phone_public}\`](tel:${l.phone_public.replace(/\s+/g, '')})` : '*Sin teléfono público*';
      const webStr = `[${l.domain}](${l.website})`;

      md += `#### - [ ] ${idx + 1}. **${l.business_name}** (${l.sector_name})\n`;
      md += `- **Dirección**: ${l.address}\n`;
      md += `- **Contacto**: 📞 ${phoneStr} | 🌐 ${webStr}\n`;
      md += `- **⚠️ Falla Técnica / Criticidad**: ${flaws}\n`;
      md += `- **💼 Paquete Recomendado**: **${opp.packageName}** — **€ ${opp.setupFeeEur?.toLocaleString()}**\n`;
      md += `- **💰 Reparto (20/80)**: **Hermano & Pola en mano: € ${opp.hermanoPolaCashEur}** | Abraham Ingeniería: € ${opp.abrahamTechEur} (+ € ${opp.monthlyRetainerEur}/mes)\n`;
      md += `- **🗣️ Guion de Puerta / Llamada (Madrid)**:\n`;
      md += `  > *"${opp.pitchScriptES}"*\n`;
      md += `- **📈 Argumento de Rentabilidad**: ${opp.roiArgumentES}\n`;
      md += `- **Resultado Visita/Contacto**: [ ] Interesado / Demo agendada | [ ] Enviar propuesta | [ ] Hablado con: ______________\n\n`;
    });
  }

  const checklistPath = path.join(ROOT_DIR, 'MADRID_HERMANO_POLA_200_LEADS.md');
  fs.writeFileSync(checklistPath, md, 'utf8');
  console.log(`✅ Guardado dossier en ${checklistPath}`);

  // 2. CSV para Excel con UTF-8 BOM
  const BOM = '\uFEFF';
  const csvHeaders = [
    'Prioridad',
    'Nombre_Negocio',
    'Sector',
    'Zona_Distrito',
    'Direccion',
    'Telefono',
    'Sitio_Web',
    'Falla_Critica_Detectada',
    'Paquete_Recomendado',
    'Precio_Setup_EUR',
    'Comision_Hermano_Pola_20pct_EUR',
    'Ingenieria_Abraham_80pct_EUR',
    'Cuota_Mantenimiento_EUR',
    'Guion_Puerta_Llamada',
    'Argumento_Rentabilidad'
  ];

  const csvRows = leads.map(l => {
    const opp = l.opportunity || {};
    const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags.join(' | ') : 'Falta DMARC / Cita previa';
    return [
      escapeCsv(l.priority),
      escapeCsv(l.business_name),
      escapeCsv(l.sector_name),
      escapeCsv(l.zone),
      escapeCsv(l.address),
      escapeCsv(l.phone_public || ''),
      escapeCsv(l.website),
      escapeCsv(flaws),
      escapeCsv(opp.packageName),
      escapeCsv(opp.setupFeeEur),
      escapeCsv(opp.hermanoPolaCashEur),
      escapeCsv(opp.abrahamTechEur),
      escapeCsv(opp.monthlyRetainerEur),
      escapeCsv(opp.pitchScriptES),
      escapeCsv(opp.roiArgumentES)
    ].join(',');
  });

  const csvContent = BOM + [csvHeaders.join(','), ...csvRows].join('\r\n');
  const csvPath = path.join(ROOT_DIR, 'MADRID_HERMANO_POLA_200_LEADS.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'data', 'MADRID_HERMANO_POLA_200_LEADS.csv'), csvContent, 'utf8');
  console.log(`✅ Guardado CSV con BOM UTF-8 en ${csvPath}`);

  // 3. HTML Standalone Viewer
  const serialized = JSON.stringify(leads).replace(/</g, '\\u003c');
  const totalPipeline = leads.reduce((acc, l) => acc + (l.opportunity?.setupFeeEur || 0), 0);
  const totalHermano = leads.reduce((acc, l) => acc + (l.opportunity?.hermanoPolaCashEur || 0), 0);
  const totalAbraham = leads.reduce((acc, l) => acc + (l.opportunity?.abrahamTechEur || 0), 0);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARGUS Madrid | Panel de Clientes para Hermano & Pola</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --card-hover: #1e293b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --red: #ef4444;
      --gold: #f59e0b;
      --green: #10b981;
      --blue: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .brand-title { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
    .badge-es { background: #dc2626; color: #fff; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 6px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 18px; }
    .kpi-title { font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 6px; }
    .kpi-val { font-size: 26px; font-weight: 800; }
    .controls { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
    .search-input { width: 100%; background: #070a12; border: 1px solid #334155; color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; outline: none; }
    .pills-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pill { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .pill.active { background: var(--blue); color: #000; font-weight: 700; border-color: var(--blue); }
    .table-container { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    th { background: #0c1220; color: #94a3b8; padding: 12px 16px; border-bottom: 1px solid var(--card-border); text-transform: uppercase; font-size: 11px; }
    td { padding: 14px 16px; border-bottom: 1px solid #1a2234; vertical-align: middle; }
    tr:hover td { background: var(--card-hover); }
    .badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
    .btn { background: #1e293b; color: #fff; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
    .btn-red { background: #dc2626; border-color: #ef4444; color: #fff; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-card { background: #111827; border: 1px solid #374151; border-radius: 16px; max-width: 650px; width: 100%; padding: 24px; position: relative; }
    .modal-close { position: absolute; top: 16px; right: 16px; background: #1f2937; border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; }
  </style>
</head>
<body>

  <header>
    <div>
      <div class="brand-title">
        ARGUS Madrid Engine
        <span class="badge-es">🇪🇸 Hermano & Pola</span>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
        Catálogo de Alta Rentabilidad: Salamanca, Chamberí, Castellana, Centro & Retiro
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <a href="MADRID_HERMANO_POLA_200_LEADS.md" class="btn">📋 Checklist Imprimible (MD)</a>
      <a href="MADRID_HERMANO_POLA_200_LEADS.csv" class="btn btn-red">📥 Descargar CSV</a>
    </div>
  </header>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Negocios Auditados en Madrid</div>
      <div class="kpi-val" style="color: var(--blue);">${leads.length}</div>
      <div class="kpi-sub">Bufetes, Notarías, Clínicas y Hoteles</div>
    </div>
    <div class="kpi-card" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
      <div class="kpi-title" style="color: var(--red);">🔴 Casos en ROJO Crítico</div>
      <div class="kpi-val" style="color: var(--red);">${redLeads.length}</div>
      <div class="kpi-sub">Falta DMARC / Cero reservas online</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Valor Total Pipeline Madrid</div>
      <div class="kpi-val" style="color: var(--gold);">€ ${totalPipeline.toLocaleString()}</div>
      <div class="kpi-sub">Promedio € 2.350 por negocio</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Comisión Hermano & Pola (20%)</div>
      <div class="kpi-val" style="color: var(--green);">€ ${Math.round(totalHermano).toLocaleString()}</div>
      <div class="kpi-sub">Abraham (80% Tech): € ${Math.round(totalAbraham).toLocaleString()}</div>
    </div>
  </div>

  <div class="controls">
    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Buscar por nombre, abogado, clínica, calle o problema..." oninput="filterData()">
    <div class="pills-row">
      <span style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Sector:</span>
      <button class="pill active" onclick="setSector('ALL')">Todos los Sectores</button>
      <button class="pill" onclick="setSector('LEGAL')">⚖️ Bufetes Abogados</button>
      <button class="pill" onclick="setSector('NOTARY')">📜 Notarías</button>
      <button class="pill" onclick="setSector('DENTAL')">🦷 Dentales / Implantes</button>
      <button class="pill" onclick="setSector('AESTHETICS')">💉 Medicina Estética</button>
      <button class="pill" onclick="setSector('TAX_FINANCE')">💼 Asesorías / Gestorías</button>
      <button class="pill" onclick="setSector('HOTEL')">🏨 Hoteles Boutique</button>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Estado</th>
          <th>Negocio / Empresa</th>
          <th>Zona & Dirección</th>
          <th>Teléfono</th>
          <th>Falla Crítica Detectada</th>
          <th>Precio Setup & Comisión (20%)</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <!-- Modal -->
  <div class="modal-overlay" id="modal" onclick="closeModal()">
    <div class="modal-card" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <h3 id="mTitle" style="font-size: 18px; margin-bottom: 4px;">Nombre Negocio</h3>
      <div id="mSub" style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Sector | Madrid</div>

      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">🗣️ Guion de Puerta Fría / Llamada:</div>
      <div style="background: #070a12; border: 1px solid #1f2937; border-radius: 8px; padding: 14px; margin: 8px 0 16px; font-size: 14px; line-height: 1.5;" id="mPitch"></div>
      <button class="btn btn-red" onclick="copyPitch()" style="width: 100%; justify-content: center; margin-bottom: 16px;">📋 Copiar Guion al Portapapeles</button>

      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">💰 Argumento de Rentabilidad (ROI):</div>
      <div style="background: #0f172a; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 6px;" id="mRoi"></div>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <a id="mCall" href="tel:" class="btn btn-red">📞 Llamar Directamente</a>
        <button class="btn" onclick="closeModal()">Cerrar</button>
      </div>
    </div>
  </div>

  <script>
    const LEADS = ${serialized};
    let curSector = 'ALL';
    let searchQ = '';

    function renderTable(data) {
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';
      data.forEach((l, idx) => {
        const opp = l.opportunity || {};
        const tr = document.createElement('tr');
        const badge = l.priority === 'RED' ? '<span class="badge-red">🔴 ROJO</span>' : '<span style="color:#f59e0b;">🟡 ORG</span>';
        const flaws = (l.redFlags && l.redFlags.length > 0) ? l.redFlags[0] : 'Revisión técnica';
        const phone = l.phone_public ? \`<a href="tel:\${l.phone_public}" style="color:var(--blue); font-family:monospace;">📞 \${l.phone_public}</a>\` : '<span style="color:#6b7280;">Sin tel.</span>';

        tr.innerHTML = \`
          <td>\${badge}</td>
          <td>
            <strong>\${l.business_name}</strong><br>
            <a href="\${l.website}" target="_blank" style="color:var(--blue); text-decoration:none; font-size:12px;">🌐 \${l.domain} ↗</a><br>
            <span style="font-size:11px; color:var(--text-muted);">\${l.sector_name}</span>
          </td>
          <td>
            <strong>\${l.address}</strong><br>
            <span style="font-size:11px; color:var(--text-muted);">\${l.zone || 'Madrid'}</span>
          </td>
          <td>\${phone}</td>
          <td><span style="color:#fca5a5; font-size:12px;">⚠️ \${flaws}</span></td>
          <td>
            <strong>€ \${opp.setupFeeEur?.toLocaleString()}</strong> setup<br>
            <span style="font-size:11px; color:#34d399;">Hermano & Pola (20%): <strong>€ \${opp.hermanoPolaCashEur}</strong></span><br>
            <span style="font-size:11px; color:var(--text-muted);">Abraham (80%): € \${opp.abrahamTechEur} (+ € \${opp.monthlyRetainerEur}/mes)</span>
          </td>
          <td>
            <button class="btn btn-red" onclick="openModal(\${l._idx})">🗣️ Guion</button>
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
      document.querySelectorAll('.pills-row .pill').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      filterData();
    }

    function openModal(idx) {
      const l = LEADS[idx];
      document.getElementById('mTitle').innerText = l.business_name;
      document.getElementById('mSub').innerText = \`\${l.sector_name} | \${l.address}\`;
      document.getElementById('mPitch').innerText = l.opportunity?.pitchScriptES || 'Sin guion.';
      document.getElementById('mRoi').innerText = l.opportunity?.roiArgumentES || '';
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
      alert('Guion copiado al portapapeles!');
    }

    filterData();
  </script>
</body>
</html>`;

  const htmlPath = path.join(ROOT_DIR, 'MADRID_HERMANO_POLA_VIEWER.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`✅ Guardado visor interactivo de Madrid en ${htmlPath}`);
}

async function main() {
  const jsonPath = path.join(ROOT_DIR, 'data', 'madrid_hermano_pola_audited.json');
  if (fs.existsSync(jsonPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    generateMadridDeliverables(raw);
  }
}

main().catch(console.error);
