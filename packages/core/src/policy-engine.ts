/**
 * Centralized Policy Engine
 *
 * ALL execution paths (CLI, MCP, AI Agent, Web/API) MUST pass through this engine.
 * There must be no raw collector execution path capable of bypassing authorization
 * and target policy.
 *
 * The model is untrusted input.
 * Tool arguments are treated exactly like untrusted network input.
 */

import { URL } from 'node:url';
import { lookup } from 'node:dns/promises';

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_URL_LENGTH = 2048;
const MAX_HOSTNAME_LENGTH = 253;
const MAX_INPUT_SIZE = 10_000; // chars for free-form text inputs
const MAX_BUNDLE_NAME_LENGTH = 255;
const MAX_RESPONSE_BODY_BYTES = 1_048_576; // 1 MiB
const MAX_REDIRECT_HOPS = 10;
const CONNECT_TIMEOUT_MS = 10_000;
const TOTAL_TIMEOUT_MS = 30_000;
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

// ── Types ──────────────────────────────────────────────────────────────────

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  checks: PolicyCheck[];
}

export interface PolicyCheck {
  check: string;
  passed: boolean;
  detail?: string;
}

export interface PolicyEngineOptions {
  maxUrlLength?: number;
  maxResponseBodyBytes?: number;
  maxRedirectHops?: number;
  connectTimeoutMs?: number;
  totalTimeoutMs?: number;
}

export type ToolArgumentSchema = {
  [key: string]: {
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    maxLength?: number;
    pattern?: RegExp;
  };
};

// ── PolicyEngine ───────────────────────────────────────────────────────────

export class PolicyEngine {
  private readonly maxUrlLength: number;
  readonly maxResponseBodyBytes: number;
  readonly maxRedirectHops: number;
  readonly connectTimeoutMs: number;
  readonly totalTimeoutMs: number;

  constructor(options: PolicyEngineOptions = {}) {
    this.maxUrlLength = options.maxUrlLength ?? MAX_URL_LENGTH;
    this.maxResponseBodyBytes = options.maxResponseBodyBytes ?? MAX_RESPONSE_BODY_BYTES;
    this.maxRedirectHops = options.maxRedirectHops ?? MAX_REDIRECT_HOPS;
    this.connectTimeoutMs = options.connectTimeoutMs ?? CONNECT_TIMEOUT_MS;
    this.totalTimeoutMs = options.totalTimeoutMs ?? TOTAL_TIMEOUT_MS;
  }

  // ── Target Validation ─────────────────────────────────────────────────

