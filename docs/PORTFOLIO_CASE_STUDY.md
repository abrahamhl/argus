# ARGUS: Portfolio Case Study

**Architecture:** Deterministic Control Plane, Local-First, Ed25519 Cryptography, Model Context Protocol (MCP)

## 1. Problem Context
Commercial scanners flood engineers with probabilistic false positives and hallucinated AI security claims. Remediation is subjective and requires unpredictable rescanning.

## 2. The ARGUS Thesis
Security value comes from observing deterministic system states, evaluating pure rule functions, and mathematically proving remediation. AI is relegated to a sandboxed presentation layer governed by a deterministic Policy Gate.

## 3. Architecture
Raw Network -> PolicyEngine -> Passive Collector -> Canonical Evidence -> Deterministic Rules -> Findings -> Retest Proof. 
AI Analysts operate via an MCP server that explicitly drops any synthesized claim lacking a deterministic evidence citation.

## 4. Retest & Proof Engine
Remediation is proven mathematically by comparing finding IDs across a Baseline Run A and a Retest Run B. Results are captured in an .argusbundle and cryptographically signed via Ed25519, ensuring chain of custody and non-repudiation.
