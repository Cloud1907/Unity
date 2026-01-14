@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo Unity Windows Servis Kurulumu
echo ==========================================

:: Yonetici kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Yonetici olarak calistirin!
    pause
    exit /b 1
)

set TASK_NAME="UnityBackend"
set VBS_PATH="%~dp0run_backend_hidden.vbs"

echo [1/2] Eski servis varsa siliniyor...
schtasks /delete /tn %TASK_NAME% /f >nul 2>&1

echo [2/2] Yeni servis olusturuluyor...
:: Sistem baslangicinda calissin, SYSTEM yetkisiyle (arka planda)
schtasks /create /tn %TASK_NAME% /tr "wscript.exe \"%~dp0run_backend_hidden.vbs\"" /sc onstart /ru SYSTEM /rl HIGHEST /f

echo.
echo ==========================================
echo SERVIS KURULDU!
echo Bilgisayari yeniden baslattiginizda otomatik calisacak.
echo.
echo Simdilik manuel baslatiliyor...
schtasks /run /tn %TASK_NAME%
echo ==========================================
pause
