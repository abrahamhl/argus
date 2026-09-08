/**
 * Authorization & Scope Validation
 *
 * CRITICAL: ARGUS must never appear to encourage unauthorized assessment.
 * This module enforces explicit scope boundaries and operator acknowledgment.
 */

import type { AuthorizationScope, AssessmentType, ScopeStatus } from '@argus/schema';

export interface ScopeValidationResult {
  allowed: boolean;
  reason?: string;
  scope?: AuthorizationScope;
}

/**
 * Creates an authorization scope for owner-controlled targets.
 *
 * OWNER_AUTHORIZED mode is for:
 * - Your own infrastructure
 * - Domains you legally control
 * - Local development/testing
 *
 * This does NOT provide legal authorization. It is an engineering control
 * that documents the operator's claim of authorization.
 */
export function createOwnerAuthorizedScope(
  targetId: string,
  domains: string[],
  operatorName: string
): AuthorizationScope {
  return {
    scopeId: `scope_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetId,
    assessmentType: 'OWNER_AUTHORIZED',
    allowedDomains: domains,
    allowedCollectors: ['http', 'dns'],
    authorizationBasis: 'Owner/operator of target infrastructure',
    operatorAcknowledgment: `I, ${operatorName}, confirm that I own or have explicit authorization to assess: ${domains.join(', ')}`,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    restrictions: {
      passiveOnly: false,
      publicDataOnly: false,
      noActiveProbing: true // Still no exploitation
    }
  };
}

/**
 * Creates a scope for passive public observation.
 *
 * PUBLIC_PASSIVE_REVIEW mode is for:
 * - Public-facing infrastructure assessment
 * - Passive observation only (HTTP headers, DNS records)
 * - No active probing or exploitation
 * - Research and educational purposes
 *
 * Appropriate for: security research, OSINT, commercial opportunity identification
 */
export function createPublicPassiveScope(
  targetId: string,
  domains: string[],
  purpose: string
): AuthorizationScope {
  return {
    scopeId: `scope_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    targetId,
    assessmentType: 'PUBLIC_PASSIVE_REVIEW',
    allowedDomains: domains,
    allowedCollectors: ['http', 'dns'],
    authorizationBasis: 'Passive observation of publicly accessible infrastructure',
    operatorAcknowledgment: `Purpose: ${purpose}. Limited to passive observation of public data. No active probing.`,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    restrictions: {
      passiveOnly: true,
      publicDataOnly: true,
      noActiveProbing: true
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
  // Check if scope is active
  if (scope.status !== 'ACTIVE') {
    return {
      allowed: false,
      reason: `Scope status is ${scope.status}, not ACTIVE`
    };
  }

  // Check expiration
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

  // Extract domain from URL
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

  // Check if domain is in allowed list
  const isDomainAllowed = scope.allowedDomains.some(allowed => {
    // Exact match
    if (hostname === allowed) return true;
    // Subdomain match (*.example.com)
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

/**
 * Validates whether a collector is authorized for the scope.
 */
export function validateCollectorInScope(
  collectorName: string,
  scope: AuthorizationScope
): boolean {
  return scope.allowedCollectors.includes(collectorName);
}

/**
 * Returns human-readable limitations for a scope.
 */
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

  if (scope.expiresAt) {
    limitations.push(`Scope expires: ${scope.expiresAt}`);
  }

  limitations.push(`Authorization basis: ${scope.authorizationBasis}`);

  return limitations;
}
