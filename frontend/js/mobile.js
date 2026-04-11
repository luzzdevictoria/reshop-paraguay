// ============================================================
// FUNCIONALIDADES MÓVILES - RESHOP PARAGUAY
// ============================================================

(function() {
    if (window.innerWidth > 768) return;

    // Crear botón hamburguesa
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(hamburger);

    // Crear drawer
    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.innerHTML = `
        <div class="drawer-header">ReShop Paraguay</div>
        <a href="index.html" class="drawer-item"><i class="fas fa-home"></i> Inicio</a>
        <a href="cart.html" class="drawer-item"><i class="fas fa-shopping-bag"></i> Carrito</a>
        <a href="favorites.html" class="drawer-item"><i class="fas fa-heart"></i> Favoritos</a>
        <a href="profile.html" class="drawer-item"><i class="fas fa-user-circle"></i> Mi Perfil</a>
        <div class="drawer-divider"></div>
        <div id="drawerAuthLinks">
            <a href="login.html" class="drawer-item"><i class="fas fa-key"></i> Iniciar Sesión</a>
            <a href="register.html" class="drawer-item"><i class="fas fa-user-plus"></i> Registrarse</a>
        </div>
        <div id="drawerUserMenu" style="display:none">
            <div class="drawer-item" id="drawerUserName"></div>
            <button id="drawerLogoutBtn" class="drawer-item"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
        </div>
    `;
    document.body.appendChild(drawer);

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);

    // Funciones
    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('active');
        hamburger.style.opacity = '0';
        hamburger.style.pointerEvents = 'none';
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.style.opacity = '';
        hamburger.style.pointerEvents = '';
    }

    hamburger.onclick = openDrawer;
    overlay.onclick = closeDrawer;
    drawer.querySelectorAll('a, button').forEach(el => el.onclick = closeDrawer);

    // Bottom nav
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const bottomNav = document.createElement('div');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
        <a href="index.html" class="bottom-nav-item ${currentPage === 'index.html' ? 'active' : ''}"><i class="fas fa-home"></i><span>Inicio</span></a>
        <a href="cart.html" class="bottom-nav-item ${currentPage === 'cart.html' ? 'active' : ''}"><i class="fas fa-shopping-bag"></i><span>Carrito</span></a>
        <a href="favorites.html" class="bottom-nav-item ${currentPage === 'favorites.html' ? 'active' : ''}"><i class="fas fa-heart"></i><span>Favoritos</span></a>
        <a href="profile.html" class="bottom-nav-item ${currentPage === 'profile.html' ? 'active' : ''}"><i class="fas fa-user-circle"></i><span>Perfil</span></a>
    `;
    document.body.appendChild(bottomNav);
    document.body.classList.add('has-bottom-nav');

    // Dark mode
    const darkBtn = document.createElement('button');
    darkBtn.innerHTML = '<i class="fas fa-moon"></i>';
    darkBtn.style.cssText = 'position:fixed; bottom:80px; right:16px; width:44px; height:44px; border-radius:50%; background:#2A5C6E; color:white; border:none; cursor:pointer; z-index:99';
    document.body.appendChild(darkBtn);
    darkBtn.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        darkBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
})();