import { describe, it, expect } from 'vitest';
import { canonicalize, hashValue, verifyEvidence, verifyEvidenceChain, generateSigningKeyPair, signBundle, verifySignature, SignatureVerificationStatus } from './crypto.js';
import { Evidence, ArgusBundle } from '@argus/schema';

describe('Crypto module', () => {
  it('canonicalize sorts keys and serializes correctly', () => {
    const obj1 = { b: 2, a: 1 };
    const obj2 = { a: 1, b: 2 };
    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(canonicalize(obj1)).toBe('{"a":1,"b":2}');
  });

  it('verifyEvidence detects tampering', () => {
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
    
    expect(verifyEvidence(ev)).toBe(true);
    
    ev.rawValue = { status: 500 }; // Tamper
    expect(verifyEvidence(ev)).toBe(false);
  });

  it('verifyEvidenceChain detects bundle tampering', () => {
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
    expect(verifyEvidenceChain(bundle)).toBe(true);
    
    bundle.target.hostname = 'evil.com';
    expect(verifyEvidenceChain(bundle)).toBe(false);
  });

  it('Ed25519 signing and verification works', () => {
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
    expect(bundle.signature.algorithm).toBe('Ed25519');
    
    expect(verifySignature(bundle, publicKey)).toBe(SignatureVerificationStatus.VALID);
    
    bundle.bundleHash = 'tampered_hash';
    expect(verifySignature(bundle, publicKey)).toBe(SignatureVerificationStatus.INVALID);
  });
});



