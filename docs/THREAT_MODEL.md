# ARGUS Threat Model

**Version:** 1.0  
**Last Updated:** 2026-09-08  
**Status:** Active

---

## Executive Summary

ARGUS is a local-first evidence control plane that collects public infrastructure observations, produces cryptographically hashed evidence, and generates deterministic findings. This threat model identifies security boundaries, assets, potential attackers, and mitigations.

**Key Principle:** ARGUS is designed for **passive observation** and **deterministic analysis**, not active exploitation.

---

## System Overview

### Trust Boundaries

1. **Operator → ARGUS:** The operator runs ARGUS locally and trusts its code.
2. **ARGUS → Target:** ARGUS collects data from potentially hostile targets.
3. **ARGUS → External Dependencies:** pnpm, Node.js, TypeScript toolchain.
4. **Evidence Store → Analysis Engine:** Immutable evidence feeds deterministic rules.

### Assets

1. **Evidence Integrity:** Cryptographic hashes of collected observations.
2. **Operator Privacy:** No telemetry, no cloud dependencies.
3. **Target Scope:** Authorization boundaries prevent unauthorized assessment.
4. **Finding Determinism:** Same evidence → same finding (reproducibility).
5. **Proof Provenance:** Before/after comparison integrity.

---

## Threat Analysis

### 1. MALICIOUS TARGET RESPONSES

**Threat:** A hostile target returns crafted HTTP headers or DNS records designed to exploit ARGUS.

**Attack Vectors:**
- **Oversized Headers:** 10MB Content-Length header to exhaust memory
- **Malformed JSON:** Invalid UTF-8 in response body
- **Redirect Loops:** Infinite HTTP 301/302 chains
- **DNS Amplification:** Massive TXT records (>64KB)
- **Script Injection:** Malicious HTML in collected content

**Impact:** Denial of service, memory exhaustion, ARGUS crash

**Mitigations:**
- ✅ HTTP collector uses native `fetch()` with automatic limits
- ✅ DNS collector uses Node's `dns.promises` with timeouts
- ✅ No HTML/JavaScript parsing - headers only
- ✅ Evidence normalized to typed schema
- ❌ **MISSING:** Explicit size limits on response bodies (rely on Node defaults)
- ❌ **MISSING:** Maximum redirect depth enforcement

**Residual Risk:** MEDIUM - Node's fetch() provides basic protection, but explicit limits would be better.

**Recommendation:** Add explicit `maxResponseSize: 1MB` and `maxRedirects: 5` to collectors.

---

### 2. EVIDENCE TAMPERING

**Threat:** An attacker modifies evidence after collection to alter findings or proof.

**Attack Vectors:**
- **File System Access:** Modify fixture files
- **Memory Corruption:** Exploit Node.js to change evidence in RAM
- **Hash Collision:** Craft two different observations with same SHA256

**Impact:** False findings, invalid proof, loss of trust in evidence provenance

**Mitigations:**
- ✅ Evidence includes SHA256 hash of `rawValue`
- ✅ Finding IDs derived from canonical evidence (deterministic)
- ✅ Proof compares by finding ID, not raw content
- ❌ **MISSING:** Hash verification before rule evaluation
- ❌ **MISSING:** Evidence signature chain

**Residual Risk:** LOW - SHA256 collision is cryptographically infeasible; file tampering requires local access.

**Recommendation:** Add hash verification step: `if (hashValue(evidence.rawValue) !== evidence.sha256) throw new Error('Evidence integrity violation')`.

---

### 3. SUPPLY CHAIN COMPROMISE

**Threat:** Malicious dependency injected into pnpm lockfile or compromised npm package.

**Attack Vectors:**
- **Typosquatting:** Similar package name (e.g., `@argus/cors` instead of `@argus/core`)
- **Compromised Maintainer:** Legitimate package taken over
- **Lockfile Manipulation:** Direct edit of `pnpm-lock.yaml`
- **Build Tool Attack:** Compromised TypeScript or esbuild

**Impact:** Code execution, data exfiltration, evidence manipulation

**Mitigations:**
- ✅ pnpm lockfile committed and frozen (`--frozen-lockfile`)
- ✅ Minimal dependencies (no runtime deps beyond workspace packages)
- ✅ TypeScript strict mode catches some injection attempts
- ❌ **MISSING:** Dependency audit automation (e.g., `pnpm audit`)
- ❌ **MISSING:** Subresource Integrity (SRI) for CDN-loaded libs (if any)

**Residual Risk:** MEDIUM - No runtime dependencies reduces attack surface, but build-time compromise is possible.

**Recommendation:** Add GitHub Actions workflow: `pnpm audit` on every commit + Dependabot alerts.

---

### 4. FIXTURE POISONING

**Threat:** Malicious fixture file contains exploit payload executed during testing or demo.

**Attack Vectors:**
- **Prototype Pollution:** `__proto__` in JSON fixture
- **Script Injection:** Executable code in fixture string
- **Path Traversal:** Fixture references `../../etc/passwd`

