import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { InspectionResultV1, ArgusBundle, Finding, Opportunity, Evidence } from '@argus/schema';
import {
  generateClientReport,
  generateEngineerReport,
  generateEngineerTextReport,
  generateReportJson,
  generateCommercialReport
} from './report-generator.js';

function createMockData(): InspectionResultV1 {
  const evidence: Evidence[] = [
    {
      id: 'evd_http_1',
      targetId: 'tgt_1',
      runId: 'run_1',
      type: 'HTTP_RESPONSE',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: '2026-09-20T10:00:00.000Z',
      rawValue: { status: 200, url: 'https://example-business.nl' },
      normalizedValue: { status: 200, url: 'https://example-business.nl' },
      confidence: 'VERIFIED',
      sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
    },
    {
      id: 'evd_dns_1',
      targetId: 'tgt_1',
      runId: 'run_1',
      type: 'DNS_TXT',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: '2026-09-20T10:00:00.000Z',
      rawValue: { raw: ['v=spf1 include:_spf.example.nl ~all'] },
      normalizedValue: { raw: ['v=spf1 include:_spf.example.nl ~all'] },
      confidence: 'VERIFIED',
      sha256: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01'
    }
  ];

  const findings: Finding[] = [
    {
      id: 'fnd_1',
      findingId: 'fnd_1',
      ruleId: 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: 'example-business.nl',
      targetId: 'tgt_1',
      runId: 'run_1',
      title: 'Missing HSTS Header',
      description: 'Strict-Transport-Security header is not set.',
      technicalExplanation: 'HSTS mandates HTTPS connections for visitors.',
      remediation: 'Configure Strict-Transport-Security header.',
      severity: 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: ['evd_http_1'],
      observed: 'No Strict-Transport-Security header in HTTPS response.',
      whyItMatters: 'Visitors could be vulnerable to downgrade attacks.',
      limitations: 'Checked over external network connection.'
    }
  ];

  const opportunities: Opportunity[] = [
    {
      id: 'opp_1',
      serviceId: 'AUX-SEC-WEB-HARDENING',
      title: 'Website Beveiligingsverharding (HTTP & Headers)',
      supportingFindingIds: ['fnd_1'],
      confidence: 'VERIFIED',
      technicalSignificance: '1 security header missing',
      businessSignificance: 'Protects customers against downgrade attacks.',
      businessArea: 'Customer Trust',
      technicalArea: 'HTTP Headers',
      serviceCategory: 'SECURITY_HARDENING',
      retestAvailable: true,
      needsClientAccess: true,
      estimatedComplexity: 'LOW',
      clientExplanationKey: 'security.headers.missing',
      remediationEstimate: {
        estimatedHoursMin: 2,
        estimatedHoursMax: 4,
        indicativePriceEur: 350
      }
    }
  ];

  return {
    schemaVersion: '1.0.0',
    runId: 'run_test_123',
    target: {
      input: 'https://example-business.nl',
      normalized: 'https://example-business.nl',
      hostname: 'example-business.nl',
      policyMode: 'PUBLIC_POSTURE'
    },
    status: {
      state: 'COMPLETED',
      startedAt: '2026-09-20T10:00:00.000Z',
      completedAt: '2026-09-20T10:00:01.250Z',
      durationMs: 1250
    },
    observations: [],
    evidence,
    findings,
    opportunities,
    collectorSummary: [],
    warnings: [],
    errors: [],
    dataMode: 'FIXTURE'
  };
}

test('generateClientReport outputs valid Dutch-first HTML', () => {
  const mock = createMockData();
  const html = generateClientReport(mock, { language: 'nl' });

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('lang="nl"'));
  assert.ok(html.includes('Website Beveiligings- & Kansenrapport'));
  assert.ok(html.includes('Managementsamenvatting'));
  assert.ok(html.includes('example-business.nl'));
  assert.ok(html.includes('AUX Design'));
  assert.ok(html.includes('€ 350,-'));
  assert.ok(html.includes('2–4 uur'));
  // Zero-fear check
  assert.ok(!html.includes('CVSS'));
  assert.ok(!html.includes('GDPR fine'));
  assert.ok(html.includes('zero-fear'));
});

test('generateClientReport supports English and Spanish translations', () => {
  const mock = createMockData();
  const enHtml = generateClientReport(mock, { language: 'en' });
  assert.ok(enHtml.includes('lang="en"'));
  assert.ok(enHtml.includes('Website Security & Opportunity Report'));
  assert.ok(enHtml.includes('Executive Summary'));

  const esHtml = generateClientReport(mock, { language: 'es' });
  assert.ok(esHtml.includes('lang="es"'));
  assert.ok(esHtml.includes('Informe de Seguridad Web y Oportunidades'));
  assert.ok(esHtml.includes('Resumen Ejecutivo'));
});

test('generateEngineerReport outputs cryptographic details and repro command', () => {
  const mock = createMockData();
  const html = generateEngineerReport(mock);

  assert.ok(html.includes('ARGUS Engineering & Provenance Inspection'));
  assert.ok(html.includes('a1b2c3d4e5f67890'));
  assert.ok(html.includes('evd_http_1'));
  assert.ok(html.includes('curl -sI https://example-business.nl'));
  assert.ok(html.includes('Rule Limitations:'));
});

test('generateEngineerTextReport outputs markdown formatted summary', () => {
  const mock = createMockData();
  const txt = generateEngineerTextReport(mock);

  assert.ok(txt.includes('# ARGUS Technical Report: example-business.nl'));
  assert.ok(txt.includes('## Evidence (2 items)'));
  assert.ok(txt.includes('## Findings (1 items)'));
  assert.ok(txt.includes('rule-http-missing-hsts'));
});

test('generateReportJson outputs valid parseable JSON', () => {
  const mock = createMockData();
  const jsonStr = generateReportJson(mock);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.hostname, 'example-business.nl');
  assert.equal(parsed.runId, 'run_test_123');
  assert.equal(parsed.findings.length, 1);
  assert.equal(parsed.opportunities.length, 1);
});

test('generateCommercialReport backwards compatibility alias works', () => {
  const mock = createMockData();
  const legacyHtml = generateCommercialReport(mock);
  assert.ok(legacyHtml.includes('<!DOCTYPE html>'));
  assert.ok(legacyHtml.includes('example-business.nl'));
});
