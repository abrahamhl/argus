import * as readline from 'node:readline/promises';
import { collectHttp } from '@argus/collectors';
import { observationToEvidence, hashValue } from '@argus/core';
// Correlation Rules
function evaluateSecurityHeaders(evidenceList) {
    const findings = [];
    for (const ev of evidenceList) {
        if (ev.type === 'HTTP_RESPONSE') {
            const headers = ev.normalizedValue.headers;
            if (!headers['strict-transport-security']) {
                findings.push({
                    id: `fnd_${hashValue('hsts_missing' + ev.id).slice(0, 12)}`,
                    targetId: ev.targetId,
                    runId: ev.runId,
                    title: 'Missing HSTS Header',
                    description: 'The HTTP Strict-Transport-Security response header is missing.',
                    severity: 'MEDIUM',
                    confidence: 'VERIFIED',
                    evidenceIds: [ev.id]
                });
            }
        }
    }
    return findings;
}
// Opportunity Mapper
function mapFindingsToOpportunities(findings) {
    const opportunities = [];
    for (const f of findings) {
        if (f.title === 'Missing HSTS Header') {
            opportunities.push({
                id: `opp_${hashValue('hsts_opp' + f.id).slice(0, 12)}`,
                title: 'Verbeter de Website Beveiliging (HSTS)',
                supportingFindingIds: [f.id],
                confidence: f.confidence,
                businessArea: 'Trust & Privacy',
                technicalArea: 'HTTP Headers',
                serviceCategory: 'SECURITY_HARDENING',
                retestAvailable: true,
                needsClientAccess: true,
                estimatedComplexity: 'LOW',
                clientExplanationKey: 'hsts_missing_nl'
            });
        }
    }
    return opportunities;
}
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.clear();
    console.log('ARGUS');
    console.log('Evidence & Opportunity Control Plane');
    console.log('-----------------------------------------');
    console.log('[ NEW TARGET ]\n');
    const targetUrl = await rl.question('Enter Target URL (e.g., https://example.com): ');
    console.log('\n> PUBLIC INSPECTION STARTED...');
    const runId = `run_${Date.now()}`;
    const targetId = `tgt_${hashValue(targetUrl).slice(0, 12)}`;
    console.log('> COLLECTING HTTP SIGNALS...');
    const observations = await collectHttp(targetUrl, runId, targetId);
    console.log('> NORMALIZING TO EVIDENCE...');
    const evidenceList = observations.map(obs => observationToEvidence(obs, (raw) => raw) // identity normalize for now
    );
    console.log('> CORRELATING FINDINGS...');
    const findings = evaluateSecurityHeaders(evidenceList);
    console.log('> MAPPING TO COMMERCIAL OPPORTUNITIES...');
    const opportunities = mapFindingsToOpportunities(findings);
    console.log('\n=========================================');
    console.log('                 RESULTS                 ');
    console.log('=========================================');
    console.log(`OBSERVATIONS:  ${observations.length}`);
    console.log(`EVIDENCE:      ${evidenceList.length}`);
    console.log(`FINDINGS:      ${findings.length}`);
    console.log(`OPPORTUNITIES: ${opportunities.length}`);
    console.log('\n--- OPPORTUNITIES ---');
    if (opportunities.length === 0) {
        console.log('No actionable opportunities found.');
    }
    else {
        opportunities.forEach(opp => {
            console.log(`\n[ OPPORTUNITY ] ${opp.title}`);
            console.log(`Category:       ${opp.serviceCategory}`);
            console.log(`Complexity:     ${opp.estimatedComplexity}`);
            console.log(`Business Value: ${opp.businessArea}`);
        });
    }
    console.log('\n-----------------------------------------');
    console.log('ARGUS RUN COMPLETED. (Type /help for commands)');
    rl.close();
}
main().catch(console.error);
//# sourceMappingURL=index.js.map