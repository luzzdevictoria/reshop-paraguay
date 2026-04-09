@echo off
title Verificador de Estructura - ReShop Paraguay
color 0E

set "BASE=C:\Users\pirov\ReShop"
set "REPORT_DIR=%BASE%\datos_analizados"
set "REPORT_FILE=%REPORT_DIR%\reporte_estructura_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
set "REPORT_FILE=%REPORT_DIR%\reporte_estructura.txt"
set "ERROR=0"

:: Crear carpeta de reportes si no existe
if not exist "%REPORT_DIR%" (
    mkdir "%REPORT_DIR%"
)

:: Iniciar reporte
echo ================================================ > "%REPORT_FILE%"
echo    REPORTE DE ESTRUCTURA - RESHOP PARAGUAY >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo Fecha: %date% %time% >> "%REPORT_FILE%"
echo Propietaria: Luciana Noelia Da Silva >> "%REPORT_FILE%"
echo Desarrollador: Pedro Jose Pirovani >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"

cls
echo ================================================
echo    VERIFICADOR DE ESTRUCTURA - RESHOP PARAGUAY
echo ================================================
echo.
echo Generando reporte en: %REPORT_DIR%
echo.
echo ================================================
echo.

:: ============================================
:: VERIFICAR CARPETAS PRINCIPALES
:: ============================================
echo [1] Verificando carpetas principales...
echo.
echo ================================================ >> "%REPORT_FILE%"
echo [1] CARPETAS PRINCIPALES >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"

if exist "%BASE%\backend" ( 
    echo   [OK] backend >> "%REPORT_FILE%"
    echo   [OK] backend
) else ( 
    echo   [MISSING] backend >> "%REPORT_FILE%"
    echo   [MISSING] backend
    set ERROR=1 
)

if exist "%BASE%\frontend" ( 
    echo   [OK] frontend >> "%REPORT_FILE%"
    echo   [OK] frontend
) else ( 
    echo   [MISSING] frontend >> "%REPORT_FILE%"
    echo   [MISSING] frontend
    set ERROR=1 
)

if exist "%BASE%\re-shop-docs" ( 
    echo   [OK] re-shop-docs >> "%REPORT_FILE%"
    echo   [OK] re-shop-docs
) else ( 
    echo   [WARN] re-shop-docs (opcional) >> "%REPORT_FILE%"
    echo   [WARN] re-shop-docs (opcional)
)

if exist "%BASE%\config" ( 
    echo   [OK] config >> "%REPORT_FILE%"
    echo   [OK] config
) else ( 
    echo   [WARN] config (opcional) >> "%REPORT_FILE%"
    echo   [WARN] config (opcional)
)

if exist "%BASE%\scripts" ( 
    echo   [OK] scripts >> "%REPORT_FILE%"
    echo   [OK] scripts
) else ( 
    echo   [WARN] scripts (opcional) >> "%REPORT_FILE%"
    echo   [WARN] scripts (opcional)
)

echo. >> "%REPORT_FILE%"
echo.

:: ============================================
:: VERIFICAR BACKEND
:: ============================================
echo [2] Verificando estructura del backend...
echo.
echo ================================================ >> "%REPORT_FILE%"
echo [2] ESTRUCTURA DEL BACKEND >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"

:: Archivos principales
if exist "%BASE%\backend\server.js" ( 
    echo   [OK] backend\server.js >> "%REPORT_FILE%"
    echo   [OK] backend\server.js
) else ( 
    echo   [MISSING] backend\server.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\server.js
    set ERROR=1 
)

if exist "%BASE%\backend\database.js" ( 
    echo   [OK] backend\database.js >> "%REPORT_FILE%"
    echo   [OK] backend\database.js
) else ( 
    echo   [MISSING] backend\database.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\database.js
    set ERROR=1 
)

if exist "%BASE%\backend\.env" ( 
    echo   [OK] backend\.env >> "%REPORT_FILE%"
    echo   [OK] backend\.env
) else ( 
    echo   [WARN] backend\.env (crear con variables) >> "%REPORT_FILE%"
    echo   [WARN] backend\.env (crear con variables)
)

