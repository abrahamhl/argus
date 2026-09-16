import test from 'node:test';
import assert from 'node:assert';
import { canonicalize, hashValue, verifyEvidence, verifyEvidenceChain, generateSigningKeyPair, signBundle, verifySignature, SignatureVerificationStatus } from './crypto.js';
import { Evidence, ArgusBundle } from '@argus/schema';

test('canonicalize sorts keys and serializes correctly', () => {
  const obj1 = { b: 2, a: 1 };
  const obj2 = { a: 1, b: 2 };
  assert.strictEqual(canonicalize(obj1), canonicalize(obj2));
  assert.strictEqual(canonicalize(obj1), '{"a":1,"b":2}');
});

test('verifyEvidence detects tampering', () => {
  const rawValue = { status: 200 };
  const ev: Evidence = {
    id: 'ev-1',
    targetId: 't-1',
    runId: 'r-1',
    type: 'HTTP',
    source: 'http',
    collector: 'test',
    collectorVersion: '1.0',
    observedAt: '2023-01-01',
    rawValue,
    normalizedValue: rawValue,
    confidence: 'VERIFIED',
    sha256: hashValue(rawValue)
  };
  
  assert.strictEqual(verifyEvidence(ev), true);
  
  ev.rawValue = { status: 500 }; // Tamper
  assert.strictEqual(verifyEvidence(ev), false);
});

test('verifyEvidenceChain detects bundle tampering', () => {
  const bundle: ArgusBundle = {
    schemaVersion: '1.0',
    argusVersion: '0.1',
    os: 'linux',
    runtime: 'node',
    collectorVersions: {},
    policyManifest: { mode: 'PUBLIC_PASSIVE' },
    target: { input: 'example.com', normalized: 'example.com', hostname: 'example.com' },
    run: { id: 'r-1', timestamp: '2023-01-01', durationMs: 100 },
    observations: [],
    evidence: [],
    findings: [],
    opportunities: [],
    proofs: [],
    bundleHash: ''
  };
  
  bundle.bundleHash = hashValue(bundle);
  assert.strictEqual(verifyEvidenceChain(bundle), true);
  
  bundle.target.hostname = 'evil.com';
  assert.strictEqual(verifyEvidenceChain(bundle), false);
});

test('Ed25519 signing and verification works', () => {
  const bundle: ArgusBundle = {
    schemaVersion: '1.0',
    argusVersion: '0.1',
    os: 'linux',
    runtime: 'node',
    collectorVersions: {},
    policyManifest: { mode: 'PUBLIC_PASSIVE' },
    target: { input: 'example.com', normalized: 'example.com', hostname: 'example.com' },
    run: { id: 'r-1', timestamp: '2023-01-01', durationMs: 100 },
    observations: [],
    evidence: [],
    findings: [],
    opportunities: [],
    proofs: [],
    bundleHash: 'dummy_hash_value'
  };

  const { publicKey, privateKey } = generateSigningKeyPair();
  
  bundle.signature = signBundle(bundle, privateKey, 'key-1');
  assert.strictEqual(bundle.signature.algorithm, 'Ed25519');
  
  assert.strictEqual(verifySignature(bundle, publicKey), SignatureVerificationStatus.VALID);
  
  bundle.bundleHash = 'tampered_hash';
  assert.strictEqual(verifySignature(bundle, publicKey), SignatureVerificationStatus.INVALID);
});

