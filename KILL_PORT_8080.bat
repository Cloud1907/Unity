@echo off
setlocal
echo ==========================================
echo 8080 Portunu Kullanan Islemi Sonlandirici
echo ==========================================

:: 1. PID Bul
echo.
echo [1] 8080 portunu kullanan islem araniyor...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080"') do (
    set PID=%%a
    goto Found
)

echo [BILGI] 8080 portunu kullanan islem bulunamadi.
echo Zaten bosta olabilir.
goto End

:Found
echo [BULUNDU] PID: %PID%

:: 2. Islemi Oldur
echo.
echo [2] PID %PID% sonlandiriliyor...
taskkill /F /PID %PID%

if %errorlevel% equ 0 (
    echo [BASARILI] Islem sonlandirildi.
    echo IIS artik bu portu kullanabilir.
) else (
    echo [HATA] Islem sonlandirilamadi. Yonetici olarak calistirdiniz mi?
)

:End
echo.
echo Islem tamamlandi.
pause
