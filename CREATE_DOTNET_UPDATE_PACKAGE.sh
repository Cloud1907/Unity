#!/bin/bash

# Configuration
PACKAGE_VERSION="v1.21"
PACKAGE_DIR="dotnet-update-$PACKAGE_VERSION"
PACKAGEZIP_FILE="dotnet-update-$PACKAGE_VERSION.zip"
rm -rf ${PACKAGE_DIR}
mkdir -p ${PACKAGE_DIR}

echo "📦 Preparing .NET Update Package ($PACKAGE_VERSION)..."

# 0. Build Frontend (React)
echo "🎨 Building Frontend..."
cd frontend
# Ensure dependencies are installed (including devDeps for build tools)
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend Build Failed!"
    exit 1
fi
cd ..

# Clear old static files and copy new build to Backend wwwroot
echo "📂 Updating Backend wwwroot..."
rm -rf dotnet-backend/Unity.API/wwwroot/*
mkdir -p dotnet-backend/Unity.API/wwwroot
cp -r frontend/build/* dotnet-backend/Unity.API/wwwroot/

# 1. Build .NET Backend (Self-Contained)
echo "🏗️ Building .NET Backend (Self-Contained)..."
cd dotnet-backend/Unity.API
dotnet publish -c Release -r win-x64 --self-contained true -o ../../${PACKAGE_DIR}/backend
cd ../..

# Environment variable is now set in source web.config

# Create logs directory
mkdir -p ${PACKAGE_DIR}/backend/logs

# 2. Add Helper Scripts
echo "📜 Adding Update Scripts..."

# Create INSTALL_DOTNET_UPDATE.bat
cat <<EOF > ${PACKAGE_DIR}/INSTALL_DOTNET_UPDATE.bat
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
EOF

# 3. Zip Package
echo "🤐 Zipping Package..."
zip -r ${PACKAGEZIP_FILE} ${PACKAGE_DIR}

echo "✅ .NET Update Package Created: ${PACKAGEZIP_FILE}"
