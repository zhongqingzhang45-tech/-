# LifeOS Social 设计规范

> 本文档是 LifeOS Social（AI 数字生命体 + 社区）项目的视觉与主题唯一权威。
> 任何 UI 实现必须遵守本文档，禁止凭感觉取色、取值。
> AI Agent 开发前必须先读本文件全文。

---

## 0. 文档版本与适用范围

| 项 | 值 |
|---|---|
| 文档版本 | 1.0.0 |
| 适用项目 | LifeOS Social（apps/lifeos-web、packages/* 前端部分） |
| UI 组件库 | Naive UI（唯一，禁止跨库混用） |
| 样式系统 | UnoCSS（原子类）+ Naive UI 主题变量 + CSS 自定义属性 |
| 暗色策略 | 深色为默认主调，亮色对等支持，双模式语义 token |

---

## 1. 设计哲学

### 1.1 风格关键词

```
沉浸深色 / 情绪化点缀 / 可定制 / 低权威感 / 内容优先 / 软边界 / 暖中性
```

### 1.2 三条铁律

1. **UI 退让内容**：UI 框架保持中性深色，把色彩权交给用户内容（气泡色、头像、AI 形象）和 AI 情绪状态。UI 不应比二次元内容更花哨。
2. **情绪驱动主色**：AI 的 PAD 情绪状态可微调界面色温（hue/saturation/lightness 偏移 ±15°/±10%/±10%），通过 `n-config-provider` 运行时注入。
3. **双模式语义化**：组件只引用语义 token（如 `--color-bg-surface`），禁止直接使用原始色值（如 `#0F0E13`）。暗/亮模式切换只改变语义层的解析值。

### 1.3 视觉参考

- **蔷薇花园 IIROSE**：深色沉浸 + 用户可定制气泡色 + 房间壁纸
- **差异化**：新增 AI 情绪色温系统（iirose 无）+ 双模式（iirose 仅深色）

---

## 2. 调色板（原始色值，禁止直接使用）

> 原始色值仅供 token 定义引用，组件层一律走语义层。

### 2.1 主色 Rose（生命 / 情感 / 用户侧）

| Token | Hex | 用途 |
|---|---|---|
| `--rose-50` | `#FFF1F6` | 主色最浅背景 |
| `--rose-100` | `#FFE4ED` | hover 浅底 |
| `--rose-200` | `#FFC9DC` | 标签浅底 |
| `--rose-300` | `#FF9EBA` | 边框浅 |
| `--rose-400` | `#FF6F95` | hover 态 |
| `--rose-500` | `#E84A8C` | **主色基准** |
| `--rose-600` | `#C73272` | 按下态 |
| `--rose-700` | `#A5245E` | 深色强调 |
| `--rose-800` | `#871F4F` | 深底文字 |
| `--rose-900` | `#6B1B40` | 极深底 |

### 2.2 辅助色 Violet（AI / 科技 / 系统侧）

| Token | Hex | 用途 |
|---|---|---|
| `--violet-50` | `#F3F0FF` | |
| `--violet-100` | `#E5DEFF` | |
| `--violet-200` | `#C9BCFF` | |
| `--violet-300` | `#AC97FF` | |
| `--violet-400` | `#9B7BF7` | |
| `--violet-500` | `#8B5CF6` | **AI 色基准** |
| `--violet-600` | `#7342E8` | |
| `--violet-700` | `#5E33C7` | |
| `--violet-800` | `#4A299E` | |
| `--violet-900` | `#3A2178` | |

### 2.3 中性色（暖调灰，深色微紫）

| Token | Hex | 用途 |
|---|---|---|
| `--gray-0` | `#FFFFFF` | 纯白（仅高对比强调用） |
| `--gray-50` | `#FAF8FB` | 亮色页面底（暖白） |
| `--gray-100` | `#F2EEF5` | 亮色卡片底 |
| `--gray-200` | `#E5E0EC` | 亮色边框 |
| `--gray-300` | `#CFC8D8` | 亮色禁用 |
| `--gray-400` | `#9C95A8` | 二级文本 |
| `--gray-500` | `#6E6878` | 三级文本 |
| `--gray-600` | `#484352` | 深色二级文本 |
| `--gray-700` | `#2A2733` | 深色边框 |
| `--gray-800` | `#1A1820` | 深色卡片底 |
| `--gray-850` | `#14121A` | 深色 elevated 表面 |
| `--gray-900` | `#0F0E13` | **深色页面底（微紫调暗色）** |
| `--gray-950` | `#08070B` | 深色最底（OLED 黑） |

### 2.4 语义色

| Token | Hex（深/亮） | 用途 |
|---|---|---|
| `--success-500` | `#3DD68C` / `#16A34A` | 成功 |
| `--warning-500` | `#FFB547` / `#D97706` | 警告 |
| `--error-500` | `#FF5C7A` / `#DC2626` | 错误 |
| `--info-500` | `#5BB8FF` / `#0284C7` | 信息 |

每个语义色配套 50/100/700 三档辅助色，定义见 `uno.config.ts`。

---

## 3. 语义 Token（组件层唯一允许引用的色）

> 切换暗/亮模式 = 切换 `<html data-theme>` 属性，语义层重写，组件代码零改动。

### 3.1 深色模式（默认）

```css
[data-theme='dark'] {
  /* 背景层 */
  --color-bg-base: var(--gray-900);          /* 页面底 */
  --color-bg-surface: var(--gray-800);       /* 卡片底 */
  --color-bg-elevated: var(--gray-850);     /* 弹层/抽屉 */
  --color-bg-overlay: rgba(8,7,11,0.72);     /* 遮罩 */

  /* 文本层 */
  --color-text-primary: rgba(255,255,255,0.92);    /* #EAEAEA */
  --color-text-secondary: rgba(255,255,255,0.62);  /* #9E9E9E */
  --color-text-tertiary: rgba(255,255,255,0.38);   /* #616161 */
  --color-text-disabled: rgba(255,255,255,0.24);
  --color-text-inverse: var(--gray-900);

  /* 边框 */
  --color-border: rgba(255,255,255,0.08);
  --color-border-strong: rgba(255,255,255,0.16);
  --color-border-focus: var(--rose-400);

  /* 品牌色（组件引用） */
  --color-primary: var(--rose-500);
  --color-primary-hover: var(--rose-400);
  --color-primary-active: var(--rose-600);
  --color-primary-bg: rgba(232,74,140,0.12);     /* 主色浅底（标签/选中态） */
  --color-primary-bg-hover: rgba(232,74,140,0.18);

  /* AI 色 */
  --color-ai: var(--violet-500);
  --color-ai-bg: rgba(139,92,246,0.12);

  /* 语义 */
  --color-success: var(--success-500);
  --color-warning: var(--warning-500);
  --color-error: var(--error-500);
  --color-info: var(--info-500);
}
```

### 3.2 亮色模式

```css
[data-theme='light'] {
  --color-bg-base: var(--gray-50);
  --color-bg-surface: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-bg-overlay: rgba(15,14,19,0.48);

  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-600);
  --color-text-tertiary: var(--gray-500);
  --color-text-disabled: var(--gray-300);
  --color-text-inverse: #FFFFFF;

  --color-border: var(--gray-200);
  --color-border-strong: var(--gray-300);
  --color-border-focus: var(--rose-500);

  --color-primary: var(--rose-500);
  --color-primary-hover: var(--rose-600);
  --color-primary-active: var(--rose-700);
  --color-primary-bg: var(--rose-50);
  --color-primary-bg-hover: var(--rose-100);

  --color-ai: var(--violet-500);
  --color-ai-bg: var(--violet-50);

  --color-success: var(--success-500-light);
  --color-warning: var(--warning-500-light);
  --color-error: var(--error-500-light);
  --color-info: var(--info-500-light);
}
```

### 3.3 状态色规则

| 状态 | 实现方式 |
|---|---|
| 默认 | `--color-primary` |
| Hover | `--color-primary-hover` |
| Active / 按下 | `--color-primary-active` |
| 选中态（selected / active tab） | 主色文字 + `--color-primary-bg` 背景 |
| 禁用 | `opacity: 0.4` + `cursor: not-allowed` |
| 焦点 | `box-shadow: 0 0 0 2px var(--color-border-focus)` |

### 3.4 AI 情绪色温覆盖（运行时）

```ts
// packages/stage-ui/src/theme/emotion-theme.ts
// 由 EmotionEngine 输出 PAD 值，计算 hue/sat/lightness 偏移，
// 注入 n-config-provider 的 themeOverrides.common.primaryColor
// 偏移范围硬上限：hue ±15°, saturation ±10%, lightness ±10%
```

| 情绪 | PAD | hue | sat | light |
|---|---|---|---|---|
| 开心兴奋 | V+,A+ | +5° | +10% | +5% |
| 平静 | V+,A- | 0 | 0 | 0 |
| 难过 | V-,A- | -15° | -8% | -5% |
| 紧张 | V-,A+ | -5° | 0 | -10% |
| 自信 | D+ | 0 | +5% | 0 |

---

## 4. 字体系统

### 4.1 字体族

```css
--font-sans: 'HarmonyOS Sans SC', 'Noto Sans SC', -apple-system,
             BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC',
             'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
