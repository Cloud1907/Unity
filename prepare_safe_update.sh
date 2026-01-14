#!/bin/bash

# 4Flow Safe Update Bundle Hazırlayıcı
# Docker veya sıfır kurulum DEĞİL, mevcut IIS sistemini güncellemek için.

BUNDLE_NAME="update-bundle"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME

echo "📦 Safe Update Bundle Hazırlanıyor..."

# 1. Klasör Yapısı
mkdir -p $BUNDLE_NAME/app

# 2. Backend Kodları (Venv ve gereksizler hariç)
echo "📋 Backend kodları..."
rsync -av --exclude='venv' --exclude='__pycache__' --exclude='.env' backend $BUNDLE_NAME/app/

# 3. Frontend Build
if [ -d "frontend/build" ]; then
    echo "📋 Frontend build..."
    cp -r frontend/build $BUNDLE_NAME/app/frontend-build
    cp web.config $BUNDLE_NAME/app/frontend-build/
fi

# 4. Scriptler
cp UPDATE_EXISTING.bat $BUNDLE_NAME/
cp install_service_task.bat $BUNDLE_NAME/
cp run_backend_hidden.vbs $BUNDLE_NAME/
cp start_backend.bat $BUNDLE_NAME/

# 5. Zip'le
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME

echo "✅ Update Paketi Hazır: ${BUNDLE_NAME}.zip"
