import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { TargetPolicy } from './policy.js';

test('TargetPolicy rejects localhost', async () => {
  const policy = new TargetPolicy();

  const localhost = await policy.validate('http://localhost/');
  assert.equal(localhost.allowed, false);
  assert.match(localhost.reason || '', /localhost/i);

  const localhost2 = await policy.validate('http://localhost:8080/test');
  assert.equal(localhost2.allowed, false);

  const localhost3 = await policy.validate('http://test.localhost/');
  assert.equal(localhost3.allowed, false);
});

test('TargetPolicy rejects loopback IPs', async () => {
  const policy = new TargetPolicy();

  const ipv4 = await policy.validate('http://127.0.0.1/');
  assert.equal(ipv4.allowed, false);
  assert.match(ipv4.reason || '', /loopback/i);

  const ipv4_2 = await policy.validate('http://127.1.2.3/');
  assert.equal(ipv4_2.allowed, false);

  const ipv6 = await policy.validate('http://[::1]/');
  assert.equal(ipv6.allowed, false);
  assert.match(ipv6.reason || '', /loopback/i);
});

test('TargetPolicy rejects RFC1918 private networks', async () => {
  const policy = new TargetPolicy();

  // 10.0.0.0/8
  const net10 = await policy.validate('http://10.0.0.1/');
  assert.equal(net10.allowed, false);
  assert.match(net10.reason || '', /private/i);

  // 172.16.0.0/12
  const net172 = await policy.validate('http://172.16.0.1/');
  assert.equal(net172.allowed, false);
  assert.match(net172.reason || '', /private/i);

  const net172_2 = await policy.validate('http://172.31.255.255/');
  assert.equal(net172_2.allowed, false);

  // 192.168.0.0/16
  const net192 = await policy.validate('http://192.168.1.1/');
  assert.equal(net192.allowed, false);
  assert.match(net192.reason || '', /private/i);
});

test('TargetPolicy rejects link-local addresses', async () => {
  const policy = new TargetPolicy();

  // 169.254.0.0/16 - IPv4 link-local
  const ipv4LinkLocal = await policy.validate('http://169.254.1.1/');
  assert.equal(ipv4LinkLocal.allowed, false);
  assert.match(ipv4LinkLocal.reason || '', /link-local/i);

  // fe80::/10 - IPv6 link-local
  const ipv6LinkLocal = await policy.validate('http://[fe80::1]/');
  assert.equal(ipv6LinkLocal.allowed, false);
  assert.match(ipv6LinkLocal.reason || '', /link-local/i);
});

test('TargetPolicy rejects IPv6 unique-local addresses', async () => {
  const policy = new TargetPolicy();

  // fc00::/7
  const ula1 = await policy.validate('http://[fc00::1]/');
  assert.equal(ula1.allowed, false);
  assert.match(ula1.reason || '', /unique-local/i);

  const ula2 = await policy.validate('http://[fd00::1]/');
  assert.equal(ula2.allowed, false);
});

test('TargetPolicy rejects CGNAT addresses', async () => {
  const policy = new TargetPolicy();

  // 100.64.0.0/10
  const cgnat = await policy.validate('http://100.64.0.1/');
  assert.equal(cgnat.allowed, false);
  assert.match(cgnat.reason || '', /cgnat/i);

  const cgnat2 = await policy.validate('http://100.127.255.255/');
  assert.equal(cgnat2.allowed, false);
});

test('TargetPolicy rejects cloud metadata endpoint', async () => {
  const policy = new TargetPolicy();

  const metadata = await policy.validate('http://169.254.169.254/');
  assert.equal(metadata.allowed, false);
  assert.match(metadata.reason || '', /metadata/i);
});

test('TargetPolicy rejects URL with embedded credentials', async () => {
  const policy = new TargetPolicy();

  const withUser = await policy.validate('http://user@example.com/');
  assert.equal(withUser.allowed, false);
  assert.match(withUser.reason || '', /credential/i);

  const withUserPass = await policy.validate('http://user:pass@example.com/');
  assert.equal(withUserPass.allowed, false);
  assert.match(withUserPass.reason || '', /credential/i);
});

test('TargetPolicy rejects unsupported protocols', async () => {
  const policy = new TargetPolicy();

  const ftp = await policy.validate('ftp://example.com/');
  assert.equal(ftp.allowed, false);
  assert.match(ftp.reason || '', /protocol/i);

  const file = await policy.validate('file:///etc/passwd');
  assert.equal(file.allowed, false);

  const javascript = await policy.validate('javascript:alert(1)');
  assert.equal(javascript.allowed, false);
});

test('TargetPolicy rejects malformed targets', async () => {
  const policy = new TargetPolicy();

  const invalid1 = await policy.validate('not a url');
  assert.equal(invalid1.allowed, false);
  assert.match(invalid1.reason || '', /malformed/i);

  const invalid2 = await policy.validate('');
  assert.equal(invalid2.allowed, false);
});

test('TargetPolicy allows valid public HTTP targets', async () => {
  const policy = new TargetPolicy();

  // Note: These tests may fail if DNS resolution doesn't work,
  // but the validation logic should allow them
  const http = await policy.validate('http://example.com/');
  assert.equal(http.allowed, true);

  const https = await policy.validate('https://example.com/');
  assert.equal(https.allowed, true);
});

test('TargetPolicy enforces PASSIVE_ONLY for sensitive categories', async () => {
  const policy = new TargetPolicy({
    mode: 'PUBLIC_PASSIVE',
    sensitiveCategory: 'GOVERNMENT'
  });

  const result = await policy.validate('https://example.com/');
  assert.equal(result.allowed, true);
  assert.equal(result.mode, 'PASSIVE_ONLY');
  assert.equal(result.sensitiveCategory, 'GOVERNMENT');
});

test('TargetPolicy rejects 0.0.0.0', async () => {
  const policy = new TargetPolicy();

  const zero = await policy.validate('http://0.0.0.0/');
  assert.equal(zero.allowed, false);
  assert.match(zero.reason || '', /current network/i);
});

test('TargetPolicy rejects IPv6 unspecified', async () => {
  const policy = new TargetPolicy();

  const ipv6Zero = await policy.validate('http://[::]/');
  assert.equal(ipv6Zero.allowed, false);
  assert.match(ipv6Zero.reason || '', /unspecified/i);
});
