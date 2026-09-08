import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { collectDns } from './dns.js';

test('DNS collector handles non-existent domain', async () => {
  const domain = 'this-domain-absolutely-does-not-exist-12345.invalid';
  const observations = await collectDns(domain, 'test-run', 'test-target');

  assert.ok(observations.length > 0, 'Should produce observations even for errors');

  // All observations should be errors
  observations.forEach(obs => {
    assert.ok(obs.type.includes('ERROR'), `Observation ${obs.type} should be an error type`);
  });
});

test('DNS collector collects multiple record types', async () => {
  // Use example.com which should have stable DNS records
  const domain = 'example.com';
  const observations = await collectDns(domain, 'test-run', 'test-target', {
    recordTypes: ['A', 'AAAA', 'TXT']
  });

  const types = observations.map(obs => obs.type.replace('DNS_', '').replace('_ERROR', ''));
  assert.ok(types.includes('A'), 'Should attempt A record lookup');
  assert.ok(types.includes('AAAA'), 'Should attempt AAAA record lookup');
  assert.ok(types.includes('TXT'), 'Should attempt TXT record lookup');
});

test('DNS collector extracts SPF from TXT records', async () => {
  // Use a domain that likely has SPF
  const domain = 'example.com';
  const observations = await collectDns(domain, 'test-run', 'test-target', {
    recordTypes: ['SPF']
  });

  const spfObs = observations.find(obs => obs.type === 'DNS_SPF' || obs.type === 'DNS_SPF_ERROR');
  assert.ok(spfObs, 'Should have SPF observation');
});

test('DNS collector handles DMARC records', async () => {
  // Use a domain that likely has DMARC
  const domain = 'example.com';
  const observations = await collectDns(domain, 'test-run', 'test-target', {
    recordTypes: ['DMARC']
  });

  const dmarcObs = observations.find(obs => obs.type === 'DNS_DMARC' || obs.type === 'DNS_DMARC_ERROR');
  assert.ok(dmarcObs, 'Should have DMARC observation');
});

test('DNS collector produces deterministic observation IDs', async () => {
  const domain = 'example.com';
  const observations = await collectDns(domain, 'test-run', 'test-target');

  const ids = observations.map(obs => obs.id);
  const uniqueIds = new Set(ids);

  assert.equal(ids.length, uniqueIds.size, 'All observation IDs should be unique');

  observations.forEach(obs => {
    assert.ok(obs.id.startsWith('obs_dns_'), 'Observation ID should have correct prefix');
    assert.equal(obs.collector, 'argus-dns-collector');
    assert.equal(obs.collectorVersion, '0.1.0');
  });
});

test('DNS collector uses correct runId and targetId', async () => {
  const domain = 'example.com';
  const runId = 'test-run-123';
  const targetId = 'test-target-456';

  const observations = await collectDns(domain, runId, targetId);

  observations.forEach(obs => {
    assert.equal(obs.runId, runId);
    assert.equal(obs.targetId, targetId);
  });
});

test('DNS collector respects record type filter', async () => {
  const domain = 'example.com';
  const observations = await collectDns(domain, 'test-run', 'test-target', {
    recordTypes: ['A', 'AAAA']
  });

  const types = observations.map(obs => obs.type.replace('DNS_', '').replace('_ERROR', ''));
  const uniqueTypes = new Set(types);

  assert.ok(uniqueTypes.has('A'));
  assert.ok(uniqueTypes.has('AAAA'));
  assert.ok(!uniqueTypes.has('MX'), 'Should not collect MX when not requested');
  assert.ok(!uniqueTypes.has('TXT'), 'Should not collect TXT when not requested');
});
