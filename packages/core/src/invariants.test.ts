import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createImmutableEvidence,
  verifyEvidenceImmutability,
  validateFindingLinkage,
  validateOpportunityLinkage,
  validateProofLinkage
} from './engine.js';
import { hashValue, canonicalize } from './crypto.js';
import { compareRuns } from './retest.js';
import { runRules, mapFindingsToOpportunities } from './rules.js';
import type { ArgusBundle, Evidence, Finding, Opportunity } from '@argus/schema';

describe('Core Invariant 1: Evidence Immutability', () => {
  it('freezes evidence record and nested rawValue/normalizedValue', () => {
    const raw = { status: 200, headers: { 'content-type': 'text/html' } };
    const evidence = createImmutableEvidence({
      targetId: 'tgt_example',
      runId: 'run_001',
      type: 'HTTP_RESPONSE',
      source: 'https://example.com',
      collector: 'argus-http',
      collectorVersion: '1.0.0',
      observedAt: new Date().toISOString(),
      rawValue: raw,
      confidence: 'VERIFIED'
    });

    assert.equal(verifyEvidenceImmutability(evidence), true);
    assert.equal(Object.isFrozen(evidence), true);
    assert.equal(Object.isFrozen(evidence.rawValue), true);
    assert.equal(Object.isFrozen((evidence.rawValue as any).headers), true);

    // Attempted mutations must fail (in strict mode they throw TypeError)
    assert.throws(() => {
      (evidence as any).targetId = 'hacked';
    }, TypeError);

    assert.throws(() => {
      (evidence.rawValue as any).status = 500;
    }, TypeError);
  });
});

describe('Core Invariant 2: Evidence Hash Determinism', () => {
  it('produces identical SHA-256 hashes regardless of object key order', () => {
    const objA = {
      server: 'nginx',
      headers: { authorization: 'Bearer xyz', cache: 'no-cache' },
      status: 200
    };

    const objB = {
      status: 200,
      headers: { cache: 'no-cache', authorization: 'Bearer xyz' },
      server: 'nginx'
    };

    const hashA = hashValue(objA);
    const hashB = hashValue(objB);

    assert.equal(hashA, hashB);
    assert.equal(typeof hashA, 'string');
    assert.equal(hashA.length, 64); // Valid SHA-256 hex string
  });

  it('generates reproducible hashes across separate invocations', () => {
    const payload = { ip: '93.184.216.34', domain: 'example.com' };
    const hash1 = hashValue(payload);
    const hash2 = hashValue(payload);
    assert.equal(hash1, hash2);
  });
});

describe('Core Invariant 3: Finding → Evidence Linkage', () => {
  it('validates that every finding references existing evidence IDs', () => {
    const ev1 = createImmutableEvidence({
      id: 'evd_100',
      targetId: 'tgt_1',
      runId: 'run_1',
      type: 'HTTP_RESPONSE',
      source: 'https://example.com',
      collector: 'http',
      collectorVersion: '1.0.0',
      observedAt: new Date().toISOString(),
      rawValue: { headers: { server: 'apache' } }
    });

    const validFinding: Finding = {
      id: 'fnd_001',
      findingId: 'fnd_001',
      ruleId: 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: 'https://example.com',
      targetId: 'tgt_1',
      runId: 'run_1',
      title: 'Missing HSTS',
      description: 'HSTS header missing',
      technicalExplanation: 'Strict-Transport-Security not sent',
      remediation: 'Configure HSTS header',
      severity: 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: ['evd_100']
    };

    const result = validateFindingLinkage([validFinding], [ev1]);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects findings with empty or dangling evidence references', () => {
    const orphanFinding: Finding = {
      id: 'fnd_002',
      findingId: 'fnd_002',
      ruleId: 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: 'https://example.com',
      targetId: 'tgt_1',
      runId: 'run_1',
      title: 'Missing HSTS',
      description: 'HSTS header missing',
      technicalExplanation: 'Strict-Transport-Security not sent',
      remediation: 'Configure HSTS header',
      severity: 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: ['evd_nonexistent']
    };

    const emptyEvidenceFinding: Finding = {
      ...orphanFinding,
      id: 'fnd_003',
      evidenceIds: []
    };

    const resultOrphan = validateFindingLinkage([orphanFinding], []);
    assert.equal(resultOrphan.valid, false);
    assert.ok(resultOrphan.errors[0].includes('references missing evidenceId'));

    const resultEmpty = validateFindingLinkage([emptyEvidenceFinding], []);
    assert.equal(resultEmpty.valid, false);
    assert.ok(resultEmpty.errors[0].includes('empty evidenceIds'));
  });
});

