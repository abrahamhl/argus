import './style.css';
import {
  AUX_SERVICES,
  BASELINE_FINDINGS,
  RETEST_PROOFS,
  EVIDENCE_VAULT,
  METODO_XYZ,
  FindingItem,
  AuxService,
  ProofRecord,
  EvidenceRecord
} from './simulator-data';
import { ARNHEM_LEADS, ScannedLead, ScannedFinding } from './arnhem-leads-data';
import {
  CONSTELLATION_NODES,
  CONSTELLATION_EDGES,
  INSTITUTIONAL_PROFILES,
  SAMPLE_STIX_BUNDLE,
  ConstellationNode
} from './constellation-data';
import {
  generateBrowserTyposquats,
  buildVisualMerkleTree,
  generateDynamicStixBundle,
  generateDynamicMispEvent,
  BrowserTyposquatItem
} from './deep-intel-data';

// Simulation State Interface
interface SimulatorState {
  target: string;
  category: string;
  address: string;
  phone: string;
  tier: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'GRAY';
  colorEmoji: string;
  score: number;
  scopeAuthorized: boolean;
  activeStage: number; // 1: Scope, 2: Observe, 3: Prove, 4: Decide, 5: Opportunity, 6: Retest
  simulationStep: 'baseline' | 'remediating' | 'retested';
  findings: FindingItem[];
  proofs: ProofRecord[];
  evidence: EvidenceRecord[];
  activeLanguage: 'nl' | 'en' | 'es';
  reportMode: 'client' | 'engineer';
  findingsViewMode: 'client' | 'engineer';
  selectedLeadId: string;
  tierFilter: 'ALL' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'GRAY';
  searchQuery: string;
  selectedAgencyId: string;
  institutionalTab: 'stix' | 'misp';
  typosquats: BrowserTyposquatItem[];
  merkleRoot: string;
  debbiePitch: {
    oneLinerNL: string;
    whyCareNL: string;
    whatWeOfferNL: string;
    estimatedService: string;
    indicativePriceEur: number;
    nextAction: string;
  };
}

// Default initial lead: first urgent (red) lead e.g. Bakkerij Koenen or The Fade Studio
const defaultLead = ARNHEM_LEADS.find(l => l.tier === 'RED') || ARNHEM_LEADS[0];

function convertScannedFindingToItem(sf: ScannedFinding, domain: string): FindingItem {
  const cat = sf.category.includes('EMAIL') ? 'EMAIL' 
            : sf.category.includes('WEB') ? 'HTTP' 
            : sf.category.includes('PRIVACY') ? 'DISCLOSURE' : 'DNS';
  const sev = (sf.severity === 'CRITICAL' || sf.severity === 'HIGH' || sf.severity === 'MEDIUM') ? sf.severity : 'LOW';

  return {
    id: sf.id,
    ruleId: 'rule-' + sf.category.toLowerCase().replace(/_/g, '-'),
    title: sf.title,
    severity: sev as any,
    category: cat as any,
    evidenceIds: ['ev_' + sf.id],
    explanation: {
      observed: sf.technical,
      supports: sf.evidenceLocation || sf.evidenceType,
      whyItMatters: sf.impact,
      limitations: 'Passieve observatie via publieke bronnen. Potentiële compliance-afwijking - vereist menselijke/juridische verificatie.'
    },
    clientCopy: {
      nl: {
        title: sf.title,
        explanation: sf.plainNL,
        action: sf.remediation
      },
      en: {
        title: sf.title,
        explanation: sf.technical,
        action: sf.remediation
      },
      es: {
        title: sf.title,
        explanation: sf.plainNL,
        action: sf.remediation
      }
    },
    auxServiceId: sf.service.includes('E-mail') ? 'aux-dns-01' 
                : sf.service.includes('Privacy') ? 'aux-sec-01' 
                : sf.service.includes('Headers') ? 'aux-tls-01' : 'aux-aud-01',
    status: 'ACTIVE'
  };
}

function generateDynamicEvidence(lead: ScannedLead): EvidenceRecord[] {
  const domain = lead.domain;
  const ts = new Date().toISOString();
  return [
    {
      id: 'ev_dns_soa',
      collector: 'collector-dns',
      type: 'dns_records',
      target: domain,
      sha256: '928e4693bf7c7a2bb34460f1ad9226cbcf74c8646b997e068e5ff41b44b92b67',
      timestamp: ts,
      immutable: true,
      rawSnippet: `SOA ns1.transip.nl hostmaster.${domain} (2026092601 86400 7200 2419200 300)`
    },
    {
      id: 'ev_dns_spf',
      collector: 'collector-dns',
      type: 'dns_records',
      target: domain,
      sha256: 'f3911b306b998a4d4681643cb462ba94a5002a4bf7eeef043bbad6dc34a9b5f4',
      timestamp: ts,
      immutable: true,
      rawSnippet: `TXT "v=spf1 include:_spf.google.com ~all"`
    },
    {
      id: 'ev_dns_dmarc',
      collector: 'collector-dns',
      type: 'dns_records',
      target: `_dmarc.${domain}`,
      sha256: 'c8077c570b74100b12bc1a80ad22be881b29a008c23fbf7e8ebaa22227d85348',
      timestamp: ts,
      immutable: true,
      rawSnippet: `TXT "v=DMARC1; p=none; sp=none;"`
    },
    {
      id: 'ev_tls_cert',
      collector: 'collector-tls',
      type: 'tls_handshake',
      target: `${domain}:443`,
      sha256: '725ba94e75d4a96b30f80a424268e27c1a84f5533118cf23ad1ba75f7956a814',
      timestamp: ts,
      immutable: true,
      rawSnippet: `TLSv1.3 | TLS_AES_256_GCM_SHA384 | Cert Valid | Let's Encrypt / Sectigo`
    },
    {
      id: 'ev_http_headers',
      collector: 'collector-http',
      type: 'http_response',
      target: `https://${domain}/`,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      timestamp: ts,
      immutable: true,
      rawSnippet: `HTTP/2 200 OK\nServer: nginx\nStrict-Transport-Security: ABSENT\nContent-Security-Policy: ABSENT\nX-Frame-Options: ABSENT`
    }
  ];
}

