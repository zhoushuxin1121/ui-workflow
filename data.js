// ==========================================================================
// 数据：活动 / 页面 / 风格 / 关键问题 / 优化选项 / 设计规范默认值
// 这是"后台"的占位。真后台上线后，这些值改成从 API 拉。
// ==========================================================================

export const activityTemplate = {
  id: 'referral-hardware',
  name: '转介绍 - 硬件外化',
  mindset: '孩子牛，我想秀，秀了还有奖励',
  flow: [
    '孩子完成硬件作品',
    '家长上传孩子合影 / 视频封面',
    '家长分享给好友',
    '好友点亮小星星',
    '集满 16 颗星 → 3000 核桃币 → 兑换实物好礼',
    '被分享的新用户被引导领课',
  ],
  reward: {
    upload: '200 核桃币（审核通过）',
    star: '集 16 星 = 3000 核桃币',
    physicalPrizes: ['黄鹤楼拼接积木', '中国航天立体翻翻书', '传统节日卡通拼图', '计划打卡器', '30 元奖学金'],
  },
};

// ——————————————————————————————————————————————
// 页面（物料类型）
// ——————————————————————————————————————————————

export const pages = {
  'mini-card': {
    id: 'mini-card',
    name: '小程序卡片',
    aspect: '5:4',                // 微信分享小程序卡片接近 5:4
    size: '1280x1024',
    use: '分享给微信好友 / 朋友圈封面',
    mainElement: '孩子合影 / 视频封面占位 + 标题 + CTA 胶囊',
  },
  'promo-poster': {
    id: 'promo-poster',
    name: '推广海报',
    aspect: '9:16',
    size: '1024x1820',
    use: '朋友圈 / 班级群 / 课导私聊',
    mainElement: '品牌 logo + 大标题 + 奖品堆 + 参与步骤 + 二维码',
  },
};

// ——————————————————————————————————————————————
// 风格库（基于真实物料定调）
// ——————————————————————————————————————————————

export const styles = {
  'comic-show-off': {
    id: 'comic-show-off',
    name: '漫画晒娃涂鸦版',
    suit: ['mini-card'],
    pitch: '黑描边艺术字 + 漫画引号 + 贴纸 + emoji + 半色调点',
    mood: 'comic, doodle, kid-celebration, sticker-pack vibe',
    palette: ['#FF5A1F', '#FFD84A', '#000000', '#FFFFFF', '#9D4EDD'],
  },
  'prize-stack': {
    id: 'prize-stack',
    name: '奖品强刺激版',
    suit: ['promo-poster'],
    pitch: '红橙底 + 奖品大堆 + 米黄 step panel + 强促销',
    mood: 'bold, marketing, prize-heavy, high-impact',
    palette: ['#FF5A1F', '#FFD84A', '#FFE9C4', '#E53B12'],
  },
  'hand-doodle': {
    id: 'hand-doodle',
    name: '手绘童趣版',
    suit: ['promo-poster'],
    pitch: '涂鸦边框 + 卡通星星人偶 + 手绘箭头 + 米黄底',
    mood: 'hand-drawn, playful, kawaii, doodle borders',
    palette: ['#FFE9C4', '#FF5A1F', '#FFD84A', '#FFFFFF'],
  },
  'seasonal-scene': {
    id: 'seasonal-scene',
    name: '季节场景版',
    suit: ['promo-poster'],
    pitch: '草地景深 + 户外光 + 红绿撞色',
    mood: 'outdoor, seasonal, fresh, depth-of-field',
    palette: ['#A8D86E', '#FF5A1F', '#FFD84A', '#2D6E2A'],
  },
  'tech-credible': {
    id: 'tech-credible',
    name: '科技成果版',
    suit: ['promo-poster'],
    pitch: '编程界面 + 硬件 + 冷暖对比，主打新用户家长',
    mood: 'professional, tech, credibility, cool-warm contrast',
    palette: ['#1B2845', '#FF5A1F', '#FFFFFF', '#23B0FF'],
  },
};

// ——————————————————————————————————————————————
// 关键问题清单（PRD 缺失时 Agent 用这个引导）
// 这些问题以后会沉淀进后台
// ——————————————————————————————————————————————

// 这里只放"调 AI 怎么画的上下文"，会被画进图的字（标题/CTA/奖励数字等）放在 Step 3。
// 删掉了和 Step 3 重叠的两条（reward / title）。
export const keyQuestions = [
  { id: 'course',     q: '这一期突出哪个课程的什么作品？',         placeholder: '例：趣味 C 智能门锁 / 思维 Py3 人脸识别' },
  { id: 'audience',   q: '主推目标人群是老用户回流还是新用户拉新？', placeholder: '例：老用户家长（晒娃 + 集星）' },
  { id: 'first-look', q: '想让人第一眼看到什么？',                 placeholder: '例：奖品堆 / 孩子 / 编程界面 / 集星进度' },
  { id: 'channel',    q: '投放渠道是哪里？',                       placeholder: '例：朋友圈 + 班级群 + 课导私聊' },
  { id: 'taboo',      q: '有没有不能出现的元素？',                  placeholder: '例：不要"奖学金"字样、不要友商品牌' },
  { id: 'reference',  q: '参考过哪一期 / 哪个友商的物料？',          placeholder: '例：参考 image_2026_03 那一期' },
];

