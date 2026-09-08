/**
 * Client Assessment Model
 *
 * Transforms InspectionResultV1 into a report-ready format suitable for
 * client presentation without invented scores or unsubstantiated claims.
 */

import type {
  InspectionResultV1,
  Finding,
  Opportunity,
  Severity
} from '@argus/schema';

export interface ClientAssessmentV1 {
  schemaVersion: string;
  assessmentId: string;

  organisation?: string;
  target: {
    input: string;
    normalized: string;
    hostname: string;
  };

  inspectionMode: string;
  date: string;

  executiveSummary: ExecutiveSummary;
  verifiedFindings: FindingSummary[];
  opportunities: OpportunitySummary[];
  recommendedActions: string[];

  limitations: string[];
  retestAvailable: boolean;

  evidenceReferences: {
    observationCount: number;
    evidenceCount: number;
    collectorSummary: string[];
  };

  dataMode: 'LIVE' | 'FIXTURE' | 'DEMO';
}

export interface ExecutiveSummary {
  targetAssessed: string;
  assessmentDate: string;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  opportunitiesIdentified: number;
  overallStatement: string;
}

export interface FindingSummary {
  id: string;
  title: string;
  severity: Severity;
  confidence: string;
  description: string;
  technicalExplanation: string;
  remediation: string;
  evidenceCount: number;
}

export interface OpportunitySummary {
  id: string;
  title: string;
  category: string;
  businessArea: string;
  technicalArea: string;
  complexity: string;
  retestAvailable: boolean;
  businessSignificance: string;
  recommendedAction: string;
}

/**
 * Generates a client-ready assessment report from an inspection result.
 *
 * CRITICAL RULES:
 * - NO invented security scores
 * - NO breach probability claims
 * - NO financial loss estimates
 * - NO compliance certifications (GDPR, NIS2, etc.)
 * - If zero findings: say exactly that, don't claim "secure"
 */
export function generateClientAssessment(
  inspection: InspectionResultV1,
  organisationLabel?: string
): ClientAssessmentV1 {
  const findingsBySeverity = categorizeFindings(inspection.findings);

  const executiveSummary: ExecutiveSummary = {
    targetAssessed: inspection.target.hostname,
    assessmentDate: inspection.status.startedAt,
    findingsCount: inspection.findings.length,
    criticalCount: findingsBySeverity.CRITICAL,
    highCount: findingsBySeverity.HIGH,
    mediumCount: findingsBySeverity.MEDIUM,
    lowCount: findingsBySeverity.LOW,
    opportunitiesIdentified: inspection.opportunities.length,
    overallStatement: generateOverallStatement(inspection.findings, inspection.warnings)
  };

  const verifiedFindings: FindingSummary[] = inspection.findings.map(f => ({
    id: f.findingId,
    title: f.title,
    severity: f.severity,
    confidence: f.confidence,
    description: f.description,
    technicalExplanation: f.technicalExplanation,
    remediation: f.remediation,
    evidenceCount: f.evidenceIds.length
  }));

  const opportunities: OpportunitySummary[] = inspection.opportunities.map(opp => ({
    id: opp.id,
    title: opp.title,
    category: opp.serviceCategory,
    businessArea: opp.businessArea,
    technicalArea: opp.technicalArea,
    complexity: opp.estimatedComplexity,
    retestAvailable: opp.retestAvailable,
    businessSignificance: opp.businessSignificance,
    recommendedAction: opp.technicalSignificance
  }));

  const recommendedActions = generateRecommendedActions(
    inspection.findings,
    inspection.opportunities
  );

  const limitations = generateLimitations(
    inspection.target.policyMode,
    inspection.warnings
  );

  return {
    schemaVersion: '1.0.0',
    assessmentId: `asmt_${inspection.runId.replace('run_', '')}`,
    organisation: organisationLabel,
    target: {
      input: inspection.target.input,
      normalized: inspection.target.normalized,
      hostname: inspection.target.hostname
    },
    inspectionMode: inspection.target.policyMode,
    date: inspection.status.startedAt,
    executiveSummary,
    verifiedFindings,
    opportunities,
    recommendedActions,
    limitations,
    retestAvailable: true,
    evidenceReferences: {
      observationCount: inspection.observations.length,
      evidenceCount: inspection.evidence.length,
      collectorSummary: inspection.collectorSummary.map(
        cs => `${cs.collector} (v${cs.version}): ${cs.status}`
      )
    },
    dataMode: inspection.dataMode
  };
}

