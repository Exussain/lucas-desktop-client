# Lucas Desktop Client & Local API Server

## Stack
- Desktop: Tauri 2 + React + TypeScript + Vite
- Local backend: Node.js + Express on `0.0.0.0:8787`

## Run
1. `npm install`
2. `npm run dev`

## Docker Validation
- `npm run docker:client-check`:
  Builds the full workspace inside Docker and verifies client/server compile.
- `npm run docker:server-up`:
  Starts the local API server container on `0.0.0.0:8787`.
- `npm run docker:server-down`:
  Stops containers created by the compose file.

Windows note:
- Docker improves reproducibility, but it does not guarantee runtime behavior on every Windows 11 machine.
- For release confidence, pair Docker checks with real Windows 11 smoke tests in CI/VM (install + launch + API connectivity).

## Build Windows x64
- Ensure Rust toolchain + Tauri prerequisites are installed.
- `npm run tauri:build`

## Environment
Create `apps/server/.env`:

```bash
PORT=8787
HOST=0.0.0.0
CACHE_ENCRYPTION_KEY_BASE64=<32-byte-key-base64>
ADMIN_PANEL_URL=https://your-admin.example.com
ADMIN_PANEL_TOKEN=<token>
MAHSA_SOURCES=https://mahsaalert.app/api/clusters,https://mahsaalert.app/api/layers
TELEGRAM_API_ID=<id>
TELEGRAM_API_HASH=<hash>
TELEGRAM_STRING_SESSION=<string-session>
```
