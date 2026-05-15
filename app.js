import {
  activityTemplate, pages, styles, fontStyles,
  keyQuestions, optimizationOptions,
  defaultDesignSpec, defaultOps, modelRouting,
} from './data.js';
import {
  buildPrompt, summarizePrdInfo, buildOptimizedPrompt,
  suggestOptimizations, pageSizeHint,
} from './prompts.js';
import { writePsdBuffer } from 'https://esm.sh/ag-psd@30.1.1?bundle';

const PSD_LAYER_NAMES = [
  '01 Background',
  '02 Brand Logo',
  '03 Title Text',
  '04 Title Stroke / Decoration',
  '05 Hero Visual',
  '06 Prize Assets',
  '07 Step Panel',
  '08 Step Text',
  '09 CTA',
  '10 QR Placeholder',
  '11 Decorations',
];

// ==========================================================================
// State
// ==========================================================================

const state = {
  pages: new Set(['mini-card', 'promo-poster']),
  styles: new Set(['comic-show-off', 'prize-stack']),
  fontStyle: 'default-walnut',   // v0：单一字体作用全图
  fontCustom: '',                // 自定义字体描述（仅 fontStyle === 'custom' 时用）
  prdRaw: '',
  prdAnswers: {},
  refs: [],                      // [{ name, dataUrl }]
  special: '',
  designSpecText: '',
  ops: structuredClone(defaultOps),
  results: [],                   // [{ id, pageId, styleId, prompt, status, url, optSelected:Set, optText, history:[{prompt,url}] }]
};

// ==========================================================================
// DOM helpers
// ==========================================================================

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === false || v == null) continue;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
};

function setStatus(text, level = '') {
  const node = $('#genStatus');
  node.textContent = text;
  node.className = 'status' + (level ? ' ' + level : '');
}

// ==========================================================================
// Render: Step 1 / activity
// ==========================================================================

function renderActivityInfo() {
  const t = activityTemplate;
  $('#activityInfo').innerHTML = '';
  $('#activityInfo').append(
    el('p', { style: 'margin:0 0 6px;' }, `心智：${t.mindset}`),
    el('div', { class: 'eyebrow', style: 'margin-bottom:4px;' }, '玩法'),
    el('ul', {}, t.flow.map((s) => el('li', {}, s))),
  );
}

// ==========================================================================
// Render: Step 2 / pages
// ==========================================================================

function renderPageChecks() {
  const box = $('#pageChecks');
  box.innerHTML = '';
  for (const p of Object.values(pages)) {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state.pages.has(p.id);
    cb.addEventListener('change', () => {
      if (cb.checked) state.pages.add(p.id); else state.pages.delete(p.id);
      updateGenButton();
    });
    box.append(el('label', {}, [
      cb,
      el('div', {}, [
        el('div', { class: 'name' }, `${p.name} (${p.aspect})`),
        el('div', { class: 'meta' }, p.use),
      ]),
    ]));
  }
}

// ==========================================================================
// Render: Step 3 / 运营基础字段
// ==========================================================================

const opsBasicFields = [
  { key: 'activityName',    label: '活动名称',  full: true, hint: '会被填进参考图固定 prompt 的 "xxxxx" 位置' },
  { key: 'miniCardTitle',   label: '小程序卡片主标题' },
  { key: 'miniCardCTA',     label: '小程序卡片 CTA' },
  { key: 'posterTitleMain', label: '海报主标题' },
  { key: 'posterTitleSub',  label: '海报副标题' },
  { key: 'posterCTA',       label: '海报 CTA' },
  { key: 'posterFooter',    label: '海报底部行' },
  { key: 'uploadReward',    label: '上传奖励',  placeholder: '例：200 核桃币' },
  { key: 'starGoal',        label: '集星目标',  placeholder: '例：16 颗星星' },
  { key: 'starReward',      label: '集星奖励',  placeholder: '例：3000 核桃币' },
  { key: 'activityTime',    label: '活动时间',  placeholder: '例：2026-05-10 ~ 2026-05-31' },
];

function renderOpsFields() {
  const box = $('#opsFields');
  if (!box) return;
  box.innerHTML = '';
  for (const f of opsBasicFields) {
    const input = el('input', {
      type: 'text',
      placeholder: f.placeholder || '',
      value: state.ops[f.key] ?? '',
    });
    input.addEventListener('input', () => { state.ops[f.key] = input.value; });
    const label = el('label', {
      class: 'field' + (f.full ? ' full' : ''),
      title: f.hint || '',
    }, [el('span', {}, f.label), input]);
    box.append(label);
  }
}

// ==========================================================================
// Render: Step 3b / PRD Q&A
// ==========================================================================

function renderPrdQuestions() {
  const box = $('#prdQuestions');
  box.innerHTML = '';
  for (const q of keyQuestions) {
    const ta = el('textarea', {
      rows: 2, placeholder: q.placeholder,
      oninput: (e) => { state.prdAnswers[q.id] = e.target.value; },
    });
    ta.value = state.prdAnswers[q.id] || '';
    box.append(el('label', {}, [el('span', {}, q.q), ta]));
  }
  $('#prdRaw').oninput = (e) => { state.prdRaw = e.target.value; };
  $('#prdRaw').value = state.prdRaw;
  $('#loadDefaultPrd').onclick = () => {
    state.prdAnswers = { ...defaultOps.prdQuickInfo };
    state.prdRaw = '';
    renderPrdQuestions();
  };
}

// ==========================================================================
// Render: Step 4 / refs
// ==========================================================================

