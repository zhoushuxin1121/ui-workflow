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
// 看图给优化建议用的多模态 chat 模型（OpenAI 兼容，走 APIMart）
const CRITIQUE_MODEL = process.env.CRITIQUE_MODEL || 'gpt-4o-mini';
// 抽卡：在所选风格下演绎一组设计规则用的文本模型（走 MiniMax）
const MINIMAX_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE = process.env.MINIMAX_BASE || 'https://api.minimaxi.com/v1';
const STYLE_MODEL = process.env.STYLE_MODEL || 'MiniMax-Text-01';

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
    if (u.pathname === '/api/critique' && req.method === 'POST') {
      return await handleCritique(req, res);
    }
    if (u.pathname === '/api/draw-style' && req.method === 'POST') {
      return await handleDrawStyle(req, res);
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

// AI 看图给优化建议：把已生成的图 + 约束喂给多模态模型，返回大白话建议
async function handleCritique(req, res) {
  if (!APIMART_KEY) return json(res, 401, { error: 'APIMART_KEY 未配置' });
  const body = await readJson(req);
  const imageUrl = body?.imageUrl;
  const ctx = body?.ctx || {};
  if (!imageUrl || !isSupportedImageSource(imageUrl)) {
    return json(res, 200, { ok: false, error: 'imageUrl 缺失或非法', suggestions: [] });
  }

  // 服务端把图转成 base64 data URL 再喂给视觉模型，避免源站 URL 不可达 / 过期
  let visionUrl = imageUrl;
  if (/^https?:/i.test(imageUrl)) {
    try {
      const buf = await readImageBuffer(imageUrl);
      visionUrl = `data:image/png;base64,${buf.toString('base64')}`;
    } catch { /* 取不到就退回原始 URL，让模型自己抓 */ }
  }

  const sys = buildCritiqueSystemPrompt(ctx);
  try {
    const r = await fetch(`${APIMART_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${APIMART_KEY}` },
      body: JSON.stringify({
        model: CRITIQUE_MODEL,
        stream: false,
        max_tokens: 800,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: [
            { type: 'text', text: '看这张图，严格按系统要求只输出 JSON。' },
            { type: 'image_url', image_url: { url: visionUrl } },
          ] },
        ],
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('critique error:', JSON.stringify(data).slice(0, 300));
      return json(res, 200, { ok: false, error: JSON.stringify(data).slice(0, 300), suggestions: [] });
    }
    const content = data?.choices?.[0]?.message?.content || '';
    let parsed = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const suggestions = (Array.isArray(parsed?.suggestions) ? parsed.suggestions : [])
      .filter(s => s && (s.label || s.addon))
      .slice(0, 4)
      .map(s => ({ label: String(s.label || '').trim(), why: String(s.why || '').trim(), addon: String(s.addon || '').trim() }));
    return json(res, 200, { ok: true, suggestions });
  } catch (e) {
    console.error('critique exception:', e?.message || e);
    return json(res, 200, { ok: false, error: String(e?.message || e), suggestions: [] });
  }
}

function buildCritiqueSystemPrompt(c = {}) {
  const sl = c.styleLock || {};
  return [
    '你是核桃编程的资深活动物料视觉设计师。下面会给你一张已经生成好的活动物料图，请你以专业设计师的眼光挑刺并给优化建议。',
    '',
    `这张图是【${c.pageName || '活动物料'}】，它的页面结构是：${c.structure || ''}。`,
    '它必须遵守的视觉方向规则（这些是基调，不要建议推翻）：',
    `- 背景氛围：${sl.background || ''}`,
    `- 标题字效：${sl.titleEffect || ''}`,
    `- 配色：${sl.color || ''}`,
    `- 按钮样式：${sl.button || ''}`,
    `- 奖品摆位：${sl.prizeLayout || ''}`,
    `- 装饰：${sl.decoration || ''}`,
    c.title ? `锁定不可改的标题文案：「${c.title}」` : '',
    c.cta ? `锁定不可改的 CTA 文案：「${c.cta}」` : '',
    c.taboos ? `禁忌（不能出现的东西）：${c.taboos}` : '',
    c.intent ? `这次活动的业务目标 / 背景：${c.intent}` : '',
    '',
    '你的任务：只针对【这张图实际看到的样子】，挑出 2-4 个最值得优化的视觉点。',
    '硬性要求：',
    '1. 必须基于这张图真实的画面来判断——颜色对不对、标题/奖品/按钮够不够突出、构图挤不挤、文字清不清楚、第一眼抓不抓人。不同的图要给不同的建议，绝对禁止套用通用模板或千篇一律。',
    '2. 每条建议用运营听得懂的大白话，像跟同事聊天那样，禁止专业术语（不要出现"视觉层级""饱和度""对比度"这类词）。',
    '3. 只动视觉表现（突出度、构图、留白、配色协调、氛围），绝对不要建议修改锁定的标题/CTA 文案、页面结构、品牌色。',
    '4. 每条都要配一个能直接追加到英文生图 prompt 的英文片段 addon。addon 必须是针对【这一条建议】的具体英文描述，每条都不一样（描述你想要的视觉改变），结尾统一加上 "keep the exact Chinese copy, page structure and brand colors unchanged"。',
    '5. 如果这张图确实已经挺好、没明显问题，就少给几条甚至返回空数组，不要硬凑。',
    '',
    '严格只输出 JSON，不要任何多余文字。下面只是【格式示例】，请根据你对真实图片的判断生成内容，绝对不要照抄示例里的文字（尤其 addon 必须自己写具体内容，不能原样复制示例）：',
    '{"suggestions":[{"label":"标题被花哨的背景吃掉了，建议给标题加深色描边和阴影让它更跳","why":"现在标题和背景撞色，第一眼抓不住","addon":"add a bold dark outline and drop shadow to the main title so it clearly stands out from the busy background; keep the exact Chinese copy, page structure and brand colors unchanged"}]}',
  ].filter(Boolean).join('\n');
}

