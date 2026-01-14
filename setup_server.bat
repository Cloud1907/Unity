@echo off
setlocal
echo ===================================================
echo   Unity App - Offline Server Setup (IIS)
echo ===================================================
echo.

:: 1. Ask for Port
set /p APP_PORT="Enter the Port number for the application (e.g. 80 or 8080): "
if "%APP_PORT%"=="" set APP_PORT=80

:: 2. Configure Web Config
echo.
echo [INFO] Configuring Port %APP_PORT%...

:: Check if IIS is installed
sc query W3SVC >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] IIS is not installed or running!
    pause
    exit /b 1
)

:: Create IIS Site (Requires Admin)
echo [INFO] Creating IIS Site "UnityApp" on Port %APP_PORT%...
echo (Ensure you are running as Administrator)
:: Note: Assumes the script is run FROM the UnityApp folder or the user followed instructions.
:: Better: Use current directory as physical path if script is inside it?
:: Let's stick to standard path for reliability.
%systemroot%\system32\inetsrv\appcmd add site /name:UnityApp /id:99 /bindings:http/*:%APP_PORT%: /physicalPath:"C:\inetpub\wwwroot\UnityApp"
%systemroot%\system32\inetsrv\appcmd start site "UnityApp"

echo.
echo Setup Complete!
echo 1. Ensure you extracted the ZIP to: C:\inetpub\wwwroot
echo    (So you have C:\inetpub\wwwroot\UnityApp\)
echo 2. Access http://localhost:%APP_PORT%/ to use the app.
echo.
pause
