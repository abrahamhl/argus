/**
 * Continuous Posture Drift Engine for ARGUS
 * 
 * Compares audit snapshots across time (T0 vs T1) to:
 * 1. Mathematically verify remediations (resolved findings).
 * 2. Instantly detect regressions (newly introduced exposures).
 * 3. Track DNS and TLS infrastructure drift.
 * 4. Generate automated Remediation Verification Receipts or Regression Alerts.
 */

import { Finding, Evidence } from '@argus/schema';

export interface EvidenceDriftItem {
  evidenceType: string;
  source: string;
  baselineHash: string;
  followupHash: string;
  changed: boolean;
  baselineSnippet?: string;
  followupSnippet?: string;
}

export interface PostureDriftReport {
  targetDomain: string;
  baselineRunId: string;
  followupRunId: string;
  baselineTimestamp: string;
  followupTimestamp: string;
  resolvedFindings: Finding[];
  regressionFindings: Finding[];
  persistingFindings: Finding[];
  evidenceDrifts: EvidenceDriftItem[];
  driftScore: number; // Positive = improvement, Negative = degradation
  status: 'SIGNIFICANT_IMPROVEMENT' | 'STABLE_OR_MAINTAINED' | 'REGRESSION_ALERT';
  summaryNL: string;
  remediationReceiptHtml: string;
}

export function computePostureDrift(
  targetDomain: string,
  baseline: { runId: string; timestamp: string; findings: Finding[]; evidence: Evidence[] },
  followup: { runId: string; timestamp: string; findings: Finding[]; evidence: Evidence[] }
): PostureDriftReport {
  const baselineFindingMap = new Map<string, Finding>();
  for (const f of baseline.findings) {
    baselineFindingMap.set(f.findingId || f.id || f.ruleId, f);
  }

  const followupFindingMap = new Map<string, Finding>();
  for (const f of followup.findings) {
    followupFindingMap.set(f.findingId || f.id || f.ruleId, f);
  }

  // 1. Resolved findings: in baseline, but absent in followup
  const resolvedFindings: Finding[] = [];
  for (const [id, f] of baselineFindingMap.entries()) {
    if (!followupFindingMap.has(id)) {
      resolvedFindings.push(f);
    }
  }

  // 2. Regression findings: in followup, but absent in baseline
  const regressionFindings: Finding[] = [];
  for (const [id, f] of followupFindingMap.entries()) {
    if (!baselineFindingMap.has(id)) {
      regressionFindings.push(f);
    }
  }

  // 3. Persisting findings
  const persistingFindings: Finding[] = [];
  for (const [id, f] of followupFindingMap.entries()) {
    if (baselineFindingMap.has(id)) {
      persistingFindings.push(f);
    }
  }

  // 4. Evidence drift
  const evidenceDrifts: EvidenceDriftItem[] = [];
  const baselineEvMap = new Map<string, Evidence>();
  for (const ev of baseline.evidence) {
    baselineEvMap.set(ev.type + ':' + (ev.source || ev.id), ev);
  }

  for (const fEv of followup.evidence) {
    const key = fEv.type + ':' + (fEv.source || fEv.id);
    const bEv = baselineEvMap.get(key);
    if (bEv) {
      const changed = bEv.sha256 !== fEv.sha256;
      evidenceDrifts.push({
        evidenceType: fEv.type,
        source: fEv.source || 'unknown',
        baselineHash: bEv.sha256,
        followupHash: fEv.sha256,
        changed,
        baselineSnippet: typeof bEv.rawValue === 'string' ? bEv.rawValue.substring(0, 80) : undefined,
        followupSnippet: typeof fEv.rawValue === 'string' ? fEv.rawValue.substring(0, 80) : undefined
      });
    }
  }

  // 5. Compute drift score
  let driftScore = 0;
  for (const res of resolvedFindings) {
    if (res.severity === 'CRITICAL') driftScore += 40;
    else if (res.severity === 'HIGH') driftScore += 25;
    else if (res.severity === 'MEDIUM') driftScore += 15;
    else driftScore += 10;
  }

  for (const reg of regressionFindings) {
    if (reg.severity === 'CRITICAL') driftScore -= 50;
    else if (reg.severity === 'HIGH') driftScore -= 30;
    else if (reg.severity === 'MEDIUM') driftScore -= 20;
    else driftScore -= 10;
  }

  let status: 'SIGNIFICANT_IMPROVEMENT' | 'STABLE_OR_MAINTAINED' | 'REGRESSION_ALERT' = 'STABLE_OR_MAINTAINED';
  if (regressionFindings.length > 0 && driftScore < 0) {
    status = 'REGRESSION_ALERT';
  } else if (resolvedFindings.length > 0 && driftScore > 0) {
    status = 'SIGNIFICANT_IMPROVEMENT';
  }

  const summaryNL = status === 'SIGNIFICANT_IMPROVEMENT'
    ? `Uitstekend: ${resolvedFindings.length} beveiligingsbevinding(en) zijn succesvol opgelost sinds de nulmeting. Uw digitale weerbaarheid is wiskundig aangetoond verhoogd.`
    : status === 'REGRESSION_ALERT'
    ? `Let op: er zijn ${regressionFindings.length} nieuwe potentiële risico's opgetreden sinds de vorige controle. Direct ingrijpen aanbevolen.`
    : `De beveiligingspostuur van ${targetDomain} is stabiel gebleven ten opzichte van de vorige controle.`;

  const receiptHtml = `
    <div style="font-family: sans-serif; border: 2px solid ${status === 'SIGNIFICANT_IMPROVEMENT' ? '#10b981' : '#f59e0b'}; padding: 1.5rem; border-radius: 8px; background: #0b1222; color: #fff;">
      <h2 style="color: ${status === 'SIGNIFICANT_IMPROVEMENT' ? '#10b981' : '#f59e0b'}; margin-top: 0;">REMEDIATION VERIFICATION RECEIPT</h2>
      <p><strong>Domein:</strong> ${targetDomain} | <strong>Status:</strong> ${status}</p>
      <p><strong>Nulmeting:</strong> ${baseline.runId} (${baseline.timestamp})<br><strong>Hercontrole:</strong> ${followup.runId} (${followup.timestamp})</p>
      <hr style="border: 1px solid #1e293b;">
      <h3>Opgeloste Punten (${resolvedFindings.length}):</h3>
      <ul>
        ${resolvedFindings.map(f => `<li><strong>${f.title || f.ruleId}</strong>: ${f.description || f.whyItMatters || 'Opgelost'}</li>`).join('')}
      </ul>
      <p style="font-size: 0.85rem; color: #94a3b8;">Geverifieerd via ARGUS Continuous Drift Engine & AUX Design.</p>
    </div>
  `;

  return {
    targetDomain,
    baselineRunId: baseline.runId,
    followupRunId: followup.runId,
    baselineTimestamp: baseline.timestamp,
    followupTimestamp: followup.timestamp,
    resolvedFindings,
    regressionFindings,
    persistingFindings,
    evidenceDrifts,
    driftScore,
    status,
    summaryNL,
    remediationReceiptHtml: receiptHtml
  };
}
