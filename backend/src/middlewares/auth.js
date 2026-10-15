import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { EMAIL } from '../lib/http.js';
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

/**
 * Middleware used exclusively on the /api/admin/* routes.
 * Accepts either:
 *   a) A valid Coco JWT belonging to a user with role=admin (normal browser flow), OR
 *   b) The X-Internal-Key header matching COCO_INTERNAL_KEY env var
 *      (server-to-server call from the Hibarri backend proxy — no browser session needed).
 *
 * Using a separate named export instead of mutating authenticate() keeps the
 * two concerns explicit and testable independently.
 */
const digest = (value) => createHash('sha256').update(String(value)).digest();

function hasInternalKey(req) {
  const expected = process.env.COCO_INTERNAL_KEY;
  const given = req.headers['x-internal-key'];
  return Boolean(expected && typeof given === 'string' && timingSafeEqual(digest(given), digest(expected)));
}

export async function requireInternalOrAdmin(req, res, next) {
  // --- Machine-to-machine path ---
  if (hasInternalKey(req)) {
    // The Hibarri proxy names the signed-in superadmin so audit fields record a real person.
    const actor = String(req.headers['x-admin-email'] ?? '').trim().toLowerCase().slice(0, 200);
    req.user = { role: 'admin', email: EMAIL.test(actor) ? `hibarri:${actor}` : 'hibarri-proxy@internal', _id: null };
    return next();
  }

  // --- Normal browser / JWT path ---
  let user = null;
  try {
    user = await resolveUser(req);
  } catch {
    user = null;
  }
  if (!user) {
    return res.status(401).json({ error: 'unauthorized', message: 'Please sign in to continue' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden', message: 'Admin access required' });
  }
  req.user = user;
  next();
}
