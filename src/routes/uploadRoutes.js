/**
* ARCHIVO: src/routes/uploadRoutes.js
* DESCRIPCION: Endpoints para subir avatar de usuario y logo de tienda a Cloudinary
*/

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../../database');

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
        }
    }
});

// ============================================================
// SUBIR AVATAR DE USUARIO
// ============================================================
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.sub;
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se envió ninguna imagen' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `reshop/avatars/${userId}`,
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                { quality: 'auto' }
            ]
        });

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
                avatar_url: result.secure_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error actualizando avatar:', updateError);
            return res.status(500).json({ success: false, error: 'Error al guardar la URL del avatar' });
        }

        res.json({
            success: true,
            message: 'Avatar actualizado correctamente',
            avatar_url: result.secure_url
        });

    } catch (error) {
        console.error('Error subiendo avatar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ELIMINAR AVATAR DE USUARIO
// ============================================================
router.delete('/avatar', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;

        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        if (findError) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        if (user.avatar_url) {
            const publicId = user.avatar_url.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
                avatar_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            return res.status(500).json({ success: false, error: 'Error al eliminar el avatar' });
        }

        res.json({ success: true, message: 'Avatar eliminado correctamente' });

    } catch (error) {
        console.error('Error eliminando avatar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// SUBIR LOGO DE TIENDA
// ============================================================
router.post('/store-logo', authenticateToken, upload.single('store_logo'), async (req, res) => {
    try {
        const userId = req.user.sub;
        
        // Verificar que el usuario es vendedor o admin
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Solo los vendedores pueden tener logo de tienda' });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se envió ninguna imagen' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `reshop/store-logos/${userId}`,
            transformation: [
                { width: 300, height: 300, crop: 'limit' },
                { quality: 'auto' }
            ]
        });

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
                store_logo_url: result.secure_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error actualizando store_logo_url:', updateError);
            return res.status(500).json({ success: false, error: 'Error al guardar la URL del logo' });
        }

        res.json({
            success: true,
            message: 'Logo de tienda actualizado correctamente',
            store_logo_url: result.secure_url
        });

    } catch (error) {
        console.error('Error subiendo logo de tienda:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ELIMINAR LOGO DE TIENDA
// ============================================================
router.delete('/store-logo', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.sub;

        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Solo los vendedores pueden tener logo de tienda' });
        }

        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('store_logo_url')
            .eq('id', userId)
            .single();

        if (findError) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        if (user.store_logo_url) {
            const publicId = user.store_logo_url.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
                store_logo_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            return res.status(500).json({ success: false, error: 'Error al eliminar el logo' });
        }

        res.json({ success: true, message: 'Logo de tienda eliminado correctamente' });

    } catch (error) {
        console.error('Error eliminando logo de tienda:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;