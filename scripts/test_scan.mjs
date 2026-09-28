import dns from 'node:dns/promises';
import tls from 'node:tls';

async function checkDomain(domain) {
  const result = { domain };
  try {
    const a = await dns.resolve4(domain);
    result.ip = a[0];
  } catch (e) {
    result.dnsError = e.code;
    return result;
  }

  // HTTP & HTTPS check
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://${domain}`, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (ARGUS Lead Intelligence)'
      }
    });
    clearTimeout(timer);

    result.httpsStatus = res.status;
    result.finalUrl = res.url;
    result.hsts = res.headers.has('strict-transport-security');
    result.csp = res.headers.has('content-security-policy');
    result.xfo = res.headers.has('x-frame-options');
    result.xcto = res.headers.has('x-content-type-options');
    result.referrerPolicy = res.headers.get('referrer-policy');

    const html = await res.text();
    result.htmlLength = html.length;
    result.hasPrivacy = /privacy|privacyverklaring|privacybeleid|privacy-statement/i.test(html);
    result.hasCookie = /cookie|cookiebeleid|cookie-statement|cookieverklaring/i.test(html);
    result.hasConsentBanner = /cookiebot|onetrust|complianz|cookieyes|tarteaucitron|cc-banner|cookie-banner|cmplz/i.test(html);
    result.hasTrackers = /google-analytics\.com|googletagmanager\.com|gtag|fbq|connect\.facebook\.net|hotjar\.com|clarity\.ms/i.test(html);
    result.hasChatbot = /botpress|chatbase|intercom|tidio|crisp|zendesk|drift|livechat/i.test(html);
    result.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    result.hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
    result.hasTel = /tel:[+0-9\s()-]+/i.test(html);
    result.hasMailto = /mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(html);
  } catch (e) {
    result.httpError = e.message;
  }

  // SPF / DMARC check
  try {
    const txts = await dns.resolveTxt(domain);
    const flat = txts.map(t => t.join(''));
    const spf = flat.find(t => t.startsWith('v=spf1'));
    result.spf = spf || null;
  } catch (e) {
    result.spf = null;
  }

  try {
    const dmarcTxts = await dns.resolveTxt(`_dmarc.${domain}`);
    const flat = dmarcTxts.map(t => t.join(''));
    const dmarc = flat.find(t => t.startsWith('v=DMARC1'));
    result.dmarc = dmarc || null;
  } catch (e) {
    result.dmarc = null;
  }

  return result;
}

const sample = ['stadsvillasonsbeek.nl', 'goedproeven.nl', 'bar-florian.nl', 'flor-fina.nl', 'bistrorobinhood.nl'];
for (const d of sample) {
  const r = await checkDomain(d);
  console.log(d, '=>', {
    ip: r.ip,
    status: r.httpsStatus,
    hsts: r.hsts,
    csp: r.csp,
    xfo: r.xfo,
    privacy: r.hasPrivacy,
    banner: r.hasConsentBanner,
    trackers: r.hasTrackers,
    chatbot: r.hasChatbot,
    spf: !!r.spf,
    dmarc: !!r.dmarc
  });
}
