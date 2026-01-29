@echo off
setlocal EnableDelayedExpansion
title UnityApp Professional Setup
color 0B

echo ===================================================
echo   UNITY WORKFORCE MANAGEMENT - HIGH SPEED SETUP
echo ===================================================
echo.

:: 1. Admin Priveleges Check
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Lutfen bu dosyayi YONETICI olarak calistirin!
    echo.
    pause
    exit /b 1
)

:: Configuration
set "APP_NAME=UnityApp"
set "PORT=8080"
set "APP_POOL=UnityAppPool"
set "PHYSICAL_PATH=%~dp0"
:: Remove trailing slash from PHYSICAL_PATH if exists
if "%PHYSICAL_PATH:~-1%"=="\" set "PHYSICAL_PATH=%PHYSICAL_PATH:~0,-1%"

echo [BILGI] Kurulum Yolu: %PHYSICAL_PATH%
echo [BILGI] Port: %PORT%

:: 2. Stop IIS and Clear Processes
echo.
echo [1/5] Servisler durduruluyor...
iisreset /stop >nul 2>&1
taskkill /F /IM Unity.API.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: 3. Permissions (Clean Sweep)
echo.
echo [2/5] Dosya izinleri ayarlaniyor...
if not exist "wwwroot\uploads" mkdir "wwwroot\uploads"
if not exist "logs" mkdir "logs"

:: Grant permissions to IIS AppPool and Users
icacls "%PHYSICAL_PATH%" /grant "Everyone":(OI)(CI)F /t /q >nul 2>&1
icacls "%PHYSICAL_PATH%" /grant "IIS AppPool\%APP_POOL%":(OI)(CI)F /t /q >nul 2>&1

:: 4. IIS Configuration (Idempotent)
echo.
echo [3/5] IIS Yapilandiriliyor...

:: Check AppPool
%windir%\system32\inetsrv\appcmd list apppool /name:"%APP_POOL%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [OK] AppPool olusturuluyor...
    %windir%\system32\inetsrv\appcmd add apppool /name:"%APP_POOL%" /managedRuntimeVersion:"" /managedPipelineMode:Integrated
)

:: Check Site
%windir%\system32\inetsrv\appcmd list site /name:"%APP_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [OK] Site olusturuluyor...
    %windir%\system32\inetsrv\appcmd add site /name:"%APP_NAME%" /bindings:http/*:%PORT%: /physicalPath:"%PHYSICAL_PATH%"
    %windir%\system32\inetsrv\appcmd set site /site.name:"%APP_NAME%" /[path='/'].applicationPool:"%APP_POOL%"
) else (
    echo [OK] Mevcut site guncelleniyor...
    %windir%\system32\inetsrv\appcmd set site /site.name:"%APP_NAME%" /bindings:http/*:%PORT%:
    %windir%\system32\inetsrv\appcmd set vdir "%APP_NAME%/" /physicalPath:"%PHYSICAL_PATH%"
    %windir%\system32\inetsrv\appcmd set site /site.name:"%APP_NAME%" /[path='/'].applicationPool:"%APP_POOL%"
)

:: 5. Restart IIS
echo.
echo [4/5] Servisler baslatiliyor...
iisreset /start >nul 2>&1

:: 6. Final Check
echo.
echo [5/5] Kurulum tamamlandi.
echo.
echo ===================================================
echo   ERISIM: http://localhost:%PORT%
echo ===================================================
echo.
echo Klasor: %PHYSICAL_PATH%
echo.
pause
