/**
* UBICACION: frontend/js/api.js
* DESCRIPCION: Cliente HTTP para comunicarse con el backend
*/

const API_BASE_URL = 'https://reshop-backend.vercel.app/api';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE AVATAR - Upload y Delete
// ============================================

/**
 * Sube un avatar al servidor
 * @param {File} file - El archivo de imagen a subir
 * @param {string} token - Token de autorización del usuario
 * @returns {Promise<Object>} - Respuesta del servidor con los datos del avatar
 */
async function uploadAvatar(file, token) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // NOTA: No se establece 'Content-Type' para FormData,
                // el navegador lo configura automáticamente con el boundary correcto
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al subir el avatar');
        }
        
        return data;
    } catch (error) {
        console.error('[Avatar Upload Error]', error);
        throw error;
    }
}

/**
 * Elimina el avatar del usuario
 * @param {string} token - Token de autorización del usuario
 * @returns {Promise<Object>} - Respuesta del servidor confirmando la eliminación
 */
async function deleteAvatar(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al eliminar el avatar');
        }
        
        return data;
    } catch (error) {
        console.error('[Avatar Delete Error]', error);
        throw error;
    }
}

// ============================================
// EXPORTS (para módulos ES6 si es necesario)
// ============================================
export {
    apiRequest,
    uploadAvatar,
    deleteAvatar
};