/**
 * ARCHIVO: database.js
 * PROYECTO: ReShop Paraguay
 * DESCRIPCION: Configuración centralizada de conexión a Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Validar variables de entorno
if (!process.env.SUPABASE_URL) {
    console.error('❌ ERROR: SUPABASE_URL no está definida en .env');
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está definida en .env');
    process.exit(1);
}

// Cliente público (para operaciones que no requieren bypass RLS)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Cliente admin (bypassea RLS, requiere SERVICE_ROLE_KEY)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('✅ Supabase configurado correctamente');

module.exports = {
    supabase,
    supabaseAdmin
};