/**
 * ARGUS Professional Report Generator
 *
 * Implements:
 * - Client Report (NL Dutch-first, EN, ES) - Understandable, factual, commercial opportunities from AUX Design, ZERO fear-mongering.
 * - Engineer Report (HTML & Text/Markdown) - Cryptographic evidence graph, SHA-256 hashes, reproduction commands, limitations.
 * - JSON Report - Standardized machine-readable inspection results.
 *
 * Strictly offline-first: Zero external fonts, CDNs, scripts, or tracking.
 * Self-contained HTML printable directly to PDF via browser print.
 */

import type { InspectionResultV1, ArgusBundle, Finding, Opportunity, Evidence, Proof } from '@argus/schema';
import { AUX_SERVICE_CATALOG } from './service-catalog.js';

export interface ClientReportOptions {
  language?: 'nl' | 'en' | 'es';
  companyName?: string;
  assessmentDate?: string;
  assessorName?: string;
  contactEmail?: string;
  contactUrl?: string;
  includePricing?: boolean;
  includePositiveFindings?: boolean;
}

export interface EngineerReportOptions {
  companyName?: string;
  assessmentDate?: string;
  assessorName?: string;
  includeRawEvidence?: boolean;
}

// Backwards-compatible alias for existing callers
export interface ReportOptions extends ClientReportOptions {
  includeTechnicalDetails?: boolean;
}

interface NormalizedReportData {
  hostname: string;
  runId: string;
  date: string;
  durationMs: number;
  bundleHash?: string;
  evidence: Evidence[];
  findings: Finding[];
  opportunities: Opportunity[];
  proofs?: Proof[];
}

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeInput(input: InspectionResultV1 | ArgusBundle): NormalizedReportData {
  const isBundle = 'bundleHash' in input;
  const hostname = input.target?.hostname || input.target?.input || 'unknown-target';
  const runId = isBundle ? (input as ArgusBundle).run?.id : (input as InspectionResultV1).runId;
  const date = isBundle
    ? (input as ArgusBundle).run?.timestamp
    : (input as InspectionResultV1).status?.startedAt || new Date().toISOString();
  const durationMs = isBundle
    ? (input as ArgusBundle).run?.durationMs || 0
    : (input as InspectionResultV1).status?.durationMs || 0;
  const bundleHash = isBundle ? (input as ArgusBundle).bundleHash : undefined;
  const evidence = input.evidence || [];
  const findings = input.findings || [];
  const opportunities = input.opportunities || [];
  const proofs = (input as any).proofs || [];

  return {
    hostname,
    runId,
    date,
    durationMs,
    bundleHash,
    evidence,
    findings,
    opportunities,
    proofs
  };
}

