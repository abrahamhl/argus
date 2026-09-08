# ARGUS V0.1 — Vercel Deployment Guide

## Overview
This document outlines the deployment process for ARGUS V0.1 to Vercel, ensuring a strict "PUBLIC_PASSIVE" integration and tight security boundaries.

## Architecture
- **Frontend**: PWA hosted on Vercel Edge Network (`apps/web/dist`).
- **Backend API**: Vercel Serverless Functions (`api/` directory).
- **Core Logic**: Sourced from `packages/core` and `packages/collectors`.

## Security & Constraints
1. **No Target Persistence**: For V0.1, the database is intentionally omitted. No targets are stored.
2. **Same-Origin Constraint**: The API strictly relies on same-origin (no wildcard CORS).
3. **Strict Headers**: Configured in `vercel.json` to include CSP, nosniff, frame-protection, etc.
4. **No Telemetry**: Absolutely no external trackers or analytics are bundled.
5. **Secrets**: No secrets are committed; do not use `.env` files in source control.

## Deployment Steps
1. Install dependencies via Corepack and pnpm:
   ```bash
   corepack enable
   pnpm install
   ```
2. Link to Vercel (first time only):
   ```bash
   pnpm vercel link
   ```
3. Deploy:
   ```bash
   pnpm vercel --prod
   ```

## Production Verification
- Verify `GET /api/health` returns `{"status": "ok", "mode": "PUBLIC_PASSIVE"}`.
- Verify `POST /api/inspect` successfully processes mock demo data.
- Check headers (`curl -I <DEPLOY_URL>`) for `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options`.
