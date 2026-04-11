// ============================================================
// FUNCIONALIDADES MÓVILES - RESHOP PARAGUAY
// ============================================================

function showToast(message, type = 'success') {
    const existing = document.querySelector('.mobile-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'mobile-toast' + (type === 'error' ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { toast.classList.add('show'); });
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}
window.showToast = showToast;

function initHamburgerMenu() {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Abrir menú');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(hamburger);

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'navigation');
    drawer.innerHTML = `
        <div class="drawer-header">🛍️ ReShop Paraguay</div>
        <a href="index.html" class="drawer-item"><i class="fas fa-home"></i> Inicio</a>
        <a href="cart.html" class="drawer-item"><i class="fas fa-shopping-bag"></i> Carrito</a>
        <a href="my-orders.html" class="drawer-item"><i class="fas fa-history"></i> Mis Pedidos</a>
        <a href="favorites.html" class="drawer-item"><i class="fas fa-heart"></i> Favoritos</a>
        <a href="profile.html" class="drawer-item"><i class="fas fa-user-circle"></i> Mi Perfil</a>
        <div class="drawer-divider"></div>
        <a href="dashboard-vendedor.html" id="drawerDashboardLink" class="drawer-item" style="display:none"><i class="fas fa-chart-line"></i> Mi Panel</a>
        <a href="admin-dashboard.html" id="drawerAdminLink" class="drawer-item" style="display:none"><i class="fas fa-crown"></i> Admin</a>
        <div class="drawer-divider"></div>
        <div id="drawerAuthLinks"><a href="login.html" class="drawer-item"><i class="fas fa-key"></i> Iniciar Sesión</a><a href="register.html" class="drawer-item"><i class="fas fa-user-plus"></i> Registrarse</a></div>
        <div id="drawerUserMenu" style="display:none"><div class="drawer-item" id="drawerUserName" style="font-weight:600;color:#2A5C6E;pointer-events:none;"></div><button id="drawerLogoutBtn" class="drawer-item"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button></div>
    `;
    document.body.appendChild(drawer);

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-label', 'Abrir menú');
        document.body.style.overflow = '';
    }

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-label', 'Cerrar menú');
        document.body.style.overflow = 'hidden';
    }

    hamburger.addEventListener('click', () => {
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('a').forEach(link => { link.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (token && user) {
        const authDiv = document.getElementById('drawerAuthLinks');
        const userDiv = document.getElementById('drawerUserMenu');
        const userNameSpan = document.getElementById('drawerUserName');
        const dashLink = document.getElementById('drawerDashboardLink');
        const adminLink = document.getElementById('drawerAdminLink');
        if (authDiv) authDiv.style.display = 'none';
        if (userDiv) userDiv.style.display = 'block';
        if (userNameSpan) userNameSpan.innerHTML = `<i class="fas fa-user-circle"></i> ${user.full_name || user.email}`;
        if (dashLink && user.role === 'seller') dashLink.style.display = 'flex';
        if (adminLink && user.role === 'admin') adminLink.style.display = 'flex';
    }

    const logoutBtn = document.getElementById('drawerLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('reshop_cart');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            closeDrawer();
            showToast('Sesión cerrada');
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
        });
    }
    return { drawer, overlay, hamburger, closeDrawer, openDrawer };
}

function initBottomNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const bottomNav = document.createElement('nav');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
        <a href="index.html" class="bottom-nav-item ${currentPage === 'index.html' ? 'active' : ''}"><i class="fas fa-home"></i><span>Inicio</span></a>
        <a href="cart.html" class="bottom-nav-item ${currentPage === 'cart.html' ? 'active' : ''}"><i class="fas fa-shopping-bag"></i><span>Carrito</span></a>
        <a href="my-orders.html" class="bottom-nav-item ${currentPage === 'my-orders.html' ? 'active' : ''}"><i class="fas fa-history"></i><span>Pedidos</span></a>
        <a href="profile.html" class="bottom-nav-item ${currentPage === 'profile.html' ? 'active' : ''}"><i class="fas fa-user-circle"></i><span>Perfil</span></a>
    `;
    document.body.appendChild(bottomNav);
    document.body.classList.add('has-bottom-nav');
}

function initDarkMode() {
    const btn = document.createElement('button');
    btn.className = 'dark-mode-toggle';
    btn.style.cssText = 'position:fixed; bottom:80px; right:16px; width:44px; height:44px; border-radius:50%; background:#2A5C6E; color:white; border:none; cursor:pointer; z-index:99; display:flex; align-items:center; justify-content:center; font-size:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        btn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const nowDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', nowDark);
        btn.innerHTML = nowDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
    document.body.appendChild(btn);
}

function vibrate(duration = 50) {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(duration);
}
window.vibrate = vibrate;

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        initHamburgerMenu();
        initBottomNav();
        initDarkMode();
    }
});