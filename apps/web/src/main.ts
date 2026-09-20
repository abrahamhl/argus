import './style.css';
import {
  AUX_SERVICES,
  BASELINE_FINDINGS,
  RETEST_PROOFS,
  EVIDENCE_VAULT,
  METODO_XYZ,
  FindingItem,
  AuxService,
  ProofRecord
} from './simulator-data';

// Simulation State
interface SimulatorState {
  target: string;
  category: string;
  scopeAuthorized: boolean;
  activeStage: number; // 1: Scope, 2: Observe, 3: Prove, 4: Decide, 5: Opportunity, 6: Retest
  simulationStep: 'baseline' | 'remediating' | 'retested';
  findings: FindingItem[];
  proofs: ProofRecord[];
  activeLanguage: 'nl' | 'en' | 'es';
  reportMode: 'client' | 'engineer';
  findingsViewMode: 'client' | 'engineer';
}

const state: SimulatorState = {
  target: 'example-business.nl',
  category: 'Dutch SME / E-Commerce',
  scopeAuthorized: true,
  activeStage: 1,
  simulationStep: 'baseline',
  findings: JSON.parse(JSON.stringify(BASELINE_FINDINGS)),
  proofs: [],
  activeLanguage: 'nl',
  reportMode: 'client',
  findingsViewMode: 'client'
};

const app = document.getElementById('app')!;

function renderApp() {
  app.innerHTML = `
    <!-- Top Terminal Header -->
    <header class="terminal-header">
      <div class="brand-container">
        <div class="brand">
          <span class="pulse-led"></span>
          ARGUS
        </div>
        <div class="motto-tag">OBSERVE → PROVE → DECIDE → FIX → VERIFY</div>
      </div>
      <div class="header-actions">
        <button class="mode-badge investor-nav-badge" id="btn-nav-investor">
          ★ EL MÉTODO XYZ (INVESTOR MVP)
        </button>
        <select id="select-lang" class="select-input" style="width: auto; margin-bottom: 0; padding: 0.35rem 0.6rem; font-size: 0.75rem;">
          <option value="nl" ${state.activeLanguage === 'nl' ? 'selected' : ''}>NL (Nederlands)</option>
          <option value="en" ${state.activeLanguage === 'en' ? 'selected' : ''}>EN (English)</option>
          <option value="es" ${state.activeLanguage === 'es' ? 'selected' : ''}>ES (Español)</option>
        </select>
        <div class="mode-badge">
          OFFLINE FIRST FOR SURE
        </div>
      </div>
    </header>

    <!-- Main Navigation Tabs -->
    <nav class="main-nav">
      <div class="nav-item ${state.activeStage === 0 ? 'active' : ''}" data-screen="investor">
        ⚡ MÉTODO XYZ
      </div>
      <div class="nav-item ${state.activeStage >= 1 && state.activeStage <= 6 ? 'active' : ''}" data-screen="simulator">
        01 SIMULADOR CONTROL PLANE
      </div>
      <div class="nav-item" data-screen="reports">
        02 REPORTES (CLIENT / FORENSIC)
      </div>
      <div class="nav-item" data-screen="casestudy">
        03 CASO DE ESTUDIO ROI
      </div>
      <div class="nav-item" data-screen="aigate">
        04 AI POLICY GATE
      </div>
      <div class="nav-item" data-screen="architecture">
        05 ARQUITECTURA
      </div>
    </nav>

    <!-- Main Content Container -->
    <main class="container">
      <!-- SCREEN: INVESTOR MÉTODO XYZ -->
      <section id="screen-investor" class="screen ${state.activeStage === 0 ? 'active' : ''}">
        ${renderInvestorScreen()}
      </section>

      <!-- SCREEN: SIMULATOR WORKFLOW -->
      <section id="screen-simulator" class="screen ${state.activeStage >= 1 && state.activeStage <= 6 ? 'active' : ''}">
        ${renderSimulatorScreen()}
      </section>

      <!-- SCREEN: REPORTS -->
      <section id="screen-reports" class="screen">
        ${renderReportsScreen()}
      </section>

      <!-- SCREEN: CASE STUDY -->
      <section id="screen-casestudy" class="screen">
        ${renderCaseStudyScreen()}
      </section>

      <!-- SCREEN: AI POLICY GATE -->
      <section id="screen-aigate" class="screen">
        ${renderAiGateScreen()}
      </section>

      <!-- SCREEN: ARCHITECTURE -->
      <section id="screen-architecture" class="screen">
        ${renderArchitectureScreen()}
      </section>
    </main>
  `;

  bindEvents();
}

