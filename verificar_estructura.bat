@echo off
title VERIFICADOR DE ESTRUCTURA - RESHOP PARAGUAY
color 0A
setlocal enabledelayedexpansion

:: ============================================================
:: CONFIGURACION
:: ============================================================
set "BASE=C:\Users\pirov\ReShop"
set "REPORT_DIR=%BASE%\datos_analizados"
set "REPORT_FILE=%REPORT_DIR%\reporte_estructura.txt"
set "TREE_FILE=%REPORT_DIR%\arbol_proyecto.txt"
set "ERROR=0"
set "WARNING=0"

:: Crear carpeta de reportes si no existe
if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"

:: ============================================================
:: LIMPIAR ARCHIVOS ANTERIORES
:: ============================================================
type nul > "%REPORT_FILE%"
type nul > "%TREE_FILE%"

:: ============================================================
:: GENERAR ÁRBOL DE ARCHIVOS (excluyendo node_modules)
:: ============================================================
(
echo ============================================================
echo    ARBOL DE ARCHIVOS - RESHOP PARAGUAY
echo ============================================================
echo.
echo Fecha: %date% %time%
echo Propietaria: Luciana Noelia Da Silva
echo Desarrollador: Pedro Jose Pirovani
echo.
echo NOTA: Se excluyen las carpetas node_modules para reducir tamaño
echo.
echo ============================================================
echo.
) > "%TREE_FILE%"

:: Generar árbol excluyendo node_modules
cd /d "%BASE%"
tree /f | findstr /v /i "node_modules" >> "%TREE_FILE%"

:: ============================================================
:: INICIAR REPORTE PRINCIPAL
:: ============================================================
(
echo ============================================================
echo    REPORTE COMPLETO DE ESTRUCTURA - RESHOP PARAGUAY
echo ============================================================
echo.
echo Fecha: %date% %time%
echo Propietaria: Luciana Noelia Da Silva
echo Desarrollador: Pedro Jose Pirovani
echo.
echo NOTA: El arbol de archivos se encuentra en:
echo       %TREE_FILE%
echo.
) >> "%REPORT_FILE%"

:: ============================================================
:: [1] CARPETAS PRINCIPALES
:: ============================================================
(
echo ============================================================
echo [1] CARPETAS PRINCIPALES
echo ============================================================
) >> "%REPORT_FILE%"

