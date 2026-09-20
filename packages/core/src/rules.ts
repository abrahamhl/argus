/**
 * Deterministic Rules Engine
 *
 * Production implementation of HTTP and DNS security rules.
 * Each rule is deterministic: same evidence → same finding.
 * Strict Invariants:
 * - What was observed (factual observation)
 * - What that supports (technical deduction)
 * - Confidence (VERIFIED, SUPPORTED, INFERRED, UNKNOWN, CONTRADICTED)
 * - Why it matters (clear, non-sensational business context)
 * - Limitations (explicit boundary of the observation)
 * - NO fear-based claims (no premature GDPR violation claims or "website hacked")
 */

import { Evidence, Finding, Opportunity } from '@argus/schema';
import { hashValue } from './crypto.js';
import { Rule } from './engine.js';
import { AUX_SERVICE_CATALOG } from './service-catalog.js';

/**
 * Generates a stable finding ID from rule and canonical evidence.
 */
export function stableFindingId(ruleId: string, targetId: string, canonicalInputs: any[]): string {
  const canonicalVal = JSON.stringify(canonicalInputs.sort());
  const hash = hashValue(`${ruleId}::${targetId}::${canonicalVal}`);
  return `fnd_${hash.slice(0, 12)}`;
}

/**
 * Canonicalizes a value for deterministic comparison.
 */
export function canonical(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonical).sort();
  const sorted: Record<string, any> = {};
  Object.keys(value).sort().forEach(key => {
    sorted[key] = canonical(value[key]);
  });
  return sorted;
}

const SENSITIVE_KEY_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'apikey',
  'secret',
  'password',
  'token',
  'access_token',
  'id_token',
  'session_id'
]);

/**
 * Redacts sensitive values from evidence recursively.
 */
export function redact(value: any): any {
  if (typeof value !== 'object' || value === null) return value;

  if (Array.isArray(value)) {
    return value.map(redact);
  }

  const redacted: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    const lowerKey = k.toLowerCase();
    if (SENSITIVE_KEY_NAMES.has(lowerKey)) {
      redacted[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      redacted[k] = redact(v);
    } else {
      redacted[k] = v;
    }
  }

  return redacted;
}

/**
 * Redacts evidence for safe storage/transmission.
 */
export function redactEvidence(evidence: Evidence): Evidence {
  return {
    ...evidence,
    rawValue: redact(evidence.rawValue),
    normalizedValue: redact(evidence.normalizedValue)
  };
}

// ============================================================================
// HTTP SECURITY RULES
// ============================================================================

