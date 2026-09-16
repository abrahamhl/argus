import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { PolicyEngine, validateIPAddress, isLocalhost } from './policy-engine.js';

describe('PolicyEngine — Target Validation', () => {
  const engine = new PolicyEngine();

  it('rejects 127.0.0.1', async () => {
    const r = await engine.validateTarget('http://127.0.0.1/admin');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Loopback'));
  });

  it('rejects ::1 (IPv6 loopback)', async () => {
    const r = await engine.validateTarget('http://[::1]/');
    assert.equal(r.allowed, false);
  });

  it('rejects 10.0.0.1 (RFC1918)', async () => {
    const r = await engine.validateTarget('http://10.0.0.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Private'));
  });

  it('rejects 172.16.0.1 (RFC1918)', async () => {
    const r = await engine.validateTarget('http://172.16.0.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Private'));
  });

  it('rejects 192.168.1.1 (RFC1918)', async () => {
    const r = await engine.validateTarget('http://192.168.1.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Private'));
  });

  it('rejects 169.254.169.254 (cloud metadata)', async () => {
    const r = await engine.validateTarget('http://169.254.169.254/latest/meta-data/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('metadata'));
  });

  it('rejects link-local 169.254.1.1', async () => {
    const r = await engine.validateTarget('http://169.254.1.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Link-local'));
  });

  it('rejects localhost hostname', async () => {
    const r = await engine.validateTarget('http://localhost:8080/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Localhost'));
  });

  it('rejects embedded credentials', async () => {
    const r = await engine.validateTarget('http://admin:password@example.com/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('credentials'));
  });

  it('rejects javascript: scheme', async () => {
    const r = await engine.validateTarget('javascript:alert(1)');
    assert.equal(r.allowed, false);
  });

  it('rejects file:// scheme', async () => {
    const r = await engine.validateTarget('file:///etc/passwd');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('protocol'));
  });

  it('rejects ftp: scheme', async () => {
    const r = await engine.validateTarget('ftp://evil.com/file');
    assert.equal(r.allowed, false);
  });

  it('rejects URL exceeding 2048 characters', async () => {
    const longUrl = 'http://example.com/' + 'a'.repeat(2100);
    const r = await engine.validateTarget(longUrl);
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('length'));
  });

  it('rejects hostname exceeding 253 characters', async () => {
    const longHost = 'http://' + 'a'.repeat(260) + '.com/';
    const r = await engine.validateTarget(longHost);
    assert.equal(r.allowed, false);
  });

  it('rejects malformed URL', async () => {
    const r = await engine.validateTarget('not-a-url');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Malformed'));
  });

  it('rejects multicast 224.0.0.1', async () => {
    const r = await engine.validateTarget('http://224.0.0.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Multicast'));
  });

  it('rejects reserved 240.0.0.1', async () => {
    const r = await engine.validateTarget('http://240.0.0.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Reserved'));
  });

  it('rejects CGNAT 100.64.0.1', async () => {
    const r = await engine.validateTarget('http://100.64.0.1/');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('CGNAT'));
  });

  it('rejects 0.0.0.0', async () => {
    const r = await engine.validateTarget('http://0.0.0.0/');
    assert.equal(r.allowed, false);
  });
});

describe('PolicyEngine — IPv4-mapped IPv6', () => {
  it('rejects ::ffff:127.0.0.1', () => {
    const r = validateIPAddress('::ffff:127.0.0.1');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Loopback'));
  });

  it('rejects ::ffff:169.254.169.254', () => {
    const r = validateIPAddress('::ffff:169.254.169.254');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('metadata'));
  });

  it('rejects ::ffff:10.0.0.1', () => {
    const r = validateIPAddress('::ffff:10.0.0.1');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Private'));
  });

  it('rejects ::ffff:192.168.1.1', () => {
    const r = validateIPAddress('::ffff:192.168.1.1');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Private'));
  });

  it('allows ::ffff:8.8.8.8 (public IPv4-mapped)', () => {
    const r = validateIPAddress('::ffff:8.8.8.8');
    assert.equal(r.allowed, true);
  });
});

describe('PolicyEngine — IPv6 ranges', () => {
  it('rejects fe80::1 (link-local)', () => {
    const r = validateIPAddress('fe80::1');
    assert.equal(r.allowed, false);
  });

  it('rejects fd00::1 (ULA)', () => {
    const r = validateIPAddress('fd00::1');
    assert.equal(r.allowed, false);
  });

  it('rejects ff02::1 (multicast)', () => {
    const r = validateIPAddress('ff02::1');
    assert.equal(r.allowed, false);
  });
});

