@echo off
title Detener Servidores ReShop
color 0C

echo ================================================
echo    DETENIENDO SERVIDORES DE RESHOP
echo ================================================
echo.

REM Cerrar procesos de node y live-server
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM live-server.exe > nul 2>&1

echo Servidores detenidos correctamente.
echo.
pause