import { ArgusBundle, Proof } from '@argus/schema';
import { hashValue } from './crypto.js';

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

    let status: Proof['status'] = 'UNKNOWN';
    if (!fRetest) {
      status = 'RESOLVED';
    } else {
      // It still exists. Has the evidence worsened? 
      // For now, if it's identical ruleId, we consider it UNCHANGED or REGRESSED based on severity.
      // But standard Argus deterministic rules are binary (missing/present). 
      // If it exists in retest, it's UNCHANGED.
      status = 'UNCHANGED';
    }

    const beforeEvidenceIds = fBase.evidenceIds || [];
    const afterEvidenceIds = fRetest?.evidenceIds || [];

    const proofId = `prf_${hashValue(fBase.id + retest.run.id).slice(0, 12)}`;

    proofs.push({
      id: proofId,
      targetId: baseline.target.hostname,
      retestRunId: retest.run.id,
      baselineRunId: baseline.run.id,
      originalFindingId: fBase.id,
      status,
      beforeEvidenceIds,
      afterEvidenceIds
    });
  }

  return proofs;
}