function renderRefs() {
  const box = $('#refList');
  box.innerHTML = '';
  state.refs.forEach((r, i) => {
    box.append(el('div', { class: 'thumb' }, [
      el('img', { src: r.dataUrl, alt: r.name }),
      el('button', {
        type: 'button', title: '删除',
        onclick: () => { state.refs.splice(i, 1); renderRefs(); },
      }, '×'),
    ]));
  });
  $('#refImages').onchange = async (e) => {
    const files = [...e.target.files];
    for (const f of files) {
      const dataUrl = await readFileAsDataUrl(f);
      state.refs.push({ name: f.name, dataUrl });
    }
    e.target.value = '';
    renderRefs();
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// ==========================================================================
// Render: Step 3.5 / 字体风格
// ==========================================================================

function renderFontChips() {
  const box = $('#fontChips');
  if (!box) return;
  box.innerHTML = '';
  for (const f of Object.values(fontStyles)) {
    const chip = el('span', {
      class: 'style-chip' + (state.fontStyle === f.id ? ' active' : ''),
      title: f.desc,
      onclick: () => {
        state.fontStyle = f.id;
        renderFontChips();
        $('#fontCustomField').style.display = (f.id === 'custom') ? '' : 'none';
      },
    }, f.name);
    box.append(chip);
  }
  // 自定义 textarea 绑定
  const ta = $('#fontCustom');
  if (ta) {
    ta.value = state.fontCustom;
    ta.oninput = (e) => { state.fontCustom = e.target.value; };
  }
}

// ==========================================================================
// Render: Step 7 / styles
// ==========================================================================

function renderStyleChips() {
  const box = $('#styleChips');
  box.innerHTML = '';
  for (const s of Object.values(styles)) {
    const chip = el('span', {
      class: 'style-chip' + (state.styles.has(s.id) ? ' active' : ''),
      title: s.pitch,
      onclick: () => {
        if (state.styles.has(s.id)) state.styles.delete(s.id);
        else state.styles.add(s.id);
        chip.classList.toggle('active');
        updateGenButton();
      },
    }, s.name);
    box.append(chip);
  }
}

// ==========================================================================
// Generate
// ==========================================================================

function updateGenButton() {
  const n = state.pages.size * state.styles.size;
  const btn = $('#generateBtn');
  btn.textContent = `▶ 生成 ${n} 张图`;
  btn.disabled = n === 0;
}

function buildContext() {
  // 解析字体风格：custom 时取 textarea，否则取库里的 prompt 片段
  let fontPrompt = '';
  let fontName = '';
  const f = fontStyles[state.fontStyle];
  if (f) {
    fontName = f.name;
    fontPrompt = state.fontStyle === 'custom'
      ? state.fontCustom.trim()
      : f.prompt;
  }
  return {
    ops: state.ops,
    spec: state.designSpecText.trim()
      ? { ...defaultDesignSpec, _override: state.designSpecText.trim() }
      : defaultDesignSpec,
    prdInfo: summarizePrdInfo(state.prdAnswers, state.prdRaw),
    special: state.special,
    refs: state.refs,
    fontStyle: { id: state.fontStyle, name: fontName, prompt: fontPrompt },
  };
}

async function generate() {
  const ctx = buildContext();
  const items = [];
  state.results = [];
  // 模型固定走 default（gpt-image-2）；所有参考图都传给模型做视觉参考
  const model = modelRouting.default.model;
  const refImages = state.refs.map(r => r.dataUrl).filter(Boolean);
  for (const pageId of state.pages) {
    for (const styleId of state.styles) {
      const id = `${pageId}__${styleId}`;
      const prompt = buildPrompt(pageId, styleId, ctx);
      items.push({
        id, prompt, model,
        size: pageSizeHint(pageId),
        imageUrls: refImages,
      });
      state.results.push({
        id, pageId, styleId, prompt,
        status: 'submitted', url: null, taskId: null,
        optSelected: new Set(), optText: '', history: [],
        usedRef: refImages.length > 0, refCount: refImages.length, model,
      });
    }
  }
  if (!items.length) return;

  renderResults();
  setStatus(`提交 ${items.length} 张图…`);

  let resp;
  try {
    resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).then(r => r.json());
  } catch (e) {
    setStatus('请求失败：' + e.message, 'err');
    return;
  }
  if (resp.error) { setStatus(resp.error, 'err'); return; }

  // 把 task id 回填到对应 result
  for (const t of resp.tasks || []) {
    const r = state.results.find(x => x.id === t.id);
    if (!r) continue;
    if (t.directUrl) { r.status = 'completed'; r.url = t.directUrl; }
    else if (t.b64)   { r.status = 'completed'; r.url = `data:image/png;base64,${t.b64}`; }
    else if (t.taskId){ r.status = 'pending'; r.taskId = t.taskId; }
    else              { r.status = 'error'; r.error = JSON.stringify(t.raw || t).slice(0, 200); }
  }
  renderResults();
  pollPending();
  renderBriefPreview();
}

async function pollPending() {
  const pending = state.results.filter(r => r.status === 'pending' && r.taskId);
  if (!pending.length) { setStatus('完成', 'ok'); return; }
  setStatus(`轮询 ${pending.length} 张图…`);
  // 间隔 3s 轮询，最多 40 次（2 分钟）
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    let stillPending = 0;
    await Promise.all(pending.map(async (r) => {
      if (r.status !== 'pending') return;
      try {
        const resp = await fetch(`/api/task/${encodeURIComponent(r.taskId)}`).then(x => x.json());
        if (resp.status === 'completed' && resp.urls?.length) {
          r.status = 'completed'; r.url = resp.urls[0];
        } else if (resp.status === 'failed' || resp.status === 'error') {
          r.status = 'error'; r.error = JSON.stringify(resp.raw || resp).slice(0, 200);
        } else {
          stillPending++;
        }
      } catch (e) {
        stillPending++;
      }
    }));
    renderResults();
    renderBriefPreview();
    if (stillPending === 0) { setStatus('完成', 'ok'); return; }
    setStatus(`轮询中（剩 ${stillPending} 张）…`);
  }
  setStatus('部分图未完成，请稍后手动刷新', 'err');
}

// ==========================================================================
// Render: results
// ==========================================================================

function renderResults() {
  const box = $('#resultsGrid');
  box.innerHTML = '';
  if (!state.results.length) {
    box.append(el('div', { class: 'empty-hint' }, '左侧选好后点「生成」。每张图卡上可以勾选优化方向重新生成。'));
    refreshExportTargets();
    return;
  }
  for (const r of state.results) {
    box.append(renderResultCard(r));
  }
  refreshExportTargets();
}

