/**
 * Core Inspection Pipeline
 *
 * Validates targets, collects observations, produces evidence, and
 * integrates with optional rule engine for findings/opportunities.
 */

import type {
  Observation,
  Evidence,
  Finding,
  Opportunity,
  InspectionResultV1,
  CollectorSummary,
  InspectionWarning,
  InspectionError,
  DataMode
} from '@argus/schema';
import { TargetPolicy, InspectionMode, SensitiveCategory } from './policy.js';
import { hashValue } from './crypto.js';
import { URL } from 'node:url';

export interface InspectionOptions {
  mode?: InspectionMode;
  sensitiveCategory?: SensitiveCategory;
  collectHttp?: boolean;
  collectDns?: boolean;
  dataMode?: DataMode;
  fixturePath?: string;
  organisationLabel?: string;
  evaluateFindings?: FindingEvaluator;
  mapOpportunities?: AsyncOpportunityMapper;
}

/**
 * Extension point for rule engine integration.
 * Implementations analyze evidence and produce findings.
 */
export type FindingEvaluator = (
  evidence: Evidence[],
  context: EvaluationContext
) => Promise<Finding[]>;

/**
 * Extension point for opportunity mapping.
 * Implementations analyze findings and produce opportunities.
 */
export type AsyncOpportunityMapper = (
  findings: Finding[],
  context: EvaluationContext
) => Promise<Opportunity[]>;

export interface EvaluationContext {
  runId: string;
  targetId: string;
  target: string;
  policyMode: InspectionMode;
  sensitiveCategory?: SensitiveCategory;
}

/**
 * Main inspection function for public targets.
 * Validates target, collects observations, produces evidence, and optionally evaluates findings.
 *
 * Returns InspectionResultV1 with complete status tracking, error handling, and
 * extension boundaries for rule engine integration.
 */