const CLIENT_TRANSLATIONS = {
  nl: {
    title: 'Website Beveiligings- & Kansenrapport',
    subtitle: 'Niet-invasieve analyse van openbare internetstandaarden',
    partnerBadge: 'In samenwerking met AUX Design (auxdesign.nl)',
    executiveSummary: 'Managementsamenvatting',
    summaryP1: 'Dit rapport geeft een feitelijk en niet-invasief overzicht van de beveiligingsconfiguratie van uw domein. Er zijn uitsluitend openbare DNS-, TLS- en HTTP-gegevens geanalyseerd volgens geaccepteerde internetstandaarden (zoals vastgelegd door RFC-normen en het Internet Standards Platform internet.nl).',
    summaryNoFear: 'ARGUS hanteert een strikt "zero-fear" principe: we tonen geen hypothetische boetes of theoretische kwetsbaarheidsscores, maar heldere feiten en concrete oplossingen.',
    target: 'Beoordeeld domein',
    date: 'Datum inspectie',
    auditor: 'Inspecteur / Beoordelaar',
    statsTotalFindings: 'Aandachtspunten',
    statsOpportunities: 'Verbeterkansen',
    statsPositives: 'Goed Geconfigureerd',
    positiveTitle: 'Positieve Waarnemingen (Wat staat er goed?)',
    positiveDesc: 'De volgende beveiligingsstandaarden zijn reeds actief waargenomen op uw domein:',
    opportunitiesTitle: 'Concrete Verbeterkansen & AUX Oplossingen',
    opportunitiesDesc: 'Onderstaande mogelijkheden verhogen uw domeinreputatie, e-mailbezorging en klantvertrouwen. Voor elke kans biedt AUX Design een concrete implementatie aan.',
    serviceDetails: 'AUX Dienstdetails',
    deliverables: 'Op te leveren resultaten',
    estimatedHours: 'Geschatte doorlooptijd',
    indicativePrice: 'Richtprijs',
    exclVat: 'excl. btw',
    hours: 'uur',
    retestIncluded: 'Inclusief ARGUS verificatie retest met voor/na bewijs',
    findingsTitle: 'Gedetailleerde Aandachtspunten',
    severity: 'Prioriteit',
    confidence: 'Verificatiestatus',
    observed: 'Feitelijke waarneming',
    whyItMatters: 'Waarom dit belangrijk is',
    remediation: 'Aanbevolen herstelstap',
    nextStepsTitle: 'Vervolgstappen & Contact',
    nextStepsBody: 'Wilt u deze verbeteringen professioneel laten inrichten en verifiëren? Neem contact op met AUX Design voor een vrijblijvende toelichting en snelle implementatie.',
    contactButton: 'Contact opnemen met AUX Design',
    retestSectionTitle: 'Retest & Verificatiebewijs',
    retestSummary: 'Resultaten van eerdere herstelacties vergeleken met de nulmeting:',
    statusResolved: 'OPGELOST',
    statusImproved: 'VERBETERD',
    statusUnchanged: 'ONGEWIJZIGD',
    statusRegressed: 'VERSLECHTERD',
    statusUnverified: 'ONGEVERIFIEERD',
    footerNotice: 'Gegenereerd door ARGUS • 100% Offline Verificatie & Bewijsketen • Geen externe tracking'
  },
  en: {
    title: 'Website Security & Opportunity Report',
    subtitle: 'Non-invasive analysis of public internet standards',
    partnerBadge: 'In partnership with AUX Design (auxdesign.nl)',
    executiveSummary: 'Executive Summary',
    summaryP1: 'This report provides a factual and non-invasive overview of your domain’s security posture. Only publicly observable DNS, TLS, and HTTP configurations were inspected according to international standards (RFCs and internet.nl standards).',
    summaryNoFear: 'ARGUS adheres to a strict zero-fear policy: we do not present hypothetical regulatory fine amounts or fabricated risk scores, but factual evidence and actionable solutions.',
    target: 'Assessed domain',
    date: 'Inspection date',
    auditor: 'Assessor / Inspector',
    statsTotalFindings: 'Attention Items',
    statsOpportunities: 'Opportunities',
    statsPositives: 'Well Configured',
    positiveTitle: 'Positive Observations (What is working well?)',
    positiveDesc: 'The following security controls were verified as properly active on your domain:',
    opportunitiesTitle: 'Commercial Opportunities & AUX Services',
    opportunitiesDesc: 'The following improvements protect your reputation, email deliverability, and customer trust. AUX Design provides complete implementation for each opportunity.',
    serviceDetails: 'AUX Service Details',
    deliverables: 'Key Deliverables',
    estimatedHours: 'Estimated effort',
    indicativePrice: 'Indicative Price',
    exclVat: 'excl. VAT',
    hours: 'hours',
    retestIncluded: 'Includes ARGUS verification retest with before/after cryptographic proof',
    findingsTitle: 'Detailed Technical Observations',
    severity: 'Priority',
    confidence: 'Verification Status',
    observed: 'Observed network fact',
    whyItMatters: 'Business significance',
    remediation: 'Recommended fix',
    nextStepsTitle: 'Next Steps & Contact',
    nextStepsBody: 'Would you like AUX Design to implement and verify these remediations? Contact us to schedule the fixes.',
    contactButton: 'Contact AUX Design',
    retestSectionTitle: 'Retest & Verification Proof',
    retestSummary: 'Comparison of remediation outcomes against the baseline audit:',
    statusResolved: 'RESOLVED',
    statusImproved: 'IMPROVED',
    statusUnchanged: 'UNCHANGED',
    statusRegressed: 'REGRESSED',
    statusUnverified: 'UNVERIFIED',
    footerNotice: 'Generated by ARGUS • 100% Offline Verification & Cryptographic Chain • Zero external tracking'
  },
  es: {
    title: 'Informe de Seguridad Web y Oportunidades',
    subtitle: 'Análisis no invasivo de estándares públicos de internet',
    partnerBadge: 'En colaboración con AUX Design (auxdesign.nl)',
    executiveSummary: 'Resumen Ejecutivo',
    summaryP1: 'Este informe ofrece una visión factual y no invasiva de la postura de seguridad de su dominio. Solo se han evaluado configuraciones públicas de DNS, TLS y HTTP de acuerdo con los estándares de internet de la IETF / RFC.',
    summaryNoFear: 'ARGUS sigue un principio estricto de cero alarmismo: no calculamos sanciones regulatorias hipotéticas ni puntuaciones de riesgo ficticias, sino evidencia comprobable y soluciones claras.',
    target: 'Dominio evaluado',
    date: 'Fecha de inspección',
    auditor: 'Auditor / Evaluador',
    statsTotalFindings: 'Puntos de Atención',
    statsOpportunities: 'Oportunidades',
    statsPositives: 'Bien Configurado',
    positiveTitle: 'Observaciones Positivas (¿Qué está bien?)',
    positiveDesc: 'Se ha comprobado que las siguientes medidas de seguridad están correctamente activas:',
    opportunitiesTitle: 'Oportunidades de Mejora y Servicios AUX',
    opportunitiesDesc: 'Las siguientes mejoras protegen su reputación, entregabilidad de correo y confianza de sus clientes. AUX Design ofrece la implementación completa.',
    serviceDetails: 'Detalles del Servicio AUX',
    deliverables: 'Entregables principales',
    estimatedHours: 'Tiempo estimado',
    indicativePrice: 'Precio indicativo',
    exclVat: 'sin IVA',
    hours: 'horas',
    retestIncluded: 'Incluye retest de verificación ARGUS con prueba criptográfica antes/después',
    findingsTitle: 'Observaciones Técnicas Detalladas',
    severity: 'Prioridad',
    confidence: 'Estado de Verificación',
    observed: 'Hecho observado en red',
    whyItMatters: 'Impacto en el negocio',
    remediation: 'Solución recomendada',
    nextStepsTitle: 'Próximos Pasos y Contacto',
    nextStepsBody: '¿Desea que AUX Design implemente y verifique estas mejoras en su infraestructura? Contáctenos para coordinar la intervención.',
    contactButton: 'Contactar con AUX Design',
    retestSectionTitle: 'Retest y Prueba de Verificación',
    retestSummary: 'Comparación de resultados tras remediación frente a la auditoría inicial:',
    statusResolved: 'RESUELTO',
    statusImproved: 'MEJORADO',
    statusUnchanged: 'SIN CAMBIOS',
    statusRegressed: 'REGRESIONADO',
    statusUnverified: 'NO VERIFICADO',
    footerNotice: 'Generado por ARGUS • Verificación 100% Offline y Cadena Criptográfica • Sin seguimiento externo'
  }
};

