# ARGUS: Deterministic Intelligence & Opportunity Control Plane

## PROBLEM
The security market is saturated with automated vulnerability scanners that output massive volumes of low-confidence alerts. These tools often rely on "AI" to guess severity or interpolate missing context, leading to non-actionable findings and eroded trust between operators, engineers, and clients. 

## INSIGHT
Security value is not created by running aggressive payloads; it is created by observing deterministic states, linking them immutably to evidence, and tracing that evidence to a specific business opportunity. The pipeline must be: **Observe → Prove → Decide → Fix → Verify**.

## DESIGN DECISION
I designed ARGUS as a passive intelligence control plane that structurally forbids hallucinatory or probabilistic findings in the core evidence path. An observation must yield an immutable piece of evidence (complete with SHA-256 hashes of the exact raw response), which a deterministic rule evaluates to produce a finding.

## ARCHITECTURE
ARGUS uses a monorepo (pnpm workspace) containing isolated domains:
- `@argus/schema`: The pure data contracts (Observation, Evidence, Finding, Proof).
- `@argus/core`: The deterministic rule engine and policy logic.
- `@argus/collectors`: The network edge (HTTP, DNS) that safely yields Observations.
- `@argus/console` & `@argus/web`: The presentation layers.

This clean separation ensures the CLI and the Web PWA can share the exact same deterministic models without coupling to each other.

## WHY DETERMINISTIC EVIDENCE
By hashing the exact HTTP headers or DNS records returned, ARGUS guarantees provenance. If a client disputes a finding, the operator has the cryptographically hashed raw observation that triggered the rule.

## WHY AI IS NOT THE SOURCE OF TRUTH
AI is excellent at translating technical reality into business context (e.g., converting "Missing HSTS" into a localized client brief), but terrible at establishing ground truth. ARGUS isolates AI outside the critical evidence path. The engine provides the facts; AI only formats the presentation layer.

## BEFORE / AFTER PROOF
The most critical feature of ARGUS is the Retest UX. The architecture treats the "before" state and the "after" state as discrete, immutable runs. Proof is derived simply by comparing the evidence hash of Run A against Run B through a comparison rule, mathematically demonstrating remediation.

## SECURITY BOUNDARIES
- **Public Passive Only:** ARGUS does not generate intrusive traffic.
- **Local-First Processing:** Evidence mapping and rules run locally.
- **No Wildcard CORS / Strict CSP:** Enforced in the Vercel edge deployment.

## TRADEOFFS
- **Speed vs Context:** A full headless browser collector yields more context but sacrifices the near-instant performance of raw HTTP/DNS collectors. ARGUS optimizes for speed and stability first.
- **Strict Rules vs Coverage:** Writing deterministic rules for every edge case is slower than asking an LLM "is this secure?". However, the zero-false-positive guarantee is worth the initial lack of coverage.

## WHAT I WOULD BUILD NEXT
- **Trust Graph Expansion:** Mapping the exact supply chain (DNS Provider -> CDN -> Hosting -> Third Party Scripts) into a unified visual graph.
- **Cryptographic Signing:** Signing the final Proof object with a local private key to create a non-repudiable audit trail for compliance frameworks like NIS2.
