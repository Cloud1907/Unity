@echo off
setlocal
echo ===================================================
echo   Unity App - Update Utility
echo ===================================================

set "TARGET_DIR=C:\inetpub\wwwroot\UnityApp"
set "SOURCE_DIR=%~dp0"

if not exist "%TARGET_DIR%" (
    echo [ERROR] Target directory '%TARGET_DIR%' not found. Is the app installed?
    pause
    exit /b 1
)

echo [1/4] Stopping IIS Site...
%systemroot%\system32\inetsrv\appcmd stop site "UnityApp"

echo [2/4] Backing up Configuration...
if exist "%TARGET_DIR%\appsettings.json" copy /Y "%TARGET_DIR%\appsettings.json" "%TARGET_DIR%\appsettings.json.bak"
if exist "%TARGET_DIR%\web.config" copy /Y "%TARGET_DIR%\web.config" "%TARGET_DIR%\web.config.bak"

echo [3/4] Copying New Files...
:: Exclude config files from overwrite if logical, but usually we overwrite binaries.
xcopy /E /Y /Q "%SOURCE_DIR%backend\*" "%TARGET_DIR%\"

echo [4/4] Restoring Configuration...
if exist "%TARGET_DIR%\appsettings.json.bak" copy /Y "%TARGET_DIR%\appsettings.json.bak" "%TARGET_DIR%\appsettings.json"
:: web.config might need updates, so maybe don't restore it always?
:: For now, restoring appsettings is key for DB string.

echo [5/4] Restarting IIS Site...
%systemroot%\system32\inetsrv\appcmd start site "UnityApp"

echo Update Complete!
pause
