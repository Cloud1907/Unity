@echo off
cd /d "%~dp0"
call app\backend\venv\Scripts\activate.bat
python -m uvicorn server:app --app-dir app/backend --host 127.0.0.1 --port 8000 --log-level warning
