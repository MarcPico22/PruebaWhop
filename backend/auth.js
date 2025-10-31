const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createUser, getUserByEmail } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiame-en-produccion';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

/**
 * Registra un nuevo usuario
 */
async function register(email, password, companyName) {
  // Verificar si el usuario ya existe
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    throw new Error('El email ya está registrado');
  }
  
  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Generar tenant_id único
  const tenantId = uuidv4();
  
  // Crear usuario
  const user = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    company_name: companyName,
    tenant_id: tenantId
  };
  
  createUser(user);
  
  // Retornar usuario sin password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Inicia sesión de un usuario
 */
async function login(email, password) {
  // Buscar usuario
  const user = getUserByEmail(email);
  if (!user) {
    console.log(`❌ Login failed: User not found for email ${email}`);
    throw new Error('Credenciales inválidas');
  }
  
  console.log(`🔍 Login attempt for ${email}`);
  console.log(`   Stored password hash: ${user.password.substring(0, 20)}...`);
  console.log(`   Provided password: ${password}`);
  
  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password);
  console.log(`   Password valid: ${isValidPassword}`);
  
  if (!isValidPassword) {
    console.log(`❌ Login failed: Invalid password for ${email}`);
    throw new Error('Credenciales inválidas');
  }
  
  // Generar JWT
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      tenantId: user.tenant_id 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  // Retornar token y datos de usuario
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      company_name: user.company_name,
      tenant_id: user.tenant_id
    }
  };
}

/**
 * Middleware de autenticación para proteger rutas
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    // Agregar información del usuario al request
    req.user = user;
    next();
  });
}

/**
 * Verifica un token sin proteger la ruta
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  register,
  login,
  authenticateToken,
  verifyToken
};
