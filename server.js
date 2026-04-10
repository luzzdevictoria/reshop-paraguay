const express = require('express');
const cors = require('cors');
// const helmet = require('helmet');      // COMENTADO TEMPORALMENTE
// const morgan = require('morgan');     // COMENTADO TEMPORALMENTE
const dotenv = require('dotenv');
// const path = require('path');          // COMENTADO TEMPORALMENTE

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(helmet());           // COMENTADO
// app.use(morgan('dev'));      // COMENTADO
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // COMENTADO

// Forzar UTF-8
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============================================================================
// RUTAS BASE
// ============================================================================

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

app.get('/', (req, res) => {
    res.json({
        name: 'ReShop Paraguay API',
        version: '1.0.0',
        description: 'Shopping virtual de ropa de segunda mano',
        status: 'active'
    });
});

// ============================================================================
// RUTAS DE LA API (comentadas temporalmente)
// ============================================================================

// const authRoutes = require('./src/routes/authRoutes');
// app.use('/api/auth', authRoutes);

// const productRoutes = require('./src/routes/productRoutes');
// app.use('/api/products', productRoutes);

// const ordersRoutes = require('./src/routes/orders');
// app.use('/api/orders', ordersRoutes);

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada', path: req.originalUrl });
});

app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;