function renderResultCard(r) {
  const page = pages[r.pageId];
  const style = styles[r.styleId];
  const suggested = suggestOptimizations(r.pageId, r.styleId, optimizationOptions);

  const imgWrap = el('div', { class: 'img-wrap' + (r.pageId === 'promo-poster' ? ' poster' : '') });
  if (r.status === 'completed' && r.url) {
    imgWrap.append(el('img', { src: displayImageUrl(r.url), alt: `${page.name} × ${style.name}` }));
  } else if (r.status === 'pending' || r.status === 'submitted') {
    imgWrap.append(el('div', { class: 'spinner' }));
  } else if (r.status === 'error') {
    imgWrap.append(el('div', {}, '生成失败'));
  } else {
    imgWrap.append(el('div', {}, '等待生图'));
  }

  const badge = el('span', { class: 'badge ' + statusClass(r.status) }, statusLabel(r.status));

  // 优化 chips（建议 3 个 + 全部 chips 可展开）
  const optRow = el('div', { class: 'opt-row' });
  for (const opt of suggested) {
    const chip = el('span', {
      class: 'opt-chip' + (r.optSelected.has(opt.id) ? ' active' : ''),
      onclick: () => {
        if (r.optSelected.has(opt.id)) r.optSelected.delete(opt.id);
        else r.optSelected.add(opt.id);
        chip.classList.toggle('active');
      },
    }, opt.label);
    optRow.append(chip);
  }

  const moreOpts = el('details', {}, [
    el('summary', {}, '更多优化方向'),
    el('div', { class: 'opt-row', style: 'margin-top:6px;' }, optimizationOptions
      .filter(o => !suggested.find(s => s.id === o.id))
      .map(o => {
        const chip = el('span', {
          class: 'opt-chip' + (r.optSelected.has(o.id) ? ' active' : ''),
          onclick: () => {
            if (r.optSelected.has(o.id)) r.optSelected.delete(o.id);
            else r.optSelected.add(o.id);
            chip.classList.toggle('active');
          },
        }, o.label);
        return chip;
      })),
  ]);

  const optText = el('textarea', {
    rows: 2, placeholder: '我想怎么改这版？（可选）',
    oninput: (e) => { r.optText = e.target.value; },
  });
  optText.value = r.optText;

  const actions = el('div', { class: 'actions' }, [
    el('button', {
      class: 'primary-btn', type: 'button',
      onclick: () => regenerate(r),
    }, '应用优化重生成'),
    el('button', {
      class: 'ghost-btn', type: 'button',
      onclick: () => navigator.clipboard.writeText(r.prompt).then(() => setStatus('prompt 已复制', 'ok')),
    }, '复制 prompt'),
    r.url ? el('a', {
      class: 'ghost-btn', href: displayImageUrl(r.url), target: '_blank', rel: 'noopener',
      style: 'text-decoration:none;',
    }, '原图新窗') : null,
  ]);

  const promptBlock = el('details', {}, [
    el('summary', {}, '查看 prompt'),
    el('pre', {}, r.prompt),
  ]);

  return el('article', { class: 'result-card' }, [
    el('div', { class: 'head' }, [
      el('div', { class: 'name' }, `${page.name} × ${style.name}`),
      badge,
    ]),
    imgWrap,
    optRow,
    moreOpts,
    optText,
    actions,
    promptBlock,
  ]);
}

function statusClass(s) {
  return s === 'completed' ? 'ok' : (s === 'error' ? 'err' : 'run');
}
function statusLabel(s) {
  return ({ submitted: '已提交', pending: '生成中', completed: '完成', error: '失败' })[s] || s;
}

function displayImageUrl(url) {
  if (!url || url.startsWith('data:')) return url;
  return `/api/image?url=${encodeURIComponent(url)}`;
}

async function loadDemoResult() {
  const pageId = 'promo-poster';
  const styleId = 'prize-stack';
  state.pages = new Set(['promo-poster']);
  state.styles = new Set(['prize-stack']);
  state.ops = structuredClone(defaultOps);
  state.prdAnswers = { ...defaultOps.prdQuickInfo };
  state.prdRaw = [
    '页面用途：班级群 / 朋友圈投放的转介绍推广海报。',
    '用户动作：家长扫码进入活动页，上传孩子硬件作品，邀请好友点亮星星。',
    '交付要求：标题、CTA、二维码、活动步骤需要在后续 Figma 中可编辑；奖品和装饰可以先作为视觉资产重建。',
  ].join('\n');
  state.special = '汇报 Demo：突出奖品堆、扫码 CTA 和集星规则；视觉要像核桃编程活动物料。';
  state.designSpecText = '';
  state.refs = [];

  const ctx = buildContext();
  const prompt = buildPrompt(pageId, styleId, ctx);
  const demoUrl = await buildDemoImageDataUrl();
  state.results = [{
    id: `${pageId}__${styleId}__demo`,
    pageId, styleId, prompt,
    status: 'completed',
    url: demoUrl,
    taskId: null,
    optSelected: new Set(),
    optText: '',
    history: [],
    usedRef: false,
    refCount: 0,
    model: modelRouting.default.model,
    isDemo: true,
  }];

  $('#prdRaw').value = state.prdRaw;
  $('#specialInst').value = state.special;
  $('#designSpecText').value = '';
  $('#specSource').textContent = '用默认';
  renderPageChecks();
  renderOpsFields();
  renderPrdQuestions();
  renderStyleChips();
  updateGenButton();
  renderResults();
  renderBriefPreview();
  setStatus('已载入 Demo 结果，可演示 PSD / HTML / Figma 还原包导出', 'ok');
}

