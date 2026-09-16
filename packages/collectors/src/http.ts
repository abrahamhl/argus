import { Observation } from '@argus/schema';

export interface HttpCollectorOptions {
  maxRedirects?: number;
  maxBodySize?: number;
  validateRedirect?: (url: string, hop: number) => Promise<void>;
}

export async function collectHttp(
  url: string, 
  runId: string, 
  targetId: string,
  options: HttpCollectorOptions = {}
): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const maxRedirects = options.maxRedirects ?? 10;
  const maxBodySize = options.maxBodySize ?? 1048576; // 1 MiB
  const observations: Observation[] = [];
  const timestamp = new Date().toISOString();
  
  let currentUrl = url;
  let hopCount = 0;
  let finalStatus = 0;
  let finalHeaders: Record<string, string> = {};

  try {
    while (hopCount <= maxRedirects) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(currentUrl, { 
        redirect: 'manual',
        signal: controller.signal 
      });
      clearTimeout(timeout);
      
      finalStatus = response.status;
      finalHeaders = {};
      response.headers.forEach((value, key) => {
        finalHeaders[key.toLowerCase()] = value;
      });

      // Handle body size limit
      let bodySize = 0;
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bodySize += value.length;
          if (bodySize > maxBodySize) {
            reader.cancel('Response body exceeds maximum allowed size');
            throw new Error(`Response body exceeds maximum size of ${maxBodySize} bytes`);
          }
        }
      }

      // Check for redirect
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = finalHeaders['location'];
        if (!location) {
          break; // Redirect with no location, stop
        }
        
        // Resolve relative URL
        const nextUrl = new URL(location, currentUrl).toString();
        
        hopCount++;
        if (hopCount > maxRedirects) {
          throw new Error('max redirects exceeded');
        }

        if (options.validateRedirect) {
          await options.validateRedirect(nextUrl, hopCount);
        }
        
        currentUrl = nextUrl;
      } else {
        break; // Not a redirect
      }
    }

    observations.push({
      id: `obs_http_${url}_${Date.now()}`,
      runId,
      targetId,
      type: 'HTTP_RESPONSE',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: {
        status: finalStatus,
        url: currentUrl,
        redirected: hopCount > 0,
        headers: finalHeaders
      }
    });
  } catch (error: any) {
    const isRedirectLoop = error.message && (error.message.includes('redirect') || error.message.includes('loop') || error.message.includes('max redirects'));
    
    observations.push({
      id: `obs_http_err_${url}_${Date.now()}`,
      runId,
      targetId,
      type: isRedirectLoop ? 'HTTP_REDIRECT_LOOP' : 'HTTP_ERROR',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: error.message
    });
  }

  return observations;
}
