# Phase 2 delivery notes

## Shipped

- **Basic / Modern / Premium** — `POST /projects/:id/estimate/tiers/generate` applies configurable `priceUpliftPercent` from `config/project-types/*.json`
- **Validation engine** — `POST /projects/:id/validate` (rules + totals check); blocks **approve** and **share** when `BLOCKED`
- **RAG-lite** — document chunks indexed on processing; chat retrieves relevant chunks by keyword overlap
- **Price catalog** — `GET/POST /catalog/items` per organization

## Migrate

```bash
pnpm --filter @projectquote/api db:migrate
```

Migrations: `20260327010000_ai_chat` through `20260327040000_phase2`.
