/**
* UBICACION: C:\Users\pirov\ReShop\backend\server.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.0
* DESCRIPCION: Punto de entrada principal de la API REST de ReShop Paraguay.
* Inicializa Express con middleware de seguridad (helmet, cors, morgan)
* Configura parsing de JSON y URL-encoded
* Monta rutas base y health check
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* PROYECTO: ReShop Paraguay - Shopping Virtual de Ropa de Segunda Mano
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial del servidor
* 2026-04-09 - Configuracion de middlewares de seguridad
* 2026-04-09 - Implementacion de rutas base y health check
* 2026-04-09 - Configuracion de CORS para desarrollo local
* 2026-04-09 - Middleware de manejo de errores 404 y 500
* 2026-04-09 - Graceful shutdown para cierre limpio del servidor
* 2026-04-09 - Agregadas rutas de autenticacion
*/

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARES GLOBALES
// ============================================================================

// Seguridad: headers HTTP (proteccion contra vulnerabilidades conocidas)
app.use(helmet());

// Habilitar CORS para desarrollo (permite peticiones desde frontend)
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://127.0.0.1:58125'],
    credentials: true
}));

// Parsear JSON (para peticiones con Content-Type: application/json)
app.use(express.json());

// Parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones HTTP (modo dev: registra metodo, ruta, status, tiempo)
app.use(morgan('dev'));

// Servir archivos estaticos desde la carpeta uploads (imagenes de productos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Forzar UTF-8 en respuestas JSON
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============================================================================
// RUTAS BASE
// ============================================================================

/**
* Ruta: GET /api/health
* Descripcion: Health check para monitoreo del servidor
*/
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        message: 'ReShop Paraguay API funcionando correctamente'
    });
});

/**
* Ruta: GET /
* Descripcion: Informacion general de la API
*/
app.get('/', (req, res) => {
    res.json({
        name: 'ReShop Paraguay API',
        version: '1.0.0',
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

// ============================================================================
// RUTAS DE LA API (MODULOS)
// ============================================================================

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./src/routes/productRoutes');
app.use('/api/products', productRoutes);

// TODO - FASE 6: Ordenes y compras
// const orderRoutes = require('./src/routes/orderRoutes');
// app.use('/api/orders', orderRoutes);

// TODO - FASE 8: Sistema de chat
// const chatRoutes = require('./src/routes/chatRoutes');
// app.use('/api/chat', chatRoutes);

// TODO - FASE 9: Panel de administracion
// const adminRoutes = require('./src/routes/adminRoutes');
// app.use('/api/admin', adminRoutes);

// TODO - FASE 10: Pagos con API bancaria
// const paymentRoutes = require('./src/routes/paymentRoutes');
// app.use('/api/payments', paymentRoutes);

// TODO - FASE 11: Envios y logistica
// const shippingRoutes = require('./src/routes/shippingRoutes');
// app.use('/api/shipping', shippingRoutes);

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

/**
* Middleware para rutas no encontradas (404)
*/
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

/**
* Middleware para errores globales (500)
*/
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================

const server = app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('  RESHOP PARAGUAY API');
    console.log('='.repeat(60));
    console.log(`  Servidor:     http://localhost:${PORT}`);
    console.log(`  Entorno:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('  Esperando peticiones...');
    console.log('');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('');
    console.log('[INFO] Recibida senal SIGINT. Cerrando servidor...');
    server.close(() => {
        console.log('[INFO] Servidor detenido correctamente');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('');
    console.log('[INFO] Recibida senal SIGTERM. Cerrando servidor...');
    server.close(() => {
        console.log('[INFO] Servidor detenido correctamente');
        process.exit(0);
    });
});

module.exports = app;