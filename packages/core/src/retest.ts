/**
 * Retest Comparison Model
 *
 * Compares two inspection runs to determine what changed.
 * NO FAKE SCORES. NO SECURITY CERTIFICATES.
 */

import type { InspectionResultV1, Finding } from '@argus/schema';

export type ChangeStatus = 'IMPROVED' | 'UNCHANGED' | 'REGRESSED' | 'INDETERMINATE';

export interface FindingChange {
  findingId: string;
  title: string;
  severity: string;
  status: 'RESOLVED' | 'NEW' | 'UNCHANGED';
  baselinePresent: boolean;
  retestPresent: boolean;
}

export interface EvidenceChange {
  type: string;
  status: 'ADDED' | 'REMOVED' | 'UNCHANGED';
  count: number;
}

export interface RetestComparisonV1 {
  schemaVersion: string;
  comparisonId: string;

  baseline: {
    runId: string;
    date: string;
    findingsCount: number;
  };

  retest: {
    runId: string;
    date: string;
    findingsCount: number;
  };

  findingChanges: {
    resolved: FindingChange[];
    new: FindingChange[];
    unchanged: FindingChange[];
  };

  evidenceChanges: EvidenceChange[];

  overallChange: ChangeStatus;

  summary: {
    resolvedCount: number;
    newCount: number;
    unchangedCount: number;
    netChange: number;
  };
}

/**
 * Compares two inspection runs and determines what changed.
 *
 * CRITICAL RULES:
 * - NO invented security scores
 * - NO "certificate of security"
 * - NO breach probability
 * - Report EXACTLY what changed, nothing more
 */
export function compareInspectionRuns(
  baseline: InspectionResultV1,
  retest: InspectionResultV1
): RetestComparisonV1 {
  // Ensure both are from same target
  if (baseline.target.hostname !== retest.target.hostname) {
    throw new Error(
      `Target mismatch: baseline=${baseline.target.hostname}, retest=${retest.target.hostname}`
    );
  }

  // Map findings by their stable identifier
  const baselineFindings = new Map(
    baseline.findings.map(f => [f.findingId, f])
  );
  const retestFindings = new Map(
    retest.findings.map(f => [f.findingId, f])
  );

  const resolved: FindingChange[] = [];
  const unchanged: FindingChange[] = [];
  const newFindings: FindingChange[] = [];

  // Check what was resolved
  for (const [findingId, finding] of baselineFindings) {
    if (!retestFindings.has(findingId)) {
      resolved.push({
        findingId,
        title: finding.title,
        severity: finding.severity,
        status: 'RESOLVED',
        baselinePresent: true,
        retestPresent: false
      });
    } else {
      unchanged.push({
        findingId,
        title: finding.title,
        severity: finding.severity,
        status: 'UNCHANGED',
        baselinePresent: true,
        retestPresent: true
      });
    }
  }

  // Check for new findings
  for (const [findingId, finding] of retestFindings) {
    if (!baselineFindings.has(findingId)) {
      newFindings.push({
        findingId,
        title: finding.title,
        severity: finding.severity,
        status: 'NEW',
        baselinePresent: false,
        retestPresent: true
      });
    }
  }

  // Compare evidence changes
  const evidenceChanges = compareEvidence(baseline, retest);

  // Determine overall change
  const overallChange = determineOverallChange(
    resolved.length,
    newFindings.length,
    unchanged.length
  );

  return {
    schemaVersion: '1.0.0',
    comparisonId: `cmp_${baseline.runId}_${retest.runId}`,
    baseline: {
      runId: baseline.runId,
      date: baseline.status.startedAt,
      findingsCount: baseline.findings.length
    },
    retest: {
      runId: retest.runId,
      date: retest.status.startedAt,
      findingsCount: retest.findings.length
    },
    findingChanges: {
      resolved,
      new: newFindings,
      unchanged
    },
    evidenceChanges,
    overallChange,
    summary: {
      resolvedCount: resolved.length,
      newCount: newFindings.length,
      unchangedCount: unchanged.length,
      netChange: newFindings.length - resolved.length
    }
  };
}

function compareEvidence(
  baseline: InspectionResultV1,
  retest: InspectionResultV1
): EvidenceChange[] {
  const baselineTypes = new Map<string, number>();
  const retestTypes = new Map<string, number>();

  baseline.evidence.forEach(e => {
    baselineTypes.set(e.type, (baselineTypes.get(e.type) || 0) + 1);
  });

  retest.evidence.forEach(e => {
    retestTypes.set(e.type, (retestTypes.get(e.type) || 0) + 1);
  });

  const changes: EvidenceChange[] = [];
  const allTypes = new Set([...baselineTypes.keys(), ...retestTypes.keys()]);

  for (const type of allTypes) {
    const baseCount = baselineTypes.get(type) || 0;
    const retestCount = retestTypes.get(type) || 0;

    if (baseCount === 0 && retestCount > 0) {
      changes.push({ type, status: 'ADDED', count: retestCount });
    } else if (baseCount > 0 && retestCount === 0) {
      changes.push({ type, status: 'REMOVED', count: baseCount });
    } else if (baseCount === retestCount) {
      changes.push({ type, status: 'UNCHANGED', count: baseCount });
    } else {
      // Count changed but type still present
      changes.push({
        type,
        status: retestCount > baseCount ? 'ADDED' : 'REMOVED',
        count: Math.abs(retestCount - baseCount)
      });
    }
  }

  return changes;
}

function determineOverallChange(
  resolved: number,
  newFindings: number,
  unchanged: number
): ChangeStatus {
  // If nothing changed at all
  if (resolved === 0 && newFindings === 0) {
    return 'UNCHANGED';
  }

  // If findings were resolved and no new ones appeared
  if (resolved > 0 && newFindings === 0) {
    return 'IMPROVED';
  }

  // If new findings appeared and nothing was resolved
  if (newFindings > 0 && resolved === 0) {
    return 'REGRESSED';
  }

  // Mixed: some resolved, some new
  if (resolved > 0 && newFindings > 0) {
    // Net improvement if more resolved than new
    if (resolved > newFindings) {
      return 'IMPROVED';
    }
    // Net regression if more new than resolved
    if (newFindings > resolved) {
      return 'REGRESSED';
    }
    // Equal trade-off
    return 'INDETERMINATE';
  }

  return 'INDETERMINATE';
}
