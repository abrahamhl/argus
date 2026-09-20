/**
 * Confidence Engine
 *
 * Enforces explicit confidence states across observations, evidence, and findings.
 * Section 8 Invariants:
 * - VERIFIED: Direct deterministic observation (e.g. raw DNS record, HTTP response status/header).
 * - SUPPORTED: Multiple corroborating signals but not direct conclusive proof.
 * - INFERRED: Reasonable technical derivation requiring operational assumptions.
 * - UNKNOWN: Insufficient evidence available to evaluate assertion.
 * - CONTRADICTED: Evidence actively conflicts with the claim or finding.
 *
 * CRITICAL RULE: AI cannot assign VERIFIED by itself.
 */

import type { Confidence } from '@argus/schema';

export interface ConfidenceMetadata {
  confidence: Confidence;
  description: string;
  deterministic: boolean;
  requiresCorroboration: boolean;
  allowsAiAssignment: boolean;
}

export const CONFIDENCE_REGISTRY: Record<Confidence, ConfidenceMetadata> = {
  VERIFIED: {
    confidence: 'VERIFIED',
    description: 'Direct deterministic observation via validated collector. No assumptions required.',
    deterministic: true,
    requiresCorroboration: false,
    allowsAiAssignment: false // Strict rule: AI cannot assign VERIFIED
  },
  SUPPORTED: {
    confidence: 'SUPPORTED',
    description: 'Multiple corroborating signals support the claim, though not a direct proof.',
    deterministic: false,
    requiresCorroboration: true,
    allowsAiAssignment: false
  },
  INFERRED: {
    confidence: 'INFERRED',
    description: 'Reasonable derivation or deduction requiring heuristics or assumptions.',
    deterministic: false,
    requiresCorroboration: false,
    allowsAiAssignment: true
  },
  UNKNOWN: {
    confidence: 'UNKNOWN',
    description: 'Insufficient or inaccessible evidence to evaluate the claim.',
    deterministic: true,
    requiresCorroboration: false,
    allowsAiAssignment: true
  },
  CONTRADICTED: {
    confidence: 'CONTRADICTED',
    description: 'Observed evidence actively refutes or contradicts the claim.',
    deterministic: true,
    requiresCorroboration: false,
    allowsAiAssignment: true
  }
};

export interface ConfidenceEvaluationSignal {
  source: string;
  supports: boolean;
  contradicts?: boolean;
  deterministic?: boolean;
  aiAssisted?: boolean;
}

/**
 * Deterministically calculates the confidence level of a claim given corroborating signals.
 */
export function evaluateSignalsConfidence(
  signals: ConfidenceEvaluationSignal[],
  isAiGenerated: boolean = false
): Confidence {
  if (!signals || signals.length === 0) {
    return 'UNKNOWN';
  }

  // Any active contradiction forces CONTRADICTED
  if (signals.some(s => s.contradicts)) {
    return 'CONTRADICTED';
  }

  const supportingSignals = signals.filter(s => s.supports);
  if (supportingSignals.length === 0) {
    return 'UNKNOWN';
  }

  // If AI generated the claim or any critical component, it CANNOT be VERIFIED
  if (isAiGenerated || supportingSignals.some(s => s.aiAssisted)) {
    return supportingSignals.length > 1 ? 'SUPPORTED' : 'INFERRED';
  }

  // A single direct deterministic signal yields VERIFIED
  if (supportingSignals.length === 1 && supportingSignals[0].deterministic) {
    return 'VERIFIED';
  }

  // Multiple deterministic signals yield VERIFIED
  if (supportingSignals.every(s => s.deterministic)) {
    return 'VERIFIED';
  }

  // Multiple signals with at least one non-deterministic signal yield SUPPORTED
  if (supportingSignals.length > 1) {
    return 'SUPPORTED';
  }

  return 'INFERRED';
}

/**
 * Enforces the AI confidence boundary on an assigned confidence value.
 * Clamps VERIFIED to INFERRED for any AI-assisted input.
 */
export function sanitizeConfidenceForAi(
  assignedConfidence: Confidence,
  isAiAssisted: boolean
): Confidence {
  if (isAiAssisted && assignedConfidence === 'VERIFIED') {
    return 'INFERRED';
  }
  return assignedConfidence;
}
