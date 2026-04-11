/**
 * ARCHIVO: frontend/js/mobile.js
 * PROYECTO: ReShop Paraguay
 * VERSION: 1.1.0
 * ACTUALIZADO: 2026-04-11
 * AUTOR: Pedro José Pirovani
 *
 * CHANGELOG v1.1.0:
 * [+] Botón "Buscar cerca de mí" con geolocalización real
 *     → usa JOIN products + users (latitude/longitude en tabla users)
 *     → filtra por address_visible = true
 *     → calcula distancia Haversine en el cliente
 * [+] Enlace "Mensajes" en el drawer (visible para todos)
 * [+] Enlace "Ayuda" en el drawer (visible para todos)
 */

(function () {
    'use strict';

    const API_URL = 'https://reshop-backend.vercel.app';
    const NEAR_ME_RADIUS_KM = 10;

    // ── Utilidades ─────────────────────────────────────────────
    function isMobile() { return window.innerWidth <= 768; }

    function getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    function getCartCount() {
        try {
            return JSON.parse(localStorage.getItem('reshop_cart') || '[]')
                .reduce((t, i) => t + (i.quantity || 1), 0);
        } catch { return 0; }
    }

    function getUser() {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); }
        catch { return null; }
    }

    // ── Haversine ──────────────────────────────────────────────
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 +
                  Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
                  Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    // ── Fetch productos cercanos ───────────────────────────────
    async function fetchProductsNearMe(userLat, userLng, radiusKm) {
        const res = await fetch(`${API_URL}/api/products?limit=200`);
        if (!res.ok) throw new Error('Error al consultar productos');
        const data = await res.json();
        if (!data.success || !Array.isArray(data.products)) return [];

        return data.products
            .filter(p => {
                const lat = p.seller?.latitude ?? null;
                const lng = p.seller?.longitude ?? null;
                if (!lat || !lng) return false;
                if (p.seller?.address_visible === false) return false;
                const dist = calculateDistance(userLat, userLng, lat, lng);
                p._distanceKm = dist;
                return dist <= radiusKm;
            })
            .sort((a, b) => a._distanceKm - b._distanceKm);
    }
    function getOriginFlagMobile(origin) {
        const flags = {
            'PAR': '🇵🇾 Paraguay',
            'ARG': '🇦🇷 Argentina',
            'BRA': '🇧🇷 Brasil',
            'USA': '🇺🇸 USA',
            'CHN': '🇨🇳 China',
            'EUR': '🇪🇺 Europa',
            'JPN': '🇯🇵 Japón',
            'MEX': '🇲🇽 México',
            'URY': '🇺🇾 Uruguay',
            'CHL': '🇨🇱 Chile',
            'BOL': '🇧🇴 Bolivia',
            'PER': '🇵🇪 Perú',
            'COL': '🇨🇴 Colombia',
            'VEN': '🇻🇪 Venezuela',
            'ECU': '🇪🇨 Ecuador',
            'OTH': '🌎 Otro'
        };
        return flags[origin] || (origin ? `🌍 ${origin}` : '🌍 No especificado');
    }


    // ── Render productos cercanos ──────────────────────────────
    function renderNearbyProducts(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#666;">
                    <i class="fas fa-map-marker-alt" style="font-size:2.5rem;color:#2A5C6E;display:block;margin-bottom:14px;"></i>
                    <p style="font-size:1rem;font-weight:600;margin-bottom:6px;">Sin resultados cercanos</p>
                    <p style="font-size:.85rem;">No hay vendedores dentro de ${NEAR_ME_RADIUS_KM} km.</p>
                    <button onclick="window.mobileNearMe.reset()"
                            style="margin-top:16px;padding:10px 22px;background:#2A5C6E;color:white;border:none;border-radius:24px;cursor:pointer;font-size:.9rem;">
                        <i class="fas fa-undo"></i> Ver todos
                    </button>
                </div>`;
            return;
        }

        if (typeof renderProducts === 'function') {
            renderProducts(products);
            setTimeout(() => addDistanceBadges(products), 60);
            return;
        }

        const fmt = n => new Intl.NumberFormat('es-PY').format(n);
        const esc = t => { const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; };
        const condMap = {
            new_with_tags:'Nuevo c/etiqueta', new_without_tags:'Nuevo s/etiqueta',
            very_good:'Muy bueno', good:'Bueno', acceptable:'Aceptable'
        };

        grid.innerHTML = products.map(p => `
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                <div class="product-card__img-wrapper" style="position:relative;">
                    <img src="${p.images_urls?.[0]||'https://placehold.co/400x400/f0f0f0/999?text=Sin+foto'}"
                         alt="${esc(p.title)}" loading="lazy"
                         onerror="this.src='https://placehold.co/400x400/f0f0f0/999?text=Sin+foto'">
                    ${p._distanceKm ? `<span class="distance-badge"><i class="fas fa-location-dot"></i> ${p._distanceKm.toFixed(1)} km</span>` : ''}
                </div>
                <div class="product-card__content">
                    <h3 class="product-card__title">${esc(p.title)}</h3>
                    <p class="product-card__price">${fmt(p.price)} Gs</p>
                    <p class="product-card__seller"><i class="fas fa-store"></i> ${esc(p.seller?.store_name||p.seller?.full_name||'Vendedor')}</p>
                    <p class="product-card__origin" style="font-size: 0.7rem; color: var(--text-light); margin: 4px 0;"><i class="fas fa-globe-americas"></i> ${getOriginFlagMobile(p.origin)}</p>
                    <span class="product-card__condition">${condMap[p.condition]||''}</span>
                    <button class="product-card__button"
                            onclick="event.stopPropagation();window.location.href='product-detail.html?id=${p.id}'">
                        <i class="fas fa-eye"></i> Ver producto
                    </button>
                </div>
            </div>
        `).join('');
    }

    function addDistanceBadges(products) {
        document.querySelectorAll('#productsGrid .product-card').forEach((card, i) => {
            const p = products[i];
            if (!p?._distanceKm) return;
            const wrapper = card.querySelector('.product-card__img-wrapper, .product-card__image');
            if (!wrapper || wrapper.querySelector('.distance-badge')) return;
            wrapper.style.position = 'relative';
            const b = document.createElement('span');
            b.className = 'distance-badge';
            b.innerHTML = `<i class="fas fa-location-dot"></i> ${p._distanceKm.toFixed(1)} km`;
            wrapper.appendChild(b);
        });
    }

    // ── Toast ──────────────────────────────────────────────────
    function showToast(msg, type = 'info') {
        document.getElementById('nearMeToast')?.remove();
        const colors = { success:'#28a745', error:'#D95A41', info:'#2A5C6E' };
        const t = document.createElement('div');
        t.id = 'nearMeToast';
        t.style.cssText = `
            position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);
            background:${colors[type]};color:white;padding:10px 20px;border-radius:24px;
            font-size:.85rem;font-weight:500;z-index:2000;box-shadow:0 4px 16px rgba(0,0,0,.25);
            opacity:0;transition:opacity .3s,transform .3s;max-width:90vw;text-align:center;
        `;
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => {
            t.style.opacity = '1';
            t.style.transform = 'translateX(-50%) translateY(0)';
        });
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => t.remove(), 350);
        }, 3500);
    }

    // ── Botón "Buscar cerca de mí" ────────────────────────────
    function buildNearMeButton(referenceNode) {
        if (document.getElementById('nearMeBtn')) {
            console.log('✅ Botón near-me ya existe');
            return;
        }
        
        const grid = document.querySelector('#productsGrid, .products-grid');
        if (!grid) {
            console.warn('⚠️ buildNearMeButton: No se encontró el grid de productos');
            return;
        }

        console.log('📍 Creando botón "Buscar cerca de mí"');

        const btn = document.createElement('button');
        btn.id = 'nearMeBtn';
        btn.className = 'btn-near-me';
        btn.innerHTML = '<i class="fas fa-location-dot"></i> Buscar cerca de mí';

        // Insertar el botón
        if (referenceNode && referenceNode.parentNode) {
            // Insertar después del botón de referencia
            referenceNode.parentNode.insertBefore(btn, referenceNode.nextSibling);
            console.log('✅ Botón near-me insertado después de referencia');
        } else {
            // Insertar antes del grid
            grid.parentNode?.insertBefore(btn, grid);
            console.log('✅ Botón near-me insertado antes del grid');
        }

        let active = false;

        window.mobileNearMe = {
            reset() {
                active = false;
                btn.innerHTML = '<i class="fas fa-location-dot"></i> Buscar cerca de mí';
                btn.classList.remove('is-active');
                btn.disabled = false;
                if (typeof loadProducts === 'function') loadProducts();
                console.log('🔄 Filtro "cerca de mí" desactivado');
            }
        };

        btn.addEventListener('click', async () => {
            if (active) { 
                window.mobileNearMe.reset(); 
                return; 
            }
            if (!navigator.geolocation) {
                showToast('Tu dispositivo no soporta geolocalización.', 'error');
                return;
            }
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Obteniendo ubicación...';

            navigator.geolocation.getCurrentPosition(
                async ({ coords: { latitude, longitude } }) => {
                    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Buscando productos...';
                    try {
                        const products = await fetchProductsNearMe(latitude, longitude, NEAR_ME_RADIUS_KM);
                        active = true;
                        btn.disabled = false;
                        btn.innerHTML = `<i class="fas fa-location-dot"></i> Cerca (${products.length}) ✕`;
                        btn.classList.add('is-active');
                        renderNearbyProducts(products);
                        showToast(
                            products.length > 0
                                ? `${products.length} producto${products.length!==1?'s':''} a menos de ${NEAR_ME_RADIUS_KM} km`
                                : 'Sin resultados en tu zona',
                            products.length > 0 ? 'success' : 'info'
                        );
                    } catch (err) {
                        console.error('Error en fetchProductsNearMe:', err);
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-location-dot"></i> Buscar cerca de mí';
                        showToast('Error al buscar productos cercanos.', 'error');
                    }
                },
                (err) => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-location-dot"></i> Buscar cerca de mí';
                    const msgs = {
                        1:'Permiso de ubicación denegado.',
                        2:'No se pudo determinar tu ubicación.',
                        3:'Se agotó el tiempo de espera.'
                    };
                    showToast(msgs[err.code] || 'Error al obtener ubicación.', 'error');
                    console.error('Error de geolocalización:', err);
                },
                { timeout: 10000, maximumAge: 120000, enableHighAccuracy: false }
            );
        });
    }

    // ── Header móvil ───────────────────────────────────────────
    function buildMobileHeader() {
        if (document.querySelector('.mobile-header')) return;
        const count = getCartCount();
        const h = document.createElement('header');
        h.className = 'mobile-header';
        h.innerHTML = `
            <a href="index.html" class="mobile-header__logo">
                <img src="assets/images/logo.png" alt="ReShop" onerror="this.style.display='none'">
                <span class="mobile-header__title">ReShop PY</span>
            </a>
            <div class="mobile-header__actions">
                <a href="cart.html" class="mobile-header__cart-btn" aria-label="Carrito">
                    <i class="fas fa-shopping-bag"></i>
                    <span class="cart-badge" id="headerCartBadge" style="${count>0?'':'display:none'}">${count}</span>
                </a>
                <button class="hamburger-btn" id="hamburgerBtn" aria-label="Abrir menú" aria-expanded="false">
                    <span></span><span></span><span></span>
                </button>
            </div>`;
        document.body.insertBefore(h, document.body.firstChild);
    }

    // ── Drawer menú (con Mensajes y Ayuda) ─────────────────────
    function buildMenuDrawer() {
        if (document.querySelector('.mobile-menu-overlay')) return;
        const user = getUser();
        const page = getCurrentPage();

        let roleLinks = '';
        if (user?.role === 'seller' || user?.role === 'admin') {
            roleLinks += `<a href="dashboard-vendedor.html" class="mobile-menu-drawer__link ${page==='dashboard-vendedor.html'?'active':''}"><i class="fas fa-chart-line"></i> Mi Panel</a>`;
        }
        if (user?.role === 'admin') {
            roleLinks += `<a href="admin-dashboard.html" class="mobile-menu-drawer__link ${page==='admin-dashboard.html'?'active':''}"><i class="fas fa-crown"></i> Administración</a>`;
        }

        const authSection = user ? `
            <div class="mobile-menu-drawer__divider"></div>
            <button class="mobile-menu-drawer__logout" id="drawerLogoutBtn">
                <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>` : `
            <div class="mobile-menu-drawer__divider"></div>
            <a href="login.html" class="mobile-menu-drawer__link ${page==='login.html'?'active':''}"><i class="fas fa-key"></i> Iniciar Sesión</a>
            <a href="register.html" class="mobile-menu-drawer__link ${page==='register.html'?'active':''}"><i class="fas fa-user-plus"></i> Registrarse</a>`;

        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.id = 'menuOverlay';

        const drawer = document.createElement('nav');
        drawer.className = 'mobile-menu-drawer';
        drawer.id = 'menuDrawer';
        drawer.innerHTML = `
            <div class="mobile-menu-drawer__header">
                <div class="mobile-menu-drawer__avatar">
                    <i class="fas fa-${user?'user':'store'}"></i>
                </div>
                <div>
                    <div class="mobile-menu-drawer__user-name">${user?(user.full_name||user.email):'ReShop Paraguay'}</div>
                    <div class="mobile-menu-drawer__user-role">${user?(user.role==='seller'?'🏪 Vendedor':user.role==='admin'?'⚙️ Admin':'🛍️ Comprador'):'Shopping Virtual'}</div>
                </div>
            </div>
            <div class="mobile-menu-drawer__links">
                <a href="index.html" class="mobile-menu-drawer__link ${(page==='index.html'||page==='')?'active':''}"><i class="fas fa-home"></i> Inicio</a>
                <a href="cart.html" class="mobile-menu-drawer__link ${page==='cart.html'?'active':''}"><i class="fas fa-shopping-bag"></i> Mi Carrito</a>
                <a href="my-orders.html" class="mobile-menu-drawer__link ${page==='my-orders.html'?'active':''}"><i class="fas fa-history"></i> Mis Pedidos</a>
                <a href="messages.html" class="mobile-menu-drawer__link ${page==='messages.html'?'active':''}"><i class="fas fa-comment-dots"></i> Mensajes</a>
                <a href="help.html" class="mobile-menu-drawer__link ${page==='help.html'?'active':''}"><i class="fas fa-circle-question"></i> Ayuda</a>
                ${roleLinks}
                ${authSection}
            </div>`;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        const hbtn = document.getElementById('hamburgerBtn');
        const open  = () => { overlay.classList.add('is-open'); drawer.classList.add('is-open'); hbtn?.classList.add('is-open'); hbtn?.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
        const close = () => { overlay.classList.remove('is-open'); drawer.classList.remove('is-open'); hbtn?.classList.remove('is-open'); hbtn?.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
        hbtn?.addEventListener('click', () => drawer.classList.contains('is-open') ? close() : open());
        overlay.addEventListener('click', close);
        document.getElementById('drawerLogoutBtn')?.addEventListener('click', () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href='index.html'; });
        document.addEventListener('keydown', e => { if(e.key==='Escape') close(); });
    }

    // ── Bottom nav ─────────────────────────────────────────────
    function buildBottomNav() {
        if (document.querySelector('.bottom-nav')) return;
        const page  = getCurrentPage();
        const count = getCartCount();
        const user  = getUser();
        const nav = document.createElement('nav');
        nav.className = 'bottom-nav';
        const items = [
            { href:'index.html',    icon:'fas fa-home',         label:'Inicio',   pages:['index.html',''] },
            { href:'my-orders.html',icon:'fas fa-receipt',      label:'Pedidos',  pages:['my-orders.html','order-detail.html'] },
            { href:'cart.html',     icon:'fas fa-shopping-bag', label:'Carrito',  pages:['cart.html','checkout.html'], badge:count },
            { href: user?(user.role==='seller'||user.role==='admin'?'dashboard-vendedor.html':'my-orders.html'):'login.html',
              icon: user?'fas fa-user-circle':'fas fa-sign-in-alt', label: user?'Mi Perfil':'Entrar',
              pages:['login.html','register.html','profile.html','dashboard-vendedor.html','admin-dashboard.html'] }
        ];
        nav.innerHTML = items.map(it => {
            const active = it.pages.includes(page);
            const badge  = it.badge>0
                ? `<span class="bottom-nav__badge" id="bottomNavCartBadge">${it.badge>99?'99+':it.badge}</span>`
                : it.href==='cart.html'
                    ? `<span class="bottom-nav__badge" id="bottomNavCartBadge" style="display:none">0</span>` : '';
            return `<a href="${it.href}" class="bottom-nav__item ${active?'active':''}" aria-label="${it.label}"><i class="${it.icon}"></i>${badge}<span>${it.label}</span></a>`;
        }).join('');
        document.body.appendChild(nav);
    }

    // ── Filtros drawer ─────────────────────────────────────────
    function buildFiltersDrawer() {
        // No depender del sidebar - crear drawer siempre que no exista
        if (document.querySelector('.filters-drawer')) return;

        console.log('🎨 Construyendo drawer de filtros en móvil...');

        const overlay = document.createElement('div');
        overlay.className = 'filters-overlay';
        overlay.id = 'filtersOverlay';

        const drawer = document.createElement('div');
        drawer.className = 'filters-drawer';
        drawer.id = 'filtersDrawer';
        drawer.innerHTML = `
            <div class="filters-drawer__header">
                <div class="filters-drawer__title"><i class="fas fa-sliders-h"></i> Filtros</div>
                <button class="filters-drawer__close" id="filtersCloseBtn"><i class="fas fa-times"></i></button>
            </div>
            <div class="filters-drawer__body">
                <div class="filters-drawer__group"><label class="filters-drawer__label">Categoría</label>
                    <select class="filters-drawer__select" id="drawerFilterCategory">
                        <option value="">Todas</option>
                        <option value="pantalones">Pantalones</option>
                        <option value="camisas">Camisas</option>
                        <option value="vestidos">Vestidos</option>
                        <option value="chaquetas">Chaquetas</option>
                        <option value="calzado">Calzado</option>
                        <option value="accesorios">Accesorios</option>
                    </select>
                </div>
                <div class="filters-drawer__group"><label class="filters-drawer__label">Talla</label>
                    <select class="filters-drawer__select" id="drawerFilterSize">
                        <option value="">Todas</option>
                        <option value="XS">XS</option><option value="S">S</option>
                        <option value="M">M</option><option value="L">L</option>
                        <option value="XL">XL</option><option value="XXL">XXL</option>
                    </select>
                </div>
                <div class="filters-drawer__group"><label class="filters-drawer__label">Estado</label>
                    <select class="filters-drawer__select" id="drawerFilterCondition">
                        <option value="">Cualquier estado</option>
                        <option value="new_with_tags">Nuevo c/ etiqueta</option>
                        <option value="new_without_tags">Nuevo s/ etiqueta</option>
                        <option value="very_good">Muy bueno</option>
                        <option value="good">Bueno</option>
                        <option value="acceptable">Aceptable</option>
                    </select>
                </div>
                <div class="filters-drawer__group"><label class="filters-drawer__label"><i class="fas fa-globe-americas"></i> Origen</label>
                    <select class="filters-drawer__select" id="drawerFilterOrigin">
                        <option value="">Todos los orígenes</option>
                        <option value="PAR">🇵🇾 Paraguay</option>
                        <option value="ARG">🇦🇷 Argentina</option>
                        <option value="BRA">🇧🇷 Brasil</option>
                        <option value="USA">🇺🇸 Estados Unidos</option>
                        <option value="CHN">🇨🇳 China</option>
                        <option value="EUR">🇪🇺 Europa</option>
                        <option value="JPN">🇯🇵 Japón</option>
                        <option value="MEX">🇲🇽 México</option>
                        <option value="URY">🇺🇾 Uruguay</option>
                        <option value="CHL">🇨🇱 Chile</option>
                        <option value="BOL">🇧🇴 Bolivia</option>
                        <option value="PER">🇵🇪 Perú</option>
                        <option value="COL">🇨🇴 Colombia</option>
                        <option value="VEN">🇻🇪 Venezuela</option>
                        <option value="ECU">🇪🇨 Ecuador</option>
                        <option value="OTH">🌎 Otro</option>
                    </select>
                </div>
                <div class="filters-drawer__group"><label class="filters-drawer__label">Precio (Gs)</label>
                    <div class="filters-drawer__price-row">
                        <input type="number" class="filters-drawer__input" id="drawerFilterMinPrice" placeholder="Mínimo">
                        <input type="number" class="filters-drawer__input" id="drawerFilterMaxPrice" placeholder="Máximo">
                    </div>
                </div>
            </div>
            <div class="filters-drawer__footer">
                <button class="btn-filters-clear" id="filtersClearBtn"><i class="fas fa-undo"></i> Limpiar</button>
                <button class="btn-filters-apply" id="filtersApplyBtn"><i class="fas fa-check"></i> Aplicar</button>
            </div>`;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        // Crear botón flotante de filtros
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'floating-filter-btn';
        floatingBtn.id = 'floatingFilterBtn';
        floatingBtn.innerHTML = `<i class="fas fa-sliders-h"></i> Filtrar y ordenar <span class="filters-active-dot"></span>`;

        const grid = document.querySelector('#productsGrid, .products-grid');
        if (grid) {
            grid.parentNode.insertBefore(floatingBtn, grid);
            console.log('✅ Botón flotante de filtros agregado');
        } else {
            console.warn('⚠️ No se encontró el grid de productos');
        }

        // Botón near-me después del de filtros
        buildNearMeButton(floatingBtn);

        const open  = () => { overlay.classList.add('is-open'); drawer.classList.add('is-open'); document.body.style.overflow='hidden'; };
        const close = () => { overlay.classList.remove('is-open'); drawer.classList.remove('is-open'); document.body.style.overflow=''; };

        floatingBtn.addEventListener('click', open);
        overlay.addEventListener('click', close);
        document.getElementById('filtersCloseBtn').addEventListener('click', close);

        document.getElementById('filtersApplyBtn').addEventListener('click', () => {
            [['filterCategory','drawerFilterCategory'],['filterSize','drawerFilterSize'],
             ['filterCondition','drawerFilterCondition'],['filterOrigin','drawerFilterOrigin'],
             ['filterMinPrice','drawerFilterMinPrice'],['filterMaxPrice','drawerFilterMaxPrice']].forEach(([sid, did]) => {
                const s = document.getElementById(sid), d = document.getElementById(did);
                if (s && d) s.value = d.value;
            });
            document.getElementById('applyFilters')?.click();
            const hasF = ['drawerFilterCategory','drawerFilterSize','drawerFilterCondition','drawerFilterOrigin',
                          'drawerFilterMinPrice','drawerFilterMaxPrice']
                .some(id => (document.getElementById(id)?.value||'')!=='');
            floatingBtn.classList.toggle('has-filters', hasF);
            close();
        });

        document.getElementById('filtersClearBtn').addEventListener('click', () => {
            ['drawerFilterCategory','drawerFilterSize','drawerFilterCondition','drawerFilterOrigin',
             'drawerFilterMinPrice','drawerFilterMaxPrice'].forEach(id => {
                const el = document.getElementById(id); if(el) el.value='';
            });
            floatingBtn.classList.remove('has-filters');
        });

        document.addEventListener('keydown', e => { if(e.key==='Escape' && drawer.classList.contains('is-open')) close(); });
    }

    // ── Búsqueda móvil ─────────────────────────────────────────
    function buildMobileSearch() {
        const grid = document.querySelector('#productsGrid, .products-grid');
        if (!grid || document.querySelector('.mobile-search')) return;
        const bar = document.createElement('div');
        bar.className = 'mobile-search';
        bar.innerHTML = `<input type="search" id="mobileSearchInput" placeholder="🔍 Buscar ropa, marcas..." autocomplete="off"><button id="mobileSearchBtn"><i class="fas fa-search"></i></button>`;
        grid.parentNode.insertBefore(bar, grid);
        const run = () => {
            const q = document.getElementById('mobileSearchInput').value.trim();
            const si = document.getElementById('searchInput');
            if (si) { si.value=q; document.getElementById('searchBtn')?.click(); }
            else { if(typeof currentFilters!=='undefined'){currentFilters.search=q;currentFilters.page=1;} if(typeof loadProducts==='function') loadProducts(); }
        };
        document.getElementById('mobileSearchBtn').addEventListener('click', run);
        document.getElementById('mobileSearchInput').addEventListener('keydown', e => { if(e.key==='Enter') run(); });
    }

    // ── Cart badges ────────────────────────────────────────────
    function updateCartBadges() {
        const n = getCartCount();
        [document.getElementById('headerCartBadge'), document.getElementById('bottomNavCartBadge')]
            .forEach(b => { if(!b) return; b.textContent=n>99?'99+':n; b.style.display=n>0?'flex':'none'; });
    }

    // ── Swipe to close ─────────────────────────────────────────
    function addSwipeToClose(el, overlayId, dir) {
        if (!el) return;
        let sx=0, sy=0;
        el.addEventListener('touchstart', e => { sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
        el.addEventListener('touchend', e => {
            const dx=e.changedTouches[0].clientX-sx, dy=Math.abs(e.changedTouches[0].clientY-sy);
            if (dy>80||Math.abs(dx)<60) return;
            if ((dir==='left'&&dx<-60)||(dir==='right'&&dx>60)) {
                el.classList.remove('is-open');
                document.getElementById(overlayId)?.classList.remove('is-open');
                document.getElementById('hamburgerBtn')?.classList.remove('is-open');
                document.body.style.overflow='';
            }
        }, {passive:true});
    }

    // ── Scroll to top ──────────────────────────────────────────
    function buildScrollToTop() {
        if (document.getElementById('scrollTopBtn')) return;
        const btn = document.createElement('button');
        btn.id='scrollTopBtn'; btn.setAttribute('aria-label','Volver arriba');
        btn.innerHTML='<i class="fas fa-chevron-up"></i>';
        btn.style.cssText='position:fixed;bottom:80px;right:16px;width:42px;height:42px;border-radius:50%;background:var(--primary,#2A5C6E);color:white;border:none;box-shadow:0 4px 12px rgba(0,0,0,.25);cursor:pointer;display:none;align-items:center;justify-content:center;font-size:.9rem;z-index:700;transition:all .3s;';
        document.body.appendChild(btn);
        window.addEventListener('scroll', () => { btn.style.display=window.scrollY>300?'flex':'none'; });
        btn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
    }

    // ── Init ───────────────────────────────────────────────────
    function init() {
        if (!isMobile()) return;
        
        console.log('📱 Inicializando modo móvil...');
        
        document.querySelector('.header')?.style && (document.querySelector('.header').style.display='none');
        
        buildMobileHeader();
        buildMenuDrawer();
        buildBottomNav();
        buildFiltersDrawer();
        buildMobileSearch();
        updateCartBadges();
        buildScrollToTop();
        
        // 🆕 Manejar botón "Buscar cerca de mí"
        setTimeout(() => {
            const existingBtn = document.getElementById('nearMeBtn');
            if (existingBtn) {
                // El botón HTML ya existe, solo asegurar que sea visible en móvil
                existingBtn.style.display = 'flex';
                existingBtn.style.margin = '0 auto 16px';
                console.log('✅ Botón nearMe reutilizado del HTML');
                
                // Mover el botón al contenedor correcto en móvil
                const grid = document.querySelector('#productsGrid, .products-grid');
                if (grid && grid.parentNode && existingBtn.parentNode !== grid.parentNode) {
                    // Mover el botón antes del grid
                    grid.parentNode.insertBefore(existingBtn, grid);
                    console.log('📦 Botón nearMe reposicionado antes del grid');
                }
            } else {
                console.log('📍 Botón nearMe no existe en HTML, creándolo...');
                buildNearMeButton(null);
            }
        }, 100);
        
        addSwipeToClose(document.getElementById('menuDrawer'),    'menuOverlay',    'left');
        addSwipeToClose(document.getElementById('filtersDrawer'), 'filtersOverlay', 'right');

        const _set = localStorage.setItem.bind(localStorage);
        localStorage.setItem = (k,v) => { _set(k,v); if(k==='reshop_cart') updateCartBadges(); };
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();

    let _rt;
    window.addEventListener('resize', () => { clearTimeout(_rt); _rt=setTimeout(()=>{ if(isMobile()) init(); },200); });
    window.updateMobileCartBadge = updateCartBadges;

})();