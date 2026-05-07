# 转介绍活动物料 Agent (v0)

给运营用：选活动 + 选页面 + 填关键信息 + 选风格 → 调 apimart 出图 → 优化 → 导出 brief 给 UI/Figma Make。

## 现在能跑通什么

- 选活动（v0 固定为「转介绍-硬件外化」）
- 选页面（小程序卡片 / 推广海报，多选）
- 粘 PRD，或用 8 个关键问题快速填
- 上传参考图（v0：仅记录，不参与 img2img；v1 会接 gpt-image-2）
- 写运营特殊指令、覆盖设计规范
- 选风格（5 个，多选 → 每个风格各出一张）
- 调 apimart 异步任务流，前端轮询拿图
- prompt 内置严格字体约束：禁止繁体字 / 错字 / 乱码 / 伪中文，标题字形可体现词义（"秀"的张扬、"赢"下面的贝厚重等）
- 每张图给 3 个建议优化方向 + 自然语言 → 重新生图
- **导出 4 种真可交付物**：
  - **PSD**：服务端用 ag-psd 真生 PSD（底图 + 11 个命名占位图层），PS 直接打开
  - **HTML**：单文件，contenteditable 可改字
  - **可编辑 Figma**：导 HTML 后用 [html.to.design](https://html.to.design) 插件 Import 到 Figma
  - **前端代码**：React 组件 + CSS，文案 / 图 url 都是 prop
- 折叠区还有完整 brief（JSON / Markdown），给 PM 沉淀用

## 怎么跑

需要 Node 18+。

```bash
cd referral-material-agent
cp .env.example .env       # 已经有 .env 就跳过
# 编辑 .env，填入 APIMART_KEY
npm start                  # 等价于 node server.js
# 浏览器打开 http://localhost:5174
```

> ⚠️ `.env` 已加到 `.gitignore`。**别把 key commit 进 git**；如果之前在聊天 / 截图里贴过，做一次轮转。

## 信息结构

```
活动 (Activity)            ← 转介绍-硬件外化（v0 固定）
├── 页面 (Page)             ← 小程序卡片 / 推广海报
└── 风格 (Style) × 多选     ← 5 个：漫画晒娃 / 奖品强刺激 / 手绘童趣 / 季节场景 / 科技专业

生图条数 = 选中页面数 × 选中风格数
```

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 三栏 UI |
| `styles.css` | 样式 |
| `app.js` | 前端：状态、渲染、生图、轮询、导出 |
| `data.js` | 活动 / 页面 / 风格 / 关键问题 / 优化选项 / 默认设计规范（"后台"占位） |
| `prompts.js` | 5×2=10 个 prompt 模板 + 优化拼接 + 优化方向建议 |
| `server.js` | Node http 服务，无 npm 依赖；代理 apimart |
| `.env` | API key（**不要 commit**） |

## 模型路由

| 场景 | 模型 | 端点 | 模式 |
|---|---|---|---|
| 默认（中文文字渲染） | `qwen-image-2.0-pro` | `/v1/images/generations` | 异步任务 |
| 接 img2img（v1 待加） | `gpt-image-2` | 同上，body 加 `image: data:image/...` | 异步任务 |

异步任务流：
1. POST `/v1/images/generations` → 返回 `task_id`
2. GET `/v1/tasks/{task_id}` → 轮询直到 `status: completed`
3. 拿到 `result.images[].url`

## 加东西的入口

- **新风格**：`data.js` 的 `styles` + `prompts.js` 的 `T[pageId][styleId]`
- **新页面**：`data.js` 的 `pages` + 在每个 style 里加对应模板
- **新活动模板**：把 `activityTemplate` 改成数组 / 表（v0 暂未做下拉）
- **新关键问题**：`data.js` 的 `keyQuestions`
- **新优化方向**：`data.js` 的 `optimizationOptions`（带 `addon` 是要拼到 prompt 里的英文片段）

## 已知 v0 局限

- 参考图不参与 img2img（待 v1）
- "后台" 是 `data.js` 里写死的，没真后台 / 没沉淀 UI
- 优化建议是基于风格的固定映射，没接 LLM
- 导出 brief 后还是要人手到 Figma Make / html-to-design 里跑
- 中文艺术字 AI 渲染稳定性有限，PSD/Figma 阶段还会要 UI 调整

## 几个 v1 候选要做的

- 接 LLM 把"运营大白话"翻成专业 prompt 优化建议
- 真"后台"：design tokens / 关键问题 / 历史活动 prompt 沉淀
- 参考图走 gpt-image-2 img2img
- PRD 上传走解析（mammoth.js）而非粘贴
- 直接对接 html-to-design 出可编辑 Figma
