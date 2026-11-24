$ErrorActionPreference = "Stop"

$RootDir     = Split-Path $PSScriptRoot -Parent
$BackendDir  = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

function Write-Step([string]$Msg) {
    Write-Host ""
    Write-Host "==> $Msg" -ForegroundColor Cyan
}

function Refresh-SessionPath {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path    = "$machinePath;$userPath"
}

function Test-TcpPort([string]$TargetHost, [int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect($TargetHost, $Port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne(800, $false)) {
            $client.EndConnect($iar)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Install-WithWinget([string]$PackageId, [string]$DisplayName) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "No se encontro 'winget' para instalar $DisplayName automaticamente. Instalalo manualmente y vuelve a ejecutar este script."
    }
    Write-Host "Instalando $DisplayName via winget..." -ForegroundColor Yellow
    winget install --id $PackageId -e --silent --accept-source-agreements --accept-package-agreements
    Refresh-SessionPath
}

Write-Host "=====================================================" -ForegroundColor DarkCyan
Write-Host "  SmartDent - Instalacion y Arranque Automatico"       -ForegroundColor White
Write-Host "=====================================================" -ForegroundColor DarkCyan

# 1. Verificar o instalar Java JDK 21
Write-Step "1/6 Verificando Java JDK 21..."
$hasJava21 = $false
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($javaCmd) {
    $verOut = (& java -version 2>&1) -join "`n"
    if ($verOut -match '"21\.') {
        $hasJava21 = $true
        Write-Host "Java 21 detectado en PATH." -ForegroundColor Green
    }
}

if (-not $hasJava21) {
    $jdkCandidates = @(
        "C:\Program Files\Eclipse Adoptium\jdk-21*",
        "C:\Program Files\Java\jdk-21*",
        "C:\Program Files\Microsoft\jdk-21*"
    )
    $foundJdk = $jdkCandidates | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Select-Object -First 1
    if (-not $foundJdk) {
        Install-WithWinget "EclipseAdoptium.Temurin.21.JDK" "Java JDK 21 (Eclipse Temurin)"
        $foundJdk = $jdkCandidates | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue } | Select-Object -First 1
    }
    if ($foundJdk) {
        $env:JAVA_HOME = $foundJdk.FullName
        $env:Path = "$($env:JAVA_HOME)\bin;$($env:Path)"
        Write-Host "JAVA_HOME configurado: $($env:JAVA_HOME)" -ForegroundColor Green
    } elseif (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        throw "No se pudo detectar Java 21 tras la instalacion. Reinicia la terminal y vuelve a ejecutar."
    }
}

# 2. Verificar o instalar Node.js LTS
Write-Step "2/6 Verificando Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js LTS"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "No se encontro Node.js. Instalalo desde https://nodejs.org/ y vuelve a intentar."
}
Write-Host "Node.js detectado: $(node -v)" -ForegroundColor Green

# 3. Verificar o instalar pnpm
Write-Step "3/6 Verificando gestor de paquetes (pnpm / npm)..."
$usePnpm = $false
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $usePnpm = $true
    Write-Host "pnpm detectado: $(pnpm -v)" -ForegroundColor Green
} else {
    Write-Host "Instalando pnpm globalmente..." -ForegroundColor Yellow
    try {
        npm install -g pnpm
        Refresh-SessionPath
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            $usePnpm = $true
            Write-Host "pnpm instalado: $(pnpm -v)" -ForegroundColor Green
        }
    } catch {
        Write-Host "No se pudo instalar pnpm; se usara npm." -ForegroundColor Yellow
    }
}

