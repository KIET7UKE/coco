import jwt from 'jsonwebtoken';
import { isProd } from '../config/env.js';

export const AUTH_COOKIE = 'coco_token';

const baseOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: 'lax',
  path: '/',
});

export function setAuthCookie(res, token) {
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...baseOptions(), maxAge: exp * 1000 - Date.now() });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, baseOptions());
}
