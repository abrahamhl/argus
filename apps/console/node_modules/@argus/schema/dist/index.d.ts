export type Confidence = 'VERIFIED' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN' | 'CONTRADICTED';
export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EstimatedComplexity = 'TRIVIAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECIALIST';
export type OpportunityCategory = 'WEBSITE_REPAIR' | 'CUSTOMER_JOURNEY' | 'EMAIL_TRUST' | 'SECURITY_HARDENING' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'TECHNICAL_SEO' | 'WORDPRESS' | 'ECOMMERCE' | 'MAINTENANCE' | 'MODERNIZATION' | 'SPECIALIST_REVIEW';
export type RemediationStatus = 'PROPOSED' | 'PLANNED' | 'IN_PROGRESS' | 'READY_FOR_RETEST' | 'VERIFIED' | 'FAILED' | 'DEFERRED';
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
    targetId: string;
    runId: string;
    title: string;
    description: string;
    severity: Severity;
    confidence: Confidence;
    evidenceIds: string[];
}
export interface Opportunity {
    id: string;
    title: string;
    supportingFindingIds: string[];
    confidence: Confidence;
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
//# sourceMappingURL=index.d.ts.map