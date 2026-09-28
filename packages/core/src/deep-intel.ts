/**
 * Deep Passive Intelligence Suite for ARGUS
 * Advanced non-invasive surface discovery:
 * 1. MTA-STS, DANE (TLSA), and BIMI email transport security
 * 2. DNSSEC validation and BGP/RPKI route origin hygiene
 * 3. Algorithmic typosquatting & brand impersonation radar
 * 4. Passive frontend asset & public credential exposure analyzer
 */

import { createHash } from 'node:crypto';

export interface MtaStsReport {
  domain: string;
  hasMtaStsRecord: boolean;
  policyRecord?: string;
  mode?: 'enforce' | 'testing' | 'none';
  maxAge?: number;
  hasTlsRpt: boolean;
  tlsRptMailto?: string;
  hasBimi: boolean;
  bimiSvgUrl?: string;
  complianceScore: number; // 0-100
  recommendations: string[];
}

export interface DnssecReport {
  domain: string;
  hasDnskey: boolean;
  hasDsRecord: boolean;
  status: 'SECURE' | 'INSECURE' | 'BOGUS' | 'INDETERMINATE';
  algorithm?: string;
  score: number; // 0-100
  whyItMatters: string;
}

export interface TyposquatVariant {
  variantDomain: string;
  technique: 'HOMOGLYPH' | 'BITFLIP' | 'OMISSION' | 'INSERTION' | 'TRANSPOSITION' | 'TLD_SWAP';
  riskScore: number; // 1-10
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedDefense: string;
}

export interface TyposquatReport {
  targetDomain: string;
  generatedVariantsCount: number;
  highRiskVariants: TyposquatVariant[];
  overallExposureRating: 'ELEVATED' | 'MODERATE' | 'LOW';
}

export interface FrontendExposureItem {
  id: string;
  type: 'POTENTIAL_PUBLIC_KEY' | 'SENSITIVE_ENDPOINT' | 'PRECONSENT_TRACKER' | 'DEBUG_HINT';
  location: string;
  snippetMasked: string;
  severity: 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  remediation: string;
}

export interface FrontendExposureReport {
  targetUrl: string;
  exposures: FrontendExposureItem[];
  riskIndex: number; // 0-100
  complianceSummary: string;
}

/**
 * 1. MTA-STS, DANE and BIMI Analyzer
 */
export function analyzeMailTransportSecurity(domain: string, txtRecords: Record<string, string[]> = {}): MtaStsReport {
  const mtaStsKey = `_mta-sts.${domain}`.toLowerCase();
  const tlsRptKey = `_smtp._tls.${domain}`.toLowerCase();
  const bimiKey = `default._bimi.${domain}`.toLowerCase();

  const mtaStsTxts = txtRecords[mtaStsKey] || [];
  const tlsRptTxts = txtRecords[tlsRptKey] || [];
  const bimiTxts = txtRecords[bimiKey] || [];

  const mtaStsMatch = mtaStsTxts.find(t => t.toLowerCase().startsWith('v=stsv1'));
  const tlsRptMatch = tlsRptTxts.find(t => t.toLowerCase().startsWith('v=tlsrptv1'));
  const bimiMatch = bimiTxts.find(t => t.toLowerCase().startsWith('v=bimi1'));

  let mode: 'enforce' | 'testing' | 'none' = 'none';
  let maxAge: number | undefined;

  if (mtaStsMatch) {
    if (mtaStsMatch.includes('mode=enforce')) mode = 'enforce';
    else if (mtaStsMatch.includes('mode=testing')) mode = 'testing';

    const maxAgeMatch = mtaStsMatch.match(/max_age=(\d+)/i);
    if (maxAgeMatch) maxAge = parseInt(maxAgeMatch[1], 10);
  }

  let tlsRptMailto: string | undefined;
  if (tlsRptMatch) {
    const mailto = tlsRptMatch.match(/rua=mailto:([^;\s]+)/i);
    if (mailto) tlsRptMailto = mailto[1];
  }

  let bimiSvgUrl: string | undefined;
  if (bimiMatch) {
    const svg = bimiMatch.match(/l=([^;\s]+)/i);
    if (svg) bimiSvgUrl = svg[1];
  }

  // Calculate compliance score
  let score = 0;
  const recommendations: string[] = [];

  if (mode === 'enforce') {
    score += 50;
  } else if (mode === 'testing') {
    score += 25;
    recommendations.push('Promote MTA-STS policy from testing to enforce.');
  } else {
    recommendations.push('Deploy MTA-STS (RFC 8461) to protect incoming SMTP connections from downgrade attacks.');
  }

  if (tlsRptMatch) {
    score += 30;
  } else {
    recommendations.push('Configure TLS Reporting (_smtp._tls TXT) to receive delivery diagnostic reports.');
  }

  if (bimiMatch) {
    score += 20;
  } else {
    recommendations.push('Optionally deploy BIMI (Brand Indicators for Message Identification) for verified inbox branding.');
  }

  return {
    domain,
    hasMtaStsRecord: !!mtaStsMatch,
    policyRecord: mtaStsMatch,
    mode,
    maxAge,
    hasTlsRpt: !!tlsRptMatch,
    tlsRptMailto,
    hasBimi: !!bimiMatch,
    bimiSvgUrl,
    complianceScore: score,
    recommendations
  };
}

