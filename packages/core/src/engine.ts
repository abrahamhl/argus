import {
  Observation,
  Evidence,
  Finding,
  Opportunity,
  Confidence,
  Severity
} from '@argus/schema';
import { hashValue } from './crypto.js';

export function observationToEvidence(
  observation: Observation,
  normalizeFn: (raw: any) => any,
  confidence: Confidence = 'VERIFIED'
): Evidence {
  const normalizedValue = normalizeFn(observation.rawValue);
  return {
    id: `evd_${hashValue(observation.id + Date.now().toString()).slice(0, 12)}`,
    targetId: observation.targetId,
    runId: observation.runId,
    type: observation.type,
    source: observation.source,
    collector: observation.collector,
    collectorVersion: observation.collectorVersion,
    observedAt: observation.observedAt,
    rawValue: observation.rawValue,
    normalizedValue,
    confidence,
    sha256: hashValue(observation.rawValue)
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
