# ARGUS Threat Model & Security Architecture

> **Operational Motto:** OBSERVE → PROVE → DECIDE → FIX → VERIFY  
> **Ecosystem Invariant:** OFFLINE FIRST FOR SURE  
> **Target Environment:** Dutch SMEs, AUX Design Commercial Operations

---

## 1. Scope & Foundational Distinction

A critical principle of ARGUS is the strict separation between:
1. **Product Threats:** Threats against the ARGUS host machine, operator, local evidence storage, or derived commercial reports.
2. **Target Vulnerabilities:** Security posture weaknesses, misconfigurations, or absence of best-practice controls identified on the target business's public infrastructure.

ARGUS does **NOT** exploit targets. ARGUS is an **Evidence & Opportunity Control Plane**. It evaluates public posture deterministically and verifies remediation non-destructively.

```
+-------------------------------------------------------------------------+
|                              ARGUS CONTROL PLANE                        |
|                                                                         |
|  [Operator Input]                                                       |
|        |                                                                |
|        v                                                                |
|  [Scope & Policy Gate] ----(Fail Closed: Rejects SSRF / Unauthorized)   |
|        |                                                                |
|        v                                                                |
|  [Bounded Collectors] ----(Offline Mode / Timeout / Max Body Size)      |
|        |                                                                |
|        v                                                                |
|  [Immutable Evidence] ----(Deep Frozen / SHA-256 Hashed / Verifiable)   |
|        |                                                                |
|        +-------------------------+                                      |
|        |                         |                                      |
|        v                         v                                      |
|  [Rules Engine]        [Optional AI Analyst]                            |
|        |               (Boundary: Tagged AI_ASSISTED, cannot            |
|        |                create evidence or assign VERIFIED)             |
|        v                         |                                      |
|  [Opportunity Catalog] <---------+                                      |
|        |                                                                |
|        v                                                                |
|  [Client & Engineer Reports] (Sanitized, Safe-Rendered HTML/JSON)       |
+-------------------------------------------------------------------------+
```

---

## 2. Threat Analysis Matrix

### 2.1 Malicious Target Input
- **Classification:** Product Threat
- **Description:** An operator or untrusted external feed supplies overlong URLs, Unicode homoglyphs, malformed URI schemes (`file://`, `gopher://`, `javascript:`), or embedded credentials (`http://user:pass@evil.com`).
- **Impact:** Denial of service, parser crashes, unexpected file-system access, credential leak to unintended servers.
- **Mitigations in ARGUS:**
  - `PolicyEngine.validateTarget`: Enforces strict maximum URL length (2048 chars) and hostname length (253 chars).
  - Scheme restriction: Only `http:` and `https:` schemes are permitted.
  - Rejection of userinfo in URL: URLs containing username or password tokens are immediately rejected.
  - Strict URI parsing using Node standard `URL` parser with fail-closed exception handling.

### 2.2 Server-Side Request Forgery (SSRF) & Private IP Scanning
- **Classification:** Product Threat
- **Description:** A target URL resolves to localhost (`127.0.0.1`, `::1`), private RFC 1918 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local addresses (`169.254.0.0/16`), or cloud metadata endpoints (`http://169.254.169.254`). Attackers could also use DNS rebinding (resolving to a public IP first, then rebinding to an internal IP).
- **Impact:** Scanning internal enterprise networks, leaking local host services, exfiltrating cloud instance metadata.
- **Mitigations in ARGUS:**
  - `TargetPolicy` & `PolicyEngine.validateIP`: Checks every resolved IPv4 and IPv6 address against private, loopback, link-local, carrier-grade NAT, and cloud metadata ranges.
  - Fail-Closed DNS: If a hostname does not resolve or resolves to even one prohibited IP, the entire inspection fails closed before socket initiation.
  - Redirect Validation: Every HTTP redirect hop (`301`, `302`, `307`, `308`) invokes `validateRedirectHop`, re-resolving and validating the target IP of each intermediate location header up to a maximum of 10 hops.

### 2.3 Command Injection
- **Classification:** Product Threat
- **Description:** Arbitrary shell injection via unsanitized strings passed to system shells (`child_process.exec`, `sh -c`, `cmd.exe`).
- **Impact:** Remote code execution on the operator's workstation or assessment runner.
- **Mitigations in ARGUS:**
  - **Zero Shell Invocation Policy:** ARGUS core and collectors use standard runtime networking libraries (`node:dns/promises`, `node:tls`, standard `fetch`).
  - No shell calls (`exec`, `spawn('sh')`) are used in collectors.
  - Tool execution in PolicyEngine enforces strict schema allowlists and rejects any command line concatenation.

