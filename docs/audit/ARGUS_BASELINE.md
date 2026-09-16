# ARGUS Ground Truth Baseline

Generated: 2026-09-16T03:56:00+02:00

## Repository State

| Property | Value |
|---|---|
| Local HEAD SHA | `533f437d1d879d8b9beb863193a2167eaa56a572` |
| Remote default branch SHA (origin/master) | `cf1ef7dc446dce67fbc51694ca5707266e6ddefe` |
| Active branch | `agent/hygiene-remediation` |
| Git status | Clean (1 untracked: `apps/landing/`) |
| Node version | `v22.22.2` |
| pnpm version | `9.1.0` |
| packageManager field | `pnpm@9.1.0` |

## Active Branches

```
agent/agy-pwa
agent/claude-core
agent/deepseek-rules
* agent/hygiene-remediation
agent/monetization
agent/qa-audit
agent/zai-deploy
master
rescue/repo-hygiene
```

## Workspace Packages

| Package | Version | Location |
|---|---|---|
| argus-workspace (root) | — | `.` |
| @argus/schema | 0.1.0 | `packages/schema` |
| @argus/core | 0.1.0 | `packages/core` |
| @argus/collectors | 0.1.0 | `packages/collectors` |
| @argus/ai | 0.1.0 | `packages/ai` |
| @argus/eval | 0.1.0 | `packages/eval` |
| @argus/console | 0.1.0 | `apps/console` |
| @argus/mcp | 0.1.0 | `apps/mcp` |
| @argus/web | 0.1.0 | `apps/web` |

## Dependencies (root)

| Dependency | Version | Type |
|---|---|---|
| @modelcontextprotocol/sdk | 1.30.0 | production |
| @types/node | 20.19.43 | dev |
| typescript | 5.9.3 | dev |

## Build Result

**Status: PASS** — All 8 workspace projects build successfully (9th has no build script).

## Test Result

**Status: PASS** — 29 tests pass (packages/core: 27, packages/collectors: 2). packages/ai reports 0 tests (no test files exist).

## Coverage (actual measured output from `node --experimental-test-coverage`)

```
file              | line % | branch % | funcs %
dns.js            |  10.00 |    66.67 |    6.67
http.js           |  10.91 |    66.67 |   33.33
assessment.js     |  11.95 |   100.00 |    0.00
crypto.js         |  92.50 |    92.31 |  100.00
rules.js          |  95.58 |    91.41 |  100.00
ALL FILES         |  76.80 |    91.77 |   79.13
```

> [!WARNING]
> Coverage of 76.80% overall is below the 80% target. Collectors at ~10% line coverage are barely tested (only offline-mode rejection is tested). `assessment.js` at 11.95% is effectively untested.

## Dependency Audit

**Status: FAIL** — 4 vulnerabilities found (3 moderate, 1 high). All in `apps/web > vite@5.4.21` and its transitive dep `esbuild@0.21.5`.

## Security Workflows

- `.github/workflows/ci.yml`: Exists. Covers frozen install, audit (prod only), build, test, gitleaks.
- **Missing**: No coverage artifact, no SBOM, no typecheck step, no integration/security regression suite.

---

## Critical Findings

### F1: NO CENTRALIZED POLICY ENGINE — SEVERITY: CRITICAL

**Status: NOT IMPLEMENTED**

`TargetPolicy` in `packages/core/src/policy.ts` validates targets with comprehensive IP blocking (RFC1918, link-local, metadata, multicast, loopback, CGNAT). However:

- The AI tool executors in `packages/ai/src/tools.ts` **DO NOT use TargetPolicy at all**. `argus_assess` only checks `args.url.startsWith('http')`. `argus_collect_http` and `argus_collect_dns` call collectors directly with zero validation.
- The MCP server in `apps/mcp/src/index.ts` calls `argusToolExecutors` directly — no policy gate.
- The CLI `assess` command in `apps/console/src/index.ts` calls `inspectPublicTarget()` which does use `TargetPolicy`, but the AI and MCP paths bypass it entirely.
- **Collectors themselves** (`http.ts`, `dns.ts`) have zero IP/target validation — they only check `ARGUS_OFFLINE_MODE`.

### F2: NO SSRF PROTECTION IN AI/MCP PATH — SEVERITY: CRITICAL

**Status: NOT IMPLEMENTED**

Any LLM-generated tool call through the AI analyst or MCP server can request `argus_collect_http` with `http://169.254.169.254` or `http://127.0.0.1` and the collector will happily `fetch()` it. The TOCTOU/DNS rebinding scenario (resolve public, connect private) is unprotected in any path.

### F3: PROMPT INJECTION FILTERING IS STRING-MATCHING — SEVERITY: HIGH

**Status: INFERRED PROTECTION ONLY**

The `checkPolicy()` in `analyst.ts` lines 22-26 checks for `'; rm -rf'` and `'eval('` as literal substrings. This is trivially bypassable and should not be considered a security boundary.

### F4: EVAL SILENTLY FALLS BACK TO MOCK — SEVERITY: HIGH

**Status: BROKEN BY DESIGN**

