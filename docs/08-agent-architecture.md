# Agent architecture

## Tool catalog (LLM-callable)

| Tool | Purpose |
|------|---------|
| `getProject` | Read sanitized project snapshot |
| `updateProjectRequirements` | Write confirmed fields only |
| `searchDocumentChunks` | RAG retrieval |
| `getCatalogPricing` | Material/labour rates |
| `suggestLineItems` | Returns suggestions (not persisted) |
| `calculateEstimate` | Calls deterministic engine |
| `validateEstimate` | Rules + validation agent |
| `generateProposalDraft` | Narrative sections only |

## Execution record

Every call creates `ai_runs` + optional `ai_citations` linking to `document_id` and chunk ids.

## Retry policy

Schema validation failure → 1 repair attempt with error feedback → else fail job with `AI_ANALYSIS_FAILED`.