function categorizeFindings(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0
  };

  findings.forEach(f => {
    counts[f.severity]++;
  });

  return counts;
}

function generateOverallStatement(findings: Finding[], warnings: any[]): string {
  if (findings.length === 0) {
    const hasRuleEngineWarning = warnings.some(w => w.code === 'NO_RULE_ENGINE');

    if (hasRuleEngineWarning) {
      return 'Infrastructure data collected successfully. No configured deterministic rules produced findings at this time. This does not constitute a security certification.';
    }

    return 'No findings were identified by the configured rule set. This assessment is limited to the specific checks performed and does not guarantee absence of all vulnerabilities.';
  }

  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;

  if (critical > 0) {
    return `Assessment identified ${critical} critical ${critical === 1 ? 'finding' : 'findings'} requiring immediate attention, along with ${high + medium} additional ${high + medium === 1 ? 'finding' : 'findings'}.`;
  }

  if (high > 0) {
    return `Assessment identified ${high} high-severity ${high === 1 ? 'finding' : 'findings'} and ${medium} medium-severity ${medium === 1 ? 'finding' : 'findings'} that should be addressed.`;
  }

  if (medium > 0) {
    return `Assessment identified ${medium} medium-severity ${medium === 1 ? 'finding' : 'findings'} that should be reviewed and addressed.`;
  }

  return `Assessment identified ${findings.length} low-severity ${findings.length === 1 ? 'finding' : 'findings'} for review.`;
}

function generateRecommendedActions(
  findings: Finding[],
  opportunities: Opportunity[]
): string[] {
  const actions: string[] = [];

  // Critical findings first
  const critical = findings.filter(f => f.severity === 'CRITICAL');
  if (critical.length > 0) {
    actions.push(
      `Address ${critical.length} critical ${critical.length === 1 ? 'finding' : 'findings'} immediately`
    );
  }

  // High-severity findings
  const high = findings.filter(f => f.severity === 'HIGH');
  if (high.length > 0) {
    actions.push(
      `Review and remediate ${high.length} high-severity ${high.length === 1 ? 'finding' : 'findings'}`
    );
  }

  // Opportunities requiring no client access
  const quickWins = opportunities.filter(
    opp => !opp.needsClientAccess && opp.estimatedComplexity === 'TRIVIAL'
  );
  if (quickWins.length > 0) {
    actions.push(
      `Implement ${quickWins.length} quick-win ${quickWins.length === 1 ? 'improvement' : 'improvements'} (no client access required)`
    );
  }

  // Retest after remediation
  const retestableOpps = opportunities.filter(opp => opp.retestAvailable);
  if (retestableOpps.length > 0) {
    actions.push(
      'Schedule retest after remediation to verify improvements'
    );
  }

  if (actions.length === 0) {
    actions.push('Continue monitoring and maintain current security posture');
  }

  return actions;
}

function generateLimitations(policyMode: string, warnings: any[]): string[] {
  const limitations: string[] = [
    'Assessment performed using passive observation techniques only',
    'No active exploitation or penetration testing conducted',
    'Assessment limited to externally observable infrastructure',
    'Findings based on configured deterministic rules only',
    'Assessment does not constitute a complete security audit',
    'Results represent point-in-time observations'
  ];

  if (policyMode === 'PASSIVE_ONLY') {
    limitations.push('Enhanced passive-only mode enforced due to target sensitivity');
  }

  const hasRuleEngineWarning = warnings.some(w => w.code === 'NO_RULE_ENGINE');
  if (hasRuleEngineWarning) {
    limitations.push('Rule engine integration pending - findings analysis not yet complete');
  }

  return limitations;
}
