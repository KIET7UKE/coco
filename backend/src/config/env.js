export const isProd = () => process.env.NODE_ENV === 'production';

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
const REQUIRED_IN_PROD = ['CLIENT_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];

// Fails fast so the server never boots with a forgeable JWT secret or no database.
export function validateEnv() {
  const missing = [...REQUIRED, ...(isProd() ? REQUIRED_IN_PROD : [])].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (isProd() && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
}

export const jwtSecret = () => process.env.JWT_SECRET;
export const jwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

export const clientUrls = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

export const primaryClientUrl = () => clientUrls()[0];
