@echo off
title NexussXSystems - Servidor v2.0
color 0B

echo.
echo  ==========================================
echo    NEXUSS X SYSTEMS - Server v2.0
echo  ==========================================
echo.

:: Matar proceso anterior en puerto 3002 si existe
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002 "') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo  [*] Iniciando servidor en http://localhost:3002
echo  [*] Presiona Ctrl+C para detener
echo.

cd /d "%~dp0server"
node --experimental-sqlite index.js

pause
