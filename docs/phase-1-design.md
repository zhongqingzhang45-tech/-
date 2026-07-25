# Life - Phase 1 设计文档

> 基于 AIRI 开源框架打造的国内版二次元 AI 虚拟伴侣

## 1. 项目定位

Life 是基于 AIRI 开源 AI 虚拟生命框架打造的国内版二次元 AI 虚拟伴侣产品。项目不重复开发 AI Agent、Live2D/VRM 驱动、语音交互、记忆系统等底层能力，而是直接复用 AIRI 成熟技术，通过中文化、本地化和产品包装，将 AIRI 从开发者项目转化为面向国内普通用户的沉浸式 AI 陪伴产品。

### 核心目标

打造国内用户自己的二次元 AI 伙伴，让用户拥有一个可以聊天、互动、陪伴、共同生活的虚拟角色。

### 设计原则

1. **复用优先**：所有底层能力（AI、Live2D、语音、角色驱动）均使用 AIRI 源码，严禁自行创造或重写。
2. **结构守纪**：严格沿用 AIRI 的 monorepo 结构（apps/packages/patches），严禁使用仓库现有项目代码结构之外的私有结构。
3. **本土化优先**：界面、提示词、默认服务商、角色包装均面向国内用户。
4. **品牌独立**：产品命名为「Life」，严禁使用仓库原有项目的任何命名。

## 2. 技术架构

### 2.1 整体架构

```
Life
├── apps/
│   ├── stage-web/              # Web 端（PWA，基于 Vite）
│   ├── stage-tamagotchi/       # 桌面端（Electron + electron-vite）
│   └── server/                 # 后端服务（Phase 2 规划）
├── packages/
│   ├── stage-ui/               # 共享 UI 库（stores/components/composables）
│   ├── stage-ui-live2d/        # Live2D 运行时（Cubism SDK 驱动）
│   ├── stage-ui-three/         # VRM/Three.js 运行时
│   ├── i18n/                   # 国际化（zh-Hans 为默认）
│   ├── core-agent/             # AI Agent 核心
│   └── ...                     # 其他 AIRI 原生模块
└── patches/                    # 依赖补丁
```

### 2.2 关键技术选型

| 能力 | 选型 | 说明 |
|---|---|---|
| 前端框架 | Vue 3 + Vite | AIRI 原生技术栈 |
| 桌面端 | Electron + electron-vite | AIRI 原生 stage-tamagotchi |
| Live2D 驱动 | Cubism SDK for Web 5.x | 通过 unplugin-live2d-sdk 自动下载 |
| VRM 驱动 | @pixiv/three-vrm | AIRI 原生 stage-ui-three |
| AI Agent | @proj-airi/core-agent | AIRI 原生，支持流式、工具调用 |
| LLM 默认接入 | DeepSeek | 国内可用、OpenAI 兼容协议 |
| 语音识别 | Web Speech API / Whisper | AIRI 原生多 provider 支持 |
| 语音合成 | 浏览器 TTS / 多 provider | AIRI 原生 |
| 国际化 | vue-i18n | 默认 zh-Hans，回退 zh-Hans |
| 状态管理 | Pinia | AIRI 原生 |
| 数据库（Phase 2） | PostgreSQL + pgvector | 记忆系统向量化存储 |
| 后端框架（Phase 2） | Hono + Drizzle ORM | AIRI apps/server 原生栈 |

### 2.3 数据流

```
用户输入（文本/语音）
  ↓
stage-ui/stores/chat.ts → core-agent streamFrom()
  ↓
DeepSeek API（OpenAI 兼容协议）
  ↓
流式响应 → 文本渲染 + Live2D 表情/动作驱动 + TTS 语音合成
  ↓
记忆系统持久化（IndexedDB 本地 / Phase 2 PostgreSQL）
```

## 3. Phase 1 已完成范围

### 3.1 品牌重塑

将 AIRI 重命名为 Life，覆盖所有面向用户的品牌触点：

