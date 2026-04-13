/**
================================================================================
ARCHIVO: authController.js
PROYECTO: ReShop Paraguay - Shopping Virtual de Ropa de Segunda Mano
VERSION: 4.2.0 - AGREGADO avatar_url EN RESPUESTAS
CREADO: 2026-04-09
ACTUALIZADO: 2026-04-13
RESPONSABLE: Pedro José Pirovani
PROPIETARIA: Luciana Noelia Da Silva
DESCRIPCION: Controlador de autenticacion con Supabase.
             Maneja registro, login, perfil y actualizacion de usuarios.
             REGISTRO: usa supabaseAdmin.auth.admin.createUser() para evitar rate limit.
================================================================================
HISTORIAL DE MODIFICACIONES:
2026-04-09 - Creacion inicial del controlador
2026-04-10 - [FIX] Correccion de registro para insertar automaticamente en tabla users
2026-04-10 - [FIX] Verificacion de email existente antes de registrar
2026-04-10 - [FIX] Uso de supabaseAdmin para bypass RLS en operaciones de escritura
2026-04-10 - [ADD] Sincronizacion automatica entre Auth y tabla users
2026-04-10 - [REMOVE] Eliminado password_hash (no es necesario, Supabase Auth lo maneja)
2026-04-10 - [ADD] Mensaje especifico para error de rate limit
2026-04-10 - [IMPROVE] Manejo de errores mas descriptivo
2026-04-10 - [MAJOR] REGISTRO: usa supabaseAdmin.auth.admin.createUser() en lugar de supabase.auth.signUp()
2026-04-10 - [MAJOR] Elimina completamente el rate limit de Supabase
2026-04-10 - [ADD] Email confirmado automaticamente (email_confirm: true)
2026-04-11 - [ADD] Campo document_id en getMe y updateProfile
2026-04-11 - [ADD] Campo document_id en respuesta de login
2026-04-13 - [ADD] Campo avatar_url en getMe, login y updateProfile
================================================================================
*/

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Cliente admin (bypassea RLS y rate limit)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'reshop-secret-key-2026';

// Generar token JWT
function generateToken(userId, email, role) {
    return jwt.sign(
        { sub: userId, email: email, role: role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ============================================================
// REGISTRAR NUEVO USUARIO (SIN RATE LIMIT)
// ============================================================
async function register(req, res) {
    try {
        const { email, password, full_name, phone, role, store_name } = req.body;

        // Validaciones basicas
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'Email, contraseña y nombre completo son requeridos'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe en la tabla users
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'El email ya esta registrado'
            });
        }

        // Usar supabaseAdmin.auth.admin.createUser() para evitar rate limit
        const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                role: role || 'buyer',
                phone: phone || null
            }
        });

        if (signUpError) {
            console.error('[AUTH ERROR]', signUpError);
            
            if (signUpError.message.includes('already been registered')) {
                return res.status(409).json({
                    success: false,
                    error: 'El email ya esta registrado'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: signUpError.message || 'Error al crear el usuario'
            });
        }

        if (!authUser || !authUser.user) {
            return res.status(500).json({
                success: false,
                error: 'Error al crear el usuario en el sistema de autenticación'
            });
        }

        const userRole = role === 'seller' ? 'seller' : 'buyer';
        
        // Preparar datos para insertar en tabla users
        const newUser = {
            id: authUser.user.id,
            email: email,
            full_name: full_name,
            phone: phone || null,
            role: userRole,
            store_name: (userRole === 'seller' && store_name) ? store_name : null,
            avatar_url: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Insertar en la tabla users
        const { data: insertedUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (insertError) {
            console.error('[INSERT ERROR]', insertError);
            
            try {
                await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            } catch (e) {
                console.error('[CLEANUP ERROR]', e);
            }
            
            return res.status(500).json({
                success: false,
                error: 'Error al crear el perfil de usuario. Por favor intenta nuevamente.'
            });
        }

        // Generar token
        const token = generateToken(insertedUser.id, insertedUser.email, insertedUser.role);

        // Responder con éxito
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: insertedUser.id,
                email: insertedUser.email,
                full_name: insertedUser.full_name,
                role: insertedUser.role,
                store_name: insertedUser.store_name,
                phone: insertedUser.phone,
                avatar_url: insertedUser.avatar_url
            },
            token
        });

    } catch (error) {
        console.error('[REGISTER ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor. Por favor intenta nuevamente.'
        });
    }
}

// ============================================================
// INICIAR SESION
// ============================================================
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        // Autenticar con Supabase Auth
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            return res.status(401).json({
                success: false,
                error: 'Email o contraseña incorrectos'
            });
        }

        // Buscar usuario en la tabla users (CON avatar_url)
        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, phone, document_id, address, city, role, store_name, store_description, store_logo_url, avatar_url, rating, total_sales, created_at, is_active')
            .eq('id', authData.user.id)
            .single();

        if (!user || findError) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado en la base de datos'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada. Contacta al administrador.'
            });
        }

        // Actualizar ultimo login
        await supabaseAdmin
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Generar token
        const token = generateToken(user.id, user.email, user.role);

        res.json({
            success: true,
            message: 'Inicio de sesion exitoso',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                store_name: user.store_name,
                phone: user.phone,
                document_id: user.document_id,
                avatar_url: user.avatar_url,
                rating: user.rating,
                total_sales: user.total_sales
            },
            token
        });

    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// ============================================================
// OBTENER PERFIL
// ============================================================
async function getMe(req, res) {
    try {
        const userId = req.user.sub;

        // CONSULTA CON avatar_url INCLUIDO
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, phone, document_id, address, city, role, store_name, store_description, store_logo_url, avatar_url, rating, total_sales, created_at, is_active')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                document_id: user.document_id,
                address: user.address,
                city: user.city,
                role: user.role,
                store_name: user.store_name,
                store_description: user.store_description,
                store_logo_url: user.store_logo_url,
                avatar_url: user.avatar_url,
                rating: user.rating,
                total_sales: user.total_sales,
                created_at: user.created_at,
                is_active: user.is_active
            }
        });

    } catch (error) {
        console.error('[GET_ME ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// ============================================================
// ACTUALIZAR PERFIL (CON document_id Y avatar_url)
// ============================================================
async function updateProfile(req, res) {
    try {
        const userId = req.user.sub;
        const { 
            full_name, 
            phone, 
            document_id, 
            address, 
            city, 
            store_name, 
            store_description,
            avatar_url 
        } = req.body;

        const updateData = {
            updated_at: new Date().toISOString()
        };
        
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone;
        if (document_id !== undefined) updateData.document_id = document_id;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (store_name !== undefined) updateData.store_name = store_name;
        if (store_description !== undefined) updateData.store_description = store_description;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, email, full_name, phone, document_id, address, city, role, store_name, store_description, store_logo_url, avatar_url, rating, total_sales')
            .single();

        if (error) {
            console.error('Error en updateProfile:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar el perfil'
            });
        }

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                document_id: user.document_id,
                address: user.address,
                city: user.city,
                role: user.role,
                store_name: user.store_name,
                store_description: user.store_description,
                store_logo_url: user.store_logo_url,
                avatar_url: user.avatar_url,
                rating: user.rating,
                total_sales: user.total_sales
            }
        });

    } catch (error) {
        console.error('[UPDATE_PROFILE ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

module.exports = {
    register,
    login,
    getMe,
    updateProfile
};