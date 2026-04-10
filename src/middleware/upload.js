/**
* ARCHIVO: upload.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.1
* DESCRIPCION: Middleware para subir imagenes a Supabase Storage
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
*/

const multer = require('multer');
const { supabaseAdmin } = require('../../database');

// Generar ID unico simple (reemplaza uuid)
function generateSimpleId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, WEBP'));
        }
    }
});

async function uploadImageToSupabase(file, productId) {
    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${productId}/${generateSimpleId()}.${fileExt}`;
        
        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600'
            });
        
        if (error) throw error;
        
        const { data: publicUrl } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(fileName);
        
        return publicUrl.publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        return null;
    }
}

async function deleteImageFromSupabase(imageUrl) {
    try {
        const urlParts = imageUrl.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
        
        await supabaseAdmin.storage
            .from('product-images')
            .remove([filePath]);
        
        return true;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return false;
    }
}

module.exports = { upload, uploadImageToSupabase, deleteImageFromSupabase };