- [x] `apps/stage-web/index.html`：title 改为「Life - 二次元 AI 虚拟伴侣」，meta description 中文化，移除第三方分析脚本，noscript 文案中文化。
- [x] `apps/stage-web/vite.config.ts`：PWA manifest 的 name/short_name、SpaceCard 的 title/short_description 改为 Life。
- [x] `apps/stage-tamagotchi/electron-builder.config.ts`：appId 改为 `life.companion.app`，productName 改为 `Life`，Win/Mac/Linux executableName 改为 `life`，麦克风/摄像头权限描述中文化，Linux synopsis/description 中文化。
- [x] `apps/stage-tamagotchi/package.json`：build.appId 改为 `life.companion.app`，与 electron-builder.config.ts 对齐。
- [x] `package.json`：根项目 name 改为 `life`，description 改为「Life - 基于 AIRI 的国内版二次元 AI 虚拟伴侣」。
- [x] `packages/i18n/src/locales/zh-Hans/base.yaml`：AI 角色提示词重写，角色名称从 AIRI 改为 Life，背景设定为「面向国内用户的二次元 AI 虚拟伴侣」，说话风格改为「自然亲切的中文」。

### 3.2 中文化

- [x] `apps/stage-web/src/modules/i18n.ts`：默认语言从 `en` 改为 `zh-Hans`，回退语言从 `en` 改为 `zh-Hans`。
- [x] `apps/stage-web/index.html`：`<html lang="zh-Hans">`。
- [x] AI 角色提示词全面中文化（见 3.1）。

### 3.3 默认 LLM 接入

- [x] `packages/stage-ui/src/libs/providers/providers/deepseek/index.ts`：将 DeepSeek 的 `order` 从 4 调整为 0，使其在 provider 列表中置于所有第三方 provider 之前。
- [x] `packages/stage-ui/src/components/scenarios/dialogs/onboarding/onboarding.vue`：
  - 调整 `popularProviders` 顺序，DeepSeek 置于首位，其次为 openai-compatible、ollama、player2 等国内可用的选项。
  - `selectedProviderId` 默认预选 `deepseek`，用户首次进入 onboarding 即默认选中 DeepSeek。

### 3.4 Live2D/VRM 角色资产

- [x] 确认 AIRI 原生资产下载机制：通过 `@proj-airi/unplugin-fetch` 的 `Download` 插件在 Vite `configResolved` 阶段从 `dist.ayaka.moe` 下载 Live2D 模型 zip（hiyori_pro_zh.zip / hiyori_free_zh.zip）和 VRM 模型（AvatarSample_A.vrm / AvatarSample_B.vrm）到 `packages/stage-ui/src/assets/`。
- [x] 确认默认角色加载逻辑：`packages/stage-ui/src/stores/settings/stage-model.ts` 默认 `defaultStageModelId = 'preset-live2d-1'`，对应 Hiyori (Pro) 模型。
- [x] 确认 `packages/stage-ui/src/stores/display-models.ts` 中 `displayModelsPresets` 定义了 4 个预设角色（2 个 Live2D + 2 个 VRM）。

### 3.5 远程沙箱/CI 环境适配

由于远程沙箱环境无法访问 `dist.ayaka.moe` 和 `cubism.live2d.com`，且 inotify 文件监视器配额受限，新增环境变量适配：

- [x] `LIFE_SKIP_ASSET_DOWNLOAD=1`：跳过 Live2D/VRM 模型资产与 Cubism SDK 下载，让 dev server 在缺资产状态下也能启动（模型加载会在运行时降级）。已在 `apps/stage-web/vite.config.ts` 和 `apps/stage-tamagotchi/electron.vite.config.ts` 中实现 `buildAssetDownloadPlugins()` 函数统一控制。
- [x] `LIFE_USE_POLLING_WATCH=1`：将 Vite 文件监视切换为轮询模式，避免 `ENOSPC: System limit for number of file watchers reached` 错误。已在 `apps/stage-web/vite.config.ts` 的 `server.watch` 中实现。

### 3.6 可运行验证

