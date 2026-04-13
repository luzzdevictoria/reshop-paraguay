/**
* ARCHIVO: frontend/js/avatar.js
* DESCRIPCION: Manejo de avatar de usuario
*/

async function loadUserAvatar() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.user?.avatar_url) {
            return data.user.avatar_url;
        }
    } catch (error) {
        console.error('Error cargando avatar:', error);
    }
    return null;
}

function renderAvatar(avatarUrl, userName, size = 'md') {
    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-base',
        lg: 'w-20 h-20 text-2xl'
    };
    
    const sizeClass = sizes[size] || sizes.md;
    
    if (avatarUrl) {
        return `<img src="${avatarUrl}" alt="${escapeHtml(userName)}" class="avatar-img ${sizeClass} rounded-full object-cover">`;
    }
    
    // Avatar por defecto con iniciales
    const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    const colors = ['#2A5C6E', '#E8B86B', '#D95A41', '#4A90A4', '#C4A265'];
    const colorIndex = (userName?.length || 0) % colors.length;
    
    return `
        <div class="avatar-default ${sizeClass} rounded-full flex items-center justify-center text-white font-bold" 
             style="background-color: ${colors[colorIndex]}">
            ${initials}
        </div>
    `;
}

async function updateAvatar(file) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No autenticado');
    
    const result = await uploadAvatar(file, token);
    if (result.success) {
        // Actualizar localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.avatar_url = result.avatar_url;
        localStorage.setItem('user', JSON.stringify(user));
        return result;
    }
    throw new Error(result.error);
}

async function removeAvatar() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No autenticado');
    
    const result = await deleteAvatar(token);
    if (result.success) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        delete user.avatar_url;
        localStorage.setItem('user', JSON.stringify(user));
        return result;
    }
    throw new Error(result.error);
}