**Impact:** Code execution during `pnpm test` or demo mode

**Mitigations:**
- ✅ Fixtures are plain JSON (no code execution)
- ✅ JSON.parse() is safe against script injection
- ✅ Fixture loading does not eval() or execute content
- ⚠️ **PARTIAL:** No schema validation on fixture structure

**Residual Risk:** LOW - JSON parsing is safe; no dynamic code execution.

**Recommendation:** Add JSON schema validation for fixtures to catch malformed data early.

---

### 5. LOG INJECTION / OUTPUT POISONING

**Threat:** Malicious evidence content crafted to inject commands or ANSI codes into terminal output.

**Attack Vectors:**
- **ANSI Escape Codes:** `\x1b[2J` clears screen, `\x1b]0;` changes title
- **Newline Injection:** Finding title contains `\n[CRITICAL] Fake Alert`
- **Terminal Bell:** `\x07` spam in DNS TXT record

**Impact:** UI confusion, fake findings displayed, terminal disruption

**Mitigations:**
- ✅ Evidence stored as typed objects, not raw strings
- ✅ Console output uses template literals (some escaping)
- ❌ **MISSING:** Explicit sanitization of evidence values before logging
- ❌ **MISSING:** Strip ANSI codes from collected data

**Residual Risk:** MEDIUM - ANSI injection could confuse operator.

**Recommendation:** Add sanitization function: `stripAnsi(value)` before console.log().

---

### 6. SSRF (Server-Side Request Forgery)

**Threat:** Operator-controlled target URL tricks ARGUS into scanning internal/private IPs.

**Attack Vectors:**
- **Private IP Target:** `http://192.168.1.1`
- **Localhost:** `http://localhost:6379` (Redis)
- **Cloud Metadata:** `http://169.254.169.254/latest/meta-data/`
- **DNS Rebinding:** Domain resolves to public IP, then changes to 127.0.0.1

**Impact:** Unauthorized internal network scanning, credential exposure

**Mitigations:**
- ✅ Policy validation checks target URL
- ⚠️ **PARTIAL:** TargetPolicy exists but does not block private IPs by default
- ❌ **MISSING:** Blocklist for RFC1918 / loopback addresses
- ❌ **MISSING:** DNS rebinding protection

**Residual Risk:** HIGH - Nothing currently prevents scanning `192.168.x.x` or `127.0.0.1`.

**Recommendation:** Add to TargetPolicy:
```typescript
const BLOCKED_RANGES = ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16'];
if (isPrivateIP(hostname)) return { allowed: false, reason: 'Private IP blocked' };
```

---

### 7. UNAUTHORIZED ASSESSMENT

**Threat:** Operator runs ARGUS against targets they don't own or have permission to assess.

**Attack Vectors:**
- **Accidental Scanning:** Typo in domain name
- **Competitor Analysis:** Intentional scanning of rival's infrastructure
- **Lack of Consent:** No authorization from target owner

**Impact:** Legal liability, terms of service violations, ethical breach

**Mitigations:**
- ✅ Authorization scope model (OWNER_AUTHORIZED, PUBLIC_PASSIVE_REVIEW)
- ✅ Operator acknowledgment required in scope creation
- ✅ Passive-only restriction enforced
- ⚠️ **PARTIAL:** Scope validation exists but is not enforced in live inspector flow
- ❌ **MISSING:** Interactive confirmation prompt before first collection

**Residual Risk:** MEDIUM - Authorization model exists but enforcement is incomplete.

**Recommendation:** Add interactive prompt in live mode:
```typescript
console.log('You are about to assess:', targetUrl);
const confirm = await rl.question('Confirm authorization (yes/no): ');
if (confirm !== 'yes') process.exit(0);
```

---

### 8. CREDENTIAL LEAKAGE

**Threat:** ARGUS accidentally logs or stores credentials from HTTP headers or environment variables.

**Attack Vectors:**
- **Authorization Header:** Logged in evidence or console output
- **Cookie Values:** Stored in rawValue
- **API Keys:** X-API-Key header collected
- **Environment Vars:** DEBUG mode exposes secrets

**Impact:** Credential exposure in logs, fixtures, or evidence files

**Mitigations:**
- ✅ `redact()` function scrubs Authorization/Cookie/Set-Cookie headers
- ✅ `redactEvidence()` applies to both rawValue and normalizedValue
- ❌ **MISSING:** Redaction applied automatically before storage
- ❌ **MISSING:** Audit of console.log() calls for evidence leakage

**Residual Risk:** MEDIUM - Redaction exists but must be called explicitly.

**Recommendation:** Auto-redact in evidence creation:
```typescript
const evd: Evidence = {
  ...
  rawValue: redact(obs.rawValue),
  normalizedValue: redact(obs.rawValue),
  ...
};
```

---

### 9. DENIAL OF SERVICE AGAINST OPERATOR

**Threat:** ARGUS resource exhaustion causes operator's machine to hang or crash.

