// ==========================================================================
// 极简 Node http 服务：
//   - 静态托管前端
//   - /api/generate : 提交一组 prompt 到 apimart，返回 task_id 列表
//   - /api/task/:id : 轮询任务状态
//   - /api/health   : 检查 API key 是否注入
// 不依赖任何 npm 包；Node 18+ 自带 fetch。
// ==========================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { buildPsd } from './psd.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 简易 .env 读取（不引入 dotenv）
loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 5174);
const APIMART_KEY = process.env.APIMART_KEY || '';
const APIMART_BASE = process.env.APIMART_BASE || 'https://api.apimart.ai/v1';

if (!APIMART_KEY) {
  console.warn('⚠️  APIMART_KEY 未设置；/api/generate 会返回 401');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (u.pathname === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true, hasKey: !!APIMART_KEY, base: APIMART_BASE });
    }
    if (u.pathname === '/api/generate' && req.method === 'POST') {
      return await handleGenerate(req, res);
    }
    if (u.pathname.startsWith('/api/task/') && req.method === 'GET') {
      return await handleTask(res, decodeURIComponent(u.pathname.slice('/api/task/'.length)));
    }
    if (u.pathname === '/api/export/psd' && req.method === 'POST') {
      return await handleExportPsd(req, res);
    }
    if (u.pathname === '/api/export/png' && req.method === 'GET') {
      return await handleExportPng(res, u.searchParams.get('url'), u.searchParams.get('name'));
    }
    if (u.pathname === '/api/image' && req.method === 'GET') {
      return await handleImageProxy(res, u.searchParams.get('url'));
    }
    return serveStatic(res, u.pathname);
  } catch (err) {
    console.error('Server error:', err);
    return json(res, 500, { error: String(err?.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`▶ http://localhost:${PORT}`);
  console.log(`  apimart: ${APIMART_BASE}  key: ${APIMART_KEY ? '✓ loaded' : '✗ missing'}`);
});

// ----------------------------- 路由处理 -----------------------------

async function handleGenerate(req, res) {
  if (!APIMART_KEY) return json(res, 401, { error: 'APIMART_KEY 未配置；请把 key 写到 .env' });

  const body = await readJson(req);
  // 期望 body = { items: [{ id, prompt, model?, size? }] }
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return json(res, 400, { error: 'items 必填' });

  const tasks = await Promise.all(items.map(async (it) => {
    const payload = {
      model: it.model || 'gpt-image-2',
      prompt: it.prompt,
      size: it.size || '1:1',
      n: 1,
    };
    // 图生图：APIMart gpt-image-2 使用 image_urls，最多 16 张参考图，可混合 URL/base64
    const imageUrls = normalizeImageUrls(it).slice(0, 16);
    if (imageUrls.length) {
      payload.image_urls = imageUrls;
    }
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
      // apimart 异步：{"code":200,"data":[{"task_id":"task_xxx","status":"submitted"}]}
      const taskId = data?.data?.[0]?.task_id || data?.task_id || null;
      // 同步直返：{"data":[{"url":"..."}]} 或 b64_json
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

  return json(res, 200, { tasks });
}

async function handleExportPng(res, imageUrl, name) {
  if (!imageUrl) return json(res, 400, { error: 'url 必填' });
  if (!isSupportedImageSource(imageUrl)) return json(res, 400, { error: 'url 非法' });
  try {
    const buf = await readImageBuffer(imageUrl);
    const safeName = `walnut-${Date.now()}.png`;
    const utf8Name = (name || safeName) + (name?.endsWith('.png') ? '' : '.png');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`,
      'Content-Length': buf.length,
    });
    res.end(buf);
  } catch (e) {
    return json(res, 500, { error: 'PNG 代理失败：' + (e?.message || e) });
  }
}

async function handleImageProxy(res, imageUrl) {
  if (!imageUrl) return json(res, 400, { error: 'url 必填' });
  if (!isSupportedImageSource(imageUrl)) return json(res, 400, { error: 'url 非法' });
  try {
    const buf = await readImageBuffer(imageUrl);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Content-Length': buf.length,
    });
    res.end(buf);
  } catch (e) {
    return json(res, 500, { error: '图片代理失败：' + (e?.message || e) });
  }
}

async function handleExportPsd(req, res) {
  const body = await readJson(req);
  // body: { imageUrl, pageName, styleName, prompt, ops }
  if (!body?.imageUrl) return json(res, 400, { error: 'imageUrl 必填' });
  try {
    const buf = await buildPsd(body.imageUrl, {
      pageName: body.pageName,
      styleName: body.styleName,
      prompt: body.prompt,
      ops: body.ops,
    });
    const safeName = `walnut-${Date.now()}.psd`;
    const utf8Name = `walnut-${(body.pageName || 'card').replace(/\s+/g,'_')}-${(body.styleName || 'style').replace(/\s+/g,'_')}-${Date.now()}.psd`;
    res.writeHead(200, {
      'Content-Type': 'image/vnd.adobe.photoshop',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`,
      'Content-Length': buf.length,
    });
    res.end(Buffer.from(buf));
  } catch (e) {
    return json(res, 500, { error: 'PSD 生成失败：' + (e?.message || e) });
  }
}

async function handleTask(res, taskId) {
  if (!APIMART_KEY) return json(res, 401, { error: 'APIMART_KEY 未配置' });
  if (!taskId) return json(res, 400, { error: 'task id 必填' });
  const r = await fetch(`${APIMART_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    headers: { 'Authorization': `Bearer ${APIMART_KEY}` },
  });
  const data = await r.json().catch(() => ({}));
  // 完成态：{"data":{"status":"completed","result":{"images":[{"url":["..."]}]}}}
  const status = data?.data?.status || data?.status || 'unknown';
  let urls = [];
  const imgs = data?.data?.result?.images || data?.result?.images || [];
  for (const img of imgs) {
    if (Array.isArray(img?.url)) urls.push(...img.url);
    else if (typeof img?.url === 'string') urls.push(img.url);
  }
  return json(res, 200, { status, urls, raw: data });
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

function isSupportedImageSource(src) {
  return typeof src === 'string' && (/^https?:\/\//i.test(src) || /^data:image\//i.test(src));
}

async function readImageBuffer(src) {
  if (src.startsWith('data:image/')) {
    const m = src.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
    if (!m) throw new Error('不支持的 data image 格式');
    return Buffer.from(m[1], 'base64');
  }
  const r = await fetch(src);
  if (!r.ok) throw new Error(`源站返回 ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// ----------------------------- 静态文件 -----------------------------

function serveStatic(res, pathname) {
  const filePath = path.resolve(pathname === '/'
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, pathname));
  const rel = path.relative(__dirname, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403); return res.end('forbidden');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ----------------------------- 工具 -----------------------------

function json(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
