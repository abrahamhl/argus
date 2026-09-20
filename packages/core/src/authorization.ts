/**
 * Authorization & Scope Validation Gate
 *
 * CRITICAL: ARGUS must never perform or encourage unauthorized assessments.
 * Section 5 & 6 Invariant:
 * No collector executes until:
 *   1. Target exists
 *   2. Run exists
 *   3. Scope is valid
 *   4. Authorization policy allows the operation.
 */

import type {
  AuthorizationScope,
  AssessmentType,
  ScopeStatus,
  Target,
  Run
} from '@argus/schema';

export interface ScopeValidationResult {
  allowed: boolean;
  reason?: string;
  scope?: AuthorizationScope;
}

export interface ScopeGateParams {
  target: Target;
  run: Run;
  scope: AuthorizationScope;
  collectorName: string;
  targetUrl?: string;
}

export interface ScopeGateDecision {
  allowed: boolean;
  reason?: string;
  details?: {
    targetVerified: boolean;
    runVerified: boolean;
    scopeActive: boolean;
    collectorPermitted: boolean;
  };
}

export const PUBLIC_POSTURE_ALLOWED_COLLECTORS = [
  'dns',
  'tls',
  'http',
  'email-security',
  'security-txt',
  'metadata'
];

/**
 * Creates an authorization scope for PUBLIC POSTURE.
 * Strictly limited to passive, public observations without exploitation,
 * brute force, fuzzing, or secret hunting.
 */
export function createPublicPostureScope(
  targetId: string,
  domains: string[],
  operatorName: string = 'Anonymous'
): AuthorizationScope {
  return {
    scopeId: `scope_pub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetId,
    assessmentType: 'PUBLIC_POSTURE',
    allowedDomains: domains,
    allowedCollectors: [...PUBLIC_POSTURE_ALLOWED_COLLECTORS],
    authorizationBasis: 'Passive observation of public posture (DNS, TLS, HTTP headers, public metadata)',
    operatorAcknowledgment: `Operator ${operatorName} acknowledges strictly passive public posture mode. No active probing or exploitation.`,
    operator: operatorName,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    restrictions: {
      passiveOnly: true,
      publicDataOnly: true,
      noActiveProbing: true,
      noExploitation: true,
      noBruteForce: true,
      noFuzzing: true,
      noSecretHunting: true,
      noCredentialTesting: true
    }
  };
}

/**
 * Creates an AUTHORIZED ASSESSMENT scope.
 * Requires explicit target authorization metadata, operator acknowledgment,
 * and records tool versions. Non-destructive by default.
 */
export function createAuthorizedAssessmentScope(
  targetId: string,
  domains: string[],
  operatorName: string,
  authorizationBasis: string,
  toolVersions: Record<string, string> = { argus: '0.1.0' },
  expiresInHours: number = 72
): AuthorizationScope {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

  return {
    scopeId: `scope_auth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetId,
    assessmentType: 'AUTHORIZED_ASSESSMENT',
    allowedDomains: domains,
    allowedCollectors: [...PUBLIC_POSTURE_ALLOWED_COLLECTORS, 'diagnostic-adapter'],
    authorizationBasis,
    operatorAcknowledgment: `I, ${operatorName}, certify that explicit authorization has been obtained for target(s): ${domains.join(', ')} under basis: ${authorizationBasis}`,
    operator: operatorName,
    toolVersions,
    createdAt: now.toISOString(),
    expiresAt,
    status: 'ACTIVE',
    restrictions: {
      passiveOnly: false,
      publicDataOnly: false,
      noActiveProbing: false,
      noExploitation: true, // Non-destructive verification ONLY
      noBruteForce: true,
      noFuzzing: true,
      noSecretHunting: false,
      noCredentialTesting: true
    }
  };
}

/**
 * Legacy owner-authorized scope for backwards compatibility.
 */
export function createOwnerAuthorizedScope(
  targetId: string,
  domains: string[],
  operatorName: string
): AuthorizationScope {
  return createAuthorizedAssessmentScope(
    targetId,
    domains,
    operatorName,
    'Owner/operator of target infrastructure'
  );
}

/**
 * Legacy public passive scope for backwards compatibility.
 */
export function createPublicPassiveScope(
  targetId: string,
  domains: string[],
  purpose: string
): AuthorizationScope {
  const scope = createPublicPostureScope(targetId, domains, purpose);
  scope.assessmentType = 'PUBLIC_PASSIVE_REVIEW';
  return scope;
}

/**
 * Section 6 Scope Gate:
 * Evaluates whether a collector is authorized to run against a target.
 * Fail-Closed: any missing or invalid component rejects execution.
 */
