import * as readline from 'node:readline/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inspectPublicTarget, observationToEvidence } from '@argus/core';
// @ts-ignore - The types will work after build
import { runRules, mapFindingsToOpportunities } from '@argus/core/dist/assessment.js';
function printFinding(f) {
    console.log(`FINDING`);
    console.log(`${f.title}`);
    console.log(`Confidence: ${f.confidence}`);
    console.log(`Severity: ${f.severity}`);
    console.log(`Evidence IDs: ${f.evidenceIds.join(', ')}\n`);
}
function printOpportunity(opp) {
    console.log(`OPPORTUNITY`);
    console.log(`${opp.title}`);
    console.log(`Complexity: ${opp.estimatedComplexity}`);
    console.log(`Business value: ${opp.businessArea}\n`);
    console.log(`REMEDIATION`);
    console.log(`Apply appropriate hardening\n`);
}
async function runDemo() {
    console.clear();
    console.log('ARGUS');
    console.log('Evidence & Opportunity Control Plane\n');
    console.log(`TARGET\ndemo-business.local\n`);
    const beforePath = resolve(process.cwd(), 'fixtures/demo/missing-hsts-before.json');
    const afterPath = resolve(process.cwd(), 'fixtures/demo/hsts-after.json');
    const beforeData = JSON.parse(readFileSync(beforePath, 'utf8'));
    const afterData = JSON.parse(readFileSync(afterPath, 'utf8'));
    // RUN A
    console.log('RUN A — BASELINE');
    const evBefore = observationToEvidence(beforeData.observations[0], (x) => x);
    const findingsA = runRules([evBefore]);
    const oppsA = mapFindingsToOpportunities(findingsA);
    console.log(`HTTP observed`);
    console.log(`Evidence generated`);
    if (findingsA.length > 0) {
        printFinding(findingsA[0]);
        if (oppsA.length > 0) {
            printOpportunity(oppsA[0]);
        }
    }
    // RUN B
    console.log('RUN B — RETEST');
    const evAfter = observationToEvidence(afterData.observations[0], (x) => x);
    const findingsB = runRules([evAfter]);
    console.log(`HTTP observed`);
    if (findingsB.length === 0) {
        console.log(`HSTS present\n`);
        console.log('PROOF');
        console.log('RESOLVED\n');
    }
    else {
        console.log('PROOF\nUNCHANGED');
    }
}
async function runLive() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.clear();
    console.log('ARGUS');
    console.log('Evidence & Opportunity Control Plane\n');
    const targetUrl = await rl.question('TARGET: ');
    console.log('\nRUN — LIVE INSPECTION');
    const result = await inspectPublicTarget(targetUrl, {
        evaluateFindings: async (evidence) => runRules(evidence),
        mapOpportunities: async (findings) => mapFindingsToOpportunities(findings)
    });
    console.log('EVIDENCE');
    result.evidence.forEach(ev => {
        console.log(`[+] ${ev.id}`);
    });
    console.log('\nFINDINGS');
    if (result.findings.length === 0)
        console.log('None detected.');
    result.findings.forEach((f) => printFinding(f));
    console.log('OPPORTUNITIES');
    if (result.opportunities.length === 0)
        console.log('None detected.');
    result.opportunities.forEach((o) => printOpportunity(o));
    rl.close();
}
async function main() {
    if (process.argv.includes('demo')) {
        await runDemo();
    }
    else {
        await runLive();
    }
}
main().catch(err => {
    console.error('\n[ERROR]', err.message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map