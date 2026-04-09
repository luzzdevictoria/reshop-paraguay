/**
* UBICACION: C:\Users\pirov\ReShop\backend\src\routes\productRoutes.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.0
* DESCRIPCION: Rutas de productos. Endpoints para CRUD de productos,
* listado con filtros y busqueda.
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* PROYECTO: ReShop Paraguay
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial de rutas
*/

const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getSellerProducts
} = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Rutas publicas
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/seller/:sellerId', getSellerProducts);

// Rutas protegidas (requieren autenticacion)
router.post('/', authenticateToken, requireRole(['seller', 'admin']), createProduct);
router.put('/:id', authenticateToken, requireRole(['seller', 'admin']), updateProduct);
router.delete('/:id', authenticateToken, requireRole(['seller', 'admin']), deleteProduct);

module.exports = router;