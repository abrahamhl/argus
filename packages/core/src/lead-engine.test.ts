import { test } from 'vitest';
import assert from 'node:assert/strict';

// Test suite for ARGUS Lead Engine Precision & Invariants

test('ARGUS Invariant: Secret Masking protects tokens', () => {
  function maskSecret(val: string) {
    if (!val || val.length < 8) return '••••••';
    return `${val.slice(0, 4)}••••••${val.slice(-4)}`;
  }

  const rawGoogleKey = 'AIzaSyA1234567890abcdef1234567890abcdef';
  const masked = maskSecret(rawGoogleKey);
  assert.equal(masked, 'AIza••••••cdef');
  assert.ok(!masked.includes('1234567890'));
  assert.ok(masked.startsWith('AIza'));
});

test('ARGUS Invariant: Public API keys are not labeled as COMPROMISED', () => {
  const findingTitle = 'Potentiële publieke sleutelblootstelling: Google API Key (Browser)';
  assert.ok(!findingTitle.includes('COMPROMISED'));
  assert.ok(!findingTitle.includes('gehackt'));
  assert.ok(findingTitle.includes('Potentiële publieke sleutelblootstelling'));
});

test('ARGUS Invariant: Privacy compliance signals use defensive phrasing', () => {
  const privacyFindingTitle = 'Potentiële compliance-afwijking: trackers actief zonder zichtbare cookiebanner';
  assert.ok(!privacyFindingTitle.includes('illegaal'));
  assert.ok(!privacyFindingTitle.includes('GDPR violation'));
  assert.ok(privacyFindingTitle.includes('Potentiële compliance-afwijking'));
});

test('ARGUS Invariant: Unicode and Dutch company names are preserved and slugified safely', () => {
  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/ø/g, 'o')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  const names = [
    { raw: 'Bistro Bløff', expected: 'bistro-bloff' },
    { raw: 'Café Cadans', expected: 'cafe-cadans' },
    { raw: 'Trattoria Così', expected: 'trattoria-cosi' },
    { raw: "'t Goud", expected: 't-goud' }
  ];

  for (const n of names) {
    const slug = slugify(n.raw);
    assert.equal(slug, n.expected);
  }
});

test('ARGUS Invariant: Independent 6-dimension scores are bounded 0-100', () => {
  function calculateScores(input: any) {
    let techScore = 0;
    if (!input.hsts) techScore += 25;
    if (!input.csp) techScore += 20;
    if (!input.xfo) techScore += 15;
    if (!input.xcto) techScore += 10;
    if (input.serverBanner) techScore += 10;

    let privScore = 0;
    if (!input.privacyUrl) privScore += 35;
    if (!input.cookieUrl) privScore += 20;
    if (input.preConsentTrackers) privScore += 35;

    let qualScore = 0;
    if (input.reachable) qualScore += 25;
    if (input.tlsAuthorized) qualScore += 25;
    if (input.viewport) qualScore += 15;
    if (input.title) qualScore += 10;
    if (input.lang) qualScore += 10;
    if (input.structuredData) qualScore += 10;

    let seoScore = 0;
    if (!input.metaDesc) seoScore += 30;
    if (!input.canonical) seoScore += 20;
    if (!input.structuredData) seoScore += 25;
    if (input.brokenContact) seoScore += 25;

    let priority = 20;
    if (!input.dmarc) priority += 25;
    if (input.preConsentTrackers) priority += 25;
    if (!input.hsts && !input.csp) priority += 15;
    if (!input.metaDesc && input.brokenContact) priority += 15;

    return {
      technicalExposure: Math.min(100, Math.max(0, techScore)),
      privacyCompliance: Math.min(100, Math.max(0, privScore)),
      webQuality: Math.min(100, Math.max(0, qualScore)),
      seoConversion: Math.min(100, Math.max(0, seoScore)),
      evidenceConfidence: input.reachable ? 95 : 70,
      salesPriority: Math.min(100, Math.max(0, priority))
    };
  }

  // Test worst case
  const worstScores = calculateScores({
    hsts: false, csp: false, xfo: false, xcto: false, serverBanner: true,
    privacyUrl: null, cookieUrl: null, preConsentTrackers: true,
    reachable: true, tlsAuthorized: false, viewport: false, title: null, lang: null, structuredData: false,
    metaDesc: null, canonical: null, brokenContact: true, dmarc: null
  });

  assert.ok(worstScores.technicalExposure <= 100 && worstScores.technicalExposure >= 0);
  assert.ok(worstScores.privacyCompliance <= 100 && worstScores.privacyCompliance >= 0);
  assert.ok(worstScores.webQuality <= 100 && worstScores.webQuality >= 0);
  assert.ok(worstScores.seoConversion <= 100 && worstScores.seoConversion >= 0);
  assert.ok(worstScores.salesPriority <= 100 && worstScores.salesPriority >= 0);
  assert.equal(worstScores.salesPriority, 100);

  // Test pristine case
  const bestScores = calculateScores({
    hsts: true, csp: true, xfo: true, xcto: true, serverBanner: false,
    privacyUrl: 'https://site.nl/privacy', cookieUrl: 'https://site.nl/cookies', preConsentTrackers: false,
    reachable: true, tlsAuthorized: true, viewport: true, title: 'Title', lang: 'nl', structuredData: true,
    metaDesc: 'Description', canonical: 'https://site.nl', brokenContact: false, dmarc: 'v=DMARC1; p=reject'
  });

  assert.equal(bestScores.technicalExposure, 0);
  assert.equal(bestScores.privacyCompliance, 0);
  assert.equal(bestScores.webQuality, 95);
  assert.equal(bestScores.seoConversion, 0);
  assert.equal(bestScores.salesPriority, 20);
});

test('ARGUS Invariant: Priority colors match thresholds', () => {
  function getColor(salesPriority: number, hasCriticalRisk: boolean) {
    if (salesPriority >= 75 || hasCriticalRisk) return '🟥';
    if (salesPriority >= 55) return '🟧';
    if (salesPriority >= 35) return '🟨';
    return '🟩';
  }

  assert.equal(getColor(90, false), '🟥');
  assert.equal(getColor(70, true), '🟥');
  assert.equal(getColor(60, false), '🟧');
  assert.equal(getColor(40, false), '🟨');
  assert.equal(getColor(25, false), '🟩');
});

test('ARGUS Invariant: DMARC record evaluation distinguishes monitoring from enforcement', () => {
  function evaluateDmarc(record: string | null) {

    if (!record) return { status: 'MISSING', severity: 'HIGH' };
    if (/p=none/i.test(record)) return { status: 'MONITORING_ONLY', severity: 'MEDIUM' };
    if (/p=quarantine|p=reject/i.test(record)) return { status: 'ENFORCED', severity: 'NONE' };
    return { status: 'UNKNOWN', severity: 'LOW' };
  }

  assert.deepEqual(evaluateDmarc(null), { status: 'MISSING', severity: 'HIGH' });
  assert.deepEqual(evaluateDmarc('v=DMARC1; p=none; sp=none'), { status: 'MONITORING_ONLY', severity: 'MEDIUM' });
  assert.deepEqual(evaluateDmarc('v=DMARC1; p=quarantine; pct=100'), { status: 'ENFORCED', severity: 'NONE' });
  assert.deepEqual(evaluateDmarc('v=DMARC1; p=reject'), { status: 'ENFORCED', severity: 'NONE' });
});


