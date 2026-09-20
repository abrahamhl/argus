import { Observation } from '@argus/schema';

export function createSyntheticBaselineObservations(
  domain: string = 'example-business.nl',
  runId: string = 'run_baseline_fixture',
  targetId: string = 'tgt_example_business'
): Observation[] {
  const timestamp = '2026-09-01T10:00:00.000Z';

  return [
    // 1. DNS Records
    {
      id: `obs_dns_a_${domain}`,
      runId,
      targetId,
      type: 'DNS_A',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: ['185.10.10.20']
    },
    {
      id: `obs_dns_mx_${domain}`,
      runId,
      targetId,
      type: 'DNS_MX',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: [{ exchange: `mail.${domain}`, priority: 10 }]
    },
    {
      id: `obs_dns_caa_${domain}`,
      runId,
      targetId,
      type: 'DNS_CAA',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: [] // Missing CAA
    },
    {
      id: `obs_dns_txt_${domain}`,
      runId,
      targetId,
      type: 'DNS_TXT',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        raw: [['v=spf1 include:_spf.mailhost.nl ~all']],
        spf: {
          version: 'spf1',
          mechanisms: ['include:_spf.mailhost.nl', '~all']
        }
      }
    },
    {
      id: `obs_dns_dmarc_${domain}`,
      runId,
      targetId,
      type: 'DNS_DMARC',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        raw: [['v=DMARC1; p=none; rua=mailto:dmarc@' + domain]],
        dmarc: {
          v: 'DMARC1',
          p: 'none',
          rua: 'mailto:dmarc@' + domain
        }
      }
    },

    // 2. HTTP Security
    {
      id: `obs_http_${domain}`,
      runId,
      targetId,
      type: 'HTTP_RESPONSE',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        status: 200,
        url: `https://${domain}/`,
        redirected: false,
        headers: {
          'server': 'nginx/1.18.0',
          'content-type': 'text/html; charset=UTF-8',
          'x-powered-by': 'PHP/8.1'
        }
      }
    },

    // 3. TLS Certificate
    {
      id: `obs_tls_${domain}`,
      runId,
      targetId,
      type: 'TLS_CERTIFICATE',
      source: `tls://${domain}:443`,
      collector: 'argus-tls-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        subject: { CN: domain },
        issuer: { O: "Let's Encrypt", CN: "R3" },
        validFrom: '2026-08-01T00:00:00Z',
        validTo: '2026-11-01T00:00:00Z',
        daysRemaining: 60,
        isExpired: false,
        subjectAltNames: [domain, `www.${domain}`],
        protocol: 'TLSv1.3',
        cipher: { name: 'TLS_AES_256_GCM_SHA384', standardName: 'TLS_AES_256_GCM_SHA384', version: 'TLSv1.3' },
        authorized: true,
        authorizationError: null
      }
    },

    // 4. security.txt
    {
      id: `obs_sectxt_${domain}`,
      runId,
      targetId,
      type: 'SECURITY_TXT',
      source: `https://${domain}/.well-known/security.txt`,
      collector: 'argus-security-txt-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        present: false,
        url: null,
        status: 404,
        contact: [],
        expires: null,
        isExpired: null,
        fields: {}
      }
    },

    // 5. Website Metadata
    {
      id: `obs_meta_${domain}`,
      runId,
      targetId,
      type: 'WEBSITE_METADATA',
      source: `https://${domain}/`,
      collector: 'argus-metadata-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        title: 'Voorbeeld Bedrijf B.V. - Professionele Diensten Arnhem',
        generator: 'WordPress 6.4.3',
        viewport: 'width=device-width, initial-scale=1',
        lang: 'nl',
        canonical: `https://${domain}/`,
        detectedCms: 'WordPress'
      }
    }
  ];
}

