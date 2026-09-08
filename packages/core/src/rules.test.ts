import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { Evidence } from '@argus/schema';
import {
  RULES,
  runRules,
  runRulesByIds,
  canonical,
  stableFindingId,
  redact,
  redactEvidence,
  mapFindingsToOpportunities
} from './assessment.js';

const TARGET = 'tgt_example';
const RUN = 'run_deterministic';

function httpEvidence(
  headers: Record<string, string>,
  id = 'evd_http_1',
  targetId = TARGET
): Evidence {
  return {
    id,
    targetId,
    runId: RUN,
    type: 'HTTP_RESPONSE',
    source: 'http',
    collector: 'argus-http-collector',
    collectorVersion: '0.1.0',
    observedAt: '2026-09-08T00:00:00.000Z',
    rawValue: { status: 200, url: 'https://example.com', redirected: false, headers },
    normalizedValue: { status: 200, url: 'https://example.com', redirected: false, headers },
    confidence: 'VERIFIED',
    sha256: 'sha256-placeholder'
  };
}

function dnsEvidence(
  kind: 'SPF' | 'DMARC' | 'CAA',
  records: string[],
  id = 'evd_dns_1',
  targetId = TARGET
): Evidence {
  return {
    id,
    targetId,
    runId: RUN,
    type: kind === 'CAA' ? 'DNS_CAA' : 'DNS_TXT',
    source: 'dns',
    collector: 'argus-dns-collector',
    collectorVersion: '0.1.0',
    observedAt: '2026-09-08T00:00:00.000Z',
    rawValue: { kind, domain: 'example.com', records },
    normalizedValue: { kind, domain: 'example.com', records },
    confidence: 'VERIFIED',
    sha256: 'sha256-placeholder'
  };
}

// --- HTTP: positive case -----------------------------------------------------

test('missing HSTS produces a VERIFIED finding', () => {
  const evidence = httpEvidence({ 'content-security-policy': "default-src 'none'" });
  const findings = runRulesByIds([evidence], ['rule-http-missing-hsts']);
  assert.equal(findings.length, 1);
  const f = findings[0];
  assert.equal(f.ruleId, 'rule-http-missing-hsts');
  assert.equal(f.confidence, 'VERIFIED');
  assert.equal(f.severity, 'MEDIUM');
  assert.equal(f.target, TARGET);
  assert.ok(f.findingId);
  assert.ok(f.ruleVersion);
  assert.ok(f.technicalExplanation);
  assert.ok(f.remediation);
});

test('missing CSP, X-Content-Type-Options and Referrer-Policy are detected', () => {
  const evidence = httpEvidence({ 'strict-transport-security': 'max-age=31536000' });
  const findings = runRules([evidence]);
  const ids = findings.map((f) => f.ruleId);
  assert.ok(ids.includes('rule-http-missing-csp'));
  assert.ok(ids.includes('rule-http-missing-x-content-type-options'));
  assert.ok(ids.includes('rule-http-missing-referrer-policy'));
  assert.ok(ids.includes('rule-http-missing-frame-protection'));
  assert.ok(!ids.includes('rule-http-missing-hsts'));
});

// --- HTTP: negative case -----------------------------------------------------

test('present headers produce no finding', () => {
  const evidence = httpEvidence({
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'content-security-policy': "default-src 'self'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'DENY'
  });
  const findings = runRules([evidence]);
  assert.equal(findings.length, 0);
});

// --- missing data ------------------------------------------------------------

test('no HTTP evidence produces no HTTP findings', () => {
  const findings = runRulesByIds([], ['rule-http-missing-hsts']);
  assert.equal(findings.length, 0);
});

test('no SPF/DMARC/CAA evidence produces no DNS findings', () => {
  const findings = runRules([dnsEvidence('SPF', ['v=spf1 -all'])]);
  // DMARC and CAA evidence are absent, so no finding may be emitted for them.
  const ids = findings.map((f) => f.ruleId);
  assert.ok(!ids.includes('rule-dns-missing-dmarc'));
  assert.ok(!ids.includes('rule-dns-missing-caa'));
});