const initialEvidence = generateDynamicEvidence(defaultLead);
const initialMerkle = buildVisualMerkleTree(initialEvidence.map(e => ({ id: e.id, rawSnippet: e.rawSnippet })));

const state: SimulatorState = {
  target: defaultLead.domain,
  category: defaultLead.category,
  address: defaultLead.address,
  phone: defaultLead.phone,
  tier: defaultLead.tier,
  colorEmoji: defaultLead.colorEmoji,
  score: defaultLead.score,
  scopeAuthorized: true,
  activeStage: 1,
  simulationStep: 'baseline',
  findings: defaultLead.findings.map(f => convertScannedFindingToItem(f, defaultLead.domain)),
  proofs: [],
  evidence: initialEvidence,
  activeLanguage: 'nl',
  reportMode: 'client',
  findingsViewMode: 'client',
  selectedLeadId: defaultLead.id,
  tierFilter: 'ALL',
  searchQuery: '',
  selectedAgencyId: 'europol-ec3',
  institutionalTab: 'stix',
  typosquats: generateBrowserTyposquats(defaultLead.domain),
  merkleRoot: initialMerkle.rootHash,
  debbiePitch: defaultLead.pitch
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
        01 SIMULADOR CONTROL PLANE (${ARNHEM_LEADS.length} LEADS)
      </div>
      <div class="nav-item" data-screen="reports">
        02 REPORTES (CLIENT / FORENSIC)
      </div>
      <div class="nav-item" data-screen="constellation">
        03 CONSTELLATION MESH (8 REPOS)
      </div>
      <div class="nav-item" data-screen="calmap">
        04 CALMAP GEOSPATIAL
      </div>
      <div class="nav-item" data-screen="institutional">
        05 INSTITUTIONAL (EUROPOL / DORA)
      </div>
      <div class="nav-item" data-screen="casestudy">
        06 CASO DE ESTUDIO ROI
      </div>
      <div class="nav-item" data-screen="aigate">
        07 AI POLICY GATE
      </div>
      <div class="nav-item" data-screen="architecture">
        08 ARQUITECTURA
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

      <!-- SCREEN: CONSTELLATION MESH -->
      <section id="screen-constellation" class="screen">
        ${renderConstellationScreen()}
      </section>

      <!-- SCREEN: CALMAP GEOSPATIAL -->
      <section id="screen-calmap" class="screen">
        ${renderCalMapScreen()}
      </section>

      <!-- SCREEN: INSTITUTIONAL / EUROPOL -->
      <section id="screen-institutional" class="screen">
        ${renderInstitutionalScreen()}
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
// VIEW 01: SIMULATOR CONTROL PLANE (WITH 171 ARNHEM LEADS)
// ---------------------------------------------------------------------------
function renderSimulatorScreen(): string {
  const activeFindingCount = state.findings.filter(f => f.status === 'ACTIVE').length;
  const filteredLeads = ARNHEM_LEADS.filter(l => {
    const matchesTier = state.tierFilter === 'ALL' || l.tier === state.tierFilter;
    const matchesSearch = !state.searchQuery || 
      l.name.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
      l.domain.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return `
    <!-- Top Progress HUD -->
    <div class="workflow-hud">
      <div class="hud-step ${state.activeStage === 1 ? 'active' : (state.activeStage > 1 ? 'completed' : '')}" data-step="1">
        <span class="hud-step-num">1</span>
        <span>01 SCOPE GATE</span>
      </div>
      <div class="hud-step ${state.activeStage === 2 ? 'active' : (state.activeStage > 2 ? 'completed' : '')}" data-step="2">
        <span class="hud-step-num">2</span>
        <span>02 OBSERVE & SENSING</span>
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
        <span>06 RETEST & PROOF PACK</span>
      </div>
    </div>

    <!-- Live Telemetry Status Bar -->
    <div class="telemetry-row">
      <div class="telemetry-card">
        <div class="telemetry-label">Objetivo de Misión</div>
        <div class="telemetry-val text-cyan" style="font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis;">
          ${state.colorEmoji} ${state.target}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Prioridad Comercial</div>
        <div class="telemetry-val ${state.tier === 'RED' ? 'text-rose' : state.tier === 'ORANGE' ? 'text-amber' : 'text-emerald'}" style="font-size: 1.1rem;">
          ${state.tier} (${state.score}/100)
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Hallazgos Activos</div>
        <div class="telemetry-val ${activeFindingCount > 0 ? 'text-amber' : 'text-emerald'}">
          ${activeFindingCount}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Merkle Root Hash</div>
        <div class="telemetry-val text-emerald" style="font-size: 0.95rem; font-family: var(--font-mono); text-overflow: ellipsis; overflow: hidden;">
          ${state.merkleRoot.substring(0, 12)}...
        </div>
      </div>
    </div>

    <!-- Lead Selector Bar (All 171 Arnhem Businesses) -->
    <div class="lead-selector-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <span class="status-badge status-info">CANONICAL PROSPECTION DATASET</span>
          <strong style="color: #fff; margin-left: 0.5rem; font-size: 0.95rem;">SELECCIONAR OBJETIVO DE ARNHEM (${filteredLeads.length} disponibles)</strong>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
          <span>40 🟥 Urgente</span> • <span>47 🟧 Substancial</span> • <span>38 🟨 Moderado</span> • <span>12 🟩 Óptimo</span>
        </div>
      </div>

      <!-- Quick Tier Filter Buttons -->
      <div class="tier-filters">
        <button class="tier-filter-btn ${state.tierFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">Todos (171)</button>
        <button class="tier-filter-btn tier-red ${state.tierFilter === 'RED' ? 'active' : ''}" data-filter="RED">🟥 Urgente (40)</button>
        <button class="tier-filter-btn tier-orange ${state.tierFilter === 'ORANGE' ? 'active' : ''}" data-filter="ORANGE">🟧 Substancial (47)</button>
        <button class="tier-filter-btn ${state.tierFilter === 'YELLOW' ? 'active' : ''}" data-filter="YELLOW">🟨 Moderado (38)</button>
        <button class="tier-filter-btn tier-green ${state.tierFilter === 'GREEN' ? 'active' : ''}" data-filter="GREEN">🟩 Óptimo (12)</button>
        <button class="tier-filter-btn ${state.tierFilter === 'GRAY' ? 'active' : ''}" data-filter="GRAY">⬜ Inactivo (34)</button>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem;">
        <select id="select-arnhem-lead" class="select-input" style="margin-bottom: 0;">
          ${filteredLeads.map(l => `
            <option value="${l.id}" ${l.id === state.selectedLeadId ? 'selected' : ''}>
              ${l.colorEmoji} ${l.name} — ${l.domain} (${l.category}) [${l.findings.length} hallazgos]
            </option>
          `).join('')}
        </select>
        <input type="text" id="input-lead-search" placeholder="Buscar por nombre o sector..." value="${state.searchQuery}" style="margin-bottom: 0;" />
      </div>

      <!-- Debbie Pitch Card for Selected Lead -->
      <div class="pitch-box-cyber">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; flex-wrap: wrap;">
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700;">
            🎯 PITCH DEBBIE (NEDERLANDS): ${state.target}
          </div>
          <div style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700; font-family: var(--font-mono);">
            Advies: ${state.debbiePitch.estimatedService} (€ ${state.debbiePitch.indicativePriceEur},-)
          </div>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.4rem;">
          <strong>One-Liner:</strong> "${state.debbiePitch.oneLinerNL}"
        </p>
        <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.5;">
          • <strong>Waarom belangrijk:</strong> ${state.debbiePitch.whyCareNL}<br>
          • <strong>Wat bieden we aan:</strong> ${state.debbiePitch.whatWeOfferNL}<br>
          • <strong>Volgende actie:</strong> ${state.debbiePitch.nextAction}
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
            ✓ 3. VERIFICAR RETEST & PROOF PACK
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
            <input type="text" value="${state.category}" readonly style="background: rgba(255,255,255,0.02);" />
          </div>
          <div class="form-group">
            <label>Dirección & Teléfono Público (Arnhem)</label>
            <input type="text" value="${state.address} • ${state.phone || 'Geen telefoon geregistreerd'}" readonly style="background: rgba(255,255,255,0.02);" />
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.75rem;">
            <span class="text-muted">RESTRICCIÓN DE POLÍTICA:</span> <strong class="text-emerald">PUBLIC_PASSIVE_ONLY</strong>
          </div>
          <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.7; margin-left: 1.25rem;">
            <li>Sin envío de paquetes intrusivos, inyecciones SQL ni fuzzing de puertos.</li>
            <li>Protección automática contra direcciones RFC1918 (10.0.0.0/8, 192.168.0.0/16).</li>
            <li>Invariante de Fallo Cerrado (Fail-Closed): si no está explícitamente en regla, se aborta.</li>
          </ul>
          <div class="mt-1" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span class="status-badge status-good">FAIL-CLOSED CHECK: PASS</span>
            <span class="status-badge status-info">SHA-256 SCOPE HASH: VERIFIED</span>
            <span class="status-badge status-warning">AVG / GDPR ART 32: CONFORM</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 2: OBSERVE & DEEP INTEL SENSING -->
    <div class="panel ${state.activeStage === 2 ? '' : 'hide-collapse'}" id="panel-stage-2">
      <h3 class="text-cyan mb-1">ETAPA 2: COLECTORES Y TELEMETRÍA DE OBSERVACIÓN PROFUNDA</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Recopilación pasiva, tolerante a fallos e inteligencia profunda para <strong>${state.target}</strong>.
      </p>

      <div class="grid mb-2">
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="text-cyan" style="font-size: 0.95rem;">COLECTOR DNS</h4>
            <span class="status-badge status-good">9 REGISTROS</span>
          </div>
          <div class="font-mono text-muted" style="font-size: 0.8rem; line-height: 1.6;">
            • Consulta SOA, MX, TXT (SPF), _dmarc, CAA<br>
            • Timeout estricto de 3.000ms por consulta<br>
            • DNSSEC: <span class="text-amber">INSECURE (ZONE UNSIGNED)</span>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="text-cyan" style="font-size: 0.95rem;">COLECTOR TLS & PROTOCOLO</h4>
            <span class="status-badge status-good">TLS 1.3 ACTIVO</span>
          </div>
          <div class="font-mono text-muted" style="font-size: 0.8rem; line-height: 1.6;">
            • Cifrado moderno TLS_AES_256_GCM_SHA384<br>
            • Certificado vigente sin caducidad inminente<br>
            • DANE / TLSA: <span class="text-muted">NO CONFIGURADO</span>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="text-cyan" style="font-size: 0.95rem;">COLECTOR HTTP & HEADERS</h4>
            <span class="status-badge status-warning">CABECERAS AUSENTES</span>
          </div>
          <div class="font-mono text-muted" style="font-size: 0.8rem; line-height: 1.6;">
            • Cap estricto de cuerpo (64KB)<br>
            • HSTS, CSP y X-Frame-Options no emitidos<br>
            • nosniff & Referrer-Policy: <span class="text-amber">FALTANTES</span>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 class="text-cyan" style="font-size: 0.95rem;">MTA-STS & E-MAIL TRANSPORT</h4>
            <span class="status-badge status-info">RFC 8461 EVALUADO</span>
          </div>
          <div class="font-mono text-muted" style="font-size: 0.8rem; line-height: 1.6;">
            • Política _mta-sts: <span class="text-amber">ABSENT</span><br>
            • Diagnóstico _smtp._tls (TLS-RPT): <span class="text-amber">INACTIVO</span><br>
            • BIMI (Brand Indicators): <span class="text-muted">OPCIONAL</span>
          </div>
        </div>
      </div>

      <!-- Typosquatting & Impersonation Radar Box -->
      <div style="background: rgba(16, 24, 44, 0.9); border: 1px solid var(--border-cyan); border-radius: 6px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap;">
          <div>
            <span class="status-badge status-warning">RADAR DE SUPLANTACIÓN & HOMÓGLIFOS</span>
            <strong style="color: #fff; margin-left: 0.5rem; font-size: 0.95rem;">Variantes Algorítmicas de Phishing para ${state.target}</strong>
          </div>
          <span class="status-badge status-info">${state.typosquats.length} VARIANTES GENERADAS</span>
        </div>

        <table class="comp-table" style="margin-top: 0.5rem; font-size: 0.82rem;">
          <thead>
            <tr>
              <th>Dominio Sospechoso</th>
              <th>Técnica de Suplantación</th>
              <th>Nivel de Riesgo</th>
              <th>Medida Preventiva Recomendada</th>
            </tr>
          </thead>
          <tbody>
            ${state.typosquats.map(t => `
              <tr>
                <td class="font-mono text-rose"><strong>${t.variant}</strong></td>
                <td>${t.technique}</td>
                <td><span class="status-badge status-${t.severity === 'HIGH' ? 'critical' : 'warning'}">${t.severity} (${t.risk}/10)</span></td>
                <td style="color: var(--text-muted);">${t.defense}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- STAGE 3: PROVE (EVIDENCE VAULT) -->
    <div class="panel ${state.activeStage === 3 ? '' : 'hide-collapse'}" id="panel-stage-3">
      <h3 class="text-cyan mb-1">ETAPA 3: BÓVEDA DE EVIDENCIAS Y TRAZABILIDAD CRIPTOGRÁFICA</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Invariante de inmutabilidad: Toda evidencia es canonicalizada en JSON, hasheada con SHA-256 y congelada con Object.freeze.
      </p>

      <div>
        ${state.evidence.map(ev => `
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
            Hallazgos observados para <strong>${state.target}</strong> (${state.findings.length} identificados). Sin falsas alarmas ni alucinaciones.
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
        ${state.findings.length === 0 ? `
          <div style="padding: 2rem; background: var(--bg-surface); text-align: center; border-radius: 4px; border: 1px dashed var(--border-dim);">
            <div class="text-emerald mb-1" style="font-weight: 700; font-size: 1.1rem;">GEEN BEVEILIGINGSGEBREKEN GEDETECTEERD</div>
            <p class="text-muted font-mono" style="font-size: 0.85rem;">Dit domein heeft alle basisveiligheidsmaatregelen (SPF, DMARC, HSTS) al correct ingeregeld.</p>
          </div>
        ` : state.findings.map(f => {
          const lang = state.activeLanguage;
          const copy = f.clientCopy[lang] || f.clientCopy.nl;
          const isResolved = f.status === 'RESOLVED';

          return `
            <div class="finding-card severity-${f.severity.toLowerCase()} ${isResolved ? 'resolved' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span class="status-badge status-${f.severity === 'CRITICAL' ? 'critical' : f.severity === 'HIGH' || f.severity === 'MEDIUM' ? 'warning' : 'info'}">${f.severity}</span>
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
                  💡 <strong>Aanbevolen actie:</strong> ${copy.action}
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
        Propuestas comerciales cerradas para <strong>${state.target}</strong> calculadas para Debbie y Abraham.
      </p>

      <div class="grid">
        ${AUX_SERVICES.map(srv => {
          const lang = state.activeLanguage;
          const title = srv.title[lang] || srv.title.nl;
          const desc = srv.description[lang] || srv.description.nl;
          const deliverables = srv.deliverables[lang] || srv.deliverables.nl;

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
                ⏱ Geschatte doorlooptijd: ${srv.estimatedHours}
              </div>

              <div style="border-top: 1px solid var(--border-dim); padding-top: 0.5rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Belangrijkste Opleverpunten:</div>
                <ul style="font-size: 0.8rem; color: var(--text-main); margin-left: 1.25rem;">
                  ${deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- STAGE 6: RETEST & PROOF PACK -->
    <div class="panel ${state.activeStage === 6 ? '' : 'hide-collapse'}" id="panel-stage-6">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 class="text-emerald">ETAPA 6: RETEST & SOVEREIGN PROOF-PACK (RFC 6962 / ISO 27037)</h3>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Demostración matemática antes y después para <strong>${state.target}</strong> con Árbol Merkle y firma Ed25519.
          </p>
        </div>
        ${state.proofs.length > 0 ? `
          <button class="btn accent-emerald" id="btn-download-proofpack">
            💾 DESCARGAR PROOF-PACK JSON
          </button>
        ` : ''}
      </div>

      ${state.proofs.length === 0 ? `
        <div style="text-align: center; padding: 2rem; background: var(--bg-surface); border-radius: 4px; border: 1px dashed var(--border-dim);">
          <div class="text-amber mb-1" style="font-size: 1.25rem; font-weight: 700;">AÚN NO SE HA EJECUTADO LA REMEDIACIÓN</div>
          <p class="text-muted font-mono" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            Presiona el botón "2. APLICAR REMEDIACIÓN AUX" y luego "3. VERIFICAR RETEST & PROOF PACK" arriba para simular la intervención y generar los certificados de prueba.
          </p>
        </div>
      ` : `
        <div class="mb-2">
          <!-- Merkle Verification HUD -->
          <div class="telemetry-card mb-2" style="background: rgba(16, 185, 129, 0.1); border-color: var(--accent-emerald); text-align: left; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
              <div>
                <span class="status-badge status-good">MERKLE TREE ROOT: VERIFIED</span>
                <span class="status-badge status-info" style="margin-left: 0.5rem;">ED25519 SIGNED</span>
              </div>
              <div class="font-mono text-emerald" style="font-size: 0.8rem;">
                ISO/IEC 27037:2012 COMPLIANT
              </div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #a7f3d0; margin-bottom: 0.5rem;">
              <strong>Root Digest:</strong> <code>${state.merkleRoot}</code>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Toda la cadena de evidencias (DNS, TLS, HTTP, CVD) ha sido sellada en un árbol criptográfico. Cualquier alteración de un solo bit en los reportes invalida la raíz.
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
            Documentos generados dinámicamente para <strong>${state.target}</strong> (${state.category}).
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
          Uw organisatie in Arnhem (${state.address}) heeft al een aantal belangrijke basismaatregelen getroffen:
        </p>
        <ul style="font-size: 0.88rem; color: #a7f3d0; margin-left: 1.5rem; line-height: 1.7;">
          <li><strong>Moderne transportbeveiliging:</strong> Uw website maakt gebruik van moderne encryptie met een geldig SSL-certificaat.</li>
          <li><strong>DNS infrastructuur:</strong> Betrouwbare domeinnaamservers zonder openbare zonevervuiling.</li>
          <li><strong>Publieke bereikbaarheid:</strong> Geen onbedoelde interne netwerkblootstelling (RFC1918) gedetecteerd.</li>
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
              <td>DMARC staat op monitoren (p=none) of ontbreekt; SPF staat niet op hardfail</td>
              <td>Inrichten van DMARC handhaving (p=reject) en strikte SPF (-all)</td>
              <td class="text-emerald" style="font-weight: 700;">€ 495,-</td>
            </tr>
            <tr>
              <td><strong>Webbrowser Verharding (HSTS / CSP)</strong></td>
              <td>HSTS en Content Security Policy ontbreken nog</td>
              <td>Configuratie van HSTS (max-age=1 jaar) en modulaire CSP-regels</td>
              <td class="text-emerald" style="font-weight: 700;">€ 495,-</td>
            </tr>
            <tr>
              <td><strong>CVD-Beleid (security.txt RFC 9116)</strong></td>
              <td>Geen formeel meldpunt voor ethische melders</td>
              <td>Publicatie van security.txt bestand conform Nederlandse i-Overheid norm</td>
              <td class="text-emerald" style="font-weight: 700;">€ 195,-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid var(--border-dim); padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Vragen of direct inplannen voor ${state.target}? Neem contact op via <strong>contact@auxdesign.nl</strong>
        </div>
        <div class="text-cyan font-mono" style="font-size: 0.85rem;">
          auxdesign.nl • Amsterdam & Arnhem
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
        <div class="font-mono text-muted" style="font-size: 0.8rem;">Target ID: ${state.selectedLeadId} | Run Mode: Offline Deterministic</div>
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
          ${state.evidence.map(ev => `
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

      <h4 class="text-cyan mb-1">Deterministic Findings Invariant Table</h4>
      <table class="comp-table mb-2">
        <thead>
          <tr>
            <th>Finding ID</th>
            <th>Rule ID</th>
            <th>Severity</th>
            <th>Observed Evidence</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${state.findings.map(f => `
            <tr>
              <td class="font-mono text-amber">${f.id}</td>
              <td class="font-mono">${f.ruleId}</td>
              <td><span class="status-badge status-${f.severity === 'CRITICAL' ? 'critical' : 'warning'}">${f.severity}</span></td>
              <td class="font-mono" style="font-size: 0.75rem;">${f.explanation.observed}</td>
              <td><span class="status-badge status-${f.status === 'RESOLVED' ? 'good' : 'warning'}">${f.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4 class="text-cyan mb-1">CLI Reproduction Commands</h4>
      <pre style="background: #020408; padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim); color: #a5b4fc; font-family: var(--font-mono); font-size: 0.85rem; overflow-x: auto;">
# Inspect company dossier via Field CLI
node scripts/field_cli.mjs --company ${state.selectedLeadId}

# Reproduce deterministic inspection offline
pnpm run field -- --red

# Verify evidence cryptographic integrity
node scripts/verify_proof_pack.mjs reports/sample_proof_pack.json
      </pre>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 03: CONSTELLATION MESH EXPLORER
// ---------------------------------------------------------------------------
function renderConstellationScreen(): string {
  return `
    <div class="panel mb-2">
      <span class="status-badge status-info mb-1">SOVEREIGN MULTI-REPOSITORY ARCHITECTURE</span>
      <h2 class="text-cyan mb-1">THE ARGUS CONSTELLATION MESH</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        La constelación soberana de 8 proyectos interconectados. Cada nodo tiene una función matemática específica dentro del ecosistema de inteligencia pasiva, defensa de infraestructura y analítica urbana.
      </p>
    </div>

    <!-- Active Nodes Grid -->
    <div class="constellation-grid">
      ${CONSTELLATION_NODES.map(node => `
        <div class="constellation-node-card" style="border-top: 3px solid ${node.badgeColor};">
          <div class="constellation-node-header">
            <div>
              <span class="status-badge" style="background: ${node.badgeColor}22; color: ${node.badgeColor}; border: 1px solid ${node.badgeColor};">${node.codeName}</span>
              <h3 style="color: #fff; margin-top: 0.4rem; font-size: 1.05rem;">${node.name}</h3>
            </div>
            <span class="status-badge status-good">${node.status}</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.75rem; line-height: 1.5;">
            ${node.roleDescription}
          </p>

          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.75rem;">
            <div><strong>Repo:</strong> <code>${node.repoPath}</code></div>
            <div><strong>Stack:</strong> ${node.leadTech}</div>
          </div>

          <div style="margin-bottom: 0.5rem;">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 0.25rem;">Capacidades Clave:</div>
            <ul style="font-size: 0.78rem; color: var(--text-main); margin-left: 1.25rem; line-height: 1.5;">
              ${node.keyCapabilities.slice(0, 3).map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>

          <div style="border-top: 1px solid var(--border-dim); padding-top: 0.5rem; font-size: 0.78rem; color: ${node.badgeColor}; font-family: var(--font-mono);">
            🏛 <strong>Uso Institucional:</strong> ${node.institutionalApplication}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Data Flow Matrix Panel -->
    <div class="panel">
      <h3 class="text-cyan mb-1">FLUJOS DE DATOS E INTEROPERABILIDAD ENTRE REPOSITORIOS</h3>
      <p class="text-muted font-mono mb-2" style="font-size: 0.85rem;">
        Contratos de integración e interfaces de paso de mensajes sin acoplamiento monolítico.
      </p>

      <table class="comp-table">
        <thead>
          <tr>
            <th>Origen</th>
            <th>Destino</th>
            <th>Tipo de Flujo</th>
            <th>Descripción del Flujo</th>
            <th>Protocolo / Formato</th>
          </tr>
        </thead>
        <tbody>
          ${CONSTELLATION_EDGES.map(edge => `
            <tr>
              <td><strong class="text-cyan">${edge.source}</strong></td>
              <td><strong class="text-emerald">${edge.target}</strong></td>
              <td><span class="flow-badge">${edge.flowType}</span></td>
              <td style="color: var(--text-main);">${edge.label}</td>
              <td class="font-mono" style="font-size: 0.75rem;">${edge.protocol}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 04: CALMAP GEOSPATIAL EXPLORER
// ---------------------------------------------------------------------------
function renderCalMapScreen(): string {
  return `
    <div class="panel mb-2">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="status-badge status-good mb-1">CALMAP · LIVING CITY CONTEXT</span>
          <h2 class="text-cyan mb-1">CALMAP ARNHEM · SITUATIONAL CYBER-PHYSICAL MAP</h2>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Integración de los 171 objetivos de ARGUS con la realidad geográfica de Arnhem, datos de tráfico NDW en tiempo real y cámaras públicas.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a href="./calmap.html" target="_blank" class="btn primary">
            ↗ ABRIR CALMAP EN PANTALLA COMPLETA
          </a>
        </div>
      </div>
    </div>

    <!-- Embedded CalMap Iframe -->
    <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border-cyan); box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 1.5rem;">
      <iframe src="./calmap.html" style="width: 100%; height: 750px; border: none; background: #0f172a;" title="CalMap Arnhem Context"></iframe>
    </div>

    <div class="grid">
      <div class="panel">
        <h4 class="text-cyan mb-1">LOS 6 NIVELES DE PROGRESSIVE DISCLOSURE</h4>
        <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.8; margin-left: 1.25rem;">
          <li><strong>1. Basis Kaart (OpenStreetMap):</strong> Cartografía limpia y sin distracciones comerciales de Google Maps.</li>
          <li><strong>2. Verkeersstroom (NDW Datex II):</strong> Sensores de velocidad y flujo en carreteras de acceso a Arnhem.</li>
          <li><strong>3. Activiteit & Drukte:</strong> Densidad peatonal modelada sin cámaras de reconocimiento facial invasivo.</li>
          <li><strong>4. Evenementen & Wegwerkzaamheden:</strong> Cortes viales en Eusebius, Sonsbeek y Rijnkade.</li>
          <li><strong>5. Verkeerscamera's:</strong> Feeds de vídeo públicos de Rijkswaterstaat y Gemeente Arnhem.</li>
          <li><strong>6. ARGUS Bedrijven (171 Leads):</strong> Los 171 comercios escaneados con pines de color (🟥 Urgente, 🟧 Substancial, 🟨 Moderado, 🟩 Óptimo).</li>
        </ul>
      </div>

      <div class="panel">
        <h4 class="text-emerald mb-1">VENTA EN TERRENO: OPTIMIZACIÓN DE RUTAS</h4>
        <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
          Para la jornada del lunes en Arnhem, Abraham y Debbie pueden abrir CalMap en su tablet y caminar por zonas densas (ej. Roggestraat, Steenstraat, Jansstraat) visitando negocios marcados en 🟥 sin perder tiempo en traslados innecesarios.
        </p>
        <div class="telemetry-row" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
          <div class="telemetry-card">
            <div class="telemetry-label">Tiempo por Visita</div>
            <div class="telemetry-val text-amber">8-12 min</div>
          </div>
          <div class="telemetry-card">
            <div class="telemetry-label">Visitas por Día</div>
            <div class="telemetry-val text-emerald">18-24</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 05: INSTITUTIONAL / EUROPOL / DORA VIEW
// ---------------------------------------------------------------------------
function renderInstitutionalScreen(): string {
  const currentAgency = INSTITUTIONAL_PROFILES.find(p => p.agencyId === state.selectedAgencyId) || INSTITUTIONAL_PROFILES[0];
  const dynamicStix = generateDynamicStixBundle(state.target, state.findings.length, state.tier);
  const dynamicMisp = generateDynamicMispEvent(state.target, state.findings.length, state.tier);

  return `
    <div class="panel mb-2">
      <span class="status-badge status-warning mb-1">DUAL-USE DEFENSE & LAW ENFORCEMENT FRAMEWORK</span>
      <h2 class="text-cyan mb-1">INTELIGENCIA INSTITUCIONAL & MARCO DE COOPERACIÓN</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        ARGUS como herramienta dual-use de soberanía digital europea: observabilidad sin intrusión, trazabilidad ISO/IEC 27037 y cumplimiento NIS2 / DORA para Europol EC3, Interpol y Fuerzas Armadas.
      </p>
    </div>

    <!-- Agency Selector Pills -->
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
      ${INSTITUTIONAL_PROFILES.map(agency => `
        <button class="btn ${agency.agencyId === state.selectedAgencyId ? 'primary' : ''} btn-agency-select" data-agency="${agency.agencyId}">
          ${agency.agencyName}
        </button>
      `).join('')}
    </div>

    <!-- Agency Detail Panel -->
    <div class="institutional-card mb-2">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <span class="status-badge status-info">${currentAgency.jurisdiction}</span>
          <h2 style="color: #fff; margin-top: 0.4rem; font-size: 1.4rem;">${currentAgency.agencyName}</h2>
        </div>
        <div>
          <span class="status-badge status-good">MARCO ACREDITADO</span>
        </div>
      </div>

      <div class="grid mb-1">
        <div>
          <h4 class="text-cyan mb-1" style="font-size: 0.9rem;">MANDATO INSTITUCIONAL</h4>
          <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
            ${currentAgency.mandate}
          </p>

          <h4 class="text-cyan mb-1" style="font-size: 0.9rem;">MARCOS LEGALES & REGULATORIOS APLICABLES</h4>
          <ul style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.7; margin-left: 1.25rem; margin-bottom: 1rem;">
            ${currentAgency.applicableFrameworks.map(f => `<li><strong>${f}</strong></li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 class="text-emerald mb-1" style="font-size: 0.9rem;">APORTE TECNOLÓGICO SOBERANO DE ARGUS</h4>
          <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
            ${currentAgency.argusCapability}
          </p>

          <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 0.75rem;">
            <div class="text-muted">ESTÁNDAR DE EVIDENCIA:</div>
            <div class="text-emerald" style="margin-top: 0.25rem;">${currentAgency.evidenceStandard}</div>
          </div>

          <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem;">
            <div class="text-muted">FORMATO DE INTERCAMBIO CTI:</div>
            <div class="text-cyan" style="margin-top: 0.25rem;">${currentAgency.stixMapping}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Live STIX 2.1 & MISP CTI Exporter Panel -->
    <div class="panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 class="text-cyan">EXPORTADOR CTI AUTOMATIZADO PARA: ${state.target}</h3>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Formatos estandarizados OASIS STIX 2.1 y MISP para intercambio de inteligencia con agencias de seguridad y CSIRTs.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="copy-btn ${state.institutionalTab === 'stix' ? 'active' : ''}" id="btn-tab-stix">STIX 2.1 BUNDLE</button>
          <button class="copy-btn ${state.institutionalTab === 'misp' ? 'active' : ''}" id="btn-tab-misp">MISP EVENT JSON</button>
          <button class="copy-btn" id="btn-copy-cti">📋 COPIAR JSON</button>
          <button class="copy-btn" id="btn-download-cti">💾 DESCARGAR JSON</button>
        </div>
      </div>

      <pre id="cti-preview" style="background: #020408; padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim); color: #a5b4fc; font-family: var(--font-mono); font-size: 0.78rem; overflow-x: auto; max-height: 400px;">${JSON.stringify(state.institutionalTab === 'stix' ? dynamicStix : dynamicMisp, null, 2)}</pre>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// VIEW 06: COMMERCIAL CASE STUDY
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
// VIEW 07: AI POLICY GATE SIMULATOR
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
// VIEW 08: ARCHITECTURE & INVARIANTS
// ---------------------------------------------------------------------------
function renderArchitectureScreen(): string {
  return `
    <div class="panel mb-2">
      <span class="status-badge status-good mb-1">ARCHITECTURE & GOVERNANCE</span>
      <h2 class="text-cyan mb-1">LOS 8 INVARIANTES SAGRADOS DE ARGUS</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Garantías del sistema verificadas por la suite de 185 tests automatizados.
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
        <h4 class="text-cyan mb-1">6. RETEST CON CRIPTOGRAFÍA & MERKLE</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          La remediación solo se marca <code>RESOLVED</code> si existe una evidencia de retest válida con Árbol Merkle verificable.
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

  // Select Lead from dropdown
  document.getElementById('select-arnhem-lead')?.addEventListener('change', (e) => {
    const leadId = (e.target as HTMLSelectElement).value;
    const selected = ARNHEM_LEADS.find(l => l.id === leadId);
    if (selected) {
      state.selectedLeadId = selected.id;
      state.target = selected.domain;
      state.category = selected.category;
      state.address = selected.address;
      state.phone = selected.phone;
      state.tier = selected.tier;
      state.colorEmoji = selected.colorEmoji;
      state.score = selected.score;
      state.debbiePitch = selected.pitch;
      state.findings = selected.findings.map(f => convertScannedFindingToItem(f, selected.domain));
      state.evidence = generateDynamicEvidence(selected);
      state.typosquats = generateBrowserTyposquats(selected.domain);
      const merkle = buildVisualMerkleTree(state.evidence.map(ev => ({ id: ev.id, rawSnippet: ev.rawSnippet })));
      state.merkleRoot = merkle.rootHash;
      state.simulationStep = 'baseline';
      state.proofs = [];
      renderApp();
    }
  });

  // Search input for leads
  document.getElementById('input-lead-search')?.addEventListener('input', (e) => {
    state.searchQuery = (e.target as HTMLInputElement).value;
    renderApp();
  });

  // Tier filter buttons
  document.querySelectorAll('.tier-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = (e.currentTarget as HTMLElement).dataset.filter as any;
      if (filter) {
        state.tierFilter = filter;
        renderApp();
      }
    });
  });

  // Simulator Controls
  document.getElementById('btn-run-baseline')?.addEventListener('click', () => {
    state.activeStage = 4;
    renderApp();
  });

  document.getElementById('btn-apply-fix')?.addEventListener('click', () => {
    state.simulationStep = 'remediating';
    state.findings.forEach(f => {
      f.status = 'RESOLVED';
    });
    state.activeStage = 5;
    renderApp();
  });

  document.getElementById('btn-run-retest')?.addEventListener('click', () => {
    state.simulationStep = 'retested';
    state.proofs = state.findings.map((f, idx) => ({
      id: `prf_${(idx + 1).toString().padStart(2, '0')}_${f.category.toLowerCase()}`,
      findingId: f.id,
      ruleId: f.ruleId,
      status: 'RESOLVED',
      rationale: `Retest verified remediation for ${f.title}. Rule ${f.ruleId} no longer flags.`,
      baselineEvidenceSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      retestEvidenceSha: '84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391'
    }));
    state.activeStage = 6;
    renderApp();
  });

  document.getElementById('btn-reset-sim')?.addEventListener('click', () => {
    state.simulationStep = 'baseline';
    state.activeStage = 1;
    const currentLead = ARNHEM_LEADS.find(l => l.id === state.selectedLeadId) || defaultLead;
    state.findings = currentLead.findings.map(f => convertScannedFindingToItem(f, currentLead.domain));
    state.proofs = [];
    renderApp();
  });

  // Download Proof Pack JSON
  document.getElementById('btn-download-proofpack')?.addEventListener('click', () => {
    const proofPackPayload = {
      packId: `pack_${state.merkleRoot.substring(0, 16)}`,
      targetDomain: state.target,
      timestamp: new Date().toISOString(),
      merkleRoot: state.merkleRoot,
      evidenceCount: state.evidence.length,
      leaves: state.evidence.map(e => ({ evidenceId: e.id, sha256: e.sha256 })),
      proofs: state.proofs,
      signature: {
        algorithm: 'Ed25519',
        verified: true,
        rfc3161Compliant: true
      }
    };
    const blob = new Blob([JSON.stringify(proofPackPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus_proofpack_${state.target}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  // Agency selection in Institutional screen
  document.querySelectorAll('.btn-agency-select').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const agencyId = (e.currentTarget as HTMLElement).dataset.agency;
      if (agencyId) {
        state.selectedAgencyId = agencyId;
        renderApp();
      }
    });
  });

  // Institutional tabs (STIX vs MISP)
  document.getElementById('btn-tab-stix')?.addEventListener('click', () => {
    state.institutionalTab = 'stix';
    renderApp();
  });

  document.getElementById('btn-tab-misp')?.addEventListener('click', () => {
    state.institutionalTab = 'misp';
    renderApp();
  });

  // Copy CTI JSON
  document.getElementById('btn-copy-cti')?.addEventListener('click', () => {
    const data = state.institutionalTab === 'stix'
      ? generateDynamicStixBundle(state.target, state.findings.length, state.tier)
      : generateDynamicMispEvent(state.target, state.findings.length, state.tier);
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      alert(`${state.institutionalTab.toUpperCase()} JSON gekopieerd naar klembord!`);
    });
  });

  // Download CTI JSON
  document.getElementById('btn-download-cti')?.addEventListener('click', () => {
    const data = state.institutionalTab === 'stix'
      ? generateDynamicStixBundle(state.target, state.findings.length, state.tier)
      : generateDynamicMispEvent(state.target, state.findings.length, state.tier);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus_${state.institutionalTab}_${state.target}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          • Referencia a evidencia válida: <code>ev_http_headers</code> (PRESENTE)<br>
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
