const jwt = require('jsonwebtoken');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable de entorno requerida ${name} no está configurada. ` +
        `Configúrela antes de iniciar el servidor.`
    );
  }
  return value;
}

// SECURITY FIX: No default secret keys - must be set via environment variables
const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateToken = payload => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = payload => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

const verifyToken = token => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
};

const verifyRefreshToken = token => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
