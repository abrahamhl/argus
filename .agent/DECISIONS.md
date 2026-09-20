# Architecture Decision Records (ADR)

## ADR-001: Offline First & Zero Mandatory Cloud Dependencies
- **Status**: ACCEPTED
- **Decision**: ARGUS executes core assessments, rule evaluation, opportunity mapping, and reporting 100% locally. No mandatory cloud APIs or telemetry.
- **Consequence**: Full privacy for Dutch SME targets and clients of AUX Design.

## ADR-002: Rejection of Fear-Based Selling & Fabricated Vulnerabilities
- **Status**: ACCEPTED
- **Decision**: Missing headers (like HSTS) or email policies (like DMARC) are reported factually as observable configuration gaps, not as GDPR violations or catastrophic breach threats.
- **Consequence**: Ethical commercial posture aligned with AUX Design's reputation.

## ADR-003: Deterministic Invariants Before Feature Expansion
- **Status**: ACCEPTED
- **Decision**: Build deterministic test suites testing evidence immutability, cryptographic hashing, and linkage before adding further collectors or UI components.
