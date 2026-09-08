export type Confidence =
  | 'VERIFIED'
  | 'SUPPORTED'
  | 'INFERRED'
  | 'UNKNOWN'
  | 'CONTRADICTED';

export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EstimatedComplexity =
  | 'TRIVIAL'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'SPECIALIST';

export type OpportunityCategory =
  | 'WEBSITE_REPAIR'
  | 'CUSTOMER_JOURNEY'
  | 'EMAIL_TRUST'
  | 'SECURITY_HARDENING'
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'TECHNICAL_SEO'
  | 'WORDPRESS'
  | 'ECOMMERCE'
  | 'MAINTENANCE'
  | 'MODERNIZATION'
  | 'SPECIALIST_REVIEW';

export type RemediationStatus =
  | 'PROPOSED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'READY_FOR_RETEST'
  | 'VERIFIED'
  | 'FAILED'
  | 'DEFERRED';

export interface Target {
  id: string;
  name: string;
  domains: string[];
}

export interface Run {
  id: string;
  targetId: string;
  timestamp: string;
  argusVersion: string;
  os: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
}

export interface Observation {
  id: string;
  runId: string;
  targetId: string;
  type: string;
  source: string;
  collector: string;
  collectorVersion: string;
  observedAt: string;
  rawValue: any;
}

export interface Evidence {
  id: string;
  targetId: string;
  runId: string;
  type: string;
  source: string;
  collector: string;
  collectorVersion: string;
  observedAt: string;
  rawValue: any;
  normalizedValue: any;
  confidence: Confidence;
  sha256: string;
  metadata?: Record<string, any>;
  relationships?: any[];
}

export interface Finding {
  id: string;
  findingId: string;
  ruleId: string;
  ruleVersion: string;
  target: string;
  targetId: string;
  runId: string;
  title: string;
  description: string;
  technicalExplanation: string;
  remediation: string;
  severity: Severity;
  confidence: Confidence;
  evidenceIds: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  supportingFindingIds: string[];
  confidence: Confidence;
  technicalSignificance: string;
  businessSignificance: string;
  businessArea: string;
  technicalArea: string;
  serviceCategory: OpportunityCategory;
  retestAvailable: boolean;
  needsClientAccess: boolean;
  estimatedComplexity: EstimatedComplexity;
  clientExplanationKey: string;
}

export interface Remediation {
  id: string;
  opportunityId: string;
  problem: string;
  goal: string;
  requiredAccess: string;
  implementationCategory: string;
  verificationMethod: string;
  status: RemediationStatus;
}

export interface Proof {
  id: string;
  targetId: string;
  retestRunId: string;
  originalFindingId: string;
  status: 'NEW' | 'RESOLVED' | 'IMPROVED' | 'UNCHANGED' | 'REGRESSED' | 'UNKNOWN';
  beforeEvidenceIds: string[];
  afterEvidenceIds: string[];
}

export type AssessmentType =
  | 'OWNER_AUTHORIZED'
  | 'SELF_ASSESSMENT'
  | 'PUBLIC_PASSIVE_REVIEW'
  | 'PROFESSIONAL_AUDIT'
  | 'RESEARCH';

export type ScopeStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface AuthorizationScope {
  scopeId: string;
  targetId: string;
  assessmentType: AssessmentType;
  allowedDomains: string[];
  allowedCollectors: string[];
  authorizationBasis: string;
  operatorAcknowledgment: string;
  createdAt: string;
  expiresAt?: string;
  status: ScopeStatus;
  restrictions: {
    passiveOnly: boolean;
    publicDataOnly: boolean;
    noActiveProbing: boolean;
  };
}

export type DataMode = 'LIVE' | 'FIXTURE' | 'DEMO';

export type InspectionStatus = 'STARTED' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface CollectorSummary {
  collector: string;
  version: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  observationCount: number;
  errorCount: number;
  durationMs: number;
}

export interface InspectionWarning {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING';
  context?: Record<string, any>;
}

export interface InspectionError {
  code: string;
  message: string;
  phase: 'VALIDATION' | 'COLLECTION' | 'ANALYSIS' | 'RULE_EVALUATION';
  fatal: boolean;
  stack?: string;
  context?: Record<string, any>;
}

export interface InspectionResultV1 {
  schemaVersion: string;
  runId: string;

  target: {
    input: string;
    normalized: string;
    hostname: string;
    organisationLabel?: string;
    policyMode: string;
    sensitiveCategory?: string;
  };

  status: {
    state: InspectionStatus;
    startedAt: string;
    completedAt: string;
    durationMs: number;
  };

  observations: Observation[];
  evidence: Evidence[];
  findings: Finding[];
  opportunities: Opportunity[];

  collectorSummary: CollectorSummary[];
  warnings: InspectionWarning[];
  errors: InspectionError[];

  dataMode: DataMode;
}
