# SmartCar DB Runner and Validator
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SourcePgRoot = Join-Path $ProjectRoot "pgsql"
$RuntimeRoot = Join-Path $env:TEMP "smartcar_pgsql_runtime"
$RuntimePgRoot = Join-Path $RuntimeRoot "pgsql"
$PG_BIN = Join-Path $RuntimePgRoot "bin"
$PG_DATA = Join-Path $RuntimePgRoot "data"
$PG_LOG = Join-Path $RuntimePgRoot "pg_server.log"
$VerifyScript = Join-Path $PSScriptRoot "verify_db.js"
$serverStarted = $false

if ($ProjectRoot -match '[^\u0000-\u007F]') {
    Write-Host "[SmartCar] Non-ASCII project path detected."
    Write-Host "[SmartCar] PostgreSQL will use a temporary ASCII-safe runtime path."
}

if (-not (Test-Path -Path $RuntimePgRoot)) {
    Write-Host "[SmartCar] Preparing temporary PostgreSQL runtime at: $RuntimePgRoot"
    New-Item -ItemType Directory -Path $RuntimeRoot -Force | Out-Null
    Copy-Item -Path $SourcePgRoot -Destination $RuntimeRoot -Recurse -Force
}

Write-Host "[SmartCar] Active PostgreSQL runtime path: $RuntimePgRoot"
Write-Host "[SmartCar] Note: this run is using the temporary runtime copy, not the original project pgsql folder."

# Run PostgreSQL tools from the staged executable directory so bundled binaries can resolve sibling executables reliably.
Push-Location -Path $PG_BIN

try {
    # 1. Initialize PostgreSQL Data Directory
    if (-not (Test-Path -Path $PG_DATA)) {
        Write-Host "[SmartCar] Initializing PostgreSQL database cluster in $PG_DATA..."
        & ".\initdb.exe" -D $PG_DATA -U postgres --auth=trust
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to initialize database cluster."
            exit 1
        }
    }

    # 2. Start PostgreSQL Server
    Write-Host "[SmartCar] Starting PostgreSQL server..."
    & ".\pg_ctl.exe" -D $PG_DATA -l $PG_LOG start
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start PostgreSQL server."
        exit 1
    }
    $serverStarted = $true
    Start-Sleep -Seconds 3

    # 3. Create Database
    Write-Host "[SmartCar] Creating database 'smartcar_db'..."
    # Ignore error if database already exists
    & ".\createdb.exe" -U postgres smartcar_db 2>$null

    # 4. Run Node.js Validation Script
    Write-Host "[SmartCar] Running Node.js database verification and query demonstrations..."
    node $VerifyScript
}
finally {
    if ($serverStarted) {
        Write-Host "[SmartCar] Stopping PostgreSQL server..."
        & ".\pg_ctl.exe" -D $PG_DATA stop
    }

    Pop-Location
}
