# CoCo backend

Express + MongoDB API for accounts, orders, Stripe checkout, server provisioning and the partner dashboard.
The frontend calls it on the same origin at `/api` (Vite dev proxy locally, `frontend/middleware.js` on Vercel),
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
3. In the Vercel project, set `COCO_BACKEND_URL` to the backend's URL (e.g. `https://coco-production-79bd.up.railway.app`)
   and redeploy the frontend. The Vercel project's Root Directory must be `frontend`, otherwise `middleware.js` is ignored.
   `CLIENT_URL` must be the public site (e.g. `https://coco.hibarri.com`); its first entry is used in Stripe return links and emails.
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

## Store (`/store`)

`GET /api/store/products?q=&page=` lists servers from the first supplier that answers:

1. **Ingram Micro Xvantage**: set `INGRAM_CLIENT_ID`, `INGRAM_CLIENT_SECRET` and `INGRAM_CUSTOMER_NUMBER`
   (from developer.ingrammicro.com). Use `INGRAM_API_BASE=https://api.ingrammicro.com:443/sandbox` while testing.
2. **TD SYNNEX** (backup): set the `TDSYNNEX_*` variables with the URLs and credentials TD SYNNEX issues.
   Confirm the field mapping in `src/services/suppliers/tdsynnex.js` against their docs once access is granted.
3. Neither configured or both failing: the built-in sample catalog.

Lists are cached for 10 minutes. A product can be bought online only when its price is in USD and its rack
units and cores can be read from the description; otherwise the card offers "Request a quote". At checkout the
price is fetched live from the supplier again (store IDs start with `im-` or `td-`), and the order records the
supplier, SKU and cost so procurement knows exactly what to buy.

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
