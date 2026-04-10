/**
* UBICACION: C:\Users\pirov\ReShop\server.js
* CREADO: 2026-04-10
* ACTUALIZADO: 2026-04-10
* VERSION: 2.0.0
* DESCRIPCION: API REST de ReShop Paraguay - Version estable para Vercel
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
*/

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES BASICOS (todos funcionan en Vercel)
// ============================================================

// CORS - Permitir todas las origins (configurable)
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Forzar UTF-8
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============================================================
// RUTAS BASE (SIEMPRE FUNCIONAN)
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        message: 'ReShop Paraguay API funcionando correctamente'
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'ReShop Paraguay API',
        version: '2.0.0',
        description: 'Shopping virtual de ropa de segunda mano',
        status: 'active',
        endpoints: {
            health: 'GET /api/health',
            auth: 'POST /api/auth/register, POST /api/auth/login',
            products: 'GET /api/products, POST /api/products',
            orders: 'GET /api/orders, POST /api/orders'
        }
    });
});

// ============================================================
// RUTAS DE PRUEBA (para verificar que el servidor responde)
// ============================================================

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'El servidor funciona correctamente' });
});

app.get('/api/products-test', (req, res) => {
    res.json({ 
        success: true, 
        products: [
            { id: 1, title: 'Producto de prueba', price: 50000, category: 'Prueba' }
        ],
        message: 'Endpoint de prueba - Conecta con Supabase después'
    });
});

// ============================================================
// RUTAS REALES (descomentar cuando los archivos existan)
// ============================================================

// Descomentar SOLO cuando el archivo exista en src/routes/
/*
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./src/routes/productRoutes');
app.use('/api/products', productRoutes);

const ordersRoutes = require('./src/routes/orders');
app.use('/api/orders', ordersRoutes);
*/

// ============================================================
// MANEJO DE ERRORES
// ============================================================

// Ruta no encontrada (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Error global (500)
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// INICIO DEL SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('  RESHOP PARAGUAY API v2.0');
    console.log('='.repeat(50));
    console.log(`  Servidor: http://localhost:${PORT}`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`  Test:     http://localhost:${PORT}/api/test`);
    console.log('='.repeat(50));
    console.log('');
});

module.exports = app;