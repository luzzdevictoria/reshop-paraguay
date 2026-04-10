/**
UBICACION: C:\Users\pirov\ReShop\server.js
VERSION: 3.1.0 - ADMIN ENDPOINTS + AUTH MIDDLEWARE
PROPIETARIA: Luciana Noelia Da Silva
RESPONSABLE: Pedro José Pirovani

CHANGELOG v3.1.0:
  [+] Agregado middleware verifyAdmin para validación de tokens Supabase
  [+] Endpoint GET /api/admin/users - Listar todos los usuarios (admin)
  [+] Endpoint GET /api/admin/products - Listar productos sin filtro de estado (admin)
  [+] Endpoint PUT /api/admin/users/:id/toggle - Activar/desactivar usuario
  [+] Endpoint PUT /api/admin/products/:id/status - Actualizar estado de producto
  [+] Endpoint DELETE /api/admin/products/:id - Eliminar producto físicamente
  [!] Requiere tabla 'users' con campos: email, role ('admin'/'user'), is_active
  [!] Requiere autenticación vía Bearer Token en header Authorization
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
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ============================================================
const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ success: false, error: 'Token requerido' });
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(403).json({ success: false, error: 'Token inválido' });
    
    const { data: dbUser } = await supabase
        .from('users')
        .select('role, email, is_active')
        .eq('email', user.email)
        .single();
    
    if (!dbUser || dbUser.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    
    if (dbUser.is_active === false) {
        return res.status(403).json({ success: false, error: 'Cuenta desactivada' });
    }
    
    req.user = dbUser;
    next();
};

// ============================================================
// RUTAS BASE
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ name: 'ReShop Paraguay API', version: '3.1.0', status: 'active' });
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
// ENDPOINTS DE ADMINISTRACIÓN (solo para admin)
// ============================================================

// Listar todos los usuarios del sistema
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, users: users || [], count: users?.length || 0 });
    } catch (error) {
        console.error('❌ Error en /api/admin/users:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Listar todos los productos (incluye inactivos/eliminados)
app.get('/api/admin/products', verifyAdmin, async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, products: products || [], count: products?.length || 0 });
    } catch (error) {
        console.error('❌ Error en /api/admin/products:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Activar/Desactivar usuario
app.put('/api/admin/users/:id/toggle', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el usuario existe
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('is_active, email')
            .eq('id', id)
            .single();
        
        if (findError || !user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        
        // No permitir desactivar al último admin
        if (user.is_active === true && user.role === 'admin') {
            const { data: otherAdmins } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')
                .eq('is_active', true)
                .neq('id', id);
            
            if (otherAdmins?.length === 0) {
                return res.status(400).json({ success: false, error: 'No se puede desactivar el último administrador' });
            }
        }
        
        const { error } = await supabase
            .from('users')
            .update({ is_active: !user.is_active })
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ 
            success: true, 
            message: `Usuario ${user.email} ${!user.is_active ? 'activado' : 'desactivado'}`,
            user: { id, email: user.email, is_active: !user.is_active }
        });
    } catch (error) {
        console.error('❌ Error en toggle usuario:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar estado de producto (active/inactive/archived)
app.put('/api/admin/products/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validar estados permitidos
        const validStatuses = ['active', 'inactive', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: `Estado inválido. Permitidos: ${validStatuses.join(', ')}` });
        }
        
        const { error } = await supabase
            .from('products')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Estado actualizado', product: { id, status } });
    } catch (error) {
        console.error('❌ Error en actualizar estado:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar producto (soft delete o hard delete según configuración)
app.delete('/api/admin/products/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el producto existe
        const { data: product, error: findError } = await supabase
            .from('products')
            .select('name')
            .eq('id', id)
            .single();
        
        if (findError || !product) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        
        // OPCIÓN A: Soft delete (recomendado)
        // const { error } = await supabase
        //     .from('products')
        //     .update({ status: 'deleted', updated_at: new Date().toISOString() })
        //     .eq('id', id);
        
        // OPCIÓN B: Hard delete (eliminación permanente)
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: `Producto "${product.name}" eliminado`, id });
    } catch (error) {
        console.error('❌ Error en eliminar producto:', error.message);
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
    console.log('  RESHOP PARAGUAY API v3.1.0');
    console.log('='.repeat(50));
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Health:   http://localhost:${PORT}/api/health`);
    console.log(`Products: http://localhost:${PORT}/api/products`);
    console.log(`Admin:    http://localhost:${PORT}/api/admin/products`);
    console.log('='.repeat(50));
    console.log('⚠️  Endpoints /api/admin/* requieren Bearer Token de admin');
    console.log('');
});

module.exports = app;