/**
* UBICACION: C:\Users\pirov\ReShop\src\controllers\authController.js
* VERSION: 2.0.0 - CORREGIDO
* DESCRIPCION: Controlador de autenticacion con Supabase
*/

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

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

// Registrar nuevo usuario
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

        // Verificar si el email ya existe
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

        // Hashear contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Crear usuario en Supabase Auth
        const { data: authUser, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, role: role || 'buyer' }
            }
        });

        if (signUpError) {
            console.error('[AUTH ERROR]', signUpError);
            return res.status(500).json({
                success: false,
                error: signUpError.message
            });
        }

        const userRole = role === 'seller' ? 'seller' : 'buyer';
        
        const newUser = {
            id: authUser.user.id,
            email,
            full_name,
            phone: phone || null,
            role: userRole,
            password_hash,
            store_name: userRole === 'seller' ? store_name || null : null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: user, error: insertError } = await supabaseAdmin
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (insertError) {
            console.error('[INSERT ERROR]', insertError);
            return res.status(500).json({
                success: false,
                error: 'Error al crear el usuario'
            });
        }

        // Generar token
        const token = generateToken(user.id, user.email, user.role);

        // Ocultar datos sensibles
        delete user.password_hash;

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                store_name: user.store_name
            },
            token
        });

    } catch (error) {
        console.error('[REGISTER ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor: ' + error.message
        });
    }
}

// Iniciar sesion
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

        // Buscar usuario en nuestra tabla
        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado en la base de datos'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: 'Cuenta desactivada'
            });
        }

        // Actualizar ultimo login
        await supabaseAdmin
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Generar token
        const token = generateToken(user.id, user.email, user.role);

        // Ocultar datos sensibles
        delete user.password_hash;

        res.json({
            success: true,
            message: 'Inicio de sesion exitoso',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                store_name: user.store_name,
                rating: user.rating,
                total_sales: user.total_sales
            },
            token
        });

    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor: ' + error.message
        });
    }
}

// Obtener perfil del usuario autenticado
async function getMe(req, res) {
    try {
        const userId = req.user.sub;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, phone, address, city, role, store_name, store_description, store_logo_url, rating, total_sales, created_at, is_active')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        delete user.password_hash;

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('[GET_ME ERROR]', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Actualizar perfil
async function updateProfile(req, res) {
    try {
        const userId = req.user.sub;
        const { full_name, phone, address, city, store_name, store_description } = req.body;

        const updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (city) updateData.city = city;
        if (store_name) updateData.store_name = store_name;
        if (store_description) updateData.store_description = store_description;
        updateData.updated_at = new Date().toISOString();

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar el perfil'
            });
        }

        delete user.password_hash;

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                address: user.address,
                city: user.city,
                role: user.role,
                store_name: user.store_name,
                store_description: user.store_description
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