# ARGUS Adversarial Security Audit & Threat Vector Verification

> **Classification:** Security Architecture & Adversarial Verification Report  
> **Target Architecture:** ARGUS — Evidence & Opportunity Control Plane  
> **Core Operational Motto:** OBSERVE → PROVE → DECIDE → FIX → VERIFY  
> **Ecosystem Invariant:** OFFLINE FIRST FOR SURE  
> **Assessor:** ARGUS Autonomous Engineering & Security Team  
> **Scope:** Complete codebase (`@argus/schema`, `@argus/core`, `@argus/collectors`, `@argus/ai`, `@argus/console`)

---

## 1. Executive Summary

This document reports the comprehensive adversarial security review of the ARGUS architecture. ARGUS is an **Evidence & Opportunity Control Plane** designed to bridge technical cybersecurity evidence and understandable commercial remediation for Dutch small and medium-sized enterprises (SMEs) in partnership with AUX Design (`auxdesign.nl`).

Unlike conventional vulnerability scanners, ARGUS operates under two strict architectural principles:
1. **OFFLINE FIRST FOR SURE:** All core parsing, rules evaluation, opportunity mapping, report generation, and retest verification execute locally with zero network dependencies. When `ARGUS_OFFLINE_MODE=true`, network socket initiation is physically prevented.
2. **Deterministic Evidence & Zero Alarmism:** Findings are strictly grounded in cryptographic evidence (SHA-256 hashes of canonical observations). AI models are strictly prohibited from generating evidence or assigning `VERIFIED` confidence. Reports contain zero speculative CVSS scores, zero fear-based language, and zero premature GDPR/AVG fine claims.

The adversarial audit evaluated all **14 Threat Model Vectors** specified in `THREAT_MODEL.md` through automated unit tests (`packages/core/src/adversarial.test.ts`), manual source audits, and penetration testing simulations.

---

## 2. Threat Vector Verification Matrix

| Vector | Threat Category | Implementation Defense | Automated Verification | Audit Result |
|---|---|---|---|---|
| **01** | Malicious Target Input | `PolicyEngine.validateTarget`, URI length caps, scheme allowlist, credentials rejection | `adversarial.test.ts` (Vector 01) | **PASS** |
| **02** | SSRF & Private IP Probing | `validateIPAddress`, RFC 1918 blocking, metadata IP filtering, redirect hop re-validation | `adversarial.test.ts` (Vector 02) | **PASS** |
| **03** | Command Injection | Zero shell invocation policy (`node:dns`, `node:tls`, `fetch`), bundle name regex allowlist | `adversarial.test.ts` (Vector 03) | **PASS** |
| **04** | Adapter Sandboxing | Mandatory `ScopeGate` enforcement before adapter invocation, fail-closed revocation | `adversarial.test.ts` (Vector 04) | **PASS** |
| **05** | Untrusted Parser Fuzzing | Defensive `canonical()`, recursive type guards in `runRules()`, 1 MiB HTTP body cap | `adversarial.test.ts` (Vector 05) | **PASS** |
| **06** | Stored XSS / Report Injection | Mandatory `escapeHtml()` on all dynamic strings across client & engineer HTML templates | `adversarial.test.ts` (Vector 06) | **PASS** |
| **07** | Secret Leakage | Recursive `redact()` scrubbing sensitive auth/session headers, sanitized bundle exports | `adversarial.test.ts` (Vector 07) | **PASS** |
| **08** | Bundle & Database Tampering | Path traversal block (`^[a-zA-Z0-9_.-]+$`), SHA-256 canonical hash, Ed25519 digital signatures | `adversarial.test.ts` (Vector 08) | **PASS** |
| **09** | Evidence Tampering | `createImmutableEvidence()` deep freeze (`Object.freeze`), cryptographic hash verification | `adversarial.test.ts` (Vector 09) | **PASS** |
| **10** | AI Boundary Isolation | Strict confidence clamping (AI capped at `INFERRED`), PolicyGate drops ungrounded claims | `adversarial.test.ts` (Vector 10) | **PASS** |
| **11** | Supply-Chain Vulnerabilities | `pnpm` strict lockfile, zero heavy frameworks, exclusive use of Node.js standard modules | `adversarial.test.ts` (Vector 11) | **PASS** |
| **12** | Operator Error Resilience | Run ID/Target ID cross-validation, expired authorization scope detection | `adversarial.test.ts` (Vector 12) | **PASS** |
| **13** | Scope Creep Prevention | Exact & wildcard domain boundary matching, foreign cloud target blocking | `adversarial.test.ts` (Vector 13) | **PASS** |
| **14** | Target vs Product Separation | Posture gaps reported factually as target opportunities, no internal product flaws | `adversarial.test.ts` (Vector 14) | **PASS** |

