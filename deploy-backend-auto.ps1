# Auto-deploy backend without asking for a path.
# Runs docker compose from the repo root where this script lives.

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$composeFile = Join-Path $repoRoot "ops/docker-compose.yaml"

if (-not (Test-Path $composeFile)) {
  Write-Host "ops/docker-compose.yaml not found next to this script. Aborting." -ForegroundColor Red
  exit 1
}

Push-Location $repoRoot
Write-Host "Starting backend via docker compose in $repoRoot" -ForegroundColor Cyan

docker compose -f ops/docker-compose.yaml up --build -d

Write-Host "Backend up. Health check: http://localhost:3001/health" -ForegroundColor Green
Pop-Location
