// Cloudflare Pages Function: GET /api/health
// 前端启动时调用，确认环境变量是否注入正确。

export async function onRequestGet(context) {
  const APIMART_KEY = context.env.APIMART_KEY || '';
  const APIMART_BASE = context.env.APIMART_BASE || 'https://api.apimart.ai/v1';
  return new Response(
    JSON.stringify({ ok: true, hasKey: !!APIMART_KEY, base: APIMART_BASE }),
    { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
}
