@echo off
echo Publisihng Backend...
cd dotnet-backend
dotnet publish -c Release -o ../dist/backend
cd ..

echo Building Frontend...
cd frontend
call npm install
call npm run build
move build ..\dist\frontend
cd ..

echo Creating Offline Zip...
powershell Compress-Archive -Path dist/* -DestinationPath UnityApp_Offline.zip -Force

echo Done! Output: UnityApp_Offline.zip
pause
