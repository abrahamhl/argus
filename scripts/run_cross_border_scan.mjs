import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function maskSecret(val) {
  if (!val || val.length < 8) return '••••••';
  return `${val.slice(0, 4)}••••••${val.slice(-4)}`;
}

async function auditDomain(biz) {
  const domain = biz.domain;
  const auditTime = new Date().toISOString();
  const resObj = {
    ...biz,
    auditTimestamp: auditTime,
    dns: { resolved: false, ip: null, error: null, mx: [], spf: null, dmarc: null, dnssec: false },
    tls: { authorized: false, issuer: null, validTo: null, daysRemaining: null, error: null },
    http: {
      reachable: false,
      statusCode: null,
      finalUrl: null,
      httpsEnforced: false,
      headers: {},
      hsts: false,
      hstsDetails: null,
      csp: false,
      cspDetails: null,
      xfo: false,
      xfoDetails: null,
      xcto: false,
      referrerPolicy: null,
      permissionsPolicy: false,
      serverBanner: null,
      securityTxt: false,
      error: null
    },
    frontend: {
      htmlLength: 0,
      sourceMapsDetected: false,
      sourceMapFiles: [],
      potentialSecretExposures: [],
      debugObjectsDetected: false
    },
    privacy: {
      privacyPolicyUrl: null,
      cookiePolicyUrl: null,
      consentBannerDetected: false,
      consentBannerVendor: null,
      thirdPartyTrackers: [],
      preConsentTrackingRisk: false
    },
    ai: {
      aiVendorDetected: null,
      aiChatbotDetected: false,
      aiTransparencyStatement: false,
      status: 'UNKNOWN'
    },
    quality: {
      title: null,
      metaDescription: null,
      canonical: null,
      viewport: false,
      structuredData: false,
      htmlLang: null,
      imagesCount: 0,
      imagesMissingAlt: 0,
      hasPhoneLink: false,
      hasEmailLink: false,
      brokenContactPath: false
    },
    findings: [],
    scores: {
      technicalExposure: 0,
      privacyCompliance: 0,
      webQuality: 0,
      seoConversion: 0,
      evidenceConfidence: 0,
      salesPriority: 0,
      priorityColor: '⬜'
    },
    debbiePitch: {
      oneLinerNL: '',
      whyCareNL: '',
      whatWeOfferNL: '',
      estimatedService: '',
      indicativePriceEur: 0,
      nextAction: ''
    }
  };

  // 1. DNS Resolution
  try {
    const aRecords = await dns.resolve4(domain);
    if (aRecords && aRecords.length > 0) {
      resObj.dns.resolved = true;
      resObj.dns.ip = aRecords[0];
    }
  } catch (err) {
    resObj.dns.error = err.code || err.message;
    resObj.scores.evidenceConfidence = 95;
    resObj.scores.salesPriority = 15;
    resObj.scores.priorityColor = '⬜';
    resObj.findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_nxdomain`,
      category: 'DNS_CONFIGURATION',
      finding_title: 'Domein niet bereikbaar via DNS (NXDOMAIN)',
      technical_description: `DNS resolution failed with code ${resObj.dns.error}. No active A/AAAA records exist.`,
      plain_language_description: 'Het domein heeft geen actieve koppeling in het internetadresboek (DNS).',
      customer_impact: 'Bezoekers en e-mailservers kunnen de website niet vinden.',
      evidence_type: 'DNS_QUERY',
      evidence_location: `DNS query for ${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'HIGH',
      authorization_required_for_validation: false,
      suggested_remediation: 'Activeer de DNS-zone bij de registrar en wijs het domein aan via A-records.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'DNS Beveiliging & Beheer'
    });
    resObj.debbiePitch = {
      oneLinerNL: 'Het webadres staat geregistreerd maar verwijst naar geen enkele actieve server.',
      whyCareNL: 'Klanten die u online zoeken krijgen een foutmelding.',
      whatWeOfferNL: 'DNS herstel en domeinkoppeling naar een moderne website.',
      estimatedService: 'Domein & DNS Herstel',
      indicativePriceEur: 250,
      nextAction: 'Vragen of ze van plan zijn deze domeinnaam actief te gaan gebruiken.'
    };
    return resObj;
  }

  // 1b. Passive MX, SPF & DMARC lookup
  try {
    const mxRecords = await dns.resolveMx(domain).catch(() => []);
    resObj.dns.mx = mxRecords.map(m => m.exchange);
  } catch {}

  try {
    const txtRecords = await dns.resolveTxt(domain).catch(() => []);
    const flatTxt = txtRecords.map(r => r.join(''));
    const spfRecord = flatTxt.find(t => t.startsWith('v=spf1'));
    if (spfRecord) resObj.dns.spf = spfRecord;
  } catch {}

  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flatDmarc = dmarcRecords.map(r => r.join(''));
    const dmarcRecord = flatDmarc.find(t => t.startsWith('v=DMARC1'));
    if (dmarcRecord) resObj.dns.dmarc = dmarcRecord;
  } catch {}

  // 2. TLS Handshake Inspection
  await new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 4000,
      rejectUnauthorized: false
    }, () => {
      try {
        const cert = socket.getPeerCertificate();
        if (cert && Object.keys(cert).length > 0) {
          resObj.tls.authorized = socket.authorized;
          resObj.tls.issuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Unknown') : 'Unknown';
          resObj.tls.validTo = cert.valid_to;
          if (cert.valid_to) {
            const exp = new Date(cert.valid_to).getTime();
            const now = Date.now();
            resObj.tls.daysRemaining = Math.round((exp - now) / (1000 * 60 * 60 * 24));
          }
        }
      } catch (e) {
        resObj.tls.error = e.message;
      }
      socket.destroy();
      resolve();
    });

    socket.on('error', (err) => {
      resObj.tls.error = err.code || err.message;
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      resObj.tls.error = 'TLS_TIMEOUT';
      socket.destroy();
      resolve();
    });
  });

  // 3. HTTP & HTTPS Fetch
  let rawHtml = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

    const httpUrl = `https://${domain}`;
    const resp = await fetch(httpUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,de-DE,de;q=0.8,en-US;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (ARGUS Lead Audit)'
      }
    });
    clearTimeout(timeout);

    resObj.http.reachable = true;
    resObj.http.statusCode = resp.status;
    resObj.http.finalUrl = resp.url;
    resObj.http.httpsEnforced = resp.url.startsWith('https://');

    resp.headers.forEach((val, key) => {
      resObj.http.headers[key.toLowerCase()] = val;
    });

    const h = resObj.http.headers;
    resObj.http.hsts = !!h['strict-transport-security'];
    resObj.http.hstsDetails = h['strict-transport-security'] || null;
    resObj.http.csp = !!h['content-security-policy'];
    resObj.http.cspDetails = h['content-security-policy'] ? h['content-security-policy'].slice(0, 100) : null;
    resObj.http.xfo = !!h['x-frame-options'];
    resObj.http.xfoDetails = h['x-frame-options'] || null;
    resObj.http.xcto = h['x-content-type-options'] === 'nosniff';
    resObj.http.referrerPolicy = h['referrer-policy'] || null;
    resObj.http.permissionsPolicy = !!h['permissions-policy'];
    resObj.http.serverBanner = h['server'] || h['x-powered-by'] || null;

    rawHtml = await resp.text();
    resObj.frontend.htmlLength = rawHtml.length;
  } catch (err) {
    resObj.http.error = err.message;
  }

  // 4. HTML Analysis
  if (rawHtml) {
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    resObj.quality.title = titleMatch ? titleMatch[1].trim() : null;

    const descMatch = rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                      rawHtml.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    resObj.quality.metaDescription = descMatch ? descMatch[1].trim() : null;

    const canonMatch = rawHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
    resObj.quality.canonical = canonMatch ? canonMatch[1].trim() : null;

    resObj.quality.viewport = /<meta[^>]+name=["']viewport["']/i.test(rawHtml);
    resObj.quality.structuredData = /application\/ld\+json/i.test(rawHtml) || /property=["']og:title["']/i.test(rawHtml);

    const langMatch = rawHtml.match(/<html[^>]+lang=["']([^"']+)["']/i);
    resObj.quality.htmlLang = langMatch ? langMatch[1].trim() : null;

    const imgMatches = rawHtml.match(/<img[^>]+>/gi) || [];
    resObj.quality.imagesCount = imgMatches.length;
    resObj.quality.imagesMissingAlt = imgMatches.filter(img => !/alt=["'][^"']*["']/i.test(img)).length;

    resObj.quality.hasPhoneLink = /href=["']tel:[^"']+["']/i.test(rawHtml);
    resObj.quality.hasEmailLink = /href=["']mailto:[^"']+["']/i.test(rawHtml);
    resObj.quality.brokenContactPath = !resObj.quality.hasPhoneLink && !resObj.quality.hasEmailLink;

    const privMatch = rawHtml.match(/href=["']([^"']*(?:privacy|privacyverklaring|privacybeleid|datenschutz|privacy-statement)[^"']*)["']/i);
    resObj.privacy.privacyPolicyUrl = privMatch ? privMatch[1] : null;

    const cookieMatch = rawHtml.match(/href=["']([^"']*(?:cookie|cookiebeleid|cookie-statement|cookieverklaring)[^"']*)["']/i);
    resObj.privacy.cookiePolicyUrl = cookieMatch ? cookieMatch[1] : null;

    const cmpPatterns = [
      { name: 'Cookiebot', regex: /cookiebot/i },
      { name: 'Complianz', regex: /complianz|cmplz/i },
      { name: 'OneTrust', regex: /onetrust/i },
      { name: 'CookieYes', regex: /cookieyes/i },
      { name: 'Borlabs', regex: /borlabs/i },
      { name: 'Usercentrics', regex: /usercentrics/i },
      { name: 'Generic Banner', regex: /cookie-notice|cookie-law-info|cookie-consent|cookie_notice|tarteaucitron/i }
    ];
    for (const cmp of cmpPatterns) {
      if (cmp.regex.test(rawHtml)) {
        resObj.privacy.consentBannerDetected = true;
        resObj.privacy.consentBannerVendor = cmp.name;
        break;
      }
    }

    const trackerPatterns = [
      { name: 'Google Tag Manager', regex: /googletagmanager\.com/i },
      { name: 'Google Analytics', regex: /google-analytics\.com|gtag\(|ga\(/i },
      { name: 'Meta Pixel', regex: /connect\.facebook\.net|fbq\(/i },
      { name: 'Hotjar', regex: /static\.hotjar\.com|hotjar/i },
      { name: 'Microsoft Clarity', regex: /clarity\.ms/i },
      { name: 'TikTok Pixel', regex: /analytics\.tiktok\.com/i },
      { name: 'LinkedIn Insight', regex: /snap\.licdn\.com/i }
    ];
    for (const tr of trackerPatterns) {
      if (tr.regex.test(rawHtml)) {
        resObj.privacy.thirdPartyTrackers.push(tr.name);
      }
    }

    if (resObj.privacy.thirdPartyTrackers.length > 0 && !resObj.privacy.consentBannerDetected) {
      resObj.privacy.preConsentTrackingRisk = true;
    }

    if (/sourceMappingURL=[^\s"']+\.map/i.test(rawHtml) || /\.js\.map/i.test(rawHtml)) {
      resObj.frontend.sourceMapsDetected = true;
      resObj.frontend.sourceMapFiles.push('Referenced in public HTML/bundle');
    }

    const gmapsKeyMatch = rawHtml.match(/AIza[0-9A-Za-z-_]{35}/);
    if (gmapsKeyMatch) {
      resObj.frontend.potentialSecretExposures.push({
        type: 'Google Maps Browser API Key (Masked)',
        maskedFingerprint: maskSecret(gmapsKeyMatch[0]),
        confidence: 'HIGH',
        note: 'Publieke browser client key waargenomen in frontend code.'
      });
    }
  }

  // 5. Build Standardized Findings
  const findings = [];
  const compId = biz.company_id;

  // DMARC Finding
  if (!resObj.dns.dmarc) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_dmarc_missing`,
      company_id: compId,
      timestamp: auditTime,
      category: 'EMAIL_SECURITY',
      finding_title: 'DMARC-record ontbreekt (E-mail Spoofing Risico)',
      technical_description: `DNS TXT query for _dmarc.${domain} returned no record. The domain lacks policy enforcement against sender spoofing.`,
      plain_language_description: 'Uw domeinnaam heeft geen bescherming tegen identiteitsdiefstal per e-mail. Iedereen kan e-mails versturen uit naam van uw kantoor.',
      customer_impact: 'Valse facturen of phishing uit uw naam kunnen klanten misleiden. E-mails kunnen in Gmail en Outlook in de spamfilter belanden.',
      evidence_type: 'DNS_QUERY',
      evidence_location: `DNS TXT query for _dmarc.${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'HIGH',
      authorization_required_for_validation: false,
      suggested_remediation: 'Configureer een DNS TXT-record: "v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:dmarc-reports@' + domain + '; aspf=r; adkim=r".',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'E-mail Authenticatie & Anti-Spoofing Inrichting'
    });
  } else if (/p=none/i.test(resObj.dns.dmarc)) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_dmarc_pnone`,
      company_id: compId,
      timestamp: auditTime,
      category: 'EMAIL_SECURITY',
      finding_title: 'DMARC ingesteld op "none" (Geen actieve blokkering)',
      technical_description: `DMARC record exists (${resObj.dns.dmarc}) but policy is set to p=none. No unauthorized emails are blocked or quarantined.`,
      plain_language_description: 'Er is een e-mailbeveiliging aanwezig, maar deze staat in testmodus en blokkeert nog geen misbruik.',
      customer_impact: 'Kwaadwillenden kunnen nog steeds ongestraft valse e-mails versturen uit uw naam.',
      evidence_type: 'DNS_QUERY',
      evidence_location: `_dmarc.${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'MEDIUM',
      authorization_required_for_validation: false,
      suggested_remediation: 'Verhoog DMARC beleid gefaseerd van p=none naar p=quarantine en uiteindelijk p=reject.',
      estimated_remediation_complexity: 'MEDIUM',
      commercial_service_mapping: 'E-mail Authenticatie Hardening'
    });
  }

  // SPF Finding
  if (!resObj.dns.spf) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_spf_missing`,
      company_id: compId,
      timestamp: auditTime,
      category: 'EMAIL_SECURITY',
      finding_title: 'SPF-record ontbreekt (Geen geautoriseerde verzendservers)',
      technical_description: `DNS TXT query for ${domain} contains no v=spf1 record. Receiving MTAs cannot verify legitimate senders.`,
      plain_language_description: 'Er is geen openbare lijst met geautoriseerde e-mailservers voor uw bedrijf.',
      customer_impact: 'Belangrijke offertes en facturen worden sneller door spamfilters tegengehouden.',
      evidence_type: 'DNS_QUERY',
      evidence_location: `DNS TXT query for ${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'HIGH',
      authorization_required_for_validation: false,
      suggested_remediation: 'Voeg een SPF DNS-record toe met uw legitieme verzendservers en sluit af met -all of ~all.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'E-mail Authenticatie Inrichting'
    });
  }

  // HSTS Finding
  if (!resObj.http.hsts && resObj.http.reachable) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_hsts_missing`,
      company_id: compId,
      timestamp: auditTime,
      category: 'WEB_SECURITY_HARDENING',
      finding_title: 'HSTS Header ontbreekt (SSL Strip Kwetsbaarheid)',
      technical_description: 'Strict-Transport-Security header is absent in HTTPS response. Browsers can be downgraded to unencrypted HTTP.',
      plain_language_description: 'De website dwingt geen versleuteling af voor herhaalbezoeken. Bezoekers op openbare wifi kunnen worden onderschept.',
      customer_impact: 'Risico op afluisteren van formulieren en klantgegevens.',
      evidence_type: 'HTTP_RESPONSE_HEADER',
      evidence_location: `HTTPS response headers from https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'MEDIUM',
      authorization_required_for_validation: false,
      suggested_remediation: 'Configureer Strict-Transport-Security: max-age=31536000; includeSubDomains; preload in de webserverconfiguratie.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'Website Beveiligingsverharding'
    });
  }

  // Pre-consent tracking
  if (resObj.privacy.preConsentTrackingRisk) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_preconsent_tracking`,
      company_id: compId,
      timestamp: auditTime,
      category: 'PRIVACY_CONFIGURATION',
      finding_title: 'Marketingtrackers actief vóór toestemming (AVG / DSGVO)',
      technical_description: `Third-party tracking scripts (${resObj.privacy.thirdPartyTrackers.join(', ')}) executed without a prior consent barrier.`,
      plain_language_description: 'Analytische en marketingcookies van externe partijen worden al geladen voordat de bezoeker akkoord heeft gegeven.',
      customer_impact: 'Niet in overeenstemming met de AVG/DSGVO richtlijnen; risico op handhavingsverzoeken van toezichthouders.',
      evidence_type: 'DOM_STATIC_INSPECTION',
      evidence_location: `Public HTML landing page https://${domain}`,
      confidence: 'HIGH',
      severity_if_confirmed: 'MEDIUM',
      authorization_required_for_validation: false,
      suggested_remediation: 'Blokkeer tracking-scripts totdat actieve expliciete toestemming is verleend via een conforme cookiebanner.',
      estimated_remediation_complexity: 'MEDIUM',
      commercial_service_mapping: 'AVG Privacy & Cookie Compliance'
    });
  }

  // X-Frame-Options
  if (!resObj.http.xfo && resObj.http.reachable) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_xfo_missing`,
      company_id: compId,
      timestamp: auditTime,
      category: 'WEB_SECURITY_HARDENING',
      finding_title: 'X-Frame-Options ontbreekt (Clickjacking Gevoeligheid)',
      technical_description: 'X-Frame-Options or CSP frame-ancestors header is absent. Website can be framed inside external iframes.',
      plain_language_description: 'De website heeft geen bescherming tegen inlijsting op kwaadwillende websites.',
      customer_impact: 'Kwaadwillenden kunnen de website in een onzichtbaar frame laden om gebruikersacties te kapen.',
      evidence_type: 'HTTP_RESPONSE_HEADER',
      evidence_location: `HTTPS response headers from https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Voeg header "X-Frame-Options: SAMEORIGIN" toe aan webserver (Nginx/Apache/Cloudflare).',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'Website Beveiligingsverharding'
    });
  }

  resObj.findings = findings;

  // 6. Scoring
  let techScore = 0;
  if (!resObj.http.hsts) techScore += 25;
  if (!resObj.http.csp) techScore += 20;
  if (!resObj.http.xfo) techScore += 15;
  if (!resObj.http.xcto) techScore += 10;
  if (resObj.http.serverBanner) techScore += 10;
  if (resObj.frontend.sourceMapsDetected) techScore += 10;
  resObj.scores.technicalExposure = Math.min(100, techScore);

  let privScore = 0;
  if (!resObj.privacy.privacyPolicyUrl) privScore += 35;
  if (!resObj.privacy.cookiePolicyUrl) privScore += 20;
  if (resObj.privacy.preConsentTrackingRisk) privScore += 35;
  else if (resObj.privacy.thirdPartyTrackers.length > 0) privScore += 10;
  resObj.scores.privacyCompliance = Math.min(100, privScore);

  let qualScore = 0;
  if (resObj.http.reachable) qualScore += 25;
  if (resObj.tls.authorized) qualScore += 25;
  if (resObj.quality.viewport) qualScore += 15;
  if (resObj.quality.title) qualScore += 10;
  if (resObj.quality.htmlLang) qualScore += 10;
  if (resObj.quality.structuredData) qualScore += 10;
  if (resObj.quality.imagesMissingAlt === 0 && resObj.quality.imagesCount > 0) qualScore += 5;
  resObj.scores.webQuality = Math.min(100, qualScore);

  let seoScore = 0;
  if (!resObj.quality.metaDescription) seoScore += 30;
  if (!resObj.quality.canonical) seoScore += 20;
  if (!resObj.quality.structuredData) seoScore += 25;
  if (resObj.quality.brokenContactPath) seoScore += 25;
  resObj.scores.seoConversion = Math.min(100, seoScore);

  resObj.scores.evidenceConfidence = resObj.http.reachable ? 95 : 70;

  // Sales Priority Score
  let priority = 20;
  if (!resObj.dns.dmarc) priority += 25;
  else if (/p=none/i.test(resObj.dns.dmarc || '')) priority += 15;
  if (resObj.privacy.preConsentTrackingRisk) priority += 25;
  else if (!resObj.privacy.privacyPolicyUrl) priority += 10;
  if (!resObj.http.hsts && !resObj.http.csp) priority += 15;
  if (!resObj.quality.metaDescription && resObj.quality.brokenContactPath) priority += 15;
  if ([3, 4, 5].includes(biz.cohort_id)) priority += 10;

  resObj.scores.salesPriority = Math.min(100, priority);

  if (resObj.scores.salesPriority >= 75 || (!resObj.dns.dmarc && resObj.privacy.preConsentTrackingRisk)) {
    resObj.scores.priorityColor = '🟥';
  } else if (resObj.scores.salesPriority >= 55) {
    resObj.scores.priorityColor = '🟧';
  } else if (resObj.scores.salesPriority >= 35) {
    resObj.scores.priorityColor = '🟨';
  } else {
    resObj.scores.priorityColor = '🟩';
  }

  // 7. Debbie Pitch NL
  if (findings.some(f => f.category === 'EMAIL_SECURITY')) {
    resObj.debbiePitch = {
      oneLinerNL: 'Het zakelijke e-mailadres is nog niet beschermd tegen nabootsing door kwaadwillenden.',
      whyCareNL: 'Iedereen kan vanaf internet facturen of berichten sturen alsof ze van uw domeinnaam komen.',
      whatWeOfferNL: 'Binnen 48 uur richten we het officiële DMARC- en SPF-slot in op uw domein.',
      estimatedService: 'E-mail Authenticatie & Anti-Spoofing (DMARC/SPF)',
      indicativePriceEur: 495,
      nextAction: 'Op de tablet laten zien hoe e-mailbeveiliging nu scoort en aanbieden het slot in te richten.'
    };
  } else if (findings.some(f => f.category === 'PRIVACY_CONFIGURATION')) {
    resObj.debbiePitch = {
      oneLinerNL: 'Trackingcookies van derden worden al actief voordat bezoekers toestemming hebben gegeven.',
      whyCareNL: 'Klanten en toezichthouders letten steeds strenger op AVG/DSGVO privacy op websites.',
      whatWeOfferNL: 'Een nette AVG cookiebanner die cookies pas activeert na akkoord van de bezoeker.',
      estimatedService: 'AVG Privacy & Cookie Compliance Inrichting',
      indicativePriceEur: 650,
      nextAction: 'Korte toelichting geven over privacyrichtlijnen en de gratis 1-pagina scan overhandigen.'
    };
  } else {
    resObj.debbiePitch = {
      oneLinerNL: 'De website mist moderne beveiligingsheaders en optimale mobiele bereikbaarheid.',
      whyCareNL: 'Browsers kunnen beveiligingswaarschuwingen tonen en mobiele bezoekers haken af.',
      whatWeOfferNL: 'Complete beveiligingsverharding (HSTS, XFO) en mobiele contactknop optimalisatie.',
      estimatedService: 'Website Beveiligingsverharding & Mobiele Optimalisatie',
      indicativePriceEur: 450,
      nextAction: 'Laten zien hoe de website verschijnt op mobiel en de header-beveiliging toelichten.'
    };
  }

  return resObj;
}

