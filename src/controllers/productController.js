/**
* UBICACION: C:\Users\pirov\ReShop\backend\src\controllers\productController.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.0
* DESCRIPCION: Controlador de productos. Maneja CRUD de productos,
* listado con filtros, busqueda y gestion de imagenes.
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* PROYECTO: ReShop Paraguay
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial del controlador
*/

const { supabaseAdmin } = require('../../database');

// Crear nuevo producto
async function createProduct(req, res) {
    try {
        const sellerId = req.user.sub;
        const { title, description, price, category, size, condition, brand, color, material } = req.body;

        // Validaciones
        if (!title || !price || !category) {
            return res.status(400).json({
                success: false,
                error: 'Titulo, precio y categoria son requeridos'
            });
        }

        if (price < 1000) {
            return res.status(400).json({
                success: false,
                error: 'El precio minimo es de 1.000 Gs'
            });
        }

        const newProduct = {
            seller_id: sellerId,
            title,
            description: description || null,
            price: parseInt(price),
            category,
            size: size || null,
            condition: condition || 'good',
            brand: brand || null,
            color: color || null,
            material: material || null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .insert(newProduct)
            .select()
            .single();

        if (error) {
            console.error('[CREATE_PRODUCT ERROR]', error);
            return res.status(500).json({
                success: false,
                error: 'Error al crear el producto'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            product
        });

    } catch (error) {
        console.error('[CREATE_PRODUCT ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Listar productos (con filtros y paginacion)
async function getProducts(req, res) {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            min_price, 
            max_price, 
            size, 
            condition,
            city,
            search,
            sort = 'newest'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('products')
            .select(`
                *,
                seller:seller_id (
                    id,
                    full_name,
                    store_name,
                    rating,
                    city
                )
            `, { count: 'exact' })
            .eq('status', 'active');

        // Aplicar filtros
        if (category) query = query.eq('category', category);
        if (size) query = query.eq('size', size);
        if (condition) query = query.eq('condition', condition);
        if (min_price) query = query.gte('price', parseInt(min_price));
        if (max_price) query = query.lte('price', parseInt(max_price));
        if (city) query = query.eq('seller.city', city);

        // Busqueda por texto
        if (search) {
            query = query.ilike('title', `%${search}%`);
        }

        // Ordenamiento
        switch (sort) {
            case 'price_asc':
                query = query.order('price', { ascending: true });
                break;
            case 'price_desc':
                query = query.order('price', { ascending: false });
                break;
            case 'most_viewed':
                query = query.order('views', { ascending: false });
                break;
            default: // newest
                query = query.order('created_at', { ascending: false });
        }

        // Paginacion
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('[GET_PRODUCTS ERROR]', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener productos'
            });
        }

        res.json({
            success: true,
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                total_pages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('[GET_PRODUCTS ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Obtener un producto por ID
async function getProductById(req, res) {
    try {
        const { id } = req.params;

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                seller:seller_id (
                    id,
                    full_name,
                    store_name,
                    store_description,
                    store_logo_url,
                    rating,
                    total_sales,
                    city,
                    created_at
                )
            `)
            .eq('id', id)
            .eq('status', 'active')
            .single();

        if (error || !product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Incrementar contador de vistas
        await supabaseAdmin
            .from('products')
            .update({ views: product.views + 1 })
            .eq('id', id);

        product.views = product.views + 1;

        res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error('[GET_PRODUCT_BY_ID ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Actualizar producto
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const sellerId = req.user.sub;
        const { title, description, price, category, size, condition, brand, color, material, status } = req.body;

        // Verificar que el producto pertenece al vendedor
        const { data: existingProduct, error: findError } = await supabaseAdmin
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();

        if (findError || !existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        if (existingProduct.seller_id !== sellerId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para editar este producto'
            });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price) updateData.price = parseInt(price);
        if (category) updateData.category = category;
        if (size) updateData.size = size;
        if (condition) updateData.condition = condition;
        if (brand) updateData.brand = brand;
        if (color) updateData.color = color;
        if (material) updateData.material = material;
        if (status) updateData.status = status;
        updateData.updated_at = new Date().toISOString();

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[UPDATE_PRODUCT ERROR]', error);
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar el producto'
            });
        }

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            product
        });

    } catch (error) {
        console.error('[UPDATE_PRODUCT ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Eliminar producto (soft delete - cambia status a inactive)
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const sellerId = req.user.sub;

        const { data: existingProduct, error: findError } = await supabaseAdmin
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();

        if (findError || !existingProduct) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        if (existingProduct.seller_id !== sellerId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para eliminar este producto'
            });
        }

        const { error } = await supabaseAdmin
            .from('products')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('[DELETE_PRODUCT ERROR]', error);
            return res.status(500).json({
                success: false,
                error: 'Error al eliminar el producto'
            });
        }

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error('[DELETE_PRODUCT ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Obtener productos de un vendedor especifico
async function getSellerProducts(req, res) {
    try {
        const { sellerId } = req.params;
        const { status = 'active' } = req.query;

        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('seller_id', sellerId)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[GET_SELLER_PRODUCTS ERROR]', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener productos del vendedor'
            });
        }

        res.json({
            success: true,
            products
        });

    } catch (error) {
        console.error('[GET_SELLER_PRODUCTS ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getSellerProducts
};