if exist "%BASE%\backend" ( echo   [OK] backend >> "%REPORT_FILE%" ) else ( echo   [MISSING] backend >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend" ( echo   [OK] frontend >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\re-shop-docs" ( echo   [OK] re-shop-docs >> "%REPORT_FILE%" ) else ( echo   [WARN] re-shop-docs (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\config" ( echo   [OK] config >> "%REPORT_FILE%" ) else ( echo   [WARN] config (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\scripts" ( echo   [OK] scripts >> "%REPORT_FILE%" ) else ( echo   [WARN] scripts (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\src" ( echo   [OK] src >> "%REPORT_FILE%" ) else ( echo   [MISSING] src >> "%REPORT_FILE%" & set /a ERROR+=1 )

:: ============================================================
:: [2] ESTRUCTURA DEL BACKEND (RAIZ)
:: ============================================================
(
echo.
echo ============================================================
echo [2] ESTRUCTURA DEL BACKEND (RAIZ - src/)
echo ============================================================
) >> "%REPORT_FILE%"

:: Verificar src/routes (la ubicacion REAL de tus rutas)
if exist "%BASE%\src\routes" ( 
    echo   [OK] src\routes >> "%REPORT_FILE%" 
    
    :: Listar archivos en src/routes
    echo   Archivos encontrados en src\routes: >> "%REPORT_FILE%"
    for %%f in ("%BASE%\src\routes\*.js") do (
        echo     - %%~nxf >> "%REPORT_FILE%"
    )
) else ( 
    echo   [MISSING] src\routes >> "%REPORT_FILE%" 
    set /a ERROR+=1 
)

if exist "%BASE%\src\controllers" ( echo   [OK] src\controllers >> "%REPORT_FILE%" ) else ( echo   [WARN] src\controllers (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\src\middleware" ( echo   [OK] src\middleware >> "%REPORT_FILE%" ) else ( echo   [WARN] src\middleware (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\src\models" ( echo   [OK] src\models >> "%REPORT_FILE%" ) else ( echo   [WARN] src\models (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: Archivos principales en la raiz
if exist "%BASE%\server.js" ( echo   [OK] server.js (raiz) >> "%REPORT_FILE%" ) else ( echo   [MISSING] server.js (raiz) >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\package.json" ( echo   [OK] package.json >> "%REPORT_FILE%" ) else ( echo   [MISSING] package.json >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\.env" ( echo   [OK] .env >> "%REPORT_FILE%" ) else ( echo   [WARN] .env (crear con variables) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: ============================================================
:: [3] ESTRUCTURA DEL BACKEND (carpeta backend/)
:: ============================================================
(
echo.
echo ============================================================
echo [3] ESTRUCTURA DEL BACKEND (carpeta backend/)
echo ============================================================
) >> "%REPORT_FILE%"

if exist "%BASE%\backend\server.js" ( echo   [OK] backend\server.js >> "%REPORT_FILE%" ) else ( echo   [WARN] backend\server.js (no utilizado) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\backend\package.json" ( echo   [OK] backend\package.json >> "%REPORT_FILE%" ) else ( echo   [WARN] backend\package.json (no utilizado) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\backend\.env" ( echo   [OK] backend\.env >> "%REPORT_FILE%" ) else ( echo   [WARN] backend\.env (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: ============================================================
:: [4] ESTRUCTURA DEL FRONTEND
:: ============================================================
(
echo.
echo ============================================================
echo [4] ESTRUCTURA DEL FRONTEND
echo ============================================================
) >> "%REPORT_FILE%"

:: HTML files
if exist "%BASE%\frontend\index.html" ( echo   [OK] frontend\index.html >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\index.html >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\product-detail.html" ( echo   [OK] frontend\product-detail.html >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\product-detail.html >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\cart.html" ( echo   [OK] frontend\cart.html >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\cart.html >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\checkout.html" ( echo   [OK] frontend\checkout.html >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\checkout.html >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\my-orders.html" ( echo   [OK] frontend\my-orders.html >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\my-orders.html (opcional - crear) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\login.html" ( echo   [OK] frontend\login.html >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\login.html (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\register.html" ( echo   [OK] frontend\register.html >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\register.html (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\profile.html" ( echo   [OK] frontend\profile.html >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\profile.html (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\dashboard-vendedor.html" ( echo   [OK] frontend\dashboard-vendedor.html >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\dashboard-vendedor.html (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: Carpetas frontend
if exist "%BASE%\frontend\css" ( echo   [OK] frontend\css >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\css (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\js" ( echo   [OK] frontend\js >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\js >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\assets\images" ( echo   [OK] frontend\assets\images >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\assets\images (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\assets\icons" ( echo   [OK] frontend\assets\icons >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\assets\icons (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: Archivos JS frontend
if exist "%BASE%\frontend\js\api.js" ( echo   [OK] frontend\js\api.js >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\js\api.js >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\js\app.js" ( echo   [OK] frontend\js\app.js >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\js\app.js >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\js\auth.js" ( echo   [OK] frontend\js\auth.js >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\js\auth.js (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\frontend\js\products.js" ( echo   [OK] frontend\js\products.js >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\js\products.js >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\js\utils.js" ( echo   [OK] frontend\js\utils.js >> "%REPORT_FILE%" ) else ( echo   [MISSING] frontend\js\utils.js >> "%REPORT_FILE%" & set /a ERROR+=1 )
if exist "%BASE%\frontend\js\cart.js" ( echo   [OK] frontend\js\cart.js >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\js\cart.js (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: Logo
if exist "%BASE%\frontend\assets\images\logo.png" ( echo   [OK] frontend\assets\images\logo.png >> "%REPORT_FILE%" ) else ( echo   [WARN] frontend\assets\images\logo.png (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: ============================================================
:: [5] ARCHIVOS DE CONFIGURACION
:: ============================================================
(
echo.
echo ============================================================
echo [5] ARCHIVOS DE CONFIGURACION
echo ============================================================
) >> "%REPORT_FILE%"

if exist "%BASE%\iniciar.bat" ( echo   [OK] iniciar.bat >> "%REPORT_FILE%" ) else ( echo   [WARN] iniciar.bat (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\detener.bat" ( echo   [OK] detener.bat >> "%REPORT_FILE%" ) else ( echo   [WARN] detener.bat (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\verificar_estructura.bat" ( echo   [OK] verificar_estructura.bat >> "%REPORT_FILE%" ) else ( echo   [WARN] verificar_estructura.bat (este archivo) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\.gitignore" ( echo   [OK] .gitignore >> "%REPORT_FILE%" ) else ( echo   [WARN] .gitignore (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )
if exist "%BASE%\README.md" ( echo   [OK] README.md >> "%REPORT_FILE%" ) else ( echo   [WARN] README.md (opcional) >> "%REPORT_FILE%" & set /a WARNING+=1 )

:: ============================================================
:: [6] NODE_MODULES
:: ============================================================
(
echo.
echo ============================================================
echo [6] NODE_MODULES
echo ============================================================
) >> "%REPORT_FILE%"

if exist "%BASE%\node_modules" ( echo   [INFO] node_modules (raiz): EXISTE >> "%REPORT_FILE%" ) else ( echo   [INFO] node_modules (raiz): NO EXISTE >> "%REPORT_FILE%" )
if exist "%BASE%\backend\node_modules" ( echo   [INFO] backend\node_modules: EXISTE >> "%REPORT_FILE%" ) else ( echo   [INFO] backend\node_modules: NO EXISTE >> "%REPORT_FILE%" )
if exist "%BASE%\frontend\node_modules" ( echo   [INFO] frontend\node_modules: NO EXISTE >> "%REPORT_FILE%" ) else ( echo   [INFO] frontend\node_modules: NO EXISTE >> "%REPORT_FILE%" )

:: ============================================================
:: [7] METADATOS DEL PROYECTO
:: ============================================================
(
echo.
echo ============================================================
echo [7] METADATOS DEL PROYECTO
echo ============================================================
) >> "%REPORT_FILE%"

:: Conteo de archivos (excluyendo node_modules)
set JS_COUNT=0
set HTML_COUNT=0
set CSS_COUNT=0

for /r "%BASE%" %%f in (*.js) do (
    echo %%f | findstr /i "node_modules" >nul
    if errorlevel 1 set /a JS_COUNT+=1
)
for /r "%BASE%" %%f in (*.html) do (
    echo %%f | findstr /i "node_modules" >nul
    if errorlevel 1 set /a HTML_COUNT+=1
)
for /r "%BASE%" %%f in (*.css) do (
    echo %%f | findstr /i "node_modules" >nul
    if errorlevel 1 set /a CSS_COUNT+=1
)

echo   Archivos .js: %JS_COUNT% >> "%REPORT_FILE%"
echo   Archivos .html: %HTML_COUNT% >> "%REPORT_FILE%"
echo   Archivos .css: %CSS_COUNT% >> "%REPORT_FILE%"

:: ============================================================
:: [8] GIT STATUS
:: ============================================================
(
echo.
echo ============================================================
echo [8] GIT STATUS
echo ============================================================
) >> "%REPORT_FILE%"

cd /d "%BASE%"
git status --short >> "%REPORT_FILE%" 2>nul
if errorlevel 1 echo   [WARN] No es un repositorio git inicializado >> "%REPORT_FILE%"

:: ============================================================
:: [9] ARCHIVOS EN SRC/ROUTES (DETALLE)
:: ============================================================
(
echo.
echo ============================================================
echo [9] ARCHIVOS EN src/routes/
echo ============================================================
) >> "%REPORT_FILE%"

if exist "%BASE%\src\routes" (
    for %%f in ("%BASE%\src\routes\*.js") do (
        echo   - %%~nxf >> "%REPORT_FILE%"
    )
) else (
    echo   [MISSING] La carpeta src/routes no existe >> "%REPORT_FILE%"
)

:: ============================================================
:: RESUMEN FINAL
:: ============================================================
(
echo.
echo ============================================================
echo [RESUMEN FINAL]
echo ============================================================
echo   Errores [MISSING]: %ERROR%
echo   Advertencias [WARN]: %WARNING%
echo.
) >> "%REPORT_FILE%"

if %ERROR% GTR 0 (
    echo   [RESULTADO] HAY %ERROR% ELEMENTOS FALTANTES >> "%REPORT_FILE%"
) else if %WARNING% GTR 0 (
    echo   [RESULTADO] ESTRUCTURA COMPLETA CON %WARNING% ADVERTENCIAS >> "%REPORT_FILE%"
) else (
    echo   [RESULTADO] ESTRUCTURA COMPLETA Y CORRECTA >> "%REPORT_FILE%"
)

(
echo.
echo ============================================================
echo ARCHIVOS GENERADOS:
echo   - Reporte estructura: %REPORT_FILE%
echo   - Arbol de archivos: %TREE_FILE%
echo ============================================================
) >> "%REPORT_FILE%"

(
echo.
echo ============================================================
echo Reporte generado el: %date% %time%
echo ============================================================
) >> "%REPORT_FILE%"

:: ============================================================
:: MOSTRAR EN PANTALLA
:: ============================================================
cls
echo ============================================================
echo    VERIFICADOR DE ESTRUCTURA - RESHOP PARAGUAY
echo ============================================================
echo.
echo [REPORTES GENERADOS]
echo.
echo 1. Reporte estructura: %REPORT_DIR%\reporte_estructura.txt
echo 2. Arbol de archivos:  %TREE_FILE%
echo.
echo ============================================================
echo RESUMEN:
echo   - Errores [MISSING]: %ERROR%
echo   - Advertencias [WARN]: %WARNING%
echo ============================================================
echo.
if %ERROR% GTR 0 (
    echo [ESTADO] HAY %ERROR% ELEMENTOS FALTANTES
    color 0C
) else if %WARNING% GTR 0 (
    echo [ESTADO] COMPLETO CON %WARNING% ADVERTENCIAS
    color 0E
) else (
    echo [ESTADO] ESTRUCTURA COMPLETA Y CORRECTA
    color 0A
)
echo.
echo ============================================================
pause