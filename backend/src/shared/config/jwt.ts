import jwt from 'jsonwebtoken';
import type { JwtConfig } from '../../types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable de entorno requerida ${name} no está configurada. ` +
        `Configúrela antes de iniciar el servidor.`
    );
  }
  return value;
}

// Lazy-loaded config to allow tests to set env vars before import
let _config: JwtConfig | null = null;

function getConfig(): JwtConfig {
  if (!_config) {
    _config = {
      secret: requireEnv('JWT_SECRET'),
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    };
  }
  return _config;
}

export function generateToken(payload: object): string {
  const config = getConfig();
  return jwt.sign(payload, config.secret, { expiresIn: config.expiresIn });
}

export function generateRefreshToken(payload: object): string {
  const config = getConfig();
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
  });
}

export function verifyToken(token: string): any {
  const config = getConfig();
  try {
    return jwt.verify(token, config.secret);
  } catch {
    throw new Error('Token inválido');
  }
}

export function verifyRefreshToken(token: string): any {
  const config = getConfig();
  try {
    return jwt.verify(token, config.refreshSecret);
  } catch {
    throw new Error('Refresh token inválido');
  }
}

/** Reset cached config (for testing only) */
export function _resetConfig(): void {
  _config = null;
}
