@echo off
cd /d "%~dp0"
echo ==========================================
echo Unity .NET Update Installer
echo ==========================================

echo [1/4] Stopping IIS and Processes...
iisreset /stop
taskkill /F /IM Unity.API.exe >nul 2>&1

echo [2/4] REMOVING OLD FILES (Crucial Step)...
if exist "C:\UnityApp\Unity_Final\backend\Unity.API.exe" (
    del /F /Q "C:\UnityApp\Unity_Final\backend\Unity.API.exe"
)

# Only delete the database if we are doing a major schema change (which v1.9 is)
if exist "C:\UnityApp\Unity_Final\backend\unity.db" (
   echo Deleting Old Database for Schema Migration...
   del /F /Q "C:\UnityApp\Unity_Final\backend\unity.db"
)

if exist "C:\UnityApp\Unity_Final\backend\Unity.API.exe" (
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: Could not delete Unity.API.exe.
    echo The file is still locked by Windows/IIS.
    echo Please RESTART the server manually and try again.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    pause
    exit /b
)

echo [3/4] Copying New Files...
xcopy /E /I /Y "backend\*" "C:\UnityApp\Unity_Final\backend\"

echo [4/4] Restarting IIS...
iisreset /stop
iisreset /start

echo [DONE] Update Complete!
echo PLEASE MANUALLY VERIFY IN IIS MANAGER THAT 'Default Web Site' POINTS TO 'C:\UnityApp\Unity_Final\backend'

echo.
echo [DONE] Update Complete!
pause
