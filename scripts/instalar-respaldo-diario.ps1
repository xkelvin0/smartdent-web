[CmdletBinding()]
param(
    [ValidatePattern("^([01]\d|2[0-3]):[0-5]\d$")]
    [string]$Hora = "20:00"
)

$ErrorActionPreference = "Stop"
$taskName = "SmartDent - Respaldo diario"
$backupScript = Join-Path $PSScriptRoot "respaldar-smartdent.ps1"

if (-not (Test-Path -LiteralPath $backupScript)) {
    throw "No se encontró el script de respaldo: $backupScript"
}

$actionArguments = "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -QuietWhenOffline"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArguments
$trigger = New-ScheduledTaskTrigger -Daily -At $Hora
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "Respaldo automático instalado. Se ejecutará diariamente a las $Hora cuando tu sesión esté abierta." -ForegroundColor Green
Write-Host "Los archivos se guardarán en: $env:LOCALAPPDATA\SmartDent\backups"
