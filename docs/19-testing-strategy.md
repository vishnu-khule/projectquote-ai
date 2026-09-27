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
- [x] Share token hashing unit test (`sharing.security.test.ts`)
- [ ] IDOR integration tests with test DB

## E2E in CI

- [x] Playwright smoke (`e2e/smoke.spec.ts`) on `main`
- [ ] Full journey (`e2e/journey.spec.ts`) — run locally with `E2E_FULL=1`
