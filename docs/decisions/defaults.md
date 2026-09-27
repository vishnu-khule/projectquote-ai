# MVP default decisions

These defaults unblock implementation. Change via org settings or env where noted.

| Decision | MVP default |
|----------|-------------|
| Tenancy | Multi-tenant SaaS (`organizations` + members) |
| Region / tax | India-first: `IN`, `INR`, GST label configurable per org |
| Units | Org preference: metric or imperial; per-project override |
| Language | English UI only |
| Auth | Email + password; Google OAuth in Phase 1.5 |
| AI provider | OpenAI (`AI_PROVIDER=openai`); abstraction for others |
| Document MVP | Text PDF, XLSX/CSV, images (metadata + OCR queue); diagrams Phase 3 |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 15 (App Router), Tailwind, TanStack Query, Zustand |
| Backend | NestJS, Prisma, PostgreSQL + pgvector, BullMQ + Redis |
| Storage | S3-compatible (MinIO local, S3/R2 prod) |
| Realtime | SSE for job status + AI chat streaming |
| Proposal tiers | Single tier in Phase 1; Basic/Modern/Premium Phase 2 |
| Customer access | Magic link share (view + PDF); no customer login in MVP |
| Data conflict priority | User confirmed > catalog > document extract > AI suggestion |
| Rounding | Money: 2 decimals; qty: 3 decimals; totals computed in engine only |