export function createSyntheticRemediatedObservations(
  domain: string = 'example-business.nl',
  runId: string = 'run_retest_fixture',
  targetId: string = 'tgt_example_business'
): Observation[] {
  const timestamp = '2026-09-15T14:00:00.000Z';

  return [
    // 1. DNS Records (Strict SPF -all, DMARC p=reject, CAA present)
    {
      id: `obs_dns_a_retest_${domain}`,
      runId,
      targetId,
      type: 'DNS_A',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: ['185.10.10.20']
    },
    {
      id: `obs_dns_mx_retest_${domain}`,
      runId,
      targetId,
      type: 'DNS_MX',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: [{ exchange: `mail.${domain}`, priority: 10 }]
    },
    {
      id: `obs_dns_caa_retest_${domain}`,
      runId,
      targetId,
      type: 'DNS_CAA',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: [{ flags: 0, tag: 'issue', value: 'letsencrypt.org' }]
    },
    {
      id: `obs_dns_txt_retest_${domain}`,
      runId,
      targetId,
      type: 'DNS_TXT',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        raw: [['v=spf1 include:_spf.mailhost.nl -all']],
        spf: {
          version: 'spf1',
          mechanisms: ['include:_spf.mailhost.nl', '-all']
        }
      }
    },
    {
      id: `obs_dns_dmarc_retest_${domain}`,
      runId,
      targetId,
      type: 'DNS_DMARC',
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        raw: [['v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc@' + domain]],
        dmarc: {
          v: 'DMARC1',
          p: 'reject',
          sp: 'reject',
          pct: '100',
          rua: 'mailto:dmarc@' + domain
        }
      }
    },

    // 2. HTTP Security (HSTS enforced, CSP, nosniff, Referrer-Policy, removed power headers)
    {
      id: `obs_http_retest_${domain}`,
      runId,
      targetId,
      type: 'HTTP_RESPONSE',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        status: 200,
        url: `https://${domain}/`,
        redirected: false,
        headers: {
          'server': 'secure-proxy',
          'content-type': 'text/html; charset=UTF-8',
          'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
          'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin',
          'x-frame-options': 'SAMEORIGIN'
        }
      }
    },

    // 3. TLS Certificate
    {
      id: `obs_tls_retest_${domain}`,
      runId,
      targetId,
      type: 'TLS_CERTIFICATE',
      source: `tls://${domain}:443`,
      collector: 'argus-tls-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        subject: { CN: domain },
        issuer: { O: "Let's Encrypt", CN: "E1" },
        validFrom: '2026-09-01T00:00:00Z',
        validTo: '2026-12-01T00:00:00Z',
        daysRemaining: 77,
        isExpired: false,
        subjectAltNames: [domain, `www.${domain}`],
        protocol: 'TLSv1.3',
        cipher: { name: 'TLS_AES_256_GCM_SHA384', standardName: 'TLS_AES_256_GCM_SHA384', version: 'TLSv1.3' },
        authorized: true,
        authorizationError: null
      }
    },

    // 4. security.txt (Now Present and Valid RFC 9116)
    {
      id: `obs_sectxt_retest_${domain}`,
      runId,
      targetId,
      type: 'SECURITY_TXT',
      source: `https://${domain}/.well-known/security.txt`,
      collector: 'argus-security-txt-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        present: true,
        url: `https://${domain}/.well-known/security.txt`,
        status: 200,
        contact: [`mailto:security@${domain}`],
        expires: '2027-09-01T00:00:00.000Z',
        isExpired: false,
        canonical: `https://${domain}/.well-known/security.txt`,
        preferredLanguages: ['nl', 'en'],
        fields: {
          contact: [`mailto:security@${domain}`],
          expires: ['2027-09-01T00:00:00.000Z'],
          canonical: [`https://${domain}/.well-known/security.txt`],
          'preferred-languages': ['nl, en']
        }
      }
    },

    // 5. Website Metadata
    {
      id: `obs_meta_retest_${domain}`,
      runId,
      targetId,
      type: 'WEBSITE_METADATA',
      source: `https://${domain}/`,
      collector: 'argus-metadata-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        title: 'Voorbeeld Bedrijf B.V. - Beveiligd Portaal',
        generator: null, // Removed generator banner
        viewport: 'width=device-width, initial-scale=1',
        lang: 'nl',
        canonical: `https://${domain}/`,
        detectedCms: 'Hardened Website'
      }
    }
  ];
}
