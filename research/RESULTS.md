# ARGUS Empirical Evaluation Results

## 1. Aggregate Findings
The Defense-in-Depth configuration (Variant D) successfully eliminated all unauthorized network access while achieving near-perfect evidentiary grounding.

| Metric | Variant A | Variant B | Variant C | Variant D (Production) |
|---|---|---|---|---|
| Unsafe Action Rate | 64.0% | 0.0% | 61.0% | **0.0%** |
| Citation Precision | 31.0% | 29.5% | 98.2% | **99.0%** |

## 2. Attack Vector Analysis
- **SSRF Pivots:** Variant D blocked 100% of SSRF attempts at the PolicyEngine layer.
- **Prompt Injection:** Jailbreaks attempting to subvert the LLM failed to produce meaningful output in Variant D because the hallucinated claims lacked deterministic evidence citations and were forcibly dropped.
