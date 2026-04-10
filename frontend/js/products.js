/**
* UBICACION: frontend/js/products.js
* DESCRIPCION: Gestion de productos y filtros
*/

let currentFilters = {
    page: 1,
    limit: 20,
    category: '',
    size: '',
    condition: '',
    min_price: '',
    max_price: '',
    search: ''
};

async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    try {
        const queryParams = new URLSearchParams();
        if (currentFilters.category) queryParams.append('category', currentFilters.category);
        if (currentFilters.size) queryParams.append('size', currentFilters.size);
        if (currentFilters.condition) queryParams.append('condition', currentFilters.condition);
        if (currentFilters.min_price) queryParams.append('min_price', currentFilters.min_price);
        if (currentFilters.max_price) queryParams.append('max_price', currentFilters.max_price);
        if (currentFilters.search) queryParams.append('search', currentFilters.search);
        queryParams.append('page', currentFilters.page);
        queryParams.append('limit', currentFilters.limit);
        
        const data = await apiRequest(`/products?${queryParams.toString()}`);
        
        if (data.products && data.products.length > 0) {
            renderProducts(data.products);
        } else {
            productsGrid.innerHTML = '<div class="loading">No se encontraron productos</div>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<div class="loading">Error al cargar productos</div>';
    }
}

function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-card__image">
                <img src="${product.images_urls && product.images_urls[0] ₲ product.images_urls[0] : 'https://placehold.co/300x200?text=Sin+Imagen'}" 
                     alt="${product.title}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div class="product-card__content">
                <h3 class="product-card__title">${product.title}</h3>
                <p class="product-card__price">${formatPrice(product.price)}</p>
                <p class="product-card__seller">${product.seller?.store_name || product.seller?.full_name || 'Vendedor'}</p>
                <span class="product-card__condition">${getConditionText(product.condition)}</span>
                <button class="btn btn-primary product-card__button" onclick="viewProduct(${product.id})">Ver producto</button>
            </div>
        </div>
    `).join('');
}

function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function setupFilters() {
    const filterCategory = document.getElementById('filterCategory');
    const filterSize = document.getElementById('filterSize');
    const filterCondition = document.getElementById('filterCondition');
    const filterMinPrice = document.getElementById('filterMinPrice');
    const filterMaxPrice = document.getElementById('filterMaxPrice');
    const applyFilters = document.getElementById('applyFilters');
    const clearFilters = document.getElementById('clearFilters');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    applyFilters.addEventListener('click', () => {
        currentFilters.category = filterCategory.value;
        currentFilters.size = filterSize.value;
        currentFilters.condition = filterCondition.value;
        currentFilters.min_price = filterMinPrice.value;
        currentFilters.max_price = filterMaxPrice.value;
        currentFilters.page = 1;
        loadProducts();
    });
    
    clearFilters.addEventListener('click', () => {
        filterCategory.value = '';
        filterSize.value = '';
        filterCondition.value = '';
        filterMinPrice.value = '';
        filterMaxPrice.value = '';
        searchInput.value = '';
        currentFilters = {
            page: 1,
            limit: 20,
            category: '',
            size: '',
            condition: '',
            min_price: '',
            max_price: '',
            search: ''
        };
        loadProducts();
    });
    
    searchBtn.addEventListener('click', () => {
        currentFilters.search = searchInput.value;
        currentFilters.page = 1;
        loadProducts();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.search = searchInput.value;
            currentFilters.page = 1;
            loadProducts();
        }
    });
}