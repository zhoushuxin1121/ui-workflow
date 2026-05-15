// Cloudflare Pages Function: GET /api/task/:id
// 轮询 apimart 任务状态。

export async function onRequestGet(context) {
  const { env, params } = context;
  const APIMART_KEY = env.APIMART_KEY || '';
  const APIMART_BASE = env.APIMART_BASE || 'https://api.apimart.ai/v1';

  if (!APIMART_KEY) {
    return json(401, { error: 'APIMART_KEY 未配置' });
  }

  const taskId = params?.id;
  if (!taskId) return json(400, { error: 'task id 必填' });

  const r = await fetch(`${APIMART_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    headers: { 'Authorization': `Bearer ${APIMART_KEY}` },
  });
  const data = await r.json().catch(() => ({}));
  const status = data?.data?.status || data?.status || 'unknown';
  const urls = [];
  const imgs = data?.data?.result?.images || data?.result?.images || [];
  for (const img of imgs) {
    if (Array.isArray(img?.url)) urls.push(...img.url);
    else if (typeof img?.url === 'string') urls.push(img.url);
  }
  return json(200, { status, urls, raw: data });
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
