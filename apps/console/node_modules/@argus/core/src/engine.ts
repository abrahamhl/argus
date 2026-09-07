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
  evaluate: (evidence: Evidence[]) => Finding[];
}

export function evaluateRules(evidence: Evidence[], rules: Rule[]): Finding[] {
  const findings: Finding[] = [];
  for (const rule of rules) {
    findings.push(...rule.evaluate(evidence));
  }
  return findings;
}

export interface OpportunityMapper {
  map: (findings: Finding[]) => Opportunity[];
}

export function mapToOpportunities(findings: Finding[], mapper: OpportunityMapper): Opportunity[] {
  return mapper.map(findings);
}
