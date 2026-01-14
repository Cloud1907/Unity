@echo off
set "SOURCE_DIR=%~dp0"
set "DIST_DIR=%SOURCE_DIR%dist"

echo [1/3] Publishing .NET Backend...
cd dotnet-backend
dotnet publish -c Release -o "%DIST_DIR%\backend"
if %errorlevel% neq 0 (
    echo Backend publish failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo [2/3] Building Frontend...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)
xcopy /E /I /Y build "%DIST_DIR%\frontend"
cd ..

echo [3/3] Creating Offline Zip...
powershell Compress-Archive -Path "%DIST_DIR%\*" -DestinationPath "%SOURCE_DIR%UnityApp_Offline.zip" -Force

echo.
echo ==========================================
echo  OFFLINE PACKAGE CREATED: UnityApp_Offline.zip
echo ==========================================
pause