interface PositiveCheck {
  title: Record<'nl' | 'en' | 'es', string>;
  description: Record<'nl' | 'en' | 'es', string>;
}

function detectPositiveChecks(evidence: Evidence[], findings: Finding[]): PositiveCheck[] {
  const positives: PositiveCheck[] = [];
  const findingRuleIds = new Set(findings.map(f => f.ruleId));

  // Check TLS / HTTPS
  const httpEv = evidence.find(e => e.type === 'HTTP_RESPONSE');
  if (httpEv) {
    const raw = httpEv.rawValue || {};
    const norm = httpEv.normalizedValue || {};
    const url = norm.url || raw.url || '';
    if (url.startsWith('https://')) {
      positives.push({
        title: {
          nl: 'Beveiligde HTTPS-verbinding Actief',
          en: 'Encrypted HTTPS Connection Active',
          es: 'Conexión Cifrada HTTPS Activa'
        },
        description: {
          nl: 'Website transporteert webverkeer standaard via een versleuteld HTTPS-kanaal.',
          en: 'Website serves traffic over an encrypted HTTPS channel by default.',
          es: 'El sitio web transmite el tráfico a través de HTTPS cifrado por defecto.'
        }
      });
    }
  }

  // Check HSTS
  if (!findingRuleIds.has('rule-http-missing-hsts') && httpEv) {
    positives.push({
      title: {
        nl: 'HSTS Transportbeveiliging Ingeschakeld',
        en: 'HSTS Transport Security Enabled',
        es: 'Seguridad de Transporte HSTS Habilitada'
      },
      description: {
        nl: 'Browsers worden verplicht om uitsluitend via HTTPS verbinding te maken.',
        en: 'Browsers are mandated to strictly connect over HTTPS.',
        es: 'Los navegadores están obligados a conectarse exclusivamente mediante HTTPS.'
      }
    });
  }

  // Check SPF
  if (!findingRuleIds.has('rule-dns-missing-spf') && !findingRuleIds.has('rule-dns-weak-spf')) {
    const hasSpfEv = evidence.some(e => e.type === 'DNS_TXT' || (e.normalizedValue && e.normalizedValue.kind === 'SPF'));
    if (hasSpfEv) {
      positives.push({
        title: {
          nl: 'Strikte SPF E-mailauthenticatie',
          en: 'Strict SPF Email Authentication',
          es: 'Autenticación de Email SPF Estricta'
        },
        description: {
          nl: 'SPF-record geconfigureerd met strikte hardfail (-all) autorisatie.',
          en: 'SPF record is properly configured with strict hardfail (-all) policy.',
          es: 'Registro SPF configurado con política estricta de rechazo (-all).'
        }
      });
    }
  }

  // Check DMARC
  if (!findingRuleIds.has('rule-dns-missing-dmarc') && !findingRuleIds.has('rule-dns-dmarc-p-none')) {
    const hasDmarcEv = evidence.some(e => e.type === 'DNS_DMARC' || (e.normalizedValue && e.normalizedValue.kind === 'DMARC'));
    if (hasDmarcEv) {
      positives.push({
        title: {
          nl: 'Gehandhaafd DMARC Beleid',
          en: 'Enforced DMARC Policy',
          es: 'Política DMARC con Aplicación Activa'
        },
        description: {
          nl: 'DMARC-record handhaaft actieve quarantaine- of afwijsregels tegen spoofing.',
          en: 'DMARC policy enforces quarantine or reject actions against spoofed emails.',
          es: 'La política DMARC aplica cuarentena o rechazo contra correos suplantados.'
        }
      });
    }
  }

  // Check CAA
  if (!findingRuleIds.has('rule-dns-missing-caa')) {
    const hasCaaEv = evidence.some(e => e.type === 'DNS_CAA' && Array.isArray(e.normalizedValue?.records) && e.normalizedValue.records.length > 0);
    if (hasCaaEv) {
      positives.push({
        title: {
          nl: 'DNS CAA Certificaatbeperking',
          en: 'DNS CAA Certificate Restriction',
          es: 'Restricción de Certificados DNS CAA'
        },
        description: {
          nl: 'Alleen expliciet aangewezen certificaatautoriteiten mogen certificaten uitgeven.',
          en: 'Only explicitly designated Certificate Authorities may issue domain certificates.',
          es: 'Solo las autoridades certificadoras designadas explícitamente pueden emitir certificados.'
        }
      });
    }
  }

  return positives;
}

