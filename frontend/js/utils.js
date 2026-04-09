/**
* UBICACION: frontend/js/utils.js
* DESCRIPCION: Funciones de utilidad
*/

function formatPrice(price) {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY');
}

function getConditionText(condition) {
    const conditions = {
        'new_with_tags': 'Nuevo con etiqueta',
        'new_without_tags': 'Nuevo sin etiqueta',
        'very_good': 'Muy bueno',
        'good': 'Bueno',
        'acceptable': 'Aceptable'
    };
    return conditions[condition] || condition;
}