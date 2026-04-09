/**
* UBICACION: C:\Users\pirov\ReShop\src\routes\productRoutes.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.1
* DESCRIPCION: Rutas de productos. Endpoints para CRUD de productos,
* listado con filtros y busqueda. Soporta subida de imagenes.
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* PROYECTO: ReShop Paraguay
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial de rutas
* 2026-04-09 - [ADD] Agregado middleware upload.array para subir imagenes
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
const { upload } = require('../middleware/upload');

// Rutas publicas
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/seller/:sellerId', getSellerProducts);

// Rutas protegidas (requieren autenticacion) - CON SOPORTE PARA IMAGENES
router.post('/', authenticateToken, requireRole(['seller', 'admin']), upload.array('images', 5), createProduct);
router.put('/:id', authenticateToken, requireRole(['seller', 'admin']), upload.array('images', 5), updateProduct);
router.delete('/:id', authenticateToken, requireRole(['seller', 'admin']), deleteProduct);

module.exports = router;