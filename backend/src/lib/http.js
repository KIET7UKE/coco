export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.expose = status < 500;
  }
}

// Coerces untrusted input to a trimmed string so objects like {"$gt": ""} never reach a query.
export const str = (value, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const REFERENCE = /^CC-[A-Z0-9]{4,16}$/;
