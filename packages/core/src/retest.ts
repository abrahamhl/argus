import { ArgusBundle, Proof, ProofStatus } from '@argus/schema';
import { hashValue } from './crypto.js';

const SEVERITY_ORDER: Record<string, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

export function compareRuns(
  baseline: ArgusBundle,
  retest: ArgusBundle
): Proof[] {
  if (baseline.target.hostname !== retest.target.hostname) {
    throw new Error(
      `Target mismatch: baseline=${baseline.target.hostname}, retest=${retest.target.hostname}`
    );
  }

  const baselineFindings = new Map(baseline.findings.map(f => [f.ruleId, f]));
  const retestFindings = new Map(retest.findings.map(f => [f.ruleId, f]));

  const proofs: Proof[] = [];
  const allRuleIds = new Set([...baselineFindings.keys(), ...retestFindings.keys()]);

  for (const ruleId of allRuleIds) {
    const fBase = baselineFindings.get(ruleId);
    const fRetest = retestFindings.get(ruleId);

    // Only generate proof if the finding existed in baseline
    if (!fBase) continue;

    let status: ProofStatus = 'UNKNOWN';
    let comparisonNote = '';

    // Check if retest has relevant evidence for this rule's collector
    const relevantCollectorTypes = fBase.ruleId.startsWith('rule-dns')
      ? ['DNS', 'DNS_TXT', 'DNS_DMARC', 'DNS_CAA', 'DNS_MX']
      : ['HTTP_RESPONSE', 'TLS'];

    const relevantRetestEvidence = retest.evidence.filter(e =>
      relevantCollectorTypes.some(t => e.type.startsWith(t))
    );

    const hasRelevantEvidence = relevantRetestEvidence.length > 0;

    if (!fRetest) {
      if (hasRelevantEvidence) {
        status = 'RESOLVED';
        comparisonNote = `The issue identified by rule ${ruleId} was not detected in the retest and relevant verification evidence was observed.`;
      } else {
        status = 'UNVERIFIED';
        comparisonNote = `Finding absent in retest, but no corresponding collector evidence was observed to verify resolution.`;
      }
    } else {
      const baseSev = SEVERITY_ORDER[fBase.severity] ?? 2;
      const retestSev = SEVERITY_ORDER[fRetest.severity] ?? 2;

      if (retestSev < baseSev) {
        status = 'IMPROVED';
        comparisonNote = `Finding severity decreased from ${fBase.severity} to ${fRetest.severity}.`;
      } else if (retestSev > baseSev) {
        status = 'REGRESSED';
        comparisonNote = `Finding severity worsened from ${fBase.severity} to ${fRetest.severity}.`;
      } else {
        status = 'UNCHANGED';
        comparisonNote = `Finding persisted with unchanged severity (${fBase.severity}).`;
      }
    }

    const beforeEvidenceIds = fBase.evidenceIds || [];
    const afterEvidenceIds = fRetest
      ? (fRetest.evidenceIds || [])
      : relevantRetestEvidence.map(e => e.id);

    const proofId = `prf_${hashValue(fBase.id + retest.run.id).slice(0, 12)}`;

    proofs.push({
      id: proofId,
      targetId: baseline.target.hostname,
      retestRunId: retest.run.id,
      baselineRunId: baseline.run.id,
      originalFindingId: fBase.id,
      status,
      beforeEvidenceIds,
      afterEvidenceIds,
      comparisonNote
    });
  }

  return proofs;
}
