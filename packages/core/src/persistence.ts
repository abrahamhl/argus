/**
 * ARGUS Local Persistence Layer
 *
 * Implements offline-first storage of runs, targets, evidence, findings, and reports
 * in a local directory (`.argus_data/`).
 *
 * Guarantees:
 * - Strict offline-first: Zero database servers, zero network calls.
 * - Path traversal protection: Strict validation of IDs and hostnames.
 * - Atomic-like writes: Complete write before updating target indices.
 * - Full export & retention capabilities.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import type { ArgusBundle, InspectionResultV1 } from '@argus/schema';
import { createBundle, loadBundle, saveBundle } from './bundle.js';
import { hashValue } from './crypto.js';
import { generateClientReport, generateEngineerReport, generateReportJson } from './report-generator.js';

const DEFAULT_DATA_DIR = '.argus_data';

export function resolveDataDir(overrideDir?: string): string {
  const dir = overrideDir || process.env.ARGUS_DATA_DIR || DEFAULT_DATA_DIR;
  return resolve(process.cwd(), dir);
}

function sanitizeId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID: ID must be a non-empty string');
  }
  // Allow only alphanumeric, dashes, underscores, and dots
  const sanitized = id.replace(/[^a-zA-Z0-9_.-]/g, '_');
  if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
    throw new Error(`Directory traversal attempt detected in ID: "${id}"`);
  }
  return sanitized;
}

function isArgusBundle(input: any): input is ArgusBundle {
  return Boolean(input && typeof input === 'object' && 'run' in input && typeof input.run === 'object');
}

export interface RunSummary {
  runId: string;
  target: string;
  timestamp: string;
  durationMs: number;
  findingCount: number;
  opportunityCount: number;
  proofCount: number;
  bundleHash: string;
}

/**
 * Saves inspection or bundle data to the local persistent store.
 */
export async function saveRunData(
  input: InspectionResultV1 | ArgusBundle,
  dataDir?: string
): Promise<{ runId: string; runPath: string }> {
  const baseDir = resolveDataDir(dataDir);
  const bundle: ArgusBundle = isArgusBundle(input)
    ? { ...input }
    : createBundle(input);

  if (!bundle.bundleHash) {
    bundle.bundleHash = hashValue(bundle);
  }

  const runId = sanitizeId(bundle.run.id);
  const hostname = sanitizeId(bundle.target.hostname || 'unknown');

  const runsDir = join(baseDir, 'runs', runId);
  const targetsDir = join(baseDir, 'targets', hostname);
  mkdirSync(runsDir, { recursive: true });
  mkdirSync(targetsDir, { recursive: true });

  // 1. Save canonical bundle
  const bundlePath = join(runsDir, 'bundle.json');
  saveBundle(bundle, bundlePath);

  // 2. Save individual artifacts for quick read access
  writeFileSync(join(runsDir, 'evidence.json'), JSON.stringify(bundle.evidence, null, 2), 'utf-8');
  writeFileSync(join(runsDir, 'findings.json'), JSON.stringify(bundle.findings, null, 2), 'utf-8');
  writeFileSync(join(runsDir, 'opportunities.json'), JSON.stringify(bundle.opportunities, null, 2), 'utf-8');
  if (bundle.proofs && bundle.proofs.length > 0) {
    writeFileSync(join(runsDir, 'proofs.json'), JSON.stringify(bundle.proofs, null, 2), 'utf-8');
  }

  // 3. Generate and store pre-rendered HTML and JSON reports
  const clientHtml = generateClientReport(bundle, { language: 'nl' });
  const engineerHtml = generateEngineerReport(bundle);
  const reportJson = generateReportJson(bundle, { pretty: true });

  writeFileSync(join(runsDir, 'report-client.html'), clientHtml, 'utf-8');
  writeFileSync(join(runsDir, 'report-engineer.html'), engineerHtml, 'utf-8');
  writeFileSync(join(runsDir, 'report.json'), reportJson, 'utf-8');

  // 4. Update Target Run Log
  const targetRunsLogPath = join(targetsDir, 'runs.json');
  let targetRuns: string[] = [];
  if (existsSync(targetRunsLogPath)) {
    try {
      targetRuns = JSON.parse(readFileSync(targetRunsLogPath, 'utf-8'));
    } catch {
      targetRuns = [];
    }
  }
  if (!targetRuns.includes(runId)) {
    targetRuns.push(runId);
    writeFileSync(targetRunsLogPath, JSON.stringify(targetRuns, null, 2), 'utf-8');
  }

  // 5. Update Global Index
  const indexPath = join(baseDir, 'index.json');
  let globalIndex: RunSummary[] = [];
  if (existsSync(indexPath)) {
    try {
      globalIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
    } catch {
      globalIndex = [];
    }
  }

  const summary: RunSummary = {
    runId,
    target: bundle.target.hostname,
    timestamp: bundle.run.timestamp,
    durationMs: bundle.run.durationMs,
    findingCount: bundle.findings.length,
    opportunityCount: bundle.opportunities.length,
    proofCount: bundle.proofs?.length || 0,
    bundleHash: bundle.bundleHash
  };

  // Replace or append
  const existingIdx = globalIndex.findIndex(s => s.runId === runId);
  if (existingIdx >= 0) {
    globalIndex[existingIdx] = summary;
  } else {
    globalIndex.push(summary);
  }

  writeFileSync(indexPath, JSON.stringify(globalIndex, null, 2), 'utf-8');

  return { runId, runPath: runsDir };
}

