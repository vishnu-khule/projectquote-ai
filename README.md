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
- Docker (Postgres + Redis + MinIO)

## Quick start

```bash
cp .env.example .env
docker compose up -d

pnpm install
pnpm --filter @projectquote/schemas build

pnpm dev
```

- Web: http://localhost:3000  
- API health: http://localhost:4000/health  

Set `OPENAI_API_KEY` in `.env` when implementing AI modules.

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
