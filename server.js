/**
================================================================================
ARCHIVO: server.js
PROYECTO: ReShop Paraguay - Shopping Virtual de Ropa de Segunda Mano
VERSION: 3.4.1 - ADDED SELLER PRODUCTS ENDPOINT
CREADO: 2026-04-09
ACTUALIZADO: 2026-04-11
RESPONSABLE: Pedro José Pirovani
PROPIETARIA: Luciana Noelia Da Silva
DESCRIPCION: API REST principal de ReShop Paraguay.
             Inicializa Express, middlewares, rutas y endpoints.
================================================================================
HISTORIAL DE MODIFICACIONES:
2026-04-09 - Creacion inicial del servidor
2026-04-09 - Configuracion de middlewares de seguridad
2026-04-10 - Implementacion de endpoints de administracion
2026-04-10 - Agregado verifyAdmin con JWT_SECRET
2026-04-10 - [FIX] CORS configurado correctamente
2026-04-10 - [FIX] verifyAdmin ahora usa supabaseAdmin para bypass RLS
2026-04-10 - [FIX] Busqueda por email en lugar de id
2026-04-10 - [ADD] Endpoint /api/admin/orders
2026-04-10 - [ADD] Endpoint /api/admin/decode-token para debugging
2026-04-11 - [ADD] Endpoint GET /api/seller/orders para que vendedores vean sus ventas
2026-04-11 - [ADD] Endpoints de reseñas: GET/POST /api/products/:id/reviews, GET /api/products/:id/rating
2026-04-11 - [ADD] Endpoint GET /api/products/seller/:sellerId para productos por vendedor
================================================================================
*/

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN MULTER PARA SUBIR IMÁGENES
// ============================================================
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Tipo de archivo no permitido'), false);
    }
});

// ============================================================
// INICIALIZAR SUPABASE
// ============================================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'reshop-secret-key-2026';

// ============================================================
// MIDDLEWARE DE AUTENTICACIÓN GENERAL
// ============================================================
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', decoded.sub)
            .single();
        
        if (dbError || !dbUser) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        
        req.user = dbUser;
        next();
    } catch (error) {
        console.error('❌ Error en authenticateToken:', error.message);
        res.status(403).json({ success: false, error: 'Token inválido o expirado' });
    }
};

// ============================================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ============================================================
const verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔍 Verificando admin - Token:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token decodificado:', { email: decoded.email, role: decoded.role });
        
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, role, is_active, store_name')
            .eq('email', decoded.email)
            .single();
        
        console.log('📋 Usuario DB encontrado:', dbUser ? 'Sí' : 'No');
        
        if (dbError || !dbUser) {
            console.error('❌ Error en verifyAdmin:', dbError?.message || 'Usuario no encontrado');
            return res.status(403).json({ 
                success: false, 
                error: 'Usuario no encontrado en la base de datos' 
            });
        }
        
        if (dbUser.role !== 'admin') {
            console.warn('⚠️ Acceso denegado: role =', dbUser.role);
            return res.status(403).json({ 
                success: false, 
                error: 'Acceso denegado - No eres administrador' 
            });
        }
        
        if (!dbUser.is_active) {
            console.warn('⚠️ Cuenta desactivada:', dbUser.email);
            return res.status(403).json({ 
                success: false, 
                error: 'Cuenta desactivada' 
            });
        }
        
        console.log('✅ Acceso concedido a admin:', dbUser.email);
        req.user = dbUser;
        next();
    } catch (error) {
        console.error('❌ Error en verifyAdmin:', error.message);
        res.status(403).json({ success: false, error: 'Token inválido o expirado' });
    }
};

// ============================================================
// MIDDLEWARES GLOBALES
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
    res.json({ 
        name: 'ReShop Paraguay API', 
        version: '3.4.1', 
        status: 'active',
        endpoints: {
            health: 'GET /api/health',
            products: 'GET /api/products',
            productsBySeller: 'GET /api/products/seller/:sellerId',
            reviews: 'GET/POST /api/products/:id/reviews, GET /api/products/:id/rating',
            auth: 'POST /api/auth/register, POST /api/auth/login',
            admin: 'GET /api/admin/users, GET /api/admin/products, GET /api/admin/orders',
            seller: 'GET /api/seller/orders'
        }
    });
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

        if (error) throw error;

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
// 🆕 ENDPOINT: PRODUCTOS POR VENDEDOR (para dashboard vendedor/admin)
// ============================================================
app.get('/api/products/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        
        console.log(`📦 Buscando productos del vendedor: ${sellerId}`);
        
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', sellerId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ Encontrados ${products?.length || 0} productos`);
        
        res.json({ success: true, products: products || [] });
    } catch (error) {
        console.error('❌ Error en /api/products/seller/:sellerId:', error.message);
        res.status(500).json({ success: false, error: error.message, products: [] });
    }
});

