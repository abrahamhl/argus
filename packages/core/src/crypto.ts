import { createHash } from 'node:crypto';
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
  const expectedHash = hashValue(evidence.rawValue);
  return evidence.sha256 === expectedHash;
}

export function verifyEvidenceChain(bundle: ArgusBundle): boolean {
  // 1. Verify all individual evidence
  for (const ev of bundle.evidence) {
    if (!verifyEvidence(ev)) return false;
  }
  
  // 2. Verify bundle hash
  const bundleCopy = { ...bundle, bundleHash: '' }; // Remove hash for verification
  const expectedBundleHash = hashValue(bundleCopy);
  return bundle.bundleHash === expectedBundleHash;
}
