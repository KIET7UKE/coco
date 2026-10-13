/* Calls the Coco backend. Requests stay same-origin (Vite proxy in dev, Vercel rewrite in
   production) so the httpOnly session cookie is first-party and sent automatically. */
export class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || `Request failed (${status})`);
    this.status = status;
    this.code = data?.error || 'unknown';
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, { error: 'network_error', message: 'Could not reach the server. Check your connection and try again.' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// Only same-site paths, so a crafted ?next= can't send someone to another domain after login.
export function safeNext(value, fallback = '/dashboard') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback;
}