export function evaluateScopeGate(params: ScopeGateParams): ScopeGateDecision {
  // 1. Target validation
  if (!params.target || !params.target.id || !params.target.domains || params.target.domains.length === 0) {
    return {
      allowed: false,
      reason: 'ScopeGate rejected: Target does not exist, has no ID, or has no declared domains.'
    };
  }

  // 2. Run validation
  if (!params.run || !params.run.id) {
    return {
      allowed: false,
      reason: 'ScopeGate rejected: Run does not exist or has no ID.'
    };
  }

  if (params.run.targetId !== params.target.id) {
    return {
      allowed: false,
      reason: `ScopeGate rejected: Run targetId (${params.run.targetId}) does not match Target ID (${params.target.id}).`
    };
  }

  if (params.run.status !== 'STARTED') {
    return {
      allowed: false,
      reason: `ScopeGate rejected: Run status is ${params.run.status}, must be STARTED.`
    };
  }

  // 3. Scope validation
  if (!params.scope || !params.scope.scopeId) {
    return {
      allowed: false,
      reason: 'ScopeGate rejected: Scope does not exist or has no ID.'
    };
  }

  if (params.scope.targetId !== params.target.id) {
    return {
      allowed: false,
      reason: `ScopeGate rejected: Scope targetId (${params.scope.targetId}) does not match Target ID (${params.target.id}).`
    };
  }

  if (params.scope.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: `ScopeGate rejected: Scope status is ${params.scope.status}, must be ACTIVE.`
    };
  }

  if (params.scope.expiresAt) {
    const now = new Date();
    const expiry = new Date(params.scope.expiresAt);
    if (now > expiry) {
      return {
        allowed: false,
        reason: `ScopeGate rejected: Scope expired at ${params.scope.expiresAt}.`
      };
    }
  }

  // 4. Collector validation in scope
  if (!params.scope.allowedCollectors.includes(params.collectorName)) {
    return {
      allowed: false,
      reason: `ScopeGate rejected: Collector "${params.collectorName}" is not permitted in scope.`
    };
  }

  // 5. Target URL in scope (if URL provided)
  if (params.targetUrl) {
    const urlValidation = validateTargetInScope(params.targetUrl, params.scope);
    if (!urlValidation.allowed) {
      return {
        allowed: false,
        reason: `ScopeGate rejected: Target URL not within authorized domains: ${urlValidation.reason}`
      };
    }
  }

  // 6. Prohibited modes check
  if (params.scope.assessmentType === 'PUBLIC_POSTURE') {
    if (!PUBLIC_POSTURE_ALLOWED_COLLECTORS.includes(params.collectorName)) {
      return {
        allowed: false,
        reason: `ScopeGate rejected: Collector "${params.collectorName}" violates PUBLIC_POSTURE non-intrusive boundary.`
      };
    }
  }

  return {
    allowed: true,
    details: {
      targetVerified: true,
      runVerified: true,
      scopeActive: true,
      collectorPermitted: true
    }
  };
}

/**
 * Validates whether a target URL is within an authorized scope.
 */
export function validateTargetInScope(
  targetUrl: string,
  scope: AuthorizationScope
): ScopeValidationResult {
  if (scope.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: `Scope status is ${scope.status}, not ACTIVE`
    };
  }

  if (scope.expiresAt) {
    const now = new Date();
    const expiry = new Date(scope.expiresAt);
    if (now > expiry) {
      return {
        allowed: false,
        reason: `Scope expired at ${scope.expiresAt}`
      };
    }
  }

  let hostname: string;
  try {
    const url = new URL(targetUrl);
    hostname = url.hostname;
  } catch {
    return {
      allowed: false,
      reason: 'Invalid target URL format'
    };
  }

  const isDomainAllowed = scope.allowedDomains.some(allowed => {
    if (hostname === allowed) return true;
    if (allowed.startsWith('*.')) {
      const baseDomain = allowed.slice(2);
      return hostname.endsWith(`.${baseDomain}`) || hostname === baseDomain;
    }
    return false;
  });

  if (!isDomainAllowed) {
    return {
      allowed: false,
      reason: `Domain ${hostname} not in authorized scope. Allowed: ${scope.allowedDomains.join(', ')}`
    };
  }

  return {
    allowed: true,
    scope
  };
}

export function validateCollectorInScope(
  collectorName: string,
  scope: AuthorizationScope
): boolean {
  return scope.allowedCollectors.includes(collectorName);
}

export function getScopeLimitations(scope: AuthorizationScope): string[] {
  const limitations: string[] = [];

  limitations.push(`Assessment type: ${scope.assessmentType}`);
  limitations.push(`Authorized domains: ${scope.allowedDomains.join(', ')}`);

  if (scope.restrictions.passiveOnly) {
    limitations.push('Passive observation only - no active probing');
  }

  if (scope.restrictions.publicDataOnly) {
    limitations.push('Limited to publicly accessible data');
  }

  if (scope.restrictions.noActiveProbing) {
    limitations.push('No exploitation or active vulnerability testing');
  }

  if (scope.restrictions.noExploitation) {
    limitations.push('Strictly non-destructive verification; no exploitation payloads');
  }

  if (scope.expiresAt) {
    limitations.push(`Scope expires: ${scope.expiresAt}`);
  }

  limitations.push(`Authorization basis: ${scope.authorizationBasis}`);

  return limitations;
}
