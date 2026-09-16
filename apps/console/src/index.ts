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

function verify(bundlePath: string, publicKeyPath?: string) {
  if (!bundlePath) throw new Error('Missing bundle path');
  try {
    const bundle = loadBundle(bundlePath);
    console.log(`[ARGUS] VERIFIED: Bundle ${bundlePath} is cryptographically valid (chain).`);
    console.log(`Hash: ${bundle.bundleHash}`);
    
    if (publicKeyPath) {
      const pubKey = readFileSync(publicKeyPath, 'utf-8');
      const { verifySignature, SignatureVerificationStatus } = require('@argus/core');
      const status = verifySignature(bundle, pubKey);
      console.log(`Signature Status: ${status}`);
    } else if (bundle.signature) {
      console.log(`[ARGUS] Bundle is signed, but no public key provided for verification.`);
    }
  } catch (err: any) {
    console.error(`[ARGUS] INTEGRITY FAILURE: ${err.message}`);
    process.exit(1);
  }
}

function sign(bundlePath: string, privateKeyPath: string, keyId?: string) {
  if (!bundlePath) throw new Error('Missing bundle path');
  if (!privateKeyPath) throw new Error('Missing private key path');
  
  const { signBundle } = require('@argus/core');
  const bundle = loadBundle(bundlePath);
  const privKey = readFileSync(privateKeyPath, 'utf-8');
  
  bundle.signature = signBundle(bundle, privKey, keyId);
  saveBundle(bundle, bundlePath);
  
  console.log(`[ARGUS] Bundle ${bundlePath} signed successfully.`);
}

function exportData(bundlePath: string, outPath: string) {
  if (!bundlePath) throw new Error('Missing bundle path');
  if (!outPath) throw new Error('Missing output path');
  
  const { exportBundle } = require('@argus/core');
  const bundle = loadBundle(bundlePath);
  const exported = exportBundle(bundle);
  
  saveBundle(exported, outPath);
  console.log(`[ARGUS] Exported redacted bundle to ${outPath}`);
}

function keygen(outPrefix: string) {
  if (!outPrefix) throw new Error('Missing output prefix (e.g. key)');
  const { generateSigningKeyPair } = require('@argus/core');
  const { publicKey, privateKey } = generateSigningKeyPair();
  writeFileSync(`${outPrefix}_pub.pem`, publicKey, 'utf-8');
  writeFileSync(`${outPrefix}_priv.pem`, privateKey, 'utf-8');
  console.log(`[ARGUS] Keypair generated: ${outPrefix}_pub.pem, ${outPrefix}_priv.pem`);
}

function printHelp() {
  console.log(`ARGUS Deterministic CLI
  
Usage:
  argus assess <url>                        Run inspection and generate an .argusbundle
  argus inspect <bundle>                    Read and print bundle contents
  argus retest <bundle> <url>               Run a new inspection against a baseline bundle
  argus verify <bundle> [public-key.pem]    Verify cryptographic integrity of a bundle
  argus sign <bundle> <private-key.pem>     Sign an existing bundle
  argus export <bundle> <out.argusbundle>   Export a redacted, safe-to-share bundle
  argus keygen <out-prefix>                 Generate Ed25519 keypair for signing
  argus analyze <objective>                 Run the AI Analyst to achieve an objective
  argus help                                Print this help message
  `);
}

async function analyze(objective: string) {
  if (!objective) throw new Error('Missing objective');
  console.log(`[ARGUS-AI] Initializing Analyst with objective: "${objective}"\n`);
  
  // Use dynamic import so @argus/ai is only loaded if requested
  const { ArgusAnalyst, OllamaProvider } = await import('@argus/ai');
  const provider = new OllamaProvider('llama3', process.env.OLLAMA_URL || 'http://127.0.0.1:11434');
  const analyst = new ArgusAnalyst({ provider });
  
  try {
    const result = await analyst.analyze(objective);
    console.log(`\n[ARGUS-AI SYNTHESIS]\n${result}\n`);
  } catch (err: any) {
    console.error(`\n[ARGUS-AI ERROR] ${err.message}`);
  }
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
        verify(args[1], args[2]);
        break;
      case 'sign':
        sign(args[1], args[2], args[3]);
        break;
      case 'export':
        exportData(args[1], args[2]);
        break;
      case 'keygen':
        keygen(args[1]);
        break;
      case 'analyze':
        await analyze(args.slice(1).join(' '));
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
