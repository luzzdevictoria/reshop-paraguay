/**
* UBICACION: C:\Users\pirov\ReShop\backend\src\middleware\auth.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.0
* DESCRIPCION: Middleware de autenticacion y autorizacion.
* Verifica tokens JWT y controla acceso por roles.
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* PROYECTO: ReShop Paraguay
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial del middleware
*/

const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Acceso denegado. Token no proporcionado.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Token invalido o expirado.'
        });
    }
}

// Middleware para verificar roles
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. No tienes permisos suficientes.'
            });
        }

        next();
    };
}

// Middleware opcional (no requiere token, pero si lo hay lo valida)
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token invalido, pero continuamos sin usuario
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
}

module.exports = {
    authenticateToken,
    requireRole,
    optionalAuth
};