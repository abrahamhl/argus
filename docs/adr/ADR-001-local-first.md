# ADR-001: Local-First Architecture

**Status:** Accepted
**Date:** 2026-09-07

## Context
ARGUS is designed for an operator conducting physical "business walks". Connectivity may be unstable, and client data privacy is paramount.

## Decision
The core execution model of ARGUS will be local. The application must not require a mandatory cloud backend or centralized database to operate. All state (Runs, Evidence, Findings) will be stored on the local filesystem.

## Consequences
- **Positive:** High privacy, zero infrastructure cost, works offline (for local targets).
- **Negative:** Synchronization between multiple operators requires future tooling (e.g., export/import of `.argusbundle`).
