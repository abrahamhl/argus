# FIVE REVIEWER AUDIT

**Date:** 2026-09-07
**Project:** ARGUS

Before laying down the technical foundation, the ARGUS concept was subjected to a simulated review by five distinct technical personas to challenge its assumptions, identify fake sophistication, and distill the architecture to its highest leverage points.

---

## 1. Reviewer A: Staff Product Engineer

**Perspective:** Focuses on user outcomes, time-to-value, and maintainability.

*   **What is unnecessary?** A full React/Next.js SPA for the initial CLI/Console. The product is meant for local tactical use. Complex state management for a single local user is overkill for v0.1.
*   **What is missing?** A clear fixture-based test harness that simulates the "business walk" scenario end-to-end without needing a live network connection, guaranteeing the core logic is verifiable instantly.
*   **What is fake sophistication?** Trying to build a "commercial opportunity engine" that does automatic pricing or complex CRM routing. The MVP only needs to map a technical finding to a plain-language service category.
*   **What would make me reject the repository?** If I have to configure Docker, PostgreSQL, or a cloud account just to parse a domain's HTTP headers.
*   **Highest leverage decision:** Defining the strict pipeline (`Signal -> Evidence -> Finding -> Opportunity`). If this data structure is solid, the UI can be rewritten a dozen times without touching the core engine.

---

## 2. Reviewer B: Senior Cybersecurity Engineer

**Perspective:** Focuses on integrity, precision, and threat modeling.

*   **What is unnecessary?** Offensive tools (SQLMap, Nmap aggressive scans, Metasploit integration) in the bootstrap. They create massive liability and noise.
*   **What is missing?** Cryptographic hashing (SHA-256) of raw collection outputs *before* normalization. If the raw data isn't hashed, the evidence chain is broken.
*   **What is fake sophistication?** AI summarization of vulnerabilities. An LLM hallucinating a severity rating or remediation step destroys trust. Keep AI entirely out of the primary evidence chain.
*   **What would make me reject the repository?** Executing arbitrary third-party adapter scripts without a sandbox or strict capability manifest.
*   **Highest leverage decision:** The `Confidence Model` (Verified, Supported, Inferred, Unknown, Contradicted) and `Evidence Integrity` tracking. This separates professional tools from script-kiddie scanners.

---

## 3. Reviewer C: Open-Source Maintainer

**Perspective:** Focuses on developer experience, dependency hygiene, and community adoption.

*   **What is unnecessary?** A massive monorepo with 20 empty packages for "future" adapters. We only need `core`, `collectors` (HTTP/DNS), `schema`, and the `cli`/`console`.
*   **What is missing?** A strict `DEPENDENCY_POLICY.md` enforced by CI. The JavaScript ecosystem is notoriously vulnerable to supply-chain attacks.
*   **What is fake sophistication?** Building a custom plugin system with dynamic module loading (e.g., executing remote JS). Adapters should be simple CLI wrappers or statically linked in MVP.
*   **What would make me reject the repository?** Mixed package managers, missing lockfiles, or a `package.json` with 50 unvetted dependencies.
*   **Highest leverage decision:** The absolute rule: `pnpm` only, pinned by Corepack, with zero casual dependencies. This signals immediate discipline to any serious contributor.

---

## 4. Reviewer D: Defence / Intelligence Systems Engineer

**Perspective:** Focuses on provenance, uncertainty, data fusion, and auditability.

*   **What is unnecessary?** Real-time situational awareness dashboards for a single target. The operator needs a static, point-in-time assessment to make a decision, not a flashing SOC screen.
*   **What is missing?** Explicit modeling of the `Run` context (Timestamp, OS, Tool Versions, Configuration). Without this, reproducibility is impossible.
*   **What is fake sophistication?** Using Neo4j or a heavy graph database. The entity relationships for a single business assessment fit comfortably in memory and can be serialized to a JSON graph.
*   **What would make me reject the repository?** Modifying or "updating" evidence objects. Evidence must be immutable and append-only.
*   **Highest leverage decision:** Treating AI as an "Analyst Adapter" rather than the core brain. It ensures the system degrades gracefully to deterministic truth if the AI fails or hallucinates.

---

## 5. Reviewer E: Small-Business Technical Consultant (Abraham's Client Proxy)

**Perspective:** Focuses on comprehensibility, actionable next steps, and commercial viability.

*   **What is unnecessary?** CVE numbers, CVSS scores, or technical jargon in the client mode. The client doesn't care about "HTTP Strict Transport Security"; they care about "Trust & Privacy."
*   **What is missing?** A clear "Before/After" (Retest) proof mechanism. If I can't prove I fixed it, I can't sell the remediation confidently.
*   **What is fake sophistication?** A 50-page PDF report. The client only needs to see the top 3 critical issues affecting their business right now.
*   **What would make me reject the repository?** If the "Client Mode" translates technical terms poorly via automated translation instead of using deterministic, crafted localization strings (e.g., solid Dutch terminology).
*   **Highest leverage decision:** The strict separation between `Engineer Mode` and `Client Mode`. It allows the tool to be extremely technical internally while remaining commercially viable externally.

---

## SYNTHESIS & FINAL ARCHITECTURE DIRECTIVES

The architecture that survives this review:

1.  **Data Structure is King:** The core is a set of TypeScript types and pure functions defining the immutable pipeline: `Target -> Run -> Observation -> Evidence -> Finding -> Opportunity -> Remediation -> Retest -> Proof`.
2.  **Zero-Fat Monorepo:** A strict `pnpm` workspace containing only `apps/console`, `packages/core`, `packages/schema`, and `packages/collectors`.
3.  **Dependency Asceticism:** No ORMs, no graph databases, no complex SPA frameworks for the CLI. Native Node/TypeScript capabilities where possible.
4.  **Evidence Immutability:** Every observation generates an ID and a hash. Derived findings reference these IDs.
5.  **Deterministic AI:** No LLM is in the critical path. AI is relegated to a future, optional analyst adapter.
6.  **Dual-Faced Output:** The system explicitly maps technical findings to localized, commercially actionable opportunities.

**Verdict:** The product thesis is sound. The architecture is defensively scoped. We proceed to Phase 1 (Bootstrap).
