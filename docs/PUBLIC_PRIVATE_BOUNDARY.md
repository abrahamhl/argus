# ARGUS Public-Private Boundary & Perimeter Isolation

## 1. Executive Summary
ARGUS enforces an uncompromising, non-bypassable boundary separating public, safe-to-scan infrastructure from private, internal, and sensitive assets. It fails closed by default.

## 2. Taxonomy of Assets
- **Public Observable Assets:** DNS records and HTTP response headers. Permitted.
- **Private & Internal Assets:** RFC1918, ULA, Cloud Metadata (169.254), Loopback. Blocked and fail-closed unconditionally.

## 3. PolicyEngine Gate
The PolicyEngine sanitizes input length, strips credentials, checks IP filters, enforces fail-closed DNS resolution against rebinding, and strictly validates all redirect hops manually.

## 4. Redaction Boundaries
Private operator data (authorization cookies, API keys) encountered on public endpoints are recursively redacted in the evidence pipeline, replacing sensitive material with [REDACTED] prior to bundle export.
