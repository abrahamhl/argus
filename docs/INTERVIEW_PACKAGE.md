# ARGUS Technical Interview Package

## The 30-Second Elevator Pitch
"Traditional vulnerability scanners drown teams in false positives and cannot cryptographically prove remediation. I built ARGUS to solve this. ARGUS is a local-first evidence control plane that guarantees zero false positives by strictly separating deterministic ground truth from sandboxed AI. Network signals are hashed into immutable SHA-256 evidence, evaluated via pure functions, and packaged into Ed25519-signed bundles. AI operates purely as a sandboxed analyst, restricted by a Policy Gate that drops any claim lacking a deterministic citation."

## The 5-Minute Deep Dive
- **Passive-Only Ground Truth:** Zero fuzzing, strictly passive HTTP/DNS collection.
- **PolicyEngine SSRF Defenses:** Fail-closed DNS, active IP range filtering, manual redirect tracing.
- **Ed25519 Retest Proofs:** Remediation is a set-theoretic comparison of before-and-after cryptographic runs.
- **AI Safety & Bounding:** Post-processing structural claim verification drops hallucinations at the JSON AST level.
