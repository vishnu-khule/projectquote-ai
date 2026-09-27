# Database schema (logical)

PostgreSQL 16 + **pgvector** for `document_chunks.embedding`.

## Core entities

- **users** — auth identity
- **organizations** — tenant
- **organization_members** — user_id, org_id, role (`owner`, `admin`, `member`)
- **customers** — org-scoped CRM-lite
- **projects** — status, project_type, title, jsonb `requirements_snapshot`
- **documents** — s3_key, mime, status, project_id
- **document_chunks** — content, metadata, embedding vector(1536)
- **project_requirements** — key, value, status, sources jsonb
- **price_catalog_items** — sku, unit, price, category
- **labour_rates** — role, rate, unit
- **estimates** — version, tier, totals jsonb
- **estimate_items** — line fields, price_source, confirmed
- **proposals** — version, tier, sections jsonb, status
- **proposal_versions** — immutable snapshots
- **ai_conversations** / **ai_messages** — chat history
- **ai_runs** — agent, prompt_version, tokens, I/O redacted
- **ai_citations** — run_id, source refs
- **validation_results** — estimate_id, payload jsonb
- **generated_files** — pdf s3_key, proposal_id
- **shares** — token hash, proposal_id, expires_at, events
- **audit_logs** — org_id, actor, action, metadata

## Indexes

- `projects(organization_id, updated_at desc)`
- `documents(project_id)`
- `document_chunks` IVFFlat/HNSW on embedding
- `shares(token_hash)` unique

Prisma schema lives in `apps/api/prisma/schema.prisma` (implementation phase).