async function main() {
  const catalogPath = path.resolve('data/canonical_cross_border_businesses.json');
  const businesses = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // Load existing Arnhem results to cache
  const cachedMap = new Map();
  const arnhemScannedPath = path.resolve('data/argus_arnhem_scanned_results.json');
  if (fs.existsSync(arnhemScannedPath)) {
    const existing = JSON.parse(fs.readFileSync(arnhemScannedPath, 'utf8'));
    for (const item of existing) {
      if (item.domain) cachedMap.set(item.domain, item);
    }
    console.log(`Loaded ${cachedMap.size} cached scan results.`);
  }

  console.log(`Starting Cross-Border Scan for ${businesses.length} businesses...`);
  const finalResults = [];
  const toScan = [];

  for (const b of businesses) {
    if (cachedMap.has(b.domain)) {
      // Re-attach latest city/region/country metadata
      const cached = cachedMap.get(b.domain);
      finalResults.push({
        ...cached,
        city: b.city,
        region: b.region,
        country: b.country,
        category: b.category,
        phone_public: b.phone_public || cached.phone_public,
        address: b.address || cached.address
      });
    } else {
      toScan.push(b);
    }
  }

  console.log(`Reused ${finalResults.length} cached scans. Freshly scanning ${toScan.length} businesses...`);

  // Concurrency pool
  const CONCURRENCY = 16;
  let completed = 0;

  async function worker(workerId) {
    while (toScan.length > 0) {
      const biz = toScan.shift();
      if (!biz) break;
      try {
        const audited = await auditDomain(biz);
        finalResults.push(audited);
      } catch (err) {
        console.error(`Error auditing ${biz.domain}: ${err.message}`);
      }
      completed++;
      if (completed % 25 === 0 || toScan.length === 0) {
        console.log(`[Worker Pool] Scanned ${completed} businesses (Remaining: ${toScan.length})...`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\nScan Complete! Total audited businesses: ${finalResults.length}`);

  // Calculate totals
  const totalFindings = finalResults.reduce((acc, r) => acc + (r.findings?.length || 0), 0);
  const redLeads = finalResults.filter(r => r.scores?.priorityColor === '🟥').length;
  const orangeLeads = finalResults.filter(r => r.scores?.priorityColor === '🟧').length;
  const yellowLeads = finalResults.filter(r => r.scores?.priorityColor === '🟨').length;
  const greenLeads = finalResults.filter(r => r.scores?.priorityColor === '🟩').length;

  console.log(`Total Findings Generated: ${totalFindings}`);
  console.log(`Priority Distribution: 🟥 Red: ${redLeads} | 🟧 Orange: ${orangeLeads} | 🟨 Yellow: ${yellowLeads} | 🟩 Green: ${greenLeads}`);

  const outputPath = path.resolve('data/argus_cross_border_scanned_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
  console.log(`Saved full scanned dataset to ${outputPath}`);
}

main().catch(console.error);
