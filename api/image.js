import {
  getQueryValue,
  isSupportedImageSource,
  methodNotAllowed,
  readImageBuffer,
  sendJson,
} from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');

  const imageUrl = getQueryValue(req, 'url');
  if (!imageUrl) return sendJson(res, 400, { error: 'url 必填' });
  if (!isSupportedImageSource(imageUrl)) return sendJson(res, 400, { error: 'url 非法' });

  try {
    const buf = await readImageBuffer(imageUrl);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (e) {
    return sendJson(res, 500, { error: '图片代理失败：' + (e?.message || e) });
  }
}