### 2.4 Adapter Execution & Sandboxing
- **Classification:** Product Threat
- **Description:** Third-party or auxiliary diagnostic adapters could execute arbitrary unconstrained logic or attempt unexpected outbound connections.
- **Impact:** Compromise of the assessment environment, uncontrolled network scanning.
- **Mitigations in ARGUS:**
  - Scope Gating: No adapter executes without an explicit `AuthorizationScope` and permission check (`evaluateScopeGate`).
  - Strict input boundary: Adapters receive strongly typed options and return typed observations.
  - Offline Mode Invariant: When `ARGUS_OFFLINE_MODE=true`, all networking adapters fail closed immediately.

### 2.5 Untrusted Tool Output & Parser Exploitation
- **Classification:** Product Threat
- **Description:** External tools or network collectors returning excessively large responses, decompression bombs (gzip bombs), or malformed payloads designed to exhaust memory or exploit parser vulnerabilities.
- **Impact:** Process crash, Out-Of-Memory (OOM), infinite parsing loops.
- **Mitigations in ARGUS:**
  - Max body size limits: `collectHttp` enforces a hard limit of 1 MiB (`1,048,576` bytes) and aborts streams exceeding this limit.
  - Connection and read timeouts: Strict timeouts (e.g. 5,000ms – 10,000ms) with `AbortController`.
  - Defensive normalization: `canonical()` and `redact()` safely handle nulls, undefined, circular references, and non-object payloads.

### 2.6 Report Injection & Stored HTML (Cross-Site Scripting)
- **Classification:** Product Threat
- **Description:** Malicious target infrastructure returns headers or HTML metadata containing malicious script tags or SVG payloads (e.g. `Server: <script>alert(1)</script>` or malicious `<title>` tags) that could execute in the browser of the consultant, Dutch business owner, or client viewing an HTML report.
- **Impact:** Session compromise, local data exfiltration, cross-site scripting in report viewer.
- **Mitigations in ARGUS:**
  - Mandatory HTML Entity Escaping: All dynamic values injected into HTML templates (headers, URLs, target names, raw values) must pass through `escapeHtml()` replacing `&`, `<`, `>`, `"`, `'`.
  - Self-contained HTML: Generated HTML reports do not load external untrusted scripts or external CSS CDNs. Zero inline JavaScript execution required for client reports.

