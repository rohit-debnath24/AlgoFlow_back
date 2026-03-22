#!/usr/bin/env bash
# Deploy backend from arbitrary path
set -euo pipefail
BACKEND_PATH=${1:-}
if [[ -z "$BACKEND_PATH" ]]; then
  if command -v zenity &> /dev/null; then
    BACKEND_PATH=$(zenity --file-selection --directory --title="Select AlgoForge repository folder") || exit 0
  else
    read -r -p "Enter path to AlgoForge repository folder: " BACKEND_PATH
  fi
fi

if [[ -z "$BACKEND_PATH" || ! -d "$BACKEND_PATH" ]]; then
  echo "Invalid or empty path: $BACKEND_PATH" >&2
  exit 1
fi
COMPOSE_FILE="$BACKEND_PATH/ops/docker-compose.yaml"
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Cannot find ops/docker-compose.yaml under $BACKEND_PATH" >&2
  exit 1
fi
cd "$BACKEND_PATH"
echo "Starting backend via docker compose in $BACKEND_PATH"
docker compose -f ops/docker-compose.yaml up --build -d
echo "Backend up. Health check: http://localhost:3001/health"