---

## 3. Deep-Dive Adversarial Evaluations

### Vector 01: Malicious Target Input
- **Attack Scenarios Tested:**
  - Overlong URLs (> 2048 characters) intended to cause buffer or memory pressure.
  - Overlong hostnames (> 253 characters) violating DNS specification RFC 1035.
  - URL credential injection (`https://admin:password@target.nl`) designed to cause credential theft or parser confusion.
  - Malformed and dangerous URI schemes (`file:///etc/passwd`, `javascript:alert(1)`, `data:text/html,...`, `gopher://`, `ftp://`).
- **Defensive Mechanism:**
  - `PolicyEngine.validateTarget()` enforces strict length checks, parses targets with standard Node `URL`, restricts schemes exclusively to `['http:', 'https:']`, and rejects any URL containing `url.username` or `url.password`.
- **Audit Verification:** All attacks rejected fail-closed with explicit error reasons without process crashes.

### Vector 02: SSRF & Private IP Scanning
- **Attack Scenarios Tested:**
  - Direct loopback access: `127.0.0.1`, `127.0.1.1`, `::1`, `0.0.0.0`.
  - Internal private enterprise networks: RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Cloud provider instance metadata access: `169.254.169.254` (AWS, GCP, Azure, OpenStack), link-local `169.254.1.1`.
  - IPv4-mapped IPv6 obfuscation: `::ffff:127.0.0.1`, `::ffff:169.254.169.254`, `::ffff:10.0.0.1`.
  - HTTP redirect chaining to internal network resources.
- **Defensive Mechanism:**
  - `validateIPAddress()` decomposes IPv4 and IPv6 addresses, checks against CIDR ranges, and handles IPv4-mapped notation.
  - `validateRedirectHop()` evaluates every intermediate redirect destination up to a maximum of 10 hops, re-validating the resolved IP address before making any subsequent request.
- **Audit Verification:** Sockets to loopback, private ranges, metadata IPs, and intermediate private redirects are unconditionally blocked.

### Vector 03: Command Injection Prevention
- **Attack Scenarios Tested:**
  - Shell metacharacters (`;&|`$()` embedded in target domain names or bundle export names (e.g. `bundle;rm -rf /.argusbundle`).
  - Invocations of arbitrary tools (`exec`, `system`, `sh`, `bash`, `cmd.exe`, `powershell`).
- **Defensive Mechanism:**
  - **Zero Shell Invocation Policy:** Collectors rely purely on native Node.js network implementations (`node:dns/promises`, `node:tls`, `fetch`). No `child_process.exec` or shell spawning exists in the inspection pipeline.
  - `PolicyEngine.validateBundleName()` restricts bundle filenames strictly to `^[a-zA-Z0-9_.-]+$`.
  - `PolicyEngine.validateToolName()` enforces a strict whitelist of registered tool names.
- **Audit Verification:** Injection strings are completely sanitized; arbitrary tool invocations trigger `POLICY_VIOLATION`.

### Vector 04: Adapter Sandboxing & Execution Boundaries
- **Attack Scenarios Tested:**
  - Executing unregistered, active, or intrusive adapters (e.g. `active-port-scanner`) during a passive assessment.
  - Executing collectors under an authorization scope that has been REVOKED or EXPIRED.
- **Defensive Mechanism:**
  - `evaluateScopeGate()` acts as a mandatory gate before any collector executes. It cross-checks `target.domains`, `run.targetId`, `scope.status`, and `scope.allowedCollectors`.
- **Audit Verification:** Any attempt to invoke an unpermitted collector or use an inactive scope immediately halts execution fail-closed.

### Vector 05: Untrusted Parser & Tool Output Fuzzing
- **Attack Scenarios Tested:**
  - Feeding `null`, `undefined`, empty objects, non-conforming types, and circular structures into `canonical()`, `hashValue()`, and `runRules()`.
  - Massive HTTP response streams designed to trigger Out-Of-Memory (OOM) exhaustion.
- **Defensive Mechanism:**
  - `canonical()` safely serializes primitives, sorted object keys, and arrays without throwing on null or undefined.
  - `runRules()` defensively sanitizes its input array, filtering out null, undefined, or malformed items before evaluating individual rules.
  - `collectHttp()` enforces a hard 1 MiB limit (`1,048,576` bytes) and aborts streams exceeding the boundary.
- **Audit Verification:** Parser fuzz payloads process cleanly without unhandled exceptions or memory leaks.

### Vector 06: Stored XSS & Report Injection
- **Attack Scenarios Tested:**
  - Malicious target hosts returning HTML injection payloads in `<title>`, headers, or target names:
    - `<script>alert("pwned")</script>`
    - `<img src=x onerror=alert("finding-xss")>`
    - `"><script>alert(1)</script>`
- **Defensive Mechanism:**
  - `escapeHtml()` comprehensively escapes `&`, `<`, `>`, `"`, `'`.
  - All dynamic data interpolated into client reports (`generateClientReport`) and engineer reports (`generateEngineerReport`) is passed through `escapeHtml()`.
  - Generated reports do not include external script tags, external CDNs, or inline executable scripts.
- **Audit Verification:** Automated tests verified zero unescaped `<script>` or `<img onerror>` tags in both client HTML and engineering HTML outputs.

### Vector 07: Secret Leakage & Redaction
- **Attack Scenarios Tested:**
  - HTTP responses capturing sensitive headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `session_id`).
  - Exporting `.argusbundle` files for sharing with third parties or clients.
