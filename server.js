/**
* UBICACION: C:\Users\pirov\ReShop\server.js
* VERSION: 2.0.0 - ESTABLE PARA VERCEL
* PROPIETARIA: Luciana Noelia Da Silva
* RESPONSABLE: Pedro José Pirovani
*/

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES
// ============================================================

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// RUTAS BASE
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ name: 'ReShop Paraguay API', version: '2.0.0', status: 'active' });
});

// ============================================================
// RUTAS DE PRODUCTOS (VERSIÓN FUNCIONAL)
// ============================================================

app.get('/api/products', (req, res) => {
    res.json({ 
        success: true, 
        products: [],  // Array vacío por ahora
        message: 'Conectando con base de datos próximamente'
    });
});

// ============================================================
// RUTA DE PRUEBA
// ============================================================

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'Servidor funcionando correctamente' });
});

// ============================================================
// RUTAS COMENTADAS (activar cuando los archivos existan)
// ============================================================

// const authRoutes = require('./src/routes/authRoutes');
// app.use('/api/auth', authRoutes);

// const productRoutes = require('./src/routes/productRoutes');
// app.use('/api/products', productRoutes);

// const ordersRoutes = require('./src/routes/orders');
// app.use('/api/orders', ordersRoutes);

// ============================================================
// MANEJO DE ERRORES
// ============================================================

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada', path: req.originalUrl });
});

app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

// ============================================================
// INICIO
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ ReShop API corriendo en puerto ${PORT}`);
});

module.exports = app;