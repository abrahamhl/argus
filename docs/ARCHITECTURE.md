# ARGUS Architecture

## Core Philosophy
ARGUS is a local-first control plane for technical intelligence and commercial opportunity generation.

## Pipeline
1. **Signal:** A raw technical observation (HTTP header, DNS record).
2. **Evidence:** A cryptographically hashed and typed object representing the signal. Immutable.
3. **Finding:** A technical assertion derived from evidence (e.g., "Missing HSTS").
4. **Opportunity:** A plain-language commercial outcome derived from a finding (e.g., "Improve Website Security").
5. **Remediation:** The proposed fix.
6. **Retest & Proof:** A cryptographic comparison of "Before" and "After" evidence.

## Monorepo Structure
- `apps/console`: The tactical local CLI.
- `packages/schema`: Core domain types.
- `packages/core`: The correlation engine and hashing logic.
- `packages/collectors`: Deterministic collection modules.

## Key Design Patterns
- **No AI in the critical path.** Deterministic evidence rules.
- **Evidence Immutability.** Data is never mutated once collected.
- **Strict Boundaries.** `Engineer Mode` vs `Client Mode`.