--font-display: var(--font-sans);  /* 暂用同一族，靠字重区分 */
```

### 4.2 字号梯度（1.125 模数，root 16px）

| Token | px | rem | 用途 |
|---|---|---|---|
| `--text-xs` | 12 | 0.75 | 辅助说明、时间戳 |
| `--text-sm` | 14 | 0.875 | 正文小、表单标签 |
| `--text-base` | 16 | 1 | 正文默认 |
| `--text-lg` | 18 | 1.125 | 强调正文 |
| `--text-xl` | 20 | 1.25 | 子标题 |
| `--text-2xl` | 24 | 1.5 | h4 / 卡片标题 |
| `--text-3xl` | 30 | 1.875 | h3 |
| `--text-4xl` | 36 | 2.25 | h2 |
| `--text-5xl` | 48 | 3 | h1 |
| `--text-6xl` | 60 | 3.75 | Display（首屏大字） |

### 4.3 字重

| Token | 值 | 用途 |
|---|---|---|
| `--font-regular` | 400 | 正文 |
| `--font-medium` | 500 | 按钮、强调正文 |
| `--font-semibold` | 600 | 子标题 |
| `--font-bold` | 700 | 标题 |

### 4.4 行高

| Token | 值 | 用途 |
|---|---|---|
| `--leading-tight` | 1.15 | 标题 |
| `--leading-snug` | 1.3 | 子标题 |
| `--leading-normal` | 1.5 | 正文 |
| `--leading-relaxed` | 1.75 | 长文阅读（社区帖子正文） |

### 4.5 字间距

| Token | 值 | 用途 |
|---|---|---|
| `--tracking-tight` | -0.02em | 大标题 |
| `--tracking-normal` | 0 | 正文 |
| `--tracking-wide` | 0.02em | 标签、按钮 |

---

## 5. 圆角系统

| Token | px | 用途 |
|---|---|---|
| `--radius-none` | 0 | 分隔线 |
| `--radius-sm` | 4 | 标签、小徽章 |
| `--radius-md` | 8 | 按钮、输入框、小卡片 |
| `--radius-lg` | 12 | 卡片、面板 |
| `--radius-xl` | 16 | 模态、抽屉、大面板 |
| `--radius-2xl` | 24 | Hero、首屏大容器 |
| `--radius-full` | 9999 | 头像、药丸标签 |

**原则**：二次元偏柔软，但禁用 >24px 圆角（会显廉价）。同一视觉层级圆角统一。

---

## 6. 间距系统（4px 基准）

| Token | px | 用途 |
|---|---|---|
| `--space-0` | 0 | |
| `--space-1` | 4 | 图标与文字间距 |
| `--space-2` | 8 | 紧凑元素内边距 |
| `--space-3` | 12 | 标签、小按钮内边距 |
| `--space-4` | 16 | 默认内边距、表单元素间距 |
| `--space-5` | 20 | |
| `--space-6` | 24 | 卡片内边距、区块间距 |
| `--space-8` | 32 | 大区块间距 |
| `--space-10` | 40 | |
| `--space-12` | 48 | 模块间距 |
| `--space-16` | 64 | 页面级间距 |
| `--space-20` | 80 | |
| `--space-24` | 96 | 首屏大间距 |

**原则**：组件内部用 4/8/12，组件间距用 16/24，页面级用 32+。

---

## 7. 阴影 / 层级系统

> 深色模式下阴影几乎不可见，**用表面明度差表达层级**（参考 Material Design elevation）。

### 7.1 深色模式（明度差）

| Token | 表面色 | 用途 |
|---|---|---|
| `--elevation-0` | `--gray-900` | 页面底 |
| `--elevation-1` | `--gray-800` | 卡片（+1 层） |
| `--elevation-2` | `--gray-850` | 抽屉、弹层（+1.5 层） |
| `--elevation-3` | `--gray-850` + 顶部高光边 | 导航栏 |
| `--elevation-4` | `--gray-850` + 顶部高光边 | FAB |
| `--elevation-5` | `--gray-850` + 遮罩 | 模态 |

### 7.2 亮色模式（阴影）

```css
--shadow-sm: 0 1px 2px rgba(15,14,19,0.06);
--shadow-md: 0 2px 8px rgba(15,14,19,0.08);
--shadow-lg: 0 8px 24px rgba(15,14,19,0.12);
--shadow-xl: 0 16px 48px rgba(15,14,19,0.16);
--shadow-glow: 0 0 0 1px var(--color-primary), 0 0 16px rgba(232,74,140,0.4);
```

`--shadow-glow` 用于 AI 强调态（如 AI 主动发言时头像光晕）。

---

## 8. 动效系统

### 8.1 时长

| Token | ms | 用途 |
|---|---|---|
| `--duration-instant` | 0 | 状态切换 |
| `--duration-fast` | 150 | hover、focus |
| `--duration-base` | 200 | 默认过渡 |
| `--duration-slow` | 300 | 弹层进出 |
| `--duration-slower` | 500 | 页面切换、大动画 |

### 8.2 缓动

| Token | cubic-bezier | 用途 |
|---|---|---|
| `--ease-standard` | `(0.4, 0, 0.2, 1)` | 默认 |
| `--ease-emphasized` | `(0.2, 0, 0, 1)` | 进场、强调 |
| `--ease-bounce` | `(0.34, 1.56, 0.64, 1)` | 弹性（点赞、礼物） |

### 8.3 原则

- AI 主动行为（发帖、消息）入场用 `--ease-emphasized` + `--duration-slow`，营造"生命感"
- 用户交互反馈用 `--ease-standard` + `--duration-fast`
- 禁用线性 `linear`（除非进度条）

---

## 9. Z-Index 层级

| Token | 值 | 用途 |
|---|---|---|
| `--z-base` | 0 | 默认 |
| `--z-sticky` | 1100 | 吸顶导航 |
| `--z-dropdown` | 1200 | 下拉 |
| `--z-drawer` | 1300 | 抽屉 |
| `--z-modal` | 1400 | 模态 |
| `--z-popover` | 1500 | 气泡提示 |
| `--z-toast` | 1600 | Toast |
| `--z-tooltip` | 1700 | Tooltip |
| `--z-live2d-overlay` | 900 | Live2D 渲染层（在内容之上、控件之下） |

> Live2D/VRM 画布 z-index 固定 900，避免遮挡关键控件，且禁止被响应式数据驱动。

---

## 10. 响应式断点

| Token | px | 用途 |
|---|---|---|
| `--bp-sm` | 640 | 手机横屏 |
| `--bp-md` | 768 | 平板竖屏 |
| `--bp-lg` | 1024 | 平板横屏 / 小桌面 |
| `--bp-xl` | 1280 | 桌面 |
| `--bp-2xl` | 1536 | 大桌面 |

**移动优先**：默认写 mobile 样式，`@media (min-width: --bp-md)` 起叠加。

---

## 11. 组件用色规则（速查）

| 组件 | 背景 | 文字 | 边框 |
|---|---|---|---|
| 主按钮 | `--color-primary` | `#FFFFFF` | 无 |
| 主按钮 hover | `--color-primary-hover` | `#FFFFFF` | 无 |
| 次按钮 | `--color-bg-surface` | `--color-text-primary` | `--color-border-strong` |
| 文字按钮 | transparent | `--color-primary` | 无 |
| 标签（tag）默认 | `--color-bg-surface` | `--color-text-secondary` | `--color-border` |
| 标签选中 | `--color-primary-bg` | `--color-primary` | 透明 |
| 输入框 | `--color-bg-surface` | `--color-text-primary` | `--color-border` |
| 输入框 focus | `--color-bg-surface` | `--color-text-primary` | `--color-border-focus` + 2px ring |
| 卡片 | `--color-bg-surface` | `--color-text-primary` | `--color-border` |
| 弹层 | `--color-bg-elevated` | `--color-text-primary` | `--color-border-strong` |
| AI 消息气泡 | `--color-ai-bg` | `--color-text-primary` | 透明 |
| 用户消息气泡 | `--color-primary-bg` | `--color-text-primary` | 透明 |

