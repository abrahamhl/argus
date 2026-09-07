# JULES HANDOFF INSTRUCTIONS

**Project:** ARGUS
**Date:** 2026-09-07
**Objective:** Jules, your role is to accelerate the implementation of ARGUS based on this established architecture. You must not modify the underlying package structure, bypass the dependency policy, or rewrite the core without an explicit ADR (Architecture Decision Record) approved by Abraham.

## Rules of Engagement

1. **Package Manager:** `pnpm` ONLY. No `npm`, no `yarn`, no `bun`, no `dlx`. 
2. **Dependency Asceticism:** Do not add dependencies casually. If an implementation requires a new tool (e.g., a styling library for the console), you must document the request and wait for approval.
3. **Immutability:** Evidence objects must not be updated. They are append-only. Use the `hashValue` from `@argus/core` to generate their IDs.
4. **No Artificial Intelligence:** The core pipeline is deterministic. Do not inject LLMs into the collection or correlation phase.
5. **Final Head Rule:** No PR is complete until Abraham manually reviews the final HEAD SHA. Automatic merges are forbidden.

---

## PR Programme Queue

Please execute these sequentially. Do not combine them.

### PR-01: Core Schema & Evidence Integrity Check
**Scope:** Enhance the Evidence schema in `@argus/schema` and ensure that `engine.ts` fully validates the cryptographic integrity of an evidence array.
**Acceptance Criteria:**
- Evidence schema supports `metadata` tightly.
- `core/engine.ts` has a function `verifyEvidenceChain(evidence: Evidence[]): boolean`.
- Jest or Node native tests prove that modifying `rawValue` fails the hash check.
**Allowed Files:** `packages/schema/src/*`, `packages/core/src/*`

### PR-02: Filesystem Run Store
**Scope:** Implement a local JSON-based storage engine that saves the output of a Run.
**Acceptance Criteria:**
- Save a `.argusbundle` (JSON) containing the manifest, evidence, findings, and opportunities to `~/.argus/runs/`.
- No external databases. Use `node:fs`.
**Allowed Files:** `packages/core/src/store.ts`

### PR-03: HTTP + DNS Collectors Maturity
**Scope:** Expand the collectors.
**Acceptance Criteria:**
- HTTP collector captures `Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy`.
- DNS collector captures `MX`, `TXT`, and extracts DMARC/SPF specifically.
**Allowed Files:** `packages/collectors/src/*`

### PR-04: Correlation Rules
**Scope:** Add 5 explicit deterministic rules for the `engine.ts`.
**Acceptance Criteria:**
- Rule 1: Missing SPF/DMARC.
- Rule 2: Missing HSTS.
- Rule 3: Missing CSP.
- Rule 4: Redirect Loop detected (from HTTP collector).
- Tests for all rules.

### PR-05: Opportunity & Remediation Engine
**Scope:** Map the 5 new rules to localized Opportunities.
**Acceptance Criteria:**
- Add Dutch localization keys.
- Output deterministic Service Categories (`EMAIL_TRUST`, `SECURITY_HARDENING`).

### PR-06: Retest & Proof Engine
**Scope:** Implement `compareRuns(runA, runB): Proof[]`.
**Acceptance Criteria:**
- If finding X exists in runA but evidence in runB shows it is fixed, output `status: 'RESOLVED'`.
- Cryptographic link between before/after evidence IDs.

### PR-07: Tactical Console Shell Polish
**Scope:** Upgrade `apps/console` with a styled CLI interface inspired by vintage tactical menus.
**Acceptance Criteria:**
- Use ANSI escapes or a lightweight, zero-dependency visual formatter.
- No bulky libraries like `ink` unless explicitly approved via ADR.
- Include the `/help` command palette.

### PR-08: Operator / Engineer / Client Modes
**Scope:** Add a command `/mode [engineer|client]` in the console.
**Acceptance Criteria:**
- Engineer mode shows JSON dumps and hashes.
- Client mode shows only "Probleem", "Waarom dit belangrijk is", "Volgende stap" in Dutch.

### PR-09: Adapter SDK
**Scope:** Create the `AdapterManifest` and `AdapterOutput` types. Implement the transformation layer.
**Acceptance Criteria:**
- External JSON can be transformed into ARGUS Evidence with a declared `Confidence`.

### PR-10: Demo Lab & Fixtures
**Scope:** Build `fixtures/business-broken` and `fixtures/business-healthy`.
**Acceptance Criteria:**
- A local Node HTTP server that serves the fixtures.
- An end-to-end integration test that runs the CLI against the broken fixture, then the healthy fixture, and verifies the `Proof` object is `RESOLVED`.