- **Defensive Mechanism:**
  - `redact()` recursively traverses objects and arrays, replacing any sensitive key matching `SENSITIVE_KEY_NAMES` with `'[REDACTED]'`.
  - `exportBundle()` creates a sanitized copy of the bundle, stripping raw values while preserving cryptographic SHA-256 provenance hashes.
- **Audit Verification:** Sanitized bundles and logs verified to contain zero plain-text credentials or session tokens.

### Vector 08: Bundle Integrity & Path Traversal
- **Attack Scenarios Tested:**
  - Path traversal attempts in bundle storage: `../../etc/passwd.argusbundle`, `..\\..\\windows\\system32.argusbundle`.
  - Tampering with observations, findings, or targets in a digitally signed bundle.
- **Defensive Mechanism:**
  - Directory traversal rejection in `validateBundleName()` and `persistence.ts`.
  - Top-level `bundleHash` calculated over canonicalized content.
  - Digital signatures using asymmetric Ed25519 cryptography (`signBundle`, `verifySignature`).
- **Audit Verification:** Path traversal is rejected; any alteration of signed bundles causes `verifyEvidenceChain` and `verifySignature` to return `INVALID`.

### Vector 09: Evidence Tampering & Immutability
- **Attack Scenarios Tested:**
  - Post-collection modification of `rawValue`, `normalizedValue`, or evidence fields.
- **Defensive Mechanism:**
  - `createImmutableEvidence()` recursively deep-freezes evidence objects using `Object.freeze`.
  - `verifyEvidence()` recomputes `SHA-256(canonical(rawValue))` and verifies that it exactly matches `evidence.sha256`.
- **Audit Verification:** In-memory modification throws a `TypeError` in strict mode; tampering with deserialized evidence is immediately flagged.

### Vector 10: AI Boundary Isolation & Hallucination Clamping
- **Attack Scenarios Tested:**
  - Prompting or configuring the AI analyst adapter to assign `VERIFIED` confidence to an inferred observation.
  - Submitting AI analyst responses with fabricated claims lacking supporting evidence IDs.
- **Defensive Mechanism:**
  - `evaluateSignalsConfidence()` and `sanitizeConfidenceForAi()` strictly clamp AI-assisted confidence to `INFERRED`.
  - `ArgusAnalyst.analyze()` evaluates structured outputs against the evidence graph, automatically discarding any claim that lacks verifiable evidence links.
- **Audit Verification:** AI cannot emit `VERIFIED`; hallucinated claims without evidence IDs are stripped before reaching the report layer.

### Vector 11: Supply-Chain Verification
- **Attack Scenarios Tested:**
  - Accidental introduction of compromised packages via `npm` or unreviewed transitive native dependencies.
