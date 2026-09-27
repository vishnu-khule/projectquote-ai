# AI Proposal & Estimation Generator — Documentation

Architecture and product docs for **ProjectQuote AI**. Implementation follows these documents; code lives in `apps/` and shared types in `packages/schemas`.

## Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [Product requirements](./01-product-requirements.md) | Vision, personas, principles |
| 2 | [Functional requirements](./02-functional-requirements.md) | Features by module |
| 3 | [Non-functional requirements](./03-non-functional-requirements.md) | Performance, security, compliance |
| 4 | [User journeys](./04-user-journeys.md) | End-to-end flows |
| 5 | [System architecture](./05-system-architecture.md) | Services, queues, storage |
| 6 | [AI architecture](./06-ai-architecture.md) | Agents, orchestrator, RAG |
| 7 | [Data architecture](./07-data-architecture.md) | ER model, versioning |
| 8 | [Agent architecture](./08-agent-architecture.md) | Agent roles and tools |
| 9 | [API architecture](./09-api-architecture.md) | REST + SSE, OpenAPI index |
| 10 | [Database schema](./10-database-schema.md) | Prisma-oriented tables |
| 11 | [Frontend architecture](./11-frontend-architecture.md) | Routes, state, UI modules |
| 12 | [Backend architecture](./12-backend-architecture.md) | Nest modules |
| 13 | [Security architecture](./13-security-architecture.md) | Auth, isolation, untrusted docs |
| 14 | [Infrastructure](./14-infrastructure-architecture.md) | Docker, deploy, observability |
| 15 | [Development roadmap](./15-development-roadmap.md) | Phases 0–18 |
| 16 | [MVP scope](./16-mvp-scope.md) | What ships first |
| 17 | [Implementation tickets](./17-implementation-tickets.md) | Epic → story breakdown |
| 18 | [AI prompts](./18-ai-prompts.md) | Agent system prompts v1 |
| 19 | [Testing strategy](./19-testing-strategy.md) | Unit, E2E, AI eval |
| 20 | [Deployment strategy](./20-deployment-strategy.md) | CI/CD, environments |

## Assumed defaults (MVP)

Documented in [decisions/defaults.md](./decisions/defaults.md).
