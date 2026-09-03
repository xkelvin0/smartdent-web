[CmdletBinding()]
param(
    [string]$XamppPath = "C:\xampp",
    [string]$Database = "smartdent_db",
    [string]$DatabaseUser = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "root" }),
    [string]$DatabasePassword = $(if ($null -ne $env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }),
    [int]$Port = 3306,
    [int]$Keep = 14,
    [string]$BackupDirectory = (Join-Path $env:LOCALAPPDATA "SmartDent\backups"),
    [switch]$QuietWhenOffline
)

$ErrorActionPreference = "Stop"

function Test-TcpPort {
    param([string]$HostName, [int]$TargetPort)
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connection = $client.ConnectAsync($HostName, $TargetPort)
        return $connection.Wait(1500) -and $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

$dumpExecutable = Join-Path $XamppPath "mysql\bin\mysqldump.exe"
if (-not (Test-Path -LiteralPath $dumpExecutable)) {
    throw "No se encontró mysqldump en $dumpExecutable."
}

New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
$logFile = Join-Path $BackupDirectory "respaldos.log"

if (-not (Test-TcpPort -HostName "127.0.0.1" -TargetPort $Port)) {
    $message = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | MySQL no estaba activo; no se generó respaldo."
    Add-Content -LiteralPath $logFile -Value $message
    if ($QuietWhenOffline) {
        Write-Host $message -ForegroundColor Yellow
        exit 0
    }
    throw "MySQL no está escuchando en el puerto $Port. Enciéndelo desde XAMPP e inténtalo nuevamente."
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = Join-Path $BackupDirectory "${Database}_${timestamp}.sql"
$previousPassword = $env:MYSQL_PWD

try {
    $env:MYSQL_PWD = $DatabasePassword
    $dumpArguments = @(
        "--host=127.0.0.1",
        "--port=$Port",
        "--user=$DatabaseUser",
        "--single-transaction",
        "--routines",
        "--events",
        "--databases",
        $Database,
        "--result-file=$backupFile"
    )
    & $dumpExecutable @dumpArguments

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $backupFile) -or (Get-Item -LiteralPath $backupFile).Length -eq 0) {
        throw "mysqldump no pudo generar un respaldo válido."
    }

    Get-ChildItem -LiteralPath $BackupDirectory -Filter "${Database}_*.sql" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip ([Math]::Max(1, $Keep)) |
        Remove-Item -Force

    $sizeKb = [Math]::Round((Get-Item -LiteralPath $backupFile).Length / 1KB, 1)
    $message = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Respaldo correcto: $backupFile ($sizeKb KB)."
    Add-Content -LiteralPath $logFile -Value $message
    Write-Host $message -ForegroundColor Green
    $backupFile
} catch {
    if (Test-Path -LiteralPath $backupFile) {
        Remove-Item -LiteralPath $backupFile -Force
    }
    Add-Content -LiteralPath $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | ERROR: $($_.Exception.Message)"
    throw
} finally {
    $env:MYSQL_PWD = $previousPassword
}
