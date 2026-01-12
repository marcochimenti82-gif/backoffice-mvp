# Optional Dockerfile (Render can also run as Node service without Docker)
FROM node:20-slim

WORKDIR /app
COPY . /app
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

RUN pnpm install --frozen-lockfile
RUN pnpm --filter backoffice-web build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter backoffice-web start"]
