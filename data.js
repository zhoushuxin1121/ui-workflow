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
// 活动级视觉方向（给运营看的业务语言）
// 运营选一个方向，下面 6 个维度（背景/标题/配色/按钮/奖品/装饰）直接驱动出图，
// 不再借用任何旧"风格库"模板 —— 页面结构由 pages 决定，视觉由这里决定。
// ——————————————————————————————————————————————

export const visualDirections = {
  'reward-lively': {
    id: 'reward-lively',
    name: '热闹领奖',
    operatorIntent: '奖励感强、奖品吸引人、CTA 明确',
    background: '红橙黄活动舞台 / 奖品展台氛围',
    titleEffect: '大标题描边字，强识别，对标题里的核心利益词做重音放大（强调哪些字由实际文案决定，不写死）',
    color: '核桃橙 #FF5A1F + 高亮黄 #FFD84A + 暖红',
    button: '高对比圆角胶囊按钮，奖励感强，文字必须清晰',
    prizeLayout: '奖品堆作为主视觉，主奖品居中，辅奖品两侧补充',
    decoration: '金币、礼盒、星星 IP、闪光，但围绕主体聚合',
    prompt: 'reward-driven lively campaign style; strong prize attraction; warm orange-yellow palette; 3D prize stack; bold readable CTA; festive but organized.',
  },
  'social-natural': {
    id: 'social-natural',
    name: '朋友圈自然',
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
    operatorIntent: '更有节点感和庆祝感，但不牺牲信息清晰',
    background: '节日活动场景 / 彩带 / 礼盒 / 灯牌感',
    titleEffect: '节日活动感标题，允许局部彩带、灯牌、贴纸装饰',
    color: '核桃橙 + 高亮黄 + 节日红，按节点可加入辅助色',
    button: '节日礼盒感 CTA，保留强点击感',
    prizeLayout: '奖品像节日礼物陈列，保持主奖品优先级',
    decoration: '彩带、礼盒、金币、星星 IP，控制装饰不要压文字',
    prompt: 'festive campaign atmosphere; celebration accents; gift and ribbon decorations; strong readable reward CTA; keep information hierarchy clear.',
  },
  'tech-coding': {
    id: 'tech-coding',
    name: '编程科技感',
    operatorIntent: '编程课 / 思维 Py / 机器人课 / 暑期编程营，主打科技未来感但保留温度',
    background: '深蓝青色科技氛围，浮动代码方块或轻电路纹理，未来感不冷漠',
    titleEffect: '现代无衬线粗体 + 微辉光 / 渐变描边，科技感但保持可读，不夸张到赛博朋克',
    color: '深蓝青为主底 + 暖橙黄关键字点缀 + 留出亮色对比，避免纯黑背景',
    button: '渐变填充圆角按钮，扁平现代，微辉光呼应主题，不要立体凸起',
    prizeLayout: '奖品 / 教具带科技光感质感，构图干净不堆砌（具体奖品取自运营奖品清单）',
    decoration: '像素火花、浮动代码片段、几何线条、轻电路纹理，密度不要压住主题',
    prompt: 'tech-savvy modern education poster for coding/STEM courses targeting kids 6-14; deep blue/cyan palette with warm orange accent for human warmth; readable title hierarchy; clean code-themed energy without becoming a sci-fi scene.',
  },
  'achievement-showcase': {
    id: 'achievement-showcase',
    name: '学习成果展示',
    operatorIntent: '续报 / 转介绍 / 家长会回流 / 老用户激活，突出"娃学到了什么"',
    background: '干净浅色底 + 微弱进度图样 / 星座纹理 / 进度条暗示，成就氛围',
    titleEffect: '沉稳清爽无衬线，关键字带金色装饰，可信不喧闹，不要派对感',
    color: '米色奶白底 + 金色 / 暖橙点缀 + 柔和蓝（信任色），避免高饱和与彩虹色',
    button: '单色填充微阴影按钮，自信不喧闹，不带节日 / 派对气氛',
    prizeLayout: '突出孩子作品 / 证书 / 等级勋章 / 进度可视化作为视觉主角，不堆实物奖品',
    decoration: '星章、等级勋章、进度曲线、证书飘带，成就感主题不幼稚',
    prompt: 'kid learning achievement showcase poster aimed at existing parents; certificates / works / growth-curves are the visual hero; warm credible tone with gold milestone accents; suitable for renewal and referral campaigns.',
  },
  'urgency-countdown': {
    id: 'urgency-countdown',
    name: '限时紧迫感',
    operatorIntent: '报名截止 / 名额倒计时 / 限时优惠（招生季 / 大促节点）',
    background: '高对比注意力背景 + 放射性图样 / 对角线 / 倒计时图样暗示',
    titleEffect: '加粗大字 + 强描边 / 强阴影，数字（倒计时 / 名额）必须视觉主导',
    color: '红 + 黄 + 黑高对比 + 适量留白避免垃圾传单感，绝不用低饱和或粉嫩色',
    button: '红橙 CTA + 强描边阴影 + 醒目促销角标，强烈呼吁，可允许脉冲感',
    prizeLayout: '把名额或截止时间做成视觉主角并放大，紧迫感优先于奖品美观（具体名额数 / 截止日期取自运营文案，不写死）',
    decoration: '时钟、沙漏、倒计时徽章、闪电、红色促销角标（角标文字取自运营文案）',
    prompt: 'urgency-driven limited-time enrollment promotion poster; red/yellow high-contrast palette with strategic white space; countdown or quota number is the visual hero; aggressive CTA presence; suitable for enrollment deadlines and limited-spot campaigns.',
  },
  'warm-parent-kid': {
    id: 'warm-parent-kid',
    name: '温情亲子',
    operatorIntent: '父母节 / 续报情感打动 / 家庭场景营销，强调情感连接而非促销',
    background: '温暖室内 / 户外阳光氛围 + 柔和虚化背景，照片感不卡通',
    titleEffect: '圆润温暖友好字体，中等粗细，允许局部手写体点缀，不锐利不粗暴',
    color: '米色 + 蜜桃色 + 柔和金，阳光氛围，避免高饱和与冷色调',
    button: '圆角胶囊形温色按钮，友好邀请感不强推',
    prizeLayout: '奖品自然出现在家庭场景里（桌上 / 孩子手里 / 沙发旁），不堆叠摆拍',
    decoration: '爱心、小植物、柔光颗粒、手绘下划线，温柔自然，密度低',
    prompt: 'warm parent-child emotional education poster; sunlit home or park atmosphere with golden-hour glow; rounded friendly typography; cream/peach palette; natural prize placement within family scene; suitable for family-emotional campaigns and renewal pushes.',
  },
  'kol-soft': {
    id: 'kol-soft',
    name: 'KOL 软推感',
    operatorIntent: '朋友圈拼团 / 家长群投放 / 博主推荐风，弱化广告感',
    background: '米色 / 暖色仿博客背景，纸质纹理可选，像文章或杂志排版',
    titleEffect: '编辑感衬线或圆润无衬线点缀，杂志封面 / 推荐文章感，不要电商促销字',
    color: '米色 + 鼠尾草绿 + 奶油色 + 灰玫，柔和不饱和，磨砂质感',
    button: '极简下划线 / 浅圆角按钮，不强推，像内容推荐不像广告',
    prizeLayout: '平铺摆拍式 / "推荐清单"样式 + 简短标注，编辑感构图',
    decoration: '手绘小箭头、便利贴、虚线、"心得 / 强推"小章，小红书贴纸感',
    prompt: 'KOL-style soft recommendation poster mimicking Xiaohongshu/blog aesthetic; muted earth-tone palette; editorial typography; flat-lay product placement; trustworthy non-advertisement feeling; suitable for parent group sharing and soft promotion.',
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

// appliesTo: 这个优化方向适用于哪些页面（按页面结构里真实存在的元素）。
// 没列到的页面不会出现这个 chip —— 小程序卡片没有二维码/步骤/兑换区/参考图，就不该列。
export const optimizationOptions = [
  { id: 'prize-bigger',   label: '奖品更突出',   scope: 'local', appliesTo: ['mini-card', 'promo-poster', 'upload-page'], addon: 'increase prize visual weight on this page only, push prizes to foreground, keep campaign style lock unchanged' },
  { id: 'title-bigger',   label: '标题更突出',   scope: 'local', appliesTo: ['mini-card', 'promo-poster', 'upload-page'], addon: 'increase title hierarchy on this page only, keep exact title copy and campaign typography fingerprint' },
  { id: 'cta-stronger',   label: '按钮更明显',   scope: 'local', appliesTo: ['mini-card', 'promo-poster', 'upload-page'], addon: 'make the CTA area more visible and clickable on this page only, keep exact CTA copy' },
  { id: 'less-deco',      label: '减少装饰',     scope: 'local', appliesTo: ['mini-card', 'promo-poster', 'upload-page'], addon: 'reduce decoration density on this page only; keep the same campaign color and title style' },
  { id: 'qr-clearer',     label: '二维码更清晰', scope: 'local', appliesTo: ['promo-poster'], addon: 'make QR placeholder area clearer with more safe margin and contrast; do not create an actual scannable QR code' },
  { id: 'step-clearer',   label: '步骤更清楚',   scope: 'local', appliesTo: ['promo-poster', 'upload-page'], addon: 'make activity steps easier to read on this page only, reserve cleaner text zones and hierarchy' },
  { id: 'exchange-bigger',label: '兑换区更突出', scope: 'local', appliesTo: ['upload-page'], addon: 'make the exchange area and prize redemption section more prominent on this page only' },
  { id: 'sample-clearer', label: '参考图更清楚', scope: 'local', appliesTo: ['upload-page'], addon: 'make upload sample photo area clearer and more instructional on this page only' },
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
  ctaShape: '圆角胶囊（border-radius: 999px），底色亮黄，文字深色加粗',
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
  miniCardCTA:     '立即领取',
  miniCardTarget:  '上传页',
  posterCTA:       '扫码立即参与',
  posterFooter:    '更多好礼等你领',
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
    '- For the title look (stroke weight, outline, contrast, overall feel), FOLLOW the "Title treatment" line in the Campaign Style Lock above. Do NOT default to a comic / bold-outline headline unless that Style Lock asks for it — a soft / editorial / clean direction must get a soft / editorial / clean title.',
    '- The character SHAPE itself can hint at meaning (e.g. "秀" confident-showcase, "赢" weighty/rewarding, "星" radiating), but only within the chosen Title treatment — never override it.',
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

// 标题字形隐喻参考（按当下文案，未来可扩）
export const titleGlyphHints = {
  '秀': '"秀" with confident showcase energy — bold top horizontal, slight performative flair',
  '赢': '"赢" with weighty bottom 贝 component suggesting prize-treasure',
  '我': '"我" with personal-pride lean',
  '星': '"星" — can have radiating accents from 日 component',
  '送': '"送" with motion via 辶 stroke',
  '宝': '"宝" with treasure roundness',
};
