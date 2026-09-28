import { describe, it, expect, vi } from 'vitest';
import { collectHttp } from './http.js';

describe('HTTP Collector', () => {
  it('enforces ARGUS_OFFLINE_MODE and performs zero network calls', async () => {
    const originalOfflineMode = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'true';

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => new Response());

    try {
      await expect(collectHttp('http://example.com', 'run-1', 'target-1'))
        .rejects
        .toThrow('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
      
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      process.env.ARGUS_OFFLINE_MODE = originalOfflineMode;
      fetchSpy.mockRestore();
    }
  });

  it('normalizes headers (HSTS/CSP) against a LOCAL fixture', async () => {
    const originalOfflineMode = process.env.ARGUS_OFFLINE_MODE;
    process.env.ARGUS_OFFLINE_MODE = 'false';

    const mockResponse = new Response('ok', {
      status: 200,
      headers: new Headers({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'content-security-policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff'
      })
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    try {
      const observations = await collectHttp('http://local-fixture.test', 'run-1', 'target-1');
      expect(observations.length).toBeGreaterThan(0);
      
      const httpObs = observations.find(o => o.type === 'HTTP_RESPONSE');
      expect(httpObs).toBeDefined();
      
      const headers = httpObs?.rawValue.headers;
      // headers should be normalized to lowercase
      expect(headers).toHaveProperty('strict-transport-security', 'max-age=31536000; includeSubDomains');
      expect(headers).toHaveProperty('content-security-policy', "default-src 'self'");
      expect(headers).toHaveProperty('x-content-type-options', 'nosniff');
    } finally {
      process.env.ARGUS_OFFLINE_MODE = originalOfflineMode;
      fetchSpy.mockRestore();
    }
  });
});


