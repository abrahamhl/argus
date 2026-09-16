import test from 'node:test';
import assert from 'node:assert';
import { exportBundle, createBundle } from './bundle.js';
import { verifyEvidence } from './crypto.js';

test('exportBundle strips rawValue and removes secrets', () => {
  const result = {
    target: { input: 'http://example.com', normalized: 'http://example.com', hostname: 'example.com', policyMode: 'PUBLIC_PASSIVE' },
    runId: 'r-1',
    status: { startedAt: '2023-01-01', durationMs: 100 },
    observations: [],
    findings: [],
    opportunities: [],
    evidence: [{
      id: 'e-1',
      type: 'HTTP',
      source: 'http',
      collector: 'test',
      collectorVersion: '1.0',
      observedAt: '2023-01-01',
      rawValue: {
        headers: { 'authorization': 'Bearer secret123', 'content-type': 'text/plain' },
        body: 'sensitive data'
      },
      normalizedValue: {
        headers: { 'authorization': 'Bearer secret123', 'content-type': 'text/plain' }
      },
      sha256: 'dummy'
    }]
  };

  const bundle = createBundle(result);
  const exported = exportBundle(bundle);

  assert.strictEqual(exported.evidence[0].rawValue, undefined);
  assert.strictEqual((exported.evidence[0].normalizedValue as any).headers['authorization'], '[REDACTED]');
  assert.strictEqual((exported.evidence[0].normalizedValue as any).headers['content-type'], 'text/plain');
  
  // The hash should be valid for the redacted evidence
  assert.strictEqual(verifyEvidence(exported.evidence[0]), true);
});
