import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSignalsConfidence,
  sanitizeConfidenceForAi,
  CONFIDENCE_REGISTRY
} from './confidence.js';

describe('Confidence Engine (Section 8)', () => {
  it('has explicit definitions and requirements for all 5 confidence levels', () => {
    const levels = ['VERIFIED', 'SUPPORTED', 'INFERRED', 'UNKNOWN', 'CONTRADICTED'] as const;
    for (const level of levels) {
      assert.ok(CONFIDENCE_REGISTRY[level]);
      assert.ok(CONFIDENCE_REGISTRY[level].description.length > 10);
    }
    assert.equal(CONFIDENCE_REGISTRY.VERIFIED.allowsAiAssignment, false);
  });

  it('evaluates direct deterministic signal as VERIFIED', () => {
    const conf = evaluateSignalsConfidence([
      { source: 'dns-collector', supports: true, deterministic: true }
    ]);
    assert.equal(conf, 'VERIFIED');
  });

  it('evaluates multiple corroborating signals as SUPPORTED', () => {
    const conf = evaluateSignalsConfidence([
      { source: 'http-header', supports: true, deterministic: false },
      { source: 'html-meta', supports: true, deterministic: false }
    ]);
    assert.equal(conf, 'SUPPORTED');
  });

  it('evaluates single non-deterministic signal as INFERRED', () => {
    const conf = evaluateSignalsConfidence([
      { source: 'heuristic-pattern', supports: true, deterministic: false }
    ]);
    assert.equal(conf, 'INFERRED');
  });

  it('evaluates active contradiction as CONTRADICTED even if supporting signals exist', () => {
    const conf = evaluateSignalsConfidence([
      { source: 'http-probe', supports: true, deterministic: true },
      { source: 'tls-probe', supports: false, contradicts: true, deterministic: true }
    ]);
    assert.equal(conf, 'CONTRADICTED');
  });

  it('evaluates empty signals as UNKNOWN', () => {
    const conf = evaluateSignalsConfidence([]);
    assert.equal(conf, 'UNKNOWN');
  });

  it('strictly clamps AI-assisted confidence: cannot assign VERIFIED', () => {
    const confAi = evaluateSignalsConfidence(
      [{ source: 'llm-reasoner', supports: true, deterministic: true, aiAssisted: true }],
      true
    );
    assert.notEqual(confAi, 'VERIFIED');
    assert.equal(confAi, 'INFERRED');

    const sanitized = sanitizeConfidenceForAi('VERIFIED', true);
    assert.equal(sanitized, 'INFERRED');

    const sanitizedHuman = sanitizeConfidenceForAi('VERIFIED', false);
    assert.equal(sanitizedHuman, 'VERIFIED');
  });
});