/**
 * Loads a bundle by Run ID from local persistence.
 */
export async function loadRunData(runId: string, dataDir?: string): Promise<ArgusBundle> {
  const safeId = sanitizeId(runId);
  const baseDir = resolveDataDir(dataDir);
  const bundlePath = join(baseDir, 'runs', safeId, 'bundle.json');

  if (!existsSync(bundlePath)) {
    throw new Error(`Run "${safeId}" not found in persistent store at ${bundlePath}`);
  }

  return loadBundle(bundlePath);
}

/**
 * Lists all runs stored locally.
 */
export async function listRuns(dataDir?: string): Promise<RunSummary[]> {
  const baseDir = resolveDataDir(dataDir);
  const indexPath = join(baseDir, 'index.json');

  if (!existsSync(indexPath)) {
    return [];
  }

  try {
    return JSON.parse(readFileSync(indexPath, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Lists all runs for a specific target.
 */
export async function listRunsForTarget(hostname: string, dataDir?: string): Promise<RunSummary[]> {
  const safeHost = sanitizeId(hostname);
  const all = await listRuns(dataDir);
  return all.filter(r => r.target === safeHost || r.target === hostname);
}

/**
 * Gets the most recent run bundle for a target (useful for baseline during retests).
 */
export async function getLatestRunForTarget(hostname: string, dataDir?: string): Promise<ArgusBundle | null> {
  const targetRuns = await listRunsForTarget(hostname, dataDir);
  if (targetRuns.length === 0) return null;

  // Sort by timestamp descending
  targetRuns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latest = targetRuns[0];
  return loadRunData(latest.runId, dataDir);
}

/**
 * Deletes a run from local persistence.
 */
export async function deleteRun(runId: string, dataDir?: string): Promise<boolean> {
  const safeId = sanitizeId(runId);
  const baseDir = resolveDataDir(dataDir);
  const runPath = join(baseDir, 'runs', safeId);

  if (!existsSync(runPath)) {
    return false;
  }

  rmSync(runPath, { recursive: true, force: true });

  // Update index
  const indexPath = join(baseDir, 'index.json');
  if (existsSync(indexPath)) {
    try {
      const globalIndex: RunSummary[] = JSON.parse(readFileSync(indexPath, 'utf-8'));
      const filtered = globalIndex.filter(s => s.runId !== safeId);
      writeFileSync(indexPath, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch {
      // Ignore index read errors
    }
  }

  return true;
}

/**
 * Exports a bundle from local persistence to an external file.
 */
export async function exportRunBundle(
  runId: string,
  destinationPath: string,
  dataDir?: string
): Promise<void> {
  const bundle = await loadRunData(runId, dataDir);
  saveBundle(bundle, destinationPath);
}
