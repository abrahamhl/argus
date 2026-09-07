import { resolveTxt } from 'node:dns/promises';
export async function collectDns(domain, runId, targetId) {
    const observations = [];
    const timestamp = new Date().toISOString();
    try {
        const txtRecords = await resolveTxt(domain);
        observations.push({
            id: `obs_dns_txt_${domain}_${Date.now()}`,
            runId,
            targetId,
            type: 'DNS_TXT',
            source: 'dns',
            collector: 'argus-dns-collector',
            collectorVersion: '0.1.0',
            observedAt: timestamp,
            rawValue: txtRecords
        });
    }
    catch (error) {
        observations.push({
            id: `obs_dns_txt_${domain}_${Date.now()}`,
            runId,
            targetId,
            type: 'DNS_TXT_ERROR',
            source: 'dns',
            collector: 'argus-dns-collector',
            collectorVersion: '0.1.0',
            observedAt: timestamp,
            rawValue: error.message
        });
    }
    return observations;
}
//# sourceMappingURL=dns.js.map