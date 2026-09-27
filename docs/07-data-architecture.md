# Data architecture

## Canonical models

TypeScript + Zod: `packages/schemas` (source of truth for API and AI contracts).

## Storage split

| Data | Store |
|------|--------|
| Relational | PostgreSQL |
| Embeddings | pgvector (`document_chunks`) |
| Blobs | S3-compatible |
| Cache / queue | Redis |

## Versioning

- `estimates.version`, `proposals.version` monotonic per project
- `proposal_versions` immutable JSON snapshot on approve
- `ai_runs.prompt_version` for regression tracking

## Conflict resolution

Field-level `status` on requirements with `sources[]`; user confirmation promotes to `confirmed` and wins merges.
