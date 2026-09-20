import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPublicPostureScope,
  createAuthorizedAssessmentScope,
  evaluateScopeGate,
  validateTargetInScope
} from './authorization.js';
import type { Target, Run, AuthorizationScope } from '@argus/schema';

describe('Scope & Authorization Gate (Section 5 & 6)', () => {
  const target: Target = {
    id: 'tgt_aux_01',
    name: 'AUX Design Client',
    domains: ['auxdesign.nl', '*.auxdesign.nl']
  };

  const run: Run = {
    id: 'run_aux_01',
    targetId: 'tgt_aux_01',
    timestamp: new Date().toISOString(),
    argusVersion: '0.1.0',
    os: 'win32',
    status: 'STARTED'
  };

  it('allows execution when Target, Run, Scope, and Collector are all valid', () => {
    const scope = createPublicPostureScope(target.id, target.domains, 'Abraham');
    const decision = evaluateScopeGate({
      target,
      run,
      scope,
      collectorName: 'http',
      targetUrl: 'https://auxdesign.nl'
    });

    assert.equal(decision.allowed, true);
    assert.ok(decision.details?.collectorPermitted);
  });

  it('rejects execution if Target is missing or has no domains', () => {
    const scope = createPublicPostureScope(target.id, target.domains);
    const decision = evaluateScopeGate({
      target: { id: '', name: '', domains: [] },
      run,
      scope,
      collectorName: 'http'
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('Target does not exist'));
  });

  it('rejects execution if Run does not match Target ID', () => {
    const scope = createPublicPostureScope(target.id, target.domains);
    const mismatchedRun: Run = { ...run, targetId: 'tgt_different' };

    const decision = evaluateScopeGate({
      target,
      run: mismatchedRun,
      scope,
      collectorName: 'http'
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('does not match Target ID'));
  });

  it('rejects execution if Run status is not STARTED', () => {
    const scope = createPublicPostureScope(target.id, target.domains);
    const completedRun: Run = { ...run, status: 'COMPLETED' };

    const decision = evaluateScopeGate({
      target,
      run: completedRun,
      scope,
      collectorName: 'http'
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('must be STARTED'));
  });

  it('rejects execution if Scope is EXPIRED or REVOKED', () => {
    const expiredScope: AuthorizationScope = {
      ...createPublicPostureScope(target.id, target.domains),
      status: 'EXPIRED'
    };

    const decision = evaluateScopeGate({
      target,
      run,
      scope: expiredScope,
      collectorName: 'http'
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('must be ACTIVE'));
  });

  it('rejects execution if Scope timestamp is in the past (expired)', () => {
    const pastScope: AuthorizationScope = {
      ...createPublicPostureScope(target.id, target.domains),
      expiresAt: '2020-01-01T00:00:00.000Z'
    };

    const decision = evaluateScopeGate({
      target,
      run,
      scope: pastScope,
      collectorName: 'http'
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('Scope expired'));
  });

  it('rejects collector not permitted in the scope', () => {
    const scope = createPublicPostureScope(target.id, target.domains);
    const decision = evaluateScopeGate({
      target,
      run,
      scope,
      collectorName: 'active-fuzzer' // Prohibited collector
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('is not permitted in scope'));
  });

  it('rejects target URL that is not within authorized domains', () => {
    const scope = createPublicPostureScope(target.id, ['auxdesign.nl']);
    const decision = evaluateScopeGate({
      target,
      run,
      scope,
      collectorName: 'http',
      targetUrl: 'https://evil-unauthorized.com'
    });

    assert.equal(decision.allowed, false);
    assert.ok(decision.reason?.includes('not in authorized scope'));
  });

  it('correctly validates wildcard subdomains', () => {
    const scope = createPublicPostureScope(target.id, ['*.auxdesign.nl']);
    const val1 = validateTargetInScope('https://app.auxdesign.nl', scope);
    assert.equal(val1.allowed, true);

    const val2 = validateTargetInScope('https://auxdesign.nl', scope);
    assert.equal(val2.allowed, true);

    const val3 = validateTargetInScope('https://otherdomain.nl', scope);
    assert.equal(val3.allowed, false);
  });

  it('creates authorized assessment with explicit metadata and non-destructive restrictions', () => {
    const authScope = createAuthorizedAssessmentScope(
      target.id,
      target.domains,
      'Abraham - AUX Design',
      'Client Master Services Agreement 2026-B',
      { argus: '0.1.0', nmap_passive: '7.94' },
      48
    );

    assert.equal(authScope.assessmentType, 'AUTHORIZED_ASSESSMENT');
    assert.equal(authScope.operator, 'Abraham - AUX Design');
    assert.equal(authScope.restrictions.noExploitation, true);
    assert.ok(authScope.expiresAt);
  });
});
