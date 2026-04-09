/**
* UBICACION: C:\Users\pirov\ReShop\backend\src\routes\authRoutes.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.0
* DESCRIPCION: Rutas de autenticacion. Endpoints para registro,
* login y gestion de perfil de usuario.
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
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas publicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas (requieren autenticacion)
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);

module.exports = router;