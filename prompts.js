// ==========================================================================
// Prompt 构造器
// 每个 (页面, 风格) 组合一个独立模板，加上运营上下文拼接而成。
// 用户决定：AI 直接渲染中文，所以 prompt 里明确写出要画的中文字。
// ==========================================================================

import { activityTemplate, pages, defaultDesignSpec, fontConstraints, titleGlyphHints } from './data.js';

// ----------------------------- 公共片段 -----------------------------

function brandHeader(spec, ops = {}) {
  const lines = [
    `Brand: ${spec.brand}.`,
    `Brand colors: primary orange ${spec.primary}, accent yellow ${spec.accent}, deep ink ${spec.ink}, soft cream ${spec.bgSoft}.`,
    `Mindset: 孩子牛，我想秀，秀了还有奖励 (Kid is awesome, I wanna show off, and there's a prize).`,
  ];
  if (ops.activityName) lines.push(`Campaign name: 「${ops.activityName}」.`);
  return lines.join(' ');
}

function taboos(spec) {
  return [
    'STRICT NO list:',
    ...spec.taboos.map(t => `- ${t}`),
    ...fontConstraints.taboos.map(t => `- ${t}`),
  ].join('\n');
}

/**
 * 字体严格约束块 —— 所有 prompt 末尾必加
 * 字体方向由当前 visualDirection 的 titleEffect 字段携带（已写进 Campaign Style Lock 块），
 * 这里只兜底"中文字准确、不要繁体 / 错字 / 乱码"的硬规则 + 标题字形隐喻。
 * @param {string[]} cnTitles 本张图里要画的中文标题，用来挂字形隐喻提示
 */
function typographyBlock(cnTitles = []) {
  const glyphHints = [];
  const seen = new Set();
  for (const title of cnTitles) {
    if (!title) continue;
    for (const ch of title) {
      if (titleGlyphHints[ch] && !seen.has(ch)) {
        glyphHints.push(`  - ${titleGlyphHints[ch]}`);
        seen.add(ch);
      }
    }
  }
  return [
    '',
    '=== TYPOGRAPHY CONSTRAINTS (MUST FOLLOW) ===',
    fontConstraints.cnAccuracy,
    '',
    fontConstraints.fontDesign,
    glyphHints.length ? '\nGlyph hints for hero characters:\n' + glyphHints.join('\n') : '',
  ].filter(Boolean).join('\n');
}

function joinIfPresent(label, value) {
  if (!value || (typeof value === 'string' && !value.trim())) return '';
  return `\n[${label}] ${value}`;
}

function refImageNote(refs) {
  if (!refs?.length) return '';
  const label = refs.length === 1 ? '1 operator reference image' : `${refs.length} operator reference images`;
  return `\n[Reference images] The model is receiving ${label} as actual visual inputs. Analyze their color logic, composition rhythm, typography hierarchy, decorative vocabulary, texture/material feel, and marketing emphasis. Synthesize the useful parts into a new Walnut Coding campaign visual; do not copy any single reference layout too literally.`;
}

// 把整个 prompt 末尾的运营上下文 + 字体约束拼起来
function tail(ctx, cnTitles, pageId) {
  return [
    campaignStyleLockBlock(ctx),
    taboos(ctx.spec),
    joinIfPresent('Design spec override', ctx.spec?._override),
    joinIfPresent('Operator special instructions', ctx.special),
    joinIfPresent('PRD key info', ctx.prdInfo),
    rewardBlock(ctx.ops, pageId),
    consistencyBlock(),
    refImageNote(ctx.refs),
    typographyBlock(cnTitles),
  ].filter(Boolean).join('\n');
}

// 同活动一致性 —— 让 5×2 的图视觉成系列
function consistencyBlock() {
  return [
    '',
    '[Campaign series consistency]',
    'This is ONE page in a multi-page campaign series. Sibling pages (mini-card, promo-poster, upload-page) MUST share:',
    '- Same brand color logic (orange #FF5A1F + yellow #FFD84A as anchors)',
    '- Same hero typography style for the campaign main title',
    '- Same decoration vocabulary (stars / sparkles / sticker style / drop-shadow rule)',
    '- Same star-mascot character if used',
    '- Same prize-stack composition rule when prizes appear',
    'Sibling pages can re-arrange layout for their format, but the visual "fingerprint" must be unmistakable as belonging to the same campaign.',
  ].join('\n');
}