---

## 12. 主题切换实现

```ts
// apps/lifeos-web/src/stores/theme.ts
// 切换只改 <html data-theme>，CSS 变量自动重写
// 首屏 anti-FOUC：在 index.html <head> 内联同步脚本读 localStorage
// 默认值：dark（深色为默认主调）
```

```html
<!-- apps/lifeos-web/index.html -->
<script>
  (function(){
    var t = localStorage.getItem('lifeos-theme') || 'dark';
    document.documentElement.dataset.theme = t;
  })();
</script>
```

---

## 13. 与 Naive UI 的对接

### 13.1 全局 ConfigProvider

```ts
// apps/lifeos-web/src/app/providers.tsu
// 使用 n-config-provider 包裹根
// themeOverrides.common 注入：
//   - primaryColor: var(--color-primary) 的实际值
//   - borderRadius: var(--radius-md)
//   - fontFamily: var(--font-sans)
// 由 emotion-theme.ts 在运行时覆盖 primaryColor（情绪色温）
```

### 13.2 不复用 Naive 默认主题色

- Naive 默认主色为绿色 `#18a058`，**必须覆盖**为 `--rose-500`
- Naive 默认圆角为 3px，**必须覆盖**为 `--radius-md` (8px)
- Naive 默认字体可能不含 CJK，**必须覆盖**为 `--font-sans`

