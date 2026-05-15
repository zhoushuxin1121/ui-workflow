// Cloudflare Pages Function: POST /api/generate
// 代理调 apimart 图像生成，APIMART_KEY 由 Pages 环境变量注入。

export async function onRequestPost(context) {
  const { request, env } = context;
  const APIMART_KEY = env.APIMART_KEY || '';
  const APIMART_BASE = env.APIMART_BASE || 'https://api.apimart.ai/v1';

  if (!APIMART_KEY) {
    return json(401, { error: 'APIMART_KEY 未配置；请在 Cloudflare Pages 环境变量里设置' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'body 必须是 JSON' });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return json(400, { error: 'items 必填' });

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
      const r = await fetch(`${APIMART_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIMART_KEY}`,
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

  return json(200, { tasks });
}

function normalizeImageUrls(item) {
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

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
