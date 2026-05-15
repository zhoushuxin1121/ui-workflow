import {
  getApimartEnv,
  methodNotAllowed,
  normalizeImageUrls,
  readJsonBody,
  sendJson,
} from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');

  const { key, base } = getApimartEnv();
  if (!key) return sendJson(res, 401, { error: 'APIMART_KEY 未配置；请在 Vercel 环境变量里设置' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'body 必须是 JSON' });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return sendJson(res, 400, { error: 'items 必填' });

  const tasks = await Promise.all(items.map(async (it) => {
    const payload = {
      model: it.model || 'gpt-image-2',
      prompt: it.prompt,
      size: it.size || '1:1',
      n: 1,
    };
    const imageUrls = normalizeImageUrls(it).slice(0, 16);
    if (imageUrls.length) payload.image_urls = imageUrls;

    try {
      const r = await fetch(`${base}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      const taskId = data?.data?.[0]?.task_id || data?.task_id || null;
      const directUrl = data?.data?.[0]?.url || null;
      const b64 = data?.data?.[0]?.b64_json || null;
      return {
        id: it.id,
        ok: r.ok,
        taskId,
        directUrl,
        b64,
        status: data?.data?.[0]?.status || (r.ok ? 'submitted' : 'error'),
        raw: r.ok ? null : data,
      };
    } catch (e) {
      return { id: it.id, ok: false, error: String(e?.message || e) };
    }
  }));

  return sendJson(res, 200, { tasks });
}
