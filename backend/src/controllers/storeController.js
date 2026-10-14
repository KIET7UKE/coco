import { listProducts, getProduct } from '../services/storeService.js';
import { str } from '../lib/http.js';

export async function getStoreProducts(req, res) {
  const q = str(req.query.q, 80);
  const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
  return res.json(await listProducts({ q, page }));
}

export async function getStoreProduct(req, res) {
  const product = await getProduct(str(req.params.id, 40));
  if (!product) return res.status(404).json({ error: 'not_found', message: 'This product is no longer available' });
  return res.json({ product });
}
