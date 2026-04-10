/*
================================================================================
ARCHIVO: src/routes/orders.js
PROYECTO: ReShop Paraguay - Shopping Virtual de Ropa de Segunda Mano
VERSION: 2.0.0 - FIXED AUTHENTICATION
CREADO: 2026-04-10
ACTUALIZADO: 2026-04-10
RESPONSABLE: Pedro José Pirovani
PROPIETARIA: Luciana Noelia Da Silva
DESCRIPCION: Rutas para gestionar órdenes de compra (crear, listar, actualizar estado)
================================================================================
HISTORIAL DE MODIFICACIONES:
2026-04-10 - Creacion inicial del modulo de ordenes
2026-04-10 - Implementacion de endpoints: POST /, GET /my-orders, GET /my-sales
2026-04-10 - Integracion con tabla orders y order_items de Supabase
2026-04-10 - [FIX] authenticateToken ahora usa JWT_SECRET en lugar de supabase.auth.getUser
2026-04-10 - [FIX] Busqueda de usuario por ID en lugar de email
2026-04-10 - [IMPROVE] Manejo de errores mas descriptivo
================================================================================
*/

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'reshop-secret-key-2026';

// ============================================================
// MIDDLEWARE: Verificar token JWT
// ============================================================
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    
    try {
        // Decodificar el token JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('🔑 Token decodificado:', { sub: decoded.sub, email: decoded.email, role: decoded.role });
        
        // Buscar usuario en la base de datos por ID
        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.sub)
            .single();
        
        if (dbError || !dbUser) {
            console.error('❌ Usuario no encontrado:', dbError?.message);
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
// FUNCIÓN: Generar número de orden único
// ============================================================
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RESHOP-${year}${month}${day}-${random}`;
}

// ============================================================
// POST /api/orders - CREAR NUEVA ORDEN
// ============================================================
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { items, total_amount, payment_method, shipping_address, notes } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'El carrito está vacío' });
        }
        
        if (!shipping_address) {
            return res.status(400).json({ success: false, error: 'La dirección de envío es requerida' });
        }
        
        const orderNumber = generateOrderNumber();
        
        // Obtener el seller_id del primer producto
        const firstProductId = items[0].id;
        const { data: productData } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', firstProductId)
            .single();
        
        // Calcular fees (10% de comisión para la plataforma)
        const platform_fee = Math.floor(total_amount * 0.10);
        const seller_payout = total_amount - platform_fee;
        
        // Crear la orden
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                order_number: orderNumber,
                buyer_id: req.user.id,
                seller_id: productData?.seller_id || null,
                total_amount: total_amount,
                subtotal: total_amount,
                shipping_cost: 0,
                platform_fee: platform_fee,
                seller_payout: seller_payout,
                payment_method: payment_method,
                payment_status: 'pending',
                order_status: 'pending',
                shipping_address: shipping_address,
                notes: notes || null,
                buyer_confirmed: false,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select()
            .single();
        
        if (orderError) {
            console.error('Error creating order:', orderError);
            throw orderError;
        }
        
        // Crear los items de la orden
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity
        }));
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
        
        if (itemsError) throw itemsError;
        
        console.log(`✅ Orden creada: ${orderNumber} por ${req.user.email}`);
        
        res.json({
            success: true,
            message: 'Orden creada exitosamente',
            order: order
        });
        
    } catch (error) {
        console.error('Error creando orden:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// GET /api/orders/my-orders - MIS ÓRDENES (COMPRADOR)
// ============================================================
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items (
                    *,
                    product:products (*)
                )
            `)
            .eq('buyer_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, orders: orders || [] });
    } catch (error) {
        console.error('Error obteniendo órdenes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// GET /api/orders/my-sales - MIS VENTAS (VENDEDOR)
// ============================================================
router.get('/my-sales', authenticateToken, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items (
                    *,
                    product:products (*)
                ),
                buyer:buyer_id (id, full_name, email, phone)
            `)
            .eq('seller_id', req.user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        res.json({ success: true, orders: orders || [] });
    } catch (error) {
        console.error('Error obteniendo ventas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// PUT /api/orders/:orderId/status - ACTUALIZAR ESTADO
// ============================================================
router.put('/:orderId/status', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { order_status, shipping_tracking_number } = req.body;
        
        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(order_status)) {
            return res.status(400).json({ success: false, error: 'Estado inválido' });
        }
        
        // Verificar que la orden existe
        const { data: order, error: findError } = await supabase
            .from('orders')
            .select('seller_id, buyer_id')
            .eq('id', orderId)
            .single();
        
        if (findError || !order) {
            return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        }
        
        // Verificar permisos (solo vendedor o admin pueden actualizar)
        if (order.seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'No tienes permiso para modificar esta orden' });
        }
        
        const updateData = { 
            order_status: order_status, 
            updated_at: new Date() 
        };
        
        if (order_status === 'shipped') {
            updateData.shipped_at = new Date();
        }
        
        if (order_status === 'delivered') {
            updateData.delivered_at = new Date();
        }
        
        if (shipping_tracking_number) {
            updateData.shipping_tracking_number = shipping_tracking_number;
        }
        
        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);
        
        if (updateError) throw updateError;
        
        res.json({ success: true, message: 'Estado actualizado correctamente' });
        
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// PUT /api/orders/:orderId/confirm - CONFIRMAR ENTREGA (COMPRADOR)
// ============================================================
router.put('/:orderId/confirm', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const { data: order, error: findError } = await supabase
            .from('orders')
            .select('buyer_id, order_status')
            .eq('id', orderId)
            .single();
        
        if (findError || !order) {
            return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        }
        
        if (order.buyer_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'No eres el comprador de esta orden' });
        }
        
        if (order.order_status !== 'delivered') {
            return res.status(400).json({ success: false, error: 'La orden aún no ha sido entregada' });
        }
        
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                buyer_confirmed: true,
                updated_at: new Date()
            })
            .eq('id', orderId);
        
        if (updateError) throw updateError;
        
        res.json({ success: true, message: 'Entrega confirmada exitosamente' });
        
    } catch (error) {
        console.error('Error confirmando entrega:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;