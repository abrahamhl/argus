/**
 * API-Ready Service for ARGUS V0.1
 *
 * Provides explicit, policy-checked inspection interface suitable for
 * external API integration (e.g., Z.ai deployment).
 */

import type { InspectionResultV1 } from '@argus/schema';
import { inspectPublicTarget, type FindingEvaluator, type OpportunityMapper } from './inspector.js';
import type { SensitiveCategory } from './policy.js';

export interface InspectRequestV1 {
  domain: string;
  organisationLabel?: string;
  category?: 'ecommerce' | 'corporate' | 'saas';
  policyAcknowledged: boolean;
  locale?: 'en' | 'es' | 'nl';

  // Optional rule engine integration
  evaluateFindings?: FindingEvaluator;
  mapOpportunities?: OpportunityMapper;
}

export interface InspectOptionsV1 {
  sensitiveCategory?: SensitiveCategory;
}

/**
 * Inspects a public target with explicit policy acknowledgment.
 *
 * CRITICAL REQUIREMENTS:
 * - Policy acknowledgment MUST be explicit (not implied)
 * - Sensitive categories ENFORCE passive-only mode
 * - NO active scanning
 * - NO port scanning
 * - NO brute force
 * - NO exploitation
 * - NO authentication attempts
 */
export async function inspectPublicTargetV1(
  request: InspectRequestV1,
  options: InspectOptionsV1 = {}
): Promise<InspectionResultV1> {
  // Validate policy acknowledgment
  if (!request.policyAcknowledged) {
    throw new Error('Policy acknowledgment required. Set policyAcknowledged: true to proceed.');
  }

  // Normalize domain to URL
  const target = normalizeToUrl(request.domain);

  // Determine inspection mode based on sensitivity
  let mode: 'PUBLIC_PASSIVE' | 'PASSIVE_ONLY' = 'PUBLIC_PASSIVE';
  if (options.sensitiveCategory) {
    // Sensitive categories ALWAYS enforce PASSIVE_ONLY
    mode = 'PASSIVE_ONLY';
  }

  // Execute inspection
  return await inspectPublicTarget(target, {
    mode,
    sensitiveCategory: options.sensitiveCategory,
    organisationLabel: request.organisationLabel,
    collectHttp: true,
    collectDns: true,
    dataMode: 'LIVE',
    evaluateFindings: request.evaluateFindings,
    mapOpportunities: request.mapOpportunities
  });
}

/**
 * Normalizes domain input to a full URL.
 * Accepts:
 * - https://example.com
 * - http://example.com
 * - example.com
 * - www.example.com
 */
function normalizeToUrl(domain: string): string {
  // Already a full URL
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain;
  }

  // Bare domain - default to HTTPS
  return `https://${domain}`;
}