export async function inspectPublicTarget(
  target: string,
  options: InspectionOptions = {}
): Promise<InspectionResultV1> {
  const startTime = Date.now();
  const startTimeISO = new Date(startTime).toISOString();
  const runId = `run_${hashValue(target + startTimeISO).slice(0, 16)}`;
  const targetId = `tgt_${hashValue(target).slice(0, 12)}`;

  const dataMode = options.dataMode || 'LIVE';
  const warnings: InspectionWarning[] = [];
  const errors: InspectionError[] = [];
  const collectorSummary: CollectorSummary[] = [];

  // Initialize policy
  const policy = new TargetPolicy({
    mode: options.mode || 'PUBLIC_PASSIVE',
    sensitiveCategory: options.sensitiveCategory
  });

  // Validate target - FAIL CLOSED
  const validation = await policy.validate(target);
  if (!validation.allowed) {
    errors.push({
      code: 'TARGET_VALIDATION_FAILED',
      message: validation.reason || 'Target validation failed',
      phase: 'VALIDATION',
      fatal: true
    });

    const endTime = Date.now();
    const url = new URL(target);

    return {
      schemaVersion: '1.0.0',
      runId,
      target: {
        input: target,
        normalized: target,
        hostname: url.hostname,
        organisationLabel: options.organisationLabel,
        policyMode: validation.mode,
        sensitiveCategory: validation.sensitiveCategory
      },
      status: {
        state: 'FAILED',
        startedAt: startTimeISO,
        completedAt: new Date(endTime).toISOString(),
        durationMs: endTime - startTime
      },
      observations: [],
      evidence: [],
      findings: [],
      opportunities: [],
      collectorSummary: [],
      warnings: [],
      errors,
      dataMode
    };
  }

  const url = new URL(target);
  const observations: Observation[] = [];
  const evidence: Evidence[] = [];
  let findings: Finding[] = [];
  let opportunities: Opportunity[] = [];
  let collectionFailed = false;

  try {
    const domain = url.hostname;

    // FIXTURE MODE: Load observations from file instead of collecting
    if (dataMode === 'FIXTURE' && options.fixturePath) {
      try {
        const { readFileSync } = await import('node:fs');
        const fixtureData = JSON.parse(readFileSync(options.fixturePath, 'utf-8'));
        observations.push(...fixtureData.observations);

        collectorSummary.push({
          collector: 'fixture',
          version: '1.0.0',
          status: 'SUCCESS',
          observationCount: fixtureData.observations.length,
          errorCount: 0,
          durationMs: 0
        });
      } catch (error: any) {
        errors.push({
          code: 'FIXTURE_LOAD_FAILED',
          message: `Failed to load fixture: ${error.message}`,
          phase: 'COLLECTION',
          fatal: true
        });
        collectionFailed = true;
      }
    }

    // LIVE MODE: Collect from actual targets
    // Collect DNS if enabled (default: true)
    if (dataMode === 'LIVE' && options.collectDns !== false) {
      const dnsStartTime = Date.now();
      try {
        const { collectDns } = await import('@argus/collectors');
        const dnsObs = await collectDns(domain, runId, targetId);
        observations.push(...dnsObs);

        collectorSummary.push({
          collector: 'dns',
          version: '0.1.0',
          status: 'SUCCESS',
          observationCount: dnsObs.length,
          errorCount: 0,
          durationMs: Date.now() - dnsStartTime
        });
      } catch (error: any) {
        collectorSummary.push({
          collector: 'dns',
          version: '0.1.0',
          status: 'FAILED',
          observationCount: 0,
          errorCount: 1,
          durationMs: Date.now() - dnsStartTime
        });

        errors.push({
          code: 'DNS_COLLECTION_FAILED',
          message: error.message,
          phase: 'COLLECTION',
          fatal: false,
          context: { collector: 'dns' }
        });
      }
    }

    // Collect HTTP if enabled (default: true)
    if (dataMode === 'LIVE' && options.collectHttp !== false) {
      const httpStartTime = Date.now();
      try {
        const { collectHttp } = await import('@argus/collectors');

        const httpObservations = await collectHttp(target, runId, targetId);
        observations.push(...httpObservations);

        collectorSummary.push({
          collector: 'http',
          version: '0.1.0',
          status: 'SUCCESS',
          observationCount: httpObservations.length,
          errorCount: 0,
          durationMs: Date.now() - httpStartTime
        });
      } catch (error: any) {
        collectorSummary.push({
          collector: 'http',
          version: '0.1.0',
          status: 'FAILED',
          observationCount: 0,
          errorCount: 1,
          durationMs: Date.now() - httpStartTime
        });

        errors.push({
          code: 'HTTP_COLLECTION_FAILED',
          message: error.message,
          phase: 'COLLECTION',
          fatal: false,
          context: { collector: 'http' }
        });

        collectionFailed = true;
      }
    }

    // Convert observations to evidence
    for (const obs of observations) {
      const evd: Evidence = {
        id: `evd_${hashValue(obs.id + runId).slice(0, 12)}`,
        targetId: targetId,
        runId,
        type: obs.type,
        source: obs.source,
        collector: obs.collector,
        collectorVersion: obs.collectorVersion,
        observedAt: obs.observedAt,
        rawValue: obs.rawValue,
        normalizedValue: obs.rawValue,
        confidence: 'VERIFIED',
        sha256: hashValue(obs.rawValue)
      };
      evidence.push(evd);
    }

    // Evaluate findings if rule engine is provided
    if (options.evaluateFindings) {
      try {
        const context: EvaluationContext = {
          runId,
          targetId,
          target,
          policyMode: validation.mode,
          sensitiveCategory: validation.sensitiveCategory
        };

        findings = await options.evaluateFindings(evidence, context);
      } catch (error: any) {
        errors.push({
          code: 'FINDING_EVALUATION_FAILED',
          message: error.message,
          phase: 'RULE_EVALUATION',
          fatal: false,
          stack: error.stack
        });
      }
    } else {
      warnings.push({
        code: 'NO_RULE_ENGINE',
        message: 'No rule engine connected. Findings evaluation skipped.',
        severity: 'INFO'
      });
    }

    // Map opportunities if mapper is provided
    if (options.mapOpportunities && findings.length > 0) {
      try {
        const context: EvaluationContext = {
          runId,
          targetId,
          target,
          policyMode: validation.mode,
          sensitiveCategory: validation.sensitiveCategory
        };

        opportunities = await options.mapOpportunities(findings, context);
      } catch (error: any) {
        errors.push({
          code: 'OPPORTUNITY_MAPPING_FAILED',
          message: error.message,
          phase: 'ANALYSIS',
          fatal: false,
          stack: error.stack
        });
      }
    } else if (findings.length > 0 && !options.mapOpportunities) {
      warnings.push({
        code: 'NO_OPPORTUNITY_MAPPER',
        message: 'No opportunity mapper connected. Opportunity mapping skipped.',
        severity: 'INFO'
      });
    }
  } catch (error: any) {
    errors.push({
      code: 'INSPECTION_FAILED',
      message: error.message,
      phase: 'COLLECTION',
      fatal: true,
      stack: error.stack
    });

    collectionFailed = true;
  }

  const endTime = Date.now();
  const hasFatalError = errors.some(e => e.fatal);
  const status = hasFatalError ? 'FAILED' : collectionFailed ? 'PARTIAL' : 'COMPLETED';

  return {
    schemaVersion: '1.0.0',
    runId,
    target: {
      input: target,
      normalized: url.href,
      hostname: url.hostname,
      organisationLabel: options.organisationLabel,
      policyMode: validation.mode,
      sensitiveCategory: validation.sensitiveCategory
    },
    status: {
      state: status,
      startedAt: startTimeISO,
      completedAt: new Date(endTime).toISOString(),
      durationMs: endTime - startTime
    },
    observations,
    evidence,
    findings,
    opportunities,
    collectorSummary,
    warnings,
    errors,
    dataMode
  };
}