export const ruleMissingHSTS: Rule = {
  id: 'rule-http-missing-hsts',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasHSTS = Object.keys(headers).some(k =>
        k.toLowerCase() === 'strict-transport-security'
      );

      if (!hasHSTS) {
        const findingId = stableFindingId('rule-http-missing-hsts', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-hsts',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing HSTS Header',
          description: 'The HTTP Strict-Transport-Security header is not present.',
          technicalExplanation: 'HSTS instructs compliant web browsers to strictly connect over HTTPS, preventing SSL-stripping downgrade attacks.',
          remediation: 'Configure Strict-Transport-Security header (e.g. max-age=31536000; includeSubDomains).',
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'No Strict-Transport-Security header present in HTTPS response.',
          supports: 'Client browsers are not instructed to mandate HTTPS connections on subsequent visits.',
          whyItMatters: 'Visitors on hostile or public Wi-Fi networks could be subjected to protocol downgrade attacks if they navigate to http://.',
          limitations: 'Does not inspect whether the domain is pre-included in browser vendor HSTS preload lists.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleMissingCSP: Rule = {
  id: 'rule-http-missing-csp',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasCSP = Object.keys(headers).some(k =>
        k.toLowerCase() === 'content-security-policy'
      );

      if (!hasCSP) {
        const findingId = stableFindingId('rule-http-missing-csp', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-csp',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing Content-Security-Policy',
          description: 'The Content-Security-Policy header is not configured.',
          technicalExplanation: 'CSP mitigates XSS attacks and unauthorized data exfiltration by restricting permitted script, style, and frame sources.',
          remediation: "Add Content-Security-Policy header with appropriate directives (e.g., default-src 'self').",
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'No Content-Security-Policy header returned in HTTP response.',
          supports: 'Browser has no server-enforced policy restricting external script or asset origins.',
          whyItMatters: 'Reduces defense-in-depth protection against cross-site scripting (XSS) and unwanted third-party embeds.',
          limitations: 'Observation does not evaluate whether inline scripts exist or whether the site architecture requires relaxed policies.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleMissingXContentTypeOptions: Rule = {
  id: 'rule-http-missing-x-content-type-options',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasXCTO = Object.keys(headers).some(k =>
        k.toLowerCase() === 'x-content-type-options'
      );

      if (!hasXCTO) {
        const findingId = stableFindingId('rule-http-missing-x-content-type-options', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-x-content-type-options',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing X-Content-Type-Options Header',
          description: 'The X-Content-Type-Options: nosniff header is missing.',
          technicalExplanation: 'Prevents the browser from MIME-sniffing a response away from the declared content-type.',
          remediation: 'Add X-Content-Type-Options: nosniff header to HTTP responses.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'X-Content-Type-Options: nosniff header is missing from server response.',
          supports: 'Browser may attempt to infer MIME types independently of Content-Type declaration.',
          whyItMatters: 'Could allow non-executable uploaded assets to be treated as executable scripts in older clients.',
          limitations: 'Modern browsers have hardened default MIME sniffing behavior.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleMissingReferrerPolicy: Rule = {
  id: 'rule-http-missing-referrer-policy',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasRP = Object.keys(headers).some(k =>
        k.toLowerCase() === 'referrer-policy'
      );

      if (!hasRP) {
        const findingId = stableFindingId('rule-http-missing-referrer-policy', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-referrer-policy',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing Referrer-Policy Header',
          description: 'The Referrer-Policy header is not configured.',
          technicalExplanation: 'Controls how much referrer information is included with requests made from your site.',
          remediation: 'Add Referrer-Policy: strict-origin-when-cross-origin to responses.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'No Referrer-Policy header specified in HTTP response.',
          supports: 'Browser defaults to client vendor referrer settings upon link navigation.',
          whyItMatters: 'May inadvertently disclose internal URLs or query parameters to external websites.',
          limitations: 'Modern desktop browsers default to strict-origin-when-cross-origin even when header is absent.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleMissingFrameProtection: Rule = {
  id: 'rule-http-missing-frame-protection',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasXFO = Object.keys(headers).some(k => k.toLowerCase() === 'x-frame-options');
      const csp = headers['content-security-policy'];
      const hasFrameAncestors = csp && csp.includes('frame-ancestors');

      if (!hasXFO && !hasFrameAncestors) {
        const findingId = stableFindingId('rule-http-missing-frame-protection', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-frame-protection',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing Frame Protection (Clickjacking)',
          description: 'Neither X-Frame-Options nor CSP frame-ancestors is configured.',
          technicalExplanation: 'Allows pages to be embedded in iframes on third-party domains, enabling clickjacking.',
          remediation: "Add X-Frame-Options: SAMEORIGIN or CSP frame-ancestors 'self'.",
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'Neither X-Frame-Options nor CSP frame-ancestors directive was detected.',
          supports: 'The web page may be embedded inside an iframe on arbitrary external websites.',
          whyItMatters: 'Could enable clickjacking attacks if user-interactive or authenticated actions occur on this page.',
          limitations: 'Low practical risk for purely static brochure sites without login or interactive forms.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleRedirectLoop: Rule = {
  id: 'rule-http-redirect-loop',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const loopEvidence = evidence.filter(e => e.type === 'HTTP_REDIRECT_LOOP');
    if (loopEvidence.length === 0) return [];

    return loopEvidence.map(ev => {
      const findingId = stableFindingId('rule-http-redirect-loop', targetId, [canonical(ev.rawValue)]);
      return {
        id: findingId,
        findingId,
        ruleId: 'rule-http-redirect-loop',
        ruleVersion: '1.0.0',
        target: ev.source,
        targetId,
        runId: ev.runId,
        title: 'HTTP Redirect Loop Detected',
        description: 'The target URL produces an infinite redirect loop or exceeds maximum hops.',
        technicalExplanation: 'Redirect loops prevent clients from reaching the destination website.',
        remediation: 'Inspect web server rewrite rules and reverse proxy SSL termination configuration.',
        severity: 'HIGH',
        confidence: 'VERIFIED',
        evidenceIds: [ev.id],
        observed: 'HTTP collector encountered circular or excessive redirects exceeding hop limits.',
        supports: 'Server routing configuration error preventing site resolution.',
        whyItMatters: 'Direct denial of service for human visitors and search engine indexers.',
        limitations: 'Observed from external auditor network perspective.',
        aiAssisted: false
      };
    });
  }
};

// ============================================================================
// DNS & EMAIL SECURITY RULES
// ============================================================================

function extractTxtStrings(ev: Evidence): string[] | null {
  const norm = ev.normalizedValue !== undefined ? ev.normalizedValue : ev.rawValue;
  if (norm === null || typeof norm !== 'object') return null;

  if (Array.isArray(norm.records)) {
    return norm.records.map((r: any) => (Array.isArray(r) ? r.join('') : String(r)));
  }
  if (Array.isArray(norm.raw)) {
    return norm.raw.map((r: any) => (Array.isArray(r) ? r.join('') : String(r)));
  }
  if (Array.isArray(norm)) {
    return norm.map((r: any) => (Array.isArray(r) ? r.join('') : String(r)));
  }
  return null;
}

export const ruleMissingSPF: Rule = {
  id: 'rule-dns-missing-spf',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const txtEvs = evidence.filter(e =>
      (e.type === 'DNS_TXT' || (e.normalizedValue && e.normalizedValue.kind === 'SPF')) &&
      e.normalizedValue?.kind !== 'DMARC'
    );
    if (txtEvs.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of txtEvs) {
      if (ev.normalizedValue === 'garbage' || ev.normalizedValue === null || (ev.normalizedValue !== undefined && typeof ev.normalizedValue !== 'object')) continue;
      if (ev.normalizedValue?.kind === 'DMARC') continue;

      const txtStrings = extractTxtStrings(ev);
      if (txtStrings === null) continue;

      const hasSPF = txtStrings.some(s => s.startsWith('v=spf1'));

      if (!hasSPF) {
        const findingId = stableFindingId('rule-dns-missing-spf', targetId, [canonical(txtStrings)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-missing-spf',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing SPF Record',
          description: 'No SPF record found for domain.',
          technicalExplanation: 'SPF specifies which mail servers are authorized to send email for the domain.',
          remediation: 'Add SPF record in DNS TXT record: v=spf1 include:_spf.example.com -all',
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'No TXT record starting with v=spf1 found in domain DNS query.',
          supports: 'Domain does not declare authorized mail sending infrastructure via SPF.',
          whyItMatters: 'Increases the likelihood that spoofed emails sent in your company’s name reach customer inboxes.',
          limitations: 'Only relevant if the domain is used for email communication.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleWeakSPF: Rule = {
  id: 'rule-dns-weak-spf',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const txtEvs = evidence.filter(e =>
      (e.type === 'DNS_TXT' || (e.normalizedValue && e.normalizedValue.kind === 'SPF')) &&
      e.normalizedValue?.kind !== 'DMARC'
    );
    if (txtEvs.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of txtEvs) {
      if (ev.normalizedValue === 'garbage' || ev.normalizedValue === null || (ev.normalizedValue !== undefined && typeof ev.normalizedValue !== 'object')) continue;
      if (ev.normalizedValue?.kind === 'DMARC') continue;

      const txtStrings = extractTxtStrings(ev);
      if (txtStrings === null) continue;

      const spfRecord = txtStrings.find(s => s.startsWith('v=spf1'));
      if (!spfRecord) continue;

      const hasSoftFail = /~all(\s|$)/.test(spfRecord);
      const hasPassAll = /\+all(\s|$)/.test(spfRecord);
      const hasNeutral = /\?all(\s|$)/.test(spfRecord);

      if (hasSoftFail || hasPassAll || hasNeutral) {
        const findingId = stableFindingId('rule-dns-weak-spf', targetId, [canonical([spfRecord])]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-weak-spf',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Weak SPF Record (~all or +all)',
          description: 'SPF record uses ~all (softfail) or +all instead of -all (hardfail).',
          technicalExplanation: '~all allows unauthorized emails through with a soft warning, while -all rejects them.',
          remediation: 'Change ~all to -all in SPF record for stricter enforcement.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: `SPF record mechanism ends with ${hasSoftFail ? '~all' : hasPassAll ? '+all' : '?all'} instead of -all.`,
          supports: 'Unauthorized mail from third-party servers is marked as questionable rather than hard-rejected.',
          whyItMatters: 'Allows sophisticated spoofing attempts to bypass strict spam filters in some recipient mail services.',
          limitations: '~all is commonly used during testing or onboarding of new email service providers.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleMissingDMARC: Rule = {
  id: 'rule-dns-missing-dmarc',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const dmarcEvs = evidence.filter(e =>
      e.type === 'DNS_DMARC' ||
      (e.type === 'DNS_TXT' && e.normalizedValue?.kind === 'DMARC')
    );
    if (dmarcEvs.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of dmarcEvs) {
      if (ev.normalizedValue === 'garbage' || ev.normalizedValue === null || (ev.normalizedValue !== undefined && typeof ev.normalizedValue !== 'object')) continue;
      if (ev.normalizedValue?.kind === 'DMARC' && !Array.isArray(ev.normalizedValue.records) && !ev.normalizedValue.dmarc && !Array.isArray(ev.normalizedValue.raw)) continue;

      const txtStrings = extractTxtStrings(ev);
      if (txtStrings === null) continue;

      const hasDMARC = txtStrings.some(s => s.startsWith('v=DMARC1'));

      if (!hasDMARC) {
        const findingId = stableFindingId('rule-dns-missing-dmarc', targetId, [canonical(txtStrings)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-missing-dmarc',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing DMARC Record',
          description: 'No DMARC record found for domain.',
          technicalExplanation: 'DMARC provides email authentication and reporting.',
          remediation: 'Add DMARC TXT record at _dmarc subdomain: v=DMARC1; p=reject; rua=mailto:dmarc@example.com',
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'No TXT record found at _dmarc.<domain>.',
          supports: 'Domain lacks unified DMARC policy enforcement and spoofing visibility.',
          whyItMatters: 'Enables direct domain name spoofing in invoice fraud or CEO fraud campaigns targeting clients.',
          limitations: 'Effective DMARC requires valid SPF and DKIM alignment.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleDMARCPolicyNone: Rule = {
  id: 'rule-dns-dmarc-p-none',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const dmarcEvs = evidence.filter(e =>
      e.type === 'DNS_DMARC' ||
      (e.type === 'DNS_TXT' && e.normalizedValue?.kind === 'DMARC')
    );
    if (dmarcEvs.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of dmarcEvs) {
      if (ev.normalizedValue === 'garbage' || ev.normalizedValue === null || (ev.normalizedValue !== undefined && typeof ev.normalizedValue !== 'object')) continue;
      if (ev.normalizedValue?.kind === 'DMARC' && !Array.isArray(ev.normalizedValue.records) && !ev.normalizedValue.dmarc && !Array.isArray(ev.normalizedValue.raw)) continue;

      const txtStrings = extractTxtStrings(ev);
      if (txtStrings === null) continue;

      const dmarcRecord = txtStrings.find(s => s.startsWith('v=DMARC1'));

      if (dmarcRecord && /p=none/i.test(dmarcRecord)) {
        const findingId = stableFindingId('rule-dns-dmarc-p-none', targetId, [canonical([dmarcRecord])]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-dmarc-p-none',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'DMARC Policy Set to None',
          description: 'DMARC policy is p=none, providing monitoring but no enforcement.',
          technicalExplanation: 'p=none only monitors failed authentication without taking action.',
          remediation: 'Change p=none to p=quarantine or p=reject for enforcement.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'DMARC record contains p=none directive.',
          supports: 'Recipient mail servers deliver unauthenticated emails claiming to be from your domain.',
          whyItMatters: 'Monitoring mode does not protect your clients or partners from active phishing attacks.',
          limitations: 'p=none is the recommended starting stage for safely collecting sender analytics before enforcement.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

export const ruleMissingCAA: Rule = {
  id: 'rule-dns-missing-caa',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const caaEvs = evidence.filter(e => e.type === 'DNS_CAA');
    if (caaEvs.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of caaEvs) {
      if (ev.normalizedValue === 'garbage' || ev.normalizedValue === null || (ev.normalizedValue !== undefined && typeof ev.normalizedValue !== 'object')) continue;
      const records = Array.isArray(ev.normalizedValue?.records)
        ? ev.normalizedValue.records
        : Array.isArray(ev.normalizedValue?.raw)
        ? ev.normalizedValue.raw
        : ev.normalizedValue === undefined && Array.isArray(ev.rawValue)
        ? ev.rawValue
        : null;

      if (records === null) continue;

      if (records.length === 0) {
        const findingId = stableFindingId('rule-dns-missing-caa', targetId, [canonical(records)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-missing-caa',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing CAA Record',
          description: 'No CAA record found for domain.',
          technicalExplanation: 'CAA records specify which CAs can issue certificates for the domain.',
          remediation: 'Add CAA DNS record: 0 issue "letsencrypt.org"',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id],
          observed: 'DNS query returned no CAA records for domain.',
          supports: 'Any trusted public CA is permitted to issue certificates for this domain name.',
          whyItMatters: 'Increases risk if a public CA is compromised or erroneously validates ownership.',
          limitations: 'CAA is an optional hygiene control; absence is standard for many small business domains.',
          aiAssisted: false
        });
      }
    }

    return findings;
  }
};

// ============================================================================
// RULE REGISTRY
// ============================================================================

export const RULES: Rule[] = [
  ruleMissingHSTS,
  ruleMissingCSP,
  ruleMissingXContentTypeOptions,
  ruleMissingReferrerPolicy,
  ruleMissingFrameProtection,
  ruleRedirectLoop,
  ruleMissingSPF,
  ruleWeakSPF,
  ruleMissingDMARC,
  ruleDMARCPolicyNone,
  ruleMissingCAA
];

/**
 * Runs all registered rules against evidence.
 */
export function runRules(evidence: Evidence[]): Finding[] {
  if (!evidence || !Array.isArray(evidence) || evidence.length === 0) return [];

  const safeEvidence = evidence.filter(e => e && typeof e === 'object' && typeof e.type === 'string');
  if (safeEvidence.length === 0) return [];

  const targetId = safeEvidence[0]?.targetId || 'unknown';
  const allFindings: Finding[] = [];

  for (const rule of RULES) {
    try {
      const findings = rule.evaluate(safeEvidence, targetId);
      allFindings.push(...findings);
    } catch (error) {
      console.error(`Rule ${rule.id} failed:`, error);
    }
  }

  return allFindings;
}

export function runRulesByIds(evidence: Evidence[], ruleIds: string[]): Finding[] {
  if (!evidence || !Array.isArray(evidence) || evidence.length === 0) return [];

  const safeEvidence = evidence.filter(e => e && typeof e === 'object' && typeof e.type === 'string');
  if (safeEvidence.length === 0) return [];

  const targetId = safeEvidence[0]?.targetId || 'unknown';
  const selectedRules = RULES.filter(r => ruleIds.includes(r.id));
  const allFindings: Finding[] = [];

  for (const rule of selectedRules) {
    try {
      const findings = rule.evaluate(safeEvidence, targetId);
      allFindings.push(...findings);
    } catch (error) {
      console.error(`Rule ${rule.id} failed:`, error);
    }
  }

  return allFindings;
}

/**
 * Maps technical findings to understandable AUX Design service opportunities.
 */
export function mapFindingsToOpportunities(findings: Finding[]): Opportunity[] {
  if (findings.length === 0) return [];

  const opportunities: Opportunity[] = [];

  // 1. Group HTTP security findings -> AUX-SEC-WEB-HARDENING
  const httpFindings = findings.filter(f => f.ruleId.startsWith('rule-http-'));
  if (httpFindings.length > 0) {
    const service = AUX_SERVICE_CATALOG.find(s => s.serviceId === 'AUX-SEC-WEB-HARDENING');
    opportunities.push({
      id: `opp_sec_${Date.now()}`,
      serviceId: 'AUX-SEC-WEB-HARDENING',
      title: service ? service.title.nl : 'Verbeter de Website Beveiliging',
      supportingFindingIds: httpFindings.map(f => f.findingId).sort(),
      confidence: 'VERIFIED',
      technicalSignificance: `${httpFindings.length} security headers missing or misconfigured`,
      businessSignificance: service ? service.clientBenefit.nl : 'Protects customer data and builds trust through modern security practices',
      businessArea: 'Customer Trust & Privacy',
      technicalArea: 'HTTP Security Headers',
      serviceCategory: 'SECURITY_HARDENING',
      retestAvailable: true,
      needsClientAccess: false,
      estimatedComplexity: 'LOW',
      clientExplanationKey: 'security.headers.missing',
      clientExplanation: service ? {
        nl: service.description.nl,
        en: service.description.en,
        es: service.description.es
      } : undefined,
      remediationEstimate: service ? {
        estimatedHoursMin: service.estimatedHours.min,
        estimatedHoursMax: service.estimatedHours.max,
        indicativePriceEur: service.indicativePriceEur
      } : undefined
    });
  }

  // 2. Group email trust findings -> AUX-SEC-EMAIL-TRUST
  const emailFindings = findings.filter(f =>
    f.ruleId.includes('spf') || f.ruleId.includes('dmarc')
  );
  if (emailFindings.length > 0) {
    const service = AUX_SERVICE_CATALOG.find(s => s.serviceId === 'AUX-SEC-EMAIL-TRUST');
    opportunities.push({
      id: `opp_email_${Date.now()}`,
      serviceId: 'AUX-SEC-EMAIL-TRUST',
      title: service ? service.title.nl : 'Versterk E-mail Betrouwbaarheid',
      supportingFindingIds: emailFindings.map(f => f.findingId).sort(),
      confidence: 'VERIFIED',
      technicalSignificance: `${emailFindings.length} email authentication issues detected`,
      businessSignificance: service ? service.clientBenefit.nl : 'Prevents email spoofing and improves deliverability',
      businessArea: 'Email Communication',
      technicalArea: 'DNS Email Security',
      serviceCategory: 'EMAIL_TRUST',
      retestAvailable: true,
      needsClientAccess: true,
      estimatedComplexity: 'MEDIUM',
      clientExplanationKey: 'email.trust.dns',
      clientExplanation: service ? {
        nl: service.description.nl,
        en: service.description.en,
        es: service.description.es
      } : undefined,
      remediationEstimate: service ? {
        estimatedHoursMin: service.estimatedHours.min,
        estimatedHoursMax: service.estimatedHours.max,
        indicativePriceEur: service.indicativePriceEur
      } : undefined
    });
  }

  return opportunities;
}
