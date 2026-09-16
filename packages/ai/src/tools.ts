import { ToolDefinition } from './provider.js';
import { inspectPublicTarget, runRules, mapFindingsToOpportunities, saveBundle, loadBundle, createBundle, compareRuns } from '@argus/core';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { ArgusBundle } from '@argus/schema';

// Tools definitions
export const argusTools: ToolDefinition[] = [
  {
    name: 'argus_assess',
    description: 'Run a full assessment on a target URL and save the bundle.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The target URL to assess.' }
      },
      required: ['url']
    }
  },
  {
    name: 'argus_collect_http',
    description: 'Collect HTTP metadata for a target URL (returns evidence).',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      },
      required: ['url']
    }
  },
  {
    name: 'argus_collect_dns',
    description: 'Collect DNS metadata for a target hostname (returns evidence).',
    parameters: {
      type: 'object',
      properties: {
        hostname: { type: 'string' }
      },
      required: ['hostname']
    }
  },
  {
    name: 'argus_get_run',
    description: 'Get run details and target from a bundle.',
    parameters: {
      type: 'object',
      properties: {
        bundleName: { type: 'string', description: 'Filename of the bundle.' }
      },
      required: ['bundleName']
    }
  },
  {
    name: 'argus_get_findings',
    description: 'Get findings from a bundle.',
    parameters: {
      type: 'object',
      properties: {
        bundleName: { type: 'string' }
      },
      required: ['bundleName']
    }
  },
  {
    name: 'argus_verify_bundle',
    description: 'Verify cryptographic integrity of a bundle.',
    parameters: {
      type: 'object',
      properties: {
        bundleName: { type: 'string' }
      },
      required: ['bundleName']
    }
  },
  {
    name: 'argus_compare_runs',
    description: 'Compare two bundles and generate proofs of changes.',
    parameters: {
      type: 'object',
      properties: {
        baselineBundle: { type: 'string' },
        retestBundle: { type: 'string' }
      },
      required: ['baselineBundle', 'retestBundle']
    }
  }
];

// In-memory cache to prevent filesystem injection and restrict paths
const SAFE_DIR = resolve(process.cwd(), 'fixtures/demo');
if (!existsSync(SAFE_DIR)) {
  mkdirSync(SAFE_DIR, { recursive: true });
}

function resolveBundlePath(bundleName: string): string {
  // Prevent directory traversal
  const safeName = bundleName.replace(/[^a-zA-Z0-9.\-_]/g, '');
  if (!safeName.endsWith('.argusbundle')) {
    throw new Error('Invalid bundle extension. Must be .argusbundle');
  }
  return resolve(SAFE_DIR, safeName);
}

import { collectHttp, collectDns } from '@argus/collectors';
import { observationToEvidence, PolicyEngine } from '@argus/core';

const policyEngine = new PolicyEngine();

// Tool Executors
export const argusToolExecutors: Record<string, (args: any) => Promise<any>> = {
  argus_assess: async (args: { url: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_assess', args, { url: { type: 'string', required: true, maxLength: 2048 } });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    const valTarget = await policyEngine.validateTarget(args.url);
    if (!valTarget.allowed) throw new Error(valTarget.reason);

    const result = await inspectPublicTarget(args.url, {
      evaluateFindings: async (evidence) => runRules(evidence),
      mapOpportunities: async (findings) => mapFindingsToOpportunities(findings)
    });
    const bundle = createBundle(result);
    const filename = `argus-${bundle.target.hostname}-${Date.now()}.argusbundle`;
    saveBundle(bundle, resolveBundlePath(filename));
    return { bundleName: filename, target: bundle.target.hostname };
  },
  
  argus_collect_http: async (args: { url: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_collect_http', args, { url: { type: 'string', required: true, maxLength: 2048 } });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    const valTarget = await policyEngine.validateTarget(args.url);
    if (!valTarget.allowed) throw new Error(valTarget.reason);

    const obs = await collectHttp(args.url, 'run_tool', 'target_tool', {
      validateRedirect: async (nextUrl, hop) => {
        const val = await policyEngine.validateRedirectHop(nextUrl, hop);
        if (!val.allowed) throw new Error(val.reason);
      }
    });
    const ev = obs.map((o: any) => observationToEvidence(o, x => x));
    return ev;
  },
  
  argus_collect_dns: async (args: { hostname: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_collect_dns', args, { hostname: { type: 'string', required: true, maxLength: 253 } });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    // Validate hostname as a URL target to ensure it is not an IP or blocked
    const valTarget = await policyEngine.validateTarget(`http://${args.hostname}`);
    if (!valTarget.allowed) throw new Error(valTarget.reason);

    const obs = await collectDns(args.hostname, 'run_tool', 'target_tool');
    return obs.map((o: any) => observationToEvidence(o, x => x));
  },
  
  argus_get_run: async (args: { bundleName: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_get_run', args, { bundleName: { type: 'string', required: true, maxLength: 255 } });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    const valBundle = policyEngine.validateBundleName(args.bundleName);
    if (!valBundle.allowed) throw new Error(valBundle.reason);

    const path = resolveBundlePath(args.bundleName);
    const bundle = loadBundle(path);
    return { target: bundle.target, run: bundle.run, bundleHash: bundle.bundleHash };
  },
  
  argus_get_findings: async (args: { bundleName: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_get_findings', args, { bundleName: { type: 'string', required: true, maxLength: 255 } });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    const valBundle = policyEngine.validateBundleName(args.bundleName);
    if (!valBundle.allowed) throw new Error(valBundle.reason);

    const path = resolveBundlePath(args.bundleName);
    const bundle = loadBundle(path);
    return bundle.findings;
  },
  
  argus_verify_bundle: async (args: { bundleName: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_verify_bundle', args, { bundleName: { type: 'string', required: true, maxLength: 255 } });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    const valBundle = policyEngine.validateBundleName(args.bundleName);
    if (!valBundle.allowed) throw new Error(valBundle.reason);

    try {
      const path = resolveBundlePath(args.bundleName);
      loadBundle(path); // loadBundle inherently verifies
      return { verified: true, message: 'Cryptographically valid.' };
    } catch (err: any) {
      return { verified: false, message: err.message };
    }
  },
  
  argus_compare_runs: async (args: { baselineBundle: string, retestBundle: string }) => {
    const valArgs = policyEngine.validateToolArguments('argus_compare_runs', args, { 
      baselineBundle: { type: 'string', required: true, maxLength: 255 },
      retestBundle: { type: 'string', required: true, maxLength: 255 } 
    });
    if (!valArgs.allowed) throw new Error(valArgs.reason);

    const valBaseline = policyEngine.validateBundleName(args.baselineBundle);
    if (!valBaseline.allowed) throw new Error(valBaseline.reason);

    const valRetest = policyEngine.validateBundleName(args.retestBundle);
    if (!valRetest.allowed) throw new Error(valRetest.reason);

    const baseline = loadBundle(resolveBundlePath(args.baselineBundle));
    const retest = loadBundle(resolveBundlePath(args.retestBundle));
    const proofs = compareRuns(baseline, retest);
    return proofs;
  }
};
