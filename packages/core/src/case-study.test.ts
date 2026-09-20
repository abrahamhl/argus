import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { ArgusBundle } from '@argus/schema';
import { generateCaseStudyMarkdown } from './case-study.js';

function createDummyBundle(runId: string, timestamp: string, resolved: boolean): ArgusBundle {
  return {
    schemaVersion: '1.0.0',
    argusVersion: '0.1.0',
    os: 'win32',
    runtime: 'Node.js',
    collectorVersions: { http: '0.1.0', dns: '0.1.0' },
    policyManifest: { mode: 'PUBLIC_POSTURE' },
    target: { input: 'https://bakkerij-jansen.nl', normalized: 'https://bakkerij-jansen.nl', hostname: 'bakkerij-jansen.nl' },
    run: { id: runId, timestamp, durationMs: 100 },
    observations: [],
    evidence: [
      {
        id: `evd_${runId}`,
        targetId: 'bakkerij-jansen.nl',
        runId,
        type: 'HTTP_RESPONSE',
        source: 'http',
        collector: 'argus-http-collector',
        collectorVersion: '0.1.0',
        observedAt: timestamp,
        rawValue: {},
        normalizedValue: {},
        confidence: 'VERIFIED',
        sha256: 'sha-dummy'
      }
    ],
    findings: resolved ? [] : [
      {
        id: 'f_hsts_1',
        findingId: 'f_hsts_1',
        ruleId: 'rule-http-missing-hsts',
        ruleVersion: '1.0.0',
        target: 'bakkerij-jansen.nl',
        targetId: 'bakkerij-jansen.nl',
        runId,
        title: 'Missing HSTS Header',
        description: 'No Strict-Transport-Security header configured.',
        technicalExplanation: 'HSTS mandates HTTPS.',
        remediation: 'Enable HSTS.',
        severity: 'MEDIUM',
        confidence: 'VERIFIED',
        evidenceIds: [`evd_${runId}`],
        observed: 'No HSTS header present'
      }
    ],
    opportunities: [],
    proofs: [],
    bundleHash: 'dummy-bundle-hash'
  };
}

test('generateCaseStudyMarkdown: generates Dutch case study with Before/After proof', () => {
  const baseline = createDummyBundle('run_base', '2026-09-01T10:00:00.000Z', false);
  const retest = createDummyBundle('run_retest', '2026-09-15T14:00:00.000Z', true);

  const md = generateCaseStudyMarkdown(baseline, retest, {
    clientName: 'Bakkerij Jansen B.V.',
    language: 'nl'
  });

  assert.ok(md.includes('# Casestudy: Beveiligings- & Reputatieverharding voor Bakkerij Jansen B.V.'));
  assert.ok(md.includes('Uitgangssituatie & Nulmeting (OBSERVE)'));
  assert.ok(md.includes('Missing HSTS Header'));
  assert.ok(md.includes('Plan van Aanpak & Remediatie (DECIDE → FIX)'));
  assert.ok(md.includes('Onafhankelijke Retest & Cryptografisch Bewijs (VERIFY)'));
  assert.ok(md.includes('RESOLVED'));
  assert.ok(md.includes('AUX Design'));
});

test('generateCaseStudyMarkdown: generates English case study', () => {
  const baseline = createDummyBundle('run_base', '2026-09-01T10:00:00.000Z', false);
  const retest = createDummyBundle('run_retest', '2026-09-15T14:00:00.000Z', true);

  const md = generateCaseStudyMarkdown(baseline, retest, {
    clientName: 'Jansen Logistics',
    language: 'en'
  });

  assert.ok(md.includes('# Case Study: Security & Reputation Hardening for Jansen Logistics'));
  assert.ok(md.includes('Initial Assessment (OBSERVE)'));
  assert.ok(md.includes('Remediation Strategy (DECIDE → FIX)'));
  assert.ok(md.includes('Retest & Cryptographic Verification (VERIFY)'));
  assert.ok(md.includes('RESOLVED'));
});
