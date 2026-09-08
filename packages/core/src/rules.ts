/**
 * Deterministic Rules Engine
 *
 * Production implementation of HTTP and DNS security rules.
 * Each rule is deterministic: same evidence → same finding.
 */

import type { Evidence, Finding, Opportunity, Confidence } from '@argus/schema';
import { hashValue } from './crypto.js';

export interface Rule {
  id: string;
  version: string;
  evaluate: (evidence: Evidence[], targetId: string) => Finding[];
}

/**
 * Generates a stable finding ID from rule and canonical evidence.
 */
export function stableFindingId(ruleId: string, targetId: string, canonicalInputs: any[]): string {
  const canonical = JSON.stringify(canonicalInputs.sort());
  const hash = hashValue(`${ruleId}::${targetId}::${canonical}`);
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

/**
 * Redacts sensitive values from evidence.
 */
export function redact(value: any): any {
  if (typeof value !== 'object' || value === null) return value;

  const redacted = Array.isArray(value) ? [...value] : { ...value };

  if ('headers' in redacted && typeof redacted.headers === 'object') {
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];
    const headers = { ...redacted.headers };
    Object.keys(headers).forEach(key => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        headers[key] = '[REDACTED]';
      }
    });
    redacted.headers = headers;
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

const ruleMissingHSTS: Rule = {
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
          technicalExplanation: 'HSTS prevents protocol downgrade attacks and cookie hijacking by forcing browsers to use HTTPS.',
          remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains header to all HTTPS responses.',
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleMissingCSP: Rule = {
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
          technicalExplanation: 'CSP mitigates XSS attacks by controlling which resources can be loaded.',
          remediation: "Add Content-Security-Policy header with appropriate directives (e.g., default-src 'self').",
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleMissingXContentTypeOptions: Rule = {
  id: 'rule-http-missing-x-content-type-options',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasHeader = Object.keys(headers).some(k =>
        k.toLowerCase() === 'x-content-type-options'
      );

      if (!hasHeader) {
        const findingId = stableFindingId('rule-http-missing-x-content-type-options', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-x-content-type-options',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing X-Content-Type-Options',
          description: 'X-Content-Type-Options: nosniff is not set.',
          technicalExplanation: 'Prevents browsers from MIME-sniffing responses away from declared content type.',
          remediation: 'Add X-Content-Type-Options: nosniff header.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleMissingReferrerPolicy: Rule = {
  id: 'rule-http-missing-referrer-policy',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasHeader = Object.keys(headers).some(k =>
        k.toLowerCase() === 'referrer-policy'
      );

      if (!hasHeader) {
        const findingId = stableFindingId('rule-http-missing-referrer-policy', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-referrer-policy',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing Referrer-Policy',
          description: 'Referrer-Policy header is not configured.',
          technicalExplanation: 'Controls how much referrer information is sent with requests.',
          remediation: 'Add Referrer-Policy: strict-origin-when-cross-origin or no-referrer.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleMissingFrameProtection: Rule = {
  id: 'rule-http-missing-frame-protection',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const httpEvidence = evidence.filter(e => e.type === 'HTTP_RESPONSE');
    if (httpEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of httpEvidence) {
      const headers = ev.normalizedValue?.headers;
      if (!headers || typeof headers !== 'object') continue;

      const hasXFrameOptions = Object.keys(headers).some(k =>
        k.toLowerCase() === 'x-frame-options'
      );

      if (!hasXFrameOptions) {
        const findingId = stableFindingId('rule-http-missing-frame-protection', targetId, [canonical(headers)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-http-missing-frame-protection',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing Frame Protection',
          description: 'X-Frame-Options header is not set.',
          technicalExplanation: 'Prevents clickjacking attacks by controlling iframe embedding.',
          remediation: 'Add X-Frame-Options: DENY or SAMEORIGIN header.',
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

// ============================================================================
// DNS / EMAIL RULES
// ============================================================================

const ruleMissingSPF: Rule = {
  id: 'rule-dns-missing-spf',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const txtEvidence = evidence.filter(e => e.type === 'DNS_TXT');
    if (txtEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of txtEvidence) {
      const records = ev.normalizedValue?.records;
      if (!Array.isArray(records)) continue;

      const hasSPF = records.some((r: string) => r.startsWith('v=spf1'));

      if (!hasSPF) {
        const findingId = stableFindingId('rule-dns-missing-spf', targetId, [canonical(records)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-missing-spf',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Missing SPF Record',
          description: 'No SPF record found in DNS TXT records.',
          technicalExplanation: 'SPF prevents email spoofing by specifying authorized mail servers.',
          remediation: 'Add SPF TXT record: v=spf1 include:_spf.example.com -all',
          severity: 'MEDIUM',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleWeakSPF: Rule = {
  id: 'rule-dns-weak-spf',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const txtEvidence = evidence.filter(e => e.type === 'DNS_TXT');
    if (txtEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of txtEvidence) {
      const records = ev.normalizedValue?.records;
      if (!Array.isArray(records)) continue;

      const spfRecord = records.find((r: string) => r.startsWith('v=spf1'));
      if (spfRecord && spfRecord.includes('~all')) {
        const findingId = stableFindingId('rule-dns-weak-spf', targetId, [canonical(records)]);
        findings.push({
          id: findingId,
          findingId,
          ruleId: 'rule-dns-weak-spf',
          ruleVersion: '1.0.0',
          target: ev.source,
          targetId,
          runId: ev.runId,
          title: 'Weak SPF Policy (~all)',
          description: 'SPF record uses soft-fail (~all) instead of hard-fail (-all).',
          technicalExplanation: 'Soft-fail allows unauthorized servers to send email, reducing protection.',
          remediation: 'Change ~all to -all in SPF record for stricter enforcement.',
          severity: 'LOW',
          confidence: 'VERIFIED',
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleMissingDMARC: Rule = {
  id: 'rule-dns-missing-dmarc',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const dmarcEvidence = evidence.filter(e =>
      e.type === 'DNS_TXT' && e.normalizedValue?.kind === 'DMARC'
    );
    if (dmarcEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of dmarcEvidence) {
      const records = ev.normalizedValue?.records;
      if (!Array.isArray(records)) continue;

      if (records.length === 0) {
        const findingId = stableFindingId('rule-dns-missing-dmarc', targetId, [canonical(records)]);
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
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleDMARCPolicyNone: Rule = {
  id: 'rule-dns-dmarc-p-none',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const dmarcEvidence = evidence.filter(e =>
      e.type === 'DNS_TXT' && e.normalizedValue?.kind === 'DMARC'
    );
    if (dmarcEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of dmarcEvidence) {
      const records = ev.normalizedValue?.records;
      if (!Array.isArray(records) || records.length === 0) continue;

      const dmarcRecord = records.find((r: string) => r.startsWith('v=DMARC1'));
      if (dmarcRecord && /p=none/i.test(dmarcRecord)) {
        const findingId = stableFindingId('rule-dns-dmarc-p-none', targetId, [canonical(records)]);
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
          evidenceIds: [ev.id]
        });
      }
    }

    return findings;
  }
};

const ruleMissingCAA: Rule = {
  id: 'rule-dns-missing-caa',
  version: '1.0.0',
  evaluate: (evidence: Evidence[], targetId: string): Finding[] => {
    const caaEvidence = evidence.filter(e => e.type === 'DNS_CAA');
    if (caaEvidence.length === 0) return [];

    const findings: Finding[] = [];

    for (const ev of caaEvidence) {
      const records = ev.normalizedValue?.records;
      if (!Array.isArray(records)) continue;

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
          evidenceIds: [ev.id]
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
  if (evidence.length === 0) return [];

  // Get targetId from first evidence
  const targetId = evidence[0]?.targetId || 'unknown';

  const allFindings: Finding[] = [];
  for (const rule of RULES) {
    try {
      const findings = rule.evaluate(evidence, targetId);
      allFindings.push(...findings);
    } catch (error) {
      console.error(`Rule ${rule.id} failed:`, error);
    }
  }

  return allFindings;
}

/**
 * Runs specific rules by ID.
 */
export function runRulesByIds(evidence: Evidence[], ruleIds: string[]): Finding[] {
  if (evidence.length === 0) return [];

  const targetId = evidence[0]?.targetId || 'unknown';
  const selectedRules = RULES.filter(r => ruleIds.includes(r.id));

  const allFindings: Finding[] = [];
  for (const rule of selectedRules) {
    try {
      const findings = rule.evaluate(evidence, targetId);
      allFindings.push(...findings);
    } catch (error) {
      console.error(`Rule ${rule.id} failed:`, error);
    }
  }

  return allFindings;
}

/**
 * Maps findings to commercial opportunities.
 */
export function mapFindingsToOpportunities(findings: Finding[]): Opportunity[] {
  if (findings.length === 0) return [];

  const opportunities: Opportunity[] = [];

  // Group HTTP security findings
  const httpFindings = findings.filter(f => f.ruleId.startsWith('rule-http-'));
  if (httpFindings.length > 0) {
    opportunities.push({
      id: `opp_sec_${Date.now()}`,
      title: 'Verbeter de Website Beveiliging',
      supportingFindingIds: httpFindings.map(f => f.findingId).sort(),
      confidence: 'VERIFIED',
      technicalSignificance: `${httpFindings.length} security headers missing or misconfigured`,
      businessSignificance: 'Protects customer data and builds trust through modern security practices',
      businessArea: 'Customer Trust & Privacy',
      technicalArea: 'HTTP Security Headers',
      serviceCategory: 'SECURITY_HARDENING',
      retestAvailable: true,
      needsClientAccess: false,
      estimatedComplexity: 'LOW',
      clientExplanationKey: 'security.headers.missing'
    });
  }

  // Group email trust findings
  const emailFindings = findings.filter(f =>
    f.ruleId.includes('spf') || f.ruleId.includes('dmarc')
  );
  if (emailFindings.length > 0) {
    opportunities.push({
      id: `opp_email_${Date.now()}`,
      title: 'Versterk E-mail Betrouwbaarheid',
      supportingFindingIds: emailFindings.map(f => f.findingId).sort(),
      confidence: 'VERIFIED',
      technicalSignificance: `${emailFindings.length} email authentication issues detected`,
      businessSignificance: 'Prevents email spoofing and improves deliverability',
      businessArea: 'Email Communication',
      technicalArea: 'DNS Email Security',
      serviceCategory: 'EMAIL_TRUST',
      retestAvailable: true,
      needsClientAccess: true,
      estimatedComplexity: 'MEDIUM',
      clientExplanationKey: 'email.trust.dns'
    });
  }

  return opportunities;
}
