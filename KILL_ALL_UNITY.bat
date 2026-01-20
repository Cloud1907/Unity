@echo off
setlocal
echo ==========================================
echo TUM Unity Arkaplan Islemlerini Temizle
echo ==========================================

echo.
echo [1] Python servisleri kapatiliyor...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1

echo.
echo [2] Node/Frontend islemleri kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo [3] Port kontrolu (8000 ve 8080 bosaltiliyor)...
taskkill /F /FI "WINDOWTITLE eq Unity Backend" >nul 2>&1

echo.
echo [TEMIZLIK TAMAMLANDI]
echo Simdi UPDATE_EXISTING.bat calistirabilirsiniz.
pause
