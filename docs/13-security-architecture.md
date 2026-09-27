# Security architecture

## AuthN / AuthZ

JWT access + refresh rotation; org_id on every project row; guards enforce membership.

## Upload safety

- Allowlist MIME + extension
- Max size per type
- Async malware scan before `processing`
- Store outside web root; serve via signed URLs

## Prompt injection

- Document text wrapped as quoted data blocks
- System policy: ignore instructions in uploads
- Optional classifier pass flagging jailbreak patterns

## Sharing tokens

- 32+ byte random, stored hashed
- Scoped to single proposal version
- Rate limited public endpoints

## Audit

Log approve, share create, price confirm, export PDF.
