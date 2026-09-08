# ARGUS V0.1 — FINAL INTEGRATION CONTRACT

**Version:** 1.0.0  
**Date:** 2026-09-08  
**Status:** PRODUCTION READY

---

## OVERVIEW

This document defines the canonical integration contract for ARGUS V0.1 core inspection pipeline. All external integrations (AGY UI, Z.ai API, DeepSeek rules) MUST adhere to these interfaces.

**Core Principle:** FAIL CLOSED. DNS validation failures block HTTP collection. No silent failures. No invented scores.

---

## INSPECTION REQUEST V1

```typescript
interface InspectRequestV1 {
  domain: string;                                    // Required
  organisationLabel?: string;
  category?: 'ecommerce' | 'corporate' | 'saas';
  policyAcknowledged: boolean;                       // MUST be true
  locale?: 'en' | 'es' | 'nl';

  // Optional rule engine integration
  evaluateFindings?: FindingEvaluator;
  mapOpportunities?: OpportunityMapper;
}
```

**Policy Acknowledgment:**
- MUST be explicitly `true`
- NOT implied by request existence
- Rejects requests with `false` or `undefined`

**Sensitive Targets:**
```typescript
interface InspectOptionsV1 {
  sensitiveCategory?: 'GOVERNMENT' | 'POLICE' | 'MILITARY' | 
                      'DEFENSE' | 'LAW_ENFORCEMENT' | 'CRITICAL_INFRASTRUCTURE';
}
```

When `sensitiveCategory` is set:
- Mode is FORCED to `PASSIVE_ONLY`
- Cannot be overridden
- Logged for audit

---

## INSPECTION RESULT V1

**Canonical Shape:**

```typescript
interface InspectionResultV1 {
  schemaVersion: string;              // "1.0.0"
  runId: string;                      // "run_xxxxx"

  target: {
    input: string;                    // Original input
    normalized: string;               // Full URL
    hostname: string;                 // DNS name
    organisationLabel?: string;
    policyMode: string;               // Effective mode
    sensitiveCategory?: string;
  };

  status: {
    state: 'STARTED' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
    startedAt: string;                // ISO 8601
    completedAt: string;              // ISO 8601
    durationMs: number;
  };

  observations: Observation[];        // Raw collector data
  evidence: Evidence[];               // Verified observations
  findings: Finding[];                // Security findings
  opportunities: Opportunity[];       // Business opportunities

  collectorSummary: CollectorSummary[];
  warnings: InspectionWarning[];
  errors: InspectionError[];

  dataMode: 'LIVE' | 'FIXTURE' | 'DEMO';  // EXPLICIT
}
```

**Status States:**
- `COMPLETED`: All collectors succeeded
- `PARTIAL`: Some collectors failed, has results
- `FAILED`: Fatal validation error
- `STARTED`: Not used in V0.1 (reserved for streaming)

**Data Mode:**
- `LIVE`: Real inspection result
- `FIXTURE`: Test data for development
- `DEMO`: Example data for documentation

**CRITICAL:** `dataMode` is NEVER inferred. Always explicit.

---

## FINDING SHAPE

```typescript
interface Finding {
  id: string;
  findingId: string;                  // Stable identifier
  ruleId: string;
  ruleVersion: string;
  target: string;
  targetId: string;
  runId: string;
  title: string;
  description: string;
  technicalExplanation: string;
  remediation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence: 'VERIFIED' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN' | 'CONTRADICTED';
  evidenceIds: string[];
}
```

**DeepSeek Integration:**
- Implements `FindingEvaluator` function
- Returns `Finding[]` from `Evidence[]`
- Returns `[]` when no rules match
- Never manufactures findings

---

## OPPORTUNITY SHAPE

```typescript
interface Opportunity {
  id: string;
  title: string;
  supportingFindingIds: string[];
  confidence: string;
  technicalSignificance: string;
  businessSignificance: string;
  businessArea: string;
  technicalArea: string;
  serviceCategory: OpportunityCategory;
  retestAvailable: boolean;
  needsClientAccess: boolean;
  estimatedComplexity: 'TRIVIAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECIALIST';
  clientExplanationKey: string;
}
```

**Categories:**
- WEBSITE_REPAIR
- CUSTOMER_JOURNEY
- EMAIL_TRUST
- SECURITY_HARDENING
- PERFORMANCE
- ACCESSIBILITY
- TECHNICAL_SEO
- WORDPRESS
- ECOMMERCE
- MAINTENANCE
- MODERNIZATION
- SPECIALIST_REVIEW

**NO PRICING in core.** AGY owns presentation.

---

## CLIENT ASSESSMENT V1

**Report-Ready Output:**

```typescript
interface ClientAssessmentV1 {
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

  executiveSummary: {
    targetAssessed: string;
    assessmentDate: string;
    findingsCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    opportunitiesIdentified: number;
    overallStatement: string;          // NO INVENTED CLAIMS
  };

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
```

**Executive Summary Rules:**
- NO security score (0-100)
- NO breach probability
- NO financial loss estimates
- NO compliance certifications
- If zero findings: say exactly that
- Never claim target is "secure"

**Transformation:**
```typescript
function generateClientAssessment(
  inspection: InspectionResultV1,
  organisationLabel?: string
): ClientAssessmentV1
```

---

## RETEST COMPARISON V1

