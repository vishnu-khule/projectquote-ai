# Testing strategy

## Unit

- Estimation engine (100% branch coverage on math)
- State machine transitions
- Zod schema fixtures for agent outputs

## Integration

- API + Prisma test DB
- Upload → job → extraction row

## AI eval

- Golden PDFs/XLSX in `fixtures/documents/`
- Metrics: field recall, hallucination rate, cost per project

## E2E

- Playwright: login → project → chat → approve → PDF

## Security

- Prompt injection fixture PDFs must not change system behavior
- IDOR tests on projects and shares