function campaignStyleLockBlock(ctx) {
  const lock = ctx.styleLock;
  if (!lock) return '';
  return [
    '',
    '[Campaign Style Lock — highest priority after exact business copy]',
    `- Operator visual direction: ${lock.directionName || '默认热闹领奖'}`,
    `- Operator intent: ${lock.operatorIntent || ''}`,
    `- Background atmosphere: ${lock.background || ''}`,
    `- Title treatment: ${lock.titleEffect || ''}`,
    `- Color tendency: ${lock.color || ''}`,
    `- Button style: ${lock.button || ''}`,
    `- Prize layout: ${lock.prizeLayout || ''}`,
    `- Decoration rule: ${lock.decoration || ''}`,
    `- Direction prompt: ${lock.directionPrompt || ''}`,
    lock.avoid ? `- Operator negative constraints: ${lock.avoid}` : '',
    'All generated pages must obey this same Campaign Style Lock. Page-specific changes are Local Delta only and must not break the shared campaign visual fingerprint.',
    'Hard locks: exact Chinese copy, page information architecture, brand identity, CTA readability, QR placeholder clarity, and page size must not be changed.',
  ].filter(Boolean).join('\n');
}

// 每个页面"结构上真正要画"的机制字段白名单。
// 共用字段是给 AI 理解活动用的上下文，不是每张图都要画的清单 ——
// 这里按页面结构过滤：卡片只认奖品名，海报认步骤/集星，上传页才认全套。
const PAGE_MECHANICS = {
  'mini-card':    [],                                                    // 标题 + 奖品主视觉 + CTA，机制不上卡片
  'promo-poster': ['rewardRule', 'star'],                               // 中部"活动步骤"需要奖励/集星语境
  'upload-page':  ['prizeList', 'rewardRule', 'uploadTask', 'uploadReward', 'star', 'activityTime'], // 任务页全套
};

// 把奖励/集星信息按页面结构有选择地传进去（不再无差别塞所有页面）
function rewardBlock(ops = {}, pageId) {
  const allow = PAGE_MECHANICS[pageId] || [];
  if (!allow.length) return '';
  const lines = [];
  if (allow.includes('prizeList') && ops.prizeList) lines.push(`- Prize / learning gift list: ${ops.prizeList}`);
  if (allow.includes('rewardRule') && ops.rewardRule) lines.push(`- Reward rule: ${ops.rewardRule}`);
  if (allow.includes('uploadTask') && ops.uploadTask) lines.push(`- Upload task: ${ops.uploadTask}`);
  if (allow.includes('uploadReward') && ops.uploadReward) lines.push(`- Upload reward: ${ops.uploadReward}`);
  if (allow.includes('star') && ops.starGoal && ops.starReward) lines.push(`- Star goal: collect ${ops.starGoal} → reward ${ops.starReward}`);
  if (allow.includes('activityTime') && ops.activityTime) lines.push(`- Activity window: ${ops.activityTime}`);
  if (!lines.length) return '';
  return '\n[Reward / mechanics — only what THIS page structure renders]\n' + lines.join('\n');
}

// 把页面 prize 列表整理成简短可读的名字串（给奖品主视觉用）
function prizeNames(ctx) {
  return ctx.ops?.prizeList || activityTemplate.reward.physicalPrizes.join('、');
}

const campaignTitle = (ctx) => ctx.ops.activityName || '秀硬件作品赢超值好礼';
const miniTitle = (ctx) => ctx.ops.miniCardTitle || campaignTitle(ctx);
const miniTitles  = (ctx) => [miniTitle(ctx), ctx.ops.miniCardCTA];
const posterTitles = (ctx) => [campaignTitle(ctx), ctx.ops.posterCTA, ctx.ops.posterFooter];
const uploadTitles = (ctx) => [campaignTitle(ctx), ctx.ops.uploadSubtitle, ctx.ops.uploadCTA];

