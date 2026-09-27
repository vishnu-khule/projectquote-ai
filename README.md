# ProjectQuote AI

AI-assisted **proposals and estimates** for trade professionals — with deterministic pricing, document intelligence, and human approval before customer delivery.

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 frontend |
| `apps/api` | NestJS API (bootstrap) + estimation engine |
| `packages/schemas` | Shared Zod contracts (API + AI) |
| `config/project-types` | Profession / project type rules |
| `docs/` | Architecture & product documentation (Steps 1–20) |

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9 (`corepack enable` or `npm i -g pnpm`)
- Docker ([Docker Desktop](https://www.docker.com/products/docker-desktop/) or [Colima](https://github.com/abiosoft/colima): `brew install colima docker docker-compose && colima start`)

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm --filter @projectquote/schemas build

# Postgres (pgvector) + Redis + MinIO — auto-fixes port 5432 conflicts (uses 5433)
pnpm infra:up

pnpm dev
```

Requires a running Docker daemon. `pnpm infra:up` starts **Postgres (pgvector) + Redis**, runs **`pnpm db:migrate:deploy`**, and writes `DATABASE_URL` to `.env`. If port **5432** is already in use (e.g. Homebrew PostgreSQL), Postgres is exposed on **5433** via `docker-compose.override.yml` (gitignored).

MinIO (document uploads) is optional: `docker compose --profile storage up -d`. If `minio/minio` pulls fail, log in to Docker Hub or use real S3 env vars from `.env.example`.

Manual: `docker compose up -d postgres redis` then `DATABASE_URL=postgresql://projectquote:projectquote@localhost:5433/projectquote pnpm db:migrate:deploy` when using the 5433 override.

- Web: http://localhost:3000  
- API health: http://localhost:4000/health  

**Local dev login** (auto-created on API start): username `vishnu`, password `vishnu` (stored as `vishnu@local.dev`). Not used in production.

Set `OPENAI_API_KEY` in `.env` for live AI and **vector RAG** (keyword fallback without it).

Optional: `PROPOSAL_LLM_NARRATIVE=true`, `AI_MONTHLY_BUDGET_CAP_CENTS`, `RATE_LIMIT_*`.

### API (Phase 1)

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| GET | `/auth/me` | Bearer |
| POST | `/projects` | Bearer |
| GET | `/projects` | Bearer |
| GET | `/projects/:id` | Bearer |
| PATCH | `/projects/:id` | Bearer |
| POST | `/projects/:id/status` | Bearer `{ "status": "..." }` |
| POST | `/projects/:id/documents` | Bearer multipart `file` |
| GET | `/projects/:id/documents` | Bearer |
| GET | `/documents/:id` | Bearer |
| GET | `/projects/:id/events` | Bearer SSE (document jobs) |
| GET | `/projects/:id/chat/messages` | Bearer |
| POST | `/projects/:id/chat` | Bearer `{ "message", "stream"? }` |
| GET | `/projects/:id/estimate` | Bearer (latest or null) |
| POST | `/projects/:id/estimate/generate` | Bearer draft lines + engine totals |
| PUT/PATCH/DELETE | `/estimates/:id/line-items` | Bearer |
| POST | `/estimates/:id/line-items/:itemId/confirm` | Bearer |
| POST | `/projects/:id/proposals/generate` | Bearer (requires confirmed estimate) |
| PATCH | `/proposals/:id/sections/:sectionId` | Bearer |
| POST | `/proposals/:id/approve` | Bearer |
| POST/GET | `/proposals/:id/pdf` | Bearer generate / download |
| POST | `/proposals/:id/share` | Bearer → customer URL |
| GET | `/shared/proposals/:token` | Public proposal view |
| GET | `/shared/proposals/:token/pdf` | Public PDF download |

Run migrations after Postgres is up:

```bash
pnpm --filter @projectquote/api db:migrate
```

## Documentation

Start at [docs/README.md](./docs/README.md). MVP boundaries: [docs/16-mvp-scope.md](./docs/16-mvp-scope.md).

## Principles

1. LLMs assist; **the estimation engine computes totals**.
2. Every AI-suggested price is **unconfirmed** until the user accepts it.
3. **Version** proposals, estimates, and AI prompt runs.

## License

Private / unlicensed — add your license before distribution.