# 4. Verificar o iniciar MariaDB / MySQL (XAMPP en puerto 3306)
Write-Step "4/6 Verificando MariaDB / MySQL en puerto 3306..."
if (Test-TcpPort "127.0.0.1" 3306) {
    Write-Host "MariaDB / MySQL ya esta activo en 127.0.0.1:3306." -ForegroundColor Green
} else {
    $xamppPaths = @("C:\xampp", "D:\xampp")
    $xamppDir = $xamppPaths | Where-Object { Test-Path (Join-Path $_ "mysql\bin\mysqld.exe") } | Select-Object -First 1
    if (-not $xamppDir) {
        Install-WithWinget "ApacheFriends.Xampp.8.2" "XAMPP (MariaDB / MySQL)"
        $xamppDir = $xamppPaths | Where-Object { Test-Path (Join-Path $_ "mysql\bin\mysqld.exe") } | Select-Object -First 1
    }
    if ($xamppDir) {
        $mysqld = Join-Path $xamppDir "mysql\bin\mysqld.exe"
        $myIni  = Join-Path $xamppDir "mysql\bin\my.ini"
        Write-Host "Iniciando MySQL/MariaDB de XAMPP ($xamppDir)..." -ForegroundColor Yellow
        if (Test-Path $myIni) {
            Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$myIni`"" -WindowStyle Minimized
        } else {
            Start-Process -FilePath $mysqld -WindowStyle Minimized
        }
        $readyDb = $false
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Seconds 1
            if (Test-TcpPort "127.0.0.1" 3306) { $readyDb = $true; break }
        }
        if (-not $readyDb) {
            throw "MySQL no respondio en el puerto 3306. Abre XAMPP Control Panel y presiona Start en MySQL manualmente."
        }
        Write-Host "MariaDB / MySQL iniciado correctamente en puerto 3306." -ForegroundColor Green
    } else {
        throw "No se detecto MySQL/MariaDB activo en el puerto 3306 ni XAMPP instalado."
    }
}

# 5. Instalar dependencias del Frontend Angular
Write-Step "5/6 Instalando dependencias del Frontend (Angular 19)..."
if ($usePnpm) {
    pnpm install --dir $FrontendDir
} else {
    npm install --prefix $FrontendDir
}

# 6. Levantar Backend (Spring Boot :8080) y Frontend (Angular :4200)
Write-Step "6/6 Iniciando Backend (Spring Boot :8080) y Frontend (Angular :4200)..."

if (-not (Test-TcpPort "127.0.0.1" 8080)) {
    $javaHomeSet = if ($env:JAVA_HOME) { "`$env:JAVA_HOME='$($env:JAVA_HOME)'; `$env:Path='$($env:JAVA_HOME)\bin;' + `$env:Path; " } else { "" }
    $backendCmd = "${javaHomeSet}Set-Location -LiteralPath '$BackendDir'; .\mvnw.cmd spring-boot:run"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCmd
    Write-Host "Esperando a que Spring Boot responda en http://localhost:8080/api/health ..." -ForegroundColor Yellow
    $backendReady = $false
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 2
        if (Test-TcpPort "127.0.0.1" 8080) {
            try {
                $resp = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 2
                if ($resp.StatusCode -eq 200) { $backendReady = $true; break }
            } catch {}
        }
    }
    if ($backendReady) {
        Write-Host "Backend listo en http://localhost:8080 (Swagger: http://localhost:8080/swagger-ui.html)" -ForegroundColor Green
    } else {
        Write-Host "El backend sigue compilando o iniciando en la otra ventana. Revisa la consola de Spring Boot." -ForegroundColor Yellow
    }
} else {
    Write-Host "Backend ya esta corriendo en el puerto 8080." -ForegroundColor Green
}

if (-not (Test-TcpPort "127.0.0.1" 4200)) {
    $startCmd = if ($usePnpm) { "pnpm start" } else { "npm start" }
    $frontendCmd = "Set-Location -LiteralPath '$FrontendDir'; $startCmd"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCmd
    Write-Host "Esperando a que Angular dev server responda en http://localhost:4200 ..." -ForegroundColor Yellow
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Seconds 2
        if (Test-TcpPort "127.0.0.1" 4200) { break }
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  SmartDent listo!"                                    -ForegroundColor White
Write-Host "  Frontend : http://localhost:4200"                    -ForegroundColor Cyan
Write-Host "  Swagger  : http://localhost:8080/swagger-ui.html"    -ForegroundColor Cyan
Write-Host "  Admin    : kelvinace29@gmail.com / Admin123"         -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Green

Start-Process "http://localhost:4200"
