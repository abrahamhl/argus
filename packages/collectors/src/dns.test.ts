import test from 'node:test';
import assert from 'node:assert';
import dnsPromises from 'node:dns/promises';
import { collectDns } from './dns.js';

test('collectDns enforces ARGUS_OFFLINE_MODE and performs zero network calls', async (t) => {
  const originalOfflineMode = process.env.ARGUS_OFFLINE_MODE;
  process.env.ARGUS_OFFLINE_MODE = 'true';

  let didMakeNetworkCall = false;
  
  // Mock resolveTxt to ensure it's not called
  const originalResolveTxt = dnsPromises.resolveTxt;
  (dnsPromises as any).resolveTxt = async () => {
    didMakeNetworkCall = true;
    return [['v=spf1']];
  };

  try {
    await assert.rejects(
      async () => {
        await collectDns('example.com', 'run-1', 'target-1');
      },
      (err: Error) => err.message === 'ARGUS_OFFLINE_MODE is active: Network collectors fail closed.',
      'Must fail closed with specific error message'
    );
    
    assert.strictEqual(didMakeNetworkCall, false, 'resolveTxt must not be called');
  } finally {
    process.env.ARGUS_OFFLINE_MODE = originalOfflineMode;
    (dnsPromises as any).resolveTxt = originalResolveTxt;
  }
});
