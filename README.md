# Backoffice MVP (multi-tenant) — Tuttibrilli Enoteca + Pescheto Tenuta Chimenti

Monorepo **solo backoffice**, con 2 app deployabili separatamente su Render:
- `apps/api` → Express (BFF) + Prisma/Postgres
- `apps/web` → Next.js App Router + Tailwind + shadcn/ui + React Query

## Requisiti
- Node.js 20
- pnpm 9+
- Postgres (lo stesso DB del core, o un DB vuoto per sviluppo)

## Setup locale
```bash
pnpm install
cp .env.example .env
# Modifica DATABASE_URL e segreti
pnpm --filter backoffice-api prisma:generate
pnpm --filter backoffice-api prisma:migrate:dev
pnpm --filter backoffice-api prisma:seed
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:10000/health

Credenziali seed:
- Tuttibrilli: `admin@tuttibrilli.local` / `ChangeMe123!`
- Pescheto: `admin@pescheto.local` / `ChangeMe123!`

## Note architetturali (separazione dal centralino/core)
- Repo separata dal centralino
- Nessun webhook Twilio nel backoffice
- Comunicazione col core: **solo DB condiviso (MVP)** + adapter isolato per future core API (`apps/api/src/lib/coreCalendarAdapter.ts`)

## Render (due servizi dalla stessa repo)
Vedi sezione "Render deploy" nel messaggio che accompagna questo template.
