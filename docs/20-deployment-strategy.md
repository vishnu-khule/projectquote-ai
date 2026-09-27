# Deployment strategy

## CI/CD

1. PR: lint, typecheck, unit tests, Prisma migrate diff check
2. Main: build images, deploy staging
3. Tag: promote to production + run migrations

## Migrations

Forward-only Prisma migrations; backup before prod migrate.

## Secrets

Doppler / GitHub Actions secrets / cloud parameter store — never commit `.env`.

## Rollback

Blue/green or previous image tag; DB rollback via restore snapshot only (no down migrations in prod).

## Production checklist

- [ ] JWT secret rotated (set strong `JWT_SECRET` in prod — never use `.env.example` value)
- [ ] S3 bucket private + CORS (restrict `APP_URL` origin)
- [x] Rate limits enabled (`@nestjs/throttler`, `RATE_LIMIT_*` env)
- [x] AI budget caps per org (`AI_MONTHLY_BUDGET_CAP_CENTS`, token usage from `ai_runs`)
- [ ] Error alerting configured (wire Sentry/Datadog in hosting)
- [x] Container images (`apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.app.yml`)
