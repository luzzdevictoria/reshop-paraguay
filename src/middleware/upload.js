/**
* ARCHIVO: upload.js
* DESCRIPCION: Middleware para subir imagenes a Supabase Storage
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
*/

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../../database');

// Configurar multer (almacenamiento en memoria)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, WEBP'));
        }
    }
});

// Funcion para subir imagen a Supabase Storage
async function uploadImageToSupabase(file, productId) {
    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${productId}/${uuidv4()}.${fileExt}`;
        
        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600'
            });
        
        if (error) throw error;
        
        // Obtener URL publica
        const { data: publicUrl } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(fileName);
        
        return publicUrl.publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        return null;
    }
}

// Funcion para eliminar imagen de Supabase Storage
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