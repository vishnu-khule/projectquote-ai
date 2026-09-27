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

- [ ] JWT secret rotated
- [ ] S3 bucket private + CORS
- [ ] Rate limits enabled
- [ ] AI budget caps per org
- [ ] Error alerting configured
