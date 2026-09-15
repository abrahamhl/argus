#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inspectPublicTarget, runRules, mapFindingsToOpportunities, saveBundle, loadBundle, createBundle, compareRuns } from '@argus/core';

async function assess(url: string) {
  if (!url) throw new Error('Missing target URL');
  console.log(`[ARGUS] Assessing ${url}...`);
  const result = await inspectPublicTarget(url, {
    evaluateFindings: async (evidence) => runRules(evidence),
    mapOpportunities: async (findings) => mapFindingsToOpportunities(findings)
  });
  const bundle = createBundle(result);
  const filename = `argus-${bundle.target.hostname}-${Date.now()}.argusbundle`;
  saveBundle(bundle, filename);
  console.log(`[ARGUS] Assessment complete. Saved to ${filename}`);
}

function inspect(bundlePath: string) {
  if (!bundlePath) throw new Error('Missing bundle path');
  const bundle = loadBundle(bundlePath);
  console.log(`[ARGUS] BUNDLE: ${bundle.bundleHash}`);
  console.log(`Target: ${bundle.target.hostname}`);
  console.log(`Run ID: ${bundle.run.id}`);
  console.log(`Date: ${bundle.run.timestamp}`);
  console.log(`Findings: ${bundle.findings.length}`);
  for (const f of bundle.findings) {
    console.log(`  - [${f.severity}] ${f.title}`);
  }
}

async function retest(bundlePath: string, url: string) {
  if (!bundlePath) throw new Error('Missing bundle path');
  if (!url) throw new Error('Missing target URL');
  
  console.log(`[ARGUS] Retesting ${url} against baseline ${bundlePath}...`);
  const baseline = loadBundle(bundlePath);
  
  const result = await inspectPublicTarget(url, {
    evaluateFindings: async (evidence) => runRules(evidence),
    mapOpportunities: async (findings) => mapFindingsToOpportunities(findings)
  });
  
  const retestBundle = createBundle(result);
  retestBundle.proofs = compareRuns(baseline, retestBundle);
  
  const filename = `argus-retest-${retestBundle.target.hostname}-${Date.now()}.argusbundle`;
  saveBundle(retestBundle, filename);
  
  console.log(`[ARGUS] Retest complete. Saved to ${filename}`);
  console.log(`\nPROOFS:`);
  for (const p of retestBundle.proofs) {
    console.log(`  - ${p.originalFindingId} -> ${p.status}`);
  }
}

function verify(bundlePath: string) {
  if (!bundlePath) throw new Error('Missing bundle path');
  try {
    const bundle = loadBundle(bundlePath);
    console.log(`[ARGUS] VERIFIED: Bundle ${bundlePath} is cryptographically valid.`);
    console.log(`Hash: ${bundle.bundleHash}`);
  } catch (err: any) {
    console.error(`[ARGUS] INTEGRITY FAILURE: ${err.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`ARGUS Deterministic CLI
  
Usage:
  argus assess <url>             Run inspection and generate an .argusbundle
  argus inspect <bundle>         Read and print bundle contents
  argus retest <bundle> <url>    Run a new inspection against a baseline bundle
  argus verify <bundle>          Verify cryptographic integrity of a bundle
  argus help                     Print this help message
  `);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  try {
    switch (cmd) {
      case 'assess':
        await assess(args[1]);
        break;
      case 'inspect':
        inspect(args[1]);
        break;
      case 'retest':
        await retest(args[1], args[2]);
        break;
      case 'verify':
        verify(args[1]);
        break;
      case 'help':
      default:
        printHelp();
        break;
    }
  } catch (err: any) {
    console.error(`\n[ERROR] ${err.message}`);
    process.exit(1);
  }
}

main();
