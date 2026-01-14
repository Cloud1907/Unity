@echo off
cd /d "%~dp0\app"

echo ==========================================
echo Unity Baslatiliyor...
echo ==========================================

:: 1. Veritabanini Baslat (Servis olarak calismiyorsa)
:: Genelde MongoDB servis olarak kurulur ve otomatiktir.
:: Kontrol edelim:
sc query "MongoDB" >nul 2>&1
if errorlevel 1 (
    echo [UYARI] MongoDB servisi bulunamadi! Manuel baslatmayi deneyin.
) else (
    echo [OK] Veritabani servisi aktif.
)

:: 2. Backend Baslat
echo.
echo [Backend] Baslatiliyor...
start "Unity Backend" backend\venv\Scripts\python -m uvicorn server:app --app-dir backend --host 0.0.0.0 --port 8000

:: 3. Frontend Baslat
echo.
echo [Frontend] Baslatiliyor...
start "Unity Frontend" backend\venv\Scripts\python serve_frontend.py

echo.
echo Uygulama Acildi!
echo Tarayicida: http://localhost:8080
echo.
echo Pencereyi kapatmayin (Backend calismaya devam etsin).
pause