describe('Core Invariant 4: Opportunity → Finding Linkage', () => {
  it('validates that opportunities reference existing findings', () => {
    const finding: Finding = {
      id: 'fnd_hsts',
      findingId: 'fnd_hsts',
      ruleId: 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: 'https://example.com',
      targetId: 'tgt_1',
      runId: 'run_1',
      title: 'Missing HSTS',
      description: 'Missing HSTS',
      technicalExplanation: 'Tech explanation',
      remediation: 'Remediation steps',
      severity: 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: ['evd_1']
    };

    const opps = mapFindingsToOpportunities([finding]);
    assert.ok(opps.length > 0);

    const validation = validateOpportunityLinkage(opps, [finding]);
    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });

  it('detects dangling finding IDs in opportunity definitions', () => {
    const badOpp: Opportunity = {
      id: 'opp_bad',
      title: 'Hardening',
      supportingFindingIds: ['fnd_ghost'],
      confidence: 'SUPPORTED',
      technicalSignificance: 'tech',
      businessSignificance: 'biz',
      businessArea: 'Security',
      technicalArea: 'HTTP',
      serviceCategory: 'SECURITY_HARDENING',
      retestAvailable: true,
      needsClientAccess: false,
      estimatedComplexity: 'LOW',
      clientExplanationKey: 'hsts'
    };

    const validation = validateOpportunityLinkage([badOpp], []);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors[0].includes('references missing findingId'));
  });
});

describe('Core Invariant 5: Retest Before/After Linkage & Proof States', () => {
  it('generates RESOLVED proof referencing before and after evidence', () => {
    const baselineEv = createImmutableEvidence({
      id: 'evd_base_http',
      targetId: 'example.com',
      runId: 'run_base',
      type: 'HTTP_RESPONSE',
      source: 'https://example.com',
      collector: 'http',
      collectorVersion: '1.0.0',
      observedAt: '2026-09-01T00:00:00Z',
      rawValue: { headers: { 'content-type': 'text/html' } }
    });

    const baselineFinding: Finding = {
      id: 'fnd_base_hsts',
      findingId: 'fnd_base_hsts',
      ruleId: 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: 'https://example.com',
      targetId: 'example.com',
      runId: 'run_base',
      title: 'Missing HSTS',
      description: 'Missing HSTS',
      technicalExplanation: 'tech',
      remediation: 'remed',
      severity: 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: ['evd_base_http']
    };

    const baselineBundle: ArgusBundle = {
      schemaVersion: '1.0.0',
      argusVersion: '0.1.0',
      os: 'win32',
      runtime: 'node',
      collectorVersions: { http: '1.0.0' },
      policyManifest: { mode: 'PUBLIC_PASSIVE' },
      target: { input: 'https://example.com', normalized: 'https://example.com/', hostname: 'example.com' },
      run: { id: 'run_base', timestamp: '2026-09-01T00:00:00Z', durationMs: 100 },
      observations: [],
      evidence: [baselineEv],
      findings: [baselineFinding],
      opportunities: [],
      proofs: [],
      bundleHash: 'dummy'
    };

    const retestEv = createImmutableEvidence({
      id: 'evd_retest_http',
      targetId: 'example.com',
      runId: 'run_retest',
      type: 'HTTP_RESPONSE',
      source: 'https://example.com',
      collector: 'http',
      collectorVersion: '1.0.0',
      observedAt: '2026-09-10T00:00:00Z',
      rawValue: { headers: { 'strict-transport-security': 'max-age=31536000; includeSubDomains' } }
    });

    const retestBundle: ArgusBundle = {
      ...baselineBundle,
      run: { id: 'run_retest', timestamp: '2026-09-10T00:00:00Z', durationMs: 100 },
      evidence: [retestEv],
      findings: [], // Resolved! No missing HSTS finding
      proofs: []
    };

    const proofs = compareRuns(baselineBundle, retestBundle);
    assert.equal(proofs.length, 1);
    assert.equal(proofs[0].status, 'RESOLVED');
    assert.deepEqual(proofs[0].beforeEvidenceIds, ['evd_base_http']);
    assert.deepEqual(proofs[0].afterEvidenceIds, ['evd_retest_http']);

    const linkage = validateProofLinkage(proofs, [baselineEv], [retestEv]);
    assert.equal(linkage.valid, true);
  });

  it('marks proof UNCHANGED when finding persists with identical severity', () => {
    const ev = createImmutableEvidence({
      id: 'evd_http_unchanged',
      targetId: 'example.com',
      runId: 'run_base',
      type: 'HTTP_RESPONSE',
      source: 'https://example.com',
      collector: 'http',
      collectorVersion: '1.0.0',
      observedAt: '2026-09-01T00:00:00Z',
      rawValue: { headers: {} }
    });

    const finding: Finding = {
      id: 'fnd_persisting',
      findingId: 'fnd_persisting',
      ruleId: 'rule-http-missing-hsts',
      ruleVersion: '1.0.0',
      target: 'https://example.com',
      targetId: 'example.com',
      runId: 'run_base',
      title: 'Missing HSTS',
      description: 'Missing HSTS',
      technicalExplanation: 'tech',
      remediation: 'remed',
      severity: 'MEDIUM',
      confidence: 'VERIFIED',
      evidenceIds: ['evd_http_unchanged']
    };

    const baseBundle: ArgusBundle = {
      schemaVersion: '1.0.0',
      argusVersion: '0.1.0',
      os: 'win32',
      runtime: 'node',
      collectorVersions: {},
      policyManifest: { mode: 'PUBLIC_PASSIVE' },
      target: { input: 'https://example.com', normalized: 'https://example.com/', hostname: 'example.com' },
      run: { id: 'run_base', timestamp: '2026-09-01T00:00:00Z', durationMs: 100 },
      observations: [],
      evidence: [ev],
      findings: [finding],
      opportunities: [],
      proofs: [],
      bundleHash: 'dummy'
    };

    const retestBundle: ArgusBundle = {
      ...baseBundle,
      run: { id: 'run_retest', timestamp: '2026-09-10T00:00:00Z', durationMs: 100 },
      findings: [{ ...finding, runId: 'run_retest' }]
    };

    const proofs = compareRuns(baseBundle, retestBundle);
    assert.equal(proofs.length, 1);
    assert.equal(proofs[0].status, 'UNCHANGED');
  });
});