  /**
   * Validate a target URL against all security policies.
   * FAIL CLOSED: any check failure rejects the target.
   */
  async validateTarget(target: string): Promise<PolicyDecision> {
    const checks: PolicyCheck[] = [];

    // 1. Input size
    if (target.length > this.maxUrlLength) {
      checks.push({ check: 'input_size', passed: false, detail: `URL exceeds ${this.maxUrlLength} chars` });
      return { allowed: false, reason: `URL exceeds maximum length of ${this.maxUrlLength} characters`, checks };
    }
    checks.push({ check: 'input_size', passed: true });

    // 2. Parse URL
    let url: URL;
    try {
      url = new URL(target);
    } catch {
      checks.push({ check: 'url_parse', passed: false, detail: 'Malformed URL' });
      return { allowed: false, reason: 'Malformed URL', checks };
    }
    checks.push({ check: 'url_parse', passed: true });

    // 3. Scheme
    if (!ALLOWED_SCHEMES.has(url.protocol)) {
      checks.push({ check: 'scheme', passed: false, detail: `Protocol ${url.protocol} not allowed` });
      return { allowed: false, reason: `Unsupported protocol: ${url.protocol}. Only http: and https: are allowed.`, checks };
    }
    checks.push({ check: 'scheme', passed: true });

    // 4. Embedded credentials
    if (url.username || url.password) {
      checks.push({ check: 'credentials', passed: false, detail: 'URL contains embedded credentials' });
      return { allowed: false, reason: 'URL credentials not allowed', checks };
    }
    checks.push({ check: 'credentials', passed: true });

    // 5. Hostname length
    const hostname = url.hostname.toLowerCase();
    if (hostname.length > MAX_HOSTNAME_LENGTH) {
      checks.push({ check: 'hostname_length', passed: false, detail: `Hostname exceeds ${MAX_HOSTNAME_LENGTH} chars` });
      return { allowed: false, reason: `Hostname exceeds maximum length of ${MAX_HOSTNAME_LENGTH} characters`, checks };
    }
    checks.push({ check: 'hostname_length', passed: true });

    // 6. Localhost check (covers hostname literals)
    if (isLocalhost(hostname)) {
      checks.push({ check: 'localhost', passed: false, detail: `Hostname ${hostname} is localhost` });
      return { allowed: false, reason: 'Localhost not allowed', checks };
    }
    checks.push({ check: 'localhost', passed: true });

    // 7. IP literal in hostname
    if (isIPLiteral(hostname)) {
      const ipCheck = validateIPAddress(hostname);
      if (!ipCheck.allowed) {
        checks.push({ check: 'ip_literal', passed: false, detail: ipCheck.reason });
        return { allowed: false, reason: ipCheck.reason!, checks };
      }
      checks.push({ check: 'ip_literal', passed: true });
    }

    // 8. DNS resolution — FAIL CLOSED
    if (!isIPLiteral(hostname)) {
      try {
        const addresses = await lookup(hostname, { all: true });
        if (!addresses || addresses.length === 0) {
          checks.push({ check: 'dns_resolution', passed: false, detail: 'DNS returned no addresses' });
          return { allowed: false, reason: 'DNS resolution returned no addresses', checks };
        }

        for (const addr of addresses) {
          const ipCheck = validateIPAddress(addr.address);
          if (!ipCheck.allowed) {
            checks.push({ check: 'dns_ip_validation', passed: false, detail: `Resolved IP ${addr.address}: ${ipCheck.reason}` });
            return { allowed: false, reason: `DNS resolved to blocked address ${addr.address}: ${ipCheck.reason}`, checks };
          }
        }
        checks.push({ check: 'dns_resolution', passed: true });
        checks.push({ check: 'dns_ip_validation', passed: true });
      } catch (error: any) {
        checks.push({ check: 'dns_resolution', passed: false, detail: `DNS failed: ${error.code || error.message}` });
        return { allowed: false, reason: `DNS resolution failed: ${error.code || error.message}`, checks };
      }
    }

    return { allowed: true, checks };
  }

  // ── Redirect Hop Validation ───────────────────────────────────────────

  /**
   * Validate a redirect destination URL.
   * Must be called for each redirect hop during HTTP collection.
   */
  async validateRedirectHop(redirectUrl: string, hopNumber: number): Promise<PolicyDecision> {
    if (hopNumber > this.maxRedirectHops) {
      return {
        allowed: false,
        reason: `Exceeded maximum redirect hops (${this.maxRedirectHops})`,
        checks: [{ check: 'redirect_limit', passed: false, detail: `Hop ${hopNumber} > ${this.maxRedirectHops}` }]
      };
    }
    return this.validateTarget(redirectUrl);
  }

  // ── Tool Argument Validation ──────────────────────────────────────────

  /**
   * Validate tool arguments against a typed schema.
   * Treats tool arguments as untrusted network input.
   */
  validateToolArguments(
    toolName: string,
    args: Record<string, unknown>,
    schema: ToolArgumentSchema
  ): PolicyDecision {
    const checks: PolicyCheck[] = [];

    // Reject extra fields
    const allowedKeys = new Set(Object.keys(schema));
    for (const key of Object.keys(args)) {
      if (!allowedKeys.has(key)) {
        checks.push({ check: 'unknown_field', passed: false, detail: `Unknown argument: ${key}` });
        return { allowed: false, reason: `Unknown argument '${key}' for tool '${toolName}'`, checks };
      }
    }

    // Validate each field
    for (const [key, spec] of Object.entries(schema)) {
      const val = args[key];

      // Required check
      if (spec.required && (val === undefined || val === null || val === '')) {
        checks.push({ check: `required_${key}`, passed: false, detail: `Missing required argument: ${key}` });
        return { allowed: false, reason: `Missing required argument '${key}' for tool '${toolName}'`, checks };
      }

      if (val === undefined || val === null) {
        checks.push({ check: `present_${key}`, passed: true, detail: 'Optional, not provided' });
        continue;
      }

      // Type check
      if (typeof val !== spec.type) {
        checks.push({ check: `type_${key}`, passed: false, detail: `Expected ${spec.type}, got ${typeof val}` });
        return { allowed: false, reason: `Argument '${key}' must be of type '${spec.type}', got '${typeof val}'`, checks };
      }

      // Max length for strings
      if (spec.type === 'string' && spec.maxLength && (val as string).length > spec.maxLength) {
        checks.push({ check: `length_${key}`, passed: false, detail: `Exceeds max length ${spec.maxLength}` });
        return { allowed: false, reason: `Argument '${key}' exceeds maximum length of ${spec.maxLength}`, checks };
      }

      // Pattern validation for strings
      if (spec.type === 'string' && spec.pattern && !spec.pattern.test(val as string)) {
        checks.push({ check: `pattern_${key}`, passed: false, detail: `Does not match required pattern` });
        return { allowed: false, reason: `Argument '${key}' contains invalid characters`, checks };
      }

      checks.push({ check: `valid_${key}`, passed: true });
    }

    return { allowed: true, checks };
  }

