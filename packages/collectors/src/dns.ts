import { resolveTxt, resolveMx, resolve4, resolve6, resolveNs, resolveCaa } from 'node:dns/promises';
import { Observation } from '@argus/schema';

export async function collectDns(domain: string, runId: string, targetId: string): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const observations: Observation[] = [];
  const timestamp = new Date().toISOString();

  const addObs = (type: string, rawValue: any) => {
    observations.push({
      id: `obs_dns_${type.toLowerCase()}_${domain}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      runId,
      targetId,
      type,
      source: 'dns',
      collector: 'argus-dns-collector',
      collectorVersion: '0.1.0',
      observedAt: timestamp,
      rawValue
    });
  };

  const tasks = [
    { type: 'DNS_A', fn: () => resolve4(domain) },
    { type: 'DNS_AAAA', fn: () => resolve6(domain) },
    { type: 'DNS_NS', fn: () => resolveNs(domain) },
    { type: 'DNS_MX', fn: () => resolveMx(domain) },
    { type: 'DNS_CAA', fn: () => resolveCaa(domain) },
    { type: 'DNS_TXT', fn: () => resolveTxt(domain) },
    { type: 'DNS_DMARC', fn: () => resolveTxt(`_dmarc.${domain}`) }
  ];

  for (const task of tasks) {
    try {
      const records = await task.fn();
      
      // Structure TXT records for SPF and DMARC
      let structuredValue: any = records;
      
      if (task.type === 'DNS_TXT') {
        const txtStrings = (records as string[][]).map(r => r.join(''));
        const spf = txtStrings.find(r => r.startsWith('v=spf1'));
        if (spf) {
          structuredValue = { raw: records, spf: { version: 'spf1', mechanisms: spf.split(' ').slice(1) } };
        } else {
          structuredValue = { raw: records };
        }
      } else if (task.type === 'DNS_DMARC') {
        const txtStrings = (records as string[][]).map(r => r.join(''));
        const dmarc = txtStrings.find(r => r.startsWith('v=DMARC1'));
        if (dmarc) {
          const tags = Object.fromEntries(dmarc.split(';').map(t => t.trim().split('=')).filter(t => t.length === 2));
          structuredValue = { raw: records, dmarc: tags };
        } else {
          structuredValue = { raw: records };
        }
      }

      addObs(task.type, structuredValue);
    } catch (error: any) {
      if (error.code !== 'ENODATA' && error.code !== 'ENOTFOUND') {
        addObs(`${task.type}_ERROR`, error.message);
      } else {
        // ENODATA or ENOTFOUND is an observation of absence
        addObs(task.type, null);
      }
    }
  }

  return observations;
}
