@echo off
title Hatricks
echo Starting Hatricks...

start "Hatricks Server" cmd /k "cd /d %~dp0server && node index.js"

timeout /t 2 /nobreak > nul

start "Hatricks UI" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak > nul

start http://localhost:5173

echo Hatricks is running.