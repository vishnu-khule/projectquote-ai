#!/usr/bin/env bash
# Start Postgres (pgvector) + Redis + MinIO per docker-compose.yml, then run Prisma migrations.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker &>/dev/null; then
  DOCKER=docker
elif [[ -x /Applications/Docker.app/Contents/Resources/bin/docker ]]; then
  DOCKER=/Applications/Docker.app/Contents/Resources/bin/docker
else
  echo "Docker not found. Install Docker Desktop, open it once, then re-run:"
  echo "  pnpm infra:up"
  exit 1
fi

if ! "$DOCKER" info &>/dev/null; then
  echo "Docker daemon is not running. Open Docker Desktop or run: colima start"
  echo "  pnpm infra:up"
  exit 1
fi

if "$DOCKER" compose version &>/dev/null; then
  COMPOSE=("$DOCKER" compose)
elif command -v docker-compose &>/dev/null; then
  COMPOSE=(docker-compose)
else
  echo "docker compose plugin not found. Install: brew install docker-compose"
  exit 1
fi

OVERRIDE="$ROOT/docker-compose.override.yml"
PG_PORT=5432
if lsof -nP -iTCP:5432 -sTCP:LISTEN &>/dev/null; then
  echo "Port 5432 is in use (e.g. Homebrew PostgreSQL). Mapping Docker Postgres to host port 5433."
  PG_PORT=5433
  cat > "$OVERRIDE" <<'EOF'
services:
  postgres:
    ports:
      - "5433:5432"
EOF
else
  rm -f "$OVERRIDE"
fi

echo "Starting Postgres (pgvector) + Redis…"
"${COMPOSE[@]}" up -d postgres redis

echo "Starting MinIO (profile storage)…"
if ! "${COMPOSE[@]}" --profile storage up -d minio createbucket 2>/dev/null; then
  echo "MinIO not started (image pull or login). Document uploads need S3/MinIO — see README."
fi

echo "Waiting for Postgres…"
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U projectquote -d projectquote &>/dev/null; then
    break
  fi
  sleep 2
done

DATABASE_URL="postgresql://projectquote:projectquote@localhost:${PG_PORT}/projectquote"
export DATABASE_URL

ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
    if [[ "$(uname)" == Darwin ]]; then
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
    else
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE"
    fi
  else
    echo "DATABASE_URL=${DATABASE_URL}" >> "$ENV_FILE"
  fi
else
  cp "$ROOT/.env.example" "$ENV_FILE"
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" "$ENV_FILE" 2>/dev/null || true
  rm -f "$ENV_FILE.bak"
fi

echo "Running migrations (pnpm db:migrate:deploy)…"
if (cd "$ROOT" && pnpm db:migrate:deploy); then
  :
else
  echo "pnpm unavailable or failed; using npx prisma migrate deploy in apps/api…"
  (cd "$ROOT/apps/api" && npx prisma migrate deploy)
fi

echo ""
echo "Infrastructure is ready."
echo "  DATABASE_URL=${DATABASE_URL}"
echo "  MinIO console: http://localhost:9001 (minioadmin / minioadmin)"
echo "  Next: pnpm dev"
