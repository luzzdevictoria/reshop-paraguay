@echo off
title Iniciador de ReShop Paraguay
color 0A

echo ================================================
echo    RESHOP PARAGUAY - SHOPPING VIRTUAL
echo ================================================
echo.
echo Iniciando servidores...
echo.

REM Iniciar Backend (puerto 3000)
start "ReShop Backend" cmd /k "cd /d C:\Users\pirov\ReShop\backend && echo [BACKEND] Iniciando servidor... && npm run dev"

REM Esperar 3 segundos para que el backend arranque
timeout /t 3 /nobreak > nul

REM Iniciar Frontend (puerto 8080)
start "ReShop Frontend" cmd /k "cd /d C:\Users\pirov\ReShop\frontend && echo [FRONTEND] Iniciando servidor... && npx live-server --port=8080"

echo.
echo ================================================
echo    SERVIDORES INICIADOS
echo ================================================
echo.
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:8080
echo.
echo    Esperando peticiones...
echo ================================================
echo.
echo    Para detener: Cerrar las ventanas de CMD
echo ================================================

pause