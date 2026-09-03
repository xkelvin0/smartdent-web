[CmdletBinding()]
param(
    [string]$XamppPath = "C:\xampp",
    [string]$DatabaseUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "root" }),
    [string]$DatabasePassword = $(if ($null -ne $env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }),
    [int]$DatabasePort = 3306,
    [int]$BackendPort = 8080
)

$ErrorActionPreference = "Stop"

function Test-TcpPort {
    param([int]$Port)
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connection = $client.ConnectAsync("127.0.0.1", $Port)
        return $connection.Wait(1200) -and $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

if (Test-TcpPort -Port $BackendPort) {
    throw "Spring Boot todavía está activo en el puerto $BackendPort. Ve a su terminal, presiona Ctrl+C y vuelve a ejecutar este cierre."
}

if (-not (Test-TcpPort -Port $DatabasePort)) {
    Write-Host "MySQL ya se encuentra apagado." -ForegroundColor Yellow
    exit 0
}

$backupScript = Join-Path $PSScriptRoot "respaldar-smartdent.ps1"
& $backupScript -XamppPath $XamppPath -DatabaseUser $DatabaseUser -DatabasePassword $DatabasePassword -Port $DatabasePort

$adminExecutable = Join-Path $XamppPath "mysql\bin\mysqladmin.exe"
if (-not (Test-Path -LiteralPath $adminExecutable)) {
    throw "No se encontró mysqladmin en $adminExecutable."
}

$previousPassword = $env:MYSQL_PWD
try {
    $env:MYSQL_PWD = $DatabasePassword
    & $adminExecutable --host=127.0.0.1 --port=$DatabasePort --user=$DatabaseUser shutdown
    if ($LASTEXITCODE -ne 0) {
        throw "MariaDB rechazó la solicitud de apagado seguro."
    }
} finally {
    $env:MYSQL_PWD = $previousPassword
}

$deadline = (Get-Date).AddSeconds(15)
while ((Get-Date) -lt $deadline -and (Test-TcpPort -Port $DatabasePort)) {
    Start-Sleep -Milliseconds 500
}

if (Test-TcpPort -Port $DatabasePort) {
    throw "MariaDB no terminó de apagarse dentro del tiempo esperado. Revisa el panel de XAMPP."
}

Write-Host "Respaldo terminado y MariaDB apagado correctamente. Ya puedes cerrar XAMPP y Windows." -ForegroundColor Green
