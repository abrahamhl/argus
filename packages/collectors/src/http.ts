import { Observation } from '@argus/schema';

export async function collectHttp(url: string, runId: string, targetId: string): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const observations: Observation[] = [];
  const timestamp = new Date().toISOString();
  
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {
    const response = await fetch(url, { 
      redirect: 'follow', // fetch automatically handles redirect limit (usually 20) and throws
      signal: controller.signal 
    });
    clearTimeout(timeout);
    
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

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
        status: response.status,
        url: response.url,
        redirected: response.redirected,
        headers
      }
    });
  } catch (error: any) {
    clearTimeout(timeout);
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
