/**
* UBICACION: C:\Users\pirov\ReShop\server.js
* VERSION: 3.0.0 - FUNCIONAL CON SUPABASE
* PROPIETARIA: Luciana Noelia Da Silva
* RESPONSABLE: Pedro José Pirovani
*/

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

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
    res.json({ name: 'ReShop Paraguay API', version: '3.0.0', status: 'active' });
});

// ============================================================
// RUTA DE PRODUCTOS (CONSULTA SUPABASE)
// ============================================================

app.get('/api/products', async (req, res) => {
    try {
        console.log('📦 Consultando productos en Supabase...');
        
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error en consulta:', error);
            throw error;
        }

        console.log(`✅ Encontrados ${products?.length || 0} productos`);
        
        res.json({ 
            success: true, 
            products: products || [],
            count: products?.length || 0
        });
    } catch (error) {
        console.error('❌ Error en /api/products:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            products: []
        });
    }
});

// ============================================================
// RUTA DE PRODUCTO POR ID
// ============================================================

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        if (!product) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        
        res.json({ success: true, product });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// RUTAS ADICIONALES (comentadas hasta que los archivos existan)
// ============================================================

// const authRoutes = require('./src/routes/authRoutes');
// app.use('/api/auth', authRoutes);

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
    console.log('');
    console.log('='.repeat(50));
    console.log('  RESHOP PARAGUAY API v3.0');
    console.log('='.repeat(50));
    console.log(`  Servidor: http://localhost:${PORT}`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`  Products: http://localhost:${PORT}/api/products`);
    console.log('='.repeat(50));
    console.log('');
});

module.exports = app;