// ——————————————————————————————————————————————
// 优化方向（每张图都能用）
// 当运营点这些 chip，会把对应的 promptAddon 拼到下一轮 prompt 里
// ——————————————————————————————————————————————

export const optimizationOptions = [
  { id: 'prize-bigger',   label: '奖品堆头更大',     addon: 'increase prize stack visual weight to 60% of canvas, push prizes to foreground' },
  { id: 'child-bigger',   label: '孩子更突出',       addon: 'enlarge child portrait, soft warm rim light, hero placement' },
  { id: 'qr-clearer',     label: '二维码更醒目',     addon: 'enlarge QR placeholder area, add yellow halo and "扫码立即参与" emphasis around it' },
  { id: 'star-clearer',   label: '集星规则更清楚',   addon: 'add a clear 16-star progress bar with prominent labeling' },
  { id: 'brand-stronger', label: '更像核桃品牌',     addon: 'use Walnut Coding brand orange #FF5A1F as dominant color, walnut mascot accent' },
  { id: 'less-promo',     label: '降低促销感',       addon: 'reduce marketing pressure, calmer composition, more breathing space, less burst rays' },
  { id: 'more-social',    label: '更适合朋友圈',     addon: 'social-friendly composition, group-share feel, friend avatars implied' },
  { id: 'more-tech',      label: '更有课程专业感',   addon: 'add subtle programming UI screen, schematic lines, AI lab vibe' },
  { id: 'low-age',        label: '更适合低龄',       addon: 'rounder shapes, candy palette, kawaii stickers, lower visual density' },
  { id: 'text-zone',      label: '文字区域更清楚',   addon: 'reserve cleaner text zones with stronger contrast, less decoration on text areas' },
  { id: 'more-festive',   label: '更有节日感',       addon: 'add festive accents (red ribbons, lanterns, gold), without losing brand orange' },
];

// ——————————————————————————————————————————————
// 默认设计规范（运营不传 + 后台没有时用这个）
// ——————————————————————————————————————————————

export const defaultDesignSpec = {
  brand: 'Walnut Coding (核桃编程)',
  primary: '#FF5A1F',         // 核桃橙
  accent:  '#FFD84A',          // 高亮黄
  ink:     '#21180F',          // 深色文字
  bgSoft:  '#FFE9C4',          // 米黄底
  fontFeel: '中文：粗黑体 + 黑色描边艺术标题；英文手写：手写体 "My Creation"',
  ctaShape: '圆角胶囊（border-radius: 999px），底色亮黄，文字深色加粗',
  decorations: ['星星 (紫/黄)', '半色调点', '漫画引号「」', 'sparkle', '贴纸+drop shadow'],
  taboos: ['不要西方卡通脸', '不要 watermark / 占位 logo', '不要 lorem ipsum', '不要友商 / 真实第三方品牌'],
};

// ——————————————————————————————————————————————
// 默认运营配置（PRD 默认值，运营可改）
// ——————————————————————————————————————————————

export const defaultOps = {
  activityName:    '秀硬件作品 赢超值好礼',
  miniCardTitle:   '我的编程硬件作品',
  miniCardCTA:     '给宝贝送星星',
  posterTitleMain: '秀出你的硬件作品',
  posterTitleSub:  '赢取超值学习礼',
  posterCTA:       '扫码立即参与',
  posterFooter:    '更多好礼等你领',
  uploadReward:    '200 核桃币',
  starGoal:        '16 颗星星',
  starReward:      '3000 核桃币',
  activityTime:    '2026-05-10 ~ 2026-05-31',
  prdQuickInfo: {
    course: '趣味 C 智能门锁',
    audience: '老用户家长（晒娃 + 集星，引发新用户报名）',
    'first-look': '奖品堆 + 黄鹤楼为主物',
    channel: '朋友圈 + 班级群 + 课导私聊',
    taboo: '不要友商品牌、不要 watermark',
    reference: '参考过往 3 版海报',
  },
};

// ——————————————————————————————————————————————
// 模型路由
// ——————————————————————————————————————————————

export const modelRouting = {
  // 用户决定：统一走 gpt-image-2（同时支持文生图和图生图）
  default: { model: 'gpt-image-2', endpoint: '/v1/images/generations' },
};

