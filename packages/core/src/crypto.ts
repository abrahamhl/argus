import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import { Evidence, ArgusBundle } from '@argus/schema';

export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  let res = '{';
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] !== undefined) {
      if (res.length > 1) res += ',';
      res += JSON.stringify(keys[i]) + ':' + canonicalize(obj[keys[i]]);
    }
  }
  res += '}';
  return res;
}

export function hashValue(value: any): string {
  const str = typeof value === 'string' ? value : canonicalize(value);
  return createHash('sha256').update(str).digest('hex');
}

export function verifyEvidence(evidence: Evidence): boolean {
  const expectedHash = hashValue(evidence.rawValue !== undefined ? evidence.rawValue : evidence.normalizedValue);
  return evidence.sha256 === expectedHash;
}

export function verifyEvidenceChain(bundle: ArgusBundle): boolean {
  // 1. Verify all individual evidence
  for (const ev of bundle.evidence) {
    if (!verifyEvidence(ev)) return false;
  }
  
  // 2. Verify bundle hash
  const bundleCopy = { ...bundle, bundleHash: '', signature: undefined }; // Remove hash/sig for verification
  const expectedBundleHash = hashValue(bundleCopy);
  return bundle.bundleHash === expectedBundleHash;
}

export function generateSigningKeyPair() {
  return generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

export function signBundle(bundle: ArgusBundle, privateKeyPem: string, keyId?: string) {
  if (!bundle.bundleHash) {
    throw new Error('Bundle must have a bundleHash before signing.');
  }

  // We sign the bundleHash
  const dataToSign = Buffer.from(bundle.bundleHash, 'utf-8');
  
  const signatureBuffer = sign(null, dataToSign, privateKeyPem);
  
  return {
    algorithm: 'Ed25519',
    keyId,
    signatureHex: signatureBuffer.toString('hex')
  };
}

export enum SignatureVerificationStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  MISSING = 'MISSING',
  UNKNOWN_ALGORITHM = 'UNKNOWN_ALGORITHM'
}

export function verifySignature(bundle: ArgusBundle, publicKeyPem: string): SignatureVerificationStatus {
  if (!bundle.signature) {
    return SignatureVerificationStatus.MISSING;
  }
  
  if (bundle.signature.algorithm !== 'Ed25519') {
    return SignatureVerificationStatus.UNKNOWN_ALGORITHM;
  }
  
  const dataToVerify = Buffer.from(bundle.bundleHash, 'utf-8');
  const signatureBuffer = Buffer.from(bundle.signature.signatureHex, 'hex');
  
  try {
    const isValid = verify(null, dataToVerify, publicKeyPem, signatureBuffer);
    return isValid ? SignatureVerificationStatus.VALID : SignatureVerificationStatus.INVALID;
  } catch {
    return SignatureVerificationStatus.INVALID;
  }
}
