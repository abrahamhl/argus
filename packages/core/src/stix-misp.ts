/**
 * STIX 2.1 & MISP CTI Exporter for ARGUS
 * 
 * Provides automated conversion of non-invasive ARGUS audits into:
 * 1. OASIS STIX 2.1 Cyber Threat Intelligence Bundles
 * 2. MISP (Malware Information Sharing Platform) Events
 * 
 * Ready for immediate ingestion by Europol EC3, National CERTs (NCSC-NL),
 * NATO NCI Agency, and corporate SIEM/SOAR platforms.
 */

import { createHash } from 'node:crypto';
import { Finding, Evidence } from '@argus/schema';

export interface StixBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  objects: any[];
}

export interface MispEvent {
  Event: {
    uuid: string;
    info: string;
    distribution: '0' | '1' | '2' | '3'; // 0 = Your organization, 3 = All communities
    threat_level_id: '1' | '2' | '3' | '4'; // 1 = High, 3 = Low, 4 = Undefined
    analysis: '0' | '1' | '2'; // 2 = Completed
    date: string;
    timestamp: string;
    Attribute: Array<{
      uuid: string;
      type: string;
      category: string;
      to_ids: boolean;
      value: string;
      comment: string;
    }>;
    Tag: Array<{ name: string; colour: string }>;
  };
}

export function exportToStix21(
  targetDomain: string,
  findings: Finding[],
  evidence: Evidence[],
  auditorName: string = 'ARGUS Sovereign Intelligence Engine'
): StixBundle {
  const ts = new Date().toISOString();
  const identityId = `identity--${createHash('sha256').update(auditorName).digest('hex').substring(0, 32)}`;
  const targetId = `identity--${createHash('sha256').update(targetDomain).digest('hex').substring(0, 32)}`;

  const objects: any[] = [];

  // 1. Auditor Identity
  objects.push({
    type: 'identity',
    spec_version: '2.1',
    id: identityId,
    created: ts,
    modified: ts,
    name: auditorName,
    identity_class: 'system',
    description: 'Autonomous non-invasive evidence and surface compliance control plane'
  });

  // 2. Target Identity
  objects.push({
    type: 'identity',
    spec_version: '2.1',
    id: targetId,
    created: ts,
    modified: ts,
    name: targetDomain,
    identity_class: 'organization',
    description: `Target domain assessed by ${auditorName}`
  });

  // 3. Observed Data
  const observedDataId = `observed-data--${createHash('sha256').update(targetDomain + ts).digest('hex').substring(0, 32)}`;
  const observableObjects: Record<string, any> = {
    '0': {
      type: 'domain-name',
      value: targetDomain
    }
  };

  let objIdx = 1;
  for (const ev of evidence) {
    if (ev.type === 'tls_handshake') {
      observableObjects[String(objIdx++)] = {
        type: 'x509-certificate',
        hashes: {
          'SHA-256': ev.sha256
        }
      };
    } else if (ev.type === 'http_response') {
      observableObjects[String(objIdx++)] = {
        type: 'network-traffic',
        protocols: ['tcp', 'tls', 'http'],
        src_port: 443
      };
    }
  }

  objects.push({
    type: 'observed-data',
    spec_version: '2.1',
    id: observedDataId,
    created_by_ref: identityId,
    created: ts,
    modified: ts,
    first_observed: ts,
    last_observed: ts,
    number_observed: 1,
    objects: observableObjects,
    custom_properties: {
      x_argus_evidence_count: evidence.length,
      x_argus_scope: 'PUBLIC_PASSIVE_ONLY'
    }
  });

  // 4. Indicators for each finding
  for (const f of findings) {
    const indicatorId = `indicator--${createHash('sha256').update(f.findingId || f.id || f.ruleId).digest('hex').substring(0, 32)}`;
    const sev = f.severity || 'LOW';

    objects.push({
      type: 'indicator',
      spec_version: '2.1',
      id: indicatorId,
      created_by_ref: identityId,
      created: ts,
      modified: ts,
      name: f.title || f.ruleId,
      description: f.technicalExplanation || f.description || 'Surface hygiene exposure',
      indicator_types: ['anomalous-activity'],
      pattern: `[domain-name:value = '${targetDomain}']`,
      pattern_type: 'stix',
      valid_from: ts,
      confidence: f.confidence === 'VERIFIED' ? 100 : 70,
      custom_properties: {
        x_argus_severity: sev,
        x_argus_rule_id: f.ruleId,
        x_argus_why_it_matters: f.whyItMatters || ''
      }
    });

    // Relationship: indicator -> targets -> targetId
    objects.push({
      type: 'relationship',
      spec_version: '2.1',
      id: `relationship--${createHash('sha256').update(indicatorId + targetId).digest('hex').substring(0, 32)}`,
      created: ts,
      modified: ts,
      relationship_type: 'targets',
      source_ref: indicatorId,
      target_ref: targetId
    });
  }

  const bundleId = `bundle--${createHash('sha256').update(targetDomain + ts + objects.length).digest('hex').substring(0, 32)}`;

  return {
    type: 'bundle',
    id: bundleId,
    spec_version: '2.1',
    objects
  };
}

export function exportToMisp(
  targetDomain: string,
  findings: Finding[],
  evidence: Evidence[]
): MispEvent {
  const ts = Math.floor(Date.now() / 1000).toString();
  const dateStr = new Date().toISOString().split('T')[0];
  const eventUuid = createHash('sha256').update(targetDomain + ts).digest('hex').substring(0, 36);

  const attributes: Array<{
    uuid: string;
    type: string;
    category: string;
    to_ids: boolean;
    value: string;
    comment: string;
  }> = [
    {
      uuid: createHash('sha256').update(targetDomain + 'domain').digest('hex').substring(0, 36),
      type: 'domain',
      category: 'Network activity',
      to_ids: false,
      value: targetDomain,
      comment: 'Target domain under passive audit'
    }
  ];

  for (const ev of evidence) {
    attributes.push({
      uuid: createHash('sha256').update(ev.sha256).digest('hex').substring(0, 36),
      type: 'sha256',
      category: 'Payload delivery',
      to_ids: false,
      value: ev.sha256,
      comment: `Evidence hash: ${ev.type}`
    });
  }

  for (const f of findings) {
    attributes.push({
      uuid: createHash('sha256').update((f.findingId || f.id || f.ruleId) + 'attr').digest('hex').substring(0, 36),
      type: 'text',
      category: 'Other',
      to_ids: false,
      value: `${f.title || f.ruleId}: ${f.technicalExplanation || f.description || ''}`,
      comment: `Severity: ${f.severity || 'LOW'}`
    });
  }

  return {
    Event: {
      uuid: eventUuid,
      info: `ARGUS Passive Surface Hygiene Audit: ${targetDomain}`,
      distribution: '3', // All communities
      threat_level_id: findings.some(f => f.severity === 'HIGH' || f.severity === 'CRITICAL') ? '2' : '3',
      analysis: '2', // Completed
      date: dateStr,
      timestamp: ts,
      Attribute: attributes,
      Tag: [
        { name: 'tlp:white', colour: '#ffffff' },
        { name: 'argus:passive-audit', colour: '#00e5ff' },
        { name: 'framework:nis2', colour: '#10b981' }
      ]
    }
  };
}
