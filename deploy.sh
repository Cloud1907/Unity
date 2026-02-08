#!/bin/bash

# --- CONFIGURATION ---
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/dotnet-backend"
BACKEND_PROJECT="Unity.API"
TIMESTAMP=$(date +"%Y%m%d_%H%M")
OUTPUT_NAME="UnityApp_Setup_$TIMESTAMP"
DESKTOP_DIR="$HOME/Desktop"
TEMP_DIR="$PROJECT_ROOT/temp_deploy"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Unity App Deployment Script Started...${NC}"

# 1. Clean Previous Temp
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 2. Build Frontend
echo -e "${GREEN}📦 Building Frontend...${NC}"
cd "$FRONTEND_DIR" || exit
# Ensure dependencies are installed (optional, takes time but safer)
# npm install 
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend Build Failed!${NC}"
    exit 1
fi

# 3. Build/Publish Backend
echo -e "${GREEN}🛠️  Publishing Backend...${NC}"
cd "$BACKEND_DIR" || exit
dotnet publish "$BACKEND_PROJECT" -c Release -o "$TEMP_DIR/publish"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend Publish Failed!${NC}"
    exit 1
fi

# 4. Merging Frontend into Backend wwwroot
echo -e "${GREEN}🔗 Merging Frontend into Backend...${NC}"
mkdir -p "$TEMP_DIR/publish/wwwroot"
cp -r "$FRONTEND_DIR/build/"* "$TEMP_DIR/publish/wwwroot/"

# 5. Zipping to Desktop
echo -e "${GREEN}🗜️  Zipping to Desktop...${NC}"
cd "$TEMP_DIR" || exit
zip -r "$DESKTOP_DIR/$OUTPUT_NAME.zip" publish

# 6. Cleanup
echo -e "${GREEN}🧹 Cleaning up...${NC}"
cd "$PROJECT_ROOT" || exit
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✅ SUCCESS! Deployment Package Created:${NC}"
echo -e "${GREEN}👉 $DESKTOP_DIR/$OUTPUT_NAME.zip${NC}"