async function buildDemoImageDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1820" viewBox="0 0 1024 1820">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff5a1f"/>
      <stop offset="1" stop-color="#e53b12"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#8c2608" flood-opacity=".32"/>
    </filter>
  </defs>
  <rect width="1024" height="1820" fill="url(#bg)"/>
  <g opacity=".2" fill="#ffd84a">
    <circle cx="130" cy="180" r="88"/><circle cx="900" cy="320" r="120"/><circle cx="820" cy="1520" r="160"/>
  </g>
  <g fill="#ffd84a" opacity=".85">
    <path d="M136 488l24 50 55 8-40 39 10 55-49-26-49 26 10-55-40-39 55-8z"/>
    <path d="M834 728l18 38 42 6-30 30 7 42-37-20-38 20 7-42-30-30 42-6z"/>
    <path d="M192 1370l17 36 39 6-28 27 7 39-35-18-35 18 7-39-28-27 39-6z"/>
  </g>
  <rect x="72" y="68" width="220" height="74" rx="28" fill="#fff" opacity=".95"/>
  <text x="182" y="116" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="#21180f">核桃编程</text>
  <text x="512" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="900" fill="#21180f" stroke="#fff" stroke-width="14" paint-order="stroke">秀出你的</text>
  <text x="512" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="106" font-weight="900" fill="#ffd84a" stroke="#21180f" stroke-width="10" paint-order="stroke">硬件作品</text>
  <text x="512" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#fff">赢取超值学习礼</text>
  <g filter="url(#shadow)">
    <rect x="132" y="545" width="760" height="410" rx="48" fill="#fff3d2"/>
    <rect x="196" y="615" width="190" height="245" rx="24" fill="#ffd84a"/>
    <rect x="424" y="590" width="220" height="300" rx="22" fill="#fff"/>
    <rect x="680" y="650" width="150" height="220" rx="22" fill="#ffe9c4"/>
    <text x="512" y="792" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="#ff5a1f">奖品堆头</text>
    <text x="512" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#21180f">黄鹤楼 / 航天书 / 核桃币</text>
  </g>
  <rect x="88" y="1032" width="848" height="360" rx="44" fill="#fffaf1" filter="url(#shadow)"/>
  <text x="512" y="1112" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="900" fill="#21180f">活动参与步骤</text>
  <circle cx="194" cy="1202" r="48" fill="#ff5a1f"/><text x="194" y="1218" text-anchor="middle" font-family="Arial" font-size="36" font-weight="900" fill="#fff">1</text>
  <text x="270" y="1194" font-family="Arial" font-size="36" font-weight="900" fill="#21180f">秀硬件作品</text>
  <text x="270" y="1246" font-family="Arial" font-size="28" font-weight="700" fill="#7d6f62">上传作品，审核通过得 200 核桃币</text>
  <circle cx="194" cy="1310" r="48" fill="#ff5a1f"/><text x="194" y="1326" text-anchor="middle" font-family="Arial" font-size="36" font-weight="900" fill="#fff">2</text>
  <text x="270" y="1302" font-family="Arial" font-size="36" font-weight="900" fill="#21180f">集星星领好礼</text>
  <text x="270" y="1354" font-family="Arial" font-size="28" font-weight="700" fill="#7d6f62">集满 16 颗星，兑换 3000 核桃币</text>
  <rect x="92" y="1490" width="560" height="126" rx="63" fill="#ffd84a" stroke="#21180f" stroke-width="8" filter="url(#shadow)"/>
  <text x="372" y="1570" text-anchor="middle" font-family="Arial" font-size="54" font-weight="900" fill="#21180f">扫码立即参与</text>
  <rect x="704" y="1458" width="220" height="220" rx="28" fill="#fff" stroke="#21180f" stroke-width="8"/>
  <text x="814" y="1582" text-anchor="middle" font-family="Arial" font-size="40" font-weight="900" fill="#7d6f62">QR</text>
  <text x="512" y="1732" text-anchor="middle" font-family="Arial" font-size="34" font-weight="800" fill="#fff">更多好礼等你领 · Demo visual</text>