if exist "%BASE%\backend\package.json" ( 
    echo   [OK] backend\package.json >> "%REPORT_FILE%"
    echo   [OK] backend\package.json
) else ( 
    echo   [MISSING] backend\package.json >> "%REPORT_FILE%"
    echo   [MISSING] backend\package.json
    set ERROR=1 
)

:: Carpetas backend
if exist "%BASE%\backend\src\controllers" ( 
    echo   [OK] backend\src\controllers >> "%REPORT_FILE%"
    echo   [OK] backend\src\controllers
) else ( 
    echo   [MISSING] backend\src\controllers >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\controllers
    set ERROR=1 
)

if exist "%BASE%\backend\src\models" ( 
    echo   [OK] backend\src\models >> "%REPORT_FILE%"
    echo   [OK] backend\src\models
) else ( 
    echo   [WARN] backend\src\models (opcional) >> "%REPORT_FILE%"
    echo   [WARN] backend\src\models (opcional)
)

if exist "%BASE%\backend\src\routes" ( 
    echo   [OK] backend\src\routes >> "%REPORT_FILE%"
    echo   [OK] backend\src\routes
) else ( 
    echo   [MISSING] backend\src\routes >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\routes
    set ERROR=1 
)

if exist "%BASE%\backend\src\middleware" ( 
    echo   [OK] backend\src\middleware >> "%REPORT_FILE%"
    echo   [OK] backend\src\middleware
) else ( 
    echo   [MISSING] backend\src\middleware >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\middleware
    set ERROR=1 
)

if exist "%BASE%\backend\src\utils" ( 
    echo   [OK] backend\src\utils >> "%REPORT_FILE%"
    echo   [OK] backend\src\utils
) else ( 
    echo   [WARN] backend\src\utils (opcional) >> "%REPORT_FILE%"
    echo   [WARN] backend\src\utils (opcional)
)

if exist "%BASE%\backend\uploads" ( 
    echo   [OK] backend\uploads >> "%REPORT_FILE%"
    echo   [OK] backend\uploads
) else ( 
    echo   [WARN] backend\uploads (opcional) >> "%REPORT_FILE%"
    echo   [WARN] backend\uploads (opcional)
)

if exist "%BASE%\backend\logs" ( 
    echo   [OK] backend\logs >> "%REPORT_FILE%"
    echo   [OK] backend\logs
) else ( 
    echo   [WARN] backend\logs (opcional) >> "%REPORT_FILE%"
    echo   [WARN] backend\logs (opcional)
)

:: Archivos controllers
if exist "%BASE%\backend\src\controllers\authController.js" ( 
    echo   [OK] backend\src\controllers\authController.js >> "%REPORT_FILE%"
    echo   [OK] backend\src\controllers\authController.js
) else ( 
    echo   [MISSING] backend\src\controllers\authController.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\controllers\authController.js
    set ERROR=1 
)

if exist "%BASE%\backend\src\controllers\productController.js" ( 
    echo   [OK] backend\src\controllers\productController.js >> "%REPORT_FILE%"
    echo   [OK] backend\src\controllers\productController.js
) else ( 
    echo   [MISSING] backend\src\controllers\productController.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\controllers\productController.js
    set ERROR=1 
)

:: Archivos routes
if exist "%BASE%\backend\src\routes\authRoutes.js" ( 
    echo   [OK] backend\src\routes\authRoutes.js >> "%REPORT_FILE%"
    echo   [OK] backend\src\routes\authRoutes.js
) else ( 
    echo   [MISSING] backend\src\routes\authRoutes.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\routes\authRoutes.js
    set ERROR=1 
)

if exist "%BASE%\backend\src\routes\productRoutes.js" ( 
    echo   [OK] backend\src\routes\productRoutes.js >> "%REPORT_FILE%"
    echo   [OK] backend\src\routes\productRoutes.js
) else ( 
    echo   [MISSING] backend\src\routes\productRoutes.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\routes\productRoutes.js
    set ERROR=1 
)

