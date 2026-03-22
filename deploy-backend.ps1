# Deploy backend from arbitrary path
param(
  [string]$BackendPath = ""
)

if (-not $BackendPath) {
  $app = New-Object -ComObject Shell.Application
  $folder = $app.BrowseForFolder(0, "Select the AlgoForge repository folder", 0, 0)
  if ($folder) {
    $BackendPath = $folder.Self.Path
  } else {
    Write-Host "No folder selected. Exiting." -ForegroundColor Yellow
    exit 0
  }
}

if (-not (Test-Path $BackendPath)) {
  Write-Host "Invalid path: $BackendPath" -ForegroundColor Red
  exit 1
}

$composeFile = Join-Path $BackendPath "ops/docker-compose.yaml"
if (-not (Test-Path $composeFile)) {
  Write-Host "Cannot find ops/docker-compose.yaml under $BackendPath" -ForegroundColor Red
  exit 1
}

Push-Location $BackendPath
Write-Host "Starting backend via docker compose in $BackendPath" -ForegroundColor Cyan

docker compose -f ops/docker-compose.yaml up --build -d

if ($LASTEXITCODE -ne 0) {
  Pop-Location
  exit $LASTEXITCODE
}

Write-Host "Backend up. Health check: http://localhost:3001/health" -ForegroundColor Green
Pop-Location
