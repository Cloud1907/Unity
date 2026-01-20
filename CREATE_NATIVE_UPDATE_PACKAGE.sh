#!/bin/bash

# 4Flow Native Update Package Generator
# Use this on Mac/Linux to generate a zip file for Windows Server update.

VERSION=$(date +"%Y%m%d_%H%M")
PACKAGE_DIR="update-bundle"
APP_DIR="${PACKAGE_DIR}/app"

echo "📦 Preparing Native Update Package (${VERSION})..."

# 1. Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf ${PACKAGE_DIR}
rm -rf ${PACKAGE_DIR}.zip
mkdir -p ${APP_DIR}

# 2. Build Frontend
echo "🎨 Building Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

# 3. Copy Frontend Build
echo "📂 Copying Frontend Build..."
# Note: Rename 'build' to 'frontend-build' as expected by UPDATE_EXISTING.bat
cp -r frontend/build ${APP_DIR}/frontend-build

# 4. Copy Backend
echo "🐍 Copying Backend..."
rsync -av --exclude='venv' \
          --exclude='__pycache__' \
          --exclude='*.pyc' \
          --exclude='.env' \
          --exclude='backend.log' \
          --exclude='uploads' \
          --exclude='.DS_Store' \
          backend ${APP_DIR}/

# 5. Add Update Script
echo "📜 Adding Update Script..."
cp UPDATE_EXISTING.bat ${PACKAGE_DIR}/
cp install_service_task.bat ${PACKAGE_DIR}/
cp run_backend_hidden.vbs ${PACKAGE_DIR}/
cp start_backend.bat ${PACKAGE_DIR}/
cp KILL_PORT_8080.bat ${PACKAGE_DIR}/
cp KILL_ALL_UNITY.bat ${PACKAGE_DIR}/

# 6. Zip Package
echo "🤐 Zipping Package..."
zip -r ${PACKAGE_DIR}.zip ${PACKAGE_DIR}

echo "✅ Package Created: ${PACKAGE_DIR}.zip"
echo "👉 Copy this zip file to the Windows Server and unzip it."
echo "👉 Then run 'UPDATE_EXISTING.bat' inside the folder."
