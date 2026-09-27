#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker &>/dev/null; then
  DOCKER=docker
elif [[ -x /Applications/Docker.app/Contents/Resources/bin/docker ]]; then
  DOCKER=/Applications/Docker.app/Contents/Resources/bin/docker
else
  exit 0
fi

if "$DOCKER" compose version &>/dev/null; then
  "$DOCKER" compose down
elif command -v docker-compose &>/dev/null; then
  docker-compose down
fi
