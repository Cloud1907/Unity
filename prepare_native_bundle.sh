#!/bin/bash

# 4Flow IIS/Service Bundle Hazırlayıcı
# Bu script, Docker gerektirmeyen, IIS ve Windows Service uyumlu paketi hazırlar.

BUNDLE_NAME="native-bundle"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME

echo "📦 Native Bundle (IIS+Service) Hazırlanıyor..."

# 1. Klasör Yapısı
mkdir -p $BUNDLE_NAME/app
mkdir -p $BUNDLE_NAME/installers
mkdir -p $BUNDLE_NAME/wheels

# 2. Backend Kopyala
echo "📋 Backend kopyalanıyor..."
rsync -av --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' backend $BUNDLE_NAME/app/

# 3. Frontend Build Kopyala
if [ -d "frontend/build" ]; then
    echo "📋 Frontend build kopyalanıyor..."
    cp -r frontend/build $BUNDLE_NAME/app/frontend-build
else
    echo "⚠️ UYARI: Frontend build klasörü bulunamadı!"
fi

# 4. Web Config Kopyala (IIS için kritik)
echo "📋 Web Config kopyalanıyor..."
cp web.config $BUNDLE_NAME/app/frontend-build/

# 5. Helper Dosyalar
cp install_native_iis.bat $BUNDLE_NAME/
cp install_service_task.bat $BUNDLE_NAME/
cp start_backend.bat $BUNDLE_NAME/
cp run_backend_hidden.vbs $BUNDLE_NAME/
cp native_windows_guide.md $BUNDLE_NAME/README.md

# 6. Wheels (Python Kütüphaneleri) İndir
# Not: Daha önce indirmişsek tekrar indirmeyelim veya hızlı geçelim
if [ -d "wheels" ]; then
    cp -r wheels/* $BUNDLE_NAME/wheels/
else
    echo "⬇️  Python kütüphaneleri indiriliyor (Wheels)..."
    pip download -d $BUNDLE_NAME/wheels -r backend/requirements.txt --only-binary=:all: --platform win_amd64 --python-version 312 --no-deps || echo "⚠️ Internet gerekebilir."
    pip download -d $BUNDLE_NAME/wheels uvicorn colorama --only-binary=:all: --platform win_amd64 --python-version 312 --no-deps
fi

# 7. Zip'le
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME

echo "✅ Paket Hazır: ${BUNDLE_NAME}.zip"
