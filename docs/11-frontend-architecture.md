# Frontend architecture

## Stack

Next.js 15 App Router, TypeScript, Tailwind, TanStack Query, Zustand, React Hook Form + Zod.

## Routes

```
/app
  /(auth)/login, register
  /(dashboard)/dashboard
  /(dashboard)/projects
  /(dashboard)/projects/[id]        # tabbed: chat, docs, requirements, estimate, proposal
  /(dashboard)/settings
  /share/[token]                  # public customer view
```

## Feature modules

`src/features/{auth,projects,ai-chat,documents,requirements,estimation,proposals,sharing}`

## Realtime

- SSE hook: `useProjectEvents(projectId)` for job progress
- Chat: `fetch` streaming reader for tokens

## Key UX rules

- AI-suggested prices show badge + **Confirm** action
- Block approve when validation `BLOCKED`
- Draft watermark on preview PDF
