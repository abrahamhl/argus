# Argus Security Boundary

Argus is designed to operate on highly sensitive data. However, the local development and testing slice explicitly guarantees zero bleed into production.

## Zero-Exploit Policy
The local vertical slice is engineered to prove functionality without relying on real production exploits or credentials.
1. **Offline Mode:** The local environment forces `ARGUS_OFFLINE_MODE=true`, which hard-fails any attempt to hit external network APIs.
2. **Local DB:** We generate a deterministic `.local_data/db/argus_local.db` instead of proxying or tunneling to a staging database.
3. **Synthetic Fixtures:** `tools/create-local-environment.sh` writes strictly deterministic mock data. No real user telemetry, PII, or security incidents are ever loaded into the local slice.
