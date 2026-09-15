# ARGUS Threat Model

## Arbitrary Target URLs
ARGUS accepts URLs provided by users to perform its inspections. A malicious operator could provide URLs leading to unintended locations. 

## SSRF, Private/Loopback/Link-local Addresses
ARGUS must prevent Server-Side Request Forgery (SSRF) and avoid connecting to loopback (`127.0.0.0/8`), private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), or link-local (`169.254.0.0/16`) addresses to protect internal network segments from being scanned or attacked.

## Malicious HTTP Responses
The target server may return maliciously crafted HTTP responses (e.g., extremely large headers, compressed bombs) intended to cause Denial of Service (DoS) or exploit parser vulnerabilities in ARGUS collectors.

## Malicious Adapter Output
Adapters or collectors might produce unexpected, malformed, or hostile output. The core engine must be resilient to anomalous observations and handle them gracefully without crashing or creating invalid evidence.

## Compromised Dependency
A compromised NPM dependency (supply chain attack) could introduce malicious code into ARGUS, leading to data exfiltration, arbitrary code execution, or evidence tampering.

## Secret Leakage
The tool could accidentally log, store, or output sensitive data (e.g., API keys or authentication tokens) observed in HTTP headers or DNS records. Redaction of sensitive material before it becomes evidence is critical.

## Evidence Tampering
To ensure non-repudiation, evidence must be immutable. Tampering with evidence after it's generated (e.g., altering `rawValue`) would invalidate the trust model. Cryptographic hashing of evidence upon creation provides a verifiable integrity check.

## LLM Prompt Injection for Future AI Adapters
If LLMs are integrated for presentation or opportunity mapping, they must be isolated from raw observations. Raw, untrusted input from a target could contain prompt injection payloads designed to manipulate AI-generated reports.

## MCP Capability Abuse
If Model Context Protocol (MCP) or other tool-calling mechanisms are introduced, excessive permissions or uncontrolled execution paths could allow an attacker to compromise the operator's machine.

## Malicious .argusbundle Files
Future implementations importing `.argusbundle` files must treat them as untrusted input. Maliciously crafted bundles could lead to path traversal, arbitrary file writes, or cross-site scripting (XSS) in the web presentation layer.
