import { hashValue } from './crypto.js';
export function observationToEvidence(observation, normalizeFn, confidence = 'VERIFIED') {
    const normalizedValue = normalizeFn(observation.rawValue);
    return {
        id: `evd_${hashValue(observation.id + Date.now().toString()).slice(0, 12)}`,
        targetId: observation.targetId,
        runId: observation.runId,
        type: observation.type,
        source: observation.source,
        collector: observation.collector,
        collectorVersion: observation.collectorVersion,
        observedAt: observation.observedAt,
        rawValue: observation.rawValue,
        normalizedValue,
        confidence,
        sha256: hashValue(observation.rawValue)
    };
}
export function evaluateRules(evidence, rules) {
    const findings = [];
    for (const rule of rules) {
        findings.push(...rule.evaluate(evidence));
    }
    return findings;
}
export function mapToOpportunities(findings, mapper) {
    return mapper.map(findings);
}
//# sourceMappingURL=engine.js.map