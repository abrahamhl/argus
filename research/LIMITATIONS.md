# ARGUS Limitations & Research Boundaries

## 1. Context Window Exhaustion
Current LLMs used in the analyst tier may experience context window exhaustion or "needle in a haystack" retrieval failures when processing exceptionally large DNS zone files or HTTP responses.

## 2. Deterministic Rule Coverage
The deterministic engine is deliberately scoped to passive observation. It currently supports 11 pure functions checking RFC compliance (HSTS, CSP, SPF, DMARC). It does not execute JavaScript, evaluate TLS cipher suites, or crawl unlinked paths.

## 3. TOCTOU Conditions
Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding is mitigated by strict caching in the PolicyEngine during the execution of a single run, but remains a fundamental limitation of decoupled network architectures across multiple disparate runs.
