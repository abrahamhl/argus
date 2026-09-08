/**
 * Deterministic Rules Engine
 *
 * STUB: This file contains minimal exports to allow compilation.
 * Full implementation in PHASE 7.
 */

import type { Evidence, Finding } from '@argus/schema';

export interface Rule {
  id: string;
  version: string;
  evaluate: (evidence: Evidence[]) => Finding[];
}

export const RULES: Rule[] = [];

export function runRules(evidence: Evidence[]): Finding[] {
  return [];
}

export function runRulesByIds(evidence: Evidence[], ruleIds: string[]): Finding[] {
  return [];
}

export function canonical(value: any): any {
  return value;
}

export function stableFindingId(ruleId: string, targetId: string, canonicalInputs: any[]): string {
  return `finding_stub_${ruleId}_${targetId}`;
}

export function redact(value: any): any {
  return value;
}

export function redactEvidence(evidence: Evidence): Evidence {
  return evidence;
}

export function mapFindingsToOpportunities(findings: Finding[]): any[] {
  return [];
}
