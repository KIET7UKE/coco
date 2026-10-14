import { rewrite } from '@vercel/functions';

// Vercel Routing Middleware: forwards same-origin /api/* to the Coco backend so the login cookie stays
// first-party. COCO_BACKEND_URL is a server-side Vercel env var (not VITE_, never shipped to the browser);
// changing it takes effect on the next deploy. Locally the Vite dev proxy does this instead.
const FALLBACK_BACKEND = 'https://coco-production-79bd.up.railway.app';

function backendOrigin() {
  const raw = (process.env.COCO_BACKEND_URL || FALLBACK_BACKEND).trim().replace(/\/+$/, '').replace(/\/api$/, '');
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
}

export default function middleware(request) {
  const { pathname, search } = new URL(request.url);
  return rewrite(`${backendOrigin()}${pathname}${search}`);
}

export const config = { matcher: '/api/:path*' };
