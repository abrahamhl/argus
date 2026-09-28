import { describe, it, expect } from 'vitest';
import { Evidence } from './index.js';
import crypto from 'node:crypto';

function hashValue(value: any): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return crypto.createHash('sha256').update(str).digest('hex');
}

describe('Evidence Schema', () => {
  it('Evidence hash is stable (same input = same hash)', () => {
    const rawData = { status: 200, headers: { 'strict-transport-security': 'max-age=31536000' } };
    
    const ev1: Evidence = {
      id: 'ev-1',
      targetId: 't-1',
      runId: 'r-1',
      type: 'HTTP',
      source: 'http',
      collector: 'test',
      collectorVersion: '1.0',
      observedAt: '2023-01-01',
      rawValue: rawData,
      normalizedValue: rawData,
      confidence: 'VERIFIED',
      sha256: hashValue(rawData)
    };
    
    const ev2: Evidence = {
      id: 'ev-2',
      targetId: 't-1',
      runId: 'r-1',
      type: 'HTTP',
      source: 'http',
      collector: 'test',
      collectorVersion: '1.0',
      observedAt: '2023-01-01',
      rawValue: { status: 200, headers: { 'strict-transport-security': 'max-age=31536000' } },
      normalizedValue: { status: 200, headers: { 'strict-transport-security': 'max-age=31536000' } },
      confidence: 'VERIFIED',
      sha256: hashValue({ status: 200, headers: { 'strict-transport-security': 'max-age=31536000' } })
    };
    
    expect(ev1.sha256).toBe(ev2.sha256);
  });
});


