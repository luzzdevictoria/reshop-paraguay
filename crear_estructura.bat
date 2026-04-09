@echo off
echo ================================================
echo Creando estructura de ReShop Paraguay
echo ================================================
echo.

cd /d C:\Users\pirov\ReShop

echo [1/6] Creando backend...
mkdir backend\src\controllers 2>nul
mkdir backend\src\models 2>nul
mkdir backend\src\routes 2>nul
mkdir backend\src\middleware 2>nul
mkdir backend\src\utils 2>nul
mkdir backend\uploads 2>nul
mkdir backend\logs 2>nul

echo [2/6] Creando frontend...
mkdir frontend\css 2>nul
mkdir frontend\js 2>nul
mkdir frontend\assets\images 2>nul
mkdir frontend\assets\icons 2>nul
mkdir frontend\partials 2>nul

echo [3/6] Creando configuraciones...
mkdir config 2>nul

echo [4/6] Creando scripts y utilidades...
mkdir scripts 2>nul

echo [5/6] Creando archivos base del backend...
echo. > backend\.env.example
echo. > backend\server.js
echo. > backend\package.json
echo. > backend\database.js

echo [6/6] Creando archivos base del frontend...
echo ^<!DOCTYPE html^> > frontend\index.html
echo ^<!DOCTYPE html^> > frontend\login.html
echo ^<!DOCTYPE html^> > frontend\register.html
echo ^<!DOCTYPE html^> > frontend\product-detail.html
echo ^<!DOCTYPE html^> > frontend\seller-store.html
echo ^<!DOCTYPE html^> > frontend\cart.html
echo ^<!DOCTYPE html^> > frontend\checkout.html
echo ^<!DOCTYPE html^> > frontend\profile.html
echo ^<!DOCTYPE html^> > frontend\new-product.html
echo ^<!DOCTYPE html^> > frontend\edit-product.html
echo ^<!DOCTYPE html^> > frontend\orders.html
echo ^<!DOCTYPE html^> > frontend\order-detail.html
echo ^<!DOCTYPE html^> > frontend\favorites.html
echo ^<!DOCTYPE html^> > frontend\admin-dashboard.html

echo. > frontend\css\main.css
echo. > frontend\css\components.css
echo. > frontend\css\responsive.css

echo. > frontend\js\app.js
echo. > frontend\js\auth.js
echo. > frontend\js\api.js
echo. > frontend\js\products.js
echo. > frontend\js\cart.js
echo. > frontend\js\checkout.js
echo. > frontend\js\profile.js
echo. > frontend\js\seller-products.js
echo. > frontend\js\orders.js
echo. > frontend\js\chat.js
echo. > frontend\js\favorites.js
echo. > frontend\js\admin.js
echo. > frontend\js\utils.js

echo. > frontend\partials\header.html
echo. > frontend\partials\footer.html
echo. > frontend\partials\product-card.html

echo. > config\database.sql
echo. > config\supabase-config.js

echo. > scripts\seed-db.js
echo. > scripts\backup-db.bat

echo. > .gitignore
echo. > README.md

echo.
echo ================================================
echo ¡Estructura creada exitosamente!
echo Ruta: C:\Users\pirov\ReShop
echo ================================================
echo.
echo Archivos creados:
echo   - Backend: src/, uploads/, logs/, server.js, package.json
echo   - Frontend: 14 HTMLs, 3 CSS, 12 JS, partials/
echo   - Config: database.sql, supabase-config.js
echo   - Scripts: seed-db.js, backup-db.bat
echo.
pause