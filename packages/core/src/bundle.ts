import { readFileSync, writeFileSync } from 'node:fs';
import { ArgusBundle } from '@argus/schema';
import { hashValue, verifyEvidenceChain } from './crypto.js';
import * as os from 'node:os';

export function createBundle(
  inspectionResult: any,
  proofs: any[] = []
): ArgusBundle {
  const bundle: ArgusBundle = {
    schemaVersion: '1.0.0',
    argusVersion: process.env.npm_package_version || '0.1.0',
    os: `${os.platform()} ${os.release()}`,
    runtime: `Node.js ${process.version}`,
    collectorVersions: {
      http: '0.1.0',
      dns: '0.1.0'
    },
    policyManifest: {
      mode: inspectionResult.target.policyMode,
      sensitiveCategory: inspectionResult.target.sensitiveCategory
    },
    target: {
      input: inspectionResult.target.input,
      normalized: inspectionResult.target.normalized,
      hostname: inspectionResult.target.hostname
    },
    run: {
      id: inspectionResult.runId,
      timestamp: inspectionResult.status.startedAt,
      durationMs: inspectionResult.status.durationMs
    },
    observations: inspectionResult.observations,
    evidence: inspectionResult.evidence,
    findings: inspectionResult.findings,
    opportunities: inspectionResult.opportunities,
    proofs,
    bundleHash: ''
  };

  bundle.bundleHash = hashValue(bundle);
  return bundle;
}

export function saveBundle(bundle: ArgusBundle, path: string): void {
  // Ensure hash is up to date
  const oldHash = bundle.bundleHash;
  const toHash = { ...bundle, bundleHash: '', signature: undefined };
  bundle.bundleHash = hashValue(toHash);
  if (bundle.bundleHash !== oldHash && bundle.signature) {
    bundle.signature = undefined; // Drop signature if modified
  }
  writeFileSync(path, JSON.stringify(bundle, null, 2), 'utf-8');
}

import { redactEvidence } from './rules.js';

export function exportBundle(bundle: ArgusBundle): ArgusBundle {
  const exported = JSON.parse(JSON.stringify(bundle)) as ArgusBundle;

  exported.evidence = exported.evidence.map(ev => {
    const redacted = redactEvidence(ev);
    redacted.rawValue = undefined; // Strip rawValue
    // Recompute evidence hash because rawValue is gone
    redacted.sha256 = hashValue(redacted.normalizedValue); 
    return redacted;
  });

  // Recompute bundle hash
  const toHash = { ...exported, bundleHash: '', signature: undefined };
  exported.bundleHash = hashValue(toHash);
  exported.signature = undefined;

  return exported;
}

export function loadBundle(path: string): ArgusBundle {
  const data = readFileSync(path, 'utf-8');
  const bundle = JSON.parse(data) as ArgusBundle;
  
  if (!verifyEvidenceChain(bundle)) {
    throw new Error(`Bundle integrity verification failed for ${path}`);
  }
  
  return bundle;
}
