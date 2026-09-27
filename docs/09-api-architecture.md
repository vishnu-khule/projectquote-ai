# API architecture

REST JSON over HTTPS. OpenAPI 3.1 generated from NestJS decorators (Phase 1 implementation).

## Authentication

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- Bearer access token; refresh via httpOnly cookie or body (TBD in implementation)

## Projects

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects` | Create project |
| GET | `/projects` | List (org scoped) |
| GET | `/projects/:id` | Detail + status |
| PATCH | `/projects/:id` | Update metadata |
| POST | `/projects/:id/chat` | Send message (returns message + optional job) |
| GET | `/projects/:id/events` | SSE: jobs + stream tokens |

## Documents

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/:id/documents` | Multipart upload → job |
| GET | `/projects/:id/documents` | List |
| GET | `/documents/:id` | Status + extraction summary |

## Estimation & proposals

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/:id/analyze` | Merge requirements (job) |
| POST | `/projects/:id/estimate` | Run estimation engine |
| POST | `/projects/:id/validate` | Validation agent + rules |
| POST | `/projects/:id/proposals/generate` | Proposal agent (job) |
| GET | `/projects/:id/proposals` | List versions |
| POST | `/proposals/:id/approve` | Human approval gate |
| POST | `/proposals/:id/pdf` | PDF job |

## Sharing (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/shared/proposals/:token` | Customer view (no AI internals) |
| GET | `/shared/proposals/:token/pdf` | Download |

## Error shape

```json
{
  "error": {
    "code": "VALIDATION_BLOCKED",
    "message": "Human readable",
    "details": []
  }
}
```
