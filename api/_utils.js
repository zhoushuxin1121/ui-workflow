export const APIMART_BASE_DEFAULT = 'https://api.apimart.ai/v1';

export function getApimartEnv() {
  return {
    key: process.env.APIMART_KEY || '',
    base: process.env.APIMART_BASE || APIMART_BASE_DEFAULT,
  };
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed);
  return sendJson(res, 405, { error: 'Method Not Allowed' });
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(text || '{}');
}

export function normalizeImageUrls(item) {
  const raw = [];
  if (Array.isArray(item?.imageUrls)) raw.push(...item.imageUrls);
  if (Array.isArray(item?.image_urls)) raw.push(...item.image_urls);
  if (Array.isArray(item?.images)) raw.push(...item.images);
  if (Array.isArray(item?.image)) raw.push(...item.image);
  else if (typeof item?.image === 'string') raw.push(item.image);
  return raw
    .filter(v => typeof v === 'string')
    .map(v => v.trim())
    .filter(v => /^data:image\//i.test(v) || /^https?:\/\//i.test(v));
}

export function isSupportedImageSource(src) {
  return typeof src === 'string' && (/^https?:\/\//i.test(src) || /^data:image\//i.test(src));
}

export async function readImageBuffer(src) {
  if (src.startsWith('data:image/')) {
    const m = src.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
    if (!m) throw new Error('不支持的 data image 格式');
    return Buffer.from(m[1], 'base64');
  }
  const r = await fetch(src);
  if (!r.ok) throw new Error(`源站返回 ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export function getQueryValue(req, key) {
  const raw = req.query?.[key];
  return Array.isArray(raw) ? raw[0] : raw;
}
