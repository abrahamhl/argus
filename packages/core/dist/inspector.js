import { TargetPolicy } from './policy.js';
import { hashValue } from './crypto.js';
import { URL } from 'node:url';
/**
 * Main inspection function for public targets.
 * Validates target, collects observations, and produces evidence.
 *
 * For V0.1, this implements PASSIVE_ONLY inspection which enforces PUBLIC_PASSIVE mode.
 */
export async function inspectPublicTarget(target, options = {}) {
    const startTime = new Date().toISOString();
    const runId = `run_${hashValue(target + startTime).slice(0, 16)}`;
    const targetId = `tgt_${hashValue(target).slice(0, 12)}`;
    // Initialize policy
    const policy = new TargetPolicy({
        mode: options.mode || 'PUBLIC_PASSIVE',
        sensitiveCategory: options.sensitiveCategory
    });
    // Validate target
    const validation = await policy.validate(target);
    if (!validation.allowed) {
        throw new Error(`Target validation failed: ${validation.reason}`);
    }
    const run = {
        id: runId,
        targetId,
        timestamp: startTime,
        argusVersion: '0.1.0',
        os: process.platform,
        status: 'STARTED'
    };
    const observations = [];
    const evidence = [];
    try {
        // Extract domain for DNS collection
        const url = new URL(target);
        const domain = url.hostname;
        // Collect DNS if enabled (default: true)
        if (options.collectDns !== false) {
            const { collectDns } = await import('@argus/collectors');
            const dnsObs = await collectDns(domain, runId, targetId);
            observations.push(...dnsObs);
        }
        // Collect HTTP if enabled (default: true)
        if (options.collectHttp !== false) {
            const { collectHttp } = await import('@argus/collectors');
            // Create redirect validator that uses the policy
            const validateRedirect = async (redirectUrl) => {
                const result = await policy.validate(redirectUrl);
                return result.allowed;
            };
            const httpResult = await collectHttp(target, runId, targetId, {
                validateRedirect
            });
            observations.push(...httpResult.observations);
        }
        // Convert observations to evidence
        for (const obs of observations) {
            const evd = {
                id: `evd_${hashValue(obs.id + obs.observedAt).slice(0, 12)}`,
                targetId: obs.targetId,
                runId: obs.runId,
                type: obs.type,
                source: obs.source,
                collector: obs.collector,
                collectorVersion: obs.collectorVersion,
                observedAt: obs.observedAt,
                rawValue: obs.rawValue,
                normalizedValue: obs.rawValue, // For V0.1, no normalization
                confidence: 'VERIFIED',
                sha256: hashValue(JSON.stringify(obs.rawValue))
            };
            evidence.push(evd);
        }
        run.status = 'COMPLETED';
    }
    catch (error) {
        run.status = 'FAILED';
        throw error;
    }
    const endTime = new Date().toISOString();
    return {
        target,
        policy: {
            mode: validation.mode,
            sensitiveCategory: validation.sensitiveCategory
        },
        observations,
        evidence,
        findings: [], // V0.1: No rules implemented yet
        opportunities: [], // V0.1: No opportunity mapping yet
        timestamps: {
            started: startTime,
            completed: endTime
        },
        run
    };
}
//# sourceMappingURL=inspector.js.map