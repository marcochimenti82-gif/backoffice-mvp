# Optional Dockerfile (Render can also run as Node service without Docker)
FROM node:20-slim

WORKDIR /app
COPY . /app
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

RUN pnpm install --frozen-lockfile
RUN pnpm --filter backoffice-api prisma:generate
RUN pnpm --filter backoffice-api build

ENV NODE_ENV=production
EXPOSE 10000

CMD ["sh", "-c", "pnpm --filter backoffice-api prisma:migrate:deploy && pnpm --filter backoffice-api start"]
