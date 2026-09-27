# AI architecture

## Design rules

1. Multiple **small agents**, not one mega-prompt.
2. **Structured JSON** outputs validated with Zod (`@projectquote/schemas`).
3. **Tools** for DB/S3/calculation — LLM never runs SQL.
4. **RAG** in Phase 2+; Phase 1 uses extraction + project context.
5. **Model routing**: classify/extract → cheaper model; synthesis → reasoning model.

## Orchestrator

Maintains per-project:

- Conversation transcript (trimmed + summarized)
- Confirmed requirement matrix
- Document extraction artifacts
- Agent run history (`ai_runs`, `ai_citations`)

Flow: **Intent → retrieve context → select agent → tools → validate → persist → next agent or WAITING_FOR_INFORMATION**.

## Agents (v1)

| Agent | Input | Output |
|-------|--------|--------|
| Conversation | User messages | intents, clarifications, project type |
| Document | Parsed doc text/tables | `ExtractedProjectData` |
| Requirements | User + docs | requirement matrix, conflicts, gaps |
| Estimation assist | Validated scope | suggested line items (unconfirmed) |
| Validation | Estimate + scope | PASS / WARNING / BLOCKED |
| Proposal | Validated estimate + template | `Proposal` sections JSON |

## AI provider interface

```typescript
interface AIProvider {
  chat(messages, options): Promise<ChatResult>;
  streamChat(messages, options): AsyncIterable<StreamChunk>;
  structuredOutput<T>(schema, messages, options): Promise<T>;
  embed(texts: string[]): Promise<number[][]>;
  analyzeImage?(input): Promise<StructuredVisionResult>;
}
```

Implementations: `OpenAIProvider` (MVP), stubs for Anthropic/Gemini.

## Untrusted documents

- Strip/neutralize instruction-like patterns in extracted text before model context.
- System prompts: document content is **data**, not instructions.
- Max context via chunk retrieval + citations, not full PDF paste on every turn.

## Cost tracking

Each `ai_run` stores model, tokens, latency, USD estimate; rolled up per `project_id` and `organization_id`.