// ============================================================
// ENDPOINTS DE FAVORITOS
// ============================================================

app.post('/api/favorites/toggle', authenticateToken, async (req, res) => {
    try {
        const { product_id } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ success: false, error: 'Producto requerido' });
        }
        
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();
        
        if (existing) {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', req.user.id)
                .eq('product_id', product_id);
            
            if (error) throw error;
            res.json({ success: true, action: 'removed', message: 'Eliminado de favoritos' });
        } else {
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: req.user.id, product_id: product_id });
            
            if (error) throw error;
            res.json({ success: true, action: 'added', message: 'Agregado a favoritos' });
        }
    } catch (error) {
        console.error('Error en toggle favorito:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const { data: favorites, error } = await supabase
            .from('favorites')
            .select(`
                product_id,
                products (*)
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const products = favorites?.map(f => f.products) || [];
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error obteniendo favoritos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/favorites/check/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        
        const { data: favorite, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('product_id', productId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        res.json({ success: true, isFavorite: !!favorite });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
// CREAR PRODUCTO (autenticado)
// ============================================================
app.post('/api/products', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category, size, condition, brand, color, origin } = req.body;
        
        if (!title || !price) {
            return res.status(400).json({ success: false, error: 'Título y precio son requeridos' });
        }
        
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = `${uuidv4()}-${file.originalname}`;
                const { data, error } = await supabase.storage
                    .from('products')
                    .upload(fileName, file.buffer, { contentType: file.mimetype });
                
                if (error) throw error;
                
                const { data: urlData } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);
                
                imageUrls.push(urlData.publicUrl);
            }
        }
        
        const newProduct = {
            seller_id: req.user.id,
            title,
            description: description || null,
            price: parseFloat(price),
            category: category || null,
            size: size || null,
            condition: condition || 'good',
            brand: brand || null,
            color: color || null,
            origin: origin || null,
            images_urls: imageUrls,
            status: 'active',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('products')
            .insert(newProduct)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, product: data });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ACTUALIZAR PRODUCTO
// ============================================================
app.put('/api/products/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, category, size, condition, brand, color, origin } = req.body;
        
        const { data: existing, error: findError } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();
        
        if (findError || !existing) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        
        if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'No tienes permiso para editar este producto' });
        }
        
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = `${uuidv4()}-${file.originalname}`;
                const { error } = await supabase.storage
                    .from('products')
                    .upload(fileName, file.buffer, { contentType: file.mimetype });
                
                if (error) throw error;
                
                const { data: urlData } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);
                
                imageUrls.push(urlData.publicUrl);
            }
        }
        
        const updateData = {
            title,
            description: description || null,
            price: parseFloat(price),
            category: category || null,
            size: size || null,
            condition: condition || 'good',
            brand: brand || null,
            color: color || null,
            origin: origin || null,
            updated_at: new Date().toISOString()
        };
        
        if (imageUrls.length > 0) updateData.images_urls = imageUrls;
        
        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, product: data });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ELIMINAR PRODUCTO
// ============================================================
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: existing, error: findError } = await supabase
            .from('products')
            .select('seller_id, title')
            .eq('id', id)
            .single();
        
        if (findError || !existing) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        
        if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este producto' });
        }
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ENDPOINTS DE RESEÑAS
// ============================================================

app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewer:reviewer_id(id, full_name, email)
            `)
            .eq('product_id', id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, reviews: reviews || [] });
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, order_id } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'La calificación debe ser entre 1 y 5 estrellas' });
        }
        
        const { data: order, error: orderCheck } = await supabase
            .from('orders')
            .select('id, buyer_id')
            .eq('id', order_id)
            .eq('buyer_id', req.user.id)
            .single();
        
        if (orderCheck || !order) {
            return res.status(403).json({ success: false, error: 'Solo puedes reseñar productos que has comprado' });
        }
        
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', order_id)
            .eq('product_id', id)
            .single();
        
        if (existingReview) {
            return res.status(400).json({ success: false, error: 'Ya has reseñado este producto' });
        }
        
        const { data: product } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();
        
        const { data: review, error } = await supabase
            .from('reviews')
            .insert({
                product_id: id,
                order_id: order_id,
                reviewer_id: req.user.id,
                reviewed_id: product.seller_id,
                rating: parseInt(rating),
                comment: comment || null
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, message: 'Reseña agregada exitosamente', review });
    } catch (error) {
        console.error('Error al crear reseña:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/products/:id/rating', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: product, error } = await supabase
            .from('products')
            .select('rating, reviews_count')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        res.json({ 
            success: true, 
            rating: product?.rating || 0,
            count: product?.reviews_count || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ENDPOINTS DE ADMINISTRACIÓN
// ============================================================

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        console.log('👥 Admin solicitando lista de usuarios:', req.user?.email);
        
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, role, is_active, created_at, store_name')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ Usuarios encontrados: ${users?.length || 0}`);
        
        res.json({ 
            success: true, 
            users: users || [], 
            count: users?.length || 0
        });
    } catch (error) {
        console.error('❌ Error en /api/admin/users:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/products', verifyAdmin, async (req, res) => {
    try {
        console.log('📦 Admin solicitando todos los productos:', req.user?.email);
        
        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ Productos encontrados: ${products?.length || 0}`);
        
        res.json({ 
            success: true, 
            products: products || [], 
            count: products?.length || 0
        });
    } catch (error) {
        console.error('❌ Error en /api/admin/products:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        console.log('📦 Admin solicitando todas las órdenes:', req.user?.email);
        
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('*, buyer:buyer_id(id, email, full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ Órdenes encontradas: ${orders?.length || 0}`);
        
        res.json({ 
            success: true, 
            orders: orders || [], 
            count: orders?.length || 0
        });
    } catch (error) {
        console.error('❌ Error en /api/admin/orders:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/admin/users/:id/toggle', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('is_active, email, role')
            .eq('id', id)
            .single();
        
        if (findError || !user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        
        if (user.is_active === true && user.role === 'admin') {
            const { data: otherAdmins } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('role', 'admin')
                .eq('is_active', true)
                .neq('id', id);
            
            if (otherAdmins?.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No se puede desactivar el último administrador' 
                });
            }
        }
        
        const { error } = await supabaseAdmin
            .from('users')
            .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) throw error;
        
        console.log(`✅ Usuario ${user.email} ${!user.is_active ? 'activado' : 'desactivado'}`);
        
        res.json({ 
            success: true, 
            message: `Usuario ${user.email} ${!user.is_active ? 'activado' : 'desactivado'}`
        });
    } catch (error) {
        console.error('❌ Error en toggle usuario:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/admin/products/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['active', 'inactive', 'archived', 'sold'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Estado inválido. Permitidos: ${validStatuses.join(', ')}` 
            });
        }
        
        const { error } = await supabaseAdmin
            .from('products')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) throw error;
        
        console.log(`✅ Producto ${id} actualizado a estado: ${status}`);
        
        res.json({ success: true, message: 'Estado actualizado', product: { id, status } });
    } catch (error) {
        console.error('❌ Error en actualizar estado:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/admin/products/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: product, error: findError } = await supabaseAdmin
            .from('products')
            .select('title')
            .eq('id', id)
            .single();
        
        if (findError || !product) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        console.log(`✅ Producto "${product.title}" eliminado`);
        
        res.json({ success: true, message: `Producto "${product.title}" eliminado`, id });
    } catch (error) {
        console.error('❌ Error en eliminar producto:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ENDPOINT PARA VENDEDORES: Ver sus ventas
// ============================================================
app.get('/api/seller/orders', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Acceso denegado. Solo vendedores.' });
        }
        
        console.log(`📋 Vendedor ${req.user.email} solicitando sus ventas...`);
        
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                buyer:buyer_id(id, email, full_name, phone),
                items:order_items(*)
            `)
            .eq('seller_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log(`✅ Encontradas ${orders?.length || 0} ventas para ${req.user.email}`);
        
        res.json({ success: true, orders: orders || [] });
    } catch (error) {
        console.error('❌ Error obteniendo ventas del vendedor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// DEBUG: Decodificar Token
// ============================================================

app.get('/api/admin/decode-token', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, decoded });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// ============================================================
// RUTAS DE ÓRDENES
// ============================================================

const ordersRoutes = require('./src/routes/orders');
app.use('/api/orders', ordersRoutes);

// ============================================================
// MANEJO DE ERRORES
// ============================================================

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Ruta no encontrada', 
        path: req.originalUrl 
    });
});

app.use((err, req, res, next) => {
    console.error('[ERROR GLOBAL]', err.message);
    res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
    });
});

// ============================================================
// INICIO DEL SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('  🛍️  RESHOP PARAGUAY API v3.4.1');
    console.log('='.repeat(60));
    console.log(`📍 Servidor: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 Products: http://localhost:${PORT}/api/products`);
    console.log(`👤 Seller Products: http://localhost:${PORT}/api/products/seller/:sellerId`);
    console.log(`⭐ Reviews: GET/POST /api/products/:id/reviews`);
    console.log(`🔐 Admin: http://localhost:${PORT}/api/admin/users`);
    console.log(`🆕 Seller Orders: http://localhost:${PORT}/api/seller/orders`);
    console.log('='.repeat(60));
    console.log('✅ CORS configurado | JWT_SECRET activo');
    console.log('✅ supabaseAdmin activo para bypass RLS');
    console.log('✅ Endpoint /api/products/seller/:sellerId agregado');
    console.log('');
});

module.exports = app;