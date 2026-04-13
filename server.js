/**
================================================================================
ARCHIVO: server.js
PROYECTO: ReShop Paraguay - Shopping Virtual de Ropa de Segunda Mano
VERSION: 3.7.0 - CLOUDINARY + WATERMARK (TEXTO) + BG REMOVAL GRATIS
CREADO: 2026-04-09
ACTUALIZADO: 2026-04-13
RESPONSABLE: Pedro José Pirovani
PROPIETARIA: Luciana Noelia Da Silva
DESCRIPCION: API REST principal de ReShop Paraguay.
             Inicializa Express, middlewares, rutas y endpoints.
             AGREGADO: Cloudinary para imágenes con WATERMARK de TEXTO.
             AGREGADO: Eliminación de fondo GRATIS con IMG.LY (sin API keys, sin límites)
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
2026-04-11 - [ADD] Cloudinary para imágenes (endpoint /api/upload-image, compresión automática)
2026-04-13 - [ADD] WATERMARK: Marca de agua con logo de ReShop en todas las imágenes subidas
2026-04-13 - [FIX] WATERMARK: Cambiado a texto (ReShop PY) porque el logo no existía en Cloudinary
2026-04-13 - [ADD] Eliminación de fondo GRATIS con @imgly/background-removal-node (sin API key, sin límites)
================================================================================
*/

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { removeBackground } = require('@imgly/background-removal-node');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURACIÓN CLOUDINARY (con watermark de texto)
// ============================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configurado:', cloudinary.config().cloud_name);
console.log('✅ IMG.LY background removal configurado (gratis, sin límites)');

// ============================================================
// NOTIFICACIONES PUSH (OneSignal via REST API - con axios)
// ============================================================
const axios = require('axios');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

console.log('✅ OneSignal configurado con axios');

