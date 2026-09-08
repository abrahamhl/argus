export type InspectionMode = 'PUBLIC_PASSIVE' | 'PASSIVE_ONLY';
export type SensitiveCategory = 'GOVERNMENT' | 'POLICE' | 'MILITARY' | 'DEFENSE' | 'LAW_ENFORCEMENT' | 'CRITICAL_INFRASTRUCTURE';
export interface TargetPolicyResult {
    allowed: boolean;
    reason?: string;
    mode: InspectionMode;
    sensitiveCategory?: SensitiveCategory;
}
export interface PolicyOptions {
    mode?: InspectionMode;
    sensitiveCategory?: SensitiveCategory;
}
export declare class TargetPolicy {
    private mode;
    private sensitiveCategory?;
    constructor(options?: PolicyOptions);
    /**
     * Validates a target URL before any collection activity.
     * Rejects unsafe protocols, embedded credentials, localhost, private IPs, and malformed targets.
     */
    validate(target: string): Promise<TargetPolicyResult>;
    private isLocalhost;
    private validateIP;
    private isIPv4;
    private isIPv6;
    private validateIPv4;
    private validateIPv6;
}
//# sourceMappingURL=policy.d.ts.map