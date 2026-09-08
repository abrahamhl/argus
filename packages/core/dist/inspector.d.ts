import { Observation, Evidence, Finding, Opportunity, Run } from '@argus/schema';
import { InspectionMode, SensitiveCategory } from './policy.js';
export interface InspectionOptions {
    mode?: InspectionMode;
    sensitiveCategory?: SensitiveCategory;
    collectHttp?: boolean;
    collectDns?: boolean;
}
export interface InspectionResult {
    target: string;
    policy: {
        mode: InspectionMode;
        sensitiveCategory?: SensitiveCategory;
    };
    observations: Observation[];
    evidence: Evidence[];
    findings: Finding[];
    opportunities: Opportunity[];
    timestamps: {
        started: string;
        completed: string;
    };
    run: Run;
}
/**
 * Main inspection function for public targets.
 * Validates target, collects observations, and produces evidence.
 *
 * For V0.1, this implements PASSIVE_ONLY inspection which enforces PUBLIC_PASSIVE mode.
 */
export declare function inspectPublicTarget(target: string, options?: InspectionOptions): Promise<InspectionResult>;
//# sourceMappingURL=inspector.d.ts.map