async function sendNotification(userExternalId, title, message, data = {}) {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
        console.warn('⚠️ OneSignal no configurado');
        return null;
    }

    try {
        const payload = {
            app_id: ONESIGNAL_APP_ID,
            headings: { es: title, en: title },
            contents: { es: message, en: message },
            include_external_user_ids: [String(userExternalId)],
            data: data
        };

        const response = await axios.post(
            'https://onesignal.com/api/v1/notifications',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${ONESIGNAL_API_KEY}`
                }
            }
        );

        console.log('✅ Notificación enviada a:', userExternalId);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando notificación:', error.response?.data || error.message);
        return null;
    }
}

function getUserExternalId(userId) {
    return `reshop_user_${userId}`;
}

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
const uuidv4 = () => crypto.randomUUID();

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
        version: '3.7.0', 
        status: 'active',
        endpoints: {
            health: 'GET /api/health',
            products: 'GET /api/products',
            productsBySeller: 'GET /api/products/seller/:sellerId',
            uploadImage: 'POST /api/upload-image (Cloudinary + Watermark texto)',
            removeBackground: 'POST /api/remove-background (gratis, sin límites)',
            reviews: 'GET/POST /api/products/:id/reviews, GET /api/products/:id/rating',
            auth: 'POST /api/auth/register, POST /api/auth/login',
            admin: 'GET /api/admin/users, GET /api/admin/products, GET /api/admin/orders',
            seller: 'GET /api/seller/orders'
        }
    });
});

// ============================================================
// ENDPOINT: SUBIR IMAGEN A CLOUDINARY CON WATERMARK (TEXTO)
// ============================================================
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se envió ninguna imagen' });
        }

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `reshop-products/${req.user.id}`,
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                        { fetch_format: 'webp' },
                        // WATERMARK - Marca de agua con TEXTO (no requiere logo subido)
                        { 
                            overlay: {
                                font_family: 'Arial',
                                font_size: 18,
                                font_weight: 'bold',
                                text: 'ReShop PY'
                            },
                            gravity: 'south_east',
                            x: 10,
                            y: 10,
                            color: '#FFFFFF',
                            opacity: 70
                        }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        res.json({ 
            success: true, 
            url: result.secure_url, 
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height
        });
    } catch (error) {
        console.error('❌ Error subiendo imagen a Cloudinary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// 🆕 ENDPOINT: ELIMINAR FONDO GRATIS CON IMG.LY
// ============================================================
app.post('/api/remove-background', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se envió ninguna imagen' });
        }

        console.log('🖼️ Eliminando fondo con IMG.LY (gratis, sin límites)...');
        console.log(`📏 Tamaño original: ${(req.file.buffer.length / 1024).toFixed(2)} KB`);

        // Eliminar fondo - la primera vez descarga los modelos (~40MB)
        const cleanedBlob = await removeBackground(req.file.buffer, {
            model: 'small',        // Modelo pequeño: 40MB, más rápido
            output: {
                format: 'image/png',    // PNG mantiene transparencia
                quality: 0.9
            },
            progress: (key, current, total) => {
                console.log(`📥 ${key}: ${current}/${total}`);
            }
        });

        console.log(`✅ Fondo eliminado. Tamaño resultante: ${(cleanedBlob.length / 1024).toFixed(2)} KB`);

        // Subir a Cloudinary con watermark
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `reshop-products/${req.user.id}`,
                    transformation: [
                        { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                        { fetch_format: 'webp' },
                        // WATERMARK - Marca de agua con TEXTO
                        { 
                            overlay: {
                                font_family: 'Arial',
                                font_size: 18,
                                font_weight: 'bold',
                                text: 'ReShop PY'
                            },
                            gravity: 'south_east',
                            x: 10,
                            y: 10,
                            color: '#FFFFFF',
                            opacity: 70
                        }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(cleanedBlob);
        });

        res.json({ 
            success: true, 
            url: result.secure_url,
            message: 'Fondo eliminado correctamente (sin costo, sin límites)'
        });

    } catch (error) {
        console.error('❌ Error en remove-background:', error);
        
        // Si el error es porque falta instalar la librería
        if (error.code === 'MODULE_NOT_FOUND') {
            return res.status(500).json({ 
                success: false, 
                error: 'Librería de eliminación de fondo no instalada. Ejecuta: npm install @imgly/background-removal-node' 
            });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// RUTA DE PRODUCTOS (CONSULTA SUPABASE)
// ============================================================

app.get('/api/products', async (req, res) => {
    try {
        console.log('📦 Consultando productos en Supabase...');
        
        // Obtener parámetros de consulta (query params)
        const { category, condition, origin, minPrice, maxPrice, search } = req.query;
        
        // Construir la consulta base
        let query = supabase
            .from('products')
            .select('*')
            .eq('status', 'active');
        
        // FILTRO POR ORIGEN (código de 3 letras: PAR, ARG, BRA, USA, etc.)
        if (origin && origin !== 'todos') {
            query = query.eq('origin', origin.toUpperCase());
            console.log(`🔍 Filtrando por origen: ${origin}`);
        }
        
        // Filtro por categoría
        if (category && category !== 'todos') {
            query = query.eq('category', category);
        }
        
        // Filtro por condición
        if (condition && condition !== 'todas') {
            query = query.eq('condition', condition);
        }
        
        // Filtro por precio mínimo
        if (minPrice) {
            query = query.gte('price', parseFloat(minPrice));
        }
        
        // Filtro por precio máximo
        if (maxPrice) {
            query = query.lte('price', parseFloat(maxPrice));
        }
        
        // Búsqueda por título
        if (search && search.trim() !== '') {
            query = query.ilike('title', `%${search}%`);
        }
        
        // Ordenar por más reciente primero
        query = query.order('created_at', { ascending: false });
        
        const { data: products, error } = await query;

        if (error) throw error;

        console.log(`✅ Encontrados ${products?.length || 0} productos`);
        
        res.json({ 
            success: true, 
            products: products || [],
            count: products?.length || 0,
            filters: { category, condition, origin, minPrice, maxPrice, search }
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
// ENDPOINT: PRODUCTOS POR VENDEDOR (para dashboard vendedor/admin)
// ============================================================
app.get('/api/products/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { origin } = req.query;
        
        console.log(`📦 Buscando productos del vendedor: ${sellerId}`);
        
        let query = supabase
            .from('products')
            .select('*')
            .eq('seller_id', sellerId)
            .eq('status', 'active');
        
        if (origin && origin !== 'todos') {
            query = query.eq('origin', origin.toUpperCase());
            console.log(`🔍 Filtrando por origen: ${origin}`);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data: products, error } = await query;

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
// CREAR PRODUCTO (autenticado) - CON SOPORTE PARA CLOUDINARY + WATERMARK TEXTO
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
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: `reshop-products/${req.user.id}`,
                            transformation: [
                                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                                { fetch_format: 'webp' },
                                // WATERMARK - Marca de agua con TEXTO
                                { 
                                    overlay: {
                                        font_family: 'Arial',
                                        font_size: 18,
                                        font_weight: 'bold',
                                        text: 'ReShop PY'
                                    },
                                    gravity: 'south_east',
                                    x: 10,
                                    y: 10,
                                    color: '#FFFFFF',
                                    opacity: 70
                                }
                            ]
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
                imageUrls.push(result.secure_url);
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
// ACTUALIZAR PRODUCTO - CON SOPORTE PARA CLOUDINARY + WATERMARK TEXTO
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
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: `reshop-products/${req.user.id}`,
                            transformation: [
                                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                                { fetch_format: 'webp' },
                                // WATERMARK - Marca de agua con TEXTO
                                { 
                                    overlay: {
                                        font_family: 'Arial',
                                        font_size: 18,
                                        font_weight: 'bold',
                                        text: 'ReShop PY'
                                    },
                                    gravity: 'south_east',
                                    x: 10,
                                    y: 10,
                                    color: '#FFFFFF',
                                    opacity: 70
                                }
                            ]
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
                imageUrls.push(result.secure_url);
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
        
        // Enviar notificación push al vendedor
        const sellerExternalId = getUserExternalId(product.seller_id);
        await sendNotification(
            sellerExternalId,
            '⭐ Nueva calificación',
            `${req.user.full_name} calificó tu producto "${product.title}" con ${rating} estrellas`,
            { type: 'review', product_id: id, rating: rating }
        );

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
// ENDPOINTS DE MENSAJERÍA
// ============================================================

// Obtener o crear conversación
app.post('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const { product_id, seller_id } = req.body;
        const buyer_id = req.user.id;

        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, title')
            .eq('id', product_id)
            .single();

        if (productError || !product) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        let { data: conversation, error: findError } = await supabase
            .from('conversations')
            .select('*')
            .eq('product_id', product_id)
            .eq('buyer_id', buyer_id)
            .eq('seller_id', seller_id)
            .single();

        if (!conversation) {
            const { data: newConversation, error: createError } = await supabase
                .from('conversations')
                .insert({
                    product_id: parseInt(product_id),
                    buyer_id: buyer_id,
                    seller_id: seller_id,
                    last_message: null,
                    last_message_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;
            conversation = newConversation;
        }

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error en conversación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enviar mensaje
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { conversation_id, receiver_id, message } = req.body;
        const sender_id = req.user.id;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacío' });
        }

        const { data: newMessage, error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation_id,
                sender_id: sender_id,
                receiver_id: receiver_id,
                message: message.trim(),
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (messageError) throw messageError;

        await supabase
            .from('conversations')
            .update({
                last_message: message.trim(),
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', conversation_id);

        const receiverExternalId = getUserExternalId(receiver_id);
        await sendNotification(
            receiverExternalId,
            '📩 Nuevo mensaje',
            `${req.user.full_name || req.user.email} te envió un mensaje`,
            { type: 'message', conversation_id: conversation_id }
        );

        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener mensajes de una conversación
app.get('/api/messages/:conversationId', authenticateToken, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .single();

        if (convError || !conversation) {
            return res.status(404).json({ success: false, error: 'Conversación no encontrada' });
        }

        if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
            return res.status(403).json({ success: false, error: 'No tienes acceso a esta conversación' });
        }

        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        const unreadMessages = messages.filter(m => m.receiver_id === userId && !m.is_read);
        if (unreadMessages.length > 0) {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .in('id', unreadMessages.map(m => m.id));
        }

        res.json({ success: true, messages: messages || [] });
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener todas las conversaciones del usuario
app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                product:product_id(id, title, images_urls),
                buyer:buyer_id(id, email, full_name),
                seller:seller_id(id, email, full_name, store_name)
            `)
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        const conversationsWithUnread = await Promise.all((conversations || []).map(async (conv) => {
            const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('receiver_id', userId)
                .eq('is_read', false);

            return {
                ...conv,
                unread_count: countError ? 0 : count
            };
        }));

        res.json({ success: true, conversations: conversationsWithUnread });
    } catch (error) {
        console.error('Error obteniendo conversaciones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener contador de mensajes no leídos
app.get('/api/messages/unread/count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ success: true, unread_count: count || 0 });
    } catch (error) {
        console.error('Error contando mensajes no leídos:', error);
        res.status(500).json({ success: false, error: error.message });
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
    console.log('  🛍️  RESHOP PARAGUAY API v3.7.0');
    console.log('  ☁️  Cloudinary + WATERMARK (texto)');
    console.log('  🆓  IMG.LY para eliminar fondo (GRATIS, sin límites)');
    console.log('='.repeat(60));
    console.log(`📍 Servidor: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`📸 Upload: POST /api/upload-image (con marca de agua texto)`);
    console.log(`✨ Remove BG: POST /api/remove-background (gratis, sin límites)`);
    console.log(`📦 Products: http://localhost:${PORT}/api/products`);
    console.log(`👤 Seller Products: http://localhost:${PORT}/api/products/seller/:sellerId`);
    console.log(`⭐ Reviews: GET/POST /api/products/:id/reviews`);
    console.log(`🔐 Admin: http://localhost:${PORT}/api/admin/users`);
    console.log(`🆕 Seller Orders: http://localhost:${PORT}/api/seller/orders`);
    console.log('='.repeat(60));
    console.log('✅ CORS configurado | JWT_SECRET activo');
    console.log('✅ supabaseAdmin activo para bypass RLS');
    console.log('✅ Watermark de TEXTO (ya no depende de logo en Cloudinary)');
    console.log('✅ Eliminación de fondo GRATIS con IMG.LY (sin API key, sin límites)');
    console.log('⚠️  La primera vez que se use remove-background descargará ~40MB de modelos');
    console.log('');
});

module.exports = app;