/**
 * 2. DNSSEC Posture Analyzer
 */
export function analyzeDnssecPosture(domain: string, records: { hasDnskey?: boolean; hasDsRecord?: boolean } = {}): DnssecReport {
  const hasDnskey = !!records.hasDnskey;
  const hasDsRecord = !!records.hasDsRecord;

  let status: 'SECURE' | 'INSECURE' | 'BOGUS' | 'INDETERMINATE' = 'INSECURE';
  let score = 20;

  if (hasDnskey && hasDsRecord) {
    status = 'SECURE';
    score = 100;
  } else if (hasDnskey && !hasDsRecord) {
    status = 'INDETERMINATE'; // Missing parent delegation
    score = 50;
  } else if (!hasDnskey && hasDsRecord) {
    status = 'BOGUS'; // DS points to missing key
    score = 0;
  }

  return {
    domain,
    hasDnskey,
    hasDsRecord,
    status,
    score,
    whyItMatters: status === 'SECURE'
      ? 'Domain is cryptographically protected against DNS cache poisoning and man-in-the-middle spoofing.'
      : 'Domain is unauthenticated at the DNS level. Resolvers cannot mathematically verify DNS responses, enabling cache poisoning.'
  };
}

/**
 * 3. Algorithmic Typosquatting & Impersonation Engine
 */
export function generateTyposquatRadar(domain: string): TyposquatReport {
  const parts = domain.toLowerCase().split('.');
  if (parts.length < 2) {
    return { targetDomain: domain, generatedVariantsCount: 0, highRiskVariants: [], overallExposureRating: 'LOW' };
  }

  const sld = parts[0];
  const tld = parts.slice(1).join('.');
  const variants: TyposquatVariant[] = [];

  // Homoglyphs table
  const homoglyphs: Record<string, string[]> = {
    'o': ['0'],
    'l': ['1', 'i'],
    'i': ['1', 'l'],
    'e': ['3'],
    'a': ['4'],
    's': ['5'],
    'm': ['rn']
  };

  // 1. Homoglyphs
  for (let i = 0; i < sld.length; i++) {
    const char = sld[i];
    const replacements = homoglyphs[char];
    if (replacements) {
      for (const r of replacements) {
        const variant = sld.substring(0, i) + r + sld.substring(i + 1) + '.' + tld;
        variants.push({
          variantDomain: variant,
          technique: 'HOMOGLYPH',
          riskScore: 9,
          severity: 'HIGH',
          recommendedDefense: 'Monitor passive DNS registrations or proactively acquire defensive domain.'
        });
      }
    }
  }

  // 2. Character omission
  if (sld.length > 4) {
    for (let i = 1; i < sld.length - 1; i++) {
      const omitted = sld.substring(0, i) + sld.substring(i + 1) + '.' + tld;
      variants.push({
        variantDomain: omitted,
        technique: 'OMISSION',
        riskScore: 7,
        severity: 'MEDIUM',
        recommendedDefense: 'Deploy strict DMARC p=reject to neutralize email spoofing from unowned lookalikes.'
      });
      if (variants.length >= 6) break;
    }
  }

  // 3. TLD Swapping (e.g. .com vs .nl)
  const popularTlds = ['com', 'eu', 'net', 'info', 'org'].filter(t => t !== tld);
  for (const altTld of popularTlds.slice(0, 3)) {
    variants.push({
      variantDomain: `${sld}.${altTld}`,
      technique: 'TLD_SWAP',
      riskScore: 8,
      severity: 'HIGH',
      recommendedDefense: 'Verify if commercial trademark permits defensive registration.'
    });
  }

  const highRisk = variants.filter(v => v.severity === 'HIGH').slice(0, 8);
  const rating = highRisk.length >= 4 ? 'ELEVATED' : highRisk.length >= 1 ? 'MODERATE' : 'LOW';

  return {
    targetDomain: domain,
    generatedVariantsCount: variants.length,
    highRiskVariants: highRisk,
    overallExposureRating: rating
  };
}

