import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  analyzeMailTransportSecurity,
  analyzeDnssecPosture,
  generateTyposquatRadar,
  scanFrontendExposures,
  MerkleTree,
  createProofPack,
  verifyProofPack,
  computePostureDrift,
  exportToStix21,
  exportToMisp,
  generateSigningKeyPair
} from './index.js';

test('DeepIntel: MTA-STS analyzer correctly identifies enforce mode and recommendations', () => {
  const records = {
    '_mta-sts.example.nl': ['v=STSv1; mode=enforce; max_age=86400;'],
    '_smtp._tls.example.nl': ['v=TLSRPTv1; rua=mailto:tls-reports@example.nl;']
  };

  const report = analyzeMailTransportSecurity('example.nl', records);
  assert.equal(report.hasMtaStsRecord, true);
  assert.equal(report.mode, 'enforce');
  assert.equal(report.maxAge, 86400);
  assert.equal(report.hasTlsRpt, true);
  assert.equal(report.tlsRptMailto, 'tls-reports@example.nl');
  assert.equal(report.complianceScore, 80); // 50 (enforce) + 30 (tlsrpt)
});

test('DeepIntel: DNSSEC posture identifies SECURE when DNSKEY and DS records are present', () => {
  const secureReport = analyzeDnssecPosture('example.nl', { hasDnskey: true, hasDsRecord: true });
  assert.equal(secureReport.status, 'SECURE');
  assert.equal(secureReport.score, 100);

  const insecureReport = analyzeDnssecPosture('unsecured.nl', { hasDnskey: false, hasDsRecord: false });
  assert.equal(insecureReport.status, 'INSECURE');
  assert.equal(insecureReport.score, 20);
});

test('DeepIntel: Typosquatting radar generates homoglyphs and TLD swap variants', () => {
  const radar = generateTyposquatRadar('bakkerij.nl');
  assert.ok(radar.generatedVariantsCount > 0);
  assert.ok(radar.highRiskVariants.length > 0);
  const hasHomoglyph = radar.highRiskVariants.some(v => v.technique === 'HOMOGLYPH');
  const hasTldSwap = radar.highRiskVariants.some(v => v.technique === 'TLD_SWAP');
  assert.ok(hasHomoglyph || hasTldSwap);
});

test('DeepIntel: Frontend asset exposure scanner detects unconsented tracking without banner', () => {
  const htmlWithoutBanner = `
    <html>
      <head>
        <script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>
      </head>
      <body>
        <h1>Welkom</h1>
      </body>
    </html>
  `;
  const report = scanFrontendExposures(htmlWithoutBanner, 'https://example.nl');
  assert.ok(report.exposures.length > 0);
  const trackerExp = report.exposures.find(e => e.type === 'PRECONSENT_TRACKER');
  assert.ok(trackerExp);
  assert.equal(trackerExp?.severity, 'MEDIUM');
});

test('MerkleTree: builds deterministic root hash and verifies inclusion proof', () => {
  const evidenceItems = [
    { id: 'ev_dns_soa', content: 'SOA ns1.transip.nl' },
    { id: 'ev_dns_spf', content: 'v=spf1 -all' },
    { id: 'ev_tls_cert', content: 'TLS 1.3 Let\'s Encrypt' },
    { id: 'ev_http_head', content: 'Strict-Transport-Security: max-age=31536000' }
  ];

  const tree = new MerkleTree(evidenceItems);
  const root = tree.getRootHash();
  assert.ok(root && root.length === 64);

  // Generate and verify proof for ev_dns_spf
  const proof = tree.generateInclusionProof('ev_dns_spf');
  assert.equal(proof.evidenceId, 'ev_dns_spf');
  assert.equal(proof.rootHash, root);

  const isValid = MerkleTree.verifyInclusionProof(proof);
  assert.equal(isValid, true);
});

test('ProofPack: creates signed pack and verifies mathematical and cryptographic integrity', () => {
  const evidenceItems = [
    { id: 'ev1', content: { a: 1, b: 'dns' } },
    { id: 'ev2', content: { a: 2, b: 'tls' } }
  ];

  const keys = generateSigningKeyPair();
  const pack = createProofPack('target.nl', 'run_001', evidenceItems, {
    privateKeyPem: keys.privateKey,
    publicKeyPem: keys.publicKey
  });

  assert.equal(pack.targetDomain, 'target.nl');
  assert.equal(pack.evidenceCount, 2);
  assert.ok(pack.signature);

  const verification = verifyProofPack(pack);
  assert.equal(verification.valid, true);
  assert.equal(verification.errors.length, 0);

  // Tamper with root hash
  const tamperedPack = { ...pack, merkleRoot: '0000000000000000000000000000000000000000000000000000000000000000' };
  const tamperedVerif = verifyProofPack(tamperedPack);
  assert.equal(tamperedVerif.valid, false);
});

