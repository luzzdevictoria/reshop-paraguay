// ============================================================
// FUNCIONALIDADES MÓVILES - RESHOP PARAGUAY
// ============================================================

// ============================================================
// 1. MENÚ HAMBURGUESA
// ============================================================
function initHamburgerMenu() {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Abrir menú');
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
        <a href="my-orders.html" class="drawer-item"><i class="fas fa-history"></i> Mis Pedidos</a>
        <div class="drawer-divider"></div>
        <a href="dashboard-vendedor.html" id="drawerDashboardLink" class="drawer-item" style="display: none;"><i class="fas fa-chart-line"></i> Mi Panel</a>
        <a href="admin-dashboard.html" id="drawerAdminLink" class="drawer-item" style="display: none;"><i class="fas fa-crown"></i> Admin</a>
        <div class="drawer-divider"></div>
        <div id="drawerAuthLinks">
            <a href="login.html" class="drawer-item"><i class="fas fa-key"></i> Iniciar Sesión</a>
            <a href="register.html" class="drawer-item"><i class="fas fa-user-plus"></i> Registrarse</a>
        </div>
        <div id="drawerUserMenu" style="display: none;">
            <div class="drawer-item" id="drawerUserName" style="font-weight: bold; color: #2A5C6E;"></div>
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
        hamburger.setAttribute('aria-label', 'Abrir menú');
    }

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-label', 'Cerrar menú');
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

    // Sincronizar estado del usuario en el drawer
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
        if (drawerUserName) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-user-circle';
            drawerUserName.appendChild(icon);
            drawerUserName.appendChild(document.createTextNode(' ' + (user.full_name || user.email)));
        }
        if (drawerDashboardLink && user.role === 'seller') drawerDashboardLink.style.display = 'flex';
        if (drawerAdminLink && user.role === 'admin') drawerAdminLink.style.display = 'flex';
    }

    // Logout en el drawer
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

    return { drawer, overlay, hamburger };
}

// ============================================================
// 2. BOTTOM NAVIGATION BAR
// ============================================================
function initBottomNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const bottomNav = document.createElement('div');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
        <a href="index.html" class="bottom-nav-item ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
        </a>
        <a href="cart.html" class="bottom-nav-item ${currentPage === 'cart.html' ? 'active' : ''}">
            <i class="fas fa-shopping-bag"></i>
            <span>Carrito</span>
        </a>
        <a href="my-orders.html" class="bottom-nav-item ${currentPage === 'my-orders.html' ? 'active' : ''}">
            <i class="fas fa-history"></i>
            <span>Pedidos</span>
        </a>
        <a href="profile.html" class="bottom-nav-item ${currentPage === 'profile.html' ? 'active' : ''}">
            <i class="fas fa-user-circle"></i>
            <span>Perfil</span>
        </a>
    `;
    document.body.appendChild(bottomNav);
    document.body.classList.add('has-bottom-nav');
}

// ============================================================
// 3. PULL-TO-REFRESH
// ============================================================
function initPullToRefresh(containerId, refreshCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let startY = 0;
    let pulling = false;

    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh';
    indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Desliza para actualizar';
    container.insertBefore(indicator, container.firstChild);

    container.addEventListener('touchstart', (e) => {
        if (container.scrollTop === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 60) {
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
        }
    }, { passive: true });

    container.addEventListener('touchend', async (e) => {
        if (!pulling) return;
        const diff = e.changedTouches[0].clientY - startY;
        if (diff > 60 && refreshCallback) {
            await refreshCallback();
            indicator.innerHTML = '<i class="fas fa-check"></i> Actualizado';
            setTimeout(() => {
                indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Desliza para actualizar';
            }, 1500);
        }
        pulling = false;
    });
}

// ============================================================
// 4. FEEDBACK TÁCTIL (VIBRACIÓN)
// ============================================================
function vibrate(duration = 50) {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}

// ============================================================
// 5. MODO OSCURO
// ============================================================
function initDarkMode() {
    const darkModeBtn = document.createElement('button');
    darkModeBtn.className = 'dark-mode-toggle';
    darkModeBtn.setAttribute('aria-label', 'Cambiar modo oscuro');
    darkModeBtn.style.cssText = [
        'position: fixed',
        'bottom: 80px',
        'right: 16px',
        'width: 44px',
        'height: 44px',
        'border-radius: 50%',
        'background: var(--primary)',
        'color: white',
        'border: none',
        'box-shadow: 0 2px 8px rgba(0,0,0,0.2)',
        'cursor: pointer',
        'z-index: 99',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'font-size: 1rem'
    ].join(';');
    document.body.appendChild(darkModeBtn);

    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }

    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkNow = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkNow);
        darkModeBtn.innerHTML = isDarkNow
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        vibrate(30);
    });
}

// ============================================================
// 6. INPUTS NUMÉRICOS CON TECLADO NUMÉRICO
// ============================================================
function setupNumericInputs() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
    });
}

// ============================================================
// 7. FEEDBACK VISUAL EN BOTONES
// ============================================================
function initButtonFeedback() {
    document.querySelectorAll('button, .btn').forEach(btn => {
        btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.96)';
        }, { passive: true });
        btn.addEventListener('touchend', () => {
            setTimeout(() => { btn.style.transform = ''; }, 150);
        }, { passive: true });
    });
}

// ============================================================
// INICIALIZAR TODO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 768) {
        initHamburgerMenu();
        initBottomNav();
        initDarkMode();
        initButtonFeedback();
        setupNumericInputs();
    }
});