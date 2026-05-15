import { buildPsd } from '../../psd.js';
import { methodNotAllowed, readJsonBody, sendJson } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'body 必须是 JSON' });
  }

  if (!body?.imageUrl) return sendJson(res, 400, { error: 'imageUrl 必填' });
  try {
    const buf = await buildPsd(body.imageUrl, {
      pageName: body.pageName,
      styleName: body.styleName,
      prompt: body.prompt,
      ops: body.ops,
    });
    const safeName = `walnut-${Date.now()}.psd`;
    const utf8Name = `walnut-${(body.pageName || 'card').replace(/\s+/g, '_')}-${(body.styleName || 'style').replace(/\s+/g, '_')}-${Date.now()}.psd`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/vnd.adobe.photoshop');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`);
    res.setHeader('Content-Length', buf.length);
    res.end(Buffer.from(buf));
  } catch (e) {
    return sendJson(res, 500, { error: 'PSD 生成失败：' + (e?.message || e) });
  }
}
