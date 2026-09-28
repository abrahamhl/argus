# ARGUS Demo Report

## Target: example-business.nl

### Findings:
- [MEDIUM] Missing HSTS Header
- [MEDIUM] Missing Content-Security-Policy
- [LOW] Missing X-Content-Type-Options Header
- [LOW] Missing Referrer-Policy Header
- [LOW] Missing Frame Protection (Clickjacking)
- [LOW] Weak SPF Record (~all or +all)
- [LOW] DMARC Policy Set to None

### Retest Proofs:
- [RESOLVED] The issue identified by rule rule-http-missing-hsts was not detected in the retest and relevant verification evidence was observed.
- [RESOLVED] The issue identified by rule rule-http-missing-csp was not detected in the retest and relevant verification evidence was observed.
- [RESOLVED] The issue identified by rule rule-http-missing-x-content-type-options was not detected in the retest and relevant verification evidence was observed.
- [RESOLVED] The issue identified by rule rule-http-missing-referrer-policy was not detected in the retest and relevant verification evidence was observed.
- [RESOLVED] The issue identified by rule rule-http-missing-frame-protection was not detected in the retest and relevant verification evidence was observed.
- [RESOLVED] The issue identified by rule rule-dns-weak-spf was not detected in the retest and relevant verification evidence was observed.
- [RESOLVED] The issue identified by rule rule-dns-dmarc-p-none was not detected in the retest and relevant verification evidence was observed.
