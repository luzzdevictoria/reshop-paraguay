// ============================================================
// FUNCIONALIDADES MÓVILES - RESHOP PARAGUAY
// ============================================================

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'success') {
    // Eliminar toast anterior si existe
    const existing = document.querySelector('.mobile-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'mobile-toast' + (type === 'error' ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}

// Exponer globalmente para que otros scripts la puedan usar
window.showToast = showToast;

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
    drawer.setAttribute('role', 'navigation');
    drawer.innerHTML = `
        <div class="drawer-header">
            <strong>🛍️ ReShop Paraguay</strong>
        </div>
        <a href="index.html" class="drawer-item"><i class="fas fa-home"></i> Inicio</a>
        <a href="cart.html" class="drawer-item"><i class="fas fa-shopping-bag"></i> Carrito</a>
        <a href="my-orders.html" class="drawer-item"><i class="fas fa-history"></i> Mis Pedidos</a>
        <a href="favorites.html" class="drawer-item"><i class="fas fa-heart"></i> Favoritos</a>
        <a href="profile.html" class="drawer-item"><i class="fas fa-user-circle"></i> Mi Perfil</a>
        <div class="drawer-divider"></div>
        <a href="dashboard-vendedor.html" id="drawerDashboardLink" class="drawer-item" style="display:none"><i class="fas fa-chart-line"></i> Mi Panel de Vendedor</a>
        <a href="admin-dashboard.html" id="drawerAdminLink" class="drawer-item" style="display:none"><i class="fas fa-crown"></i> Panel Admin</a>
        <div class="drawer-divider"></div>
        <div id="drawerAuthLinks">
            <a href="login.html" class="drawer-item"><i class="fas fa-key"></i> Iniciar Sesión</a>
            <a href="register.html" class="drawer-item"><i class="fas fa-user-plus"></i> Registrarse</a>
        </div>
        <div id="drawerUserMenu" style="display:none">
            <div class="drawer-item" id="drawerUserName" style="font-weight:600;color:#2A5C6E;pointer-events:none;"></div>
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

    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    // Sincronizar estado del usuario
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (token && user) {
        const els = {
            auth: document.getElementById('drawerAuthLinks'),
            menu: document.getElementById('drawerUserMenu'),
            name: document.getElementById('drawerUserName'),
            dash: document.getElementById('drawerDashboardLink'),
            admin: document.getElementById('drawerAdminLink'),
        };
        if (els.auth) els.auth.style.display = 'none';
        if (els.menu) els.menu.style.display = 'block';
        if (els.name) {
            els.name.innerHTML = `<i class="fas fa-user-circle"></i> ${user.full_name || user.email}`;
        }
        if (els.dash && user.role === 'seller') els.dash.style.display = 'flex';
        if (els.admin && user.role === 'admin') els.admin.style.display = 'flex';
    }

    const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');
    if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', () => {
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

// ============================================================
// 2. BOTTOM NAVIGATION BAR
// ============================================================
function initBottomNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const bottomNav = document.createElement('nav');
    bottomNav.className = 'bottom-nav';
    bottomNav.setAttribute('aria-label', 'Navegación principal');

    const pages = [
        { href: 'index.html',     icon: 'fa-home',         label: 'Inicio'    },
        { href: 'cart.html',      icon: 'fa-shopping-bag', label: 'Carrito'   },
        { href: 'my-orders.html', icon: 'fa-history',      label: 'Pedidos'   },
        { href: 'profile.html',   icon: 'fa-user-circle',  label: 'Perfil'    },
    ];

    bottomNav.innerHTML = pages.map(p => `
        <a href="${p.href}" class="bottom-nav-item ${currentPage === p.href ? 'active' : ''}">
            <i class="fas ${p.icon}"></i>
            <span>${p.label}</span>
        </a>
    `).join('');

    document.body.appendChild(bottomNav);
    document.body.classList.add('has-bottom-nav');
}

// ============================================================
// 3. FILTROS COMO BOTTOM SHEET
// ============================================================
function initMobileFilters() {
    const originalFilters = document.querySelector('.filters-section');
    if (!originalFilters) return;

    // Botón para abrir filtros — insertar antes del grid de productos
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const filterBtn = document.createElement('button');
    filterBtn.className = 'filter-toggle-btn';
    filterBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Filtrar / Buscar';
    productsGrid.parentNode.insertBefore(filterBtn, productsGrid);

    // Clonar los filtros originales al bottom sheet
    const sheet = document.createElement('div');
    sheet.className = 'filter-bottom-sheet';

    const handle = document.createElement('div');
    handle.className = 'filter-sheet-handle';
    sheet.appendChild(handle);

    // Clonar contenido de filtros (buscador + filtros)
    const clonedFilters = originalFilters.cloneNode(true);
    clonedFilters.style.display = 'block';
    clonedFilters.style.boxShadow = 'none';
    clonedFilters.style.padding = '0';
    clonedFilters.style.margin = '0';
    sheet.appendChild(clonedFilters);

    // Botón aplicar dentro del sheet
    const applyBtn = document.createElement('button');
    applyBtn.innerHTML = '<i class="fas fa-check"></i> Ver resultados';
    applyBtn.style.cssText = 'width:100%;padding:14px;background:#2A5C6E;color:white;border:none;border-radius:10px;font-size:1rem;margin-top:16px;cursor:pointer;font-family:inherit;';
    sheet.appendChild(applyBtn);

    const sheetOverlay = document.createElement('div');
    sheetOverlay.className = 'filter-sheet-overlay';

    document.body.appendChild(sheet);
    document.body.appendChild(sheetOverlay);

    function openSheet() {
        sheet.classList.add('open');
        sheetOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSheet() {
        sheet.classList.remove('open');
        sheetOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    filterBtn.addEventListener('click', openSheet);
    sheetOverlay.addEventListener('click', closeSheet);
    applyBtn.addEventListener('click', () => {
        closeSheet();
        // Sincronizar valores del sheet al formulario original y disparar filtros
        const sheetInputs = sheet.querySelectorAll('input, select');
        sheetInputs.forEach(input => {
            const original = document.getElementById(input.id);
            if (original) original.value = input.value;
        });
        if (typeof applyFilters === 'function') applyFilters();
        showToast('Filtros aplicados');
    });

    // Sincronizar cambios del formulario original al sheet en tiempo real
    const origInputs = originalFilters.querySelectorAll('input, select');
    origInputs.forEach(orig => {
        orig.addEventListener('change', () => {
            const sheetInput = sheet.querySelector('#' + orig.id);
            if (sheetInput) sheetInput.value = orig.value;
        });
    });
}

// ============================================================
// 4. PULL-TO-REFRESH
// ============================================================
function initPullToRefresh(containerId, refreshCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let startY = 0;
    let pulling = false;

    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh';
    indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Deslizá para actualizar';
    container.insertBefore(indicator, container.firstChild);

    container.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 50) {
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
        }
    }, { passive: true });

    container.addEventListener('touchend', async (e) => {
        if (!pulling) return;
        pulling = false;
        const diff = e.changedTouches[0].clientY - startY;
        if (diff > 50 && refreshCallback) {
            await refreshCallback();
            indicator.innerHTML = '<i class="fas fa-check"></i> Listo';
            showToast('Productos actualizados');
            setTimeout(() => {
                indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Deslizá para actualizar';
            }, 1500);
        } else {
            indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Deslizá para actualizar';
        }
    }, { passive: true });
}

// Exponer globalmente
window.initPullToRefresh = initPullToRefresh;

// ============================================================
// 5. FEEDBACK TÁCTIL
// ============================================================
function vibrate(duration = 50) {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(duration);
    }
}
window.vibrate = vibrate;

// ============================================================
// 6. MODO OSCURO
// ============================================================
function initDarkMode() {
    const btn = document.createElement('button');
    btn.className = 'dark-mode-toggle';
    btn.setAttribute('aria-label', 'Cambiar modo oscuro');
    btn.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'right:16px',
        'width:44px',
        'height:44px',
        'border-radius:50%',
        'background:var(--primary)',
        'color:white',
        'border:none',
        'box-shadow:0 2px 10px rgba(0,0,0,0.25)',
        'cursor:pointer',
        'z-index:200',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'font-size:1rem',
        'transition:background 0.2s'
    ].join(';');

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
        vibrate(30);
    });

    document.body.appendChild(btn);
}

// ============================================================
// 7. INPUTS NUMÉRICOS
// ============================================================
function setupNumericInputs() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
    });
}

// ============================================================
// 8. FEEDBACK TÁCTIL EN BOTONES
// ============================================================
function initButtonFeedback() {
    document.querySelectorAll('button, .btn').forEach(btn => {
        btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.96)';
            btn.style.transition = 'transform 0.1s';
        }, { passive: true });
        btn.addEventListener('touchend', () => {
            setTimeout(() => { btn.style.transform = ''; }, 120);
        }, { passive: true });
    });
}

// ============================================================
// INICIALIZAR TODO AL CARGAR EL DOM
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth > 768) return; // Solo en móvil

    initHamburgerMenu();
    initBottomNav();
    initDarkMode();
    initButtonFeedback();
    setupNumericInputs();
    initMobileFilters();

    // Activar pull-to-refresh en el grid de productos si existe
    if (document.getElementById('productsGrid') && typeof loadProducts === 'function') {
        initPullToRefresh('productsGrid', loadProducts);
    }
});