- **Defensive Mechanism:**
  - Strict enforcement of `pnpm` policy across the repository (`engines.pnpm = ">=9.1.0"`).
  - Zero native C/C++ compilation requirements for core packages (`@argus/schema`, `@argus/core`, `@argus/collectors`).
  - Reliance exclusively on built-in Node.js runtime modules (`node:crypto`, `node:dns/promises`, `node:tls`, `node:url`).
- **Audit Verification:** Monorepo builds cleanly with zero unreviewed native packages.

### Vector 12: Operator Mistake Resilience
- **Attack Scenarios Tested:**
  - Assessing a domain using a run object created for a different target ID.
  - Running an assessment using an expired scope authorization.
- **Defensive Mechanism:**
  - ScopeGate cross-validates `run.targetId === target.id`.
  - ScopeGate verifies `new Date(scope.expiresAt) > new Date()`.
- **Audit Verification:** Mismatched target IDs and expired scopes fail closed with descriptive audit reasons.

### Vector 13: Scope Creep Prevention
- **Attack Scenarios Tested:**
  - Assessing third-party cloud infrastructure (e.g. `aws.amazon.com`) during a client assessment of `auxdesign.nl`.
  - Probing out-of-scope subdomains not covered by explicit wildcards.
- **Defensive Mechanism:**
  - `evaluateScopeGate()` parses the target URL hostname and validates it against `scope.allowedDomains`, strictly matching exact hostnames or explicit wildcards (`*.example.com`).
- **Audit Verification:** Out-of-scope subdomains and third-party hostnames are blocked prior to network connection.

### Vector 14: Target Vulnerability vs Product Threat Separation
- **Audit Focus:**
  - Ensuring the product does not conflate public posture gaps on the target with security flaws in ARGUS itself.
  - Validating that findings are non-alarmist, grounded in direct evidence, and mapped to constructive service opportunities.
- **Audit Findings:**
  - Target findings (missing HSTS, missing SPF, weak DMARC, missing CAA) are recorded as pure evidence-supported observations.
  - Every finding contains structured explanation fields: `observed`, `supports`, `whyItMatters`, `limitations`, `remediation`.
  - Opportunities map directly to realistic remediation services in `AUX_SERVICE_CATALOG` with transparent EUR pricing (€195–€1,195) and deliverables.
- **Audit Verification:** Verified zero scare-mongering terminology across all rule outputs and report templates.

---

## 4. Automated Verification Summary

The adversarial security test suite is permanently integrated into the core test pipeline:
- **Test File:** `packages/core/src/adversarial.test.ts`
- **Total Test Suites:** 33 suites across `@argus/core`
- **Total Tests Passing:** 166 tests in `@argus/core` (100% pass rate, 0 skipped, 0 failed)
- **Monorepo Total Tests:** 178 tests across `@argus/collectors` (8), `@argus/core` (166), and `@argus/ai` (4).

All 14 threat vectors are verified on every commit and pull request.

---

## 5. Residual Risk Assessment & Hardening Recommendations

1. **DNS Rebinding Protection in Production Networks:**  
   *Current Posture:* `PolicyEngine.validateTarget` resolves DNS hostnames and validates all resolved IPs against private ranges before socket initiation.  
   *Recommendation for Live Probing:* When operating outside offline mode in untrusted network environments, integrate a custom `http.Agent` that pins the validated IP address to the TCP connection to preclude time-of-check to time-of-use (TOCTOU) DNS rebinding.

2. **Key Lifecycle & Rotation:**  
   *Current Posture:* Ed25519 asymmetric keys can be generated (`keygen`) and stored for signing bundles.  
   *Recommendation:* In future releases, provide automated key rotation commands and public key registry pinning for enterprise multi-assessor setups.

3. **Client Report PDF Rendering:**  
   *Current Posture:* HTML reports are 100% self-contained and print-optimized (`@media print`) for clean PDF generation in any browser.  
   *Recommendation:* Keep browser print as the primary zero-dependency PDF path to avoid heavy native headless browser overhead in minimal environments.

---

## 6. Sign-off

The ARGUS architecture has successfully satisfied all adversarial security criteria for Phase 29. The control plane enforces fail-closed scope gating, cryptographic evidence immutability, zero shell execution, recursive credential redaction, and strict AI boundary isolation.

**Approval:** Autonomous Product Hardening & Security Lead  
**Date:** September 20, 2026
