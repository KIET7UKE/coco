import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { jwtSecret } from '../config/env.js';
import { AUTH_COOKIE } from '../lib/authCookie.js';

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[AUTH_COOKIE] || null;
}

async function resolveUser(req) {
  const token = readToken(req);
  if (!token) return null;
  const decoded = jwt.verify(token, jwtSecret());
  const user = await User.findById(decoded.id);
  return user && user.status === 'active' ? user : null;
}

export async function authenticate(req, res, next) {
  let user = null;
  try {
    user = await resolveUser(req);
  } catch {
    user = null;
  }
  if (!user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Please sign in to continue' });
  }
  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Please sign in to continue' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden', message: 'You do not have access to this resource' });
    }
    next();
  };
}

export const isAdmin = (user) => user?.role === 'admin';
