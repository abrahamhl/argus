/**
 * Fixture data for testing and UI development.
 *
 * All fixtures use documentation-only targets (example.org, example.com, example.net, example.edu)
 * and are explicitly marked with dataMode: "FIXTURE" or "DEMO".
 *
 * NEVER use these for actual security assessments.
 */

import type { InspectionResultV1 } from '@argus/schema';
import exampleOrgHealthy from './example-org-healthy.json' with { type: 'json' };
import exampleComMissingHsts from './example-com-missing-hsts.json' with { type: 'json' };
import exampleNetMailSecurity from './example-net-mail-security.json' with { type: 'json' };
import exampleEduZeroFindings from './example-edu-zero-findings.json' with { type: 'json' };
import localhostBlocked from './localhost-blocked.json' with { type: 'json' };

export const fixtures = {
  'example-org-healthy': exampleOrgHealthy as unknown as InspectionResultV1,
  'example-com-missing-hsts': exampleComMissingHsts as unknown as InspectionResultV1,
  'example-net-mail-security': exampleNetMailSecurity as unknown as InspectionResultV1,
  'example-edu-zero-findings': exampleEduZeroFindings as unknown as InspectionResultV1,
  'localhost-blocked': localhostBlocked as unknown as InspectionResultV1
};

export type FixtureKey = keyof typeof fixtures;

/**
 * Get a fixture by key.
 * All returned fixtures have dataMode = "FIXTURE" or "DEMO".
 */
export function getFixture(key: FixtureKey): InspectionResultV1 {
  const fixture = fixtures[key];
  if (!fixture) {
    throw new Error(`Fixture not found: ${key}`);
  }
  return fixture;
}

/**
 * Get all fixture keys.
 */
export function getFixtureKeys(): FixtureKey[] {
  return Object.keys(fixtures) as FixtureKey[];
}

/**
 * Validate that a fixture is properly marked as non-live data.
 */
export function validateFixture(result: InspectionResultV1): void {
  if (result.dataMode === 'LIVE') {
    throw new Error('Fixture incorrectly marked as LIVE data');
  }

  const allowedTargets = ['example.org', 'example.com', 'example.net', 'example.edu', 'localhost'];
  if (!allowedTargets.some(domain => result.target.hostname === domain || result.target.hostname.endsWith(domain))) {
    throw new Error(`Fixture uses non-documentation target: ${result.target.hostname}`);
  }
}
