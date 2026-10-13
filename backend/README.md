# CoCo backend

Express + MongoDB API for accounts, orders, Stripe checkout, server provisioning and the partner dashboard.
The frontend calls it on the same origin at `/api` (Vite dev proxy locally, `frontend/vercel.json` rewrite in production),
so the httpOnly session cookie works without CORS credentials.

## Run locally

```bash
cp .env.example .env   # set MONGODB_URI and JWT_SECRET at minimum
npm install
npm run dev            # http://localhost:5001, frontend dev server proxies /api here
```

## Deploy

1. Host this folder on any Node 20+ host (Render, Railway, Fly, a VM). Start command: `npm start`.
2. Set the variables from `.env.example` on the host. In production the server refuses to start without
   `MONGODB_URI`, `JWT_SECRET` (32+ chars), `CLIENT_URL`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
   Set `NODE_ENV=production` so cookies are `Secure`.
3. In `frontend/vercel.json`, replace `REPLACE-WITH-BACKEND-HOST` with the backend's host name and redeploy the frontend.
4. In Stripe > Developers > Webhooks, add `https://<your-site>/api/webhook/stripe` with the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   and `checkout.session.expired`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Create the first admin: `npm run create-admin -- you@hibarri.com '<password, 12+ chars>' Your Name`.

## How an order becomes a server

1. A signed-in user checks out (`POST /api/checkout` for card, `POST /api/checkout/wire` for wire).
   The server prices the selection, generates the `CC-…` reference and stores the order against the account.
2. Card: Stripe's webhook (or the return page) confirms payment. Wire: an admin marks the order paid.
3. Fulfilment creates one server per unit, tagged with the chosen data center and ship-to address, and the
   buyer becomes a Cloud Partner. The servers appear in their dashboard immediately with status `Ordered`.
4. Admins move each server through `Procuring → Shipping → Racking → Provisioning → Online` and record
   usage and revenue; the dashboard shows exactly what is stored.

## Admin API

All routes need an admin session (sign in at `/api/auth/login`; the cookie is sent automatically in a browser).

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/admin/orders?status=&method=` | |
| POST | `/api/admin/orders/:reference/mark-paid` | `{ "note": "Wire received 13 Oct" }` |
| POST | `/api/admin/orders/:reference/cancel` | `{ "reason": "..." }` |
| POST | `/api/admin/orders/:reference/assign` | `{ "email": "buyer@company.com" }` links an order placed before accounts existed |
| GET | `/api/admin/servers?status=` | |
| PATCH | `/api/admin/servers/:serial` | any of `status`, `statusNote`, `cpuUtil`, `ramUtil`, `storageUtil`, `networkUtil`, `gpuUtil`, `uptime`, `customers`, `allocatedVcpu`, `allocatedRamGb`, `revenue`, `revenueToDate`, `load`, `alert: { level, title, detail }` |
| GET | `/api/admin/users?role=` | |

Server utilization on the dashboard is `allocatedVcpu / total vCPU`. Payouts are this month's `revenue` minus
CoCo's 20% fee; rack space is prepaid for 24 months, so nothing else is deducted.
