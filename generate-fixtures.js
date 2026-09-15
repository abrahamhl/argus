import { createBundle, saveBundle, hashValue } from './packages/core/dist/index.js';
import * as fs from 'fs';

const BASE = {
  runId: 'run_mock_offline',
  status: { startedAt: new Date().toISOString(), durationMs: 100 },
  target: { input: 'http://example.com', normalized: 'http://example.com/', hostname: 'example.com', policyMode: 'STRICT', sensitiveCategory: 'STANDARD' }
};

const brokenEv = [
  {
    id: 'evd_1', targetId: 'target_1', runId: 'run_mock_offline', type: 'HTTP_RESPONSE',
    source: 'example.com', collector: 'http', collectorVersion: '0.1.0', observedAt: new Date().toISOString(),
    rawValue: { status: 200, url: 'http://example.com/', redirected: false, headers: {} },
    normalizedValue: { status: 200, url: 'http://example.com/', redirected: false, headers: {} },
    confidence: 'VERIFIED', sha256: ''
  }
];
brokenEv[0].sha256 = hashValue(brokenEv[0].rawValue);

const healthyEv = [
  {
    id: 'evd_2', targetId: 'target_1', runId: 'run_mock_offline', type: 'HTTP_RESPONSE',
    source: 'example.com', collector: 'http', collectorVersion: '0.1.0', observedAt: new Date().toISOString(),
    rawValue: {
      status: 200, url: 'https://example.com/', redirected: false, headers: {
        'strict-transport-security': 'max-age=31536000',
        'content-security-policy': "default-src 'self'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-frame-options': 'DENY'
      }
    },
    normalizedValue: {
      status: 200, url: 'https://localhost/', redirected: false, headers: {
        'strict-transport-security': 'max-age=31536000',
        'content-security-policy': "default-src 'self'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-frame-options': 'DENY'
      }
    },
    confidence: 'VERIFIED', sha256: ''
  }
];
healthyEv[0].sha256 = hashValue(healthyEv[0].rawValue);

const brokenFindings = [
  {
    id: 'finding_1', findingId: 'finding_1', ruleId: 'rule-http-missing-hsts', ruleVersion: '1.0.0',
    target: 'example.com', targetId: 'target_1', runId: 'run_mock_offline',
    title: 'Missing HSTS Header', description: 'desc', technicalExplanation: 'tech', remediation: 'fix',
    severity: 'MEDIUM', confidence: 'VERIFIED', evidenceIds: ['evd_1']
  }
];

const bBundle = createBundle({ ...BASE, observations: [], evidence: brokenEv, findings: brokenFindings, opportunities: [] });
const hBundle = createBundle({ ...BASE, observations: [], evidence: healthyEv, findings: [], opportunities: [] });

if (!fs.existsSync('fixtures/demo')) fs.mkdirSync('fixtures/demo', { recursive: true });
saveBundle(bBundle, 'fixtures/demo/broken.argusbundle');
saveBundle(hBundle, 'fixtures/demo/healthy.argusbundle');
console.log('Fixtures generated.');
