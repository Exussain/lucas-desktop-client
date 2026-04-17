FROM node:22-bullseye-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/desktop/package.json apps/desktop/package.json

RUN npm ci --include-workspace-root=false --workspace apps/server --workspace apps/desktop

COPY apps/server apps/server

WORKDIR /app/apps/server
RUN npm run build

EXPOSE 8787

CMD ["node", "dist/index.js"]
