# Lucas Desktop Client & Local API Server

## Stack
- Desktop: Tauri 2 + React + TypeScript + Vite
- Local backend: Node.js + Express on `0.0.0.0:8787`

## Run
1. `npm install`
2. `npm run dev`

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
