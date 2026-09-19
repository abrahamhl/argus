/**
 * ARGUS - Excel Report Generator
 * Creates color-coded Excel with scoring, vulnerabilities, pricing, and sales copy
 */

const fs = require('fs');
const path = require('path');

// Simple CSV generator (Excel can open CSV files)
function generateExcel(results) {
  const lines = [];

  // Header
  lines.push([
    'ID',
    'PRIORIDAD',
    'SCORE',
    'EMPRESA',
    'SECTOR',
    'WEBSITE',
    'TELÉFONO',
    'EMAIL',
    'DIRECCIÓN',
    'PAÍS',
    'REGIÓN',
    'CRÍTICOS',
    'ALTOS',
    'MEDIOS',
    'BAJOS',
    'TOTAL PROBLEMAS',
    'VULNERABILIDADES GDPR',
    'INCUMPLIMIENTOS GDPR',
    'PRECIO AUDITORÍA',
    'PRECIO REMEDIACIÓN',
    'PAQUETE COMPLETO',
    'SERVICIOS AUXDESIGN',
    'PRESUPUESTO TOTAL',
    'COPY VENTAS (ESPAÑOL)',
    'COPY VENTAS (HOLANDÉS)',
    'DETALLES VULNERABILIDADES'
  ].join('\t'));

  // Data rows
  results.forEach((r, idx) => {
    const services = r.pricing.services.map(s => `${s.service} (${s.price}€)`).join('; ');

    const vulnerabilities = [
      ...r.findings.details.critical.map(v => `CRÍTICO: ${v.name}`),
      ...r.findings.details.high.map(v => `ALTO: ${v.name}`),
      ...r.findings.details.medium.map(v => `MEDIO: ${v.name}`),
      ...r.findings.details.low.map(v => `BAJO: ${v.name}`)
    ].join('; ');

    const gdprDetails = r.gdprIssues.join('; ') || 'Ninguna';

    // Sales copy - escape quotes and newlines
    const salesCopy = r.salesCopy.replace(/"/g, '""').replace(/\n/g, ' | ');

    lines.push([
      r.id,
      r.category,
      r.score,
      r.name,
      r.sector,
      r.website,
      r.phone,
      r.email,
      r.address,
      r.country,
      r.region,
      r.findings.critical,
      r.findings.high,
      r.findings.medium,
      r.findings.low,
      r.findings.critical + r.findings.high + r.findings.medium + r.findings.low,
      r.gdprViolations,
      gdprDetails,
      `${r.pricing.baseAudit}€`,
      `${r.pricing.remediation}€`,
      `${r.pricing.fullPackage}€`,
      services,
      `${r.pricing.total}€`,
      r.country === 'España' ? salesCopy : '',
      r.country === 'Holanda' ? salesCopy : '',
      vulnerabilities
    ].join('\t'));
  });

  return lines.join('\n');
}

// Generate HTML with colors
function generateHTML(results) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARGUS - Auditoría 200 Negocios</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 1.1em; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .stat-card h3 { font-size: 0.9em; color: #666; margin-bottom: 8px; }
    .stat-card .number { font-size: 2em; font-weight: bold; }
    .stat-card.red .number { color: #e53e3e; }
    .stat-card.orange .number { color: #dd6b20; }
    .stat-card.green .number { color: #38a169; }
    .filters {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .filters input, .filters select {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 10px;
      font-size: 1em;
    }
    .business-card {
      background: white;
      border-left: 6px solid;
      padding: 24px;
      margin-bottom: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .business-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .business-card.red { border-left-color: #e53e3e; }
    .business-card.orange { border-left-color: #dd6b20; }
    .business-card.green { border-left-color: #38a169; }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 16px;
    }
    .card-title { font-size: 1.5em; font-weight: bold; }
    .score-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      color: white;
      font-size: 1.2em;
    }
    .score-badge.red { background: #e53e3e; }
    .score-badge.orange { background: #dd6b20; }
    .score-badge.green { background: #38a169; }
    .card-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 6px;
    }
    .meta-item { font-size: 0.9em; }
    .meta-label { color: #666; font-weight: 600; }
    .vulnerabilities {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .vuln-box {
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }
    .vuln-box.critical { background: #fed7d7; color: #c53030; }
    .vuln-box.high { background: #feebc8; color: #c05621; }
    .vuln-box.medium { background: #fefcbf; color: #975a16; }
    .vuln-box.low { background: #c6f6d5; color: #276749; }
    .vuln-box .count { font-size: 2em; font-weight: bold; display: block; }
    .vuln-box .label { font-size: 0.8em; text-transform: uppercase; }
    .details {
      margin-top: 16px;
      padding: 16px;
      background: #f7fafc;
      border-radius: 6px;
    }
    .details h4 { margin-bottom: 8px; color: #2d3748; }
    .vuln-list { list-style: none; }
    .vuln-list li {
      padding: 8px;
      margin: 4px 0;
      border-radius: 4px;
      background: white;
    }
    .vuln-list li.critical { border-left: 4px solid #e53e3e; }
    .vuln-list li.high { border-left: 4px solid #dd6b20; }
    .vuln-list li.medium { border-left: 4px solid #ecc94b; }
    .vuln-list li.low { border-left: 4px solid #48bb78; }
    .pricing {
      margin-top: 16px;
      padding: 16px;
      background: #edf2f7;
      border-radius: 6px;
    }
    .pricing h4 { margin-bottom: 12px; color: #2d3748; }
    .price-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .price-item {
      background: white;
      padding: 12px;
      border-radius: 4px;
    }
    .price-label { font-size: 0.85em; color: #666; }
    .price-value { font-size: 1.3em; font-weight: bold; color: #2d3748; }
    .sales-copy {
      margin-top: 16px;
      padding: 16px;
      background: #e6fffa;
      border-left: 4px solid #319795;
      border-radius: 6px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 0.9em;
    }
    .services-list {
      margin-top: 12px;
    }
    .service-item {
      background: white;
      padding: 12px;
      margin: 8px 0;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .service-name { font-weight: 600; }
    .service-desc { color: #666; font-size: 0.85em; }
    .service-price { font-size: 1.2em; font-weight: bold; color: #2d3748; }
    .gdpr-warning {
      background: #fff5f5;
      border: 2px solid #fc8181;
      color: #c53030;
      padding: 12px;
      border-radius: 6px;
      margin-top: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ ARGUS Security Audit</h1>
    <p>200 Negocios Auditados: 100 Madrid + 100 Gelderland (Arnhem)</p>
    <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
  </div>

  <div class="stats">
    <div class="stat-card red">
      <h3>🔴 ROJO (Crítico)</h3>
      <div class="number">${results.filter(r => r.category === 'ROJO').length}</div>
      <p>Score 60-100</p>
    </div>
    <div class="stat-card orange">
      <h3>🟠 NARANJA (Alto)</h3>
      <div class="number">${results.filter(r => r.category === 'NARANJA').length}</div>
      <p>Score 30-59</p>
    </div>
    <div class="stat-card green">
      <h3>🟢 VERDE (Bajo)</h3>
      <div class="number">${results.filter(r => r.category === 'VERDE').length}</div>
      <p>Score 0-29</p>
    </div>
    <div class="stat-card">
      <h3>📊 Score Promedio</h3>
      <div class="number">${(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)}</div>
      <p>de 100</p>
    </div>
    <div class="stat-card">
      <h3>⚖️ Violaciones GDPR</h3>
      <div class="number">${results.reduce((s, r) => s + r.gdprViolations, 0)}</div>
      <p>Total detectadas</p>
    </div>
    <div class="stat-card">
      <h3>💰 Potencial Ingresos</h3>
      <div class="number">${(results.reduce((s, r) => s + r.pricing.fullPackage, 0) / 1000).toFixed(0)}K€</div>
      <p>Solo paquetes completos</p>
    </div>
  </div>

  <div class="filters">
    <input type="text" id="searchBox" placeholder="Buscar por nombre, web, sector..." onkeyup="filterResults()">
    <select id="categoryFilter" onchange="filterResults()">
      <option value="">Todas las categorías</option>
      <option value="ROJO">🔴 ROJO</option>
      <option value="NARANJA">🟠 NARANJA</option>
      <option value="VERDE">🟢 VERDE</option>
    </select>
    <select id="countryFilter" onchange="filterResults()">
      <option value="">Todos los países</option>
      <option value="España">🇪🇸 España</option>
      <option value="Holanda">🇳🇱 Holanda</option>
    </select>
  </div>

  <div id="results">
    ${results.map(r => {
      const colorClass = r.category === 'ROJO' ? 'red' : r.category === 'NARANJA' ? 'orange' : 'green';

      return `
        <div class="business-card ${colorClass}" data-category="${r.category}" data-country="${r.country}">
          <div class="card-header">
            <div>
              <div class="card-title">${r.name}</div>
              <div style="color: #666; margin-top: 4px;">${r.sector} • ${r.region}</div>
            </div>
            <div class="score-badge ${colorClass}">${r.score}/100</div>
          </div>

          <div class="card-meta">
            <div class="meta-item">
              <div class="meta-label">🌐 Website</div>
              <div>${r.website}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">📞 Teléfono</div>
              <div>${r.phone}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">📧 Email</div>
              <div>${r.email}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">📍 Dirección</div>
              <div>${r.address}</div>
            </div>
          </div>

          <div class="vulnerabilities">
            <div class="vuln-box critical">
              <span class="count">${r.findings.critical}</span>
              <span class="label">Críticos</span>
            </div>
            <div class="vuln-box high">
              <span class="count">${r.findings.high}</span>
              <span class="label">Altos</span>
            </div>
            <div class="vuln-box medium">
              <span class="count">${r.findings.medium}</span>
              <span class="label">Medios</span>
            </div>
            <div class="vuln-box low">
              <span class="count">${r.findings.low}</span>
              <span class="label">Bajos</span>
            </div>
          </div>

          ${r.gdprViolations > 0 ? `
            <div class="gdpr-warning">
              ⚖️ INCUMPLIMIENTO GDPR: ${r.gdprViolations} violaciones detectadas
              <br>Multas potenciales: hasta €20.000
              <br>Problemas: ${r.gdprIssues.join(', ')}
            </div>
          ` : ''}

          <details class="details">
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 12px;">📋 Ver detalles vulnerabilidades</summary>
            <ul class="vuln-list">
              ${[...r.findings.details.critical.map(v => `<li class="critical">❌ CRÍTICO: ${v.name}</li>`),
                 ...r.findings.details.high.map(v => `<li class="high">⚠️ ALTO: ${v.name}</li>`),
                 ...r.findings.details.medium.map(v => `<li class="medium">⚡ MEDIO: ${v.name}</li>`),
                 ...r.findings.details.low.map(v => `<li class="low">ℹ️ BAJO: ${v.name}</li>`)
              ].join('')}
            </ul>
          </details>

          <div class="pricing">
            <h4>💰 Precios ${r.country}</h4>
            <div class="price-grid">
              <div class="price-item">
                <div class="price-label">Auditoría Base</div>
                <div class="price-value">${r.pricing.baseAudit}€</div>
              </div>
              <div class="price-item">
                <div class="price-label">Remediación</div>
                <div class="price-value">${r.pricing.remediation}€</div>
              </div>
              <div class="price-item">
                <div class="price-label">Paquete Completo</div>
                <div class="price-value" style="color: #38a169;">${r.pricing.fullPackage}€</div>
              </div>
              <div class="price-item">
                <div class="price-label">Total con Servicios</div>
                <div class="price-value" style="color: #667eea;">${r.pricing.total}€</div>
              </div>
            </div>

            <div class="services-list">
              <h4 style="margin-bottom: 8px;">🛠️ Servicios Auxdesign Aplicables:</h4>
              ${r.pricing.services.map(s => `
                <div class="service-item">
                  <div>
                    <div class="service-name">${s.service}</div>
                    <div class="service-desc">${s.description}</div>
                  </div>
                  <div class="service-price">${s.price}€</div>
                </div>
              `).join('')}
            </div>
          </div>

          <details class="sales-copy">
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 12px;">💬 Copy de Ventas (Click para copiar)</summary>
            <div onclick="navigator.clipboard.writeText(this.innerText)" style="cursor: pointer;">
${r.salesCopy}
            </div>
          </details>
        </div>
      `;
    }).join('')}
  </div>

  <script>
    function filterResults() {
      const search = document.getElementById('searchBox').value.toLowerCase();
      const category = document.getElementById('categoryFilter').value;
      const country = document.getElementById('countryFilter').value;

      document.querySelectorAll('.business-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        const cardCategory = card.dataset.category;
        const cardCountry = card.dataset.country;

        const matchSearch = !search || text.includes(search);
        const matchCategory = !category || cardCategory === category;
        const matchCountry = !country || cardCountry === country;

        card.style.display = (matchSearch && matchCategory && matchCountry) ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>
  `.trim();

  return html;
}

// Main
const resultsPath = path.join(__dirname, '..', 'audits', 'argus-audit-results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('❌ No results file found. Run scrape-and-audit.js first.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('📊 Generating Excel/CSV...');
const csv = generateExcel(results);
const csvPath = path.join(__dirname, '..', 'audits', 'ARGUS-Audit-200-Negocios.csv');
fs.writeFileSync(csvPath, csv, 'utf8');
console.log(`✅ CSV saved: ${csvPath}`);

console.log('📊 Generating HTML Report...');
const html = generateHTML(results);
const htmlPath = path.join(__dirname, '..', 'audits', 'ARGUS-Audit-200-Negocios.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`✅ HTML saved: ${htmlPath}`);

console.log('\n🎉 Done!');
console.log(`\nOpen in Excel: ${csvPath}`);
console.log(`Open in Browser: ${htmlPath}`);
