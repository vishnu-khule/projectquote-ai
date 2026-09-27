# Implementation tickets (epics)

## EPIC-1 Platform bootstrap

- T1.1 Monorepo turbo pipeline
- T1.2 Docker compose + `.env.example`
- T1.3 GitHub Actions: lint, typecheck, test
- **Acceptance**: `docker compose up` healthy; CI green on main

## EPIC-2 Auth & tenancy

- [x] T2.1 User register/login JWT
- [x] T2.2 Organization on signup
- **Acceptance**: API creates isolated project rows per org

## EPIC-3 Projects & FSM

- [x] T3.1 Project CRUD
- [x] T3.2 Status transitions with guards (`POST /projects/:id/status`)
- **Acceptance**: illegal transitions return 409

## EPIC-4 Documents

- [x] T4.1 Multipart upload to S3 (MinIO-compatible)
- [x] T4.2 BullMQ processor (inline fallback without Redis): pdf-parse, xlsx/csv
- [x] T4.3 `GET /projects/:id/events` SSE + document status polling in UI
- **Acceptance**: extraction JSON stored with job status SSE

## EPIC-5 AI chat

- [x] T5.1 Streaming endpoint (`POST /projects/:id/chat` with `stream: true`)
- [x] T5.2 Conversation agent + Zod validation (`@projectquote/schemas`)
- [x] T5.3 Message history + `ai_runs` audit
- **Acceptance**: missing fields trigger questions

## EPIC-6 Estimation

- [x] T6.1 Engine unit tests (golden totals)
- [x] T6.2 Line item CRUD + confirm AI prices
- [x] T6.3 Generate draft + estimate editor UI
- **Acceptance**: totals match spreadsheet fixtures

## EPIC-7 Proposal & PDF

- [x] T7.1 Proposal builder + section editor (deterministic from estimate)
- [x] T7.2 PDFKit PDF to S3 + download
- **Acceptance**: approved proposal produces downloadable PDF

## EPIC-8 Share

- [x] T8.1 Tokenized public page + PDF download
- [x] T8.2 View/download event tracking on share
- **Acceptance**: no internal fields in public JSON