// --- malformed evidence ------------------------------------------------------

test('malformed normalizedValue is ignored without throwing', () => {
  const malformed: Evidence[] = [
    { ...httpEvidence({}), normalizedValue: 'garbage' },
    { ...dnsEvidence('SPF', []), normalizedValue: null },
    { ...httpEvidence({}), normalizedValue: { headers: 'not-an-object' } },
    { ...dnsEvidence('DMARC', []), normalizedValue: { kind: 'DMARC', records: { nope: true } } }
  ];
  assert.doesNotThrow(() => runRules(malformed));
  assert.equal(runRules(malformed).length, 0);
});

// --- deterministic ids -------------------------------------------------------

test('identical normalized evidence yields identical finding ids', () => {
  const a = httpEvidence({}, 'evd_a');
  const b = httpEvidence({}, 'evd_b');
  const fa = runRulesByIds([a], ['rule-http-missing-hsts']);
  const fb = runRulesByIds([b], ['rule-http-missing-hsts']);
  assert.equal(fa.length, 1);
  assert.equal(fb.length, 1);
  assert.equal(fa[0].findingId, fb[0].findingId);
  assert.equal(fa[0].id, fb[0].id);
});

test('stableFindingId is stable and independent of evidence id', () => {
  const key = { status: 200, headers: {} };
  const idA = stableFindingId('rule-http-missing-hsts', TARGET, [key]);
  const idB = stableFindingId('rule-http-missing-hsts', TARGET, [key]);
  assert.equal(idA, idB);
});

// --- same input, same output -------------------------------------------------

test('runRules is a pure function of its evidence array', () => {
  const evidence = [httpEvidence({}), httpEvidence({ 'x-frame-options': 'DENY' })];
  const first = runRules(evidence);
  const second = runRules(evidence);
  assert.deepEqual(first, second);
});

// --- evidence linkage --------------------------------------------------------

test('findings reference their supporting evidence ids', () => {
  const evidence = httpEvidence({}, 'evd_linked');
  const findings = runRulesByIds([evidence], ['rule-http-missing-hsts']);
  assert.deepEqual(findings[0].evidenceIds, ['evd_linked']);
});

// --- redaction ---------------------------------------------------------------

test('redaction scrubs sensitive header values', () => {
  const value = {
    headers: {
      'strict-transport-security': 'max-age=1',
      authorization: 'Bearer SECRET_TOKEN',
      cookie: 'session=abcdef'
    }
  };
  const out = redact(value) as any;
  assert.equal(out.headers.authorization, '[REDACTED]');
  assert.equal(out.headers.cookie, '[REDACTED]');
  assert.equal(out.headers['strict-transport-security'], 'max-age=1');
});

test('redactEvidence returns evidence without raw secrets', () => {
  const ev = httpEvidence({ authorization: 'Bearer hush' });
  const redacted = redactEvidence(ev);
  assert.equal((redacted.rawValue as any).headers.authorization, '[REDACTED]');
  assert.equal((redacted.normalizedValue as any).headers.authorization, '[REDACTED]');
  assert.notEqual((ev.rawValue as any).headers.authorization, '[REDACTED]');
});

// --- DNS / MAIL --------------------------------------------------------------

test('missing SPF is detected when TXT records exist without SPF', () => {
  const findings = runRulesByIds(
    [dnsEvidence('SPF', ['google-site-verification=abc123'])],
    ['rule-dns-missing-spf']
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, 'rule-dns-missing-spf');
  assert.equal(findings[0].confidence, 'VERIFIED');
});

test('SPF present with -all is not flagged missing or weak', () => {
  const findings = runRulesByIds(
    [dnsEvidence('SPF', ['v=spf1 include:_spf.example.com -all'])],
    ['rule-dns-missing-spf', 'rule-dns-weak-spf']
  );
  assert.equal(findings.length, 0);
});

