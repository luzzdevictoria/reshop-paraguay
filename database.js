/**
* UBICACION: C:\Users\pirov\ReShop\backend\database.js
* CREADO: 2026-04-09
* ACTUALIZADO: 2026-04-09
* VERSION: 1.0.0
* DESCRIPCION: Cliente de Supabase configurado para conectar la base de datos
* con el backend de ReShop Paraguay. Exporta el cliente listo para usar
* en toda la aplicacion.
* 
* RESPONSABLE: Pedro José Pirovani
* PROPIETARIA: Luciana Noelia Da Silva
* PROYECTO: ReShop Paraguay - Shopping Virtual de Ropa de Segunda Mano
* 
* HISTORIAL DE MODIFICACIONES:
* 2026-04-09 - Creacion inicial del cliente Supabase
* 2026-04-09 - Configuracion con variables de entorno
*/

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Validar que las variables de entorno existan
if (!process.env.SUPABASE_URL) {
    console.error('[ERROR] SUPABASE_URL no esta definida en el archivo .env');
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ERROR] SUPABASE_SERVICE_ROLE_KEY no esta definida en el archivo .env');
    process.exit(1);
}

// Configuracion del cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Cliente con SERVICE_ROLE_KEY (para backend - tiene permisos completos)
// ⚠️ Este cliente solo debe usarse en el backend, NUNCA en el frontend
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Cliente con ANON_KEY (para operaciones que respetan RLS)
// Este se puede usar para consultas que no requieren privilegios de admin
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Exportar ambos clientes
module.exports = {
    supabaseAdmin,    // Para operaciones administrativas (CRUD completo)
    supabaseClient,   // Para operaciones que respetan RLS
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceKey
};

// Log de confirmacion (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    console.log('[DATABASE] Supabase cliente inicializado correctamente');
    console.log(`[DATABASE] URL: ${supabaseUrl}`);
    console.log('[DATABASE] Modo: Administrador (service_role)');
}