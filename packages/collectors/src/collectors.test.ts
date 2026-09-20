import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectTls,
  collectSecurityTxt,
  collectWebsiteMetadata,
  collectEmailSecurity,
  createSyntheticBaselineObservations,
  createSyntheticRemediatedObservations
} from './index.js';

describe('Deterministic Collectors (Section 9 & 11)', () => {
  it('enforces ARGUS_OFFLINE_MODE on collectTls', async () => {
    const original = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'true';
    try {
      await assert.rejects(
        async () => collectTls('example-business.nl', 'run_1', 'tgt_1'),
        /ARGUS_OFFLINE_MODE is active/
      );
    } finally {
      process.env.ARGUS_OFFLINE_MODE = original;
    }
  });

  it('enforces ARGUS_OFFLINE_MODE on collectSecurityTxt', async () => {
    const original = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'true';
    try {
      await assert.rejects(
        async () => collectSecurityTxt('example-business.nl', 'run_1', 'tgt_1'),
        /ARGUS_OFFLINE_MODE is active/
      );
    } finally {
      process.env.ARGUS_OFFLINE_MODE = original;
    }
  });

  it('enforces ARGUS_OFFLINE_MODE on collectWebsiteMetadata', async () => {
    const original = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'true';
    try {
      await assert.rejects(
        async () => collectWebsiteMetadata('https://example-business.nl', 'run_1', 'tgt_1'),
        /ARGUS_OFFLINE_MODE is active/
      );
    } finally {
      process.env.ARGUS_OFFLINE_MODE = original;
    }
  });

  it('enforces ARGUS_OFFLINE_MODE on collectEmailSecurity', async () => {
    const original = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'true';
    try {
      await assert.rejects(
        async () => collectEmailSecurity('example-business.nl', 'run_1', 'tgt_1'),
        /ARGUS_OFFLINE_MODE is active/
      );
    } finally {
      process.env.ARGUS_OFFLINE_MODE = original;
    }
  });
});

describe('Synthetic Company Fixture Harness (Section 12 & 23)', () => {
  it('generates complete baseline synthetic observations for example-business.nl', () => {
    const obs = createSyntheticBaselineObservations('example-business.nl', 'run_base', 'tgt_example');
    assert.ok(obs.length >= 7);

    const types = new Set(obs.map(o => o.type));
    assert.ok(types.has('DNS_A'));
    assert.ok(types.has('DNS_MX'));
    assert.ok(types.has('DNS_TXT'));
    assert.ok(types.has('DNS_DMARC'));
    assert.ok(types.has('HTTP_RESPONSE'));
    assert.ok(types.has('TLS_CERTIFICATE'));
    assert.ok(types.has('SECURITY_TXT'));
    assert.ok(types.has('WEBSITE_METADATA'));

    const httpObs = obs.find(o => o.type === 'HTTP_RESPONSE');
    assert.ok(httpObs);
    // Baseline: no strict-transport-security
    assert.equal(httpObs.rawValue.headers['strict-transport-security'], undefined);

    const secTxtObs = obs.find(o => o.type === 'SECURITY_TXT');
    assert.ok(secTxtObs);
    assert.equal(secTxtObs.rawValue.present, false);
  });

  it('generates complete remediated synthetic observations with resolved controls', () => {
    const obs = createSyntheticRemediatedObservations('example-business.nl', 'run_retest', 'tgt_example');
    assert.ok(obs.length >= 7);

    const httpObs = obs.find(o => o.type === 'HTTP_RESPONSE');
    assert.ok(httpObs);
    // Remediated: HSTS present
    assert.ok(httpObs.rawValue.headers['strict-transport-security']);

    const secTxtObs = obs.find(o => o.type === 'SECURITY_TXT');
    assert.ok(secTxtObs);
    assert.equal(secTxtObs.rawValue.present, true);
    assert.ok(secTxtObs.rawValue.contact.length > 0);

    const dmarcObs = obs.find(o => o.type === 'DNS_DMARC');
    assert.ok(dmarcObs);
    assert.equal(dmarcObs.rawValue.dmarc.p, 'reject');
  });
});
