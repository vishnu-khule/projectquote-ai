# Non-functional requirements

## Performance

- API p95 &lt; 300ms for CRUD (excl. AI)
- Chat first token &lt; 2s (provider dependent)
- Document job p95 &lt; 5 min for 20-page text PDF

## Availability

- MVP: 99.5% target on managed hosting

## Security

- TLS everywhere; secrets in vault/env
- Org isolation on all queries
- Signed short-lived URLs for S3
- Rate limits on auth and AI endpoints
- Virus scan hook on upload (ClamAV or cloud AV in prod)

## Privacy

- Delete project cascades documents, chunks, files
- AI logs retain redacted payloads per retention policy (default 90 days)

## Accessibility

- WCAG 2.1 AA for customer-facing share pages (Phase 1.5)
