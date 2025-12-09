# Check for required commands
function Test-CommandExists {
    param ($Command)
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        return $true
    }
    return $false
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "Error: npm is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-CommandExists "yarn")) {
    Write-Host "Error: yarn is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "Starting MicroMerit Portal Development Environment..." -ForegroundColor Cyan
Write-Host ""
$projectRoot = "D:\Coding\MeritPortal-sih\MicroMerit-Portal-New"

$services = @(
    @{ Name = "client-main";  Path = "$projectRoot\client\main-app";       Command = "npm run dev";       Color = "Green" }
    @{ Name = "client-admin"; Path = "$projectRoot\client\admin";          Command = "yarn dev";          Color = "Blue" }
    @{ Name = "server-node";  Path = "$projectRoot\server\node-app";       Command = "yarn dev";          Color = "Yellow" }
    @{ Name = "server-ai";    Path = "$projectRoot\server\ai_groq_service"; Command = "cmd /c 'call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000'"; Color = "Magenta" }
    @{ Name = "dummy-server"; Path = "$projectRoot\dummy-server";          Command = "yarn dev";          Color = "Cyan" }
)


# # Define services
# $services = @(
#     @{ Name = "client-main";  Path = "client/main-app";       Command = "npm run dev";       Color = "Green" }
#     @{ Name = "client-admin"; Path = "client/admin";          Command = "yarn dev";          Color = "Blue" }
#     @{ Name = "server-node";  Path = "server/node-app";       Command = "yarn dev";          Color = "Yellow" }
#     @{ Name = "server-ai";    Path = "server/ai_groq_service"; Command = "cmd /c 'call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000'"; Color = "Magenta" }
#     @{ Name = "dummy-server"; Path = "dummy-server";          Command = "yarn dev";          Color = "Cyan" }
# )

$jobs = @()

# Start services
try {
    foreach ($service in $services) {
        Write-Host "Starting $($service.Name)..." -ForegroundColor $service.Color
        
        $job = Start-Job -ScriptBlock {
            param ($path, $cmd)
            Set-Location $path
            Invoke-Expression $cmd
        } -ArgumentList $service.Path, $service.Command -Name $service.Name
        
        $jobs += $job
    }

    Write-Host ""
    Write-Host "All services started!" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Cyan
    Write-Host ""

    # Monitor jobs and output logs
    while ($true) {
        foreach ($job in $jobs) {
            $results = Receive-Job -Job $job
            if ($results) {
                # Find the corresponding service color
                $svc = $services | Where-Object { $_.Name -eq $job.Name }
                foreach ($line in $results) {
                    if (-not [string]::IsNullOrWhiteSpace($line)) {
                        Write-Host "[$($svc.Name)] $line" -ForegroundColor $svc.Color
                    }
                }
            }
        }
        Start-Sleep -Milliseconds 100
        
        # Check if any job failed
        foreach ($job in $jobs) {
             if ($job.State -eq 'Failed' -or $job.State -eq 'Stopped') {
                 Write-Host "Service $($job.Name) stopped unexpectedly." -ForegroundColor Red
             }
        }
    }

} finally {
    Write-Host ""
    Write-Host "Stopping all services..." -ForegroundColor Red
    foreach ($job in $jobs) {
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    }
}