test('weak SPF (~all) is detected', () => {
  const findings = runRulesByIds(
    [dnsEvidence('SPF', ['v=spf1 include:_spf.example.com ~all'])],
    ['rule-dns-weak-spf']
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, 'rule-dns-weak-spf');
});

test('missing DMARC is detected from empty DMARC records', () => {
  const findings = runRulesByIds(
    [dnsEvidence('DMARC', [])],
    ['rule-dns-missing-dmarc']
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, 'rule-dns-missing-dmarc');
});

test('DMARC p=none is detected', () => {
  const findings = runRulesByIds(
    [dnsEvidence('DMARC', ['v=DMARC1; p=none; rua=mailto:dmarc@example.com'])],
    ['rule-dns-dmarc-p-none', 'rule-dns-missing-dmarc']
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, 'rule-dns-dmarc-p-none');
});

test('enforced DMARC (p=reject) produces no DMARC finding', () => {
  const findings = runRulesByIds(
    [dnsEvidence('DMARC', ['v=DMARC1; p=reject; rua=mailto:dmarc@example.com'])],
    ['rule-dns-missing-dmarc', 'rule-dns-dmarc-p-none']
  );
  assert.equal(findings.length, 0);
});

test('missing CAA is detected from empty CAA records', () => {
  const findings = runRulesByIds(
    [dnsEvidence('CAA', [])],
    ['rule-dns-missing-caa']
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, 'rule-dns-missing-caa');
});

test('present CAA produces no finding', () => {
  const caa = dnsEvidence('CAA', ['0 issue "letsencrypt.org"']);
  const findings = runRulesByIds([caa], ['rule-dns-missing-caa']);
  assert.equal(findings.length, 0);
});

// --- opportunity mapping -----------------------------------------------------

test('findings map to opportunities with required fields', () => {
  const evidence = httpEvidence({});
  const findings = runRules([evidence]);
  const opportunities = mapFindingsToOpportunities(findings);
  assert.ok(opportunities.length >= 1);

  const opp = opportunities.find((o) => o.serviceCategory === 'SECURITY_HARDENING');
  assert.ok(opp);
  assert.ok(opp.supportingFindingIds.length >= 1);
  assert.ok(opp.technicalSignificance);
  assert.ok(opp.businessSignificance);
  assert.ok(opp.serviceCategory);
  assert.ok('estimatedComplexity' in opp);
  assert.ok(typeof opp.retestAvailable === 'boolean');
});

test('SPF/DMARC findings map to EMAIL_TRUST opportunity', () => {
  const spf = runRulesByIds([dnsEvidence('SPF', ['google-site-verification=x'])], ['rule-dns-missing-spf']);
  const dmarc = runRulesByIds([dnsEvidence('DMARC', [])], ['rule-dns-missing-dmarc']);
  const opportunities = mapFindingsToOpportunities([...spf, ...dmarc]);
  const email = opportunities.find((o) => o.serviceCategory === 'EMAIL_TRUST');
  assert.ok(email);
  assert.deepEqual(email.supportingFindingIds, email.supportingFindingIds.slice().sort());
  assert.equal(email.supportingFindingIds.length, 2);
});

test('empty findings produce no opportunities', () => {
  assert.deepEqual(mapFindingsToOpportunities([]), []);
});

// --- rule registry -----------------------------------------------------------

test('all ten deterministic rules are registered', () => {
  assert.equal(RULES.length, 10);
  assert.deepEqual(RULES.map((r) => r.id).sort(), [
    'rule-dns-dmarc-p-none',
    'rule-dns-missing-caa',
    'rule-dns-missing-dmarc',
    'rule-dns-missing-spf',
    'rule-dns-weak-spf',
    'rule-http-missing-csp',
    'rule-http-missing-frame-protection',
    'rule-http-missing-hsts',
    'rule-http-missing-referrer-policy',
    'rule-http-missing-x-content-type-options'
  ].sort());
});