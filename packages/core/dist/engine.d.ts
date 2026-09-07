import { Observation, Evidence, Finding, Opportunity, Confidence } from '@argus/schema';
export declare function observationToEvidence(observation: Observation, normalizeFn: (raw: any) => any, confidence?: Confidence): Evidence;
export interface Rule {
    id: string;
    evaluate: (evidence: Evidence[]) => Finding[];
}
export declare function evaluateRules(evidence: Evidence[], rules: Rule[]): Finding[];
export interface OpportunityMapper {
    map: (findings: Finding[]) => Opportunity[];
}
export declare function mapToOpportunities(findings: Finding[], mapper: OpportunityMapper): Opportunity[];
//# sourceMappingURL=engine.d.ts.map