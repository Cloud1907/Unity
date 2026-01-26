$ErrorActionPreference = "Stop"

# Paths
$RootPath = Join-Path $PSScriptRoot ".."
$FrontendBuild = Join-Path $RootPath "frontend\build"
$BackendPublish = Join-Path $RootPath "dotnet-backend\Unity.API\publish"
$OutputPath = Join-Path $PSScriptRoot "Deploy-UnityApp-SingleFile.bat"
$TempDir = Join-Path $env:TEMP "UnityPayload"

# 1. Prepare Payload Directory
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -Path $TempDir -ItemType Directory | Out-Null
New-Item -Path "$TempDir\frontend" -ItemType Directory | Out-Null
New-Item -Path "$TempDir\backend" -ItemType Directory | Out-Null

# 2. Copy Artifacts (Embedded Structure)
Write-Host "Gathering files..."
Copy-Item "$BackendPublish\*" "$TempDir\backend" -Recurse

# Copy Frontend Content into Backend wwwroot
$WwwRoot = "$TempDir\backend\wwwroot"
if (!(Test-Path $WwwRoot)) { New-Item -Path $WwwRoot -ItemType Directory | Out-Null }
Copy-Item "$FrontendBuild\*" "$WwwRoot" -Recurse -Force

# 3. Zip Payload
$ZipPath = Join-Path $env:TEMP "UnityPayload.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath

# 4. Convert to Base64
Write-Host "Encoding payload..."
# Robust Read Logic
$bytes = [System.IO.File]::ReadAllBytes($ZipPath)
$Base64 = [Convert]::ToBase64String($bytes)

# 5. Define Batch Template
$BatchContent = @"
@echo off
setlocal EnableDelayedExpansion
cls
title UnityApp Tek Dosya Kurulumu (Embedded)

:: ==============================================================================================
::  AYARLAR
:: ==============================================================================================
set "DEST_PATH=C:\inetpub\wwwroot\UnityApp"
set "LOG_PATH=C:\SetupLogs\deploy_log.txt"
set "APP_POOL=UnityApp"
set "TEMP_EXTRACT=%TEMP%\UnityInstaller_v1"

if not exist "C:\SetupLogs" mkdir "C:\SetupLogs"

:: ==============================================================================================
::  1. YONETICI YETKISI KONTROLU
:: ==============================================================================================
call :Logger "Yonetici yetkisi kontrol ediliyor..."
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 4F
    echo [HATA] Bu script YONETICI [Administrator] yetkisi ile calistirilmalidir.
    call :Logger "[KRITIK] Yonetici haklari yok. Script durduruldu."
    pause
    exit /b 1
)
call :Logger "[BASARILI] Yonetici yetkisi onaylandi."

:: ==============================================================================================
::  2. DOSYALARI DISARI AKTARMA
:: ==============================================================================================
call :Logger "--------------------------------------------------------"
call :Logger "ADIM 1: Kurulum dosyalari hazirlaniyor..."
call :Logger "--------------------------------------------------------"

if exist "%TEMP_EXTRACT%" rmdir /s /q "%TEMP_EXTRACT%"
mkdir "%TEMP_EXTRACT%"

call :Logger "Veri cozumleniyor... Lutfen bekleyin."
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "`$lines = [System.IO.File]::ReadAllLines('%~f0'); " ^
    "`$start = `$false; `$b64 = ''; " ^
    "foreach (`$l in `$lines) { if (`$start) { `$b64 = `$l; break; } if (`$l.Trim() -eq '__PAYLOAD_BELOW__') { `$start = `$true; } } " ^
    "[System.IO.File]::WriteAllBytes('%TEMP_EXTRACT%\payload.zip', [Convert]::FromBase64String(`$b64)); " ^
    "Expand-Archive -Path '%TEMP_EXTRACT%\payload.zip' -DestinationPath '%TEMP_EXTRACT%' -Force"

if errorlevel 1 (
    call :Logger "[HATA] Dosya cikartma basarisiz oldu!"
    pause
    exit /b 1
)

:: ==============================================================================================
::  3. SERVISLERI DURDURMA
:: ==============================================================================================
call :Logger "Servisler durduruluyor..."
sc stop UnityBackend >nul 2>&1
taskkill /F /IM Unity.API.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: ==============================================================================================
::  4. KOPYALAMA (BACKEND ONLY)
:: ==============================================================================================
call :Logger "Dosyalar yukleniyor..."
:: Backend artik frontend dosyalarini da iceriyor (wwwroot)
robocopy "%TEMP_EXTRACT%\backend" "%DEST_PATH%\backend" /E /IS /IT /NP /R:3 /W:2 /LOG+:"%LOG_PATH%" /TEE

:: ==============================================================================================
::  5. IZINLER VE SERVIS KURULUMU
:: ==============================================================================================
call :Logger "Izinler ayarlaniyor..."
icacls "%DEST_PATH%" /grant "IIS_IUSRS:(OI)(CI)F" /T /Q >nul 2>&1
if not exist "%DEST_PATH%\backend\logs" mkdir "%DEST_PATH%\backend\logs"
icacls "%DEST_PATH%\backend\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T /Q >nul 2>&1
icacls "%DEST_PATH%\backend\wwwroot" /grant "IIS_IUSRS:(OI)(CI)R" /T /Q >nul 2>&1
icacls "%DEST_PATH%\backend\wwwroot\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T /Q >nul 2>&1

call :Logger "Servis kuruluyor..."
sc create UnityBackend binPath= "%DEST_PATH%\backend\Unity.API.exe" start= auto DisplayName= "Unity Backend Service" >nul
sc failure UnityBackend reset= 0 actions= restart/60000 >nul

call :Logger "Servis baslatiliyor..."
net start UnityBackend

:: ==============================================================================================
::  6. BITIS
:: ==============================================================================================
rmdir /s /q "%TEMP_EXTRACT%"
call :Logger "[BASARILI] KURULUM TAMAMLANDI!"
echo.
echo    Erisim Adresi: http://localhost:8080
echo    (Backend tum uygulamayi sunuyor)
echo.
pause
exit /b 0

:Logger
set "msg=%~1"
set "timestamp=%date% %time%"
echo [%timestamp%] %msg%
echo [%timestamp%] %msg% >> "%LOG_PATH%"
exit /b


:Logger
set "msg=%~1"
set "timestamp=%date% %time%"
echo [%timestamp%] %msg%
echo [%timestamp%] %msg% >> "%LOG_PATH%"
exit /b

__PAYLOAD_BELOW__
"@

# 6. Write Final Batch File
Set-Content -Path $OutputPath -Value $BatchContent
Add-Content -Path $OutputPath -Value $Base64

Write-Host "Created single-file installer at: $OutputPath"
