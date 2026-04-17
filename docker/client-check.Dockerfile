FROM node:22-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/desktop/package.json apps/desktop/package.json

RUN npm ci --include-workspace-root=false --workspace apps/server --workspace apps/desktop

COPY apps apps

RUN npm run build

CMD ["bash", "-lc", "echo client+server workspace build check passed"]
