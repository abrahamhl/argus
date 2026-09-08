import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { inspectPublicTarget } from './inspector.js';

test('inspectPublicTarget rejects localhost', async () => {
  await assert.rejects(
    async () => {
      await inspectPublicTarget('http://localhost/');
    },
    /validation failed.*localhost/i,
    'Should reject localhost'
  );
});

test('inspectPublicTarget rejects private IPs', async () => {
  await assert.rejects(
    async () => {
      await inspectPublicTarget('http://192.168.1.1/');
    },
    /validation failed/i,
    'Should reject private IP'
  );
});

test('inspectPublicTarget rejects URL credentials', async () => {
  await assert.rejects(
    async () => {
      await inspectPublicTarget('http://user:pass@example.com/');
    },
    /validation failed.*credential/i,
    'Should reject URL with credentials'
  );
});

test('inspectPublicTarget produces structured result', async () => {
  // Use example.com as a stable test target
  const result = await inspectPublicTarget('http://example.com/', {
    collectHttp: false, // Skip HTTP to avoid network dependency
    collectDns: true
  });

  assert.ok(result.target);
  assert.equal(result.target, 'http://example.com/');

  assert.ok(result.policy);
  assert.equal(result.policy.mode, 'PUBLIC_PASSIVE');

  assert.ok(Array.isArray(result.observations));
  assert.ok(Array.isArray(result.evidence));
  assert.ok(Array.isArray(result.findings));
  assert.ok(Array.isArray(result.opportunities));

  assert.ok(result.timestamps.started);
  assert.ok(result.timestamps.completed);

  assert.ok(result.run);
  assert.ok(result.run.id);
  assert.equal(result.run.status, 'COMPLETED');
});

test('inspectPublicTarget converts observations to evidence', async () => {
  const result = await inspectPublicTarget('http://example.com/', {
    collectHttp: false,
    collectDns: true
  });

  assert.ok(result.observations.length > 0, 'Should have observations');
  assert.ok(result.evidence.length > 0, 'Should have evidence');
  assert.equal(result.observations.length, result.evidence.length, 'Each observation should produce evidence');

  result.evidence.forEach(evd => {
    assert.ok(evd.id.startsWith('evd_'), 'Evidence ID should have correct prefix');
    assert.ok(evd.sha256, 'Evidence should have SHA256 hash');
    assert.equal(evd.confidence, 'VERIFIED');
  });
});

test('inspectPublicTarget enforces PASSIVE_ONLY for sensitive categories', async () => {
  const result = await inspectPublicTarget('http://example.com/', {
    mode: 'PUBLIC_PASSIVE',
    sensitiveCategory: 'GOVERNMENT',
    collectHttp: false,
    collectDns: false
  });

  assert.equal(result.policy.mode, 'PASSIVE_ONLY');
  assert.equal(result.policy.sensitiveCategory, 'GOVERNMENT');
});

test('inspectPublicTarget generates unique run and target IDs', async () => {
  const result1 = await inspectPublicTarget('http://example.com/', {
    collectHttp: false,
    collectDns: false
  });

  const result2 = await inspectPublicTarget('http://example.org/', {
    collectHttp: false,
    collectDns: false
  });

  assert.notEqual(result1.run.id, result2.run.id, 'Run IDs should be unique');

  // Same target should produce same target ID (deterministic)
  const result3 = await inspectPublicTarget('http://example.com/', {
    collectHttp: false,
    collectDns: false
  });

  assert.equal(result1.run.targetId, result3.run.targetId, 'Same target should produce same target ID');
});

test('inspectPublicTarget includes ARGUS version and OS', async () => {
  const result = await inspectPublicTarget('http://example.com/', {
    collectHttp: false,
    collectDns: false
  });

  assert.equal(result.run.argusVersion, '0.1.0');
  assert.ok(result.run.os);
  assert.ok(['win32', 'linux', 'darwin'].includes(result.run.os));
});
