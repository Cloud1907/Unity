@echo off
setlocal
cd /d "%~dp0\.."

echo ========================================================
echo [1/4] Building Frontend...
echo ========================================================
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b %errorlevel%
)

call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] npm run build failed.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo ========================================================
echo [2/4] Cleaning Backend wwwroot (Preserving uploads)...
echo ========================================================
if not exist "dotnet-backend\Unity.API\wwwroot" mkdir "dotnet-backend\Unity.API\wwwroot"
powershell -NoProfile -Command "Get-ChildItem 'dotnet-backend/Unity.API/wwwroot' -Exclude 'uploads' | Remove-Item -Recurse -Force"

echo.
echo ========================================================
echo [3/4] Copying Build Artifacts...
echo ========================================================
xcopy /E /Y /I "frontend\build\*" "dotnet-backend\Unity.API\wwwroot\"
if %errorlevel% neq 0 (
    echo [ERROR] Copy failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [4/4] Starting Backend (http://localhost:8080)...
echo ========================================================
start http://localhost:8080
cd dotnet-backend\Unity.API
dotnet run --urls=http://localhost:8080