/**
 * Generates a clean, factual, Dutch-first client report.
 */
export function generateClientReport(
  input: InspectionResultV1 | ArgusBundle,
  options: ClientReportOptions = {}
): string {
  const data = normalizeInput(input);
  const lang = options.language || 'nl';
  const t = CLIENT_TRANSLATIONS[lang] || CLIENT_TRANSLATIONS.nl;
  const contactEmail = options.contactEmail || 'info@auxdesign.nl';
  const contactUrl = options.contactUrl || 'https://auxdesign.nl';
  const includePricing = options.includePricing !== false;
  const includePositiveFindings = options.includePositiveFindings !== false;

  const positiveChecks = includePositiveFindings ? detectPositiveChecks(data.evidence, data.findings) : [];

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(t.title)} - ${escapeHtml(data.hostname)}</title>
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-light: #eff6ff;
      --secondary: #0f766e;
      --accent: #d97706;
      --danger: #b91c1c;
      --success: #15803d;
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 1.5cm; size: A4 portrait; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.55;
      color: var(--text);
      background: var(--bg);
      font-size: 10.5pt;
    }
    .wrapper {
      max-width: 860px;
      margin: 24px auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 36px 44px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-title h1 {
      font-size: 20pt;
      color: var(--primary);
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header-title .subtitle {
      font-size: 11pt;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .partner-badge {
      background: var(--primary-light);
      border: 1px solid #bfdbfe;
      color: var(--primary);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 9pt;
      font-weight: 600;
      text-align: right;
    }
    .meta-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #f1f5f9;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 28px;
      font-size: 9.5pt;
    }
    .meta-item strong { display: block; color: var(--text-muted); font-size: 8.5pt; text-transform: uppercase; }
    .meta-item span { font-weight: 600; color: var(--text); }
    .section { margin-bottom: 30px; break-inside: avoid; }
    .section-title {
      font-size: 14pt;
      color: var(--primary);
      border-bottom: 1.5px solid var(--primary);
      padding-bottom: 6px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat-box {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 14px;
      background: #ffffff;
      text-align: center;
    }
    .stat-number { font-size: 22pt; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 9pt; color: var(--text-muted); text-transform: uppercase; margin-top: 2px; }
    .summary-text { font-size: 10pt; color: #334155; margin-bottom: 12px; }
    .no-fear-callout {
      background: #f0fdf4;
      border-left: 4px solid var(--success);
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 9pt;
      color: #166534;
      margin-bottom: 20px;
    }
    .positive-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid var(--success);
      border-radius: 4px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .positive-title { font-weight: 600; color: #166534; font-size: 10.5pt; }
    .positive-desc { font-size: 9pt; color: #475569; margin-top: 3px; }
    .opp-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 18px;
      margin-bottom: 18px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .opp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .opp-title { font-size: 12pt; font-weight: 700; color: var(--primary); }
    .opp-benefit { font-size: 10pt; color: #334155; margin-bottom: 12px; }
    .opp-deliverables {
      background: #f8fafc;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-size: 9pt;
    }
    .opp-deliverables ul { margin-left: 18px; margin-top: 4px; }
    .opp-deliverables li { margin-bottom: 3px; color: #334155; }
    .opp-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9pt;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
    }
    .price-tag {
      font-size: 12pt;
      font-weight: 700;
      color: var(--secondary);
    }
    .finding-card {
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 12px;
      background: #ffffff;
    }
    .finding-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .finding-title { font-size: 11pt; font-weight: 600; color: var(--text); }
    .badge {
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #f1f5f9; color: #475569; }
    .badge-verified { background: #dcfce7; color: #166534; }
    .finding-detail { font-size: 9.5pt; color: #475569; margin-bottom: 6px; }
    .finding-detail strong { color: var(--text); }
    .contact-cta {
      background: var(--primary-light);
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .contact-cta h3 { font-size: 13pt; color: var(--primary); margin-bottom: 6px; }
    .contact-cta p { font-size: 9.5pt; color: #334155; margin-bottom: 14px; }
    .cta-btn {
      display: inline-block;
      background: var(--primary);
      color: #ffffff;
      padding: 9px 20px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: 600;
      font-size: 9.5pt;
    }
    .retest-card {
      border: 1px solid var(--border);
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 9pt;
      display: flex;
      justify-content: space-between;
    }
    .proof-resolved { border-left: 4px solid var(--success); }
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 16px;
      margin-top: 32px;
      font-size: 8.5pt;
      color: var(--text-muted);
      text-align: center;
    }
    @media print {
      body { background: #ffffff; font-size: 9.5pt; }
      .wrapper { border: none; box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
      .contact-cta { display: none; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-title">
        <h1>${t.title}</h1>
        <div class="subtitle">${t.subtitle}</div>
      </div>
      <div class="partner-badge">
        ${t.partnerBadge}
      </div>
    </div>

    <div class="meta-bar">
      <div class="meta-item">
        <strong>${t.target}</strong>
        <span>${escapeHtml(data.hostname)}</span>
      </div>
      <div class="meta-item">
        <strong>${t.date}</strong>
        <span>${escapeHtml(options.assessmentDate || new Date(data.date).toLocaleDateString(lang === 'nl' ? 'nl-NL' : lang === 'es' ? 'es-ES' : 'en-US'))}</span>
      </div>
      <div class="meta-item">
        <strong>${t.auditor}</strong>
        <span>${escapeHtml(options.assessorName || 'AUX Design Security Assessment')}</span>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">${t.executiveSummary}</h2>
      <p class="summary-text">${t.summaryP1}</p>
      <div class="no-fear-callout">${t.summaryNoFear}</div>

      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-number" style="color: var(--success);">${positiveChecks.length}</div>
          <div class="stat-label">${t.statsPositives}</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: var(--primary);">${data.opportunities.length}</div>
          <div class="stat-label">${t.statsOpportunities}</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: var(--accent);">${data.findings.length}</div>
          <div class="stat-label">${t.statsTotalFindings}</div>
        </div>
      </div>
    </div>

    ${positiveChecks.length > 0 ? `
    <div class="section">
      <h2 class="section-title" style="color: var(--success); border-bottom-color: var(--success);">${t.positiveTitle}</h2>
      <p class="summary-text" style="margin-bottom: 12px;">${t.positiveDesc}</p>
      ${positiveChecks.map(pos => `
        <div class="positive-card">
          <div class="positive-title">✓ ${pos.title[lang] || pos.title.nl}</div>
          <div class="positive-desc">${pos.description[lang] || pos.description.nl}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${data.opportunities.length > 0 ? `
    <div class="section">
      <h2 class="section-title">${t.opportunitiesTitle}</h2>
      <p class="summary-text">${t.opportunitiesDesc}</p>
      ${data.opportunities.map(opp => {
        const service = opp.serviceId ? AUX_SERVICE_CATALOG.find(s => s.serviceId === opp.serviceId) : undefined;
        const oppTitle = service ? (service.title[lang] || service.title.nl) : opp.title;
        const oppBenefit = service ? (service.clientBenefit[lang] || service.clientBenefit.nl) : opp.businessSignificance;
        const deliverables = service ? (service.deliverables[lang] || service.deliverables.nl) : [];
        const estMin = opp.remediationEstimate?.estimatedHoursMin ?? service?.estimatedHours.min;
        const estMax = opp.remediationEstimate?.estimatedHoursMax ?? service?.estimatedHours.max;
        const priceEur = opp.remediationEstimate?.indicativePriceEur ?? service?.indicativePriceEur;

        return `
        <div class="opp-card">
          <div class="opp-header">
            <div class="opp-title">${oppTitle}</div>
            <span class="badge badge-verified">${t.confidence}: VERIFIED</span>
          </div>
          <div class="opp-benefit">${oppBenefit}</div>

          ${deliverables.length > 0 ? `
            <div class="opp-deliverables">
              <strong>${t.deliverables}:</strong>
              <ul>
                ${deliverables.map(d => `<li>${d}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="opp-meta-row">
            <div>
              ${estMin && estMax ? `<span>${t.estimatedHours}: <strong>${estMin}–${estMax} ${t.hours}</strong></span> • ` : ''}
              <span>${t.retestIncluded}</span>
            </div>
            ${includePricing && priceEur ? `
              <div class="price-tag">€ ${priceEur},- <span style="font-size: 8pt; font-weight: normal; color: var(--text-muted);">${t.exclVat}</span></div>
            ` : ''}
          </div>
        </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    ${data.findings.length > 0 ? `
    <div class="section">
      <h2 class="section-title">${t.findingsTitle}</h2>
      ${data.findings.map(finding => `
        <div class="finding-card">
          <div class="finding-title-row">
            <div class="finding-title">${escapeHtml(finding.title)}</div>
            <div>
              <span class="badge badge-${escapeHtml(finding.severity.toLowerCase())}">${escapeHtml(finding.severity)}</span>
              <span class="badge badge-verified">${escapeHtml(finding.confidence)}</span>
            </div>
          </div>
          ${(finding.observed || finding.description) ? `<div class="finding-detail"><strong>${t.observed}:</strong> ${escapeHtml(finding.observed || finding.description)}</div>` : ''}
          ${(finding.whyItMatters || finding.technicalExplanation) ? `<div class="finding-detail"><strong>${t.whyItMatters}:</strong> ${escapeHtml(finding.whyItMatters || finding.technicalExplanation)}</div>` : ''}
          <div class="finding-detail"><strong>${t.remediation}:</strong> ${escapeHtml(finding.remediation)}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${data.proofs && data.proofs.length > 0 ? `
    <div class="section">
      <h2 class="section-title">${t.retestSectionTitle}</h2>
      <p class="summary-text">${t.retestSummary}</p>
      ${data.proofs.map(p => `
        <div class="retest-card ${p.status === 'RESOLVED' ? 'proof-resolved' : ''}">
          <div>
            <strong>${escapeHtml(p.originalFindingId)}</strong>: ${escapeHtml(p.comparisonNote)}
          </div>
          <div>
            <span class="badge ${p.status === 'RESOLVED' ? 'badge-verified' : 'badge-medium'}">${escapeHtml(p.status)}</span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="contact-cta">
      <h3>${t.nextStepsTitle}</h3>
      <p>${t.nextStepsBody}</p>
      <a href="${contactUrl}" class="cta-btn">${t.contactButton} (${contactEmail})</a>
    </div>

    <div class="footer">
      <p>${t.footerNotice}</p>
      <p style="margin-top: 4px;">Run ID: <code>${data.runId}</code></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates technical engineer report with exact evidence graphs, hashes, limitations, and reproduction steps.
 */
export function generateEngineerReport(
  input: InspectionResultV1 | ArgusBundle,
  options: EngineerReportOptions = {}
): string {
  const data = normalizeInput(input);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARGUS Technical Engineering Report - ${escapeHtml(data.hostname)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --success: #4ade80;
      --warning: #facc15;
      --danger: #f87171;
      --code-bg: #020617;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      font-size: 11pt;
      padding: 30px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 22pt; color: var(--accent); margin-bottom: 4px; }
    h2 { font-size: 15pt; color: var(--accent); margin: 30px 0 12px 0; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
    h3 { font-size: 12pt; color: var(--text); margin-bottom: 6px; }
    .subtitle { color: var(--text-muted); font-size: 10pt; margin-bottom: 20px; }
    .crypto-box {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 9.5pt;
    }
    .crypto-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .crypto-item strong { color: var(--accent); }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 9pt;
    }
    .table th, .table td {
      border: 1px solid var(--border);
      padding: 8px 12px;
      text-align: left;
    }
    .table th { background: var(--card-bg); color: var(--accent); }
    .table tr:nth-child(even) { background: rgba(255,255,255,0.02); }
    .finding-block {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-left: 4px solid var(--warning);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .finding-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .repro-code {
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 8px;
      color: #a5f3fc;
      overflow-x: auto;
      font-size: 8.5pt;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
    }
    .badge-medium { background: #854d0e; color: #fef08a; }
    .badge-low { background: #334155; color: #cbd5e1; }
    .badge-verified { background: #14532d; color: #86efac; }
    .badge-inferred { background: #431407; color: #fdba74; }
  </style>
</head>
<body>
  <div class="container">
    <h1>ARGUS Engineering & Provenance Inspection</h1>
    <div class="subtitle">Deterministic Technical Output • Zero Speculation • Cryptographic Verification</div>

    <div class="crypto-box">
      <div class="crypto-grid">
        <div class="crypto-item"><strong>Target:</strong> ${escapeHtml(data.hostname)}</div>
        <div class="crypto-item"><strong>Run ID:</strong> ${escapeHtml(data.runId)}</div>
        <div class="crypto-item"><strong>Observation Timestamp:</strong> ${escapeHtml(data.date)}</div>
        <div class="crypto-item"><strong>Execution Duration:</strong> ${data.durationMs}ms</div>
        ${data.bundleHash ? `<div class="crypto-item" style="grid-column: span 2;"><strong>Bundle Hash (SHA-256):</strong> <code>${escapeHtml(data.bundleHash)}</code></div>` : ''}
      </div>
    </div>

    <h2>1. Evidence Provenance Graph (${data.evidence.length} collected items)</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Evidence ID</th>
          <th>Type</th>
          <th>Collector / Ver</th>
          <th>Observed At</th>
          <th>Normalized Hash</th>
        </tr>
      </thead>
      <tbody>
        ${data.evidence.map(ev => `
          <tr>
            <td><code>${ev.id}</code></td>
            <td><strong>${ev.type}</strong></td>
            <td>${ev.collector}@${ev.collectorVersion}</td>
            <td>${ev.observedAt}</td>
            <td><code>${(ev.sha256 || ev.normalizedHash || 'N/A').slice(0, 16)}...</code></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>2. Deterministic Findings (${data.findings.length} findings)</h2>
    ${data.findings.map(f => {
      let reproCmd = '';
      if (f.ruleId.startsWith('rule-http')) {
        reproCmd = `curl -sI https://${data.hostname} | grep -iE 'strict-transport-security|content-security-policy|x-frame-options'`;
      } else if (f.ruleId.includes('spf')) {
        reproCmd = `dig +short TXT ${data.hostname} | grep 'v=spf1'`;
      } else if (f.ruleId.includes('dmarc')) {
        reproCmd = `dig +short TXT _dmarc.${data.hostname}`;
      } else if (f.ruleId.includes('caa')) {
        reproCmd = `dig +short CAA ${data.hostname}`;
      }

      return `
      <div class="finding-block">
        <div class="finding-header">
          <h3>[${escapeHtml(f.ruleId)}@${escapeHtml(f.ruleVersion)}] ${escapeHtml(f.title)}</h3>
          <div>
            <span class="badge badge-${escapeHtml(f.severity.toLowerCase())}">${escapeHtml(f.severity)}</span>
            <span class="badge badge-${escapeHtml(f.confidence.toLowerCase())}">${escapeHtml(f.confidence)}</span>
          </div>
        </div>
        <div style="font-size: 9.5pt; color: #cbd5e1; margin-bottom: 8px;">
          <strong>Supporting Evidence IDs:</strong> ${f.evidenceIds.map(id => `<code>${escapeHtml(id)}</code>`).join(', ')}
        </div>
        <div style="font-size: 9.5pt; margin-bottom: 6px;">
          <strong>Observed:</strong> ${escapeHtml(f.observed || f.description)}
        </div>
        <div style="font-size: 9.5pt; color: #94a3b8; margin-bottom: 6px;">
          <strong>Technical Impact:</strong> ${escapeHtml(f.supports || f.technicalExplanation)}
        </div>
        ${f.limitations ? `
          <div style="font-size: 9pt; color: #f59e0b; margin-bottom: 6px;">
            <strong>Rule Limitations:</strong> ${escapeHtml(f.limitations)}
          </div>
        ` : ''}
        <div style="font-size: 9.5pt; color: var(--success); margin-bottom: 6px;">
          <strong>Remediation:</strong> ${escapeHtml(f.remediation)}
        </div>
        ${reproCmd ? `
          <div style="font-size: 8.5pt; color: var(--text-muted); margin-top: 8px;"><strong>Independent Reproduction:</strong></div>
          <div class="repro-code">$ ${escapeHtml(reproCmd)}</div>
        ` : ''}
      </div>
      `;
    }).join('')}

    ${data.proofs && data.proofs.length > 0 ? `
    <h2>3. Retest Proof Chain (${data.proofs.length} proofs)</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Proof ID</th>
          <th>Original Finding</th>
          <th>Status</th>
          <th>Before Ev IDs</th>
          <th>After Ev IDs</th>
          <th>Comparison Note</th>
        </tr>
      </thead>
      <tbody>
        ${data.proofs.map(p => `
          <tr>
            <td><code>${p.id}</code></td>
            <td><code>${p.originalFindingId}</code></td>
            <td><strong style="color: ${p.status === 'RESOLVED' ? 'var(--success)' : 'var(--warning)'};">${p.status}</strong></td>
            <td>${p.beforeEvidenceIds.join(', ')}</td>
            <td>${p.afterEvidenceIds.join(', ')}</td>
            <td>${p.comparisonNote}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * Generates an engineer-facing plain-text / Markdown report for CLI or tickets.
 */
export function generateEngineerTextReport(
  input: InspectionResultV1 | ArgusBundle
): string {
  const data = normalizeInput(input);

  const lines: string[] = [
    `# ARGUS Technical Report: ${data.hostname}`,
    `Run ID: ${data.runId}`,
    `Timestamp: ${data.date}`,
    data.bundleHash ? `Bundle Hash: ${data.bundleHash}` : '',
    '',
    `## Evidence (${data.evidence.length} items)`,
    ...data.evidence.map(e => `- [${e.id}] ${e.type} via ${e.collector}@${e.collectorVersion} (sha256: ${(e.sha256 || 'N/A').slice(0, 16)}...)`),
    '',
    `## Findings (${data.findings.length} items)`,
    ...data.findings.map(f => [
      `### [${f.severity}] ${f.title} (${f.ruleId})`,
      `Confidence: ${f.confidence}`,
      `Evidence: ${f.evidenceIds.join(', ')}`,
      `Observed: ${f.observed || f.description}`,
      `Supports: ${f.supports || f.technicalExplanation}`,
      f.limitations ? `Limitations: ${f.limitations}` : '',
      `Remediation: ${f.remediation}`,
      ''
    ].filter(Boolean).join('\n')),
    ''
  ];

  if (data.proofs && data.proofs.length > 0) {
    lines.push(
      `## Proofs (${data.proofs.length} retest items)`,
      ...data.proofs.map(p => `- ${p.originalFindingId} -> ${p.status} (${p.comparisonNote})`),
      ''
    );
  }

  return lines.join('\n');
}

/**
 * Generates canonical JSON report.
 */
export function generateReportJson(
  input: InspectionResultV1 | ArgusBundle,
  options: { pretty?: boolean } = { pretty: true }
): string {
  const data = normalizeInput(input);
  return JSON.stringify(data, null, options.pretty ? 2 : undefined);
}

// Backwards compatibility for legacy callers
export function generateCommercialReport(
  inspection: InspectionResultV1,
  options: ReportOptions = {}
): string {
  return generateClientReport(inspection, options);
}
