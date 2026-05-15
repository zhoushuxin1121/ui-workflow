// ==========================================================================
// Prompt 构造器
// 每个 (页面, 风格) 组合一个独立模板，加上运营上下文拼接而成。
// 用户决定：AI 直接渲染中文，所以 prompt 里明确写出要画的中文字。
// ==========================================================================

import { activityTemplate, pages, styles, defaultDesignSpec, fontConstraints, titleGlyphHints } from './data.js';

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
 * @param {string[]} cnTitles 本张图里要画的中文标题，用来挂字形隐喻提示
 */
function typographyBlock(cnTitles = [], fontStyle = null) {
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
  const userFontBlock = (fontStyle && fontStyle.prompt && fontStyle.prompt.trim())
    ? [
        '',
        `>>> USER-CHOSEN FONT STYLE (HIGHEST PRIORITY — overrides any conflicting font descriptions earlier in this prompt) <<<`,
        `Style name: ${fontStyle.name}`,
        `Apply this font feel to ALL Chinese text in the canvas (titles, CTA, sub-titles, supporting text):`,
        fontStyle.prompt,
      ].join('\n')
    : '';
  return [
    '',
    '=== TYPOGRAPHY CONSTRAINTS (MUST FOLLOW) ===',
    fontConstraints.cnAccuracy,
    '',
    fontConstraints.fontDesign,
    glyphHints.length ? '\nGlyph hints for hero characters:\n' + glyphHints.join('\n') : '',
    userFontBlock,
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
function tail(ctx, cnTitles) {
  return [
    taboos(ctx.spec),
    joinIfPresent('Design spec override', ctx.spec?._override),
    joinIfPresent('Operator special instructions', ctx.special),
    joinIfPresent('PRD key info', ctx.prdInfo),
    rewardBlock(ctx.ops),
    consistencyBlock(),
    refImageNote(ctx.refs),
    typographyBlock(cnTitles, ctx.fontStyle),
  ].filter(Boolean).join('\n');
}

// 同活动一致性 —— 让 5×2 的图视觉成系列
function consistencyBlock() {
  return [
    '',
    '[Campaign series consistency]',
    'This is ONE page in a multi-page campaign series. Sibling pages (mini-card AND promo-poster, possibly across multiple styles) MUST share:',
    '- Same brand color logic (orange #FF5A1F + yellow #FFD84A as anchors)',
    '- Same hero typography style for the campaign main title',
    '- Same decoration vocabulary (stars / sparkles / sticker style / drop-shadow rule)',
    '- Same star-mascot character if used',
    '- Same prize-stack composition rule when prizes appear',
    'Sibling pages can re-arrange layout for their format, but the visual "fingerprint" must be unmistakable as belonging to the same campaign.',
  ].join('\n');
}

// 把奖励/集星信息真传进去（之前只在标题里露脸，正文没用上）
function rewardBlock(ops = {}) {
  const lines = [];
  if (ops.uploadReward) lines.push(`- Upload reward: ${ops.uploadReward}`);
  if (ops.starGoal && ops.starReward) lines.push(`- Star goal: collect ${ops.starGoal} → reward ${ops.starReward}`);
  if (ops.activityTime) lines.push(`- Activity window: ${ops.activityTime}`);
  if (!lines.length) return '';
  return '\n[Reward / mechanics — surface these where space allows]\n' + lines.join('\n');
}

const miniTitles  = (ctx) => [ctx.ops.miniCardTitle, ctx.ops.miniCardCTA];
const posterTitles = (ctx) => [ctx.ops.posterTitleMain, ctx.ops.posterTitleSub, ctx.ops.posterCTA, ctx.ops.posterFooter];

// ----------------------------- 模板表 -----------------------------

const T = {};

// =========== 小程序卡片 ===========

T['mini-card'] = {
  'comic-show-off': (ctx) => `
A 5:4 social share card for a kids' programming hardware-show-off campaign.
${brandHeader(ctx.spec, ctx.ops)}
Composition:
- Center: a chunky orange-yellow vintage camera-shaped frame (~55% of canvas) holding a clean rounded-rectangle photo placeholder area where a real child photo will go (leave it as a clean dark or light fill, no AI-drawn child).
- Frame has bold black outline and dimensional lift (drop shadow).
- Top: render Chinese title「${ctx.ops.miniCardTitle}」in bold comic-style typography, black fill with white outer stroke, flanked by red comic brackets.
- Bottom: a bright yellow rounded pill button rendering Chinese text "${ctx.ops.miniCardCTA}" in bold black, with a small finger-tap cartoon sticker on its right end.
Background: vivid red-orange (${ctx.spec.primary}) with halftone dots and burst sun rays.
Decorations: purple/yellow stars, a "棒!" cartoon emoji sticker on the right, a peace-hand emoji sticker on the left, sparkles. All stickers have white outer stroke and drop shadow.
Style: ${styles['comic-show-off'].mood}.
${tail(ctx, miniTitles(ctx))}
`.trim(),

  'prize-stack': (ctx) => `
A 5:4 social share card emphasizing prize rewards for a kids' programming campaign.
${brandHeader(ctx.spec, ctx.ops)}
Composition:
- Left side (~50%): Chinese title「${ctx.ops.miniCardTitle}」in chunky black comic typography with white stroke, red brackets.
- Right side: a tight stack of physical prizes — a Chinese pagoda LEGO-like build (Yellow Crane Tower 黄鹤楼) as the hero, with a "中国航天" 3D pop-up book and a Walnut Coin pile beside it. Soft drop shadows.
- Bottom band: a bright yellow rounded pill rendering "${ctx.ops.miniCardCTA}" in black bold, with a finger-tap sticker.
Background: ${ctx.spec.primary} with sun rays and halftone dots.
Decorations: small yellow stars, sparkles, a red ribbon labeled "奖学金" near the prize stack.
Style: ${styles['prize-stack'].mood}.
${tail(ctx, miniTitles(ctx))}
`.trim(),

  'hand-doodle': (ctx) => `
A 5:4 social share card with hand-drawn doodle aesthetic for a kids' programming campaign.
${brandHeader(ctx.spec, ctx.ops)}
Composition:
- Center: a hand-drawn rounded rectangle frame (cream fill ${ctx.spec.bgSoft}, hand-sketched border in ink) holding a child photo placeholder area.
- Top: Chinese title「${ctx.ops.miniCardTitle}」in playful hand-lettered style, with handwritten English "My Creation" in cursive on the side.
- Bottom: yellow pill button rendering "${ctx.ops.miniCardCTA}" with hand-drawn arrows pointing to it.
Background: cream ${ctx.spec.bgSoft} with scattered orange and yellow doodle stars, sparkles, hand-drawn squiggles, and a small cartoon star mascot character standing nearby.
Style: ${styles['hand-doodle'].mood}.
${tail(ctx, miniTitles(ctx))}
`.trim(),

  'seasonal-scene': (ctx) => `
A 5:4 social share card with a fresh outdoor seasonal vibe for a kids' programming campaign.
${brandHeader(ctx.spec, ctx.ops)}
Composition:
- Center: a soft rounded photo placeholder area framed with playful orange-yellow camera border, set against a blurred green grass / meadow background with depth-of-field bokeh.
- Top: Chinese title「${ctx.ops.miniCardTitle}」mixing red and dark-green strokes, comic brackets.
- Bottom: yellow pill rendering "${ctx.ops.miniCardCTA}" in bold black.
Decorations: floating yellow stars, dandelion sparkles, small flowers along the bottom edge, a star mascot peeking from grass.
Style: ${styles['seasonal-scene'].mood}.
${tail(ctx, miniTitles(ctx))}
`.trim(),

  'tech-credible': (ctx) => `
A 5:4 social share card emphasizing programming credibility for a kids' programming campaign.
${brandHeader(ctx.spec, ctx.ops)}
Composition:
- Left ~55%: a clean rounded rectangle area for child photo placeholder (kid + laptop + small hardware project), framed with a thin orange tech border with subtle circuit-line decorations.
- Right ~45%: a stylized programming UI screen mockup in dark navy ${ctx.spec.ink || '#1B2845'} with orange syntax highlights, plus a small hardware module silhouette.
- Top: Chinese title「${ctx.ops.miniCardTitle}」in clean bold sans-serif with orange accent on key words.
- Bottom: a yellow rounded pill with "${ctx.ops.miniCardCTA}" in bold black.
Background: cool-warm split — navy gradient on the right, brand orange wash on the left.
Decorations: minimal — small connector dots, schematic lines, a single star.
Style: ${styles['tech-credible'].mood}.
${tail(ctx, miniTitles(ctx))}
`.trim(),
};

// =========== 推广海报 ===========

T['promo-poster'] = {
  'comic-show-off': (ctx) => `
A 9:16 vertical promotional poster for a kids' programming hardware campaign, in comic doodle style.
${brandHeader(ctx.spec, ctx.ops)}
Composition (top to bottom):
1. Top band: Walnut Coding round logo placeholder in a white rounded rectangle (top-left). Chinese main title「${ctx.ops.posterTitleMain}」+「${ctx.ops.posterTitleSub}」in chunky black comic typography with white stroke, red comic brackets around the keyword "秀" or "学习礼".
2. Middle: a single hero child photo placeholder rounded rectangle (kid holding hardware + laptop), framed by an orange-yellow vintage camera shape.
3. Lower middle: a step panel "活动参与步骤" with two steps:
   - 01 秀硬件作品: brief Chinese description with a small inline photo thumb.
   - 02 集星星领好礼: brief description with a small prize thumb.
4. Bottom band: large Chinese CTA "${ctx.ops.posterCTA}" with a clean square QR code placeholder area on the right side, footer "${ctx.ops.posterFooter}".
Background: ${ctx.spec.primary} with halftone dots and burst rays.
Decorations: purple/yellow stars, "棒!" emoji stickers, a peace-hand sticker, sparkles, all with white stroke and drop shadow.
Style: ${styles['comic-show-off'].mood}.
${tail(ctx, posterTitles(ctx))}
`.trim(),

  'prize-stack': (ctx) => `
A 9:16 vertical promotional poster, prize-heavy marketing style.
${brandHeader(ctx.spec, ctx.ops)}
Composition (top to bottom):
1. Top band: Walnut Coding round logo (top-left, white rounded rect). Chinese title「${ctx.ops.posterTitleMain}」+「${ctx.ops.posterTitleSub}」in bold black comic font with red brackets around "秀"; the words "学习礼" highlighted with a yellow underline scribble.
2. Hero (~40%): a tight stack of physical prizes — Yellow Crane Tower (黄鹤楼) brick-built pagoda as the absolute centerpiece, flanked by 中国航天 3D pop-up book on left and a 传统节日 cartoon puzzle box on right; Walnut Coins arranged at base; a red ribbon banner labeled "奖学金" overlaid; small "30元 奖学金" red coin badges.
3. Step panel: cream ${ctx.spec.bgSoft} rounded card titled "活动参与步骤" with two steps (01 秀硬件作品, 02 集星星领好礼), each step has small inline thumb image.
4. Footer band: large Chinese "${ctx.ops.posterCTA}" with QR placeholder square on right, sub-line "${ctx.ops.posterFooter}".
Background: vivid ${ctx.spec.primary} with subtle sun rays and halftone dots.
Decorations: gold sparkles around prizes, a small star mascot holding a gift box.
Style: ${styles['prize-stack'].mood}.
${tail(ctx, posterTitles(ctx))}
`.trim(),

  'hand-doodle': (ctx) => `
A 9:16 vertical poster with hand-drawn doodle aesthetic.
${brandHeader(ctx.spec, ctx.ops)}
Composition (top to bottom):
1. Top: Walnut Coding round logo (top-left). Chinese title「${ctx.ops.posterTitleMain}」+「${ctx.ops.posterTitleSub}」in playful hand-lettered Chinese, with handwritten English "My Creation" in cursive nearby.
2. Hero: prize stack (黄鹤楼 hero + 中国航天 book + traditional festival puzzle + 计划打卡器 on the side), each prize labeled with hand-written Chinese tags ("黄鹤楼拼接积木", "中国航天立体翻翻书"), a cartoon star mascot character on a skateboard waving a gift box.
3. Step panel: cream ${ctx.spec.bgSoft} card with hand-sketched border, titled "活动参与步骤", two steps with hand-drawn arrows pointing between them.
4. Footer: large Chinese "${ctx.ops.posterCTA}" with hand-drawn arrow pointing to a square QR placeholder, sub-line "${ctx.ops.posterFooter}", small star mascot waving.
Background: warm cream/orange gradient, hand-drawn squiggles, hearts, doodle stars scattered.
Style: ${styles['hand-doodle'].mood}.
${tail(ctx, posterTitles(ctx))}
`.trim(),

  'seasonal-scene': (ctx) => `
A 9:16 vertical poster with a fresh outdoor spring scene.
${brandHeader(ctx.spec, ctx.ops)}
Composition (top to bottom):
1. Top: Walnut Coding round logo (top-left). Chinese title「${ctx.ops.posterTitleMain}」+「${ctx.ops.posterTitleSub}」mixing red strokes for "秀" and dark-green strokes for "学习礼", with handwritten English "My Creation" in cursive.
2. Hero: prize stack (黄鹤楼 hero + 中国航天 + traditional puzzle + 计划打卡器) sitting on a soft yellow stage, surrounded by floating soap bubbles and a glowing star mascot.
3. Mid: child photo placeholder (kid + laptop + hardware), small orange rounded card.
4. Step panel: cream ${ctx.spec.bgSoft} card titled "活动参与步骤", two steps, each with thumb image.
5. Footer: large Chinese "${ctx.ops.posterCTA}" with QR placeholder, footer line "${ctx.ops.posterFooter}", a cartoon laughing emoji sticker.
Background: blurred green grass meadow with depth-of-field bokeh, soft sunlight, distant trees.
Style: ${styles['seasonal-scene'].mood}.
${tail(ctx, posterTitles(ctx))}
`.trim(),

  'tech-credible': (ctx) => `
A 9:16 vertical poster emphasizing programming professionalism for new-user parents.
${brandHeader(ctx.spec, ctx.ops)}
Composition (top to bottom):
1. Top: Walnut Coding round logo (top-left). Chinese title「${ctx.ops.posterTitleMain}」+「${ctx.ops.posterTitleSub}」in clean modern bold Chinese type with orange highlight on keywords; subtle schematic line decoration.
2. Hero: split panel — left: child photo placeholder (kid concentrating on laptop with hardware module); right: stylized programming UI screen with orange syntax highlights on dark navy ${ctx.spec.ink}.
3. Trust strip: a thin row showing "课程节点 / 真实硬件 / 学习成果" in three iconified blocks.
4. Step panel: cream card "活动参与步骤", two steps.
5. Footer: large Chinese "${ctx.ops.posterCTA}" with QR placeholder, sub-line "${ctx.ops.posterFooter}".
Background: cool-warm split: top warm orange wash, lower section deep navy gradient, subtle circuit lines and connector dots.
Style: ${styles['tech-credible'].mood}.
${tail(ctx, posterTitles(ctx))}
`.trim(),
};

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

export function buildPrompt(pageId, styleId, ctx) {
  const fn = T[pageId]?.[styleId];
  if (!fn) {
    return `[Unsupported pair] page=${pageId}, style=${styleId}.\nFalling back to brand-only stub.\nBrand: ${ctx.spec?.brand || 'Walnut Coding'}.`;
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
  return lines.join('\n');
}

export function suggestOptimizations(pageId, styleId, allOptions) {
  const map = {
    'comic-show-off':  ['child-bigger', 'text-zone', 'low-age'],
    'prize-stack':     ['prize-bigger', 'qr-clearer', 'less-promo'],
    'hand-doodle':     ['low-age', 'star-clearer', 'brand-stronger'],
    'seasonal-scene':  ['more-festive', 'less-promo', 'brand-stronger'],
    'tech-credible':   ['more-tech', 'star-clearer', 'qr-clearer'],
  };
  const ids = map[styleId] || ['prize-bigger', 'child-bigger', 'qr-clearer'];
  return ids.map(id => allOptions.find(o => o.id === id)).filter(Boolean);
}

export function pageSizeHint(pageId) {
  return pages[pageId]?.aspect || '1:1';
}