test('DriftEngine: detects resolved findings as improvements and new findings as regressions', () => {
  const baseline = {
    runId: 'run_baseline',
    timestamp: '2026-09-20T10:00:00Z',
    findings: [
      {
        id: 'fnd_weak_spf',
        findingId: 'fnd_weak_spf',
        ruleId: 'rule-dns-weak-spf',
        ruleVersion: '1.0.0',
        target: 'example.nl',
        targetId: 'comp_1',
        runId: 'run_baseline',
        title: 'Weak SPF record',
        description: 'SPF softfail detected',
        technicalExplanation: 'v=spf1 ~all',
        remediation: 'Set -all',
        severity: 'MEDIUM' as const,
        confidence: 'VERIFIED' as const,
        evidenceIds: ['ev_1']
      },
      {
        id: 'fnd_missing_hsts',
        findingId: 'fnd_missing_hsts',
        ruleId: 'rule-http-missing-hsts',
        ruleVersion: '1.0.0',
        target: 'example.nl',
        targetId: 'comp_1',
        runId: 'run_baseline',
        title: 'Missing HSTS',
        description: 'HSTS absent',
        technicalExplanation: 'Missing Strict-Transport-Security',
        remediation: 'Configure HSTS',
        severity: 'MEDIUM' as const,
        confidence: 'VERIFIED' as const,
        evidenceIds: ['ev_1']
      }
    ],
    evidence: [
      {
        id: 'ev_1',
        targetId: 'comp_1',
        runId: 'run_baseline',
        type: 'dns_records',
        source: 'DNS',
        collector: 'collector-dns',
        collectorVersion: '1.0.0',
        observedAt: '2026-09-20T10:00:00Z',
        rawValue: 'v=spf1 ~all',
        normalizedValue: 'v=spf1 ~all',
        confidence: 'VERIFIED' as const,
        sha256: 'hash_baseline_dns'
      }
    ]
  };

  const followup = {
    runId: 'run_followup',
    timestamp: '2026-09-26T10:00:00Z',
    findings: [
      // fnd_weak_spf is resolved! Only fnd_missing_hsts persists
      {
        id: 'fnd_missing_hsts',
        findingId: 'fnd_missing_hsts',
        ruleId: 'rule-http-missing-hsts',
        ruleVersion: '1.0.0',
        target: 'example.nl',
        targetId: 'comp_1',
        runId: 'run_followup',
        title: 'Missing HSTS',
        description: 'HSTS absent',
        technicalExplanation: 'Missing Strict-Transport-Security',
        remediation: 'Configure HSTS',
        severity: 'MEDIUM' as const,
        confidence: 'VERIFIED' as const,
        evidenceIds: ['ev_1']
      }
    ],
    evidence: [
      {
        id: 'ev_1',
        targetId: 'comp_1',
        runId: 'run_followup',
        type: 'dns_records',
        source: 'DNS',
        collector: 'collector-dns',
        collectorVersion: '1.0.0',
        observedAt: '2026-09-26T10:00:00Z',
        rawValue: 'v=spf1 -all',
        normalizedValue: 'v=spf1 -all',
        confidence: 'VERIFIED' as const,
        sha256: 'hash_retest_dns'
      }
    ]
  };

  const drift = computePostureDrift('example.nl', baseline, followup);
  assert.equal(drift.resolvedFindings.length, 1);
  assert.equal(drift.resolvedFindings[0].findingId, 'fnd_weak_spf');
  assert.equal(drift.regressionFindings.length, 0);
  assert.equal(drift.status, 'SIGNIFICANT_IMPROVEMENT');
  assert.ok(drift.driftScore > 0);
});

test('StixMisp: exports valid STIX 2.1 Bundle and MISP Event', () => {
  const findings = [
    {
      id: 'fnd_1',
      findingId: 'fnd_1',
      ruleId: 'rule-dns-weak-spf',
      ruleVersion: '1.0.0',
      target: 'example.nl',
      targetId: 'comp_1',
      runId: 'run_1',
      title: 'Weak SPF record',
      description: 'SPF softfail',
      technicalExplanation: 'v=spf1 ~all',
      remediation: 'Set -all',
      severity: 'MEDIUM' as const,
      confidence: 'VERIFIED' as const,
      evidenceIds: ['ev_1']
    }
  ];
  const evidence = [
    {
      id: 'ev_1',
      targetId: 'comp_1',
      runId: 'run_1',
      type: 'dns_records',
      source: 'DNS',
      collector: 'collector-dns',
      collectorVersion: '1.0.0',
      observedAt: new Date().toISOString(),
      rawValue: 'v=spf1 ~all',
      normalizedValue: 'v=spf1 ~all',
      confidence: 'VERIFIED' as const,
      sha256: 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234'
    }
  ];

  const stix = exportToStix21('example.nl', findings, evidence);
  assert.equal(stix.type, 'bundle');
  assert.equal(stix.spec_version, '2.1');
  assert.ok(stix.objects.length >= 3);

  const misp = exportToMisp('example.nl', findings, evidence);
  assert.ok(misp.Event);
  assert.equal(misp.Event.analysis, '2');
  assert.ok(misp.Event.Attribute.length >= 2);
});


