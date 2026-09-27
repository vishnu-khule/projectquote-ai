# MVP scope

## Phase 1 (build now)

- [x] Auth + single org per user (invite later)
- [x] Project CRUD + state machine (core states)
- [x] AI chat (streaming) + project memory
- [x] Upload PDF/XLSX/CSV/images
- [x] Document queue: extract text/tables → `ExtractedProjectData`
- [x] Requirements merge + missing-info questions
- [x] Manual + catalog pricing; AI suggestions **unconfirmed**
- [x] Deterministic estimation engine
- [x] Single proposal tier + template
- [x] Review UI + approve
- [x] PDF generation + download
- [x] Basic share link (view + PDF)

## Phase 2

- [x] Basic / Modern / Premium tier rules
- [x] RAG-lite over project documents (chunk index + retrieval)
- [x] Validation blocking rules (approve/share)
- [x] Org price catalog API (materials seed)
- [ ] Full vector embeddings + cross-project RAG
- [x] Labour catalog + tax admin UI (material/labour tabs, org default tax)
- [x] Catalog → estimate line picker (`POST …/line-items/from-catalog`)

## Phase 3+

Per original spec: vision on drawings, multi-profession packs, integrations.
