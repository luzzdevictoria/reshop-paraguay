/**
 * ARCHIVO: js/mobile.js
 * PROYECTO: ReShop Paraguay
 * VERSION: 1.0.0
 * CREADO: 2026-04-11
 * AUTOR: Pedro José Pirovani
 * DESCRIPCION: Lógica para interfaz móvil.
 *   - Header hamburguesa con drawer
 *   - Panel de filtros deslizable
 *   - Bottom navigation bar
 *   - Badge del carrito en tiempo real
 *   - Detección de página activa
 */

(function () {
    'use strict';

    // ============================================================
    // UTILIDADES
    // ============================================================

    /**
     * Detecta si estamos en móvil (<=768px)
     */
    function isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Obtiene el nombre del archivo actual de la URL
     */
    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename;
    }

    /**
     * Cuenta items en el carrito
     */
    function getCartCount() {
        try {
            const cart = JSON.parse(localStorage.getItem('reshop_cart') || '[]');
            return cart.reduce((total, item) => total + (item.quantity || 1), 0);
        } catch {
            return 0;
        }
    }

    /**
     * Obtiene usuario del localStorage
     */
    function getUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    }

    /**
     * Obtiene token del localStorage
     */
    function getToken() {
        return localStorage.getItem('token');
    }

    // ============================================================
    // HEADER MÓVIL - INYECCIÓN EN EL DOM
    // ============================================================

    function buildMobileHeader() {
        if (document.querySelector('.mobile-header')) return; // ya existe

        const user = getUser();
        const cartCount = getCartCount();
        const currentPage = getCurrentPage();

        const header = document.createElement('header');
        header.className = 'mobile-header';
        header.innerHTML = `
            <a href="index.html" class="mobile-header__logo">
                <img src="assets/images/logo.png" alt="ReShop" onerror="this.style.display='none'">
                <span class="mobile-header__title">ReShop PY</span>
            </a>
            <div class="mobile-header__actions">
                <a href="cart.html" class="mobile-header__cart-btn" aria-label="Carrito">
                    <i class="fas fa-shopping-bag"></i>
                    ${cartCount > 0 ? `<span class="cart-badge" id="headerCartBadge">${cartCount}</span>` : `<span class="cart-badge" id="headerCartBadge" style="display:none">${cartCount}</span>`}
                </a>
                <button class="hamburger-btn" id="hamburgerBtn" aria-label="Abrir menú" aria-expanded="false">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        `;

        // Insertar al principio del body
        document.body.insertBefore(header, document.body.firstChild);
    }

    // ============================================================
    // DRAWER DEL MENÚ
    // ============================================================

    function buildMenuDrawer() {
        if (document.querySelector('.mobile-menu-overlay')) return;

        const user = getUser();
        const currentPage = getCurrentPage();

        // Construir links según rol
        let roleLinks = '';
        if (user) {
            if (user.role === 'seller' || user.role === 'admin') {
                roleLinks += `
                    <a href="dashboard-vendedor.html" class="mobile-menu-drawer__link ${currentPage === 'dashboard-vendedor.html' ? 'active' : ''}">
                        <i class="fas fa-chart-line"></i> Mi Panel
                    </a>`;
            }
            if (user.role === 'admin') {
                roleLinks += `
                    <a href="admin-dashboard.html" class="mobile-menu-drawer__link ${currentPage === 'admin-dashboard.html' ? 'active' : ''}">
                        <i class="fas fa-crown"></i> Administración
                    </a>`;
            }
        }

        const authSection = user ? `
            <div class="mobile-menu-drawer__divider"></div>
            <button class="mobile-menu-drawer__logout" id="drawerLogoutBtn">
                <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
        ` : `
            <div class="mobile-menu-drawer__divider"></div>
            <a href="login.html" class="mobile-menu-drawer__link ${currentPage === 'login.html' ? 'active' : ''}">
                <i class="fas fa-key"></i> Iniciar Sesión
            </a>
            <a href="register.html" class="mobile-menu-drawer__link ${currentPage === 'register.html' ? 'active' : ''}">
                <i class="fas fa-user-plus"></i> Registrarse
            </a>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.id = 'menuOverlay';

        const drawer = document.createElement('nav');
        drawer.className = 'mobile-menu-drawer';
        drawer.id = 'menuDrawer';
        drawer.setAttribute('aria-label', 'Menú de navegación');
        drawer.innerHTML = `
            <div class="mobile-menu-drawer__header">
                <div class="mobile-menu-drawer__avatar">
                    <i class="fas fa-${user ? 'user' : 'store'}"></i>
                </div>
                <div>
                    <div class="mobile-menu-drawer__user-name">
                        ${user ? (user.full_name || user.email) : 'ReShop Paraguay'}
                    </div>
                    <div class="mobile-menu-drawer__user-role">
                        ${user ? (user.role === 'seller' ? '🏪 Vendedor' : user.role === 'admin' ? '⚙️ Admin' : '🛍️ Comprador') : 'Shopping Virtual'}
                    </div>
                </div>
            </div>
            <div class="mobile-menu-drawer__links">
                <a href="index.html" class="mobile-menu-drawer__link ${(currentPage === 'index.html' || currentPage === '') ? 'active' : ''}">
                    <i class="fas fa-home"></i> Inicio
                </a>
                <a href="cart.html" class="mobile-menu-drawer__link ${currentPage === 'cart.html' ? 'active' : ''}">
                    <i class="fas fa-shopping-bag"></i> Mi Carrito
                </a>
                <a href="my-orders.html" class="mobile-menu-drawer__link ${currentPage === 'my-orders.html' ? 'active' : ''}">
                    <i class="fas fa-history"></i> Mis Pedidos
                </a>
				<a href="messages.html" class="mobile-menu-drawer__link ${currentPage === 'messages.html' ? 'active' : ''}">
    <i class="fas fa-envelope"></i> Mensajes
</a>
<a href="help.html" class="mobile-menu-drawer__link ${currentPage === 'help.html' ? 'active' : ''}">
    <i class="fas fa-question-circle"></i> Ayuda
</a>
                ${roleLinks}
                ${authSection}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        // Eventos del drawer
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const menuOverlay = document.getElementById('menuOverlay');
        const menuDrawer = document.getElementById('menuDrawer');

        function openMenu() {
            menuOverlay.classList.add('is-open');
            menuDrawer.classList.add('is-open');
            hamburgerBtn?.classList.add('is-open');
            hamburgerBtn?.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            menuOverlay.classList.remove('is-open');
            menuDrawer.classList.remove('is-open');
            hamburgerBtn?.classList.remove('is-open');
            hamburgerBtn?.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        hamburgerBtn?.addEventListener('click', () => {
            const isOpen = menuDrawer.classList.contains('is-open');
            isOpen ? closeMenu() : openMenu();
        });

        menuOverlay.addEventListener('click', closeMenu);

        // Cerrar sesión desde el drawer
        const logoutBtn = document.getElementById('drawerLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }

        // Cerrar con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ============================================================
    // BOTTOM NAVIGATION BAR
    // ============================================================

    function buildBottomNav() {
        if (document.querySelector('.bottom-nav')) return;

        const currentPage = getCurrentPage();
        const cartCount = getCartCount();
        const user = getUser();

        const nav = document.createElement('nav');
        nav.className = 'bottom-nav';
        nav.setAttribute('aria-label', 'Navegación principal');

        const items = [
            {
                href: 'index.html',
                icon: 'fas fa-home',
                label: 'Inicio',
                pages: ['index.html', '']
            },
            {
                href: 'my-orders.html',
                icon: 'fas fa-receipt',
                label: 'Pedidos',
                pages: ['my-orders.html', 'order-detail.html']
            },
            {
                href: 'cart.html',
                icon: 'fas fa-shopping-bag',
                label: 'Carrito',
                pages: ['cart.html', 'checkout.html'],
                badge: cartCount
            },
            {
                href: user ? (user.role === 'seller' || user.role === 'admin' ? 'dashboard-vendedor.html' : 'my-orders.html') : 'login.html',
                icon: user ? 'fas fa-user-circle' : 'fas fa-sign-in-alt',
                label: user ? 'Mi Perfil' : 'Entrar',
                pages: ['login.html', 'register.html', 'profile.html', 'dashboard-vendedor.html', 'admin-dashboard.html']
            }
        ];

        nav.innerHTML = items.map(item => {
            const isActive = item.pages.includes(currentPage);
            const badgeHtml = item.badge > 0
                ? `<span class="bottom-nav__badge" id="bottomNavCartBadge">${item.badge > 99 ? '99+' : item.badge}</span>`
                : item.href === 'cart.html' ? `<span class="bottom-nav__badge" id="bottomNavCartBadge" style="display:none">0</span>` : '';

            return `
                <a href="${item.href}" class="bottom-nav__item ${isActive ? 'active' : ''}" aria-label="${item.label}">
                    <i class="${item.icon}"></i>
                    ${badgeHtml}
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        document.body.appendChild(nav);
    }

    // ============================================================
    // PANEL DE FILTROS DESLIZABLE (para index.html)
    // ============================================================

    function buildFiltersDrawer() {
        // Solo en páginas con sidebar de filtros
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || document.querySelector('.filters-drawer')) return;

        // Clonar el contenido del sidebar
        const sidebarContent = sidebar.innerHTML;

        const overlay = document.createElement('div');
        overlay.className = 'filters-overlay';
        overlay.id = 'filtersOverlay';

        const drawer = document.createElement('div');
        drawer.className = 'filters-drawer';
        drawer.id = 'filtersDrawer';
        drawer.innerHTML = `
            <div class="filters-drawer__header">
                <div class="filters-drawer__title">
                    <i class="fas fa-sliders-h"></i> Filtros
                </div>
                <button class="filters-drawer__close" id="filtersCloseBtn" aria-label="Cerrar filtros">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="filters-drawer__body" id="filtersDrawerBody">
                <!-- Contenido generado dinámicamente -->
            </div>
            <div class="filters-drawer__footer">
                <button class="btn-filters-clear" id="filtersClearBtn">
                    <i class="fas fa-undo"></i> Limpiar
                </button>
                <button class="btn-filters-apply" id="filtersApplyBtn">
                    <i class="fas fa-check"></i> Aplicar
                </button>
            </div>
        `;

        // Construir filtros en el drawer
        const body = drawer.querySelector('#filtersDrawerBody');
        body.innerHTML = `
            <div class="filters-drawer__group">
                <label class="filters-drawer__label">
                    <i class="fas fa-tshirt"></i> Categoría
                </label>
                <select class="filters-drawer__select" id="drawerFilterCategory">
                    <option value="">Todas las categorías</option>
                    <option value="pantalones">Pantalones</option>
                    <option value="camisas">Camisas</option>
                    <option value="vestidos">Vestidos</option>
                    <option value="chaquetas">Chaquetas</option>
                    <option value="calzado">Calzado</option>
                    <option value="accesorios">Accesorios</option>
                </select>
            </div>
            <div class="filters-drawer__group">
                <label class="filters-drawer__label">
                    <i class="fas fa-ruler"></i> Talla
                </label>
                <select class="filters-drawer__select" id="drawerFilterSize">
                    <option value="">Todas las tallas</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                </select>
            </div>
            <div class="filters-drawer__group">
                <label class="filters-drawer__label">
                    <i class="fas fa-star"></i> Estado
                </label>
                <select class="filters-drawer__select" id="drawerFilterCondition">
                    <option value="">Cualquier estado</option>
                    <option value="new_with_tags">Nuevo con etiqueta</option>
                    <option value="new_without_tags">Nuevo sin etiqueta</option>
                    <option value="very_good">Muy bueno</option>
                    <option value="good">Bueno</option>
                    <option value="acceptable">Aceptable</option>
                </select>
            </div>
            <div class="filters-drawer__group">
                <label class="filters-drawer__label">
                    <i class="fas fa-dollar-sign"></i> Rango de Precio (Gs)
                </label>
                <div class="filters-drawer__price-row">
                    <input type="number" class="filters-drawer__input" id="drawerFilterMinPrice" placeholder="Mínimo">
                    <input type="number" class="filters-drawer__input" id="drawerFilterMaxPrice" placeholder="Máximo">
                </div>
            </div>
            <div class="filters-drawer__group">
                <label class="filters-drawer__label">
                    <i class="fas fa-sort-amount-down"></i> Ordenar por
                </label>
                <select class="filters-drawer__select" id="drawerFilterSort">
                    <option value="newest">Más recientes</option>
                    <option value="price_asc">Precio: menor a mayor</option>
                    <option value="price_desc">Precio: mayor a menor</option>
                    <option value="most_viewed">Más vistos</option>
                </select>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        // Botón flotante para abrir filtros
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'floating-filter-btn';
        floatingBtn.id = 'floatingFilterBtn';
        floatingBtn.innerHTML = `
            <i class="fas fa-sliders-h"></i>
            Filtrar y ordenar
            <span class="filters-active-dot"></span>
        `;

        // Insertar el botón antes de la grilla de productos
        const productsGrid = document.querySelector('#productsGrid, .products-grid');
        if (productsGrid) {
            productsGrid.parentNode.insertBefore(floatingBtn, productsGrid);
        }

        // Funciones abrir/cerrar filtros
        function openFilters() {
            overlay.classList.add('is-open');
            drawer.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }

        function closeFilters() {
            overlay.classList.remove('is-open');
            drawer.classList.remove('is-open');
            document.body.style.overflow = '';
        }

        floatingBtn.addEventListener('click', openFilters);
        overlay.addEventListener('click', closeFilters);
        document.getElementById('filtersCloseBtn').addEventListener('click', closeFilters);

        // Sincronizar con filtros del sidebar original
        document.getElementById('filtersApplyBtn').addEventListener('click', () => {
            // Sincronizar valores al sidebar original si existe
            const catSidebar = document.getElementById('filterCategory');
            const sizeSidebar = document.getElementById('filterSize');
            const condSidebar = document.getElementById('filterCondition');
            const minSidebar = document.getElementById('filterMinPrice');
            const maxSidebar = document.getElementById('filterMaxPrice');

            if (catSidebar) catSidebar.value = document.getElementById('drawerFilterCategory').value;
            if (sizeSidebar) sizeSidebar.value = document.getElementById('drawerFilterSize').value;
            if (condSidebar) condSidebar.value = document.getElementById('drawerFilterCondition').value;
            if (minSidebar) minSidebar.value = document.getElementById('drawerFilterMinPrice').value;
            if (maxSidebar) maxSidebar.value = document.getElementById('drawerFilterMaxPrice').value;

            // Disparar el botón de aplicar filtros del sidebar
            const applyBtn = document.getElementById('applyFilters');
            if (applyBtn) applyBtn.click();
            else if (typeof loadProducts === 'function') {
                // Si los filtros son gestionados por JS directamente
                if (typeof currentFilters !== 'undefined') {
                    currentFilters.category = document.getElementById('drawerFilterCategory').value;
                    currentFilters.size = document.getElementById('drawerFilterSize').value;
                    currentFilters.condition = document.getElementById('drawerFilterCondition').value;
                    currentFilters.min_price = document.getElementById('drawerFilterMinPrice').value;
                    currentFilters.max_price = document.getElementById('drawerFilterMaxPrice').value;
                    currentFilters.page = 1;
                }
                loadProducts();
            }

            // Marcar filtros activos en botón
            const hasFilters = [
                document.getElementById('drawerFilterCategory').value,
                document.getElementById('drawerFilterSize').value,
                document.getElementById('drawerFilterCondition').value,
                document.getElementById('drawerFilterMinPrice').value,
                document.getElementById('drawerFilterMaxPrice').value
            ].some(v => v !== '');

            floatingBtn.classList.toggle('has-filters', hasFilters);
            closeFilters();
        });

        document.getElementById('filtersClearBtn').addEventListener('click', () => {
            document.getElementById('drawerFilterCategory').value = '';
            document.getElementById('drawerFilterSize').value = '';
            document.getElementById('drawerFilterCondition').value = '';
            document.getElementById('drawerFilterMinPrice').value = '';
            document.getElementById('drawerFilterMaxPrice').value = '';
            floatingBtn.classList.remove('has-filters');
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeFilters();
        });
    }

    // ============================================================
    // BARRA DE BÚSQUEDA MÓVIL (para index.html)
    // ============================================================

    function buildMobileSearch() {
        const productsGrid = document.querySelector('#productsGrid, .products-grid');
        if (!productsGrid || document.querySelector('.mobile-search')) return;

        const searchBar = document.createElement('div');
        searchBar.className = 'mobile-search';
        searchBar.innerHTML = `
            <input type="search" id="mobileSearchInput" placeholder="🔍 Buscar ropa, marcas..." autocomplete="off">
            <button id="mobileSearchBtn"><i class="fas fa-search"></i></button>
        `;

        productsGrid.parentNode.insertBefore(searchBar, productsGrid);

        const mobileInput = document.getElementById('mobileSearchInput');
        const mobileBtn = document.getElementById('mobileSearchBtn');

        function doSearch() {
            const q = mobileInput.value.trim();
            // Sincronizar con el input del header/sidebar
            const sidebarInput = document.getElementById('searchInput');
            if (sidebarInput) {
                sidebarInput.value = q;
                const searchBtn = document.getElementById('searchBtn');
                if (searchBtn) searchBtn.click();
            } else if (typeof loadProducts === 'function') {
                if (typeof currentFilters !== 'undefined') {
                    currentFilters.search = q;
                    currentFilters.page = 1;
                }
                loadProducts();
            }
        }

        mobileBtn.addEventListener('click', doSearch);
        mobileInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    // ============================================================
    // ACTUALIZAR BADGES DEL CARRITO
    // ============================================================

    function updateCartBadges() {
        const count = getCartCount();

        // Badge en header
        const headerBadge = document.getElementById('headerCartBadge');
        if (headerBadge) {
            headerBadge.textContent = count > 99 ? '99+' : count;
            headerBadge.style.display = count > 0 ? 'flex' : 'none';
        }

        // Badge en bottom nav
        const navBadge = document.getElementById('bottomNavCartBadge');
        if (navBadge) {
            navBadge.textContent = count > 99 ? '99+' : count;
            navBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // ============================================================
    // SWIPE TO CLOSE DRAWER (soporte táctil)
    // ============================================================

    function addSwipeToClose(drawerEl, direction = 'right') {
        if (!drawerEl) return;
        let startX = 0;
        let startY = 0;

        drawerEl.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        drawerEl.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = Math.abs(e.changedTouches[0].clientY - startY);

            // Solo swipe horizontal con poca deriva vertical
            if (dy < 80 && Math.abs(dx) > 60) {
                if (direction === 'right' && dx > 60) {
                    // Swipe derecha → cerrar drawer de izquierda
                    drawerEl.classList.remove('is-open');
                    document.getElementById('filtersOverlay')?.classList.remove('is-open');
                    document.body.style.overflow = '';
                } else if (direction === 'left' && dx < -60) {
                    // Swipe izquierda → cerrar drawer de derecha
                    drawerEl.classList.remove('is-open');
                    document.getElementById('menuOverlay')?.classList.remove('is-open');
                    document.getElementById('hamburgerBtn')?.classList.remove('is-open');
                    document.body.style.overflow = '';
                }
            }
        }, { passive: true });
    }

    // ============================================================
    // SCROLL TO TOP BUTTON
    // ============================================================

    function buildScrollToTop() {
        if (document.getElementById('scrollTopBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'scrollTopBtn';
        btn.setAttribute('aria-label', 'Volver arriba');
        btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        btn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            z-index: 700;
            transition: all 0.3s;
        `;

        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ============================================================
    // OCULTAR HEADER ORIGINAL EN MÓVIL
    // ============================================================

    function hideOriginalHeader() {
        // El CSS ya lo oculta con display:none, pero nos aseguramos
        const originalHeader = document.querySelector('.header');
        if (originalHeader && isMobile()) {
            originalHeader.style.display = 'none';
        }
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    function init() {
        if (!isMobile()) return; // Solo en móvil

        hideOriginalHeader();
        buildMobileHeader();
        buildMenuDrawer();
        buildBottomNav();
        buildFiltersDrawer();
        buildMobileSearch();
        updateCartBadges();
        buildScrollToTop();

        // Swipe gestures
        const menuDrawer = document.getElementById('menuDrawer');
        const filtersDrawer = document.getElementById('filtersDrawer');
        addSwipeToClose(menuDrawer, 'left');
        addSwipeToClose(filtersDrawer, 'right');

        // Escuchar cambios en el carrito
        const originalSetItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function (key, value) {
            originalSetItem(key, value);
            if (key === 'reshop_cart') {
                updateCartBadges();
            }
        };

        // Marcar página activa en la bottom nav
        const currentPage = getCurrentPage();
        document.querySelectorAll('.bottom-nav__item').forEach(item => {
            const href = item.getAttribute('href') || '';
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // También ejecutar en cambios de tamaño de ventana
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (isMobile()) {
                init();
            }
        }, 200);
    });

    // Exponer función de actualización de carrito globalmente
    window.updateMobileCartBadge = updateCartBadges;

})();