@echo off
cd /d "%~dp0"
echo ====================================================
echo  UNITY DATABASE RESET TOOL
echo ====================================================
echo.
echo Current Directory: %CD%
echo.

:: Check if unity.db exists
if not exist "unity.db" (
    echo [INFO] unity.db not found in current directory.
    echo [INFO] The database might not exist yet, or might be in a different location.
    echo.
    pause
    exit /b
)

echo WARNING: This will DELETE the database file (unity.db).
echo All data will be lost and replaced with Default Seed Data on next startup.
echo.
echo Database file found: %CD%\unity.db
echo.

set /p CONFIRM="Type YES to confirm deletion: "
if /i "%CONFIRM%"=="yes" goto PROCEED
echo.
echo [CANCELLED] Database was not deleted.
pause
exit /b

:PROCEED
echo.
echo [1/3] Stopping IIS site...
%systemroot%\system32\inetsrv\appcmd stop site "UnityApp" 2>nul
if errorlevel 1 (
    echo [WARNING] Could not stop site. It might not be running.
)
timeout /t 2 /nobreak >nul

echo [2/3] Deleting database files...
del /f /q unity.db 2>nul
del /f /q unity.db-shm 2>nul
del /f /q unity.db-wal 2>nul

if exist unity.db (
    echo [ERROR] Failed to delete unity.db!
    echo The file might be locked by another process.
    echo Please close all applications and try again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Database deleted successfully!
)

echo [3/3] Starting IIS site...
%systemroot%\system32\inetsrv\appcmd start site "UnityApp"
if errorlevel 1 (
    echo [ERROR] Could not start site.
    echo Please start it manually from IIS Manager.
) else (
    echo [SUCCESS] Site restarted!
)

echo.
echo ====================================================
echo  RESET COMPLETE
echo ====================================================
echo.
echo Next steps:
echo 1. Wait 5 seconds for the application to initialize
echo 2. Refresh your browser (Ctrl+Shift+R to clear cache)
echo 3. New seed data should appear (Melih, Ahmet, etc.)
echo.
pause
