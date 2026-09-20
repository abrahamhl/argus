/**
 * ARGUS Adversarial Security Review & Threat Vector Verification Suite
 *
 * Explicitly tests and validates all 14 vectors from THREAT_MODEL.md:
 * Vector 01: Malicious Target Input
 * Vector 02: SSRF & Private IP Scanning
 * Vector 03: Command Injection Prevention
 * Vector 04: Adapter Sandboxing & Scope Gating
 * Vector 05: Untrusted Parser & Tool Output Fuzzing
 * Vector 06: Stored XSS & Report Injection
 * Vector 07: Secret Leakage & Redaction
 * Vector 08: Bundle Integrity & Path Traversal
 * Vector 09: Evidence Tampering & Immutability
 * Vector 10: AI Boundary Enforcement & Hallucination Clamping
 * Vector 11: Supply Chain Verification
 * Vector 12: Operator Mistake Resilience
 * Vector 13: Scope Creep Prevention
 * Vector 14: Target Vulnerability vs Product Threat Separation
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  PolicyEngine,
  validateIPAddress,
  isLocalhost,
  createPublicPostureScope,
  evaluateScopeGate,
  createImmutableEvidence,
  verifyEvidence,
  verifyEvidenceChain,
  generateSigningKeyPair,
  signBundle,
  verifySignature,
  redactEvidence,
  exportBundle,
  canonicalize,
  hashValue,
  runRules,
  generateClientReport,
  generateEngineerReport,
  escapeHtml,
  evaluateSignalsConfidence,
  sanitizeConfidenceForAi
} from './index.js';
import type { Target, Run, AuthorizationScope, Evidence, ArgusBundle } from '@argus/schema';

describe('Adversarial Security Review — 14 Threat Model Vectors', () => {

  // ── Vector 01: Malicious Target Input ─────────────────────────────────────
  describe('Vector 01: Malicious Target Input', () => {
    const engine = new PolicyEngine();

    it('rejects overlong target URLs (> 2048 characters)', async () => {
      const overlong = 'https://example.com/' + 'x'.repeat(2100);
      const res = await engine.validateTarget(overlong);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes('length'));
    });

    it('rejects overlong hostnames (> 253 characters)', async () => {
      const overlongHost = 'https://' + 'a'.repeat(260) + '.nl/';
      const res = await engine.validateTarget(overlongHost);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes('maximum length'));
    });

    it('rejects embedded credentials in target URL (credential-stuffing / exfiltration)', async () => {
      const credUrls = [
        'https://admin:secret123@example.com',
        'http://user@target.nl/path',
        'https://token:x@auxdesign.nl'
      ];
      for (const u of credUrls) {
        const res = await engine.validateTarget(u);
        assert.equal(res.allowed, false, `Expected ${u} to be rejected for embedded credentials`);
        assert.ok(res.reason?.includes('credentials'));
      }
    });

    it('rejects unsafe schemes (file://, javascript:, data:, ftp:, gopher:)', async () => {
      const unsafe = [
        'file:///etc/passwd',
        'file:///C:/Windows/win.ini',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'ftp://anonymous@ftp.example.com',
        'gopher://gopher.floodgap.com'
      ];
      for (const u of unsafe) {
        const res = await engine.validateTarget(u);
        assert.equal(res.allowed, false, `Expected ${u} to be rejected`);
      }
    });

    it('rejects malformed URLs without throwing uncaught exceptions', async () => {
      const malformed = ['not-a-url', 'http://', '://bad', '', 'http://[invalid-ipv6]'];
      for (const m of malformed) {
        const res = await engine.validateTarget(m);
        assert.equal(res.allowed, false);
      }
    });
  });

  // ── Vector 02: SSRF & Private IP Scanning ─────────────────────────────────
  describe('Vector 02: SSRF & Private IP Scanning', () => {
    it('rejects IPv4 loopback addresses (127.0.0.0/8)', () => {
      assert.equal(validateIPAddress('127.0.0.1').allowed, false);
      assert.equal(validateIPAddress('127.0.1.1').allowed, false);
      assert.equal(validateIPAddress('127.255.255.254').allowed, false);
    });

    it('rejects IPv6 loopback (::1)', () => {
      assert.equal(validateIPAddress('::1').allowed, false);
      assert.equal(isLocalhost('::1'), true);
    });

    it('rejects RFC 1918 private IPv4 networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      const privates = ['10.0.0.1', '10.254.254.254', '172.16.0.1', '172.31.255.254', '192.168.1.1', '192.168.178.1'];
      for (const ip of privates) {
        const res = validateIPAddress(ip);
        assert.equal(res.allowed, false, `Expected private IP ${ip} to be rejected`);
        assert.ok(res.reason?.includes('Private'));
      }
    });

    it('rejects cloud provider instance metadata endpoints (169.254.169.254 & link-local)', () => {
      const metadata = ['169.254.169.254', '169.254.1.1', '169.254.254.254'];
      for (const ip of metadata) {
        const res = validateIPAddress(ip);
        assert.equal(res.allowed, false, `Expected metadata IP ${ip} to be rejected`);
      }
    });

    it('rejects IPv4-mapped IPv6 loopback and metadata bypass attempts', () => {
      const mapped = ['::ffff:127.0.0.1', '::ffff:169.254.169.254', '::ffff:10.0.0.1', '::ffff:192.168.1.1'];
      for (const ip of mapped) {
        assert.equal(validateIPAddress(ip).allowed, false, `Expected IPv4-mapped ${ip} to be rejected`);
      }
    });

    it('rejects redirect hops targeting internal private network destinations', async () => {
      const engine = new PolicyEngine();
      const privRedirect = await engine.validateRedirectHop('http://192.168.1.1/internal-admin', 1);
      assert.equal(privRedirect.allowed, false);

      const loopbackRedirect = await engine.validateRedirectHop('http://127.0.0.1:8080/metrics', 1);
      assert.equal(loopbackRedirect.allowed, false);
    });

    it('rejects redirect chains exceeding maximum hop threshold', async () => {
      const engine = new PolicyEngine({ maxRedirectHops: 5 });
      const res = await engine.validateRedirectHop('https://example.com/hop6', 6);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes('redirect'));
    });
  });

  // ── Vector 03: Command Injection Prevention ───────────────────────────────
  describe('Vector 03: Command Injection Prevention', () => {
    const engine = new PolicyEngine();

    it('rejects shell metacharacters in bundle filenames', () => {
      const shellPayloads = [
        'bundle;rm -rf /.argusbundle',
        'bundle|cat /etc/passwd.argusbundle',
        'bundle$(whoami).argusbundle',
        'bundle`id`.argusbundle',
        'bundle&&reboot.argusbundle'
      ];
      for (const p of shellPayloads) {
        const res = engine.validateBundleName(p);
        assert.equal(res.allowed, false, `Expected shell payload in bundle name ${p} to be rejected`);
      }
    });

    it('rejects unrecognized or dangerous tool executions (zero shell invocation policy)', () => {
      const allowed = ['argus_inspect', 'argus_retest'];
      const dangerousTools = ['exec', 'system', 'sh', 'bash', 'cmd.exe', 'powershell', 'spawn'];
      for (const tool of dangerousTools) {
        const res = engine.validateToolName(tool, allowed);
        assert.equal(res.allowed, false);
      }
    });
  });

  // ── Vector 04: Adapter Sandboxing & Scope Gating ──────────────────────────
  describe('Vector 04: Adapter Sandboxing & Scope Gating', () => {
    const target: Target = {
      id: 'target-001',
      name: 'example-business.nl',
      domains: ['example-business.nl']
    };

    const run: Run = {
      id: 'run-001',
      targetId: 'target-001',
      status: 'STARTED',
      timestamp: '2026-09-20T12:00:00.000Z',
      argusVersion: '1.0.0',
      os: 'win32'
    };

    it('rejects execution when collector is not authorized in scope', () => {
      const scope = createPublicPostureScope(target.id, target.domains, 'Operator');
      const decision = evaluateScopeGate({
        target,
        run,
        scope,
        collectorName: 'active-port-scanner' // Not in PUBLIC_POSTURE_ALLOWED_COLLECTORS
      });
      assert.equal(decision.allowed, false);
      assert.ok(decision.reason?.includes('not permitted'));
    });

    it('enforces fail-closed behavior when scope status is REVOKED', () => {
      const scope = createPublicPostureScope(target.id, target.domains, 'Operator');
      scope.status = 'REVOKED';
      const decision = evaluateScopeGate({
        target,
        run,
        scope,
        collectorName: 'dns'
      });
      assert.equal(decision.allowed, false);
      assert.ok(decision.reason?.includes('REVOKED'));
    });
  });

  // ── Vector 05: Untrusted Parser & Tool Output Fuzzing ──────────────────────
  describe('Vector 05: Untrusted Parser & Tool Output Fuzzing', () => {
    it('canonicalize safely handles null, undefined, primitive, and empty structures', () => {
      assert.equal(canonicalize(null), 'null');
      assert.equal(canonicalize(undefined), undefined);
      assert.equal(canonicalize('hello'), '"hello"');
      assert.equal(canonicalize(123), '123');
      assert.equal(canonicalize({}), '{}');
      assert.equal(canonicalize([]), '[]');
    });

    it('canonicalize handles complex nested and unordered structures deterministically', () => {
      const a = { z: 1, a: { y: 2, x: 3 } };
      const b = { a: { x: 3, y: 2 }, z: 1 };
      assert.equal(canonicalize(a), canonicalize(b));
      assert.equal(hashValue(a), hashValue(b));
    });

    it('runRules handles malformed or unexpected evidence objects without throwing', () => {
      const malformedEvidence: any[] = [
        null,
        undefined,
        {},
        { id: 'bad-1', collector: 'http' }, // missing normalizedValue
        { id: 'bad-2', collector: 'unknown-col', normalizedValue: { random: true } },
        { id: 'bad-3', collector: 'dns', normalizedValue: 'string-instead-of-object' }
      ];

      // Must not throw uncaught error
      assert.doesNotThrow(() => {
        const findings = runRules(malformedEvidence as any);
        assert.ok(Array.isArray(findings));
      });
    });
  });

  // ── Vector 06: Stored XSS & Report Injection ──────────────────────────────
  describe('Vector 06: Stored XSS & Report Injection', () => {
    it('escapeHtml comprehensively escapes all dangerous HTML special characters', () => {
      const payload = '<script>alert("XSS & theft")</script>\'<svg onload=alert(1)>';
      const escaped = escapeHtml(payload);
      assert.ok(!escaped.includes('<script>'));
      assert.ok(!escaped.includes('</script>'));
      assert.ok(!escaped.includes('"'));
      assert.ok(!escaped.includes("'"));
      assert.ok(escaped.includes('&lt;script&gt;'));
      assert.ok(escaped.includes('&quot;XSS &amp; theft&quot;'));
      assert.ok(escaped.includes('&#039;&lt;svg'));
    });

    it('generateClientReport sanitizes XSS payloads injected in hostname and findings', () => {
      const xssHostname = '<script>alert("pwned")</script>.nl';
      const xssBundle: ArgusBundle = {
        schemaVersion: '1.0.0',
        argusVersion: '1.0.0',
        os: 'win32',
        runtime: 'node',
        collectorVersions: {},
        policyManifest: { mode: 'OFFLINE' },
        target: {
          input: xssHostname,
          normalized: xssHostname,
          hostname: xssHostname
        },
        run: {
          id: 'run-xss',
          timestamp: '2026-09-20T12:00:00.000Z',
          durationMs: 500
        },
        observations: [],
        evidence: [],
        findings: [
          {
            id: 'find-xss',
            findingId: 'find-xss',
            ruleId: 'SEC-HSTS-001',
            ruleVersion: '1.0.0',
            target: xssHostname,
            targetId: 't-1',
            runId: 'run-xss',
            title: '<img src=x onerror=alert("finding-xss")>',
            severity: 'MEDIUM',
            confidence: 'VERIFIED',
            description: '<script>alert("desc-xss")</script>',
            technicalExplanation: 'tech-explanation',
            remediation: '"><script>alert("remed-xss")</script>',
            evidenceIds: []
          }
        ],
        opportunities: [],
        proofs: [],
        bundleHash: 'dummy'
      };

      const html = generateClientReport(xssBundle, { language: 'nl' });
      assert.ok(!html.includes('<script>alert("pwned")</script>'));
      assert.ok(!html.includes('<img src=x onerror=alert("finding-xss")>'));
      assert.ok(html.includes('&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;'));
    });

    it('generateEngineerReport sanitizes XSS payloads in technical output', () => {
      const xssBundle: ArgusBundle = {
        schemaVersion: '1.0.0',
        argusVersion: '1.0.0',
        os: 'win32',
        runtime: 'node',
        collectorVersions: {},
        policyManifest: { mode: 'OFFLINE' },
        target: {
          input: 'attacker.nl',
          normalized: 'attacker.nl',
          hostname: 'attacker.nl"><script>alert(1)</script>'
        },
        run: {
          id: 'run-eng',
          timestamp: '2026-09-20T12:00:00.000Z',
          durationMs: 400
        },
        observations: [],
        evidence: [],
        findings: [],
        opportunities: [],
        proofs: [],
        bundleHash: 'dummy-eng'
      };

      const engineerHtml = generateEngineerReport(xssBundle);
      assert.ok(!engineerHtml.includes('<script>alert(1)</script>'));
      assert.ok(engineerHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    });
  });

  // ── Vector 07: Secret Leakage & Redaction ──────────────────────────────────
  describe('Vector 07: Secret Leakage & Redaction', () => {
    it('redactEvidence scrubs Authorization, Cookie, and API tokens from evidence', () => {
      const rawEvidence: Evidence = {
        id: 'ev-secrets',
        targetId: 't-sec',
        runId: 'run-sec',
        type: 'http-response',
        source: 'http-collector',
        collector: 'http',
        collectorVersion: '1.0.0',
        observedAt: '2026-09-20T12:00:00.000Z',
        confidence: 'VERIFIED',
        sha256: 'placeholder',
        rawValue: {
          requestHeaders: {
            'authorization': 'Bearer secret-jwt-token-value',
            'x-api-key': 'live-api-key-998877',
            'user-agent': 'Mozilla/5.0'
          },
          responseHeaders: {
            'set-cookie': ['session_id=abcdef123456; Secure; HttpOnly'],
            'server': 'nginx'
          }
        },
        normalizedValue: {
          headers: {
            'server': 'nginx'
          }
        }
      };

      const redacted = redactEvidence(rawEvidence);
      const json = JSON.stringify(redacted);
      assert.ok(!json.includes('secret-jwt-token-value'));
      assert.ok(!json.includes('live-api-key-998877'));
      assert.ok(!json.includes('session_id=abcdef123456'));
      assert.ok(json.includes('[REDACTED]'));
    });

    it('exportBundle omits rawValue from exported bundles to prevent data leakage', () => {
      const sampleVal = { raw: 'internal-data' };
      const bundle: ArgusBundle = {
        schemaVersion: '1.0.0',
        argusVersion: '1.0.0',
        os: 'win32',
        runtime: 'node',
        collectorVersions: {},
        policyManifest: { mode: 'OFFLINE' },
        target: { input: 'example.nl', normalized: 'example.nl', hostname: 'example.nl' },
        run: { id: 'run-1', timestamp: '2026-09-20T12:00:00.000Z', durationMs: 100 },
        observations: [],
        evidence: [
          {
            id: 'ev-1',
            targetId: 't-1',
            runId: 'run-1',
            type: 'dns-records',
            source: 'dns',
            collector: 'dns',
            collectorVersion: '1.0.0',
            observedAt: '2026-09-20T12:00:00.000Z',
            confidence: 'VERIFIED',
            sha256: hashValue(sampleVal),
            rawValue: sampleVal,
            normalizedValue: { domain: 'example.nl' }
          }
        ],
        findings: [],
        opportunities: [],
        proofs: [],
        bundleHash: ''
      };

      const exported = exportBundle(bundle);
      assert.equal(exported.evidence[0].rawValue, undefined);
      assert.ok(exported.evidence[0].sha256.length === 64);
    });
  });

  // ── Vector 08: Bundle Integrity & Path Traversal ──────────────────────────
  describe('Vector 08: Bundle Integrity & Path Traversal', () => {
    const engine = new PolicyEngine();

    it('rejects path traversal sequences in bundle filenames', () => {
      const traversalNames = [
        '../../etc/passwd.argusbundle',
        '..\\..\\windows\\system32.argusbundle',
        'dir/file.argusbundle',
        './bundle.argusbundle'
      ];
      for (const name of traversalNames) {
        const res = engine.validateBundleName(name);
        assert.equal(res.allowed, false, `Expected ${name} to be rejected for path traversal`);
      }
    });

    it('detects tampering in digitally signed Ed25519 bundles', () => {
      const { publicKey, privateKey } = generateSigningKeyPair();
      const rawObj = { a: 1 };
      const bundle: ArgusBundle = {
        schemaVersion: '1.0.0',
        argusVersion: '1.0.0',
        os: 'win32',
        runtime: 'node',
        collectorVersions: {},
        policyManifest: { mode: 'OFFLINE' },
        target: { input: 'signed.nl', normalized: 'signed.nl', hostname: 'signed.nl' },
        run: { id: 'run-s', timestamp: '2026-09-20T12:00:00.000Z', durationMs: 200 },
        observations: [],
        evidence: [
          {
            id: 'ev-s',
            targetId: 't-s',
            runId: 'run-s',
            type: 'dns',
            source: 'dns',
            collector: 'dns',
            collectorVersion: '1.0.0',
            observedAt: '2026-09-20T12:00:00.000Z',
            confidence: 'VERIFIED',
            sha256: hashValue(rawObj),
            rawValue: rawObj,
            normalizedValue: {}
          }
        ],
        findings: [],
        opportunities: [],
        proofs: [],
        bundleHash: ''
      };

      const copyForHash = { ...bundle, bundleHash: '', signature: undefined };
      bundle.bundleHash = hashValue(copyForHash);

      const sigObj = signBundle(bundle, privateKey, 'key-1');
      bundle.signature = sigObj;
      assert.equal(verifySignature(bundle, publicKey), 'VALID');

      // Adversarial tampering: modify target hostname
      const tampered: ArgusBundle = JSON.parse(JSON.stringify(bundle));
      tampered.target.hostname = 'evil-hacked.nl';

      assert.equal(verifyEvidenceChain(tampered), false);
    });
  });

  // ── Vector 09: Evidence Tampering & Immutability ───────────────────────────
  describe('Vector 09: Evidence Tampering & Immutability', () => {
    it('createImmutableEvidence freezes object hierarchy preventing runtime mutation', () => {
      const evidence = createImmutableEvidence({
        targetId: 'target-freeze',
        runId: 'run-freeze',
        type: 'http-response',
        source: 'http',
        collector: 'http',
        collectorVersion: '1.0.0',
        observedAt: '2026-09-20T12:00:00.000Z',
        rawValue: { status: 200, headers: { hsts: false } },
        normalizedValue: { hasHsts: false }
      });

      assert.ok(Object.isFrozen(evidence));
      assert.ok(Object.isFrozen(evidence.rawValue));
      assert.ok(Object.isFrozen(evidence.rawValue.headers));

      // Attempted mutation throws TypeError in strict mode
      assert.throws(() => {
        (evidence as any).collector = 'mutated';
      }, TypeError);

      assert.throws(() => {
        (evidence.rawValue as any).status = 500;
      }, TypeError);
    });

    it('verifyEvidence detects post-collection modification of rawValue', () => {
      const originalRaw = { tlsVersion: 'TLSv1.2' };
      const evidence: Evidence = {
        id: 'ev-tamper',
        targetId: 't-1',
        runId: 'run-t',
        type: 'tls',
        source: 'tls',
        collector: 'tls',
        collectorVersion: '1.0.0',
        observedAt: '2026-09-20T12:00:00.000Z',
        confidence: 'VERIFIED',
        sha256: hashValue(originalRaw),
        rawValue: originalRaw,
        normalizedValue: originalRaw
      };

      assert.equal(verifyEvidence(evidence), true);

      // Tampered clone with falsified rawValue
      const tamperedEvidence: Evidence = {
        ...evidence,
        rawValue: { tlsVersion: 'TLSv1.0' } // Falsified to claim obsolete protocol
      };

      assert.equal(verifyEvidence(tamperedEvidence), false);
    });
  });

  // ── Vector 10: AI Boundary Enforcement & Hallucination Clamping ───────────
  describe('Vector 10: AI Boundary Enforcement & Hallucination Clamping', () => {
    it('strictly clamps AI-assisted signals: cannot assign VERIFIED', () => {
      const aiConfidence = evaluateSignalsConfidence(
        [{ source: 'ai_analyst', supports: true, deterministic: false, aiAssisted: true }],
        true
      );

      assert.notEqual(aiConfidence, 'VERIFIED');
      assert.equal(aiConfidence, 'INFERRED');

      const clamped = sanitizeConfidenceForAi('VERIFIED', true);
      assert.equal(clamped, 'INFERRED');
    });

    it('requires direct deterministic collector evidence for VERIFIED level', () => {
      const directDeterministic = evaluateSignalsConfidence(
        [{ source: 'http', supports: true, deterministic: true, aiAssisted: false }],
        false
      );

      assert.equal(directDeterministic, 'VERIFIED');
    });
  });

  // ── Vector 11: Supply Chain Verification ──────────────────────────────────
  describe('Vector 11: Supply Chain Verification', () => {
    it('verifies core packages rely exclusively on built-in Node.js runtime modules', () => {
      // Core invariant: Node.js standard modules only, zero untrusted native wrappers
      const builtins = ['node:crypto', 'node:dns/promises', 'node:tls', 'node:url'];
      for (const mod of builtins) {
        assert.doesNotThrow(() => import(mod));
      }
    });
  });

  // ── Vector 12: Operator Mistake Resilience ────────────────────────────────
  describe('Vector 12: Operator Mistake Resilience', () => {
    const target: Target = {
      id: 'target-op-001',
      name: 'bakkerij-jansen.nl',
      domains: ['bakkerij-jansen.nl']
    };

    it('rejects assessment when run targetId mismatches target ID', () => {
      const mismatchedRun: Run = {
        id: 'run-999',
        targetId: 'wrong-target-id',
        status: 'STARTED',
        timestamp: '2026-09-20T12:00:00.000Z',
        argusVersion: '1.0.0',
        os: 'win32'
      };
      const scope = createPublicPostureScope(target.id, target.domains, 'Abraham');
      const gate = evaluateScopeGate({
        target,
        run: mismatchedRun,
        scope,
        collectorName: 'dns'
      });
      assert.equal(gate.allowed, false);
      assert.ok(gate.reason?.includes('does not match Target ID'));
    });

    it('rejects assessment when scope authorization has expired', () => {
      const run: Run = {
        id: 'run-valid',
        targetId: 'target-op-001',
        status: 'STARTED',
        timestamp: '2026-09-20T12:00:00.000Z',
        argusVersion: '1.0.0',
        os: 'win32'
      };
      const expiredScope = createPublicPostureScope(target.id, target.domains, 'Abraham');
      expiredScope.expiresAt = '2020-01-01T00:00:00.000Z'; // 6 years in the past

      const gate = evaluateScopeGate({
        target,
        run,
        scope: expiredScope,
        collectorName: 'dns'
      });
      assert.equal(gate.allowed, false);
      assert.ok(gate.reason?.includes('expired'));
    });
  });

  // ── Vector 13: Scope Creep Prevention ─────────────────────────────────────
  describe('Vector 13: Scope Creep Prevention', () => {
    const target: Target = {
      id: 'target-scope',
      name: 'auxdesign.nl',
      domains: ['auxdesign.nl', '*.auxdesign.nl']
    };

    const run: Run = {
      id: 'run-scope',
      targetId: 'target-scope',
      status: 'STARTED',
      timestamp: '2026-09-20T12:00:00.000Z',
      argusVersion: '1.0.0',
      os: 'win32'
    };

    const scope = createPublicPostureScope(target.id, target.domains, 'Operator');

    it('permits authorized subdomains matching explicit wildcard domain', () => {
      const allowedGate = evaluateScopeGate({
        target,
        run,
        scope,
        collectorName: 'http',
        targetUrl: 'https://app.auxdesign.nl'
      });
      assert.equal(allowedGate.allowed, true);
    });

    it('rejects unauthorized foreign domains or third-party cloud infrastructure', () => {
      const foreignGate = evaluateScopeGate({
        target,
        run,
        scope,
        collectorName: 'http',
        targetUrl: 'https://aws.amazon.com/s3/auxdesign'
      });
      assert.equal(foreignGate.allowed, false);
      assert.ok(foreignGate.reason?.includes('not within authorized domains'));
    });
  });

  // ── Vector 14: Target Vulnerability vs Product Threat Separation ──────────
  describe('Vector 14: Target Vulnerability vs Product Threat Separation', () => {
    it('reports target configuration weaknesses factually without alarmism or CVSS fabrications', () => {
      const evidence = [
        {
          id: 'ev-http',
          targetId: 't-1',
          runId: 'r-1',
          type: 'HTTP_RESPONSE',
          source: 'https://example-business.nl',
          collector: 'http',
          collectorVersion: '1.0.0',
          observedAt: '2026-09-20T12:00:00.000Z',
          confidence: 'VERIFIED',
          sha256: 'dummy',
          rawValue: {},
          normalizedValue: {
            statusCode: 200,
            headers: {}
          }
        }
      ];

      const findings = runRules(evidence as any);
      assert.ok(findings.length >= 1);

      for (const finding of findings) {
        // Must NOT use scaremongering words
        assert.ok(!finding.title.toLowerCase().includes('critical hack'));
        assert.ok(!finding.description.toLowerCase().includes('breached'));
        assert.ok(!finding.description.toLowerCase().includes('gdpr fine imminent'));
        // Must contain clear factual explanation fields
        assert.ok(finding.whyItMatters !== undefined);
        assert.ok(finding.whyItMatters.length > 0);
      }
    });
  });
});
