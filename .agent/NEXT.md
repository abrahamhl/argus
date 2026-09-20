# Next Actions

## Immediate Objective
Implement **02 Real Tests for Core Invariants**:
- Create `packages/core/src/invariants.test.ts`
- Implement deterministic tests for:
  1. Evidence immutability (`Object.freeze` / tamper detection)
  2. Evidence hash determinism (SHA-256 canonicalization)
  3. Finding → Evidence linkage
  4. Opportunity → Finding linkage
  5. Retest → Before/After linkage
  6. Confidence-state behavior (VERIFIED, SUPPORTED, INFERRED, UNKNOWN, CONTRADICTED)
  7. Offline-mode network blocking (zero network sockets when ARGUS_OFFLINE_MODE=true)

Verify by running:
```bash
pnpm --filter @argus/core build
pnpm --filter @argus/core test
```
Upon passing:
Commit -> Proceed immediately to **03 Scope/Authorization Gate**.
