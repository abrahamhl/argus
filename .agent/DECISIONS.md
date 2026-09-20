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

## ADR-004: AI Sandboxing & Policy Gate Boundary
- **Status**: ACCEPTED
- **Decision**: AI models are excluded from the evidence collection and deterministic rule evaluation paths. The AI Analyst adapter is bounded by a PolicyGate: AI cannot assign `VERIFIED` confidence (strictly clamped to `INFERRED`), and claims lacking direct evidence references are dropped.
- **Consequence**: Zero AI hallucinations or fabricated CVEs in client reports.

## ADR-005: Recursive Secret Redaction & Sanitized Bundle Exports
- **Status**: ACCEPTED
- **Decision**: All evidence storage and bundle exports recursively scrub sensitive keys (`authorization`, `cookie`, `set-cookie`, `x-api-key`, `password`, `token`). Export bundles omit raw response payloads while retaining SHA-256 integrity hashes.
- **Consequence**: Prevents inadvertent credential leakage when sharing assessment bundles with third-party clients.

## ADR-006: Zero-Dependency Browser-Printable HTML Reports
- **Status**: ACCEPTED
- **Decision**: Client and engineering reports are self-contained HTML documents with embedded CSS, zero external fonts, zero external CDNs, and zero JavaScript dependencies. Styled with print media queries (`@media print`) for clean PDF generation via native browser print.
- **Consequence**: 100% offline report generation without requiring heavyweight native headless browser binaries.