`packages/eval/src/runner.ts` lines 89-94: if `fetch()` to Ollama fails, it silently falls back to `MockProvider`. The MockProvider is hardcoded to produce specific outputs that match expected test categories. This means the eval framework **measures the mock, not the model**. The 100% completion rate and 100% citation coverage in `EVAL_REPORT.md` are measurements of the mock's behavior, not AI behavior.

### F5: NO ED25519 SIGNING — SEVERITY: MEDIUM

**Status: NOT IMPLEMENTED**

Only SHA-256 hash integrity exists. No asymmetric signing, no key management, no `argus sign` command.

### F6: CITATION ENFORCEMENT IS PROMPT-ONLY — SEVERITY: HIGH

**Status: NOT IMPLEMENTED**

The system prompt in `analyst.ts` line 38 says "Every factual statement about a target MUST reference one or more evidence IDs". This is a prompt instruction, not a structural constraint. There is no post-processing validation, no schema enforcement, and no rejection of uncited claims.

### F7: NO REDACTION IN EXPORTED BUNDLES — SEVERITY: MEDIUM

**Status: PARTIAL**

`rules.ts` has `redactEvidence()` and `redactSensitiveHeaders()` functions with tests, but `saveBundle()` in `bundle.ts` does NOT call them. Bundles are saved with raw evidence including all header values.

### F8: AI OUTPUT IS FREE-FORM TEXT — SEVERITY: MEDIUM

**Status: NOT IMPLEMENTED**

No structured output schema. The analyst returns a plain string. No claim/evidence/finding structure.

### F9: NO OBSERVABILITY / TRACING — SEVERITY: MEDIUM

**Status: NOT IMPLEMENTED**

No structured trace logging, no request IDs in AI paths, no JSONL output.

### F10: RESPONSE SIZE LIMITS MISSING — SEVERITY: MEDIUM

**Status: NOT IMPLEMENTED**

HTTP collector follows redirects with no body size limit. DNS collector has no record count limit.

### F11: PII LEAD LISTS IN REPOSITORY ROOT — SEVERITY: HIGH

**Status: HYGIENE VIOLATION**

Untracked CSV files with real corporate and personal PII exist in the repo root: `LEADS_MADRID_COMPLETO.csv`, `leads_madrid_centro_100_SCANNED_REAL.csv`, `leads_madrid_centro_100.csv`. Additionally, `scan_batch.js` contains invented GDPR penalty claims violating the core assessment rules.

### F12: CRASH IN INSPECTOR FAILURE PATH — SEVERITY: MEDIUM

**Status: BUG**

In `packages/core/src/inspector.ts:99`, when `policy.validate(target)` fails, the handler executes `const url = new URL(target)`. If `target` is not a valid URL, this throws an unhandled `TypeError` and crashes instead of returning a clean error result.

---

## What Works Well

| Component | Assessment |
|---|---|
| Schema types (`@argus/schema`) | Comprehensive, well-structured |
| Canonical JSON + SHA-256 (`crypto.ts`) | Correct, tested, 92.5% coverage |
| Evidence integrity verification | Working, tested |
| Bundle integrity verification | Working, tested |
| Deterministic rules engine | 11 rules, pure functions, 95.58% coverage |
| Retest/proof comparison | Working, deterministic |
| TargetPolicy IP validation | Comprehensive but not universally enforced |
| Authorization model | Well-designed (scope, domains, assessment type) |
| Offline mode fail-closed | Correct in both collectors |
| MCP server structure | Correct stdio transport, proper tool listing |

---

## Classification Summary

| Capability | Status |
|---|---|
| Evidence SHA-256 integrity | **TESTED** |
| Bundle integrity verification | **TESTED** |
| Deterministic rules engine | **TESTED** |
| Canonical JSON serialization | **TESTED** |
| Target IP validation (policy.ts) | **TESTED** (via inspector) |
| Authorization scope model | **IMPLEMENTED** (not tested) |
| Offline mode fail-closed | **TESTED** |
| Retest/proof comparison | **TESTED** |
| AI analyst tool loop | **IMPLEMENTED** (not tested) |
| MCP server tool exposure | **IMPLEMENTED** (not tested) |
| Centralized PolicyEngine for all paths | **NOT IMPLEMENTED** |
| SSRF protection for AI/MCP | **NOT IMPLEMENTED** |
| DNS rebinding protection | **NOT IMPLEMENTED** |
| Redirect hop validation | **NOT IMPLEMENTED** |
| Ed25519 signing | **NOT IMPLEMENTED** |
| Structured AI output | **NOT IMPLEMENTED** |
| Citation enforcement (structural) | **NOT IMPLEMENTED** |
| Secret redaction in exported bundles | **NOT IMPLEMENTED** (function exists, not wired) |
| Real AI evaluation | **NOT IMPLEMENTED** (mock fallback) |
| Adversarial eval dataset (100+ cases) | **NOT IMPLEMENTED** (8 cases exist) |
| Research experiment variants | **NOT IMPLEMENTED** |
| Ablation studies | **NOT IMPLEMENTED** |
| Observability/tracing | **NOT IMPLEMENTED** |
| SBOM generation | **NOT IMPLEMENTED** |
| Coverage thresholds enforced | **NOT IMPLEMENTED** |
| Branch protection | **NOT IMPLEMENTED** |
| Response size limits | **NOT IMPLEMENTED** |
| Input size validation on tool args | **NOT IMPLEMENTED** |