describe('PolicyEngine — Tool Argument Validation', () => {
  const engine = new PolicyEngine();

  it('rejects unknown fields', () => {
    const r = engine.validateToolArguments('test_tool', { url: 'x', evil: 'y' }, {
      url: { type: 'string', required: true, maxLength: 2048 }
    });
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Unknown'));
  });

  it('rejects missing required field', () => {
    const r = engine.validateToolArguments('test_tool', {}, {
      url: { type: 'string', required: true, maxLength: 2048 }
    });
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('Missing'));
  });

  it('rejects wrong type', () => {
    const r = engine.validateToolArguments('test_tool', { url: 123 }, {
      url: { type: 'string', required: true, maxLength: 2048 }
    });
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('type'));
  });

  it('rejects string exceeding maxLength', () => {
    const r = engine.validateToolArguments('test_tool', { url: 'x'.repeat(3000) }, {
      url: { type: 'string', required: true, maxLength: 2048 }
    });
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('length'));
  });

  it('allows valid arguments', () => {
    const r = engine.validateToolArguments('test_tool', { url: 'http://example.com' }, {
      url: { type: 'string', required: true, maxLength: 2048 }
    });
    assert.equal(r.allowed, true);
  });
});

describe('PolicyEngine — Bundle Name Validation', () => {
  const engine = new PolicyEngine();

  it('rejects directory traversal with ..', () => {
    const r = engine.validateBundleName('../../../etc/passwd.argusbundle');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('traversal'));
  });

  it('rejects forward slash', () => {
    const r = engine.validateBundleName('some/path.argusbundle');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('traversal'));
  });

  it('rejects backslash', () => {
    const r = engine.validateBundleName('some\\path.argusbundle');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('traversal'));
  });

  it('rejects wrong extension', () => {
    const r = engine.validateBundleName('payload.json');
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('.argusbundle'));
  });

  it('rejects special characters', () => {
    const r = engine.validateBundleName('file;rm -rf /.argusbundle');
    assert.equal(r.allowed, false);
  });

  it('allows valid bundle name', () => {
    const r = engine.validateBundleName('argus-example.com-12345.argusbundle');
    assert.equal(r.allowed, true);
  });

  it('rejects empty string', () => {
    const r = engine.validateBundleName('');
    assert.equal(r.allowed, false);
  });
});

describe('PolicyEngine — Tool Allowlist', () => {
  const engine = new PolicyEngine();
  const allowed = ['argus_assess', 'argus_get_findings'];

  it('rejects unknown tool', () => {
    const r = engine.validateToolName('curl', allowed);
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('POLICY_VIOLATION'));
  });

  it('rejects shell execution', () => {
    const r = engine.validateToolName('exec_command', allowed);
    assert.equal(r.allowed, false);
  });

  it('allows permitted tool', () => {
    const r = engine.validateToolName('argus_assess', allowed);
    assert.equal(r.allowed, true);
  });
});

describe('PolicyEngine — Text Input Validation', () => {
  const engine = new PolicyEngine();

  it('rejects empty input', () => {
    const r = engine.validateTextInput('   ');
    assert.equal(r.allowed, false);
  });

  it('rejects oversized input', () => {
    const r = engine.validateTextInput('x'.repeat(11_000));
    assert.equal(r.allowed, false);
  });

  it('allows normal input', () => {
    const r = engine.validateTextInput('Assess http://example.com');
    assert.equal(r.allowed, true);
  });
});

describe('PolicyEngine — Redirect Validation', () => {
  const engine = new PolicyEngine();

  it('rejects redirect exceeding max hops', async () => {
    const r = await engine.validateRedirectHop('http://example.com', 11);
    assert.equal(r.allowed, false);
    assert.ok(r.reason?.includes('redirect'));
  });

  it('rejects redirect to private IP', async () => {
    const r = await engine.validateRedirectHop('http://192.168.1.1/', 1);
    assert.equal(r.allowed, false);
  });
});

describe('isLocalhost', () => {
  it('detects localhost', () => assert.equal(isLocalhost('localhost'), true));
  it('detects sub.localhost', () => assert.equal(isLocalhost('sub.localhost'), true));
  it('detects 0.0.0.0', () => assert.equal(isLocalhost('0.0.0.0'), true));
  it('detects ::1', () => assert.equal(isLocalhost('::1'), true));
  it('does not match example.com', () => assert.equal(isLocalhost('example.com'), false));
});
