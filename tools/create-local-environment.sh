#!/usr/bin/env bash
set -euo pipefail

# ARGUS LOCAL ENVIRONMENT SETUP
# Builds a clean, deterministic local environment with synthetic fixtures.
# Strictly isolated from production.

echo "Setting up Argus local vertical slice..."
mkdir -p .local_data/fixtures
mkdir -p .local_data/db

echo "Generating synthetic deterministic fixtures..."
cat << 'EOF' > .local_data/fixtures/test_user.json
{
  "id": "usr_local_123",
  "name": "Local Test User",
  "role": "admin",
  "capabilities": ["read", "write"]
}
EOF

cat << 'EOF' > .local_data/fixtures/test_policy.json
{
  "id": "pol_local_123",
  "type": "strict_boundary",
  "enforced": true
}
EOF

echo "Setting up local SQLite DB..."
# We use a purely local SQLite instance instead of a production-linked database
if command -v sqlite3 &> /dev/null; then
    sqlite3 .local_data/db/argus_local.db "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data JSON);"
    sqlite3 .local_data/db/argus_local.db "CREATE TABLE IF NOT EXISTS policies (id TEXT PRIMARY KEY, data JSON);"
    sqlite3 .local_data/db/argus_local.db "INSERT OR IGNORE INTO users (id, data) VALUES ('usr_local_123', '$(cat .local_data/fixtures/test_user.json)');"
    sqlite3 .local_data/db/argus_local.db "INSERT OR IGNORE INTO policies (id, data) VALUES ('pol_local_123', '$(cat .local_data/fixtures/test_policy.json)');"
else
    echo "Warning: sqlite3 not found, skipping local db creation. (JSON fixtures are ready for file-based fallback)."
fi

echo "Writing strictly-scoped local .env..."
cat << 'EOF' > .env.local
# LOCAL ONLY - DO NOT COMMIT
ARGUS_ENV=local
DATABASE_URL=sqlite:///.local_data/db/argus_local.db
# Explicit boundary: block external network calls in local mode
ARGUS_OFFLINE_MODE=true
EOF

echo "Local environment successfully created and isolated."
