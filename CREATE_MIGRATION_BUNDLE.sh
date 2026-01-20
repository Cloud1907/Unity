#!/bin/bash

# Configuration
VERSION=$(date +%Y%m%d_%H%M)
PACKAGE_DIR="migration-bundle"
rm -rf ${PACKAGE_DIR}
mkdir -p ${PACKAGE_DIR}/app
mkdir -p ${PACKAGE_DIR}/installers
mkdir -p ${PACKAGE_DIR}/wheels

echo "📦 Preparing Migration Bundle ($VERSION)..."

# 1. Copy Application Code
echo "🐍 Copying Backend..."
cp -r backend ${PACKAGE_DIR}/app/
rm -rf ${PACKAGE_DIR}/app/backend/venv
rm -rf ${PACKAGE_DIR}/app/backend/__pycache__

echo "📂 Copying Frontend Build..."
cp -r frontend/build ${PACKAGE_DIR}/app/frontend-build

# 2. Copy Installers & Wheels
# Note: You need to manually put python-installer.exe in 'installers' folder if not present
echo "🔧 Copying Installers..."
if [ -d "installers" ]; then
    cp installers/* ${PACKAGE_DIR}/installers/
else
    echo "⚠️ Warning: 'installers' directory not found. Please add python-installer.exe manually."
fi

echo "🎡 Copying Wheels..."
cp wheels/* ${PACKAGE_DIR}/wheels/

# 3. Copy Scripts
echo "📜 Adding Migration Scripts..."
cp MIGRATE_TO_PYTHON.bat ${PACKAGE_DIR}/
cp KILL_ALL_UNITY.bat ${PACKAGE_DIR}/
cp KILL_PORT_8080.bat ${PACKAGE_DIR}/
cp start_backend.bat ${PACKAGE_DIR}/
cp run_backend_hidden.vbs ${PACKAGE_DIR}/

# 4. Zip
echo "🤐 Zipping Package..."
zip -r migration-bundle.zip ${PACKAGE_DIR}

echo "✅ Migration Bundle Created: migration-bundle.zip"
