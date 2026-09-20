import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { ArgusBundle, Finding, Evidence } from '@argus/schema';
import { compareRuns } from './retest.js';

function createBundleWithFindings(
  runId: string,
  hostname: string,
  findings: Partial<Finding>[],
  evidence: Partial<Evidence>[]
): ArgusBundle {
  return {
    schemaVersion: '1.0.0',
    argusVersion: '0.1.0',
    os: 'win32',
    runtime: 'Node.js',
    collectorVersions: { http: '0.1.0', dns: '0.1.0' },
    policyManifest: { mode: 'PUBLIC_POSTURE' },
    target: { input: `https://${hostname}`, normalized: `https://${hostname}`, hostname },
    run: { id: runId, timestamp: '2026-09-20T10:00:00.000Z', durationMs: 100 },
    observations: [],
    evidence: evidence.map((e, idx) => ({
      id: e.id || `evd_${idx}`,
      targetId: hostname,
      runId,
      type: e.type || 'HTTP_RESPONSE',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: '2026-09-20T10:00:00.000Z',
      rawValue: {},
      normalizedValue: {},
      confidence: 'VERIFIED',
      sha256: 'sha-placeholder',
      ...e
    })) as Evidence[],
    findings: findings.map((f, idx) => ({
      id: f.id || `fnd_${idx}`,
      findingId: f.findingId || `fnd_${idx}`,
      ruleId: f.ruleId || 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: hostname,
      targetId: hostname,
      runId,
      title: f.title || 'Finding',
      description: f.description || 'Description',
      technicalExplanation: 'Explanation',
      remediation: 'Remediation',
      severity: f.severity || 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: f.evidenceIds || [`evd_${idx}`],
      ...f
    })) as Finding[],
    opportunities: [],
    proofs: [],
    bundleHash: 'bundle-hash'
  };
}

test('compareRuns: throws error when target hostnames do not match', () => {
  const b1 = createBundleWithFindings('r1', 'alpha.nl', [], []);
  const b2 = createBundleWithFindings('r2', 'beta.nl', [], []);
  assert.throws(() => compareRuns(b1, b2), /Target mismatch/);
});

test('compareRuns: generates RESOLVED proof when finding is gone and collector ran', () => {
  const baseline = createBundleWithFindings(
    'run_base',
    'example.nl',
    [{ id: 'f_hsts', ruleId: 'rule-http-missing-hsts', severity: 'MEDIUM', evidenceIds: ['ev_base_1'] }],
    [{ id: 'ev_base_1', type: 'HTTP_RESPONSE' }]
  );

  const retest = createBundleWithFindings(
    'run_retest',
    'example.nl',
    [], // Finding resolved!
    [{ id: 'ev_retest_1', type: 'HTTP_RESPONSE' }] // Relevant collector ran
  );

  const proofs = compareRuns(baseline, retest);
  assert.equal(proofs.length, 1);
  assert.equal(proofs[0].status, 'RESOLVED');
  assert.equal(proofs[0].originalFindingId, 'f_hsts');
  assert.deepEqual(proofs[0].beforeEvidenceIds, ['ev_base_1']);
  assert.deepEqual(proofs[0].afterEvidenceIds, ['ev_retest_1']);
  assert.ok(proofs[0].comparisonNote?.includes('was not detected in the retest'));
});

test('compareRuns: generates UNVERIFIED proof when finding is absent but no collector evidence exists', () => {
  const baseline = createBundleWithFindings(
    'run_base',
    'example.nl',
    [{ id: 'f_hsts', ruleId: 'rule-http-missing-hsts', severity: 'MEDIUM', evidenceIds: ['ev_base_1'] }],
    [{ id: 'ev_base_1', type: 'HTTP_RESPONSE' }]
  );

  const retest = createBundleWithFindings(
    'run_retest',
    'example.nl',
    [], // Finding absent
    []  // But no collector evidence collected!
  );

  const proofs = compareRuns(baseline, retest);
  assert.equal(proofs.length, 1);
  assert.equal(proofs[0].status, 'UNVERIFIED');
});

test('compareRuns: generates UNCHANGED proof when finding persists with same severity', () => {
  const baseline = createBundleWithFindings(
    'run_base',
    'example.nl',
    [{ id: 'f_spf', ruleId: 'rule-dns-missing-spf', severity: 'MEDIUM', evidenceIds: ['ev_dns_1'] }],
    [{ id: 'ev_dns_1', type: 'DNS_TXT' }]
  );

  const retest = createBundleWithFindings(
    'run_retest',
    'example.nl',
    [{ id: 'f_spf_2', ruleId: 'rule-dns-missing-spf', severity: 'MEDIUM', evidenceIds: ['ev_dns_2'] }],
    [{ id: 'ev_dns_2', type: 'DNS_TXT' }]
  );

  const proofs = compareRuns(baseline, retest);
  assert.equal(proofs.length, 1);
  assert.equal(proofs[0].status, 'UNCHANGED');
  assert.deepEqual(proofs[0].beforeEvidenceIds, ['ev_dns_1']);
  assert.deepEqual(proofs[0].afterEvidenceIds, ['ev_dns_2']);
});

test('compareRuns: generates IMPROVED proof when severity drops', () => {
  const baseline = createBundleWithFindings(
    'run_base',
    'example.nl',
    [{ id: 'f_vuln', ruleId: 'rule-http-missing-csp', severity: 'HIGH', evidenceIds: ['ev_1'] }],
    [{ id: 'ev_1', type: 'HTTP_RESPONSE' }]
  );

  const retest = createBundleWithFindings(
    'run_retest',
    'example.nl',
    [{ id: 'f_vuln_2', ruleId: 'rule-http-missing-csp', severity: 'LOW', evidenceIds: ['ev_2'] }],
    [{ id: 'ev_2', type: 'HTTP_RESPONSE' }]
  );

  const proofs = compareRuns(baseline, retest);
  assert.equal(proofs.length, 1);
  assert.equal(proofs[0].status, 'IMPROVED');
  assert.ok(proofs[0].comparisonNote?.includes('decreased from HIGH to LOW'));
});

test('compareRuns: generates REGRESSED proof when severity worsens', () => {
  const baseline = createBundleWithFindings(
    'run_base',
    'example.nl',
    [{ id: 'f_spf', ruleId: 'rule-dns-weak-spf', severity: 'LOW', evidenceIds: ['ev_1'] }],
    [{ id: 'ev_1', type: 'DNS_TXT' }]
  );

  const retest = createBundleWithFindings(
    'run_retest',
    'example.nl',
    [{ id: 'f_spf_worse', ruleId: 'rule-dns-weak-spf', severity: 'HIGH', evidenceIds: ['ev_2'] }],
    [{ id: 'ev_2', type: 'DNS_TXT' }]
  );

  const proofs = compareRuns(baseline, retest);
  assert.equal(proofs.length, 1);
  assert.equal(proofs[0].status, 'REGRESSED');
  assert.ok(proofs[0].comparisonNote?.includes('worsened from LOW to HIGH'));
});