:: Archivos middleware
if exist "%BASE%\backend\src\middleware\auth.js" ( 
    echo   [OK] backend\src\middleware\auth.js >> "%REPORT_FILE%"
    echo   [OK] backend\src\middleware\auth.js
) else ( 
    echo   [MISSING] backend\src\middleware\auth.js >> "%REPORT_FILE%"
    echo   [MISSING] backend\src\middleware\auth.js
    set ERROR=1 
)

echo. >> "%REPORT_FILE%"
echo.

:: ============================================
:: VERIFICAR FRONTEND
:: ============================================
echo [3] Verificando estructura del frontend...
echo.
echo ================================================ >> "%REPORT_FILE%"
echo [3] ESTRUCTURA DEL FRONTEND >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"

:: HTML files
if exist "%BASE%\frontend\index.html" ( 
    echo   [OK] frontend\index.html >> "%REPORT_FILE%"
    echo   [OK] frontend\index.html
) else ( 
    echo   [MISSING] frontend\index.html >> "%REPORT_FILE%"
    echo   [MISSING] frontend\index.html
    set ERROR=1 
)

if exist "%BASE%\frontend\product-detail.html" ( 
    echo   [OK] frontend\product-detail.html >> "%REPORT_FILE%"
    echo   [OK] frontend\product-detail.html
) else ( 
    echo   [MISSING] frontend\product-detail.html >> "%REPORT_FILE%"
    echo   [MISSING] frontend\product-detail.html
    set ERROR=1 
)

if exist "%BASE%\frontend\cart.html" ( 
    echo   [OK] frontend\cart.html >> "%REPORT_FILE%"
    echo   [OK] frontend\cart.html
) else ( 
    echo   [MISSING] frontend\cart.html >> "%REPORT_FILE%"
    echo   [MISSING] frontend\cart.html
    set ERROR=1 
)

if exist "%BASE%\frontend\checkout.html" ( 
    echo   [OK] frontend\checkout.html >> "%REPORT_FILE%"
    echo   [OK] frontend\checkout.html
) else ( 
    echo   [MISSING] frontend\checkout.html >> "%REPORT_FILE%"
    echo   [MISSING] frontend\checkout.html
    set ERROR=1 
)

