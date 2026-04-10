const express = require('express');
const cors = require('cors');

const app = express();

// CORS básico
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({ name: 'ReShop Paraguay API', version: '1.0.0', status: 'active' });
});

// Ruta de prueba para productos
app.get('/api/products', (req, res) => {
    res.json({ success: true, products: [], message: 'Versión de prueba - Sin base de datos' });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;