// 抽卡：在所选风格下，让 MiniMax 演绎出一组"贴合该风格但有新意"的 6 条设计规则
async function handleDrawStyle(req, res) {
  if (!MINIMAX_KEY) return json(res, 200, { ok: false, error: 'MINIMAX_API_KEY 未配置', rules: null });
  const body = await readJson(req);
  const direction = body?.direction || {};
  const angle = String(body?.angle || '').trim();
  const nonce = String(body?.nonce || '').trim();
  if (!direction?.name) return json(res, 200, { ok: false, error: '缺少风格方向', rules: null });

  const sys = buildDrawSystemPrompt(direction, body?.ctx || {});
  const userMsg = [
    `请在「${direction.name}」这个风格下，抽一张和默认 / 套路不同的设计语言卡。`,
    angle ? `本次演绎请重点在【${angle}】上做出新意（其它维度也要协调，但这块要明显有变化）。` : '',
    `抽卡随机标记：${nonce}（仅用于保证这次和上一次不一样，不要写进输出）。`,
  ].filter(Boolean).join('\n');

  try {
    const r = await fetch(`${MINIMAX_BASE}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MINIMAX_KEY}` },
      body: JSON.stringify({
        model: STYLE_MODEL,
        temperature: 0.95,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userMsg },
        ],
      }),
    });
    const data = await r.json().catch(() => ({}));
    const code = data?.base_resp?.status_code;
    if (code !== 0 && code !== undefined && !data?.choices?.length) {
      console.error('draw-style error:', data?.base_resp?.status_msg);
      return json(res, 200, { ok: false, error: data?.base_resp?.status_msg || 'MiniMax 返回异常', rules: null });
    }
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = parseDrawJson(content);
    if (!parsed) return json(res, 200, { ok: false, error: '解析规则失败', rules: null, raw: content.slice(0, 200) });
    return json(res, 200, { ok: true, rules: parsed.rules, vibe: parsed.vibe });
  } catch (e) {
    console.error('draw-style exception:', e?.message || e);
    return json(res, 200, { ok: false, error: String(e?.message || e), rules: null });
  }
}

// 从模型返回里抠出 6 条规则 + 卡名（容错：去 markdown 围栏、截取首尾大括号）
function parseDrawJson(text) {
  if (!text) return null;
  const t = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < 0 || b <= a) return null;
  let obj;
  try { obj = JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  const fields = ['background', 'titleEffect', 'color', 'button', 'prizeLayout', 'decoration'];
  const rules = {};
  let any = false;
  for (const f of fields) {
    if (typeof obj[f] === 'string' && obj[f].trim()) { rules[f] = obj[f].trim(); any = true; }
  }
  if (!any) return null;
  const vibe = (typeof obj.vibe === 'string' && obj.vibe.trim()) ? obj.vibe.trim().slice(0, 20) : '';
  return { rules, vibe };
}

function buildDrawSystemPrompt(direction = {}, c = {}) {
  const spec = c.spec || {};
  const base = direction.baseRules || {};
  return [
    '你是核桃编程的资深活动物料视觉设计师。运营已经选定了一个视觉风格，你要在这个风格的"气质"之内，演绎出一组【具体而有新意】的设计语言（6 条规则），供后续 AI 生图使用。这是"抽卡"——同一个风格每次抽都应该给出明显不同的演绎。',
    '',
    `选定风格：「${direction.name}」。这个风格的定位：${direction.operatorIntent || ''}`,
    '这个风格的默认基线（仅供你理解它的气质，不要照抄，要给出和它明显不同的新演绎）：',
    `- 背景：${base.background || ''}`,
    `- 标题字效：${base.titleEffect || ''}`,
    `- 配色：${base.color || ''}`,
    `- 按钮：${base.button || ''}`,
    `- 奖品摆位：${base.prizeLayout || ''}`,
    `- 装饰：${base.decoration || ''}`,
    '',
    `品牌色锚点：核桃橙 ${spec.primary || '#FF5A1F'} + 高亮黄 ${spec.accent || '#FFD84A'}（保留品牌识别，但可以变化用法/比例/搭配）。`,
    c.taboos ? `禁忌（不能出现）：${c.taboos}` : '',
    c.pages ? `这套物料包含页面：${c.pages}（规则要适配整套，不针对单页）。` : '',
    '',
    '要求：',
    '1. 必须仍然是「' + (direction.name || '该风格') + '」这个风格该有的气质，不要跑题成别的风格。',
    '2. 但要给出和默认基线、和常规套路明显不同的【新演绎】：换个具体场景、换种字效处理、换种构图/装饰节奏都可以。每次抽卡都要不一样。',
    '3. 6 条规则每条都要具体到可执行（背景画什么场景氛围、标题什么字效、配色怎么搭、按钮什么质感、奖品怎么摆、装饰用什么元素），不要空泛套话。',
    '4. 只描述视觉风格，绝不要写具体文案 / 标题文字（文案是另外填的）。守住品牌色和禁忌。',
    '5. 起一个 4-10 字的中文卡名 vibe，概括这次演绎的特点（如"暖阳客厅版""手账拼贴版"）。全部用中文。',
    '',
    '严格只输出 JSON，不要任何多余文字、不要 markdown 围栏：',
    '{"vibe":"卡名","background":"背景氛围","titleEffect":"标题字效","color":"配色倾向","button":"按钮样式","prizeLayout":"奖品摆位","decoration":"装饰元素"}',
  ].filter(Boolean).join('\n');
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