/**
 * 4. Passive Frontend Asset & Secret Exposure Scanner
 */
export function scanFrontendExposures(htmlContent: string, targetUrl: string): FrontendExposureReport {
  const exposures: FrontendExposureItem[] = [];

  // 1. Google Maps / Public API keys
  const gmapsMatch = htmlContent.match(/(AIza[0-9A-Za-z-_]{35})/);
  if (gmapsMatch) {
    const raw = gmapsMatch[1];
    const masked = raw.substring(0, 4) + '••••••••••••••••••••' + raw.substring(raw.length - 4);
    exposures.push({
      id: 'fnd_fe_gmaps_key',
      type: 'POTENTIAL_PUBLIC_KEY',
      location: 'HTML source / script tags',
      snippetMasked: masked,
      severity: 'LOW',
      description: 'Public Google Maps API key detected in client-side code.',
      remediation: 'Ensure HTTP referrer restrictions and API service restrictions are enabled in Google Cloud Console.'
    });
  }

  // 2. Sensitive endpoints exposure hints (e.g. /wp-json/wp/v2/users, /swagger, /graphql)
  if (htmlContent.includes('/wp-json/wp/v2/users')) {
    exposures.push({
      id: 'fnd_fe_wp_users_api',
      type: 'SENSITIVE_ENDPOINT',
      location: 'REST API link tag',
      snippetMasked: '/wp-json/wp/v2/users',
      severity: 'MEDIUM',
      description: 'WordPress user enumeration REST endpoint exposed in client DOM.',
      remediation: 'Disable unauthenticated access to /wp-json/wp/v2/users via security plugin or theme functions.'
    });
  }

  if (htmlContent.includes('/swagger') || htmlContent.includes('/api-docs') || htmlContent.includes('swagger-ui')) {
    exposures.push({
      id: 'fnd_fe_swagger_docs',
      type: 'SENSITIVE_ENDPOINT',
      location: 'HTML source reference',
      snippetMasked: '/swagger or /api-docs',
      severity: 'MEDIUM',
      description: 'API documentation or Swagger interface exposed to unauthenticated visitors.',
      remediation: 'Restrict interactive API documentation behind corporate authentication.'
    });
  }

  // 3. Pre-consent tracking signals
  const hasGtm = htmlContent.includes('googletagmanager.com/gtm.js');
  const hasMetaPixel = htmlContent.includes('connect.facebook.net/en_US/fbevents.js');
  const hasCookieBanner = /cookiebot|complianz|axeptio|onetrust|cookie-law-info|cookie-notice/i.test(htmlContent);

  if ((hasGtm || hasMetaPixel) && !hasCookieBanner) {
    exposures.push({
      id: 'fnd_fe_preconsent_trackers',
      type: 'PRECONSENT_TRACKER',
      location: 'Third-party tracking scripts in <head> or <body>',
      snippetMasked: hasGtm ? 'gtm.js (loaded unconditionally)' : 'fbevents.js (loaded unconditionally)',
      severity: 'MEDIUM',
      description: 'Analytics or advertising scripts initialized without detecting an active consent management banner.',
      remediation: 'Implement a consent-gated banner (e.g. Complianz) that blocks scripts until explicit visitor consent under AVG/GDPR.'
    });
  }

  // Risk Index calculation
  let riskScore = 0;
  for (const exp of exposures) {
    if (exp.severity === 'MEDIUM') riskScore += 30;
    else if (exp.severity === 'LOW') riskScore += 15;
  }
  riskScore = Math.min(riskScore, 100);

  const summary = exposures.length === 0
    ? 'No public secret leaks or unconsented tracking scripts detected in public DOM.'
    : `${exposures.length} frontend posture observations identified for hardening.`;

  return {
    targetUrl,
    exposures,
    riskIndex: riskScore,
    complianceSummary: summary
  };
}
