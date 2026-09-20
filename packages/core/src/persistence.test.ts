import { test, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ArgusBundle } from '@argus/schema';
import {
  saveRunData,
  loadRunData,
  listRuns,
  listRunsForTarget,
  getLatestRunForTarget,
  deleteRun,
  exportRunBundle
} from './persistence.js';
import { hashValue } from './crypto.js';

let testDir: string;

before(() => {
  testDir = mkdtempSync(join(tmpdir(), 'argus-persistence-test-'));
});

after(() => {
  if (testDir && existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

function createSampleBundle(runId: string, hostname: string, timestamp: string): ArgusBundle {
  const rawValue = { status: 200 };
  return {
    schemaVersion: '1.0.0',
    argusVersion: '0.1.0',
    os: 'win32',
    runtime: 'Node.js',
    collectorVersions: { http: '0.1.0', dns: '0.1.0' },
    policyManifest: { mode: 'PUBLIC_POSTURE' },
    target: { input: `https://${hostname}`, normalized: `https://${hostname}`, hostname },
    run: { id: runId, timestamp, durationMs: 500 },
    observations: [],
    evidence: [
      {
        id: `evd_${runId}`,
        targetId: `tgt_${hostname}`,
        runId,
        type: 'HTTP_RESPONSE',
        source: 'http',
        collector: 'argus-http-collector',
        collectorVersion: '0.1.0',
        observedAt: timestamp,
        rawValue,
        normalizedValue: rawValue,
        confidence: 'VERIFIED',
        sha256: hashValue(rawValue)
      }
    ],
    findings: [],
    opportunities: [],
    proofs: [],
    bundleHash: ''
  };
}

test('persistence: saves run data and generates pre-rendered reports', async () => {
  const bundle = createSampleBundle('run_persist_01', 'bakkerij-jansen.nl', '2026-09-20T10:00:00.000Z');
  const result = await saveRunData(bundle, testDir);

  assert.equal(result.runId, 'run_persist_01');
  assert.ok(existsSync(join(result.runPath, 'bundle.json')));
  assert.ok(existsSync(join(result.runPath, 'report-client.html')));
  assert.ok(existsSync(join(result.runPath, 'report-engineer.html')));
  assert.ok(existsSync(join(result.runPath, 'report.json')));

  const clientHtml = readFileSync(join(result.runPath, 'report-client.html'), 'utf-8');
  assert.ok(clientHtml.includes('bakkerij-jansen.nl'));
  assert.ok(clientHtml.includes('Website Beveiligings- & Kansenrapport'));
});

test('persistence: loads saved bundle with verified integrity', async () => {
  const loaded = await loadRunData('run_persist_01', testDir);
  assert.equal(loaded.run.id, 'run_persist_01');
  assert.equal(loaded.target.hostname, 'bakkerij-jansen.nl');
  assert.ok(loaded.bundleHash);
});

test('persistence: lists runs and target-specific runs', async () => {
  const bundle2 = createSampleBundle('run_persist_02', 'bakkerij-jansen.nl', '2026-09-20T11:00:00.000Z');
  const bundle3 = createSampleBundle('run_persist_03', 'other-target.nl', '2026-09-20T12:00:00.000Z');

  await saveRunData(bundle2, testDir);
  await saveRunData(bundle3, testDir);

  const all = await listRuns(testDir);
  assert.equal(all.length, 3);

  const forBakkerij = await listRunsForTarget('bakkerij-jansen.nl', testDir);
  assert.equal(forBakkerij.length, 2);

  const latest = await getLatestRunForTarget('bakkerij-jansen.nl', testDir);
  assert.ok(latest);
  assert.equal(latest.run.id, 'run_persist_02'); // More recent timestamp
});

test('persistence: rejects directory traversal in IDs', async () => {
  await assert.rejects(async () => {
    await loadRunData('../../../etc/passwd', testDir);
  });
});

test('persistence: exports bundle to external file', async () => {
  const exportPath = join(testDir, 'exported.argusbundle');
  await exportRunBundle('run_persist_01', exportPath, testDir);

  assert.ok(existsSync(exportPath));
  const exportedJson = JSON.parse(readFileSync(exportPath, 'utf-8'));
  assert.equal(exportedJson.run.id, 'run_persist_01');
});

test('persistence: deletes run and updates index', async () => {
  const deleted = await deleteRun('run_persist_03', testDir);
  assert.equal(deleted, true);

  const allAfter = await listRuns(testDir);
  assert.equal(allAfter.length, 2);
  assert.ok(!allAfter.some(r => r.runId === 'run_persist_03'));

  await assert.rejects(async () => {
    await loadRunData('run_persist_03', testDir);
  });
});