// ----------------------------- 模板表 -----------------------------
// 每个页面只有一个"结构模板"：它只规定布局、各区块放什么中文字、哪些不能画。
// 所有视觉决定（背景 / 配色 / 标题字效 / 按钮 / 奖品摆位 / 装饰）都交给 Campaign
// Style Lock（即运营选的视觉方向的 6 个维度）。结构由页面决定，皮肤由方向决定。

const VISUAL_DELEGATION =
  'VISUAL STYLING: This template defines ONLY layout, structure and exact Chinese copy. ' +
  'Every visual decision — background scene, color palette, title treatment, button/CTA look, ' +
  'prize arrangement and decoration — MUST come from the Campaign Style Lock block below. ' +
  'Do not default to any preset scene or palette beyond the locked brand anchors; follow the Style Lock exactly.';

const T = {};

// =========== 小程序卡片：活动标题 + 奖品主视觉 + 固定 CTA ===========

T['mini-card'] = (ctx) => `
A 5:4 (1280x1024) social share card for a Walnut Coding kids' programming campaign.
${brandHeader(ctx.spec, ctx.ops)}

=== PAGE STRUCTURE — render EXACTLY these three blocks, nothing else ===
1. Campaign title「${miniTitle(ctx)}」as the dominant headline.
2. Prize hero visual (奖品主视觉): the campaign prize set as the main image subject — ${prizeNames(ctx)}. This is the visual centerpiece of the card.
3. One fixed CTA button rendering exact Chinese「${ctx.ops.miniCardCTA}」.

=== DO NOT RENDER (these belong to other pages, keep them OFF this card) ===
- No activity steps / 参与步骤 panel
- No photo-upload task UI / 上传任务
- No star-collection progress / 集星进度
- No QR code
- No prize-exchange / redemption area / 兑换区
- No user-info / avatar / username block

Layout: a clean share-card composition with the title, the prize hero, and the CTA clearly separated and readable at thumbnail size.
${VISUAL_DELEGATION}
${tail(ctx, miniTitles(ctx), 'mini-card')}
`.trim();

// =========== 推广海报：顶部奖品 + 中部步骤 + 底部扫码 ===========

T['promo-poster'] = (ctx) => `
A 9:16 (1024x1820) vertical promotional poster for a Walnut Coding kids' programming campaign.
${brandHeader(ctx.spec, ctx.ops)}

=== PAGE STRUCTURE — render these blocks top to bottom ===
1. Top band: Walnut Coding round logo placeholder (top-left) + campaign title「${campaignTitle(ctx)}」.
2. Upper hero (~35-40% height): prize visual (顶部主题奖品) — the campaign prize set: ${prizeNames(ctx)}.
3. Middle: a step panel titled「活动参与步骤」with two participation steps — 「01 秀硬件作品」 and 「02 集星星领好礼」, each with a short readable description.
4. Bottom band: a large CTA rendering「${ctx.ops.posterCTA}」 + a clean square QR-code placeholder area on one side + footer line「${ctx.ops.posterFooter}」.

=== DO NOT RENDER (these belong to the upload page) ===
- No user-info / avatar / username block
- No photo-upload task widget / camera-upload UI
- No prize-exchange / redemption area / 兑换区

Layout: clear top-to-bottom hierarchy; the QR placeholder must stay clean, square and uncovered.
${VISUAL_DELEGATION}
${tail(ctx, posterTitles(ctx), 'promo-poster')}
`.trim();

// =========== 上传页：任务执行页，结构最复杂，机制字段全套 ===========

