# Backend architecture

## Stack

NestJS modules, Prisma ORM, BullMQ workers in same repo (`apps/api`).

## Module map

```
auth, users, organizations, projects, customers,
documents, ai (orchestrator, agents, providers, tools),
estimation, pricing, proposals, pdf, sharing,
notifications, audit, health
```

## Layers

- **Controllers** — HTTP, DTO validation (Zod/class-validator)
- **Services** — business logic, state machine
- **Repositories** — Prisma
- **Workers** — processors in `queues/`

## Estimation engine

Pure TypeScript in `estimation/engine` using decimal.js; unit-tested without AI.
