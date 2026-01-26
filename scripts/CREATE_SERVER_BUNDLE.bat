@echo off
setlocal
cd /d "%~dp0\.."

set PACKAGE_VERSION=v1.2.5
set PACKAGE_DIR=Unity_Server_Bundle_%PACKAGE_VERSION%
set ZIP_FILE=Unity_Server_Bundle_%PACKAGE_VERSION%.zip

echo ========================================================
echo [1/5] Cleaning Previous Builds...
echo ========================================================
if exist "%PACKAGE_DIR%" rmdir /s /q "%PACKAGE_DIR%"
if exist "%ZIP_FILE%" del /f /q "%ZIP_FILE%"
mkdir "%PACKAGE_DIR%"

echo.
echo ========================================================
echo [2/5] Building Frontend...
echo ========================================================
cd frontend
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo ========================================================
echo [3/5] Publishing Backend (Self-Contained)...
echo ========================================================
:: Publish to a temporary location first
dotnet publish "dotnet-backend\Unity.API\Unity.API.csproj" -c Release -r win-x64 --self-contained true -o "%PACKAGE_DIR%\backend"
if %errorlevel% neq 0 (
    echo [ERROR] Backend publish failed.
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [4/5] Embedding Frontend into Backend...
echo ========================================================
:: Copy frontend build to the published backend's wwwroot
xcopy /E /I /Y "frontend\build\*" "%PACKAGE_DIR%\backend\wwwroot\"

:: Create the Utils directory for the logs
mkdir "%PACKAGE_DIR%\backend\logs" 2>nul

echo.
echo ========================================================
echo [5/5] Creating Installation Script (SETUP.bat)...
echo ========================================================
(
echo @echo off
echo setlocal
echo cd /d "%%~dp0"
echo title Unity Server Installer
echo color 1F
echo cls
echo ========================================================
echo UNITY SERVER INSTALLER %PACKAGE_VERSION%
echo ========================================================
echo.
echo This script will install/update the Unity Server backend.
echo All frontend files are embedded.
echo.
echo [1] Checking Permissions...
echo net session ^>nul 2^>^&1
echo if %%errorLevel%% neq 0 ^(
echo     echo [ERROR] Please Run as Administrator!
echo     pause
echo     exit
echo ^)
echo.
echo [2] Configuration...
echo set /p TARGET_DIR="Install Location [Default: C:\inetpub\wwwroot\Unity]: "
echo if "%%TARGET_DIR%%"=="" set TARGET_DIR=C:\inetpub\wwwroot\Unity
echo.
echo Target: %%TARGET_DIR%%
echo.
echo [3] Stopping Services...
echo iisreset /stop
echo taskkill /F /IM Unity.API.exe ^>nul 2^>^&1
echo timeout /t 2 /nobreak ^>nul
echo.
echo [4] Backing up Database...
echo if exist "%%TARGET_DIR%%\unity.db" ^(
echo     echo Backing up unity.db...
echo     copy /Y "%%TARGET_DIR%%\unity.db" "%%TARGET_DIR%%\unity.db.bak" ^>nul
echo ^)
echo.
echo [5] Installing Files...
echo if not exist "%%TARGET_DIR%%" mkdir "%%TARGET_DIR%%"
echo :: Robocopy to sync files but exclude DB and uploads if they exist in source (they don't in bundle)
echo :: /MIR mirrors the backend folder
echo robocopy "backend" "%%TARGET_DIR%%" /MIR /XD "uploads" /XF "unity.db" "appsettings.Production.json"
echo.
echo :: Restore potential prod config if we overwrote it, or handle config merge?
echo :: For now, we assume appsettings.json is the base.
echo.
echo [6] Starting Services...
echo iisreset /start
echo.
echo ========================================================
echo INSTALLATION COMPLETE!
echo.
echo 1. Create a Site in IIS pointing to: %%TARGET_DIR%%
echo 2. Set Application Pool to 'No Managed Code'.
echo 3. Verify access at http://localhost
echo ========================================================
echo pause
) > "%PACKAGE_DIR%\SETUP.bat"

echo.
echo ========================================================
echo [6/5] Zipping Package...
echo ========================================================
powershell -Command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath '%ZIP_FILE%'"

echo.
echo [SUCCESS] Package Created: %ZIP_FILE%
echo Location: %CD%\%ZIP_FILE%
pause
) > scripts\CREATE_SERVER_BUNDLE.bat