T['upload-page'] = (ctx) => `
A 9:16 (1024x1820) vertical upload landing page for a Walnut Coding referral campaign.
${brandHeader(ctx.spec, ctx.ops)}
Page role: this is the task execution page. Parents land here after clicking the mini-program card or scanning the poster QR. It must clearly guide them to upload a photo and understand the reward flow.

=== LOCKED page structure (top to bottom) ===
1. Top hero: Walnut Coding logo / rule entry, campaign title「${campaignTitle(ctx)}」, prize visual using the campaign prize set.
2. User info area: avatar placeholder + username placeholder + dynamic achievement text such as "学习编程的第 2200 天，已创作 3655 个作品". Treat this as system data placeholder, not operator-entered copy.
3. Step 01: render Chinese step title「上传孩子和硬件作品的合照」. Explain: ${ctx.ops.uploadTask || '横屏拍摄孩子手拿硬件作品和编程界面的合照'}.
4. Step 02: render Chinese step title「分享合照，集齐星星领好礼」. Explain the reward rule: ${ctx.ops.rewardRule || '分享合照收集星星，集满星星兑换好礼'}.
5. Prize exchange area: render title「爆款好礼兑换区」 with the prize list: ${prizeNames(ctx)}.
6. Bottom CTA: a large fixed button rendering exact Chinese text「${ctx.ops.uploadCTA || '点我去上传'}」.

Functional constraints:
- Keep the user information block readable and visually separate from the decorative hero area.
- Upload sample photo area must look like a real instruction area, with camera/plus placeholder if needed.
- The bottom CTA must be clearly tappable and not confused with decoration.
- Do not invent real user names, real QR codes, or real private data.

${VISUAL_DELEGATION}
Keep this page more functional and readable than a pure poster, but still apply the Campaign Style Lock for all visual styling.
${tail(ctx, uploadTitles(ctx), 'upload-page')}
`.trim();

// ----------------------------- 公共导出 -----------------------------

/**
 * 有参考图时的固定开场（用户指定的 prompt 模板）
 */
function refOpeningTemplate(activityName, pageName, refCount = 1) {
  const name = (activityName || '').trim() || '本次活动';
  const target = pageName || '营销物料';
  const refs = refCount > 1 ? `参考这些视觉图（共 ${refCount} 张）` : '参考这张视觉图';
  return `${refs}，分析参考图的配色逻辑、构图节奏、字体层级、装饰语汇和营销重点，重新策划一张关于「${name}」的「${target}」。要吸收参考图的设计风格，但不要复刻版式或元素，要明显服务于核桃编程本次活动。\n\n`;
}

// 模板只按页面选（结构由页面决定）；视觉由 ctx.styleLock（运营选的视觉方向）驱动。
export function buildPrompt(pageId, ctx) {
  const fn = T[pageId];
  if (!fn) {
    return `[Unsupported page] page=${pageId}.\nFalling back to brand-only stub.\nBrand: ${ctx.spec?.brand || 'Walnut Coding'}.`;
  }
  const body = fn(ctx);
  if (ctx.refs?.length) {
    return refOpeningTemplate(ctx.ops?.basic?.activityName || ctx.ops?.activityName, pages[pageId]?.name, ctx.refs.length) + body;
  }
  return body;
}

export function summarizePrdInfo(prdAnswers, prdRawText) {
  const lines = [];
  if (prdRawText?.trim()) {
    lines.push(`Raw PRD excerpt: ${prdRawText.trim().slice(0, 800)}`);
  }
  if (prdAnswers && Object.keys(prdAnswers).length) {
    lines.push('Key Q&A:');
    for (const [k, v] of Object.entries(prdAnswers)) {
      if (v?.trim()) lines.push(`  - ${k}: ${v.trim()}`);
    }
  }
  return lines.join('\n');
}

export function buildOptimizedPrompt(originalPrompt, addons, freeText) {
  const lines = [originalPrompt, '', '--- Optimization addendum ---'];
  for (const a of addons || []) lines.push(`- ${a}`);
  if (freeText?.trim()) lines.push(`- Operator note: ${freeText.trim()}`);
  lines.push('- Keep the same Campaign Style Lock unless the operator explicitly chose a Global Update.');
  return lines.join('\n');
}

export function suggestOptimizations(pageId, allOptions) {
  const byPage = {
    'mini-card':    ['prize-bigger', 'title-bigger', 'cta-stronger'],
    'promo-poster': ['qr-clearer', 'step-clearer', 'less-deco'],
    'upload-page':  ['cta-stronger', 'exchange-bigger', 'sample-clearer'],
  };
  const ids = byPage[pageId] || ['prize-bigger', 'title-bigger', 'cta-stronger'];
  return ids.map(id => allOptions.find(o => o.id === id)).filter(Boolean);
}

export function pageSizeHint(pageId) {
  return pages[pageId]?.aspect || '1:1';
}