  // ── Bundle Name Validation ────────────────────────────────────────────

  /**
   * Validate a bundle filename. Prevents directory traversal and injection.
   */
  validateBundleName(name: string): PolicyDecision {
    const checks: PolicyCheck[] = [];

    if (typeof name !== 'string' || name.length === 0) {
      checks.push({ check: 'bundle_name_type', passed: false });
      return { allowed: false, reason: 'Bundle name must be a non-empty string', checks };
    }

    if (name.length > MAX_BUNDLE_NAME_LENGTH) {
      checks.push({ check: 'bundle_name_length', passed: false });
      return { allowed: false, reason: `Bundle name exceeds ${MAX_BUNDLE_NAME_LENGTH} characters`, checks };
    }

    // Reject path traversal
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      checks.push({ check: 'bundle_traversal', passed: false, detail: 'Path traversal characters detected' });
      return { allowed: false, reason: 'Bundle name contains path traversal characters', checks };
    }

    // Whitelist allowed characters
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      checks.push({ check: 'bundle_chars', passed: false, detail: 'Invalid characters in bundle name' });
      return { allowed: false, reason: 'Bundle name contains invalid characters', checks };
    }

    if (!name.endsWith('.argusbundle')) {
      checks.push({ check: 'bundle_extension', passed: false });
      return { allowed: false, reason: 'Bundle name must end with .argusbundle', checks };
    }

    checks.push({ check: 'bundle_name_valid', passed: true });
    return { allowed: true, checks };
  }

  // ── Free-Text Input Validation ────────────────────────────────────────

  /**
   * Validate free-form text input (e.g., AI analyst objectives).
   */
  validateTextInput(text: string, maxLength: number = MAX_INPUT_SIZE): PolicyDecision {
    const checks: PolicyCheck[] = [];

    if (typeof text !== 'string') {
      checks.push({ check: 'text_type', passed: false });
      return { allowed: false, reason: 'Input must be a string', checks };
    }

    if (text.length > maxLength) {
      checks.push({ check: 'text_length', passed: false, detail: `Exceeds ${maxLength} chars` });
      return { allowed: false, reason: `Input exceeds maximum length of ${maxLength} characters`, checks };
    }

    if (text.trim().length === 0) {
      checks.push({ check: 'text_empty', passed: false });
      return { allowed: false, reason: 'Input must not be empty', checks };
    }

    checks.push({ check: 'text_valid', passed: true });
    return { allowed: true, checks };
  }

  // ── Tool Allowlist ────────────────────────────────────────────────────

  /**
   * Check if a tool name is in the allowed set. Unknown tools fail closed.
   */
  validateToolName(toolName: string, allowedTools: string[]): PolicyDecision {
    const checks: PolicyCheck[] = [];

    if (!allowedTools.includes(toolName)) {
      checks.push({ check: 'tool_allowlist', passed: false, detail: `Tool '${toolName}' not in allowlist` });
      return { allowed: false, reason: `POLICY_VIOLATION: Tool '${toolName}' is not permitted`, checks };
    }

    checks.push({ check: 'tool_allowlist', passed: true });
    return { allowed: true, checks };
  }
}

// ── IP Validation Helpers (exported for testing) ───────────────────────────

export function isLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower === '::1' ||
    lower === '::' ||
    lower === '0.0.0.0' ||
    lower === '[::1]' ||
    lower === '[::] ' ||
    lower === '0:0:0:0:0:0:0:1' ||
    lower === '0:0:0:0:0:0:0:0'
  );
}

