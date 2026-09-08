import { URL } from 'node:url';
import { lookup } from 'node:dns/promises';

export type InspectionMode =
  | 'PUBLIC_PASSIVE'
  | 'PASSIVE_ONLY';

export type SensitiveCategory =
  | 'GOVERNMENT'
  | 'POLICE'
  | 'MILITARY'
  | 'DEFENSE'
  | 'LAW_ENFORCEMENT'
  | 'CRITICAL_INFRASTRUCTURE';

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

export class TargetPolicy {
  private mode: InspectionMode;
  private sensitiveCategory?: SensitiveCategory;

  constructor(options: PolicyOptions = {}) {
    this.mode = options.mode || 'PUBLIC_PASSIVE';
    this.sensitiveCategory = options.sensitiveCategory;
  }

  /**
   * Validates a target URL before any collection activity.
   * FAIL CLOSED: DNS resolution MUST succeed and resolve to public IPs only.
   * Rejects unsafe protocols, embedded credentials, localhost, private IPs, and malformed targets.
   */
  async validate(target: string): Promise<TargetPolicyResult> {
    // Enforce PASSIVE_ONLY for sensitive categories
    let effectiveMode = this.mode;
    if (this.sensitiveCategory && this.mode !== 'PASSIVE_ONLY') {
      effectiveMode = 'PASSIVE_ONLY';
    }

    try {
      const url = new URL(target);

      // Check protocol
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return {
          allowed: false,
          reason: `Unsupported protocol: ${url.protocol}`,
          mode: effectiveMode,
          sensitiveCategory: this.sensitiveCategory
        };
      }

      // Check for embedded credentials
      if (url.username || url.password) {
        return {
          allowed: false,
          reason: 'URL credentials not allowed',
          mode: effectiveMode,
          sensitiveCategory: this.sensitiveCategory
        };
      }

      const hostname = url.hostname;

      // Check for localhost
      if (this.isLocalhost(hostname)) {
        return {
          allowed: false,
          reason: 'Localhost not allowed',
          mode: effectiveMode,
          sensitiveCategory: this.sensitiveCategory
        };
      }

      // Resolve DNS and validate IPs - FAIL CLOSED
      // DNS resolution MUST succeed and resolve to public IPs only
      try {
        const addresses = await lookup(hostname, { all: true });

        if (!addresses || addresses.length === 0) {
          return {
            allowed: false,
            reason: 'DNS resolution returned no addresses',
            mode: effectiveMode,
            sensitiveCategory: this.sensitiveCategory
          };
        }

        for (const addr of addresses) {
          const ipResult = this.validateIP(addr.address);
          if (!ipResult.allowed) {
            return {
              ...ipResult,
              mode: effectiveMode,
              sensitiveCategory: this.sensitiveCategory
            };
          }
        }
      } catch (error: any) {
        // FAIL CLOSED: DNS resolution failure blocks the inspection
        return {
          allowed: false,
          reason: `DNS resolution failed: ${error.code || error.message}`,
          mode: effectiveMode,
          sensitiveCategory: this.sensitiveCategory
        };
      }

      return {
        allowed: true,
        mode: effectiveMode,
        sensitiveCategory: this.sensitiveCategory
      };
    } catch (error: any) {
      return {
        allowed: false,
        reason: `Malformed target: ${error.message}`,
        mode: effectiveMode,
        sensitiveCategory: this.sensitiveCategory
      };
    }
  }

  private isLocalhost(hostname: string): boolean {
    const lowerHost = hostname.toLowerCase();
    return (
      lowerHost === 'localhost' ||
      lowerHost.endsWith('.localhost') ||
      hostname === '::1' ||
      hostname === '::' ||
      hostname === '0:0:0:0:0:0:0:1' ||
      hostname === '0:0:0:0:0:0:0:0'
    );
  }

  private validateIP(ip: string): TargetPolicyResult {
    // Check IPv4
    if (this.isIPv4(ip)) {
      return this.validateIPv4(ip);
    }

    // Check IPv6
    if (this.isIPv6(ip)) {
      return this.validateIPv6(ip);
    }

    return {
      allowed: false,
      reason: 'Invalid IP address format',
      mode: this.mode
    };
  }

  private isIPv4(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255 && part === num.toString();
    });
  }

  private isIPv6(ip: string): boolean {
    // Simple check for IPv6 format
    return ip.includes(':') && /^[0-9a-fA-F:]+$/.test(ip);
  }

  private validateIPv4(ip: string): TargetPolicyResult {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    const [a, b, c, d] = parts;

    // Cloud metadata endpoints (check before other rules)
    if (ip === '169.254.169.254') {
      return {
        allowed: false,
        reason: 'Cloud metadata endpoint not allowed',
        mode: this.mode
      };
    }

    // 127.0.0.0/8 - Loopback
    if (a === 127) {
      return {
        allowed: false,
        reason: 'Loopback address not allowed (127.0.0.0/8)',
        mode: this.mode
      };
    }

    // 0.0.0.0/8 - Current network
    if (a === 0) {
      return {
        allowed: false,
        reason: 'Current network address not allowed (0.0.0.0/8)',
        mode: this.mode
      };
    }

    // 10.0.0.0/8 - Private (RFC1918)
    if (a === 10) {
      return {
        allowed: false,
        reason: 'Private network not allowed (10.0.0.0/8)',
        mode: this.mode
      };
    }

    // 172.16.0.0/12 - Private (RFC1918)
    if (a === 172 && b >= 16 && b <= 31) {
      return {
        allowed: false,
        reason: 'Private network not allowed (172.16.0.0/12)',
        mode: this.mode
      };
    }

    // 192.168.0.0/16 - Private (RFC1918)
    if (a === 192 && b === 168) {
      return {
        allowed: false,
        reason: 'Private network not allowed (192.168.0.0/16)',
        mode: this.mode
      };
    }

    // 100.64.0.0/10 - CGNAT (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) {
      return {
        allowed: false,
        reason: 'CGNAT address not allowed (100.64.0.0/10)',
        mode: this.mode
      };
    }

    // 169.254.0.0/16 - Link-local
    if (a === 169 && b === 254) {
      return {
        allowed: false,
        reason: 'Link-local address not allowed (169.254.0.0/16)',
        mode: this.mode
      };
    }

    // 224.0.0.0/4 - Multicast
    if (a >= 224 && a <= 239) {
      return {
        allowed: false,
        reason: 'Multicast address not allowed (224.0.0.0/4)',
        mode: this.mode
      };
    }

    // 240.0.0.0/4 - Reserved
    if (a >= 240) {
      return {
        allowed: false,
        reason: 'Reserved address not allowed (240.0.0.0/4)',
        mode: this.mode
      };
    }

    return { allowed: true, mode: this.mode };
  }

  private validateIPv6(ip: string): TargetPolicyResult {
    const lower = ip.toLowerCase();

    // ::1 - Loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') {
      return {
        allowed: false,
        reason: 'IPv6 loopback not allowed (::1)',
        mode: this.mode
      };
    }

    // :: - Unspecified
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') {
      return {
        allowed: false,
        reason: 'IPv6 unspecified address not allowed (::)',
        mode: this.mode
      };
    }

    // fe80::/10 - Link-local
    if (lower.startsWith('fe8') || lower.startsWith('fe9') ||
        lower.startsWith('fea') || lower.startsWith('feb')) {
      return {
        allowed: false,
        reason: 'IPv6 link-local not allowed (fe80::/10)',
        mode: this.mode
      };
    }

    // fc00::/7 - Unique local (ULA)
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
      return {
        allowed: false,
        reason: 'IPv6 unique-local not allowed (fc00::/7)',
        mode: this.mode
      };
    }

    // ff00::/8 - Multicast
    if (lower.startsWith('ff')) {
      return {
        allowed: false,
        reason: 'IPv6 multicast not allowed (ff00::/8)',
        mode: this.mode
      };
    }

    return { allowed: true, mode: this.mode };
  }
}
