// ============================================================
// FUNCIONALIDADES MÓVILES - RESHOP PARAGUAY
// ============================================================

function initHamburgerMenu() {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(hamburger);

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.innerHTML = `
        <div class="drawer-header">
            <strong>ReShop Paraguay</strong>
        </div>
        <a href="index.html" class="drawer-item"><i class="fas fa-home"></i> Inicio</a>
        <a href="cart.html" class="drawer-item"><i class="fas fa-shopping-bag"></i> Carrito</a>
        <a href="favorites.html" class="drawer-item"><i class="fas fa-heart"></i> Favoritos</a>
        <a href="profile.html" class="drawer-item"><i class="fas fa-user-circle"></i> Mi Perfil</a>
        <div class="drawer-divider"></div>
        <a href="dashboard-vendedor.html" id="drawerDashboardLink" class="drawer-item" style="display: none;"><i class="fas fa-chart-line"></i> Mi Panel</a>
        <a href="admin-dashboard.html" id="drawerAdminLink" class="drawer-item" style="display: none;"><i class="fas fa-crown"></i> Admin</a>
        <div class="drawer-divider"></div>
        <div id="drawerAuthLinks">
            <a href="login.html" class="drawer-item"><i class="fas fa-key"></i> Iniciar Sesión</a>
            <a href="register.html" class="drawer-item"><i class="fas fa-user-plus"></i> Registrarse</a>
        </div>
        <div id="drawerUserMenu" style="display: none;">
            <div class="drawer-item" id="drawerUserName" style="font-weight: bold;"></div>
            <button id="drawerLogoutBtn" class="drawer-item"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
        </div>
    `;
    document.body.appendChild(drawer);

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);

function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    hamburger.classList.remove('active');
    hamburger.style.opacity = '';
    hamburger.style.pointerEvents = '';
}

function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    hamburger.classList.add('active');
    hamburger.style.opacity = '0';
    hamburger.style.pointerEvents = 'none';
}
    hamburger.addEventListener('click', () => {
        if (drawer.classList.contains('open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    overlay.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Sincronizar estado del usuario
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (token && user) {
        const drawerAuthLinks = document.getElementById('drawerAuthLinks');
        const drawerUserMenu = document.getElementById('drawerUserMenu');
        const drawerUserName = document.getElementById('drawerUserName');
        const drawerDashboardLink = document.getElementById('drawerDashboardLink');
        const drawerAdminLink = document.getElementById('drawerAdminLink');

        if (drawerAuthLinks) drawerAuthLinks.style.display = 'none';
        if (drawerUserMenu) drawerUserMenu.style.display = 'block';
        if (drawerUserName) drawerUserName.innerHTML = '<i class="fas fa-user-circle"></i> ' + (user.full_name || user.email);
        if (drawerDashboardLink && user.role === 'seller') drawerDashboardLink.style.display = 'flex';
        if (drawerAdminLink && user.role === 'admin') drawerAdminLink.style.display = 'flex';
    }

    const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');
    if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('reshop_cart');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            closeDrawer();
            window.location.href = 'index.html';
        });
    }
}

function initBottomNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const bottomNav = document.createElement('div');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
        <a href="index.html" class="bottom-nav-item ${currentPage === 'index.html' ? 'active' : ''}">
            <i class="fas fa-home"></i><span>Inicio</span>
        </a>
        <a href="cart.html" class="bottom-nav-item ${currentPage === 'cart.html' ? 'active' : ''}">
            <i class="fas fa-shopping-bag"></i><span>Carrito</span>
        </a>
        <a href="favorites.html" class="bottom-nav-item ${currentPage === 'favorites.html' ? 'active' : ''}">
            <i class="fas fa-heart"></i><span>Favoritos</span>
        </a>
        <a href="profile.html" class="bottom-nav-item ${currentPage === 'profile.html' ? 'active' : ''}">
            <i class="fas fa-user-circle"></i><span>Perfil</span>
        </a>
    `;
    document.body.appendChild(bottomNav);
    document.body.classList.add('has-bottom-nav');
}

function initDarkMode() {
    const darkModeBtn = document.createElement('button');
    darkModeBtn.className = 'dark-mode-toggle';
    darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeBtn.style.cssText = 'position: fixed; bottom: 80px; right: 20px; width: 48px; height: 48px; border-radius: 50%; background: var(--primary); color: white; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; z-index: 99; display: flex; align-items: center; justify-content: center;';
    document.body.appendChild(darkModeBtn);

    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkNow = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkNow);
        darkModeBtn.innerHTML = isDarkNow ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        initHamburgerMenu();
        initBottomNav();
        initDarkMode();
    }
});