### 13.3 禁用项

- ❌ 禁止引入 Element Plus / Ant Design Vue / Arco Vue / Vuetify 等其他通用 UI 库
- ❌ 禁止在组件内硬编码色值（如 `color: #E84A8C`）
- ❌ 禁止使用 Naive 默认主题色（必须覆盖）
- ✅ 自研 `packages/stage-ui` / `stage-ui-live2d` / `stage-ui-three` 不视为第三方库，保留

---

## 14. 自我审查清单

实现 UI 前后，对照本清单：

- [ ] 是否所有颜色都通过语义 token 引用？（无硬编码 hex）
- [ ] 暗色模式下文字对比度是否 ≥ 4.5:1？（WCAG AA）
- [ ] 圆角是否与同层级元素一致？
- [ ] 间距是否落在 4px 栅格上？
- [ ] 动效是否使用了 token 中的 duration/easing？
- [ ] AI 相关元素是否使用 `--color-ai` 而非主色？
- [ ] 是否在 `<html data-theme>` 切换下两模式都正常？
- [ ] Live2D/VRM 画布是否避开了响应式系统（shallowRef + markRaw）？

---

## 15. 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| 1.0.0 | 2026-07-12 | 初版：定主色 Rose + 辅 Violet，Naive UI，双模式 token |