</svg>`;
  return await svgToPngDataUrl(svg, 1024, 1820);
}

function svgToPngDataUrl(svg, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function regenerate(r) {
  const addons = [...r.optSelected]
    .map(id => optimizationOptions.find(o => o.id === id)?.addon)
    .filter(Boolean);
  const newPrompt = buildOptimizedPrompt(r.prompt, addons, r.optText);
  r.history.push({ prompt: r.prompt, url: r.url });
  r.prompt = newPrompt;
  r.status = 'submitted';
  r.url = null;
  r.taskId = null;
  renderResults();
  setStatus(`提交优化（${pages[r.pageId].name} × ${styles[r.styleId].name}）…`);

  let resp;
  try {
    resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          id: r.id, prompt: newPrompt,
          model: modelRouting.default.model,
          size: pageSizeHint(r.pageId),
          imageUrls: state.refs.map(ref => ref.dataUrl).filter(Boolean),
        }],
      }),
    }).then(x => x.json());
  } catch (e) {
    r.status = 'error'; r.error = e.message;
    renderResults(); setStatus('失败：' + e.message, 'err'); return;
  }
  if (resp.error) {
    r.status = 'error'; r.error = resp.error;
    renderResults(); setStatus(resp.error, 'err'); return;
  }
  const t = resp.tasks?.[0];
  if (!t) { r.status = 'error'; renderResults(); setStatus('返回为空', 'err'); return; }
  if (t.directUrl) { r.status = 'completed'; r.url = t.directUrl; }
  else if (t.b64)   { r.status = 'completed'; r.url = `data:image/png;base64,${t.b64}`; }
  else if (t.taskId){ r.status = 'pending'; r.taskId = t.taskId; }
  else              { r.status = 'error'; }
  renderResults();
  pollPending();
  renderBriefPreview();
}

// ==========================================================================
// Export
// ==========================================================================

function buildBrief() {
  return {
    activity: activityTemplate,
    pages: [...state.pages].map(id => pages[id]),
    styles: [...state.styles].map(id => styles[id]),
    designSpec: state.designSpecText.trim()
      ? { ...defaultDesignSpec, _override: state.designSpecText.trim() }
      : defaultDesignSpec,
    ops: state.ops,
    prd: { raw: state.prdRaw, answers: state.prdAnswers },
    refs: state.refs.map(r => ({ name: r.name })),  // 不导出 base64，避免文件爆炸
    special: state.special,
    results: state.results.map(r => ({
      id: r.id, page: pages[r.pageId].name, style: styles[r.styleId].name,
      status: r.status, url: r.url, prompt: r.prompt,
      optSelected: [...r.optSelected], optText: r.optText,
    })),
  };
}

function buildMarkdown(b) {
  const L = [];
  L.push(`# 转介绍活动物料 brief`);
  L.push(`- 活动：${b.activity.name}`);
  L.push(`- 心智：${b.activity.mindset}`);
  L.push('');
  L.push(`## 选中页面`);
  for (const p of b.pages) L.push(`- ${p.name}（${p.aspect}，${p.use}）`);
  L.push('');
  L.push(`## 选中风格`);
  for (const s of b.styles) L.push(`- ${s.name} — ${s.pitch}`);
  L.push('');
  L.push(`## PRD 关键信息`);
  if (b.prd.raw?.trim()) { L.push('### 原文'); L.push('```'); L.push(b.prd.raw.trim()); L.push('```'); }
  for (const [k, v] of Object.entries(b.prd.answers || {})) {
    if (v?.trim()) L.push(`- ${k}: ${v.trim()}`);
  }
  L.push('');
  L.push(`## 运营特殊指令`); L.push(b.special?.trim() || '（无）');
  L.push('');
  L.push(`## 设计规范`);
  L.push(`- 主色：${b.designSpec.primary} / 强调：${b.designSpec.accent}`);
  L.push(`- CTA：${b.designSpec.ctaShape}`);
  L.push(`- 字体：${b.designSpec.fontFeel}`);
  if (b.designSpec._override) L.push(`- 本次覆盖：${b.designSpec._override}`);
  L.push('');
  L.push(`## 生成结果`);
  for (const r of b.results) {
    L.push(`### ${r.page} × ${r.style} — ${r.status}`);
    if (r.url) L.push(`- 图：${r.url}`);
    if (r.optSelected.length) L.push(`- 已应用优化：${r.optSelected.join(', ')}`);
    if (r.optText) L.push(`- 优化备注：${r.optText}`);
    L.push('```');
    L.push(r.prompt);
    L.push('```');
  }
  return L.join('\n');
}

function buildFigmaMakeBrief(b) {
  // Figma Make / UI handoff 用的 brief：偏可执行
  const L = [];
  L.push(`# UI Handoff Brief — 转介绍活动物料`);
  L.push(``);
  L.push(`> 给 UI 拿到 Figma Make / html-to-design 跑出可编辑稿`);
  L.push(``);
  L.push(`## 品牌 / 配色`);
  L.push(`- 主色：${b.designSpec.primary}`);
  L.push(`- 强调：${b.designSpec.accent}`);
  L.push(`- 文字：${b.designSpec.ink}`);
  L.push(`- 米黄底：${b.designSpec.bgSoft}`);
  L.push(`- CTA：${b.designSpec.ctaShape}`);
  L.push(``);
  L.push(`## 字体感觉`);
  L.push(b.designSpec.fontFeel);
  L.push(``);
  L.push(`## 通用图层骨架（与导出 Figma 对齐）`);
  ['01 Background', '02 Brand Logo', '03 Title Text', '04 Title Stroke / Decoration',
   '05 Hero Visual', '06 Prize Assets', '07 Step Panel', '08 Step Text',
   '09 CTA', '10 QR Placeholder', '11 Decorations'].forEach(l => L.push(`- ${l}`));
  L.push(``);
  for (const r of b.results) {
    if (r.status !== 'completed') continue;
    L.push(`## ${r.page} × ${r.style}`);
    L.push(`- 尺寸：${b.pages.find(p => p.name === r.page)?.aspect || ''}`);
    L.push(`- AI 输出图：${r.url}`);
    L.push(`- 原始 prompt：见 JSON brief`);
    L.push(`- UI 调整：把 03 Title Text / 09 CTA / 10 QR 重做成可编辑文本和真实二维码；其余图层尽量复用 AI 出图。`);
    L.push(``);
  }
  L.push(`## 禁忌`);
  for (const t of b.designSpec.taboos) L.push(`- ${t}`);
  return L.join('\n');
}

