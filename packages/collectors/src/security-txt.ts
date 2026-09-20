import { Observation } from '@argus/schema';

export interface SecurityTxtCollectorOptions {
  timeoutMs?: number;
  maxBytes?: number;
}

export interface SecurityTxtField {
  field: string;
  value: string;
}

export interface SecurityTxtObservationValue {
  present: boolean;
  url: string | null;
  status: number | null;
  fields: Record<string, string[]>;
  contact: string[];
  expires: string | null;
  isExpired: boolean | null;
  canonical: string | null;
  encryption: string[];
  preferredLanguages: string[];
  policy: string | null;
  acknowledgments: string | null;
}

export async function collectSecurityTxt(
  domain: string,
  runId: string,
  targetId: string,
  options: SecurityTxtCollectorOptions = {}
): Promise<Observation[]> {
  if (process.env.ARGUS_OFFLINE_MODE === 'true') {
    throw new Error('ARGUS_OFFLINE_MODE is active: Network collectors fail closed.');
  }

  const timeoutMs = options.timeoutMs ?? 5000;
  const maxBytes = options.maxBytes ?? 65536; // 64 KB
  const timestamp = new Date().toISOString();
  const collectorVersion = '0.1.0';

  const urlsToTry = [
    `https://${domain}/.well-known/security.txt`,
    `https://${domain}/security.txt`
  ];

  for (const candidateUrl of urlsToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(candidateUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'text/plain' }
      });
      clearTimeout(timer);

      if (res.status === 200) {
        const text = await res.text();
        const boundedText = text.slice(0, maxBytes);

        // Parse RFC 9116 fields
        const lines = boundedText.split(/\r?\n/);
        const fields: Record<string, string[]> = {};

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          const colonIdx = trimmed.indexOf(':');
          if (colonIdx > 0) {
            const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
            const val = trimmed.slice(colonIdx + 1).trim();
            if (!fields[key]) fields[key] = [];
            fields[key].push(val);
          }
        }

        // Validate Contact and Expires (RFC 9116 mandatory fields)
        const contact = fields['contact'] || [];
        const expires = fields['expires'] ? fields['expires'][0] : null;
        let isExpired: boolean | null = null;

        if (expires) {
          const expDate = new Date(expires);
          if (!isNaN(expDate.getTime())) {
            isExpired = expDate.getTime() <= Date.now();
          }
        }

        const value: SecurityTxtObservationValue = {
          present: contact.length > 0,
          url: candidateUrl,
          status: res.status,
          fields,
          contact,
          expires,
          isExpired,
          canonical: fields['canonical'] ? fields['canonical'][0] : null,
          encryption: fields['encryption'] || [],
          preferredLanguages: fields['preferred-languages'] || [],
          policy: fields['policy'] ? fields['policy'][0] : null,
          acknowledgments: fields['acknowledgments'] ? fields['acknowledgments'][0] : null
        };

        return [
          {
            id: `obs_sectxt_${domain}_${Date.now()}`,
            runId,
            targetId,
            type: 'SECURITY_TXT',
            source: candidateUrl,
            collector: 'argus-security-txt-collector',
            collectorVersion,
            observedAt: timestamp,
            rawValue: value
          }
        ];
      }
    } catch {
      // Try fallback URL on network failure or 404
      continue;
    }
  }

  // Not found on either location
  return [
    {
      id: `obs_sectxt_none_${domain}_${Date.now()}`,
      runId,
      targetId,
      type: 'SECURITY_TXT',
      source: `https://${domain}/.well-known/security.txt`,
      collector: 'argus-security-txt-collector',
      collectorVersion,
      observedAt: timestamp,
      rawValue: {
        present: false,
        url: null,
        status: 404,
        contact: [],
        expires: null,
        isExpired: null,
        fields: {}
      }
    }
  ];
}