// ——————————————————————————————————————————————
// 字体严格约束（所有 prompt 末尾共用）
// 来自《顶级字体美学》PDF + 用户对字体的强约束
// ——————————————————————————————————————————————

export const fontConstraints = {
  cnAccuracy: [
    'CHINESE TEXT MUST BE 100% CORRECT:',
    '- Render every Chinese character with PERFECT strokes',
    '- NO missing strokes (少笔), NO extra strokes (多笔), NO wrong strokes (错笔)',
    '- NO 伪中文 / fake Chinese / garbled glyphs',
    '- NO 繁体字 / Traditional Chinese — strictly Simplified Chinese (简体中文)',
    '- NO typos, NO duplicate characters',
    '- Every character must be readable on first glance',
  ].join('\n'),

  fontDesign: [
    'TITLE TYPOGRAPHY must look CUSTOM-DESIGNED for this campaign:',
    '- NOT default system font, NOT Canva template font',
    '- NOT cheap 3D extrusion, NOT cheesy neon',
    '- Strong stroke contrast, comic-style bold outline',
    '- The character SHAPE itself can hint at meaning (e.g. "秀" feels confident-showcase, "赢" feels weighty/rewarding, "星" can radiate)',
    '- Text is the hero of its zone — decorations SERVE the text, never compete with it',
  ].join('\n'),

  taboos: [
    'NO Canva-template feel',
    'NO cheap 3D / 廉价 3D 字',
    'NO 俗气霓虹 / cheesy neon glow',
    'NO PPT cover feel',
    'NO Taobao-ad feel',
    'NO low-resolution / blurry / jagged edges',
    'NO 错字 / 乱码 / 伪中文 / 多字 / 漏字 / 繁体字',
    'NO real watermarks / signatures / 3rd-party logos',
    'NO actual scannable QR (use placeholder square zone only)',
  ],
};

// ——————————————————————————————————————————————
// 字体风格库（v0 路 2：单一字体，作用于全图所有字）
// ——————————————————————————————————————————————

export const fontStyles = {
  'default-walnut': {
    id: 'default-walnut',
    name: '核桃品牌默认',
    desc: '漫画粗黑体 + 白色描边 + 黑色阴影（对应当前物料）',
    prompt: 'comic-style chunky bold Chinese typeface with thick white outer stroke and dark drop shadow; brand-orange or red accent on key hero characters; matches Walnut Coding established material identity.',
  },
  'kids-round': {
    id: 'kids-round',
    name: '童趣圆体',
    desc: '圆角厚重，可爱亲和，适合低龄',
    prompt: 'rounded chunky Chinese typeface with soft generous corners, full body weight, warm playful kid-friendly feel.',
  },
  'brush-calligraphy': {
    id: 'brush-calligraphy',
    name: '毛笔书法',
    desc: '中国风 / 节日 / 文化感',
    prompt: 'Chinese brush calligraphy with strong ink contrast, organic stroke variation, traditional cultural feel; weight expressive, not uniform.',
  },
  'minimal-modern': {
    id: 'minimal-modern',
    name: '极简现代黑体',
    desc: '专业干净，适合科技/招新',
    prompt: 'clean modern Chinese sans-serif typography with even stroke width, geometric construction, generous letter spacing, professional and minimalist; orange accent on keywords.',
  },
  'promo-impact': {
    id: 'promo-impact',
    name: '粗壮促销字',
    desc: '强促销 / 奖品堆头 / 高视觉重量',
    prompt: 'impact-heavy Chinese promotional typography with extreme stroke weight, dense compressed structure, marketing energy, strong drop shadow and color block highlight.',
  },
  'hand-written': {
    id: 'hand-written',
    name: '手写涂鸦',
    desc: '手账感 / 童趣 / 漫画书',
    prompt: 'hand-lettered Chinese strokes with imperfect pen movement, marker-style ink, doodle accents around the characters, casual handwritten feel.',
  },
  'retro-print': {
    id: 'retro-print',
    name: '复古印刷',
    desc: '老报纸 / 怀旧 / 编辑感',
    prompt: 'retro printed Chinese typeface with subtle ink texture, slight weathering and registration offset, vintage editorial feel.',
  },
  'custom': {
    id: 'custom',
    name: '自定义（自由描述）',
    desc: '自己写一段字体感觉，AI 按你的话画',
    prompt: '',  // 占位，运行时用 state.fontCustom 替换
  },
};

// 标题字形隐喻参考（按当下文案，未来可扩）
export const titleGlyphHints = {
  '秀': '"秀" with confident showcase energy — bold top horizontal, slight performative flair',
  '赢': '"赢" with weighty bottom 贝 component suggesting prize-treasure',
  '我': '"我" with personal-pride lean',
  '星': '"星" — can have radiating accents from 日 component',
  '送': '"送" with motion via 辶 stroke',
  '宝': '"宝" with treasure roundness',
};
