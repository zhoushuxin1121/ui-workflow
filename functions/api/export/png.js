// Cloudflare Pages Function: GET /api/export/png?url=...&name=...
// 代理远端图片下载（绕跨域），并加 Content-Disposition 触发浏览器下载。
// 流式转发，避免 Worker CPU 时间花在 buffer 拷贝上。

export async function onRequestGet(context) {
  const { request } = context;
  const u = new URL(request.url);
  const imageUrl = u.searchParams.get('url');
  const name = u.searchParams.get('name');

  if (!imageUrl) return json(400, { error: 'url 必填' });
  if (!isSupportedImageSource(imageUrl)) return json(400, { error: 'url 非法' });

  try {
    if (imageUrl.startsWith('data:image/')) {
      const m = imageUrl.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
      if (!m) return json(400, { error: '不支持的 data image 格式' });
      const bytes = base64ToUint8(m[1]);
      return downloadResponse(bytes, name);
    }

    const r = await fetch(imageUrl);
    if (!r.ok) return json(502, { error: `源站返回 ${r.status}` });

    const safeName = `walnut-${Date.now()}.png`;
    const utf8Name = (name || safeName) + (name?.endsWith('.png') ? '' : '.png');
    const headers = new Headers({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`,
    });
    const cl = r.headers.get('content-length');
    if (cl) headers.set('Content-Length', cl);

    return new Response(r.body, { status: 200, headers });
  } catch (e) {
    return json(500, { error: 'PNG 代理失败：' + (e?.message || e) });
  }
}

function downloadResponse(bytes, name) {
  const safeName = `walnut-${Date.now()}.png`;
  const utf8Name = (name || safeName) + (name?.endsWith('.png') ? '' : '.png');
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`,
      'Content-Length': String(bytes.length),
    },
  });
}

function base64ToUint8(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function isSupportedImageSource(src) {
  return typeof src === 'string' && (/^https?:\/\//i.test(src) || /^data:image\//i.test(src));
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
