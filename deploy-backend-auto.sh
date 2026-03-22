#!/usr/bin/env bash
# Auto-deploy backend from the repo root (script directory).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/ops/docker-compose.yaml"
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ops/docker-compose.yaml not found next to this script. Aborting." >&2
  exit 1
fi
cd "$SCRIPT_DIR"
echo "Starting backend via docker compose in $SCRIPT_DIR"
docker compose -f ops/docker-compose.yaml up --build -d
echo "Backend up. Health check: http://localhost:3001/health"