```typescript
interface RetestComparisonV1 {
  schemaVersion: string;
  comparisonId: string;

  baseline: {
    runId: string;
    date: string;
    findingsCount: number;
  };

  retest: {
    runId: string;
    date: string;
    findingsCount: number;
  };

  findingChanges: {
    resolved: FindingChange[];
    new: FindingChange[];
    unchanged: FindingChange[];
  };

  evidenceChanges: EvidenceChange[];

  overallChange: 'IMPROVED' | 'UNCHANGED' | 'REGRESSED' | 'INDETERMINATE';

  summary: {
    resolvedCount: number;
    newCount: number;
    unchangedCount: number;
    netChange: number;              // new - resolved
  };
}
```

**Transformation:**
```typescript
function compareInspectionRuns(
  baseline: InspectionResultV1,
  retest: InspectionResultV1
): RetestComparisonV1
```

**NO CERTIFICATES.** Report what changed, nothing more.

---

## RULE ENGINE EXTENSION POINTS

**Finding Evaluator:**
```typescript
type FindingEvaluator = (
  evidence: Evidence[],
  context: EvaluationContext
) => Promise<Finding[]>;

interface EvaluationContext {
  runId: string;
  targetId: string;
  target: string;
  policyMode: string;
  sensitiveCategory?: string;
}
```

**Opportunity Mapper:**
```typescript
type OpportunityMapper = (
  findings: Finding[],
  context: EvaluationContext
) => Promise<Opportunity[]>;
```

**Integration:**
```typescript
const result = await inspectPublicTarget(target, {
  evaluateFindings: myRuleEngine,
  mapOpportunities: myMapper
});
```

**When Absent:**
- Returns `findings: []`
- Returns `opportunities: []`
- Includes `NO_RULE_ENGINE` warning
- Status still `COMPLETED`

---

## ERROR MODEL

```typescript
interface InspectionError {
  code: string;                       // Machine-readable
  message: string;                    // Human-readable
  phase: 'VALIDATION' | 'COLLECTION' | 'ANALYSIS' | 'RULE_EVALUATION';
  fatal: boolean;
  stack?: string;
  context?: Record<string, any>;
}
```

**Error Codes:**

**Validation:**
- `TARGET_VALIDATION_FAILED`: Policy violation
- `MALFORMED_TARGET`: Invalid URL
- `PRIVATE_IP_DETECTED`: Resolves to private IP
- `CREDENTIALS_IN_URL`: Embedded auth
- `DNS_RESOLUTION_FAILED`: DNS failed (FAIL CLOSED)

**Collection:**
- `DNS_COLLECTION_FAILED`: DNS lookup error
- `HTTP_COLLECTION_FAILED`: HTTP request error
- `INSPECTION_FAILED`: General collection error

**Analysis:**
- `FINDING_EVALUATION_FAILED`: Rule engine crashed
- `OPPORTUNITY_MAPPING_FAILED`: Mapper crashed

---

## POLICY MODES

**PUBLIC_PASSIVE:**
- Default mode
- DNS lookups allowed
- HTTP GET requests allowed
- Follows redirects (validated)
- No port scanning
- No active probing

**PASSIVE_ONLY:**
- Enforced for sensitive targets
- Same restrictions as PUBLIC_PASSIVE
- Additional audit logging
- Cannot be downgraded

**What is NOT allowed:**
- Active exploitation
- Port scanning
- Brute force
- Authentication attempts
- Credential testing

---

## FAIL-CLOSED BEHAVIOR

**DNS Validation:**
```
DNS lookup MUST succeed
  ↓
All IPs MUST be public
  ↓
Validation passes
  ↓
HTTP collection proceeds
```

**If DNS fails:**
- Inspection STOPS
- Returns `FAILED` status
- Error: `DNS_RESOLUTION_FAILED`
- NO HTTP request made

**No Silent Failures.**

---

## FIXTURES

**Location:** `packages/core/fixtures/`

**Available:**
1. `example-org-healthy` — Clean baseline
2. `example-com-missing-hsts` — Missing HSTS
3. `example-net-mail-security` — Email issues
4. `example-edu-zero-findings` — No findings
5. `localhost-blocked` — Validation failure

**Access:**
```typescript
import { getFixture, validateFixture } from '@argus/core/fixtures';

const fixture = getFixture('example-org-healthy');
validateFixture(fixture);  // Throws if marked LIVE
```

**All fixtures:**
- Use documentation targets only
- Explicitly marked FIXTURE or DEMO
- Never marked LIVE

---

## INTEGRATION CHECKLIST

**For AGY (UI):**
- [ ] Handle `NO_RULE_ENGINE` warning gracefully
- [ ] Check `dataMode` before rendering
- [ ] Display empty findings as "pending analysis"
- [ ] Never invent security scores
- [ ] Use fixtures for development

**For Z.ai (Deployment):**
- [ ] Enforce `policyAcknowledged: true`
- [ ] Log sensitive category requests
- [ ] Handle FAIL-CLOSED errors correctly
- [ ] Never expose `dataMode: FIXTURE` as LIVE

**For DeepSeek (Rules):**
- [ ] Implement `FindingEvaluator`
- [ ] Implement `OpportunityMapper`
- [ ] Return `[]` when no matches
- [ ] Throw structured errors on failure
- [ ] Never manufacture findings

---

## VERSIONING

**Schema Version:** `1.0.0`

**Breaking Changes:**
- Require new schema version
- Document migration path
- Maintain backward compatibility for 1 version

**Non-Breaking Changes:**
- New optional fields OK
- New error codes OK
- New warning codes OK

---

## SUPPORT

**Core Ownership:** Claude (agent/claude-core)  
**UI Ownership:** AGY (agent/agy-pwa)  
**Rules Ownership:** DeepSeek (agent/deepseek-rules)  
**Deployment:** Z.ai

**Contract Questions:** Refer to this document first.

---

**END OF CONTRACT**