**Attack Vectors:**
- **Memory Bomb:** Collecting 10GB response body
- **CPU Exhaustion:** Infinite loop in rule evaluation
- **Disk Fill:** Storing massive evidence files
- **Recursion:** Stack overflow in nested evidence processing

**Impact:** ARGUS unusable, operator machine impacted

**Mitigations:**
- ✅ Node.js memory limits apply (default ~2GB)
- ✅ Pure functions in rules (no unbounded loops)
- ❌ **MISSING:** Explicit memory budgets
- ❌ **MISSING:** Evidence size limits before storage

**Residual Risk:** LOW - Node's built-in protections are reasonable for local-first tool.

**Recommendation:** Add explicit limits:
```typescript
if (evidence.length > 10000) throw new Error('Evidence count exceeds safety limit');
if (JSON.stringify(evidence).length > 100_000_000) throw new Error('Evidence size exceeds 100MB');
```

---

### 10. CROSS-CONTAMINATION (Future AI Adapters)

**Threat:** If AI adapters are added in the future, evidence from one target leaks into analysis of another.

**Attack Vectors:**
- **Prompt Injection:** Malicious finding instructs AI to ignore other findings
- **Context Bleed:** GPT-4 cache shares data across assessments
- **Training Data Poisoning:** Evidence uploaded for fine-tuning

**Impact:** False findings, privacy violation, evidence integrity loss

**Mitigations:**
- ✅ Current design: AI is **NOT** in evidence pipeline
- ✅ Rules are deterministic (no LLM)
- ⚠️ **PARTIAL:** Future-proofing needed if AI adapters added

**Residual Risk:** NONE (currently) - AI not used.

**Recommendation (if AI is added):** 
- Treat AI output as `confidence: INFERRED` (never VERIFIED)
- Run AI adapters in isolated sandboxes
- Never send rawValue to external APIs
- Document AI limitations explicitly in findings

---

## Attack Tree Summary

```
[Root] Compromise ARGUS Evidence Integrity
│
├─[1] Malicious Target Responses → DoS (MEDIUM risk)
├─[2] Evidence Tampering → Local file access required (LOW risk)
├─[3] Supply Chain Compromise → Build-time attack (MEDIUM risk)
├─[4] Fixture Poisoning → Safe JSON parsing (LOW risk)
├─[5] Log Injection → ANSI escape codes (MEDIUM risk)
├─[6] SSRF → Private IP scanning (HIGH risk) ⚠️
├─[7] Unauthorized Assessment → Legal/ethical (MEDIUM risk)
├─[8] Credential Leakage → Redaction exists but incomplete (MEDIUM risk)
├─[9] DoS Against Operator → Node limits apply (LOW risk)
└─[10] AI Cross-Contamination → Not applicable yet (NONE)
```

---

## Mitigations Summary

### Implemented ✅
- SHA256 evidence hashing
- Authorization scope model
- Evidence redaction functions
- Passive-only collection mode
- pnpm lockfile frozen
- Deterministic rule engine
- No external runtime dependencies

### Partially Implemented ⚠️
- Private IP blocking (policy exists, not enforced)
- Authorization confirmation (model exists, not prompted)
- Evidence size limits (Node defaults only)

### Missing ❌
- Hash verification before rule evaluation
- Dependency audit automation
- ANSI code sanitization
- Interactive authorization prompt
- Explicit memory/size budgets
- Auto-redaction in evidence pipeline

---

## Security Checklist for Deployment

Before using ARGUS in production:

- [ ] Add private IP blocklist to TargetPolicy
- [ ] Implement hash verification: `validateEvidenceIntegrity(evidence)`
- [ ] Auto-redact credentials in evidence creation
- [ ] Add `pnpm audit` to CI
- [ ] Sanitize ANSI codes in console output
- [ ] Add interactive authorization prompt for live mode
- [ ] Set explicit evidence size limits
- [ ] Document limitations in README
- [ ] Add SECURITY.md with vulnerability reporting process
- [ ] Review all console.log() for secret leakage

---

## Responsible Use Policy

ARGUS is designed for:
- ✅ Owner-authorized infrastructure assessment
- ✅ Self-assessment and compliance validation
- ✅ Passive public data observation (security research)
- ✅ Commercial opportunity identification with consent

ARGUS is **NOT** designed for:
- ❌ Unauthorized penetration testing
- ❌ Active exploitation or vulnerability scanning
- ❌ Competitive intelligence without authorization
- ❌ Mass scanning or automated target enumeration

**If in doubt:** Obtain explicit written authorization before assessing any target.

---

## Reporting Security Issues

If you discover a security vulnerability in ARGUS:

1. **DO NOT** open a public GitHub issue
2. Email: [security contact TBD]
3. Include: reproduction steps, impact assessment, suggested fix
4. Expected response time: 48 hours

---

**Prepared by:** Principal Security Engineer  
**Next Review:** 2027-03-08 (6 months)  
**Classification:** Public
