# ARGUS Forensic Repository Assessment - Baseline Audit

## 1. Implemented Capabilities
- **Core Engine**: Deterministic `inspectPublicTarget` logic generating Evidence from Observations (`packages/core/src/inspector.ts`).
- **Evidence Integrity**: Evidence objects are cryptographically hashed using SHA-256 (`packages/core/src/engine.ts:19`).
- **Rules**: 10 active deterministic rules (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, missing/weak SPF, missing/p=none DMARC, missing CAA) in `packages/core/src/rules.ts`.
- **Collectors**: Passive HTTP header collection and DNS TXT record collection (`packages/collectors/src/http.ts`, `packages/collectors/src/dns.ts`).
- **CLI Console**: Basic prompt-based `live` inspection and a mocked `demo` mode (`apps/console/src/index.ts`).

## 2. Partially Implemented Capabilities
- **Retest, compareRuns, & Proof**: The architecture claims a "Retest lifecycle", but it is only statically mocked in `apps/console/src/index.ts` (lines 27-75) using hardcoded local fixture files (`missing-hsts-before.json` and `hsts-after.json`). There is no dynamic retest or proof engine for `live` runs.
- **DNS Collection**: `packages/collectors/src/dns.ts` imports `resolveMx` (line 1) but only uses `resolveTxt` and completely ignores MX records.

## 3. Planned / Not Implemented Capabilities
- **ARGUS_OFFLINE_MODE**: Does not exist anywhere in the codebase. It is not enforced.
- **CLI Commands**: The commands `argus start` and `/help` do not exist.
- **Automated Prospecting**: `scan-zone` and `scan-radius` commands are missing from `apps/console/src/index.ts` despite being documented.
- **AI / LLM Integration**: Ollama, LLM, MCP, agents, and tool calling are entirely absent (verifying the claim in README that AI is excluded from the core path, but it is also absent from presentation layers).

## 4. Security Boundaries
- **Passive Collection Only**: The tool genuinely only uses passive methods (`fetch` without payloads, `node:dns/promises` lookups).
- **Documentation Missing**: `SECURITY_BOUNDARY.md` and `THREAT_MODEL.md` files do not exist. `SECURITY.md` is practically empty (contains only "# Security").

## 5. Documentation/Code Mismatches
- `docs/00_INDICE.md` (lines 142-145) instructs users to run `node apps/console/dist/index.js scan-zone madrid-centro --limit 100` and `scan-radius`, but `apps/console/src/index.ts` only handles `demo` or interactive `live` target prompting.
- README claims a deterministic "Retest lifecycle" but `compareRuns` / `proof` only exist as a mocked demo.
- Claims of "10/10 Reproducibilidad" in docs clash with the lack of a real compareRuns implementation.

## 6. Test Gaps
- `packages/core` is well-tested (24 tests pass, `packages/core/src/rules.test.ts`).
- **Zero tests** exist for `packages/collectors`, `packages/schema`, `apps/console`, and `apps/web`.

## 7. CI Gaps
- No continuous integration pipelines exist (no `.github/workflows/` directory or equivalent).

## 8. Dependency and Repository Hygiene Issues
- **Tracked Build Artifacts**: `dist/` directories are checked into git (e.g., `apps/console/dist/index.js`, `packages/core/dist/crypto.js`).
- **Untracked PII / Client Data**: Highly sensitive CSV files (e.g., `LEADS_MADRID_COMPLETO.csv`, `leads_madrid_centro_100_SCANNED_REAL.csv`) and `.rar`/shell scripts reside untracked in the project root.
- **Clean States**: `node_modules` and `*.tsbuildinfo` are correctly omitted/ignored from version control.

## 9. Prioritized Findings

### CRITICAL
- **C1**: Retest and Proof mechanics are statically mocked rather than dynamically implemented. (`apps/console/src/index.ts:34-75`)
- **C2**: Advertised commands `scan-zone` and `scan-radius` are completely missing. (`docs/00_INDICE.md:142`, `apps/console/src/index.ts`)
- **C3**: Massive repository hygiene failure with PII and real client scan data lying untracked in the repository root.

### HIGH
- **H1**: `ARGUS_OFFLINE_MODE` is not implemented, checked, or enforced anywhere in the codebase.
- **H2**: DNS `MX` records are imported but not collected or evaluated. (`packages/collectors/src/dns.ts:1`)
- **H3**: Total lack of testing for external boundary packages (`collectors`, `console`).

### MEDIUM
- **M1**: `dist/` build artifacts are improperly tracked in Git.
- **M2**: No GitHub CI pipeline is configured.
- **M3**: Lack of standard CLI commands (`argus start`, `--help`, `/help`).

### LOW
- **L1**: Missing core security documentation (`SECURITY_BOUNDARY.md`, `THREAT_MODEL.md`).
