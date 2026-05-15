import {
  getQueryValue,
  isSupportedImageSource,
  methodNotAllowed,
  readImageBuffer,
  sendJson,
} from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');

  const imageUrl = getQueryValue(req, 'url');
  const name = getQueryValue(req, 'name');
  if (!imageUrl) return sendJson(res, 400, { error: 'url 必填' });
  if (!isSupportedImageSource(imageUrl)) return sendJson(res, 400, { error: 'url 非法' });

  try {
    const buf = await readImageBuffer(imageUrl);
    const safeName = `walnut-${Date.now()}.png`;
    const utf8Name = (name || safeName) + (name?.endsWith('.png') ? '' : '.png');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (e) {
    return sendJson(res, 500, { error: 'PNG 代理失败：' + (e?.message || e) });
  }
}
