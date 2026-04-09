/**
* UBICACION: frontend/js/app.js
* PROYECTO: ReShop Paraguay
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* DESCRIPCION: Inicializacion de la aplicacion
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial
* 2026-04-09 - Corregido orden de inicializacion de funciones
*/

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar funciones de autenticacion (auth.js)
    if (typeof updateHeader === 'function') updateHeader();
    if (typeof setupLogout === 'function') setupLogout();
    
    // Inicializar funciones de productos (products.js)
    if (typeof setupFilters === 'function') setupFilters();
    if (typeof loadProducts === 'function') loadProducts();
    
    console.log('ReShop Frontend inicializado correctamente');
});