- [x] `pnpm install --ignore-scripts` 成功安装全部 monorepo 依赖。
- [x] `LIFE_SKIP_ASSET_DOWNLOAD=1 LIFE_USE_POLLING_WATCH=1 pnpm dev:web` 成功启动 dev server，监听 `http://localhost:5173/`。
- [x] 首页 HTTP 200，`<title>Life - 二次元 AI 虚拟伴侣</title>` 正确渲染。
- [x] `apps/stage-tamagotchi` 桌面端结构就绪：main/preload/renderer 入口文件齐备，electron-builder.config.ts 与 electron.vite.config.ts 配置完整。

## 4. 用户能力矩阵（Phase 1 已支持）

| 用户需求 | Phase 1 状态 | 实现方式 |
|---|---|---|
| AI 虚拟伴侣角色展示 | ✅ | AIRI 原生 Live2D/VRM 驱动，4 个预设角色 |
| 角色模型导入和切换 | ✅ | AIRI 原生 model-selector，支持 Live2D zip / VRM / Spine / MMD |
| 角色人格设定 | ✅ | AIRI 原生 characters store + character-defaults 提示词 |
| 智能聊天交流 | ✅ | AIRI 原生 chat store + core-agent，默认接入 DeepSeek |
| 实时语音对话 | ✅ | AIRI 原生 Web Speech API / Whisper ASR + TTS |
| 角色表情/眨眼/视线跟随 | ✅ | AIRI 原生 stage-ui-live2d（expression-controller / eye-tracking / beat-sync） |
| 语音同步互动 | ✅ | AIRI 原生 beat-sync + lip-sync |
| 个人设置管理 | ✅ | AIRI 原生 settings stores（本地 localStorage / IndexedDB） |
| AI 伴侣配置保存 | ✅ | AIRI 原生 provider credentials + character config 本地持久化 |
| 聊天数据管理 | ✅ | AIRI 原生 chat history 本地持久化 |
| 多设备访问支持 | ⏳ Phase 2 | 需后端账号系统 + 数据同步 |

## 5. 后续 Phase 规划

### Phase 2：账号系统与后端服务

- 用户注册登录（邮箱/手机号/第三方 OAuth）
- PostgreSQL + pgvector 部署
- Hono + Drizzle 后端 API（基于 `apps/server`）
- 聊天记忆云端同步
- 多设备数据同步
- AI 伴侣配置云端保存

### Phase 3：个性化与社区

- 角色市场（用户分享 AI 伴侣）
- 角色展示社区
- 用户交流互动（评论/点赞/收藏）
- 自定义角色性格深度配置
- 多 AI 模型切换（DeepSeek / 通义千问 / 智谱 / 月之暗面等）

### Phase 4：商业化

- 会员订阅服务（Pro/Plus 分级）
- 角色扩展服务（付费角色包）
- 增值内容服务（高级语音/视觉能力）
- 创作者激励（角色作者分成）

## 6. 开发环境快速启动

### 本地开发（可访问 dist.ayaka.moe）

```bash
pnpm install
pnpm dev:web          # Web 端 http://localhost:5173/
pnpm dev:desktop      # Electron 桌面端
```

### 远程沙箱/CI 环境

```bash
pnpm install --ignore-scripts
LIFE_SKIP_ASSET_DOWNLOAD=1 LIFE_USE_POLLING_WATCH=1 pnpm dev:web
```

### 环境变量说明

| 变量 | 作用 | 默认 |
|---|---|---|
| `LIFE_SKIP_ASSET_DOWNLOAD` | 跳过 Live2D/VRM/Cubism SDK 下载 | 未设置（即下载） |
| `LIFE_USE_POLLING_WATCH` | Vite 文件监视切换为轮询模式 | 未设置（即 inotify） |

## 7. 已知限制

1. **远程沙箱模型资产缺失**：`LIFE_SKIP_ASSET_DOWNLOAD=1` 时 Live2D/VRM 模型不会下载，首次加载角色会失败。本地开发环境正常运行。
2. **DeepSeek API Key 需用户自行配置**：onboarding 流程会引导用户输入 API Key，Life 不内置任何凭证。
3. **Electron 桌面端未在沙箱验证**：远程沙箱无 display，仅验证配置结构就绪，实际运行需在本地或 CI with display 环境。
4. **后端服务未启动**：Phase 1 仅前端 + 本地持久化，账号系统与云端同步在 Phase 2 实现。
