#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Unity Projesi Başlatılıyor ===${NC}"

# Gerekli araçların kontrolü
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}Hata: .NET SDK bulunamadı! Lütfen yükleyin.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Hata: Node.js/npm bulunamadı! Lütfen yükleyin.${NC}"
    exit 1
fi

# 1. Backend Başlatma
echo -e "${GREEN}>> Backend hazırlanıyor...${NC}"
cd dotnet-backend

# Temizlik ve Restore (Opsiyonel ama güvenli)
# echo "Cleaning..."
# dotnet clean
echo "Packages restoring..."
dotnet restore

# Çalıştırma
echo -e "${GREEN}>> Backend başlatılıyor (http://localhost:8080)...${NC}"
# Arka planda çalıştır, logları dosyaya yaz
dotnet run --project Unity.API > backend_log.txt 2>&1 &
BACKEND_PID=$!

echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
echo "Backend logları 'dotnet-backend/backend_log.txt' dosyasına yazılıyor."
cd ..

# Backend'in ayağa kalkması için kısa bir bekleme
echo "Backend'in hazır olması bekleniyor (5 sn)..."
sleep 5

# 2. Frontend Başlatma
echo -e "${GREEN}>> Frontend hazırlanıyor...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Node modules bulunamadı, yükleniyor..."
    npm install
fi

echo -e "${GREEN}>> Frontend başlatılıyor (http://localhost:3000)...${NC}"
npm start

# Frontend kapandığında (Ctrl+C), Backend'i de kapat
echo -e "${RED}>> Uygulama kapatılıyor...${NC}"
kill $BACKEND_PID
echo "Backend durduruldu."