export function isIPLiteral(hostname: string): boolean {
  // IPv4 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  // IPv6 literal (may be bracket-wrapped from URL)
  if (hostname.startsWith('[') && hostname.endsWith(']')) return true;
  if (hostname.includes(':')) return true;
  return false;
}

export interface IPValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a resolved IP address against all blocked ranges.
 * Handles IPv4, IPv6, and IPv4-mapped IPv6.
 */
export function validateIPAddress(ip: string): IPValidationResult {
  // Strip brackets from IPv6
  let cleaned = ip;
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1);
  }

  // Check IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const v4MappedMatch = cleaned.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (v4MappedMatch) {
    return validateIPv4(v4MappedMatch[1]);
  }

  // Check for IPv4-compatible IPv6 (::x.x.x.x)
  const v4CompatMatch = cleaned.match(/^::(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4CompatMatch) {
    return validateIPv4(v4CompatMatch[1]);
  }

  // Check IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned)) {
    return validateIPv4(cleaned);
  }

  // IPv6
  if (cleaned.includes(':')) {
    return validateIPv6(cleaned);
  }

  return { allowed: false, reason: 'Invalid IP address format' };
}

function validateIPv4(ip: string): IPValidationResult {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return { allowed: false, reason: 'Invalid IPv4 address' };
  }

  const [a, b] = parts;

  // Cloud metadata endpoints
  if (ip === '169.254.169.254') {
    return { allowed: false, reason: 'Cloud metadata endpoint not allowed (169.254.169.254)' };
  }

  // 127.0.0.0/8 — Loopback
  if (a === 127) {
    return { allowed: false, reason: 'Loopback address not allowed (127.0.0.0/8)' };
  }

  // 0.0.0.0/8 — Current network
  if (a === 0) {
    return { allowed: false, reason: 'Current network address not allowed (0.0.0.0/8)' };
  }

  // 10.0.0.0/8 — RFC1918
  if (a === 10) {
    return { allowed: false, reason: 'Private network not allowed (10.0.0.0/8)' };
  }

  // 172.16.0.0/12 — RFC1918
  if (a === 172 && b >= 16 && b <= 31) {
    return { allowed: false, reason: 'Private network not allowed (172.16.0.0/12)' };
  }

  // 192.168.0.0/16 — RFC1918
  if (a === 192 && b === 168) {
    return { allowed: false, reason: 'Private network not allowed (192.168.0.0/16)' };
  }

  // 100.64.0.0/10 — CGNAT
  if (a === 100 && b >= 64 && b <= 127) {
    return { allowed: false, reason: 'CGNAT address not allowed (100.64.0.0/10)' };
  }

  // 169.254.0.0/16 — Link-local
  if (a === 169 && b === 254) {
    return { allowed: false, reason: 'Link-local address not allowed (169.254.0.0/16)' };
  }

  // 224.0.0.0/4 — Multicast
  if (a >= 224 && a <= 239) {
    return { allowed: false, reason: 'Multicast address not allowed (224.0.0.0/4)' };
  }

  // 240.0.0.0/4 — Reserved
  if (a >= 240) {
    return { allowed: false, reason: 'Reserved address not allowed (240.0.0.0/4)' };
  }

  return { allowed: true };
}

function validateIPv6(ip: string): IPValidationResult {
  const lower = ip.toLowerCase();

  // ::1 — Loopback
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') {
    return { allowed: false, reason: 'IPv6 loopback not allowed (::1)' };
  }

  // :: — Unspecified
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') {
    return { allowed: false, reason: 'IPv6 unspecified address not allowed (::)' };
  }

  // fe80::/10 — Link-local
  if (lower.startsWith('fe8') || lower.startsWith('fe9') ||
      lower.startsWith('fea') || lower.startsWith('feb')) {
    return { allowed: false, reason: 'IPv6 link-local not allowed (fe80::/10)' };
  }

  // fc00::/7 — Unique local (ULA)
  if (lower.startsWith('fc') || lower.startsWith('fd')) {
    return { allowed: false, reason: 'IPv6 unique-local not allowed (fc00::/7)' };
  }

  // ff00::/8 — Multicast
  if (lower.startsWith('ff')) {
    return { allowed: false, reason: 'IPv6 multicast not allowed (ff00::/8)' };
  }

  return { allowed: true };
}
