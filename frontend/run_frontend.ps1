# SmartCar Frontend Runner
$FrontendRoot = $PSScriptRoot
$RuntimeRoot = Join-Path $env:TEMP "smartcar_frontend_runtime"
$InstallStamp = Join-Path $RuntimeRoot ".install-stamp"

Write-Host "[SmartCar Frontend] Project source path: $FrontendRoot"
Write-Host "[SmartCar Frontend] Active runtime path: $RuntimeRoot"
Write-Host "[SmartCar Frontend] Note: the frontend runs from this temporary ASCII-safe copy when the project path contains non-ASCII characters."

if (Test-Path -Path $RuntimeRoot) {
    Remove-Item -Path $RuntimeRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $RuntimeRoot -Force | Out-Null

Get-ChildItem -Path $FrontendRoot -Force |
    Where-Object { $_.Name -notin @("node_modules", "dist") } |
    Copy-Item -Destination $RuntimeRoot -Recurse -Force

Push-Location -Path $RuntimeRoot

try {
    Write-Host "[SmartCar Frontend] Installing dependencies in runtime path..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install frontend dependencies."
        exit 1
    }

    Set-Content -Path $InstallStamp -Value (Get-Date -Format "s")

    if ($args -contains "build") {
        Write-Host "[SmartCar Frontend] Running production build..."
        npm run build
        exit $LASTEXITCODE
    }

    Write-Host "[SmartCar Frontend] Starting Vite dev server from runtime path..."
    npm run dev -- --host 127.0.0.1 --port 5173
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
