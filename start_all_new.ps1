# Check for required commands
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    Write-Host "Error: yarn is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "Starting MicroMerit Portal Development Environment..." -ForegroundColor Blue

# Start client-main
Write-Host "[1/5] Starting client-main..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client/main-app; npm run dev"

# Start client-admin
Write-Host "[2/5] Starting client-admin..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client/admin; yarn dev"

# Start server-node
Write-Host "[3/5] Starting server-node..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server/node-app; yarn dev"

# Start ai_groq_service
Write-Host "[4/5] Starting server-ai..." -ForegroundColor Magenta
# Multi-command argument requires concatenated string with semi-colons
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server/ai_groq_service; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"

# Start dummy-server
Write-Host "[5/5] Starting dummy-server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd dummy-server; yarn dev"

Write-Host "`nAll services launch commands issued!" -ForegroundColor Cyan
Write-Host "Check the new windows for service logs." -ForegroundColor Gray