describe('Core Invariant 6: Confidence State Behavior', () => {
  it('assigns VERIFIED to direct deterministic observations', () => {
    const ev = createImmutableEvidence({
      targetId: 'tgt_1',
      runId: 'run_1',
      type: 'DNS_RECORD',
      source: 'dns',
      collector: 'dns',
      collectorVersion: '1.0.0',
      observedAt: new Date().toISOString(),
      rawValue: ['v=spf1 -all'],
      confidence: 'VERIFIED'
    });
    assert.equal(ev.confidence, 'VERIFIED');
  });

  it('prevents AI from assigning VERIFIED (clamps to INFERRED)', () => {
    const aiEv = createImmutableEvidence({
      targetId: 'tgt_1',
      runId: 'run_1',
      type: 'AI_SYNTHESIS',
      source: 'llm',
      collector: 'argus-ai',
      collectorVersion: '1.0.0',
      observedAt: new Date().toISOString(),
      rawValue: { reasoning: 'Website might run WordPress' },
      confidence: 'VERIFIED', // AI claims VERIFIED
      aiAssisted: true
    });
    // Strict invariant: AI cannot assign VERIFIED by itself
    assert.equal(aiEv.confidence, 'INFERRED');
  });
});

describe('Core Invariant 7: Offline-Mode Network Blocking', () => {
  it('blocks network collectors when ARGUS_OFFLINE_MODE=true', async () => {
    const originalEnv = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'true';

    try {
      const { collectDns, collectHttp } = await import('@argus/collectors');

      await assert.rejects(
        async () => collectDns('example.com', 'run_test', 'tgt_test'),
        /ARGUS_OFFLINE_MODE is active/
      );

      await assert.rejects(
        async () => collectHttp('https://example.com', 'run_test', 'tgt_test'),
        /ARGUS_OFFLINE_MODE is active/
      );
    } finally {
      process.env.ARGUS_OFFLINE_MODE = originalEnv;
    }
  });
});
