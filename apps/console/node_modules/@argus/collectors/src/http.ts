import { Observation } from '@argus/schema';

export async function collectHttp(url: string, runId: string, targetId: string): Promise<Observation[]> {
  const observations: Observation[] = [];
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(url, { redirect: 'follow' });
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
    observations.push({
      id: `obs_http_err_${url}_${Date.now()}`,
      runId,
      targetId,
      type: 'HTTP_ERROR',
      source: 'http',
      collector: 'argus-http-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue: error.message
    });
  }

  return observations;
}