if exist "%BASE%\frontend\order-confirmation.html" ( 
    echo   [OK] frontend\order-confirmation.html >> "%REPORT_FILE%"
    echo   [OK] frontend\order-confirmation.html
) else ( 
    echo   [WARN] frontend\order-confirmation.html (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\order-confirmation.html (opcional)
)

if exist "%BASE%\frontend\login.html" ( 
    echo   [OK] frontend\login.html >> "%REPORT_FILE%"
    echo   [OK] frontend\login.html
) else ( 
    echo   [WARN] frontend\login.html (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\login.html (opcional)
)

if exist "%BASE%\frontend\profile.html" ( 
    echo   [OK] frontend\profile.html >> "%REPORT_FILE%"
    echo   [OK] frontend\profile.html
) else ( 
    echo   [WARN] frontend\profile.html (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\profile.html (opcional)
)

:: Carpetas frontend
if exist "%BASE%\frontend\css" ( 
    echo   [OK] frontend\css >> "%REPORT_FILE%"
    echo   [OK] frontend\css
) else ( 
    echo   [WARN] frontend\css (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\css (opcional)
)

if exist "%BASE%\frontend\js" ( 
    echo   [OK] frontend\js >> "%REPORT_FILE%"
    echo   [OK] frontend\js
) else ( 
    echo   [MISSING] frontend\js >> "%REPORT_FILE%"
    echo   [MISSING] frontend\js
    set ERROR=1 
)

if exist "%BASE%\frontend\assets\images" ( 
    echo   [OK] frontend\assets\images >> "%REPORT_FILE%"
    echo   [OK] frontend\assets\images
) else ( 
    echo   [WARN] frontend\assets\images (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\assets\images (opcional)
)

if exist "%BASE%\frontend\assets\icons" ( 
    echo   [OK] frontend\assets\icons >> "%REPORT_FILE%"
    echo   [OK] frontend\assets\icons
) else ( 
    echo   [WARN] frontend\assets\icons (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\assets\icons (opcional)
)

:: Archivos JS frontend
if exist "%BASE%\frontend\js\api.js" ( 
    echo   [OK] frontend\js\api.js >> "%REPORT_FILE%"
    echo   [OK] frontend\js\api.js
) else ( 
    echo   [MISSING] frontend\js\api.js >> "%REPORT_FILE%"
    echo   [MISSING] frontend\js\api.js
    set ERROR=1 
)

if exist "%BASE%\frontend\js\app.js" ( 
    echo   [OK] frontend\js\app.js >> "%REPORT_FILE%"
    echo   [OK] frontend\js\app.js
) else ( 
    echo   [MISSING] frontend\js\app.js >> "%REPORT_FILE%"
    echo   [MISSING] frontend\js\app.js
    set ERROR=1 
)

if exist "%BASE%\frontend\js\auth.js" ( 
    echo   [OK] frontend\js\auth.js >> "%REPORT_FILE%"
    echo   [OK] frontend\js\auth.js
) else ( 
    echo   [WARN] frontend\js\auth.js (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\js\auth.js (opcional)
)

if exist "%BASE%\frontend\js\products.js" ( 
    echo   [OK] frontend\js\products.js >> "%REPORT_FILE%"
    echo   [OK] frontend\js\products.js
) else ( 
    echo   [MISSING] frontend\js\products.js >> "%REPORT_FILE%"
    echo   [MISSING] frontend\js\products.js
    set ERROR=1 
)

if exist "%BASE%\frontend\js\utils.js" ( 
    echo   [OK] frontend\js\utils.js >> "%REPORT_FILE%"
    echo   [OK] frontend\js\utils.js
) else ( 
    echo   [MISSING] frontend\js\utils.js >> "%REPORT_FILE%"
    echo   [MISSING] frontend\js\utils.js
    set ERROR=1 
)

if exist "%BASE%\frontend\js\cart.js" ( 
    echo   [OK] frontend\js\cart.js >> "%REPORT_FILE%"
    echo   [OK] frontend\js\cart.js
) else ( 
    echo   [WARN] frontend\js\cart.js (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\js\cart.js (opcional)
)

:: Logo
if exist "%BASE%\frontend\assets\images\logo.png" ( 
    echo   [OK] frontend\assets\images\logo.png >> "%REPORT_FILE%"
    echo   [OK] frontend\assets\images\logo.png
) else ( 
    echo   [WARN] frontend\assets\images\logo.png (opcional) >> "%REPORT_FILE%"
    echo   [WARN] frontend\assets\images\logo.png (opcional)
)

echo. >> "%REPORT_FILE%"
echo.

:: ============================================
:: VERIFICAR ARCHIVOS DE CONFIGURACION
:: ============================================
echo [4] Verificando archivos de configuracion...
echo.
echo ================================================ >> "%REPORT_FILE%"
echo [4] ARCHIVOS DE CONFIGURACION >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"

if exist "%BASE%\iniciar.bat" ( 
    echo   [OK] iniciar.bat >> "%REPORT_FILE%"
    echo   [OK] iniciar.bat
) else ( 
    echo   [WARN] iniciar.bat (opcional) >> "%REPORT_FILE%"
    echo   [WARN] iniciar.bat (opcional)
)

if exist "%BASE%\detener.bat" ( 
    echo   [OK] detener.bat >> "%REPORT_FILE%"
    echo   [OK] detener.bat
) else ( 
    echo   [WARN] detener.bat (opcional) >> "%REPORT_FILE%"
    echo   [WARN] detener.bat (opcional)
)

if exist "%BASE%\verificar_estructura.bat" ( 
    echo   [OK] verificar_estructura.bat >> "%REPORT_FILE%"
    echo   [OK] verificar_estructura.bat
) else ( 
    echo   [WARN] verificar_estructura.bat (este archivo) >> "%REPORT_FILE%"
    echo   [WARN] verificar_estructura.bat (este archivo)
)

if exist "%BASE%\CREDENCIALES_SUPABASE.txt" ( 
    echo   [OK] CREDENCIALES_SUPABASE.txt >> "%REPORT_FILE%"
    echo   [OK] CREDENCIALES_SUPABASE.txt
) else ( 
    echo   [WARN] CREDENCIALES_SUPABASE.txt (opcional) >> "%REPORT_FILE%"
    echo   [WARN] CREDENCIALES_SUPABASE.txt (opcional)
)

if exist "%BASE%\.gitignore" ( 
    echo   [OK] .gitignore >> "%REPORT_FILE%"
    echo   [OK] .gitignore
) else ( 
    echo   [WARN] .gitignore (opcional) >> "%REPORT_FILE%"
    echo   [WARN] .gitignore (opcional)
)

if exist "%BASE%\README.md" ( 
    echo   [OK] README.md >> "%REPORT_FILE%"
    echo   [OK] README.md
) else ( 
    echo   [WARN] README.md (opcional) >> "%REPORT_FILE%"
    echo   [WARN] README.md (opcional)
)

echo. >> "%REPORT_FILE%"
echo.

:: ============================================
:: VERIFICAR EXCLUSION DE NODE_MODULES
:: ============================================
echo [5] Verificando node_modules (excluido)...
echo.
echo ================================================ >> "%REPORT_FILE%"
echo [5] NODE_MODULES (EXCLUIDO DEL REPORTE) >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"

if exist "%BASE%\backend\node_modules" ( 
    echo   [INFO] backend\node_modules existe (excluido - OK) >> "%REPORT_FILE%"
    echo   [INFO] backend\node_modules existe (excluido - OK)
) else ( 
    echo   [INFO] backend\node_modules no existe >> "%REPORT_FILE%"
    echo   [INFO] backend\node_modules no existe
)

if exist "%BASE%\frontend\node_modules" ( 
    echo   [INFO] frontend\node_modules existe (excluido - OK) >> "%REPORT_FILE%"
    echo   [INFO] frontend\node_modules existe (excluido - OK)
) else ( 
    echo   [INFO] frontend\node_modules no existe >> "%REPORT_FILE%"
    echo   [INFO] frontend\node_modules no existe
)

echo. >> "%REPORT_FILE%"
echo.

:: ============================================
:: RESUMEN FINAL
:: ============================================
echo ================================================ >> "%REPORT_FILE%"
echo [RESUMEN FINAL] >> "%REPORT_FILE%"
echo ================================================ >> "%REPORT_FILE%"

if "%ERROR%"=="1" (
    echo [RESULTADO] HAY ARCHIVOS O CARPETAS FALTANTES >> "%REPORT_FILE%"
    echo [RESULTADO] HAY ARCHIVOS O CARPETAS FALTANTES
    echo. >> "%REPORT_FILE%"
    echo Recomendacion: Revisa los elementos marcados con [MISSING] >> "%REPORT_FILE%"
    echo Recomendacion: Revisa los elementos marcados con [MISSING]
) else (
    echo [RESULTADO] ESTRUCTURA COMPLETA Y CORRECTA >> "%REPORT_FILE%"
    echo [RESULTADO] ESTRUCTURA COMPLETA Y CORRECTA
    echo. >> "%REPORT_FILE%"
    echo El proyecto ReShop Paraguay esta listo para funcionar! >> "%REPORT_FILE%"
    echo El proyecto ReShop Paraguay esta listo para funcionar!
)

echo. >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"
echo Reporte generado el: %date% %time% >> "%REPORT_FILE%"
echo Ubicacion del reporte: %REPORT_FILE% >> "%REPORT_FILE%"

echo.
echo ================================================
echo.
echo [REPORTE GENERADO]
echo.
echo Ubicacion: %REPORT_DIR%
echo Archivo: reporte_estructura.txt
echo.
echo ================================================
echo.
echo Para iniciar los servidores, ejecute: iniciar.bat
echo Para detener, ejecute: detener.bat
echo.
echo ================================================
pause