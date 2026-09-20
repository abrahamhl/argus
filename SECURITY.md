# ARGUS Security Policy

## 1. Supported Versions

ARGUS is maintained actively on the primary development branch. Security patches and hardening updates are released as follows:

| Version | Supported | Notes |
|---|---|---|
| `0.1.x` | Yes | Active release branch with deterministic core invariants |
| `< 0.1.0` | No | Prototype iterations superseded |

---

## 2. Reporting a Vulnerability & Responsible Disclosure

We treat security vulnerabilities within the ARGUS product itself (such as SSRF bypasses, report XSS, parser crashes, or authorization gate flaws) with the highest priority.

- **Private Reporting:** Do NOT report security vulnerabilities via public GitHub issues.
- **Reporting Channel:** Send an encrypted or private report to: `security@auxdesign.nl` (or to project lead Abraham).
- **Service Level Agreement (SLA):**
  - **Initial Acknowledgment:** Within 48 hours.
  - **Triage & Reproduction:** Within 5 business days.
  - **Patch & Public Advisory:** Coordinated release within 30 days of confirmed fix.

---

## 3. Strict Prohibitions & Operational Boundaries

To preserve ethical integrity, legal compliance, and customer trust, the following actions are **STRICTLY PROHIBITED** by policy and enforced in code:

1. **No Exploitation:** ARGUS will never attempt to exploit vulnerabilities, inject arbitrary execution payloads, or mutate state on target systems.
2. **No Brute Force:** No credential brute-forcing, password spraying, or dictionary attacks.
3. **No Directory Fuzzing:** No unbounded wordlist-based directory enumeration or path fuzzing.
4. **No Secret Hunting:** No mass automated scraping or unauthorized file-dump parsing.
5. **No Mass Scanning:** No unbounded CIDR-range or geographical mass-scanning (e.g. scanning entire Dutch postal codes or IP ranges).
6. **No Fabricated Vulnerabilities:** Never present an unverified inference as a factual or critical breach.
7. **No Legal Determinations:** ARGUS provides technical and configuration posture observations; it does NOT issue formal GDPR, NIS2, or statutory legal compliance determinations.

---

## 4. Assessment Modes & Scope Boundaries

### Public Posture Mode
- Designed for passive evaluation of publicly exposed domain assets (DNS records, TLS certificates, HTTP response headers, security.txt, and public metadata).
- Always limited to non-intrusive public signals.
- All requests are rate-limited, timeout-bounded (max 10s), and body-size capped (max 1 MiB).

### Authorized Assessment Mode
- Permitted only with explicit client consent, verified target ownership, and documented authorization metadata.
- Records: `targetId`, `operator`, `authorizationBasis`, `createdAt`, `expiresAt`, and `toolVersions`.
- Even in authorized mode, ARGUS defaults to non-destructive verification.

---

## 5. Offline First & Local Data Security

Sensitive assessment data belongs exclusively to the operator and the client:
- **Zero Mandatory Cloud Telemetry:** ARGUS does not transmit customer evidence, domain names, or finding summaries to external telemetry endpoints or third-party cloud databases.
- **Local Persistence Path:** Assessments are stored in local bundle files (`.argusbundle`) or local project directories (`.argus_data/`).
- **Data Retention & Deletion:** Operators have full autonomy over local evidence retention and can permanently delete assessment files using standard OS deletion tools without cloud synchronization traces.
- **Cryptographic Evidence Verification:** Every bundle and evidence record is protected with SHA-256 canonical hashing and optional Ed25519 asymmetric signatures to guarantee tamper resistance.

---

## 6. Dependency & Package Policy

- In accordance with project policy, all dependency installation and maintenance must use `pnpm`. `npm` is strictly prohibited.
- Dependencies are audited and kept to the absolute minimum necessary. Core packages rely on standard Node.js built-in runtime modules (`node:crypto`, `node:dns`, `node:tls`, `node:url`) rather than large external frameworks.