function buildFigmaRestoreBrief(r) {
  const b = buildBrief();
  const page = pages[r.pageId];
  const style = styles[r.styleId];
  const isCard = r.pageId === 'mini-card';
  const ops = state.ops;
  const L = [];

  L.push(`# Figma 还原包：${page.name} × ${style.name}`);
  L.push('');
  L.push(`目标：根据最终 AI 出图、PRD、运营文案和设计规范，先 1:1 还原成 HTML/CSS 前端页面，再用 html.to.design 或 Codex/Figma skill 导入 Figma，得到更可编辑的设计稿。`);
  L.push('');
  L.push(`## 1. 输入资产`);
  L.push(`- 最终图片：${r.url}`);
  L.push(`- 页面类型：${page.name}`);
  L.push(`- 画面比例：${page.aspect}`);
  L.push(`- 生成模型：${r.model || modelRouting.default.model}`);
  L.push(`- 视觉风格：${style.name} — ${style.pitch}`);
  L.push(`- 参考图数量：${r.refCount || state.refs.length || 0}`);
  L.push('');
  L.push(`## 2. 业务文案（必须作为真实文本层还原）`);
  if (isCard) {
    L.push(`- 小程序卡片主标题：${ops.miniCardTitle}`);
    L.push(`- 小程序卡片 CTA：${ops.miniCardCTA}`);
  } else {
    L.push(`- 海报主标题：${ops.posterTitleMain}`);
    L.push(`- 海报副标题：${ops.posterTitleSub}`);
    L.push(`- 海报 CTA：${ops.posterCTA}`);
    L.push(`- 海报底部行：${ops.posterFooter}`);
  }
  L.push(`- 上传奖励：${ops.uploadReward}`);
  L.push(`- 集星目标：${ops.starGoal}`);
  L.push(`- 集星奖励：${ops.starReward}`);
  L.push(`- 活动时间：${ops.activityTime}`);
  L.push('');
  L.push(`## 3. PRD / 运营上下文`);
  if (state.prdRaw.trim()) {
    L.push(state.prdRaw.trim());
  } else {
    const entries = Object.entries(state.prdAnswers || {}).filter(([, v]) => v?.trim());
    if (entries.length) {
      for (const [k, v] of entries) L.push(`- ${k}: ${v.trim()}`);
    } else {
      L.push('（无额外 PRD，上下文以默认活动模板和运营字段为准）');
    }
  }
  if (state.special.trim()) L.push(`- 运营特殊指令：${state.special.trim()}`);
  L.push('');
  L.push(`## 4. Design tokens / 样式约束`);
  L.push(`- Brand：${b.designSpec.brand}`);
  L.push(`- Primary：${b.designSpec.primary}`);
  L.push(`- Accent：${b.designSpec.accent}`);
  L.push(`- Ink：${b.designSpec.ink}`);
  L.push(`- Soft background：${b.designSpec.bgSoft}`);
  L.push(`- CTA：${b.designSpec.ctaShape}`);
  L.push(`- 字体感觉：${b.designSpec.fontFeel}`);
  if (b.designSpec._override) L.push(`- 本次覆盖：${b.designSpec._override}`);
  L.push(`- 禁忌：${b.designSpec.taboos.join('；')}`);
  L.push('');
  L.push(`## 5. 建议可编辑图层`);
  [
    '01 Background: 用 AI 图片作为视觉参考，不要只铺一张背景图交差',
    '02 Brand Logo: 顶部品牌标识，找不到真实 logo 时用占位',
    '03 Title Text: 主标题真实文本层，允许描边/阴影模拟',
    '04 Title Stroke / Decoration: 标题描边、括号、贴纸、强调线',
    '05 Hero Visual: 孩子/硬件/奖品主视觉，可先用图片裁切占位',
    '06 Prize Assets: 奖品堆、核桃币、徽章',
    '07 Step Panel: 活动步骤面板',
    '08 Step Text: 步骤说明真实文本层',
    '09 CTA: CTA 按钮真实文本层',
    '10 QR Placeholder: 二维码占位，禁止生成可扫码假码',
    '11 Decorations: 星星、贴纸、半色调点、sparkle 等装饰',
  ].forEach(line => L.push(`- ${line}`));
  L.push('');
  L.push(`## 6. 给代码大模型的 1:1 HTML/CSS 还原指令`);
  L.push(`请把“最终图片”当作视觉基准，结合上面的 PRD、文案和 design tokens，生成一个单文件 HTML/CSS 页面，用于导入 html.to.design。要求：`);
  L.push(`- 画布比例必须是 ${page.aspect}，桌面预览宽度建议 ${isCard ? '600px' : '420px'}，使用 aspect-ratio 锁定比例。`);
  L.push(`- 尽量 1:1 还原图片的视觉层级、间距、色块、标题位置、CTA、QR 占位和装饰密度。`);
  L.push(`- 关键中文文案必须是 DOM 文本，不要烘焙在背景图里。`);
  L.push(`- 可以把复杂奖品/人物/装饰作为裁切图片或局部背景，但标题、CTA、步骤、活动时间、QR 必须可编辑。`);
  L.push(`- CSS 使用上面的 tokens 作为变量，例如 --brand-orange、--accent-yellow、--ink、--bg-soft。`);
  L.push(`- 不要输出 React，不要输出 Tailwind 配置，只输出可直接打开的 HTML 文件。`);
  L.push(`- 页面导入 Figma 后，图层命名尽量对应“建议可编辑图层”。`);
  L.push('');
  L.push(`## 7. 原始生图 prompt`);
  L.push('```text');
  L.push(r.prompt);
  L.push('```');
  return L.join('\n');
}

