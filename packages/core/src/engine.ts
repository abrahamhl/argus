import {
  Observation,
  Evidence,
  Finding,
  Opportunity,
  Proof,
  Confidence,
  Severity
} from '@argus/schema';
import { hashValue } from './crypto.js';

/**
 * Deeply freezes an object to guarantee in-memory immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Freeze properties first
  for (const key of Object.getOwnPropertyNames(obj)) {
    const prop = (obj as any)[key];
    if (prop !== null && typeof prop === 'object' && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  }

  return Object.freeze(obj);
}

/**
 * Checks whether an Evidence record is properly frozen and immutable.
 */
export function verifyEvidenceImmutability(evidence: Evidence): boolean {
  if (!Object.isFrozen(evidence)) return false;
  if (evidence.rawValue && typeof evidence.rawValue === 'object' && !Object.isFrozen(evidence.rawValue)) {
    return false;
  }
  if (evidence.normalizedValue && typeof evidence.normalizedValue === 'object' && !Object.isFrozen(evidence.normalizedValue)) {
    return false;
  }
  return true;
}

export interface CreateEvidenceParams {
  id?: string;
  targetId: string;
  runId: string;
  type: string;
  source: string;
  collector: string;
  collectorVersion: string;
  observedAt: string;
  rawValue: any;
  normalizedValue?: any;
  confidence?: Confidence;
  aiAssisted?: boolean;
  metadata?: Record<string, any>;
  relationships?: any[];
}

/**
 * Creates an immutable Evidence record with deterministic hashes and frozen structure.
 * Strict invariant: AI cannot assign VERIFIED by itself.
 */
export function createImmutableEvidence(params: CreateEvidenceParams): Readonly<Evidence> {
  let confidence: Confidence = params.confidence ?? 'VERIFIED';
  const aiAssisted = params.aiAssisted ?? false;

  // Strict Rule: AI cannot assign VERIFIED by itself
  if (aiAssisted && confidence === 'VERIFIED') {
    confidence = 'INFERRED';
  }

  const rawHash = hashValue(params.rawValue);
  const normalizedVal = params.normalizedValue !== undefined ? params.normalizedValue : params.rawValue;
  const normalizedHash = hashValue(normalizedVal);

  const id = params.id || `evd_${hashValue(params.targetId + params.runId + params.type + rawHash).slice(0, 12)}`;

  const evidence: Evidence = {
    id,
    evidenceId: id,
    targetId: params.targetId,
    runId: params.runId,
    type: params.type,
    source: params.source,
    collector: params.collector,
    collectorId: params.collector,
    collectorVersion: params.collectorVersion,
    observedAt: params.observedAt,
    rawValue: params.rawValue,
    normalizedValue: normalizedVal,
    rawHash,
    normalizedHash,
    confidence,
    sha256: rawHash,
    payload: params.rawValue,
    aiAssisted,
    metadata: params.metadata,
    relationships: params.relationships
  };

  return deepFreeze(evidence);
}

export function observationToEvidence(
  observation: Observation,
  normalizeFn: (raw: any) => any,
  confidence: Confidence = 'VERIFIED'
): Readonly<Evidence> {
  const normalizedValue = normalizeFn(observation.rawValue);
  return createImmutableEvidence({
    targetId: observation.targetId,
    runId: observation.runId,
    type: observation.type,
    source: observation.source,
    collector: observation.collector,
    collectorVersion: observation.collectorVersion,
    observedAt: observation.observedAt,
    rawValue: observation.rawValue,
    normalizedValue,
    confidence
  });
}

/**
 * Validates that every Finding references existing, non-empty Evidence IDs.
 */
export function validateFindingLinkage(
  findings: Finding[],
  evidenceList: Evidence[]
): { valid: boolean; errors: string[] } {
  const evidenceIds = new Set(evidenceList.map(e => e.id));
  const errors: string[] = [];

  for (const f of findings) {
    if (!f.evidenceIds || f.evidenceIds.length === 0) {
      errors.push(`Finding ${f.id} (${f.title}) has empty evidenceIds linkage`);
      continue;
    }
    for (const eid of f.evidenceIds) {
      if (!evidenceIds.has(eid)) {
        errors.push(`Finding ${f.id} references missing evidenceId "${eid}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates that every Opportunity references existing, non-empty Finding IDs.
 */
export function validateOpportunityLinkage(
  opportunities: Opportunity[],
  findingsList: Finding[]
): { valid: boolean; errors: string[] } {
  const findingIds = new Set(findingsList.map(f => f.id));
  const errors: string[] = [];

  for (const opp of opportunities) {
    if (!opp.supportingFindingIds || opp.supportingFindingIds.length === 0) {
      errors.push(`Opportunity ${opp.id} (${opp.title}) has empty supportingFindingIds linkage`);
      continue;
    }
    for (const fid of opp.supportingFindingIds) {
      if (!findingIds.has(fid)) {
        errors.push(`Opportunity ${opp.id} references missing findingId "${fid}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates that every Proof references valid before and after evidence.
 */
export function validateProofLinkage(
  proofs: Proof[],
  baselineEvidence: Evidence[],
  retestEvidence: Evidence[]
): { valid: boolean; errors: string[] } {
  const baseIds = new Set(baselineEvidence.map(e => e.id));
  const retestIds = new Set(retestEvidence.map(e => e.id));
  const errors: string[] = [];

  for (const p of proofs) {
    if (!p.beforeEvidenceIds || p.beforeEvidenceIds.length === 0) {
      errors.push(`Proof ${p.id} has empty beforeEvidenceIds`);
    } else {
      for (const bid of p.beforeEvidenceIds) {
        if (!baseIds.has(bid)) {
          errors.push(`Proof ${p.id} references non-existent baseline evidence "${bid}"`);
        }
      }
    }

    if (p.status === 'RESOLVED' || p.status === 'IMPROVED' || p.status === 'UNCHANGED' || p.status === 'REGRESSED') {
      if (!p.afterEvidenceIds || p.afterEvidenceIds.length === 0) {
        errors.push(`Proof ${p.id} with status ${p.status} lacks afterEvidenceIds`);
      } else {
        for (const aid of p.afterEvidenceIds) {
          if (!retestIds.has(aid)) {
            errors.push(`Proof ${p.id} references non-existent retest evidence "${aid}"`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export interface Rule {
  id: string;
  version: string;
  evaluate: (evidence: Evidence[], targetId: string) => Finding[];
}

export function evaluateRules(evidence: Evidence[], rules: Rule[]): Finding[] {
  const findings: Finding[] = [];
  const targetId = evidence.length > 0 ? evidence[0].targetId : 'unknown';
  for (const rule of rules) {
    findings.push(...rule.evaluate(evidence, targetId));
  }
  return findings;
}

export interface OpportunityMapper {
  map: (findings: Finding[]) => Opportunity[];
}

export function mapToOpportunities(findings: Finding[], mapper: OpportunityMapper): Opportunity[] {
  return mapper.map(findings);
}