### 2.7 Secrets & Credential Leakage
- **Classification:** Product Threat
- **Description:** Observed HTTP responses or requests inadvertently capture `Authorization`, `Cookie`, `Set-Cookie`, `X-API-Key`, or session tokens in raw logs or exported `.argusbundle` files.
- **Impact:** Accidental disclosure of client secrets to unauthorized third parties or in proposals.
- **Mitigations in ARGUS:**
  - Automated Redaction: `redactEvidence` systematically scrubs sensitive headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`) replacing values with `[REDACTED]`.
  - Export Bundles: `exportBundle` generates sanitized bundles stripped of potential secrets before client sharing.

### 2.8 Local Database & Bundle Integrity
- **Classification:** Product Threat
- **Description:** Local bundle files (`.argusbundle`) or local persistence files modified, corrupted, or replaced with path traversal names (e.g. `../../etc/passwd.argusbundle`).
- **Impact:** Arbitrary file overwrite, corrupted historical assessments, false audit trails.
- **Mitigations in ARGUS:**
  - Filename Sanitization: `PolicyEngine.validateBundleName` strictly enforces regex `^[a-zA-Z0-9_\.-]+$` and bans `..`, `/`, `\`.
  - Cryptographic Bundle Hash: Bundles include a top-level `bundleHash` calculated over canonicalized content.
  - Asymmetric Ed25519 Signatures: Bundles can be digitally signed (`signBundle`) and verified (`verifySignature`) using public-key cryptography.

### 2.9 Tampering with Evidence
- **Classification:** Product Threat
- **Description:** Post-collection alteration of evidence fields (e.g. tampering with `rawValue` to fabricate a vulnerability or conceal a regression).
- **Impact:** Invalidation of legal/commercial trust, fraudulent before/after claims.
- **Mitigations in ARGUS:**
  - In-Memory Immutability: `createImmutableEvidence` recursively deep-freezes evidence objects (`Object.freeze`).
  - Cryptographic Binding: Every evidence record carries `rawHash = SHA-256(canonical(rawValue))` and `normalizedHash = SHA-256(canonical(normalizedValue))`.
  - Tamper Verification: `verifyEvidenceIntegrity` recalculates the canonical hash and confirms `sha256 === expectedHash`.

### 2.10 AI Hallucination & Evidence Boundary
- **Classification:** Product Threat
- **Description:** Integrating Large Language Models (LLMs) to analyze security postures can result in hallucinated CVEs, invented vulnerabilities, fabricated legal violations (e.g. premature GDPR fine claims), or synthetic evidence.
- **Impact:** Legal liability, reputational damage for AUX Design, loss of client trust.
- **Mitigations in ARGUS:**
  - **Strict Architectural Invariant:** AI is strictly OPTIONAL and excluded from the critical evidence path.
  - AI cannot create evidence records.
  - AI cannot assign or promote findings to `VERIFIED`. Any AI-assisted evidence is forced to `INFERRED` and tagged `aiAssisted: true`.
  - Deterministic Rules Rule: All findings and opportunities are derived by deterministic TypeScript rules, not generative text models.

### 2.11 Supply-Chain Dependencies
- **Classification:** Product Threat
- **Description:** Vulnerabilities or malicious code introduced through third-party npm packages.
- **Impact:** Host compromise, secret exfiltration during build or test execution.
- **Mitigations in ARGUS:**
  - Monorepo Dependency Policy: `pnpm` is strictly enforced. `npm` is forbidden.
  - Zero Heavy Frameworks: Core packages (`@argus/schema`, `@argus/core`, `@argus/collectors`) have zero heavy dependencies and rely on Node.js built-ins (`node:crypto`, `node:dns`, `node:tls`, `node:url`).
  - Minimal attack surface: No graph databases, no bloated scanner engines, no untrusted plugins.

### 2.12 Operator Error
- **Classification:** Product Threat
- **Description:** Operator specifies an incorrect domain, runs an assessment without client knowledge, or misinterprets an inferred finding as an absolute fact.
- **Impact:** Commercial disputes, assessing the wrong client, presenting inaccurate advice.
- **Mitigations in ARGUS:**
  - Clear Target Confirmation: Every assessment logs normalized target, IP, and timestamp.
  - Dual Mode Output: Clear separation between Client Mode (plain language, uncertainty acknowledged) and Engineer Mode (raw technical data).
  - Explicit Non-Destructive Default: All public posture checks are completely non-invasive.

### 2.13 Scope & Authorization Mistakes
- **Classification:** Product Threat
- **Description:** Scanning infrastructure outside the agreed client contract, or exceeding passive bounds into active probing.
- **Impact:** Legal liability under Dutch Computer Fraud laws (Wet computercriminaliteit).
- **Mitigations in ARGUS:**
  - `ScopeGate`: Enforced in code before any collector executes.
  - `PUBLIC_POSTURE` Mode: Exclusively allows passive DNS, TLS, HTTP header inspection, and public metadata.
  - `AUTHORIZED_ASSESSMENT` Mode: Demands explicit operator attribution, authorization basis, and expiration date.

### 2.14 Target Vulnerabilities (Separated from Product Threats)
- **Classification:** Target Vulnerability
- **Description:** Gaps in the target's public configuration:
  - Missing HSTS (`Strict-Transport-Security`)
  - Missing or permissive SPF (`v=spf1 ~all` or `+all`)
  - Missing DMARC policy (`v=DMARC1; p=none`)
  - Outdated TLS ciphers or expiring SSL certificates
  - Absence of security contact (`security.txt`)
- **Treatment in ARGUS:**
  - Reported factually as **Observations** supported by **Evidence**.
  - No fear-based marketing.
  - No claims of "hacked", "breached", or "GDPR violation" unless deterministic evidence exists.
  - Mapped directly to positive service opportunities in the AUX Design Service Catalog.

---

## 3. Summary of Core Security Invariants

| Invariant | Implementation Mechanism | Enforcement Layer |
|---|---|---|
| Zero Network in Offline Mode | `ARGUS_OFFLINE_MODE` check in collectors | `@argus/collectors` |
| Scope Gate Before Execution | `evaluateScopeGate()` mandatory validation | `@argus/core` |
| SSRF Prevention | Private/loopback IP validation on all DNS & redirects | `PolicyEngine`, `TargetPolicy` |
| Evidence Immutability | `deepFreeze()` + SHA-256 canonical hashing | `engine.ts`, `crypto.ts` |
| AI Boundary Isolation | AI fields tagged `aiAssisted`, forbidden from `VERIFIED` | `engine.ts`, schema |
| Report XSS Prevention | Strict HTML escaping & zero external scripts | `report-generator.ts` |
| Deterministic Findings | Pure rule functions over canonical evidence | `rules.ts` |