function downloadFile(name, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// =========== 4 个真可交付物 + 旧 brief 折叠 ===========

function getSelectedResult() {
  const idx = Number($('#exportTargetSelect').value);
  if (Number.isNaN(idx) || idx < 0) return null;
  return state.results[idx] || null;
}

function refreshExportTargets() {
  const sel = $('#exportTargetSelect');
  if (!state.results.length) {
    sel.innerHTML = '<option value="">尚未生成</option>';
    setExportButtonsEnabled(false);
    return;
  }
  sel.innerHTML = '';
  state.results.forEach((r, i) => {
    const ok = r.status === 'completed' && r.url;
    const label = `${pages[r.pageId].name} × ${styles[r.styleId].name}` + (ok ? '' : '（未完成）');
    const opt = el('option', { value: String(i) }, label);
    if (!ok) opt.disabled = true;
    sel.append(opt);
  });
  // 默认选第一个完成的
  const firstOk = state.results.findIndex(r => r.status === 'completed' && r.url);
  if (firstOk >= 0) sel.value = String(firstOk);
  setExportButtonsEnabled(firstOk >= 0);
}

function setExportButtonsEnabled(enabled) {
  for (const id of ['exportPngBtn', 'exportPsdBtn', 'exportHtmlBtn', 'exportFigmaBtn', 'exportCodeBtn']) {
    const b = $('#' + id);
    if (b) b.disabled = !enabled;
  }
}

async function exportPng() {
  const r = getSelectedResult();
  if (!r?.url) return setStatus('选一张已完成的图', 'err');
  const name = `walnut-${pages[r.pageId].name}-${styles[r.styleId].name}-${Date.now()}.png`;
  // 走 server 代理避开跨域
  const proxied = `/api/export/png?url=${encodeURIComponent(r.url)}&name=${encodeURIComponent(name)}`;
  const a = el('a', { href: proxied, download: name });
  document.body.append(a); a.click(); a.remove();
  setStatus('PNG 已下载（拖进 Lovart 改字体 / 元素）', 'ok');
}

async function exportPsd() {
  const r = getSelectedResult();
  if (!r?.url) return setStatus('选一张已完成的图', 'err');
  setStatus('生成 PSD…');
  try {
    // 走 /api/export/png 代理拿同源 PNG bytes，规避 apimart CDN 的 CORS
    const proxied = `/api/export/png?url=${encodeURIComponent(r.url)}`;
    const resp = await fetch(proxied);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    // 把图绘到 canvas 拿 RGBA Uint8ClampedArray
    const canvas = ('OffscreenCanvas' in window)
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    const imageData = ctx.getImageData(0, 0, width, height);

    // 11 个命名图层：底层带 imageData，其余 10 个空占位（保留给设计师在 PS 里填）
    const placeholderLayers = PSD_LAYER_NAMES.slice(1).map(name => ({
      name,
      left: 0, top: 0, right: width, bottom: height,
      canvas: undefined,
      hidden: false,
      opacity: 255,
    }));
    const psd = {
      width,
      height,
      children: [
        {
          name: PSD_LAYER_NAMES[0],
          left: 0, top: 0, right: width, bottom: height,
          imageData: {
            width,
            height,
            data: imageData.data,
          },
        },
        ...placeholderLayers,
      ],
    };

    const bytes = writePsdBuffer(psd);
    const psdBlob = new Blob([bytes], { type: 'image/vnd.adobe.photoshop' });
    const url = URL.createObjectURL(psdBlob);
    const a = el('a', { href: url, download: `walnut-${r.pageId}-${r.styleId}-${Date.now()}.psd` });
    document.body.append(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatus('PSD 已下载', 'ok');
  } catch (e) {
    setStatus('PSD 失败：' + e.message, 'err');
  }
}

function buildHtmlSingleFile(r) {
  const page = pages[r.pageId];
  const style = styles[r.styleId];
  const ops = state.ops;
  const isCard = r.pageId === 'mini-card';
  const title = isCard ? ops.miniCardTitle : `${ops.posterTitleMain} ${ops.posterTitleSub}`;
  const cta = isCard ? ops.miniCardCTA : ops.posterCTA;
  const aspect = page.aspect.replace(':', ' / ');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>${page.name} × ${style.name}</title>
<style>
  body { margin: 0; background: #f5f2ed; font-family: "PingFang SC", sans-serif; display: flex; justify-content: center; padding: 40px; }
  .canvas {
    position: relative; width: ${isCard ? 600 : 400}px; aspect-ratio: ${aspect};
    background: #fff url("${r.url}") center/cover no-repeat;
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    border-radius: 12px; overflow: hidden;
  }
  .layer-title {
    position: absolute; left: 0; right: 0; top: 4%;
    text-align: center; font-size: ${isCard ? 28 : 32}px; font-weight: 800;
    color: #21180f; -webkit-text-stroke: 2px #fff; text-shadow: 3px 3px 0 #fff;
    padding: 0 16px;
  }
  .layer-cta {
    position: absolute; left: 8%; right: 8%; bottom: 6%;
    background: #FFD84A; color: #21180f; font-weight: 800;
    text-align: center; padding: 14px 0; border-radius: 999px;
    font-size: ${isCard ? 22 : 24}px; box-shadow: 0 4px 0 rgba(0,0,0,0.25);
  }
  .layer-qr {
    position: absolute; right: 6%; bottom: 6%;
    width: 84px; height: 84px; background: #fff;
    border: 2px dashed #21180f; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: #7d6f62;
  }
  /* 可编辑标记 */
  [contenteditable="true"]:focus { outline: 2px solid #ff5a1f; outline-offset: 2px; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="layer-title" contenteditable="true">${escapeHtml(title)}</div>
    <div class="layer-cta" contenteditable="true">${escapeHtml(cta)}</div>
    ${!isCard ? '<div class="layer-qr">QR</div>' : ''}
  </div>
  <!--
    11 个 Figma 图层骨架（如要用 html.to.design 导入 Figma，可以把每层做成独立 div）：
    01 Background  — 背景图（已挂在 .canvas 上）
    02 Brand Logo  — 顶部 logo 占位
    03 Title Text  — .layer-title
    04 Title Stroke / Decoration
    05 Hero Visual — 已合并在背景图里
    06 Prize Assets
    07 Step Panel
    08 Step Text
    09 CTA  — .layer-cta
    10 QR Placeholder — .layer-qr
    11 Decorations
  -->
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function exportHtml() {
  const r = getSelectedResult();
  if (!r?.url) return setStatus('选一张已完成的图', 'err');
  const html = buildHtmlSingleFile(r);
  downloadFile(`walnut-${r.pageId}-${r.styleId}-${Date.now()}.html`, html, 'text/html');
  setStatus('HTML 已下载', 'ok');
}

function exportFigma() {
  const r = getSelectedResult();
  if (!r?.url) return setStatus('选一张已完成的图', 'err');
  const brief = buildFigmaRestoreBrief(r);
  downloadFile(`walnut-${r.pageId}-${r.styleId}-figma-restore-${Date.now()}.md`, brief, 'text/markdown');
  setStatus('Figma 还原包已下载：交给代码大模型生成 1:1 HTML，再导入 html.to.design', 'ok');
}

function buildReactComponent(r) {
  const page = pages[r.pageId];
  const style = styles[r.styleId];
  const ops = state.ops;
  const isCard = r.pageId === 'mini-card';
  const componentName = `Walnut${isCard ? 'Card' : 'Poster'}_${style.id.replace(/-/g, '_')}`;
  const aspect = page.aspect.replace(':', ' / ');
  return `// ${page.name} × ${style.name}
// 自动生成 by 转介绍活动物料 Agent
import React from 'react';
import './${componentName}.css';

export default function ${componentName}({
  bgImageUrl = ${JSON.stringify(r.url)},
  title = ${JSON.stringify(isCard ? ops.miniCardTitle : ops.posterTitleMain + ' ' + ops.posterTitleSub)},
  cta = ${JSON.stringify(isCard ? ops.miniCardCTA : ops.posterCTA)},
  qrUrl,                 // 真二维码图，落地页 url 转 png
  showQR = ${!isCard},
}) {
  return (
    <div className="walnut-canvas walnut-${r.pageId}" style={{ backgroundImage: \`url(\${bgImageUrl})\` }}>
      <div className="layer-title">{title}</div>
      <div className="layer-cta">{cta}</div>
      {showQR && (
        <div className="layer-qr">
          {qrUrl ? <img src={qrUrl} alt="QR" /> : 'QR'}
        </div>
      )}
    </div>
  );
}
`;
}

function buildReactCss(r) {
  const isCard = r.pageId === 'mini-card';
  const aspect = pages[r.pageId].aspect.replace(':', ' / ');
  return `.walnut-canvas {
  position: relative;
  width: 100%;
  max-width: ${isCard ? 600 : 400}px;
  aspect-ratio: ${aspect};
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}
.walnut-canvas .layer-title {
  position: absolute; left: 0; right: 0; top: 4%;
  text-align: center;
  font-size: ${isCard ? '28px' : '32px'};
  font-weight: 800;
  color: #21180F;
  -webkit-text-stroke: 2px #fff;
  text-shadow: 3px 3px 0 #fff;
  padding: 0 16px;
}
.walnut-canvas .layer-cta {
  position: absolute; left: 8%; right: 8%; bottom: 6%;
  background: #FFD84A;
  color: #21180F;
  font-weight: 800;
  text-align: center;
  padding: 14px 0;
  border-radius: 999px;
  font-size: ${isCard ? '22px' : '24px'};
  box-shadow: 0 4px 0 rgba(0,0,0,0.25);
}
.walnut-canvas .layer-qr {
  position: absolute; right: 6%; bottom: 6%;
  width: 84px; height: 84px;
  background: #fff;
  border: 2px dashed #21180F;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  color: #7d6f62;
}
.walnut-canvas .layer-qr img { width: 100%; height: 100%; object-fit: contain; }
`;
}

async function exportCode() {
  const r = getSelectedResult();
  if (!r?.url) return setStatus('选一张已完成的图', 'err');
  // 一次给 jsx + css 两个文件，打包成一个文本下载（用户自己分文件保存）
  const componentName = `Walnut${r.pageId === 'mini-card' ? 'Card' : 'Poster'}_${styles[r.styleId].id.replace(/-/g, '_')}`;
  const jsx = buildReactComponent(r);
  const css = buildReactCss(r);
  const combined = `// ============= ${componentName}.jsx =============\n\n${jsx}\n\n/* ============= ${componentName}.css ============= */\n\n${css}\n`;
  downloadFile(`${componentName}.bundle.txt`, combined, 'text/plain');
  setStatus(`已下载 ${componentName}（jsx + css 在一个文件，分开保存即可）`, 'ok');
}

function bindExport() {
  // 5 个真可交付物
  $('#exportPngBtn').onclick = exportPng;
  $('#exportPsdBtn').onclick = exportPsd;
  $('#exportHtmlBtn').onclick = exportHtml;
  $('#exportFigmaBtn').onclick = exportFigma;
  $('#exportCodeBtn').onclick = exportCode;
  // 折叠 brief 区里的 JSON/Markdown
  $('#exportJsonBtn').onclick = () => {
    downloadFile(`referral-brief-${Date.now()}.json`, JSON.stringify(buildBrief(), null, 2));
    setStatus('JSON 已下载', 'ok');
  };
  $('#exportMdBtn').onclick = () => {
    downloadFile(`referral-brief-${Date.now()}.md`, buildMarkdown(buildBrief()), 'text/markdown');
    setStatus('Markdown 已下载', 'ok');
  };
  $('#copyBriefBtn').onclick = async () => {
    await navigator.clipboard.writeText(buildMarkdown(buildBrief()));
    setStatus('Markdown 已复制', 'ok');
  };
  setExportButtonsEnabled(false);
}

function renderBriefPreview() {
  $('#briefPreview').textContent = JSON.stringify(buildBrief(), null, 2);
}

// ==========================================================================
// Health check
// ==========================================================================

async function checkHealth() {
  try {
    const r = await fetch('/api/health').then(x => x.json());
    const node = $('#apiHealth');
    if (r.ok && r.hasKey) {
      node.textContent = `API ✓ ${new URL(r.base).host}`;
      node.className = 'status ok';
    } else {
      node.textContent = 'API key 未配置';
      node.className = 'status err';
    }
  } catch {
    $('#apiHealth').textContent = '后端未运行（请 npm start）';
    $('#apiHealth').className = 'status err';
  }
}

// ==========================================================================
// Init
// ==========================================================================

function init() {
  renderActivityInfo();
  renderPageChecks();
  renderOpsFields();
  renderFontChips();
  renderPrdQuestions();
  renderRefs();
  renderStyleChips();
  bindExport();
  renderBriefPreview();

  $('#specialInst').oninput = (e) => { state.special = e.target.value; };
  $('#designSpecText').oninput = (e) => {
    state.designSpecText = e.target.value;
    $('#specSource').textContent = e.target.value.trim() ? '本次覆盖' : '用默认';
  };
  $('#generateBtn').onclick = generate;
  $('#loadDemoBtn').onclick = loadDemoResult;
  $('#resetBtn').onclick = () => {
    state.pages = new Set(['mini-card', 'promo-poster']);
    state.styles = new Set(['comic-show-off', 'prize-stack']);
    state.fontStyle = 'default-walnut';
    state.fontCustom = '';
    state.prdRaw = '';
    state.prdAnswers = {};
    state.refs = [];
    state.special = '';
    state.designSpecText = '';
    state.results = [];
    $('#specialInst').value = '';
    $('#prdRaw').value = '';
    $('#designSpecText').value = '';
    $('#specSource').textContent = '用默认';
    init();
    setStatus('已重置');
  };

  updateGenButton();
  checkHealth();
}

init();
