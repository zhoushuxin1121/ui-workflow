import { getApimartEnv, methodNotAllowed, sendJson } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');

  const { key, base } = getApimartEnv();
  if (!key) return sendJson(res, 401, { error: 'APIMART_KEY 未配置' });

  const taskId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!taskId) return sendJson(res, 400, { error: 'task id 必填' });

  const r = await fetch(`${base}/tasks/${encodeURIComponent(taskId)}`, {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  const data = await r.json().catch(() => ({}));
  const status = data?.data?.status || data?.status || 'unknown';
  let urls = [];
  const imgs = data?.data?.result?.images || data?.result?.images || [];
  for (const img of imgs) {
    if (Array.isArray(img?.url)) urls.push(...img.url);
    else if (typeof img?.url === 'string') urls.push(img.url);
  }
  return sendJson(res, 200, { status, urls, raw: data });
}
