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
    structure: '活动标题 + 奖品主视觉 + 固定 CTA',
    mainElement: '活动标题 + 奖品主视觉 + 立即领取 CTA',
    locked: ['活动标题', '奖品必须出现', 'CTA 文案固定为「立即领取」'],
    variable: ['标题字效', '按钮样式', '奖品摆放', '背景氛围', '装饰元素'],
  },
  'promo-poster': {
    id: 'promo-poster',
    name: '推广海报',
    aspect: '9:16',
    size: '1024x1820',
    use: '朋友圈 / 班级群 / 课导私聊',
    structure: '顶部主题奖品 + 中部活动步骤 + 底部扫码参与',
    mainElement: '品牌 logo + 大标题 + 奖品堆 + 参与步骤 + 二维码',
    locked: ['上中下三段结构', '活动步骤', '二维码区域清晰', 'CTA 文案'],
    variable: ['顶部主视觉', '扫码区样式', '背景风格', '装饰元素', '按钮样式'],
  },
  'upload-page': {
    id: 'upload-page',
    name: '上传页',
    aspect: '9:16',
    size: '1024x1820',
    use: '活动落地页 / 家长上传任务页',
    structure: '顶部主题奖品 + 用户信息 + 上传步骤 + 兑换区 + 上传 CTA',
    mainElement: '用户信息区 + 上传合照任务 + 集星领奖 + 爆款好礼兑换区 + 上传 CTA',
    locked: ['用户信息走系统数据', '上传步骤不可乱动', '兑换区必须保留', '底部上传 CTA'],
    variable: ['顶部主题视觉', '兑换区氛围', 'CTA 样式', '奖品展示', '局部装饰'],
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
// 活动级视觉方向（给运营看的业务语言）
// 运营不直接配置设计语言；这里把业务语言映射到后台 Style Lock。
// ——————————————————————————————————————————————

export const visualDirections = {
  'reward-lively': {
    id: 'reward-lively',
    name: '热闹领奖',
    styleId: 'prize-stack',
    operatorIntent: '奖励感强、奖品吸引人、CTA 明确',
    background: '红橙黄活动舞台 / 奖品展台氛围',
    titleEffect: '大标题描边字，强识别，强调「秀」「赢」「好礼」',
    color: '核桃橙 #FF5A1F + 高亮黄 #FFD84A + 暖红',
    button: '高对比圆角胶囊按钮，奖励感强，文字必须清晰',
    prizeLayout: '奖品堆作为主视觉，主奖品居中，辅奖品两侧补充',
    decoration: '金币、礼盒、星星 IP、闪光，但围绕主体聚合',
    prompt: 'reward-driven lively campaign style; strong prize attraction; warm orange-yellow palette; 3D prize stack; bold readable CTA; festive but organized.',
  },
  'social-natural': {
    id: 'social-natural',
    name: '朋友圈自然',
    styleId: 'seasonal-scene',
    operatorIntent: '降低广告感，更像家长愿意转发的自然分享',
    background: '浅色生活化 / 户外自然光 / 温暖空间感',
    titleEffect: '保留大标题，但降低强促销描边和爆炸感',
    color: '降低红橙饱和度，增加米白、浅黄、浅绿',
    button: '按钮清晰可点击，但弱化电商促销质感',
    prizeLayout: '奖品保留但不过度堆满，增加留白和呼吸感',
    decoration: '中低密度贴纸、星星、柔光，不要爆炸贴',
    prompt: 'social-share friendly visual; warm approachable parent-sharing mood; reduce hard-selling pressure; natural light; more breathing room.',
  },
  'kids-playful': {
    id: 'kids-playful',
    name: '低龄童趣',
    styleId: 'hand-doodle',
    operatorIntent: '更可爱、更适合低龄孩子家长',
    background: '手绘纸张 / 涂鸦 / 明亮轻松的童趣氛围',
    titleEffect: '圆润夸张的童趣字效，边缘柔和，可加贴纸感',
    color: '核桃橙 + 奶油黄 + 少量蓝绿粉点缀',
    button: '软糖感或贴纸感 CTA，仍然要有强点击感',
    prizeLayout: '奖品可更卡通、更亲和，配合星星 IP 互动',
    decoration: '手绘箭头、涂鸦星星、贴纸、礼盒，密度中等',
    prompt: 'playful kid-friendly doodle style; rounded shapes; sticker decorations; warm candy palette; approachable and cute.',
  },
  'brand-clean': {
    id: 'brand-clean',
    name: '品牌专业',
    styleId: 'tech-credible',
    operatorIntent: '更可信、更像课程成果展示，减少促销感',
    background: '结构化信息卡 + 编程/硬件成果线索 + 清爽空间',
    titleEffect: '克制现代粗黑标题，减少花哨描边',
    color: '核桃橙 + 深蓝/白色，冷暖对比',
    button: '清晰稳重的品牌按钮，强调可用性和可信度',
    prizeLayout: '奖品不消失，但弱化堆头，突出学习成果和硬件作品',
    decoration: '低密度，少贴纸，多结构化模块和轻科技线条',
    prompt: 'professional kids programming achievement campaign; credible tech-learning cues; clean layout; subtle code UI; trustworthy for parents.',
  },
  'festival': {
    id: 'festival',
    name: '节日氛围',
    styleId: 'comic-show-off',
    operatorIntent: '更有节点感和庆祝感，但不牺牲信息清晰',
    background: '节日活动场景 / 彩带 / 礼盒 / 灯牌感',
    titleEffect: '节日活动感标题，允许局部彩带、灯牌、贴纸装饰',
    color: '核桃橙 + 高亮黄 + 节日红，按节点可加入辅助色',
    button: '节日礼盒感 CTA，保留强点击感',
    prizeLayout: '奖品像节日礼物陈列，保持主奖品优先级',
    decoration: '彩带、礼盒、金币、星星 IP，控制装饰不要压文字',
    prompt: 'festive campaign atmosphere; celebration accents; gift and ribbon decorations; strong readable reward CTA; keep information hierarchy clear.',
  },
};

export const explorationLevels = {
  light: {
    id: 'light',
    name: '轻微变化',
    prompt: 'only change background atmosphere, local decorations, and minor color balance; keep title treatment and CTA close to the established style.',
  },
  medium: {
    id: 'medium',
    name: '明显变化',
    prompt: 'change title treatment, button style, color tendency, prize arrangement, and background atmosphere, while keeping page structure and business content locked.',
  },
  bold: {
    id: 'bold',
    name: '大胆探索',
    prompt: 'explore a distinct visual language and scene mood, but never change page information architecture, exact copy, QR/CTA requirements, or brand identity.',
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
];

// ——————————————————————————————————————————————
// 优化方向（每张图都能用）
// 当运营点这些 chip，会把对应的 promptAddon 拼到下一轮 prompt 里
// ——————————————————————————————————————————————

export const optimizationOptions = [
  { id: 'prize-bigger',   label: '奖品更突出',       scope: 'local', addon: 'increase prize visual weight on this page only, push prizes to foreground, keep campaign style lock unchanged' },
  { id: 'title-bigger',   label: '标题更突出',       scope: 'local', addon: 'increase title hierarchy on this page only, keep exact title copy and campaign typography fingerprint' },
  { id: 'cta-stronger',   label: '按钮更明显',       scope: 'local', addon: 'make the CTA area more visible and clickable on this page only, keep exact CTA copy' },
  { id: 'qr-clearer',     label: '二维码更清晰',     scope: 'local', addon: 'make QR placeholder area clearer with more safe margin and contrast; do not create an actual scannable QR code' },
  { id: 'step-clearer',   label: '步骤更清楚',       scope: 'local', addon: 'make activity steps easier to read on this page only, reserve cleaner text zones and hierarchy' },
  { id: 'less-deco',      label: '减少装饰',         scope: 'local', addon: 'reduce decoration density on this page only; keep the same campaign color and title style' },
  { id: 'exchange-bigger',label: '兑换区更突出',     scope: 'local', addon: 'make the exchange area and prize redemption section more prominent on this page only' },
  { id: 'sample-clearer', label: '参考图更清楚',     scope: 'local', addon: 'make upload sample photo area clearer and more instructional on this page only' },
];

export const globalUpdateOptions = [
  { id: 'global-social', label: '整套更像朋友圈', directionId: 'social-natural', addon: 'update the campaign style lock toward social-share friendly, lower ad pressure, warmer natural sharing feeling' },
  { id: 'global-reward', label: '整套更热闹领奖', directionId: 'reward-lively', addon: 'update the campaign style lock toward stronger reward excitement and more prominent prize-driven CTA' },
  { id: 'global-clean', label: '整套更清爽专业', directionId: 'brand-clean', addon: 'update the campaign style lock toward cleaner professional brand credibility and reduced decoration density' },
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
  activityName:    '秀硬件作品赢超值好礼',
  prizeList:       '黄鹤楼拼接积木；中国航天立体翻翻书；传统节日卡通拼图；计划打卡器；奖学金',
  rewardRule:      '分享合照收集星星，集满 16 颗星星即可获得 3000 核桃币，兑换超值学习礼',
  uploadTask:      '横屏拍摄孩子手拿硬件作品和编程界面的合照，让孩子更有荣誉感',
  uploadExample:   '孩子手拿硬件作品 + 编程界面合照',
  requiredAssets:  '核桃 logo、星星 IP、金币、礼盒、奖品图、二维码占位',
  miniCardTitle:   '秀硬件作品领超值好礼',
  miniCardCTA:     '立即领取',
  miniCardTarget:  '上传页',
  posterCTA:       '扫码立即参与',
  posterFooter:    '更多好礼等你领',
  posterQr:         '活动二维码占位',
  uploadSubtitle:   '上传硬件作品合照，晒出荣誉时刻，赢取超值好礼',
  uploadCTA:        '点我去上传',
  ruleEntry:        '规则',
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
