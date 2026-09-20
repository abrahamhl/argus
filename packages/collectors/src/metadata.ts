import { Observation } from '@argus/schema';

export interface WebsiteMetadataObservationValue {
  title: string | null;
  generator: string | null;
  viewport: string | null;
  lang: string | null;
  canonical: string | null;
  detectedCms: string | null;
}

export async function collectWebsiteMetadata(
  url: string,
  runId: string,
  targetId: string,
  timeoutMs: number = 5000
): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const timestamp = new Date().toISOString();
  const collectorVersion = '0.1.0';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (ARGUS Security Auditor)'
      }
    });
    clearTimeout(timer);

    let htmlChunk = '';
    if (res.body) {
      const reader = res.body.getReader();
      let bytesRead = 0;
      const MAX_BYTES = 65536; // Only read the first 64KB (head section)

      while (bytesRead < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        bytesRead += value.length;
        htmlChunk += Buffer.from(value).toString('utf-8');
        if (htmlChunk.includes('</head>')) {
          reader.cancel('Head section parsed');
          break;
        }
      }
    }

    // Extract title
    const titleMatch = htmlChunk.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    // Extract generator
    const genMatch = htmlChunk.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i) ||
                     htmlChunk.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']generator["']/i);
    const generator = genMatch ? genMatch[1].trim() : null;

    // Extract viewport
    const vpMatch = htmlChunk.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
    const viewport = vpMatch ? vpMatch[1].trim() : null;

    // Extract lang from <html lang="...">
    const langMatch = htmlChunk.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const lang = langMatch ? langMatch[1].trim() : null;

    // Extract canonical link
    const canonMatch = htmlChunk.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    const canonical = canonMatch ? canonMatch[1].trim() : null;

    // Detect CMS hints
    let detectedCms: string | null = null;
    if (generator && /wordpress/i.test(generator)) {
      detectedCms = 'WordPress';
    } else if (htmlChunk.includes('wp-content') || htmlChunk.includes('wp-includes')) {
      detectedCms = 'WordPress';
    } else if (generator && /drupal/i.test(generator)) {
      detectedCms = 'Drupal';
    } else if (generator && /joomla/i.test(generator)) {
      detectedCms = 'Joomla';
    } else if (generator && /shopify/i.test(generator)) {
      detectedCms = 'Shopify';
    }

    const value: WebsiteMetadataObservationValue = {
      title,
      generator,
      viewport,
      lang,
      canonical,
      detectedCms
    };

    return [
      {
        id: `obs_meta_${targetId}_${Date.now()}`,
        runId,
        targetId,
        type: 'WEBSITE_METADATA',
        source: url,
        collector: 'argus-metadata-collector',
        collectorVersion,
        observedAt: timestamp,
        rawValue: value
      }
    ];
  } catch (err: any) {
    return [
      {
        id: `obs_meta_err_${targetId}_${Date.now()}`,
        runId,
        targetId,
        type: 'WEBSITE_METADATA_ERROR',
        source: url,
        collector: 'argus-metadata-collector',
        collectorVersion,
        observedAt: timestamp,
        rawValue: { error: err.message }
      }
    ];
  }
}
