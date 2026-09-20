import { resolveMx, resolveTxt } from 'node:dns/promises';
import { Observation } from '@argus/schema';

export interface EmailSecurityObservationValue {
  domain: string;
  hasMx: boolean;
  mxRecords: Array<{ exchange: string; priority: number }>;
  spf: {
    present: boolean;
    rawRecord: string | null;
    qualifier: string | null; // '-all' | '~all' | '+all' | '?all'
    isStrict: boolean; // '-all'
    isSoftFail: boolean; // '~all'
    mechanisms: string[];
  };
  dmarc: {
    present: boolean;
    rawRecord: string | null;
    policy: 'none' | 'quarantine' | 'reject' | 'unknown';
    subdomainPolicy: string | null;
    percentage: number;
    aggregateReporting: string[];
    forensicReporting: string[];
  };
  mtaSts: {
    present: boolean;
    rawRecord: string | null;
  };
}

export async function collectEmailSecurity(
  domain: string,
  runId: string,
  targetId: string
): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const timestamp = new Date().toISOString();
  const collectorVersion = '0.1.0';

  let mxRecords: Array<{ exchange: string; priority: number }> = [];
  try {
    const mx = await resolveMx(domain);
    mxRecords = (mx || []).sort((a, b) => a.priority - b.priority);
  } catch {
    mxRecords = [];
  }

  // SPF lookup
  let spfRaw: string | null = null;
  let spfMechanisms: string[] = [];
  let spfQualifier: string | null = null;
  let spfStrict = false;
  let spfSoftFail = false;

  try {
    const txts = await resolveTxt(domain);
    const flattened = txts.map(t => t.join(''));
    const spfRecord = flattened.find(t => t.startsWith('v=spf1'));
    if (spfRecord) {
      spfRaw = spfRecord;
      const parts = spfRecord.split(/\s+/).filter(Boolean);
      spfMechanisms = parts.slice(1);
      const allPart = spfMechanisms.find(m => m.endsWith('all'));
      if (allPart) {
        spfQualifier = allPart;
        spfStrict = allPart === '-all';
        spfSoftFail = allPart === '~all';
      }
    }
  } catch {
    // ENODATA or ENOTFOUND
  }

  // DMARC lookup
  let dmarcRaw: string | null = null;
  let dmarcPolicy: 'none' | 'quarantine' | 'reject' | 'unknown' = 'unknown';
  let dmarcSubdomainPolicy: string | null = null;
  let dmarcPercentage = 100;
  let dmarcAgrReports: string[] = [];
  let dmarcForensicReports: string[] = [];

  try {
    const dmarcTxts = await resolveTxt(`_dmarc.${domain}`);
    const flattened = dmarcTxts.map(t => t.join(''));
    const dmarcRecord = flattened.find(t => t.startsWith('v=DMARC1'));
    if (dmarcRecord) {
      dmarcRaw = dmarcRecord;
      const tags: Record<string, string> = {};
      dmarcRecord.split(';').forEach(pair => {
        const [k, v] = pair.trim().split('=');
        if (k && v) tags[k.trim().toLowerCase()] = v.trim();
      });

      const p = (tags['p'] || '').toLowerCase();
      if (p === 'reject') dmarcPolicy = 'reject';
      else if (p === 'quarantine') dmarcPolicy = 'quarantine';
      else if (p === 'none') dmarcPolicy = 'none';

      dmarcSubdomainPolicy = tags['sp'] || null;
      if (tags['pct']) {
        const parsedPct = parseInt(tags['pct'], 10);
        if (!isNaN(parsedPct)) dmarcPercentage = parsedPct;
      }
      if (tags['rua']) {
        dmarcAgrReports = tags['rua'].split(',').map(r => r.trim());
      }
      if (tags['ruf']) {
        dmarcForensicReports = tags['ruf'].split(',').map(r => r.trim());
      }
    }
  } catch {
    // ENODATA or ENOTFOUND
  }

  // MTA-STS lookup
  let mtaStsRaw: string | null = null;
  try {
    const mtaTxts = await resolveTxt(`_mta-sts.${domain}`);
    const flattened = mtaTxts.map(t => t.join(''));
    const record = flattened.find(t => t.startsWith('v=STSv1'));
    if (record) mtaStsRaw = record;
  } catch {
    // optional
  }

  const value: EmailSecurityObservationValue = {
    domain,
    hasMx: mxRecords.length > 0,
    mxRecords,
    spf: {
      present: spfRaw !== null,
      rawRecord: spfRaw,
      qualifier: spfQualifier,
      isStrict: spfStrict,
      isSoftFail: spfSoftFail,
      mechanisms: spfMechanisms
    },
    dmarc: {
      present: dmarcRaw !== null,
      rawRecord: dmarcRaw,
      policy: dmarcPolicy,
      subdomainPolicy: dmarcSubdomainPolicy,
      percentage: dmarcPercentage,
      aggregateReporting: dmarcAgrReports,
      forensicReporting: dmarcForensicReports
    },
    mtaSts: {
      present: mtaStsRaw !== null,
      rawRecord: mtaStsRaw
    }
  };

  return [
    {
      id: `obs_email_${domain}_${Date.now()}`,
      runId,
      targetId,
      type: 'EMAIL_SECURITY',
      source: `dns://${domain}`,
      collector: 'argus-email-security-collector',
      collectorVersion,
      observedAt: timestamp,
      rawValue: value
    }
  ];
}
