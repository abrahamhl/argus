import test from 'node:test';
import assert from 'node:assert';
import { collectHttp } from './http.js';

test('collectHttp enforces ARGUS_OFFLINE_MODE and performs zero network calls', async (t) => {
  const originalOfflineMode = process.env.ARGUS_OFFLINE_MODE;
  process.env.ARGUS_OFFLINE_MODE = 'true';

  let didMakeNetworkCall = false;
  
  // Create a mock fetch to ensure it's not called
  const originalFetch = global.fetch;
  global.fetch = async () => {
    didMakeNetworkCall = true;
    return new Response();
  };

  try {
    await assert.rejects(
      async () => {
        await collectHttp('http://example.com', 'run-1', 'target-1');
      },
      (err: Error) => err.message === 'ARGUS_OFFLINE_MODE is active: Network collectors fail closed.',
      'Must fail closed with specific error message'
    );
    
    assert.strictEqual(didMakeNetworkCall, false, 'Fetch must not be called');
  } finally {
    process.env.ARGUS_OFFLINE_MODE = originalOfflineMode;
    global.fetch = originalFetch;
  }
});
