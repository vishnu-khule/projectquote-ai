# Infrastructure architecture

## Local

`docker compose up` → Postgres (pgvector), Redis, MinIO.

## Environments

`development`, `staging`, `production` with separate DB and buckets.

## Deployment (recommended)

- **Web**: Vercel or container behind CDN
- **API + workers**: single container image, scale workers horizontally
- **DB**: managed Postgres (Neon, RDS, Supabase)
- **Redis**: Upstash or Elasticache
- **Storage**: R2/S3

## Observability

OpenTelemetry traces, structured JSON logs, Sentry errors, Grafana dashboards for queue depth and AI cost.