// ---------------------------------------------------------------------------
// VIEW 00: MÉTODO XYZ FOR INVESTORS
// ---------------------------------------------------------------------------
function renderInvestorScreen(): string {
  const m = METODO_XYZ;
  return `
    <div class="panel panel-investor mb-2">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="status-badge status-warning mb-1">ARGUS MVP THESIS • INVESTOR MEMO</span>
          <h1 style="font-size: 2rem; color: #fff; margin-bottom: 0.5rem;">EL MÉTODO XYZ PARA EL MVP</h1>
          <p class="text-muted" style="max-width: 800px; font-size: 1.05rem;">
            Cómo ARGUS transforma la ciberseguridad para PYMEs: de escaneos que causan parálisis a órdenes de trabajo comerciales y contratos de remediación ejecutables con <strong>AUX Design</strong> (<a href="https://auxdesign.nl" target="_blank" style="color: var(--accent-cyan);">auxdesign.nl</a>).
          </p>
        </div>
        <button class="btn primary" id="btn-start-simulator-from-investor">
          PROBAR SIMULADOR INTERACTIVO →
        </button>
      </div>
    </div>

    <!-- The XYZ Equation Cards -->
    <div class="xyz-hero">
      <div class="xyz-card" style="border-top: 3px solid #f43f5e;">
        <div class="xyz-letter letter-x">X</div>
        <h3 class="mb-1" style="color: #f43f5e;">EL RESULTADO COMERCIAL</h3>
        <p class="font-mono text-muted mb-1" style="font-size: 0.85rem;">[QUÉ LOGRA EL PRODUCTO]</p>
        <p style="font-size: 0.95rem; line-height: 1.6;">
          ${m.formula.X.short}
        </p>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.85rem; color: var(--text-muted);">
          ${m.formula.X.detail}
        </div>
      </div>

      <div class="xyz-card" style="border-top: 3px solid #00e5ff;">
        <div class="xyz-letter letter-y">Y</div>
        <h3 class="mb-1 text-cyan">LA MÉTRICA Y PRUEBA</h3>
        <p class="font-mono text-muted mb-1" style="font-size: 0.85rem;">[CÓMO SE MIDE Y PRUEBA]</p>
        <p style="font-size: 0.95rem; line-height: 1.6;">
          ${m.formula.Y.short}
        </p>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.85rem; color: var(--text-muted);">
          ${m.formula.Y.detail}
        </div>
      </div>

      <div class="xyz-card" style="border-top: 3px solid #10b981;">
        <div class="xyz-letter letter-z">Z</div>
        <h3 class="mb-1 text-emerald">EL CONTROL PLANE PROPIETARIO</h3>
        <p class="font-mono text-muted mb-1" style="font-size: 0.85rem;">[MÉTODO Y EJECUCIÓN ÚNICA]</p>
        <p style="font-size: 0.95rem; line-height: 1.6;">
          ${m.formula.Z.short}
        </p>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.85rem; color: var(--text-muted);">
          ${m.formula.Z.detail}
        </div>
      </div>
    </div>

    <!-- Unit Economics Calculator for Investors -->
    <div class="panel mb-2">
      <h3 class="text-amber mb-1">SIMULADOR DE UNIT ECONOMICS & MODELO DE INGRESOS</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Calcula el potencial de facturación y margen para el mercado de PYMEs holandesas (MKB).
      </p>

      <div class="grid">
        <div>
          <div class="form-group">
            <label>Auditorías Pasivas Mensuales: <strong id="val-audits" class="text-cyan">60</strong></label>
            <input type="range" id="slider-audits" min="10" max="250" step="5" value="60" />
          </div>
          <div class="form-group">
            <label>Tasa de Conversión Comercial (MKB): <strong id="val-conv" class="text-cyan">38%</strong></label>
            <input type="range" id="slider-conv" min="10" max="60" step="1" value="38" />
          </div>
          <div class="form-group">
            <label>Ticket Promedio Inicial de Remediación (€): <strong id="val-ticket" class="text-cyan">€ 695</strong></label>
            <input type="range" id="slider-ticket" min="350" max="1500" step="25" value="695" />
          </div>
          <div class="form-group">
            <label>Retainer Trimestral de Monitoreo (€/trimestre): <strong id="val-retainer" class="text-cyan">€ 295</strong></label>
            <input type="range" id="slider-retainer" min="150" max="600" step="25" value="295" />
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: 6px; border: 1px solid var(--border-dim);">
          <div class="telemetry-row" style="grid-template-columns: 1fr 1fr; margin-bottom: 1rem;">
            <div class="telemetry-card">
              <div class="telemetry-label">Clientes Nuevos / Mes</div>
              <div class="telemetry-val text-amber" id="calc-clients">23</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">Ingresos Iniciales / Mes</div>
              <div class="telemetry-val text-emerald" id="calc-initial-rev">€ 15.985</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">Retainers Trimestrales Activos</div>
              <div class="telemetry-val text-cyan" id="calc-retainers">138</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">ARR Proyectado (Año 1)</div>
              <div class="telemetry-val text-emerald" id="calc-arr">€ 232.540</div>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Margen Bruto Estimado: 78%</strong><br>
            • Costo de infraestructura de nube por escaneo: <strong>€ 0.00</strong> (Offline-First en laptop de analista)<br>
            • Costo de adquisición de cliente (CAC): Mínimo gracias a prospección pasiva no invasiva<br>
            • LTV / CAC Ratio estimado: <strong>4.8x</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- The Anti-Fear Moat Table -->
    <div class="panel mb-2">
      <h3 class="text-cyan mb-1">EL FOSO DEFENSIVO: ANTI-QUALYS / ANTI-FEAR THESIS</h3>
      <p class="text-muted mb-1 font-mono" style="font-size: 0.85rem;">
        Por qué los escáneres tradicionales fallan comercialmente en el mercado de PYMEs y cómo ARGUS gana.
      </p>

      <table class="comp-table">
        <thead>
          <tr>
            <th style="width: 20%;">Eje de Comparación</th>
            <th style="width: 40%; color: var(--danger);">Escáneres Tradicionales (Qualys, Nessus, Pentesting)</th>
            <th style="width: 40%; color: var(--accent-cyan);">ARGUS + AUX Design Control Plane</th>
          </tr>
        </thead>
        <tbody>
          ${m.antiFearMoat.map(row => `
            <tr>
              <td><strong>${row.feature}</strong></td>
              <td style="color: #fda4af;">${row.traditional}</td>
              <td style="color: #a7f3d0; font-weight: 500;">${row.argus}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Regulatory Tailwinds -->
    <div class="panel">
      <h3 class="text-emerald mb-1">VIENTOS DE COLA REGULATORIOS EN LA UNIÓN EUROPEA & HOLANDA</h3>
      <div class="grid mt-1">
        ${m.marketTailwinds.map(t => `
          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
            <h4 class="text-cyan mb-1" style="font-size: 0.95rem;">${t.title}</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${t.impact}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 01: SIMULATOR CONTROL PLANE
// ---------------------------------------------------------------------------
function renderSimulatorScreen(): string {
  const activeFindingCount = state.findings.filter(f => f.status === 'ACTIVE').length;
  const resolvedFindingCount = state.findings.filter(f => f.status === 'RESOLVED').length;

  return `
    <!-- Top Progress HUD -->
    <div class="workflow-hud">
      <div class="hud-step ${state.activeStage === 1 ? 'active' : (state.activeStage > 1 ? 'completed' : '')}" data-step="1">
        <span class="hud-step-num">1</span>
        <span>01 SCOPE GATE</span>
      </div>
      <div class="hud-step ${state.activeStage === 2 ? 'active' : (state.activeStage > 2 ? 'completed' : '')}" data-step="2">
        <span class="hud-step-num">2</span>
        <span>02 OBSERVE</span>
      </div>
      <div class="hud-step ${state.activeStage === 3 ? 'active' : (state.activeStage > 3 ? 'completed' : '')}" data-step="3">
        <span class="hud-step-num">3</span>
        <span>03 PROVE (EVIDENCE)</span>
      </div>
      <div class="hud-step ${state.activeStage === 4 ? 'active' : (state.activeStage > 4 ? 'completed' : '')}" data-step="4">
        <span class="hud-step-num">4</span>
        <span>04 DECIDE (RULES)</span>
      </div>
      <div class="hud-step ${state.activeStage === 5 ? 'active' : (state.activeStage > 5 ? 'completed' : '')}" data-step="5">
        <span class="hud-step-num">5</span>
        <span>05 OPPORTUNITIES</span>
      </div>
      <div class="hud-step ${state.activeStage === 6 ? 'active' : (state.activeStage > 6 ? 'completed' : '')}" data-step="6">
        <span class="hud-step-num">6</span>
        <span>06 RETEST & PROOF</span>
      </div>
    </div>

    <!-- Live Telemetry Status Bar -->
    <div class="telemetry-row">
      <div class="telemetry-card">
        <div class="telemetry-label">Objetivo de Misión</div>
        <div class="telemetry-val text-cyan" style="font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis;">
          ${state.target}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Scope Policy</div>
        <div class="telemetry-val text-emerald" style="font-size: 1.1rem;">
          PUBLIC_PASSIVE (VERIFIED)
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Hallazgos Activos</div>
        <div class="telemetry-val ${activeFindingCount > 0 ? 'text-amber' : 'text-emerald'}">
          ${activeFindingCount}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Pruebas Criptográficas (Proof)</div>
        <div class="telemetry-val text-emerald">
          ${state.proofs.length}
        </div>
      </div>
    </div>

    <!-- Simulation Control Actions Panel -->
    <div class="panel panel-cyber mb-2">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 class="text-cyan mb-1">CONSOLA DE CONTROL DE SIMULACIÓN</h3>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Ejecuta el ciclo de vida completo: Detección basal → Remediación simulada → Retest criptográfico.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn primary" id="btn-run-baseline" ${state.simulationStep !== 'baseline' ? 'disabled' : ''}>
            ▶ 1. EJECUTAR RECOPILACIÓN BASAL
          </button>
          <button class="btn accent-amber" id="btn-apply-fix" ${state.simulationStep !== 'baseline' || activeFindingCount === 0 ? 'disabled' : ''}>
            🔧 2. APLICAR REMEDIACIÓN AUX
          </button>
          <button class="btn accent-emerald" id="btn-run-retest" ${state.simulationStep !== 'remediating' ? 'disabled' : ''}>
            ✓ 3. VERIFICAR RETEST & PROOF
          </button>
          <button class="btn" id="btn-reset-sim">
            ↺ REINICIAR
          </button>
        </div>
      </div>
    </div>

    <!-- STAGE 1: SCOPE GATE -->
    <div class="panel ${state.activeStage === 1 ? '' : 'hide-collapse'}" id="panel-stage-1">
      <h3 class="text-cyan mb-1">ETAPA 1: FAIL-CLOSED SCOPE GATE (AUTORIZACIÓN)</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        ARGUS nunca realiza escaneos activos no autorizados. ScopeGate previene ataques contra infraestructura interna o ajena.
      </p>

      <div class="grid">
        <div>
          <div class="form-group">
            <label>Dominio Objetivo</label>
            <input type="text" id="sim-input-domain" value="${state.target}" />
          </div>
          <div class="form-group">
            <label>Categoría Organizacional</label>
            <select id="sim-input-cat" class="select-input">
              <option value="ecommerce" ${state.category.includes('E-Commerce') ? 'selected' : ''}>Comercio Electrónico / Tienda Online</option>
              <option value="corporate">Empresa B2B / Corporativo</option>
              <option value="saas">SaaS / Proveedor Tecnológico</option>
            </select>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.75rem;">
            <span class="text-muted">RESTRICCIÓN DE POLÍTICA:</span> <strong class="text-emerald">PUBLIC_PASSIVE_ONLY</strong>
          </div>
          <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.7; margin-left: 1.25rem;">
            <li>Sin envío de paquetes intrusivos, inyecciones SQL ni fuzzing.</li>
            <li>Protección automática contra direcciones RFC1918 (10.0.0.0/8, 192.168.0.0/16).</li>
            <li>Invariante de Fallo Cerrado (Fail-Closed): si no está explícitamente en regla, se aborta.</li>
          </ul>
          <div class="mt-1" style="display: flex; gap: 0.5rem;">
            <span class="status-badge status-good">FAIL-CLOSED CHECK: PASS</span>
            <span class="status-badge status-info">SHA-256 SCOPE HASH: VERIFIED</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 2: OBSERVE & COLLECTORS -->
    <div class="panel ${state.activeStage === 2 ? '' : 'hide-collapse'}" id="panel-stage-2">
      <h3 class="text-cyan mb-1">ETAPA 2: COLECTORES Y TELEMETRÍA DE OBSERVACIÓN</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Recopilación acotada y tolerante a fallos. 4 colectores pasivos independientes.
      </p>

      <div class="grid">
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR DNS</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Consulta SOA, MX, TXT (SPF), _dmarc, CAA<br>
            • Enfoque de consulta individual con timeout estricto (3.000ms)<br>
            • Estado: <span class="text-emerald">9 REGISTROS PROCESADOS</span>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR TLS</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Negociación pasiva de protocolo (TLS 1.2 / 1.3)<br>
            • Auditoría de suites de cifrado seguras y vigencia del certificado<br>
            • Estado: <span class="text-emerald">TLS 1.3 ACTIVO / VÁLIDO</span>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR HTTP</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Análisis de cabeceras de seguridad (HSTS, CSP, nosniff, Referrer)<br>
            • Límite estricto de cuerpo (64KB cap) para evitar agotamiento de memoria<br>
            • Estado: <span class="text-amber">CABECERAS CRÍTICAS AUSENTES</span>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR SECURITY.TXT (RFC 9116)</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Inspección de /.well-known/security.txt y /security.txt<br>
            • Verificación de campos obligatorios: Contact, Expires, Canonical<br>
            • Estado: <span class="text-emerald">PRESENTE Y VÁLIDO</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 3: PROVE (EVIDENCE VAULT) -->
    <div class="panel ${state.activeStage === 3 ? '' : 'hide-collapse'}" id="panel-stage-3">
      <h3 class="text-cyan mb-1">ETAPA 3: BÓVEDA DE EVIDENCIAS Y TRAZABILIDAD CRIPTOGRÁFICA</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Invariante de inmutabilidad: Toda evidencia es canonicalizada en JSON, hasheada con SHA-256 y congelada con Object.freeze.
      </p>

      <div>
        ${EVIDENCE_VAULT.map(ev => `
          <div class="evidence-card">
            <div class="evidence-header">
              <div>
                <strong class="text-cyan">${ev.id}</strong>
                <span class="status-badge status-info" style="margin-left: 0.5rem;">${ev.collector}</span>
                <span class="status-badge status-good" style="margin-left: 0.25rem;">IMMUTABLE (FREEZE)</span>
              </div>
              <div class="sha-badge font-mono">SHA-256: ${ev.sha256.substring(0, 16)}...</div>
            </div>
            <pre style="color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 3px; overflow-x: auto; font-size: 0.78rem;">${ev.rawSnippet}</pre>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- STAGE 4: DECIDE (RULES & FINDINGS) -->
    <div class="panel ${state.activeStage === 4 ? '' : 'hide-collapse'}" id="panel-stage-4">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 class="text-cyan">ETAPA 4: MOTOR DETERMINISTA DE REGLAS Y HALLAZGOS</h3>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            11 reglas deterministas sin alucinaciones. Estructura de 4 campos: Observado, Soporte, Relevancia y Limitaciones.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn ${state.findingsViewMode === 'client' ? 'primary' : ''}" id="btn-toggle-client-findings">
            VISTA CLIENTE (COMPRENSIBLE)
          </button>
          <button class="btn ${state.findingsViewMode === 'engineer' ? 'primary' : ''}" id="btn-toggle-engineer-findings">
            VISTA FORENSE (INGENIERO)
          </button>
        </div>
      </div>

      <div>
        ${state.findings.map(f => {
          const lang = state.activeLanguage;
          const copy = f.clientCopy[lang];
          const isResolved = f.status === 'RESOLVED';

          return `
            <div class="finding-card severity-${f.severity.toLowerCase()} ${isResolved ? 'resolved' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span class="status-badge status-${f.severity === 'MEDIUM' ? 'warning' : 'info'}">${f.severity}</span>
                  <span class="status-badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); margin-left: 0.25rem;">${f.category}</span>
                  <strong style="margin-left: 0.5rem; font-size: 1.05rem; color: #fff;">
                    ${state.findingsViewMode === 'client' ? copy.title : f.title}
                  </strong>
                </div>
                <div>
                  ${isResolved 
                    ? `<span class="status-badge status-good">✓ RESUELTO Y VERIFICADO</span>` 
                    : `<span class="status-badge status-warning">ACTIVO EN OBJETIVO</span>`
                  }
                </div>
              </div>

              ${state.findingsViewMode === 'client' ? `
                <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.75rem;">
                  ${copy.explanation}
                </p>
                <div style="font-size: 0.85rem; color: var(--accent-cyan); font-family: var(--font-mono); background: var(--bg-surface); padding: 0.5rem 0.75rem; border-radius: 4px;">
                  💡 <strong>Acción Recomendada:</strong> ${copy.action}
                </div>
              ` : `
                <div style="font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.6; color: var(--text-muted);">
                  <div><strong>Rule ID:</strong> ${f.ruleId}</div>
                  <div><strong>Evidence Reference:</strong> ${f.explanation.supports}</div>
                  <div><strong>Observed:</strong> ${f.explanation.observed}</div>
                  <div><strong>Why It Matters:</strong> ${f.explanation.whyItMatters}</div>
                  <div><strong>Limitations:</strong> ${f.explanation.limitations}</div>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- STAGE 5: COMMERCIAL OPPORTUNITIES (AUX CATALOG) -->
    <div class="panel ${state.activeStage === 5 ? '' : 'hide-collapse'}" id="panel-stage-5">
      <h3 class="text-cyan mb-1">ETAPA 5: CATÁLOGO COMERCIAL AUX DESIGN (CONVERSIÓN A INGRESOS)</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Cada hallazgo se traduce inmediatamente a un servicio de remediación con precio en euros, horas estimadas y entregables claros.
      </p>

      <div class="grid">
        ${AUX_SERVICES.map(srv => {
          const lang = state.activeLanguage;
          const title = srv.title[lang];
          const desc = srv.description[lang];
          const deliverables = srv.deliverables[lang];

          return `
            <div class="aux-opportunity-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <span class="status-badge status-info">${srv.code}</span>
                  <h4 style="color: #fff; margin-top: 0.35rem; font-size: 1rem;">${title}</h4>
                </div>
                <div class="price-tag">
                  € ${srv.indicativePriceEur},-
                  <div style="font-size: 0.7rem; color: var(--text-dim); text-align: right;">${srv.recurring ? 'per kwartaal' : 'vast tarief'}</div>
                </div>
              </div>

              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.5;">
                ${desc}
              </p>

              <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-cyan); margin-bottom: 0.5rem;">
                ⏱ Tiempo estimado: ${srv.estimatedHours}
              </div>

              <div style="border-top: 1px solid var(--border-dim); padding-top: 0.5rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Entregables Clave:</div>
                <ul style="font-size: 0.8rem; color: var(--text-main); margin-left: 1.25rem;">
                  ${deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- STAGE 6: RETEST & CRYPTOGRAPHIC PROOF -->
    <div class="panel ${state.activeStage === 6 ? '' : 'hide-collapse'}" id="panel-stage-6">
      <h3 class="text-emerald mb-1">ETAPA 6: RETEST & CERTIFICADO DE PRUEBA (PROOF OF REMEDIATION)</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Demostración matemática antes y después: vinculación de hashes SHA-256 basales vs. de retest con estado RESOLVED.
      </p>

      ${state.proofs.length === 0 ? `
        <div style="text-align: center; padding: 2rem; background: var(--bg-surface); border-radius: 4px; border: 1px dashed var(--border-dim);">
          <div class="text-amber mb-1" style="font-size: 1.25rem; font-weight: 700;">AÚN NO SE HA EJECUTADO LA REMEDIACIÓN</div>
          <p class="text-muted font-mono" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            Presiona el botón "2. APLICAR REMEDIACIÓN AUX" y luego "3. VERIFICAR RETEST & PROOF" arriba para simular la intervención y generar los certificados de prueba.
          </p>
        </div>
      ` : `
        <div class="mb-2">
          <div class="telemetry-card mb-2" style="background: rgba(16, 185, 129, 0.1); border-color: var(--accent-emerald);">
            <div class="telemetry-label">ESTADO GENERAL DE VERIFICACIÓN</div>
            <div class="telemetry-val text-emerald" style="font-size: 1.35rem;">
              7 / 7 HALLAZGOS RESUELTOS MATEMÁTICAMENTE (100% PROVEN)
            </div>
          </div>

          ${state.proofs.map(p => `
            <div class="proof-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <div>
                  <span class="status-badge status-good">PROOF ID: ${p.id}</span>
                  <strong style="margin-left: 0.5rem; color: #fff;">${p.ruleId}</strong>
                </div>
                <span class="status-badge status-good">STATUS: ${p.status}</span>
              </div>
              <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.75rem;">
                ${p.rationale}
              </p>
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 3px;">
                <div><strong>Hash Evidencia Basal:</strong> ${p.baselineEvidenceSha}</div>
                <div><strong>Hash Evidencia Retest:</strong> ${p.retestEvidenceSha}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 02: REPORTS (DUTCH CLIENT & FORENSIC ENGINEER)
// ---------------------------------------------------------------------------
function renderReportsScreen(): string {
  return `
    <div class="panel mb-2">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 class="text-cyan mb-1">GENERADOR DE REPORTES OFICIALES</h2>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Documentos listos para entrega comercial al cliente (en holandés amigable) o auditoría forense interna.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn ${state.reportMode === 'client' ? 'primary' : ''}" id="btn-view-client-report">
            REPORTE CLIENTE (DUTCH-FIRST)
          </button>
          <button class="btn ${state.reportMode === 'engineer' ? 'primary' : ''}" id="btn-view-engineer-report">
            REPORTE TÉCNICO FORENSE
          </button>
          <button class="btn accent-amber" onclick="window.print()">
            🖨 IMPRIMIR / PDF
          </button>
        </div>
      </div>
    </div>

    ${state.reportMode === 'client' ? renderClientReportHtml() : renderEngineerReportHtml()}
  `;
}

function renderClientReportHtml(): string {
  return `
    <div class="panel" style="background: #0b1222; border: 1px solid rgba(0, 229, 255, 0.2);">
      <div style="border-bottom: 2px solid var(--accent-cyan); padding-bottom: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">AUX DESIGN • BEVEILIGINGS- & HYGIËNE OVERZICHT</div>
          <h1 style="font-size: 1.75rem; color: #fff; margin-top: 0.25rem;">Beveiligingsrapport: ${state.target}</h1>
          <div class="text-muted" style="font-size: 0.85rem;">Gegenereerd door ARGUS Control Plane op ${new Date().toLocaleDateString('nl-NL')}</div>
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-good" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
            PASSIVE ASSESSMENT (AVG CONFORM)
          </span>
        </div>
      </div>

      <!-- Positive Checks Box -->
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent-emerald); border-radius: 6px; padding: 1.25rem; margin-bottom: 1.5rem;">
        <h3 class="text-emerald mb-1">Wat er al goed is ingericht</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.5rem;">
          Uw organisatie heeft al een aantal belangrijke basismaatregelen getroffen:
        </p>
        <ul style="font-size: 0.88rem; color: #a7f3d0; margin-left: 1.5rem; line-height: 1.7;">
          <li><strong>Moderne transportbeveiliging:</strong> Uw website maakt gebruik van TLS 1.3 met een geldig SSL-certificaat.</li>
          <li><strong>Verantwoorde melding:</strong> Er is een RFC 9116 beveiligingsbestand (security.txt) aanwezig voor ethische hackers.</li>
          <li><strong>DNS infrastructuur:</strong> Betrouwbare domeinnaamservers zonder openbare zonevervuiling.</li>
        </ul>
      </div>

      <!-- Improvement Opportunities -->
      <div class="mb-2">
        <h3 class="text-cyan mb-1">Aanbevolen Verbeteringen voor Optimale Bescherming</h3>
        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 1rem;">
          De volgende acties versterken uw domein tegen e-mailspoofing, data-onderschepping en browseraanvallen:
        </p>

        <table class="comp-table">
          <thead>
            <tr>
              <th>Onderwerp</th>
              <th>Huidige Situatie</th>
              <th>Geadviseerde Oplossing (AUX Design)</th>
              <th>Vaste Prijs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>E-mailbeveiliging (DMARC / SPF)</strong></td>
              <td>DMARC staat op monitoren (p=none) en SPF op SoftFail</td>
              <td>Inrichten van DMARC handhaving (p=reject) en strikte SPF (-all)</td>
              <td class="text-emerald" style="font-weight: 700;">€ 495,-</td>
            </tr>
            <tr>
              <td><strong>Webbrowser Verharding (HSTS / CSP)</strong></td>
              <td>HSTS en Content Security Policy ontbreken nog</td>
              <td>Configuratie van HSTS (max-age=1 jaar) en modulaire CSP-regels</td>
              <td class="text-emerald" style="font-weight: 700;">€ 495,-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid var(--border-dim); padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Vragen of direct inplannen? Neem contact op via <strong>contact@auxdesign.nl</strong>
        </div>
        <div class="text-cyan font-mono" style="font-size: 0.85rem;">
          auxdesign.nl • Amsterdam
        </div>
      </div>
    </div>
  `;
}

function renderEngineerReportHtml(): string {
  return `
    <div class="panel" style="background: #050811; border: 1px solid var(--border-dim);">
      <div style="border-bottom: 1px solid var(--border-dim); padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <div class="font-mono text-cyan" style="font-size: 0.8rem;">ARGUS FORENSIC AUDIT TRAIL • ENGINEERING RUN DOSSIER</div>
        <h2 style="color: #fff; margin-top: 0.25rem;">Cryptographic Provenance for ${state.target}</h2>
        <div class="font-mono text-muted" style="font-size: 0.8rem;">Run ID: run_${Date.now().toString(36)} | Offline Deterministic Mode</div>
      </div>

      <h4 class="text-cyan mb-1">Evidence Records & SHA-256 Signatures</h4>
      <table class="comp-table mb-2">
        <thead>
          <tr>
            <th>Evidence ID</th>
            <th>Collector</th>
            <th>Type</th>
            <th>SHA-256 Digest</th>
            <th>Frozen</th>
          </tr>
        </thead>
        <tbody>
          ${EVIDENCE_VAULT.map(ev => `
            <tr>
              <td class="font-mono text-cyan">${ev.id}</td>
              <td class="font-mono">${ev.collector}</td>
              <td class="font-mono">${ev.type}</td>
              <td class="font-mono" style="font-size: 0.75rem;">${ev.sha256}</td>
              <td><span class="status-badge status-good">TRUE</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4 class="text-cyan mb-1">CLI Reproduction Commands</h4>
      <pre style="background: #020408; padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim); color: #a5b4fc; font-family: var(--font-mono); font-size: 0.85rem; overflow-x: auto;">
# Reproduce deterministic inspection offline
pnpm demo

# Inspect target provenance
argus inspect --target ${state.target} --offline

# Verify cryptographic proofs
argus verify --run run_latest
      </pre>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 03: COMMERCIAL CASE STUDY
// ---------------------------------------------------------------------------
function renderCaseStudyScreen(): string {
  return `
    <div class="panel mb-2">
      <span class="status-badge status-info mb-1">CASE STUDY • AUX DESIGN COMMERCIAL EXECUTION</span>
      <h2 class="text-cyan mb-1">CASO DE ÉXITO MKB: EXAMPLE-BUSINESS.NL</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Cómo una empresa de comercio electrónico en Países Bajos blindó su reputación y cumplió con la cadena de suministro NIS2 en 48 horas.
      </p>
    </div>

    <div class="grid mb-2">
      <div class="panel">
        <h3 class="text-amber mb-1">EL DESAFÍO INICIAL (BASELINE)</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
          Example Business B.V. operaba una tienda online con €2.4M de facturación anual. Aunque contaban con un certificado SSL válido, su postura pública presentaba dos riesgos críticos:
        </p>
        <ul style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; margin-left: 1.25rem;">
          <li><strong>Vulnerabilidad de Facturación:</strong> DMARC configurado en <code>p=none</code> y SPF con <code>~all</code> permitían a atacantes emitir facturas falsas suplantando el dominio oficial.</li>
          <li><strong>Exposición Web:</strong> Falta de HSTS y CSP exponía las sesiones de los clientes a intercepción en redes Wi-Fi abiertas.</li>
          <li><strong>Bloqueo Comercial:</strong> Un cliente corporativo exigió cumplimiento estricto con la directiva NIS2 para renovar un contrato de suministro.</li>
        </ul>
      </div>

      <div class="panel panel-success">
        <h3 class="text-emerald mb-1">LA INTERVENCIÓN DE AUX DESIGN</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
          A través del catálogo cerrado de ARGUS, AUX Design ejecutó la remediación sin interrumpir la operación:
        </p>
        <ul style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; margin-left: 1.25rem;">
          <li><strong>AUX-DNS-01 (€ 495,-):</strong> Migración a SPF <code>-all</code> y DMARC <code>p=reject</code> con enrutamiento de reportes agregados.</li>
          <li><strong>AUX-TLS-01 (€ 395,-):</strong> Despliegue de cabeceras HSTS con <code>includeSubDomains</code> y pre-carga.</li>
          <li><strong>AUX-RET-01 (€ 295,-):</strong> Certificado de prueba criptográfico con trazabilidad SHA-256 entregado a la junta directiva.</li>
        </ul>
      </div>
    </div>

    <div class="panel">
      <h3 class="text-cyan mb-1">EL RESULTADO VERIFICADO (PROOF OF VALUE)</h3>
      <div class="telemetry-row">
        <div class="telemetry-card">
          <div class="telemetry-label">Tiempo Total de Intervención</div>
          <div class="telemetry-val text-cyan">7 Horas</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Costo Total de Remediación</div>
          <div class="telemetry-val text-amber">€ 1.185,-</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Hallazgos Resueltos</div>
          <div class="telemetry-val text-emerald">100%</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Contrato B2B Asegurado</div>
          <div class="telemetry-val text-emerald">€ 180.000 / año</div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 04: AI POLICY GATE SIMULATOR
// ---------------------------------------------------------------------------
function renderAiGateScreen(): string {
  return `
    <div class="panel mb-2">
      <span class="status-badge status-warning mb-1">AI SAFETY BOUNDARY • INVARIANT ENFORCEMENT</span>
      <h2 class="text-cyan mb-1">SIMULADOR DE AI POLICY GATE & GROUNDING</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Prueba cómo ARGUS neutraliza las alucinaciones de modelos de lenguaje: cualquier afirmación sin referencia estricta a un ID de evidencia es rechazada y descartada.
      </p>
    </div>

    <div class="grid">
      <div class="panel">
        <h4 class="text-cyan mb-1">PROBAR AFIRMACIÓN DE IA</h4>
        <div class="form-group">
          <label>Seleccionar Escenario de IA:</label>
          <select id="select-ai-scenario" class="select-input">
            <option value="grounded">1. Afirmación con Respaldo de Evidencia (Grounded Claim)</option>
            <option value="hallucination">2. Alucinación de IA sin Evidencia (Ungrounded Claim)</option>
            <option value="elevation">3. Intento de elevar confianza a 'VERIFIED'</option>
            <option value="disallowed_tool">4. Intento de ejecutar herramienta prohibida</option>
          </select>
        </div>
        <button class="btn primary" id="btn-eval-ai-gate">
          EVALUAR ANTE POLICY GATE →
        </button>
      </div>

      <div class="panel" style="background: var(--bg-surface);">
        <h4 class="text-cyan mb-1">RESULTADO DE LA POLÍTICA</h4>
        <div id="ai-gate-result" style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.7; color: var(--text-muted);">
          Selecciona un escenario y presiona "EVALUAR ANTE POLICY GATE" para observar el comportamiento en tiempo real.
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 05: ARCHITECTURE & INVARIANTS
// ---------------------------------------------------------------------------
function renderArchitectureScreen(): string {
  return `
    <div class="panel mb-2">
      <span class="status-badge status-good mb-1">ARCHITECTURE & GOVERNANCE</span>
      <h2 class="text-cyan mb-1">LOS 8 INVARIANTES SAGRADOS DE ARGUS</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Garantías del sistema verificadas por la suite de 178 tests automatizados.
      </p>
    </div>

    <div class="grid">
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">1. OFFLINE FIRST FOR SURE</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Con <code>ARGUS_OFFLINE_MODE=true</code> no se abre ningún socket de red. Todas las operaciones se ejecutan con fixtures locales deterministas.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">2. INMUTABILIDAD DE EVIDENCIA</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Cada objeto de evidencia se congela con <code>Object.freeze</code> y se sella con un hash SHA-256 canonicalizado.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">3. REGLAS DETERMINISTAS</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Entradas idénticas generan hallazgos con IDs estables e idénticos, sin depender de temperatura ni aleatoriedad.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">4. LÍMITE DE CONFIANZA DE IA</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          La IA está acotada a <code>INFERRED</code> y jamás puede emitir o elevar una evidencia al nivel <code>VERIFIED</code>.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">5. CERO MIEDO / ZERO-FEAR POLICY</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Prohibido vender seguridad con amenazas de multas de AVG/GDPR inventadas o puntuaciones de CVSS infladas.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">6. RETEST CON CRIPTOGRAFÍA</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          La remediación solo se marca <code>RESOLVED</code> si existe una evidencia de retest válida con hash verificable.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">7. REDACCIÓN PROFUNDA DE SECRETOS</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Encabezados y tokens (cookies, authorization, api-keys) se sanitizan recursivamente a cualquier nivel de anidamiento.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">8. INMUNIDAD XSS</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Todos los reportes HTML escapan completamente entradas externas para prevenir inyecciones de código.
        </p>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// EVENT BINDINGS & INTERACTIONS
// ---------------------------------------------------------------------------
function bindEvents() {
  // Navigation Tabs
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      const screen = (e.currentTarget as HTMLElement).dataset.screen;
      if (screen) switchScreen(screen);
    });
  });

  // Investor badge in top header
  document.getElementById('btn-nav-investor')?.addEventListener('click', () => {
    switchScreen('investor');
  });

  // Investor button to launch simulator
  document.getElementById('btn-start-simulator-from-investor')?.addEventListener('click', () => {
    switchScreen('simulator');
  });

  // Language selector
  document.getElementById('select-lang')?.addEventListener('change', (e) => {
    state.activeLanguage = (e.target as HTMLSelectElement).value as any;
    renderApp();
  });

  // Simulator HUD Step clicks
  document.querySelectorAll('.hud-step').forEach(el => {
    el.addEventListener('click', (e) => {
      const step = parseInt((e.currentTarget as HTMLElement).dataset.step || '1', 10);
      state.activeStage = step;
      renderApp();
    });
  });

  // Simulator Controls
  document.getElementById('btn-run-baseline')?.addEventListener('click', () => {
    state.activeStage = 4;
    renderApp();
  });

  document.getElementById('btn-apply-fix')?.addEventListener('click', () => {
    state.simulationStep = 'remediating';
    // Simulate AUX applying remedies
    state.findings.forEach(f => {
      f.status = 'RESOLVED';
    });
    state.activeStage = 5;
    renderApp();
  });

  document.getElementById('btn-run-retest')?.addEventListener('click', () => {
    state.simulationStep = 'retested';
    state.proofs = RETEST_PROOFS;
    state.activeStage = 6;
    renderApp();
  });

  document.getElementById('btn-reset-sim')?.addEventListener('click', () => {
    state.simulationStep = 'baseline';
    state.activeStage = 1;
    state.findings = JSON.parse(JSON.stringify(BASELINE_FINDINGS));
    state.proofs = [];
    renderApp();
  });

  // Toggle findings view mode (client vs engineer)
  document.getElementById('btn-toggle-client-findings')?.addEventListener('click', () => {
    state.findingsViewMode = 'client';
    renderApp();
  });

  document.getElementById('btn-toggle-engineer-findings')?.addEventListener('click', () => {
    state.findingsViewMode = 'engineer';
    renderApp();
  });

  // Report view modes
  document.getElementById('btn-view-client-report')?.addEventListener('click', () => {
    state.reportMode = 'client';
    renderApp();
  });

  document.getElementById('btn-view-engineer-report')?.addEventListener('click', () => {
    state.reportMode = 'engineer';
    renderApp();
  });

  // Unit Economics Sliders
  setupUnitEconomicsCalculator();

  // AI Policy Gate Demo
  setupAiGateDemo();
}

function switchScreen(screenId: string) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) targetScreen.classList.add('active');

  const activeNav = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
  if (activeNav) activeNav.classList.add('active');

  if (screenId === 'investor') {
    state.activeStage = 0;
  } else if (screenId === 'simulator' && state.activeStage === 0) {
    state.activeStage = 1;
  }
}

function setupUnitEconomicsCalculator() {
  const sliderAudits = document.getElementById('slider-audits') as HTMLInputElement | null;
  const sliderConv = document.getElementById('slider-conv') as HTMLInputElement | null;
  const sliderTicket = document.getElementById('slider-ticket') as HTMLInputElement | null;
  const sliderRetainer = document.getElementById('slider-retainer') as HTMLInputElement | null;

  if (!sliderAudits || !sliderConv || !sliderTicket || !sliderRetainer) return;

  const updateCalculations = () => {
    const audits = parseInt(sliderAudits.value, 10);
    const conv = parseInt(sliderConv.value, 10);
    const ticket = parseInt(sliderTicket.value, 10);
    const retainer = parseInt(sliderRetainer.value, 10);

    document.getElementById('val-audits')!.textContent = audits.toString();
    document.getElementById('val-conv')!.textContent = `${conv}%`;
    document.getElementById('val-ticket')!.textContent = `€ ${ticket}`;
    document.getElementById('val-retainer')!.textContent = `€ ${retainer}`;

    const newClients = Math.round(audits * (conv / 100));
    const initialRev = newClients * ticket;
    // Cumulative active retainers over a year (assuming 6 quarters retention)
    const activeRetainers = Math.round(newClients * 6);
    const annualArr = (initialRev * 12) + (activeRetainers * retainer * 4 * 0.25);

    document.getElementById('calc-clients')!.textContent = newClients.toString();
    document.getElementById('calc-initial-rev')!.textContent = `€ ${initialRev.toLocaleString('nl-NL')}`;
    document.getElementById('calc-retainers')!.textContent = activeRetainers.toString();
    document.getElementById('calc-arr')!.textContent = `€ ${annualArr.toLocaleString('nl-NL')}`;
  };

  sliderAudits.addEventListener('input', updateCalculations);
  sliderConv.addEventListener('input', updateCalculations);
  sliderTicket.addEventListener('input', updateCalculations);
  sliderRetainer.addEventListener('input', updateCalculations);
}

function setupAiGateDemo() {
  const btnEval = document.getElementById('btn-eval-ai-gate');
  const select = document.getElementById('select-ai-scenario') as HTMLSelectElement | null;
  const resultDiv = document.getElementById('ai-gate-result');

  btnEval?.addEventListener('click', () => {
    if (!select || !resultDiv) return;

    const val = select.value;
    if (val === 'grounded') {
      resultDiv.innerHTML = `
        <div class="status-badge status-good mb-1">POLICY GATE: PASS (GROUNDED)</div>
        <div style="color: #a7f3d0; margin-bottom: 0.5rem;">
          ✓ Afirmación: "HSTS header is absent in HTTP response"
        </div>
        <div>
          • Referencia a evidencia válida: <code>ev_http_get_slash</code> (PRESENTE)<br>
          • Nivel de confianza asignado: <strong class="text-cyan">INFERRED</strong> (AI Clamped)<br>
          • Resultado: <strong>Afirmación preservada en el informe de análisis.</strong>
        </div>
      `;
    } else if (val === 'hallucination') {
      resultDiv.innerHTML = `
        <div class="status-badge status-critical mb-1">POLICY GATE: BLOCKED (HALLUCINATION DROPPED)</div>
        <div style="color: #fda4af; margin-bottom: 0.5rem;">
          ✗ Afirmación alucinada: "El servidor tiene una vulnerabilidad crítica Log4j en el puerto 8080"
        </div>
        <div>
          • Referencia a evidencia: <code>null</code> (Sin registro en la bóveda)<br>
          • Acción de seguridad: <strong class="text-rose">DROPPED_BY_POLICY_GATE</strong><br>
          • Resultado: <strong>Afirmación descartada automáticamente antes de llegar al reporte.</strong>
        </div>
      `;
    } else if (val === 'elevation') {
      resultDiv.innerHTML = `
        <div class="status-badge status-warning mb-1">POLICY GATE: CLAMPED (PRIVILEGE DEFENSE)</div>
        <div style="color: #fef08a; margin-bottom: 0.5rem;">
          ! Intento de la IA: Asignar confianza 'VERIFIED' a deducción de software
        </div>
        <div>
          • Regla de Invariante: <em>"AI cannot elevate findings to VERIFIED"</em><br>
          • Acción de seguridad: <strong>Re-etiquetado forzado a INFERRED</strong><br>
          • Solo los colectores criptográficos deterministas pueden emitir estado VERIFIED.
        </div>
      `;
    } else if (val === 'disallowed_tool') {
      resultDiv.innerHTML = `
        <div class="status-badge status-critical mb-1">POLICY GATE: REJECTED (TOOL CALL BLOCKED)</div>
        <div style="color: #fda4af; margin-bottom: 0.5rem;">
          ✗ Intento de llamada a herramienta: <code>nmap_port_scan()</code>
        </div>
        <div>
          • Lista blanca autorizada: <code>[inspect_evidence, query_rule_catalog]</code><br>
          • Violación de ScopeGate: <strong>Llamada a herramienta activa no autorizada</strong><br>
          • Acción de seguridad: <strong>Ejecución abortada inmediatamente con código de error.</strong>
        </div>
      `;
    }
  });
}

// Initial Render
renderApp();
