# ARGUS

**Evidence & Opportunity Control Plane**

OBSERVE → PROVE → DECIDE → FIX → VERIFY

ARGUS turns heterogeneous digital signals into traceable evidence, correlated findings, understandable decisions, remediation actions and measurable before/after proof. It is designed to act as an intelligence control plane that bridges the gap between deep technical telemetry and local commercial utility.

---

## 60-Second Demo

```bash
# 1. Start ARGUS
argus start

# 2. Enter target domain
> [ NEW TARGET ] example.com

# 3. Observe the pipeline
> PUBLIC INSPECTION STARTED...
> COLLECTING HTTP SIGNALS...
> NORMALIZING TO EVIDENCE...
> CORRELATING FINDINGS...
> MAPPING TO COMMERCIAL OPPORTUNITIES...

# 4. Results
[ OPPORTUNITY ] Verbeter de Website Beveiliging (HSTS)
Category:       SECURITY_HARDENING
Complexity:     LOW
Business Value: Trust & Privacy
```

*(Terminal UI demonstration coming soon)*

---

## How ARGUS is Different

| Feature | Traditional Scanner | OSINT Framework | Kali Linux Environment | ARGUS |
| :--- | :--- | :--- | :--- | :--- |
| **Collection** | Automated active probing | Broad public data scraping | Manual/scripted specialist tools | Normalizes output from multiple deterministic collectors & adapters |
| **Specialist Testing** | Built-in | None | Best-in-class | **Delegated** (via Adapter SDK to external tools) |
| **Normalization** | Proprietary formats | Varies | Raw output | **Strict typed Evidence schema** with cryptographic hashes |
| **Cross-tool Correlation**| Limited | Basic graph linking | Manual | **First-class Engine** combining evidence from multiple sources |
| **Operator Workflow** | Scan & PDF | Data hoarding | Ad-hoc | **Target -> Evidence -> Finding -> Opportunity -> Retest** |
| **Remediation & Retest** | Rarely verifiable | N/A | N/A | **Cryptographic Before/After Proof generation** |
| **Client Presentation** | Technical jargon | Analyst reports | Terminal screenshots | **Dutch/Spanish plain-language opportunities** |

---

## Architectural Principles

- **Local-First:** ARGUS runs locally. No mandatory cloud accounts. No Docker required for bootstrap.
- **Evidence Immutability:** Observations are converted to Evidence. Evidence is hashed and immutable.
- **Deterministic Assessment:** AI is an optional analyst adapter, never in the critical path of fact-gathering.
- **Package Discipline:** Strictly `pnpm` only. Zero casual dependencies.
- **Clear Demarcation:** `Engineer Mode` for traces and hashes; `Client Mode` for plain-language Dutch commercial opportunities.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Dependency Policy](DEPENDENCY_POLICY.md)
- [License Strategy](LICENSE_STRATEGY.md)
- [Security](SECURITY.md)
- [Threat Model](THREAT_MODEL.md)

---
*ARGUS is operational software.*
