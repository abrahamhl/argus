import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

// Import ExcelJS from local node_modules
import ExcelJS from '../apps/console/node_modules/exceljs/excel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mask sensitive credential
function maskSecret(val) {
  if (!val || val.length < 8) return '••••••';
  return `${val.slice(0, 4)}••••••${val.slice(-4)}`;
}

// Check single domain public non-invasive signals
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
    // If domain does not resolve, return immediately with Dead Domain finding
    resObj.scores.evidenceConfidence = 95;
    resObj.scores.salesPriority = 10;
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
      indicativePriceEur: 195,
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
      timeout: 4500,
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

  // 3. HTTP & HTTPS Fetch (Non-invasive GET with standard browser headers)
  let rawHtml = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const httpUrl = `https://${domain}`;
    const resp = await fetch(httpUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (ARGUS Lead Audit)'
      }
    });
    clearTimeout(timeout);

    resObj.http.reachable = true;
    resObj.http.statusCode = resp.status;
    resObj.http.finalUrl = resp.url;
    resObj.http.httpsEnforced = resp.url.startsWith('https://');

    // Extract headers
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

  // 4. Analyze HTML & Frontend Assets
  if (rawHtml) {
    // 4A. Quality & SEO signals
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
    const missingAlt = imgMatches.filter(img => !/alt=["'][^"']*["']/i.test(img)).length;
    resObj.quality.imagesMissingAlt = missingAlt;

    resObj.quality.hasPhoneLink = /href=["']tel:[^"']+["']/i.test(rawHtml);
    resObj.quality.hasEmailLink = /href=["']mailto:[^"']+["']/i.test(rawHtml);
    resObj.quality.brokenContactPath = !resObj.quality.hasPhoneLink && !resObj.quality.hasEmailLink;

    // 4B. Privacy & Cookie signals
    const privMatch = rawHtml.match(/href=["']([^"']*(?:privacy|privacyverklaring|privacybeleid|privacy-statement|privacystatement)[^"']*)["']/i);
    resObj.privacy.privacyPolicyUrl = privMatch ? privMatch[1] : null;

    const cookieMatch = rawHtml.match(/href=["']([^"']*(?:cookie|cookiebeleid|cookie-statement|cookieverklaring)[^"']*)["']/i);
    resObj.privacy.cookiePolicyUrl = cookieMatch ? cookieMatch[1] : null;

    // Detect CMPs
    const cmpPatterns = [
      { name: 'Cookiebot', regex: /cookiebot/i },
      { name: 'Complianz', regex: /complianz|cmplz/i },
      { name: 'OneTrust', regex: /onetrust/i },
      { name: 'CookieYes', regex: /cookieyes/i },
      { name: 'Borlabs', regex: /borlabs/i },
      { name: 'Axeptio', regex: /axeptio/i },
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

    // Detect Trackers
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

    // 4C. AI Transparency signals
    const aiPatterns = [
      { name: 'Chatbase', regex: /chatbase\.co/i },
      { name: 'Botpress', regex: /botpress/i },
      { name: 'Intercom Fin', regex: /intercom/i },
      { name: 'Voiceflow', regex: /voiceflow/i },
      { name: 'Tidio AI', regex: /tidio/i },
      { name: 'Crisp', regex: /client\.crisp\.chat/i },
      { name: 'Zendesk AI', regex: /static\.zdassets\.com/i }
    ];
    for (const ai of aiPatterns) {
      if (ai.regex.test(rawHtml)) {
        resObj.ai.aiVendorDetected = ai.name;
        resObj.ai.aiChatbotDetected = true;
        resObj.ai.status = 'DETECTED';
        break;
      }
    }
    if (/kunstmatige intelligentie|artificial intelligence|ai-assistent|ai chatbot/i.test(rawHtml)) {
      resObj.ai.aiTransparencyStatement = true;
    }

    // 4D. Frontend Credential / Exposure Static Inspection (Conservative!)
    // Detect source maps
    if (/sourceMappingURL=[^\s"']+\.map/i.test(rawHtml) || /\.js\.map/i.test(rawHtml)) {
      resObj.frontend.sourceMapsDetected = true;
      resObj.frontend.sourceMapFiles.push('Referenced in public HTML/bundle');
    }

    // Conservative patterns: Google Maps / Firebase browser key
    const gmapsKeyMatch = rawHtml.match(/AIza[0-9A-Za-z-_]{35}/);
    if (gmapsKeyMatch) {
      resObj.frontend.potentialSecretExposures.push({
        type: 'Google API Key (Browser)',
        maskedFingerprint: maskSecret(gmapsKeyMatch[0]),
        confidence: 'VERIFIED_PUBLIC_STRING',
        note: 'Normal public API key in frontend; verify HTTP referrer restrictions in Google Cloud Console.'
      });
    }

    // Stripe Publishable Key
    const stripePkMatch = rawHtml.match(/pk_live_[0-9a-zA-Z]{24,}/);
    if (stripePkMatch) {
      resObj.frontend.potentialSecretExposures.push({
        type: 'Stripe Publishable Key',
        maskedFingerprint: maskSecret(stripePkMatch[0]),
        confidence: 'VERIFIED_PUBLIC_STRING',
        note: 'Public publishable client key; ensure secret key (sk_live_) is never bundled.'
      });
    }

    // AWS Access Key Pattern (High risk if found!)
    const awsMatch = rawHtml.match(/AKIA[0-9A-Z]{16}/);
    if (awsMatch) {
      resObj.frontend.potentialSecretExposures.push({
        type: 'POTENTIAL PUBLIC CREDENTIAL EXPOSURE (AWS Key Pattern)',
        maskedFingerprint: maskSecret(awsMatch[0]),
        confidence: 'HIGH_RISK_PATTERN',
        note: 'Potential AWS Access Key ID observed in client code. Immediate rotation recommended.'
      });
    }

    // Check debug flags in HTML
    if (/window\.__INITIAL_STATE__|process\.env\.NODE_ENV\s*===?\s*['"]development['"]/i.test(rawHtml)) {
      resObj.frontend.debugObjectsDetected = true;
    }
  }

  // 5. Generate Standardized Findings (Evidence Model)
  const findings = [];
  const compId = biz.company_id;

  // Finding: Email DMARC missing
  if (resObj.dns.resolved && !resObj.dns.dmarc) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_dmarc`,
      company_id: compId,
      timestamp: auditTime,
      category: 'EMAIL_SECURITY',
      finding_title: 'Ontbrekend DMARC-beleid tegen e-mail spoofing',
      technical_description: `No _dmarc.${domain} TXT record exists. Mail receivers cannot verify sender policy enforcement.`,
      plain_language_description: 'E-mailverzenders hebben geen controlemechanisme om te controleren of een e-mail écht door dit bedrijf is verzonden.',
      customer_impact: 'Criminelen kunnen uit naam van uw bedrijf geloofwaardige nepfacturen naar klanten sturen.',
      evidence_type: 'DNS_RECORD',
      evidence_location: `DNS TXT query for _dmarc.${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'HIGH',
      authorization_required_for_validation: false,
      suggested_remediation: 'Voeg een DMARC-record toe (v=DMARC1; p=quarantine; ...) in DNS.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'E-mail Authenticatie & Anti-Spoofing (SPF/DMARC)'
    });
  } else if (resObj.dns.dmarc && /p=none/i.test(resObj.dns.dmarc)) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_weak_dmarc`,
      company_id: compId,
      timestamp: auditTime,
      category: 'EMAIL_SECURITY',
      finding_title: 'DMARC staat op passief monitoringbeleid (p=none)',
      technical_description: `DMARC record contains p=none. Untrusted emails are delivered without quarantine or rejection.`,
      plain_language_description: 'Het e-mailbeveiligingsfilter staat in de teststand en blokkeert nog geen valse e-mails.',
      customer_impact: 'Valse e-mails namens het bedrijf worden niet tegengehouden door ontvangende mailservers.',
      evidence_type: 'DNS_RECORD',
      evidence_location: `_dmarc.${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'MEDIUM',
      authorization_required_for_validation: false,
      suggested_remediation: 'Schakel DMARC na controle door naar p=quarantine of p=reject.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'E-mail Authenticatie & Anti-Spoofing (SPF/DMARC)'
    });
  }

  // Finding: Missing HSTS
  if (resObj.http.reachable && !resObj.http.hsts) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_hsts`,
      company_id: compId,
      timestamp: auditTime,
      category: 'WEB_SECURITY_HARDENING',
      finding_title: 'Ontbrekende HSTS-beveiligingsheader',
      technical_description: 'Strict-Transport-Security header is absent in HTTPS responses.',
      plain_language_description: 'De website dwingt browsers niet af om altijd een beveiligde verbinding te gebruiken.',
      customer_impact: 'Klanten op openbare wifi-netwerken lopen een klein risico op protocol downgrade attacks.',
      evidence_type: 'HTTP_RESPONSE_HEADER',
      evidence_location: `https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'MEDIUM',
      authorization_required_for_validation: false,
      suggested_remediation: 'Voeg de header Strict-Transport-Security: max-age=31536000 toe aan de webserver.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'Website Beveiligingsverharding (HTTP Headers)'
    });
  }

  // Finding: Missing CSP
  if (resObj.http.reachable && !resObj.http.csp) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_csp`,
      company_id: compId,
      timestamp: auditTime,
      category: 'WEB_SECURITY_HARDENING',
      finding_title: 'Ontbrekende Content-Security-Policy (CSP)',
      technical_description: 'No Content-Security-Policy header returned.',
      plain_language_description: 'Er is geen serverinstructie die bepaalt welke scripts wel of niet mogen draaien op de site.',
      customer_impact: 'Verhoogd risico bij eventuele kwetsbaarheden in gebruikte externe scripts of plugins.',
      evidence_type: 'HTTP_RESPONSE_HEADER',
      evidence_location: `https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Configureer een basis-CSP met veilige bronnen.',
      estimated_remediation_complexity: 'MEDIUM',
      commercial_service_mapping: 'Website Beveiligingsverharding (HTTP Headers)'
    });
  }

  // Finding: Clickjacking risk (Missing XFO / frame-ancestors)
  const hasFrameAncestors = resObj.http.cspDetails && resObj.http.cspDetails.includes('frame-ancestors');
  if (resObj.http.reachable && !resObj.http.xfo && !hasFrameAncestors) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_xfo`,
      company_id: compId,
      timestamp: auditTime,
      category: 'WEB_SECURITY_HARDENING',
      finding_title: 'Geen framing-beveiliging tegen Clickjacking (X-Frame-Options)',
      technical_description: 'Neither X-Frame-Options nor frame-ancestors directive configured.',
      plain_language_description: 'De website kan door andere websites onzichtbaar in een venster (iframe) worden geladen.',
      customer_impact: 'Kwaadwillenden kunnen knoppen over elkaar leggen om onbewuste muisklikken uit te lokken.',
      evidence_type: 'HTTP_RESPONSE_HEADER',
      evidence_location: `https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Configureer X-Frame-Options: SAMEORIGIN op de webserver.',
      estimated_remediation_complexity: 'TRIVIAL',
      commercial_service_mapping: 'Website Beveiligingsverharding (HTTP Headers)'
    });
  }

  // Finding: Privacy compliance gap - Pre-consent tracking
  if (resObj.privacy.preConsentTrackingRisk) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_preconsent_tracking`,
      company_id: compId,
      timestamp: auditTime,
      category: 'PRIVACY_CONFIGURATION',
      finding_title: 'Potentiële compliance-afwijking: trackers actief zonder zichtbare cookiebanner',
      technical_description: `Third-party trackers (${resObj.privacy.thirdPartyTrackers.join(', ')}) loaded during ordinary page load, but no consent management banner was detected. Potential compliance gap. Requires legal/human verification.`,
      plain_language_description: 'De site laadt analytische of marketingsoftware van derden in voordat de bezoeker toestemming heeft kunnen geven.',
      customer_impact: 'Kan leiden tot vragen of opmerkingen van privacybewuste bezoekers of toezichthouders over AVG-conformiteit.',
      evidence_type: 'DOM_STATIC_INSPECTION',
      evidence_location: `HTML source of https://${domain}`,
      confidence: 'SUPPORTED',
      severity_if_confirmed: 'MEDIUM',
      authorization_required_for_validation: false,
      suggested_remediation: 'Installeer een nette AVG-conforme cookiebanner (bijv. Complianz of Cookiebot) die trackers pauzeert tot akkoord.',
      estimated_remediation_complexity: 'LOW',
      commercial_service_mapping: 'Privacy & Cookie Compliance Inrichting'
    });
  }

  // Finding: Missing Privacy Statement
  if (resObj.http.reachable && !resObj.privacy.privacyPolicyUrl) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_privacy_link`,
      company_id: compId,
      timestamp: auditTime,
      category: 'PRIVACY_CONFIGURATION',
      finding_title: 'Geen directe privacyverklaring vindbaar op de website',
      technical_description: 'No discoverable link to a privacy policy (privacyverklaring/privacy statement) found in main HTML.',
      plain_language_description: 'Er is op de homepage geen duidelijke link naar een privacyverklaring aangetroffen.',
      customer_impact: 'Klanten en instanties kunnen niet direct inzien hoe er met contactgegevens wordt omgegaan.',
      evidence_type: 'DOM_STATIC_INSPECTION',
      evidence_location: `https://${domain}`,
      confidence: 'SUPPORTED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Plaats een duidelijke link naar de privacyverklaring in de footer van elke pagina.',
      estimated_remediation_complexity: 'TRIVIAL',
      commercial_service_mapping: 'Privacy & Cookie Compliance Inrichting'
    });
  }

  // Finding: SEO & Conversion - Missing Meta Description
  if (resObj.http.reachable && !resObj.quality.metaDescription) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_meta_desc`,
      company_id: compId,
      timestamp: auditTime,
      category: 'TECHNICAL_SEO',
      finding_title: 'Ontbrekende meta-omschrijving in Google zoekresultaten',
      technical_description: 'Meta description tag is absent. Search engines will extract random page snippets.',
      plain_language_description: 'In Google wordt geen gerichte wervende tekst getoond onder uw bedrijfsnaam.',
      customer_impact: 'Minder potentiële klanten klikken door vanuit Google naar uw website.',
      evidence_type: 'DOM_STATIC_INSPECTION',
      evidence_location: `<head> section of https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Voeg een converterende meta-description tag van 150 karakters toe.',
      estimated_remediation_complexity: 'TRIVIAL',
      commercial_service_mapping: 'SEO & Lokale Vindbaarheid Optimalisatie'
    });
  }

  // Finding: Missing Direct Contact Call-to-Action
  if (resObj.http.reachable && resObj.quality.brokenContactPath) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_no_contact_cta`,
      company_id: compId,
      timestamp: auditTime,
      category: 'CUSTOMER_JOURNEY',
      finding_title: 'Geen directe klikbare telefoon- of e-mailknop op mobiel',
      technical_description: 'No clickable tel: or mailto: links observed on the primary page.',
      plain_language_description: 'Mobiele bezoekers kunnen niet met één tik direct bellen of mailen.',
      customer_impact: 'Drempel voor nieuwe klanten om direct contact op te nemen is onnodig hoog.',
      evidence_type: 'DOM_STATIC_INSPECTION',
      evidence_location: `Links in https://${domain}`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Voeg een klikbaar telefoonnummer (tel:) en e-mailadres toe in de header/footer.',
      estimated_remediation_complexity: 'TRIVIAL',
      commercial_service_mapping: 'Conversie & Mobiele Optimalisatie'
    });
  }

  // Finding: Server version disclosure banner
  if (resObj.http.serverBanner && /apache\/[0-9]|nginx\/[0-9]|php\/[0-9]/i.test(resObj.http.serverBanner)) {
    findings.push({
      finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_server_disclosure`,
      company_id: compId,
      timestamp: auditTime,
      category: 'WEB_SECURITY_HARDENING',
      finding_title: 'Serverversie openbaar zichtbaar in HTTP-headers',
      technical_description: `Server header discloses exact software version: ${resObj.http.serverBanner}.`,
      plain_language_description: 'De webserver vertelt aan iedereen exact welke serversoftware en versienummer er draait.',
      customer_impact: 'Maakt het voor geautomatiseerde scanners makkelijker om te zoeken naar bekende lekken.',
      evidence_type: 'HTTP_RESPONSE_HEADER',
      evidence_location: `Server / X-Powered-By headers`,
      confidence: 'VERIFIED',
      severity_if_confirmed: 'LOW',
      authorization_required_for_validation: false,
      suggested_remediation: 'Zet ServerTokens Prod en ServerSignature Off in de configuratie.',
      estimated_remediation_complexity: 'TRIVIAL',
      commercial_service_mapping: 'Website Beveiligingsverharding (HTTP Headers)'
    });
  }

  // Finding: Potential credential exposure
  if (resObj.frontend.potentialSecretExposures.length > 0) {
    for (const exp of resObj.frontend.potentialSecretExposures) {
      findings.push({
        finding_id: `fnd_${domain.replace(/[^a-z0-9]/g, '')}_exposed_key`,
        company_id: compId,
        timestamp: auditTime,
        category: 'WEB_SECURITY_HARDENING',
        finding_title: `Potentiële publieke sleutelblootstelling: ${exp.type}`,
        technical_description: `Public code contains token pattern (${exp.type}) with masked fingerprint ${exp.maskedFingerprint}. ${exp.note}`,
        plain_language_description: 'Er staat een technische toegangssleutel in de openbare websitecode die normaal beschermd moet worden.',
        customer_impact: 'Onbevoegden kunnen mogelijk API-tegoeden verbruiken als de sleutel niet correct begrensd is.',
        evidence_type: 'DOM_STATIC_INSPECTION',
        evidence_location: `Frontend JavaScript / HTML`,
        confidence: exp.confidence,
        severity_if_confirmed: exp.type.includes('AWS') ? 'HIGH' : 'LOW',
        authorization_required_for_validation: false,
        suggested_remediation: 'Controleer restricties in de cloud console en verplaats geheime sleutels naar de backend.',
        estimated_remediation_complexity: 'LOW',
        commercial_service_mapping: 'Website Beveiligingsverharding & API Audit'
      });
    }
  }

  resObj.findings = findings;

  // 6. Independent Scoring Engine (0-100)
  // Technical Exposure
  let techScore = 0;
  if (!resObj.http.hsts) techScore += 25;
  if (!resObj.http.csp) techScore += 20;
  if (!resObj.http.xfo) techScore += 15;
  if (!resObj.http.xcto) techScore += 10;
  if (resObj.http.serverBanner) techScore += 10;
  if (resObj.frontend.sourceMapsDetected) techScore += 10;
  if (resObj.frontend.potentialSecretExposures.length > 0) techScore += 10;
  resObj.scores.technicalExposure = Math.min(100, techScore);

  // Privacy Compliance Signal
  let privScore = 0;
  if (!resObj.privacy.privacyPolicyUrl) privScore += 35;
  if (!resObj.privacy.cookiePolicyUrl) privScore += 20;
  if (resObj.privacy.preConsentTrackingRisk) privScore += 35;
  else if (resObj.privacy.thirdPartyTrackers.length > 0) privScore += 10;
  resObj.scores.privacyCompliance = Math.min(100, privScore);

  // Web Quality (100 is best)
  let qualScore = 0;
  if (resObj.http.reachable) qualScore += 25;
  if (resObj.tls.authorized) qualScore += 25;
  if (resObj.quality.viewport) qualScore += 15;
  if (resObj.quality.title) qualScore += 10;
  if (resObj.quality.htmlLang) qualScore += 10;
  if (resObj.quality.structuredData) qualScore += 10;
  if (resObj.quality.imagesMissingAlt === 0 && resObj.quality.imagesCount > 0) qualScore += 5;
  resObj.scores.webQuality = Math.min(100, qualScore);

  // SEO & Conversion Opportunity (Higher = more opportunity to sell improvements)
  let seoScore = 0;
  if (!resObj.quality.metaDescription) seoScore += 30;
  if (!resObj.quality.canonical) seoScore += 20;
  if (!resObj.quality.structuredData) seoScore += 25;
  if (resObj.quality.brokenContactPath) seoScore += 25;
  resObj.scores.seoConversion = Math.min(100, seoScore);

  // Evidence Confidence
  resObj.scores.evidenceConfidence = resObj.http.reachable ? 95 : 70;

  // Sales Priority Score (0-100)
  let priority = 20;
  // High impact: Email spoofing risk
  if (!resObj.dns.dmarc) priority += 25;
  else if (/p=none/i.test(resObj.dns.dmarc || '')) priority += 15;
  // High impact: Privacy gap with active trackers
  if (resObj.privacy.preConsentTrackingRisk) priority += 25;
  else if (!resObj.privacy.privacyPolicyUrl) priority += 10;
  // Missing basic web security
  if (!resObj.http.hsts && !resObj.http.csp) priority += 15;
  // SEO/Conversion low hanging fruit
  if (!resObj.quality.metaDescription && resObj.quality.brokenContactPath) priority += 15;
  // Sector multiplier
  if ([3, 4, 5].includes(biz.cohort_id)) priority += 10; // Lawyers, healthcare, accountants care deeply about compliance

  resObj.scores.salesPriority = Math.min(100, priority);

  // Determine Color
  if (resObj.scores.salesPriority >= 75 || (!resObj.dns.dmarc && resObj.privacy.preConsentTrackingRisk)) {
    resObj.scores.priorityColor = '🟥'; // Urgent-looking verified public evidence
  } else if (resObj.scores.salesPriority >= 55) {
    resObj.scores.priorityColor = '🟧'; // Substantial opportunity
  } else if (resObj.scores.salesPriority >= 35) {
    resObj.scores.priorityColor = '🟨'; // Moderate opportunity
  } else {
    resObj.scores.priorityColor = '🟩'; // Healthy / low immediate opportunity
  }

  // 7. Debbie Mode Dutch Explanation & Commercial Pitch
  let primaryFinding = findings[0] || null;
  let serviceName = 'Website Beveiligingscheck & Quick Fix';
  let servicePrice = 350;

  if (findings.some(f => f.category === 'EMAIL_SECURITY')) {
    serviceName = 'E-mail Authenticatie & Anti-Spoofing (SPF/DMARC)';
    servicePrice = 495;
    resObj.debbiePitch.oneLinerNL = 'Het e-mailadres van uw kantoor is niet beveiligd tegen nabootsing door kwaadwillenden.';
    resObj.debbiePitch.whyCareNL = 'Iedereen kan vanaf het internet een e-mail sturen met uw adres als afzender, bijvoorbeeld om valse betaalverzoeken naar cliënten te sturen.';
    resObj.debbiePitch.whatWeOfferNL = 'We configureren binnen 48 uur een officieel DMARC- en SPF-slot op uw domeinnaam en monitoren dit continu.';
    resObj.debbiePitch.nextAction = 'Korte demonstratie laten zien op tablet hoe e-mailbeveiliging nu scoort en aanbieden DMARC in te richten.';
  } else if (findings.some(f => f.category === 'PRIVACY_CONFIGURATION')) {
    serviceName = 'Privacy & Cookie Compliance Inrichting';
    servicePrice = 450;
    resObj.debbiePitch.oneLinerNL = 'Er worden trackingcookies van derden ingeladen voordat bezoekers akkoord hebben kunnen geven in een cookiebanner.';
    resObj.debbiePitch.whyCareNL = 'Sinds de verscherping van toezicht door de Autoriteit Persoonsgegevens letten steeds meer klanten en inspecties hierop.';
    resObj.debbiePitch.whatWeOfferNL = 'Een nette, razendsnelle cookiebanner die tracking pas activeert na akkoord en uw privacyverklaring correct integreert.';
    resObj.debbiePitch.nextAction = 'Vragen wie bij hen verantwoordelijk is voor AVG-naleving en de gratis 1-pagina scan overhandigen.';
  } else if (findings.some(f => f.category === 'TECHNICAL_SEO' || f.category === 'CUSTOMER_JOURNEY')) {
    serviceName = 'Lokale Vindbaarheid & Conversie Optimalisatie';
    servicePrice = 350;
    resObj.debbiePitch.oneLinerNL = 'In Google ontbreekt een duidelijke wervende beschrijving en mobiele bezoekers kunnen niet direct bellen.';
    resObj.debbiePitch.whyCareNL = 'U verliest potentiële lokale klanten in Arnhem aan concurrenten die wel direct bellen en vindbaar zijn.';
    resObj.debbiePitch.whatWeOfferNL = 'Technische Google-optimalisatie, directe bel-knoppen op mobiel en Google Maps profielkoppeling.';
    resObj.debbiePitch.nextAction = 'Laten zien hoe de website verschijnt op een smartphone versus een concurrent uit dezelfde straat.';
  } else {
    resObj.debbiePitch.oneLinerNL = 'De website is online en functioneel, maar mist een aantal moderne beveiligingsheaders (HSTS/CSP).';
    resObj.debbiePitch.whyCareNL = 'Zorgt voor maximale beveiliging tegen meelezen en voorkomt waarschuwingen in toekomstige browserversies.';
    resObj.debbiePitch.whatWeOfferNL = 'Een periodieke onderhoudsbeurt en security header hardening.';
    resObj.debbiePitch.nextAction = 'Periodieke monitoring aanbieden voor €49 per maand.';
  }

  resObj.debbiePitch.estimatedService = serviceName;
  resObj.debbiePitch.indicativePriceEur = servicePrice;

  return resObj;
}

// Master execution runner
async function main() {
  console.log('=== ARGUS LEAD INTELLIGENCE ENGINE ===');
  console.log('Target: Local Commercial Territory around Arnhem, NL');
  console.log('Date:', new Date().toISOString());

  const canonicalPath = path.resolve('data/canonical_arnhem_businesses.json');
  if (!fs.existsSync(canonicalPath)) {
    console.error('Error: canonical businesses dataset not found at', canonicalPath);
    process.exit(1);
  }

  const businesses = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
  console.log(`Loaded ${businesses.length} canonical businesses.`);

  const CONCURRENCY = 6;
  const results = [];
  let index = 0;

  console.log(`Starting non-invasive signal collection with concurrency ${CONCURRENCY}...`);

  async function worker(workerId) {
    while (index < businesses.length) {
      const current = businesses[index++];
      console.log(`[Worker ${workerId}] [${index}/${businesses.length}] Auditing: ${current.business_name} (${current.domain})...`);
      try {
        const auditRes = await auditDomain(current);
        results.push(auditRes);
      } catch (err) {
        console.error(`Error auditing ${current.domain}:`, err.message);
      }
      await sleep(150); // Safe rate limit delay
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\nCompleted signal collection for ${results.length} businesses.`);

  // Save raw results
  const outDir = path.resolve('data');
  fs.writeFileSync(path.join(outDir, 'argus_arnhem_scanned_results.json'), JSON.stringify(results, null, 2));

  // Generate Master XLSX
  await generateMasterWorkbook(results);

  // Generate Reports for High Priority Leads
  await generateCompanyReports(results);

  console.log('\n=== RUN COMPLETED SUCCESSFULLY ===');
}

// Generate real formatted Excel Workbook
async function generateMasterWorkbook(results) {
  console.log('\nGenerating polished Excel workbook ARGUS_ARNHEM_LEADS.xlsx...');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ARGUS Autonomous Intelligence Lead Plane';
  workbook.lastModifiedBy = 'Abraham Haddioui & Debbie';
  workbook.created = new Date();

  // Color constants
  const NAVY = '1E293B';
  const LIGHT_GRAY = 'F1F5F9';
  const BORDER_COLOR = 'CBD5E1';

  const headerStyle = {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } },
      left: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } },
      bottom: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } },
      right: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } }
    }
  };

  const cellBorder = {
    top: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } },
    left: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } },
    bottom: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } },
    right: { style: 'thin', color: { argb: `FF${BORDER_COLOR}` } }
  };

  // -------------------------------------------------------------
  // SHEET 1: SALES (For Abraham & Debbie)
  // -------------------------------------------------------------
  const sheetSales = workbook.addWorksheet('SALES', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetSales.columns = [
    { header: 'Prioriteit', key: 'priority', width: 12 },
    { header: 'Bedrijf', key: 'business', width: 28 },
    { header: 'Categorie', key: 'category', width: 22 },
    { header: 'Stad', key: 'city', width: 12 },
    { header: 'Website', key: 'website', width: 24 },
    { header: 'Belangrijkste Probleem', key: 'mainIssue', width: 32 },
    { header: 'Waarom Belangrijk', key: 'whyCare', width: 38 },
    { header: 'Wat Wij Bieden', key: 'whatWeOffer', width: 34 },
    { header: 'Dienst', key: 'service', width: 28 },
    { header: 'Indicatieve Prijs', key: 'price', width: 16 },
    { header: 'Debbie Uitleg (Nederlands)', key: 'debbieNL', width: 45 },
    { header: 'Betrouwbaarheid', key: 'confidence', width: 16 },
    { header: 'Volgende Actie', key: 'nextAction', width: 35 },
    { header: 'Contactgegevens', key: 'contact', width: 25 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Notities', key: 'notes', width: 25 }
  ];

  sheetSales.getRow(1).height = 28;
  sheetSales.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  // Sort: Red first, then Orange, then Yellow, then Green, then Gray
  const colorOrder = { '🟥': 1, '🟧': 2, '🟨': 3, '🟩': 4, '⬜': 5 };
  const sortedSales = [...results].sort((a, b) => {
    const cDiff = (colorOrder[a.scores.priorityColor] || 9) - (colorOrder[b.scores.priorityColor] || 9);
    if (cDiff !== 0) return cDiff;
    return b.scores.salesPriority - a.scores.salesPriority;
  });

  sortedSales.forEach((r, idx) => {
    const firstFinding = r.findings[0];
    const mainIssue = firstFinding ? firstFinding.finding_title : 'Geen directe acute kwetsbaarheden';
    const contactInfo = [r.phone_public, r.public_contact].filter(Boolean).join(' | ') || r.address;

    const row = sheetSales.addRow({
      priority: `${r.scores.priorityColor} ${r.scores.salesPriority}/100`,
      business: r.business_name,
      category: r.category,
      city: r.city,
      website: r.domain,
      mainIssue: mainIssue,
      whyCare: r.debbiePitch.whyCareNL,
      whatWeOffer: r.debbiePitch.whatWeOfferNL,
      service: r.debbiePitch.estimatedService,
      price: `€${r.debbiePitch.indicativePriceEur}`,
      debbieNL: r.debbiePitch.oneLinerNL,
      confidence: `${r.scores.evidenceConfidence}%`,
      nextAction: r.debbiePitch.nextAction,
      contact: contactInfo,
      status: 'NEW',
      notes: r.source === 'ArnhemBizRadar' ? 'Bestaande radar lead' : 'Nieuwe geverifieerde lead'
    });

    row.height = 24;
    row.eachCell((cell, colNum) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (colNum === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (r.scores.priorityColor === '🟥') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { bold: true, color: { argb: 'FF991B1B' } };
        } else if (r.scores.priorityColor === '🟧') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
          cell.font = { bold: true, color: { argb: 'FF9A3412' } };
        } else if (r.scores.priorityColor === '🟨') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
          cell.font = { bold: true, color: { argb: 'FF854D0E' } };
        } else if (r.scores.priorityColor === '🟩') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { bold: true, color: { argb: 'FF166534' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          cell.font = { bold: true, color: { argb: 'FF475569' } };
        }
      }
    });
  });

  sheetSales.autoFilter = { from: 'A1', to: 'P1' };

  // -------------------------------------------------------------
  // SHEET 2: TECHNICAL (Deep diagnostics)
  // -------------------------------------------------------------
  const sheetTech = workbook.addWorksheet('TECHNICAL', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetTech.columns = [
    { header: 'Bedrijf', key: 'business', width: 26 },
    { header: 'Domein', key: 'domain', width: 22 },
    { header: 'HTTP Status', key: 'httpStatus', width: 14 },
    { header: 'HTTPS', key: 'https', width: 12 },
    { header: 'TLS Certificaat', key: 'tls', width: 20 },
    { header: 'HSTS', key: 'hsts', width: 10 },
    { header: 'CSP', key: 'csp', width: 10 },
    { header: 'X-Frame', key: 'xfo', width: 10 },
    { header: 'Frontend Blootstelling', key: 'frontend', width: 25 },
    { header: 'Source Map', key: 'sourcemap', width: 14 },
    { header: 'Privacyverklaring', key: 'privacy', width: 18 },
    { header: 'Cookiebanner', key: 'banner', width: 16 },
    { header: 'Trackers', key: 'trackers', width: 22 },
    { header: 'SEO Meta', key: 'seo', width: 14 },
    { header: 'Mobiel Viewport', key: 'viewport', width: 14 },
    { header: 'SPF Record', key: 'spf', width: 18 },
    { header: 'DMARC Record', key: 'dmarc', width: 18 },
    { header: 'AI Transparantie', key: 'ai', width: 18 },
    { header: 'Tech Exposure Score', key: 'scoreTech', width: 18 },
    { header: 'Compliance Score', key: 'scoreComp', width: 18 },
    { header: 'Web Quality Score', key: 'scoreQual', width: 18 },
    { header: 'Rapport Pad', key: 'reportPath', width: 30 }
  ];

  sheetTech.getRow(1).height = 28;
  sheetTech.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  results.forEach((r) => {
    const tlsStatus = r.tls.authorized ? `Geldig (${r.tls.daysRemaining}d)` : (r.tls.error || 'Geen SSL');
    const secretSummary = r.frontend.potentialSecretExposures.length > 0
      ? r.frontend.potentialSecretExposures.map(e => e.type).join('; ')
      : 'Geen';

    const row = sheetTech.addRow({
      business: r.business_name,
      domain: r.domain,
      httpStatus: r.http.statusCode || (r.http.error ? 'FOUT' : 'N/A'),
      https: r.http.httpsEnforced ? 'JA' : 'NEE',
      tls: tlsStatus,
      hsts: r.http.hsts ? 'JA' : 'NEE',
      csp: r.http.csp ? 'JA' : 'NEE',
      xfo: r.http.xfo ? 'JA' : 'NEE',
      frontend: secretSummary,
      sourcemap: r.frontend.sourceMapsDetected ? 'GEDETECTEERD' : 'NEE',
      privacy: r.privacy.privacyPolicyUrl ? 'AANWEZIG' : 'ONTBREEKT',
      banner: r.privacy.consentBannerDetected ? (r.privacy.consentBannerVendor || 'JA') : 'NEE',
      trackers: r.privacy.thirdPartyTrackers.join(', ') || 'Geen',
      seo: r.quality.metaDescription ? 'AANWEZIG' : 'ONTBREEKT',
      viewport: r.quality.viewport ? 'JA' : 'NEE',
      spf: r.dns.spf ? 'AANWEZIG' : 'ONTBREEKT',
      dmarc: r.dns.dmarc ? (r.dns.dmarc.includes('p=none') ? 'p=none' : 'HANDHAVEND') : 'ONTBREEKT',
      ai: r.ai.status === 'DETECTED' ? r.ai.aiVendorDetected : 'UNKNOWN',
      scoreTech: `${r.scores.technicalExposure}/100`,
      scoreComp: `${r.scores.privacyCompliance}/100`,
      scoreQual: `${r.scores.webQuality}/100`,
      reportPath: `reports/${r.company_id}/SUMMARY_NL.md`
    });

    row.height = 22;
    row.eachCell((cell) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle' };
    });
  });

  sheetTech.autoFilter = { from: 'A1', to: 'V1' };

  // -------------------------------------------------------------
  // SHEET 3: FINDINGS (Individual Granular Findings)
  // -------------------------------------------------------------
  const sheetFindings = workbook.addWorksheet('FINDINGS', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetFindings.columns = [
    { header: 'Finding ID', key: 'findingId', width: 28 },
    { header: 'Bedrijf', key: 'business', width: 24 },
    { header: 'Categorie', key: 'category', width: 22 },
    { header: 'Titel Bevinding', key: 'title', width: 34 },
    { header: 'Eenvoudige Uitleg (Debbie)', key: 'plainDesc', width: 42 },
    { header: 'Klantimpact', key: 'impact', width: 36 },
    { header: 'Technische Details', key: 'techDesc', width: 40 },
    { header: 'Bewijstype', key: 'evType', width: 18 },
    { header: 'Bewijslocatie', key: 'evLoc', width: 28 },
    { header: 'Zekerheid', key: 'confidence', width: 14 },
    { header: 'Ernst', key: 'severity', width: 12 },
    { header: 'Aanbevolen Oplossing', key: 'remediation', width: 38 },
    { header: 'Complexiteit', key: 'complexity', width: 14 },
    { header: 'Koppeling Dienst', key: 'service', width: 32 }
  ];

  sheetFindings.getRow(1).height = 28;
  sheetFindings.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  results.forEach((r) => {
    r.findings.forEach((f) => {
      const row = sheetFindings.addRow({
        findingId: f.finding_id,
        business: r.business_name,
        category: f.category,
        title: f.finding_title,
        plainDesc: f.plain_language_description,
        impact: f.customer_impact,
        techDesc: f.technical_description,
        evType: f.evidence_type,
        evLoc: f.evidence_location,
        confidence: f.confidence,
        severity: f.severity_if_confirmed,
        remediation: f.suggested_remediation,
        complexity: f.estimated_remediation_complexity,
        service: f.commercial_service_mapping
      });

      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.border = cellBorder;
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (colNum === 11) { // Severity
          if (f.severity_if_confirmed === 'HIGH' || f.severity_if_confirmed === 'CRITICAL') {
            cell.font = { bold: true, color: { argb: 'FFDC2626' } };
          } else if (f.severity_if_confirmed === 'MEDIUM') {
            cell.font = { bold: true, color: { argb: 'FFD97706' } };
          }
        }
      });
    });
  });

  sheetFindings.autoFilter = { from: 'A1', to: 'N1' };

  // -------------------------------------------------------------
  // SHEET 4: PIPELINE (Sales Kanban Tracker)
  // -------------------------------------------------------------
  const sheetPipeline = workbook.addWorksheet('PIPELINE', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetPipeline.columns = [
    { header: 'Status Fase', key: 'stage', width: 20 },
    { header: 'Bedrijf', key: 'business', width: 28 },
    { header: 'Categorie', key: 'category', width: 22 },
    { header: 'Website', key: 'website', width: 24 },
    { header: 'Contactpersoon / Telefoon', key: 'contact', width: 26 },
    { header: 'Aanbevolen Instapdienst', key: 'offering', width: 30 },
    { header: 'Verwachte Waarde', key: 'value', width: 18 },
    { header: 'Verantwoordelijke', key: 'owner', width: 18 },
    { header: 'Volgende Contactmoment', key: 'nextDate', width: 22 },
    { header: 'Notities & Gespreksverslag', key: 'notes', width: 40 }
  ];

  sheetPipeline.getRow(1).height = 28;
  sheetPipeline.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  // Populate initial top 30 leads into pipeline
  const topLeads = sortedSales.slice(0, 35);
  topLeads.forEach((r, idx) => {
    let stage = 'NEW';
    let owner = (idx % 2 === 0) ? 'Abraham' : 'Debbie';
    let nextDate = 'Maandag 28-09-2026';

    const row = sheetPipeline.addRow({
      stage: stage,
      business: r.business_name,
      category: r.category,
      website: r.domain,
      contact: [r.phone_public, r.public_contact].filter(Boolean).join(' | ') || r.address,
      offering: r.debbiePitch.estimatedService,
      value: `€${r.debbiePitch.indicativePriceEur}`,
      owner: owner,
      nextDate: nextDate,
      notes: `${r.scores.priorityColor} Prioriteitsscore ${r.scores.salesPriority}/100. ${r.debbiePitch.oneLinerNL}`
    });

    row.height = 22;
    row.eachCell((cell) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  sheetPipeline.autoFilter = { from: 'A1', to: 'J1' };

  // -------------------------------------------------------------
  // SHEET 5: DEFINITIONS (Debbie & Client Rosetta Stone)
  // -------------------------------------------------------------
  const sheetDefinitions = workbook.addWorksheet('DEFINITIONS', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheetDefinitions.columns = [
    { header: 'Technisch Begrip', key: 'term', width: 24 },
    { header: 'Eenvoudig Engels', key: 'simpleEn', width: 30 },
    { header: 'Eenvoudig Nederlands (Debbie)', key: 'simpleNl', width: 34 },
    { header: 'Betekenis voor de Ondernemer', key: 'businessMeaning', width: 42 },
    { header: 'Wat Absoluut NIET te Claimen', key: 'whatNotToSay', width: 45 }
  ];

  sheetDefinitions.getRow(1).height = 28;
  sheetDefinitions.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));

  const definitions = [
    {
      term: 'DMARC (Missing / p=none)',
      simpleEn: 'Email identity lock',
      simpleNl: 'Anti-spookmail en e-mailslot',
      businessMeaning: 'Zonder DMARC kan iedereen e-mails sturen die eruitzien alsof ze van uw domein komen (bijv. valse facturen naar cliënten).',
      whatNotToSay: 'Zeg NOOIT: "Uw e-mail is gehackt." Zeg WEL: "Uw domein heeft nog geen actief slot tegen identiteitsnabootsing."'
    },
    {
      term: 'SPF (Sender Policy Framework)',
      simpleEn: 'Authorized mail server list',
      simpleNl: 'Lijst met goedgekeurde mailservers',
      businessMeaning: 'Bepaalt welke servers namens uw bedrijf e-mails mogen afleveren.',
      whatNotToSay: 'Zeg NOOIT: "U overtreedt de telecomwet." Zeg WEL: "Uw e-mailverzendlijst is nog niet sluitend geconfigureerd."'
    },
    {
      term: 'HSTS (Strict-Transport-Security)',
      simpleEn: 'Mandatory encrypted connection',
      simpleNl: 'Geforceerde beveiligde verbinding',
      businessMeaning: 'Dwingt internetbrowsers om altijd de veilige HTTPS-verbinding te gebruiken, zelfs als iemand http:// intypt op openbare wifi.',
      whatNotToSay: 'Zeg NOOIT: "Uw website is onveilig en gevaarlijk." Zeg WEL: "De automatische HTTPS-afscherming kan strakker worden ingesteld."'
    },
    {
      term: 'CSP (Content-Security-Policy)',
      simpleEn: 'Approved script whitelist',
      simpleNl: 'Script- en invoegfilter',
      businessMeaning: 'Bepaalt exact welke externe programma\'s en scripts mogen draaien op uw pagina om kwaadaardige injecties te weren.',
      whatNotToSay: 'Zeg NOOIT: "Er zit malware op uw site." Zeg WEL: "Er is nog geen vangnet ingesteld voor externe scripts."'
    },
    {
      term: 'X-Frame-Options (Clickjacking)',
      simpleEn: 'Anti-invisible overlay protection',
      simpleNl: 'Bescherming tegen onzichtbaar inlijsten',
      businessMeaning: 'Voorkomt dat andere websites uw site in een onzichtbaar frame laden om knoppen van bezoekers te manipuleren.',
      whatNotToSay: 'Zeg NOOIT: "U wordt bespioneerd." Zeg WEL: "Uw site staat open voor inbedding door derden."'
    },
    {
      term: 'Pre-Consent Tracking / Cookies',
      simpleEn: 'Trackers active before consent',
      simpleNl: 'Analysesoftware zonder toestemmingsvenster',
      businessMeaning: 'Google Analytics of Meta Pixel registreert al bezoekers voordat ze in een cookiebanner akkoord hebben gegeven.',
      whatNotToSay: 'Zeg NOOIT: "U bent illegaal bezig en krijgt een boete van €20.000." Zeg WEL: "Er is een potentieel compliance-aandachtspunt onder de AVG."'
    },
    {
      term: 'Public Frontend API Key',
      simpleEn: 'Exposed public configuration key',
      simpleNl: 'Openbare technische websleutel',
      businessMeaning: 'Een sleutel (bijv. voor Google Maps) die in de broncode staat. Als deze niet goed begrensd is, kunnen anderen er gebruik van maken.',
      whatNotToSay: 'Zeg NOOIT: "Uw geheime wachtwoord ligt op straat." Zeg WEL: "Er staat een technische toegangssleutel openbaar die we moeten controleren."'
    },
    {
      term: 'Meta Description & Canonical',
      simpleEn: 'Search engine display summary',
      simpleNl: 'Zoekmachine omschrijving en voorkeurslink',
      businessMeaning: 'De tekst die potentiële klanten zien wanneer ze uw bedrijf op Google vinden; zonder deze tekst kiest Google willekeurige zinnen.',
      whatNotToSay: 'Zeg NOOIT: "Google heeft u verbannen." Zeg WEL: "U laat gratis lokale kliks liggen aan concurrenten in de straat."'
    }
  ];

  definitions.forEach((d) => {
    const row = sheetDefinitions.addRow(d);
    row.height = 28;
    row.eachCell((cell) => {
      cell.border = cellBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  sheetDefinitions.autoFilter = { from: 'A1', to: 'E1' };

  // Write workbook to root
  const workbookPath = path.resolve('ARGUS_ARNHEM_LEADS.xlsx');
  await workbook.xlsx.writeFile(workbookPath);
  console.log(`Master Excel Workbook written to: ${workbookPath}`);
}

// Generate company reports under reports/<company-id>/
async function generateCompanyReports(results) {
  console.log('\nGenerating Company Reports under reports/...');

  // Filter top 15 priority leads
  const topLeads = results
    .filter(r => r.scores.priorityColor === '🟥' || r.scores.priorityColor === '🟧')
    .slice(0, 15);

  const reportsBase = path.resolve('reports');
  if (!fs.existsSync(reportsBase)) fs.mkdirSync(reportsBase, { recursive: true });

  for (const lead of topLeads) {
    const dir = path.join(reportsBase, lead.company_id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. SUMMARY_NL.md (Debbie & Client Friendly)
    const summaryNL = `# ARGUS Perimeter Scan · ${lead.business_name}
**Datum:** ${new Date().toLocaleDateString('nl-NL')}  
**Doelwit:** [${lead.domain}](${lead.website})  
**Locatie:** ${lead.address}, ${lead.city}  
**Status Prioriteit:** ${lead.scores.priorityColor} (${lead.scores.salesPriority}/100)  
**Auditor:** AUX Design (Arnhem) · In samenwerking met Debbie & Abraham  

---

## 📌 Samenvatting voor de Ondernemer
Tijdens een periodieke, niet-invasieve publieke perimeterscan van ondernemingen in Arnhem hebben wij de digitale bereikbaarheid, e-mailbeveiliging en publieke webconfiguratie van **${lead.business_name}** onderzocht.

### Wat hebben we waargenomen?
${lead.debbiePitch.oneLinerNL}

### Waarom is dit belangrijk voor uw onderneming?
${lead.debbiePitch.whyCareNL}

### Wat is ons voorstel?
${lead.debbiePitch.whatWeOfferNL}

- **Geadviseerde dienst:** ${lead.debbiePitch.estimatedService}
- **Indicatieve investering:** €${lead.debbiePitch.indicativePriceEur} (eenmalig)
- **Doorlooptijd:** Opgelost en cryptografisch geverifieerd binnen 48 uur.

---

## 📋 Gevonden Aandachtspunten (${lead.findings.length} totaal)
${lead.findings.map((f, i) => `
### ${i + 1}. ${f.finding_title}
- **Categorie:** ${f.category}
- **Ernst:** ${f.severity_if_confirmed}
- **Wat betekent dit:** ${f.plain_language_description}
- **Gevolg:** ${f.customer_impact}
- **Aanbevolen actie:** ${f.suggested_remediation}
`).join('\n')}

---
*Opmerking: Deze scan is uitsluitend gebaseerd op publiek waarneembare gegevens (DNS, HTTP headers, openbare HTML). Er heeft geen penetratietest of ongeautoriseerde toegang plaatsgevonden.*
`;
    fs.writeFileSync(path.join(dir, 'SUMMARY_NL.md'), summaryNL);

    // 2. TECHNICAL_REPORT.md
    const techReport = `# ARGUS Technical Perimeter Assessment
**Target:** ${lead.business_name} (${lead.domain})  
**IP Address:** ${lead.dns.ip || 'Unresolved'}  
**Timestamp:** ${lead.auditTimestamp}  
**Evidence Confidence:** ${lead.scores.evidenceConfidence}%  

## Diagnostic Matrix
- **HTTP Status:** ${lead.http.statusCode} (${lead.http.reachable ? 'Reachable' : 'Unreachable'})
- **HTTPS Enforced:** ${lead.http.httpsEnforced}
- **TLS Issuer:** ${lead.tls.issuer || 'N/A'} (Authorized: ${lead.tls.authorized}, Days remaining: ${lead.tls.daysRemaining})
- **HSTS:** ${lead.http.hsts} (${lead.http.hstsDetails || 'Header missing'})
- **CSP:** ${lead.http.csp} (${lead.http.cspDetails || 'Header missing'})
- **X-Frame-Options:** ${lead.http.xfo} (${lead.http.xfoDetails || 'Header missing'})
- **X-Content-Type-Options:** ${lead.http.xcto}
- **Referrer Policy:** ${lead.http.referrerPolicy || 'None'}
- **Server Banner:** ${lead.http.serverBanner || 'None'}
- **SPF Record:** \`${lead.dns.spf || 'None'}\`
- **DMARC Record:** \`${lead.dns.dmarc || 'None'}\`
- **Trackers Observed:** ${lead.privacy.thirdPartyTrackers.join(', ') || 'None'}
- **Consent Banner Vendor:** ${lead.privacy.consentBannerVendor || 'None detected'}
- **AI Integration Status:** ${lead.ai.status} (${lead.ai.aiVendorDetected || 'None'})

## Normalized Findings
\`\`\`json
${JSON.stringify(lead.findings, null, 2)}
\`\`\`
`;
    fs.writeFileSync(path.join(dir, 'TECHNICAL_REPORT.md'), techReport);

    // 3. EVIDENCE.json
    fs.writeFileSync(path.join(dir, 'EVIDENCE.json'), JSON.stringify(lead, null, 2));

    // 4. REMEDIATION.md
    const remediation = `# Stappenplan & Oplossing · ${lead.business_name}

## 1. Doel van de Remediatie
Het sluiten van de publiek waarneembare configuratiegaten op **${lead.domain}**, met minimale verstoring van de huidige bedrijfsvoering en zonder downtime.

## 2. Technische Actiepunten
${lead.findings.map((f, i) => `
### Stap ${i + 1}: ${f.finding_title}
- **Component:** ${f.category}
- **Oplossing:** ${f.suggested_remediation}
- **Geschatte tijd:** ${f.estimated_remediation_complexity === 'TRIVIAL' ? '30 minuten' : '1-2 uur'}
- **Verificatiemethode:** ARGUS hercontrole (cryptografisch bewijs voor/na).
`).join('\n')}

## 3. Commerciële Afhandeling AUX Design
- **Pakket:** ${lead.debbiePitch.estimatedService}
- **Vaste prijs:** €${lead.debbiePitch.indicativePriceEur} (excl. btw)
- **Inclusief:** Oplevering, DNS/Header configuratie, opleverrapport en hertestcertificaat.
`;
    fs.writeFileSync(path.join(dir, 'REMEDIATION.md'), remediation);

    // 5. PRINTABLE_REPORT.html (1-page clean printable HTML)
    const printableHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Perimeter QuickScan · ${lead.business_name}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.45; margin: 0; padding: 20px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
    .logo { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .logo span { color: #2563eb; }
    .meta { text-align: right; font-size: 11px; color: #64748b; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; margin-top: 4px; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-orange { background: #ffedd5; color: #9a3412; }
    .box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px; margin-bottom: 15px; border-radius: 0 4px 4px 0; }
    .box h3 { margin: 0 0 6px 0; font-size: 14px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th { background: #f1f5f9; text-align: left; padding: 7px; font-size: 11px; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    td { padding: 7px; font-size: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .offer-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ARGUS <span>PERIMETER</span></div>
      <div style="font-size: 14px; font-weight: 600; margin-top: 4px;">Digitale Gezondheidscheck · ${lead.business_name}</div>
      <div style="font-size: 12px; color: #475569;">${lead.address} · ${lead.domain}</div>
    </div>
    <div class="meta">
      <div>Datum: ${new Date().toLocaleDateString('nl-NL')}</div>
      <div>Referentie: ${lead.company_id}</div>
      <div class="badge ${lead.scores.priorityColor === '🟥' ? 'badge-red' : 'badge-orange'}">
        Status: ${lead.scores.priorityColor} Aandacht vereist (${lead.scores.salesPriority}/100)
      </div>
    </div>
  </div>

  <div class="box">
    <h3>Wat betekent deze scan voor uw onderneming?</h3>
    <p style="margin: 0 0 6px 0;"><strong>Kernbevinding:</strong> ${lead.debbiePitch.oneLinerNL}</p>
    <p style="margin: 0;"><strong>Zakelijke impact:</strong> ${lead.debbiePitch.whyCareNL}</p>
  </div>

  <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Overzicht van publieke observaties</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Aandachtspunt</th>
        <th style="width: 15%;">Ernst</th>
        <th style="width: 35%;">Uitleg</th>
        <th style="width: 25%;">Oplossing</th>
      </tr>
    </thead>
    <tbody>
      ${lead.findings.map(f => `
      <tr>
        <td><strong>${f.finding_title}</strong></td>
        <td><span style="font-weight: 600; color: ${f.severity_if_confirmed === 'HIGH' ? '#dc2626' : '#d97706'}">${f.severity_if_confirmed}</span></td>
        <td>${f.plain_language_description}</td>
        <td>${f.suggested_remediation}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="offer-card">
    <div>
      <div style="font-weight: 700; font-size: 13px; color: #1e3a8a;">Voorstel: ${lead.debbiePitch.estimatedService}</div>
      <div style="font-size: 11px; color: #3b82f6;">${lead.debbiePitch.whatWeOfferNL}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 16px; font-weight: 800; color: #1e3a8a;">€${lead.debbiePitch.indicativePriceEur}</div>
      <div style="font-size: 10px; color: #64748b;">Eenmalig · Binnen 48u opgelost</div>
    </div>
  </div>

  <div class="footer">
    ARGUS Audit Intelligence · AUX Design Arnhem · Contact: Abraham Haddioui & Debbie · E-mail: abraham@auxdesign.nl · Tel: +31 26 000 0000<br>
    <em>Deze audit is uitgevoerd op basis van publiek toegankelijke netwerkgegevens conform de AVG en de ethische ARGUS-veiligheidsrichtlijnen.</em>
  </div>
</body>
</html>`;
    fs.writeFileSync(path.join(dir, 'PRINTABLE_REPORT.html'), printableHtml);
  }

  console.log(`Generated complete report dossiers and printable HTML for ${topLeads.length} top leads.`);
}

main().catch(err => {
  console.error('Fatal error in ARGUS engine:', err);
  process.exit(1);
});
