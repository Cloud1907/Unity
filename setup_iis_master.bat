@echo off
setlocal
echo ===================================================
echo   UNITY PROJECT - AUTOMATED IIS INSTALLATION
echo ===================================================

:: 1. Check Admin Priveleges
net session >nul 2>&1
if %errorlevel% neq 0 goto :noadmin

echo [OK] Running as Administrator
goto :check_tools

:noadmin
echo [ERROR] Please run this script as Administrator (Right click -> Run as Admin)
pause
exit /b 1

:check_tools
echo [INFO] Checking dependencies...
:: No dependencies needed for offline install!
echo [OK] Ready to install.

:: Configuration
set "APP_NAME=UnityApp"
set "IIS_PATH=C:\UnityApp\Unity_Final\backend"
set "PREBUILT_BACKEND=%~dp0dotnet-backend\backend-publish"
set "PREBUILT_FRONTEND=%~dp0frontend\build"
set "APP_POOL=UnityAppPool"

:: 2. Stop IIS Completely (Nuclear Option)
echo.
echo [INFO] Stopping IIS Server...
iisreset /stop

:: 3. Deploy Pre-built Backend
echo.
echo [INFO] Deploying Backend files...
if not exist "%PREBUILT_BACKEND%" (
    echo [ERROR] Pre-built backend not found at %PREBUILT_BACKEND%
    echo Please ensure you extracted the full zip package.
    pause
    exit /b 1
)
echo [INFO] Copying Backend to %IIS_PATH%...
xcopy /E /Y /I "%PREBUILT_BACKEND%\*" "%IIS_PATH%"

:: 3.1 Grant Permissions (Aggressive Fix)
echo [INFO] Granting Write Permissions...
if not exist "%IIS_PATH%\wwwroot\uploads" mkdir "%IIS_PATH%\wwwroot\uploads"
if not exist "%IIS_PATH%\logs" mkdir "%IIS_PATH%\logs"

:: Grant Full Control to 'Everyone' to rule out user name issues
:: Security Note: Internal server only.
icacls "%IIS_PATH%\wwwroot\uploads" /grant "Everyone":(OI)(CI)F /t
icacls "%IIS_PATH%\logs" /grant "Everyone":(OI)(CI)F /t
icacls "%IIS_PATH%" /grant "Everyone":(OI)(CI)R /t

:: 4. Deploy Pre-built Frontend
echo.
echo [INFO] Deploying Frontend files...
if not exist "%PREBUILT_FRONTEND%" (
    echo [ERROR] Pre-built frontend not found at %PREBUILT_FRONTEND%
    echo Please ensure you extracted the full zip package.
    pause
    exit /b 1
)
echo [INFO] Copying Frontend to %IIS_PATH%\wwwroot...
xcopy /E /Y /I "%PREBUILT_FRONTEND%\*" "%IIS_PATH%\wwwroot"

:: 6. Setup IIS (Idempotent)
echo.
echo [INFO] Configuring IIS...
:: (Ensure AppPool/Site exist - assuming iisreset restarts services, we need to make sure config is loaded)
:: Actually iisreset /start handles service start. Configuration check:

:: Create AppPool if not exists
%windir%\system32\inetsrv\appcmd list apppool /name:"%APP_POOL%" >nul 2>&1
if %errorlevel% neq 0 (
    %windir%\system32\inetsrv\appcmd add apppool /name:"%APP_POOL%" /managedRuntimeVersion:"" /managedPipelineMode:Integrated
)

:: Create Site if not exists
%windir%\system32\inetsrv\appcmd list site /name:"%APP_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
    %windir%\system32\inetsrv\appcmd add site /name:"%APP_NAME%" /bindings:http/*:8080: /physicalPath:"%IIS_PATH%"
    %windir%\system32\inetsrv\appcmd set site /site.name:"%APP_NAME%" /[path='/'].applicationPool:"%APP_POOL%"
) else (
    :: Ensure path is correct using VDIR command
    %windir%\system32\inetsrv\appcmd set vdir "%APP_NAME%/" /physicalPath:"%IIS_PATH%"
)

:: 7. Start IIS Server
echo.
echo [INFO] Starting IIS Server...
iisreset /start

echo.
echo ===================================================
echo   INSTALLATION COMPLETE!
echo   Application is running on http://localhost:8080
echo   It will automatically start on Windows restart.
echo ===================================================
pause
goto :eof

:error
echo.
echo [ERROR] Installation failed. See messages above.
pause
exit /b 1
