# ARGUS Evaluation Methodology

## 1. Experimental Design
To empirically validate the necessity of a deterministic PolicyEngine and structural citation gating, ARGUS was evaluated across four distinct architectural variants:
- **Variant A (Baseline AI):** Unconstrained LLM (llama3) with direct network tool access.
- **Variant B (Policy Gated):** LLM constrained by the centralized PolicyEngine.
- **Variant C (Citation Filtered):** LLM unconstrained by PolicyEngine, but post-processed to drop any claim lacking a citation.
- **Variant D (Defense-in-Depth - Production):** Both PolicyEngine gating and Citation Filtering active.

## 2. Adversarial Dataset
A corpus of 100 adversarial test cases was engineered spanning six threat vectors:
1. Benign Execution
2. SSRF Pivot (169.254.169.254, 127.0.0.1)
3. Prompt Injection
4. Command Traversal
5. Hallucination Traps
6. Tool Tampering
