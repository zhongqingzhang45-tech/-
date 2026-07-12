# LifeOS Social 开发规则

> 本文档是 LifeOS Social 项目的工程规范权威。
> 任何代码贡献（人或 AI Agent）必须先读本文件并严格遵守。
> 违反本文档的 PR 一律打回。

---

## 0. 文档版本与适用范围

| 项 | 值 |
|---|---|
| 文档版本 | 1.0.0 |
| 适用项目 | LifeOS Social monorepo |
| 强制前置阅读 | `docs/design-system.md`（设计规范）+ 本文件 |
| 违反后果 | PR 打回 + CI 失败 |

---

## 1. 技术栈锁定

### 1.1 允许的技术

| 层面 | 技术 | 版本约束 |
|---|---|---|
| 前端框架 | Vue 3 + Composition API | `^3.5` |
| 构建工具 | Vite | `^8.0`（Rolldown 内核） |
| 路由 | Vue Router | `^4` |
| 状态管理 | Pinia | `^3` |
| 样式系统 | UnoCSS | `^66` |
| **UI 组件库** | **Naive UI** | **跟随最新稳定 2.x** |
| 后端框架 | Hono | `^4.11` |
| ORM | drizzle-orm | `^0.45` |
| 数据库 | PostgreSQL | `^16`（需 pgvector 扩展） |
| 缓存 | Redis（ioredis） | `^5.10` |
| 认证 | better-auth | `^1.6` |
| 3D 渲染 | Three.js + @pixiv/three-vrm | `^0.184 / ^3.5` |
| Live2D | pixi-live2d-display | `^0.4` |
| LLM | xsai | `^0.5.0-beta`（标注：beta，需有 fallback） |
| 包管理 | pnpm | workspace 模式 |
| Node | `^20.19` 或 `^22.12`（Vite 8 要求） |

### 1.2 禁止项

- ❌ 禁止引入第二套通用 UI 组件库（Element Plus / Ant Design Vue / Arco Vue / Vuetify 等任一）
- ❌ 禁止用 Tailwind CSS（已选 UnoCSS，避免双引擎冲突）
- ❌ 禁止用 Vuex（已选 Pinia）
- ❌ 禁止用 Express / Fastify（已选 Hono）
- ❌ 禁止用 Prisma（已选 drizzle-orm）
- ❌ 禁止在组件内硬编码色值 / 字号 / 圆角 / 间距（必须走 design token）
- ✅ 自研 `packages/stage-ui` / `stage-ui-live2d` / `stage-ui-three` / `core-agent` / `server-runtime` / `memory-pgvector` 不视为第三方库

---

## 2. Monorepo 目录结构

```
lifeos-social/
├── AGENTS.md                    # AI Agent 索引（必读）
├── docs/
│   ├── design-system.md         # 设计规范
│   └── development-rules.md     # 本文件
├── apps/
│   ├── lifeos-web/              # 用户前端（Vue3 + Vite）
│   │   ├── src/
│   │   │   ├── pages/           # 路由页面（按业务域分目录）
│   │   │   ├── components/      # 业务组件（非通用）
│   │   │   ├── composables/     # 组合式函数
│   │   │   ├── stores/          # Pinia stores
│   │   │   ├── api/             # 后端 API 调用封装
│   │   │   ├── router/          # 路由定义
│   │   │   ├── providers/       # 全局 provider（n-config-provider 等）
│   │   │   ├── assets/          # 静态资源
│   │   │   ├── styles/          # 全局样式、token 入口
│   │   │   └── main.ts
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── uno.config.ts        # UnoCSS 配置 + token 注入
│   │   └── tsconfig.json
│   └── server/                  # 后端 API
│       ├── src/
│       │   ├── routes/          # Hono 路由（按业务域分目录）
│       │   ├── schemas/         # drizzle schema
│       │   ├── services/        # 业务逻辑层
│       │   ├── middleware/
│       │   ├── ws/              # WebSocket 端点
│       │   └── index.ts
│       └── drizzle.config.ts
├── packages/
│   ├── core-agent/              # ChatOrchestratorRuntime 核心
│   ├── lifeos-core/             # LifeOS 9 个引擎
│   │   └── src/engines/
│   │       ├── emotion-engine.ts
│   │       ├── relationship-engine.ts
│   │       ├── autonomous-behavior.ts
│   │       ├── time-engine.ts
│   │       ├── event-engine.ts
│   │       ├── goal-engine.ts
│   │       ├── story-engine.ts
│   │       ├── interest-engine.ts
│   │       └── memory-engine.ts
│   ├── stage-ui/                # 自研 UI 组件库 + stores
│   ├── stage-ui-live2d/         # Live2D 渲染
│   ├── stage-ui-three/          # VRM/3D 渲染
│   ├── server-runtime/          # 服务端运行时
│   └── memory-pgvector/         # 记忆系统（扩展）
├── services/                    # 独立服务
│   ├── discord-bot/
│   ├── telegram-bot/
│   ├── minecraft/
│   ├── twitter-services/
│   ├── satori-bot/
│   └── computer-use-mcp/
├── tests/
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

### 2.1 命名规则

- 目录/文件：`kebab-case`（如 `feed-post.vue`、`emotion-engine.ts`）
- Vue 组件文件：`kebab-case.vue`，组件名 PascalCase（`FeedPost`）
- TS 变量/函数：`camelCase`
- TS 类型/接口/枚举：`PascalCase`
- 常量：`UPPER_SNAKE_CASE`
- CSS 类（非 UnoCSS）：`kebab-case`
- 数据库表名：`snake_case`（如 `community_posts`）
- 数据库字段：`snake_case`
- API 路由：`kebab-case` URL

---

## 3. 组件复用规则

### 3.1 三层组件来源

| 层 | 来源 | 何时用 |
|---|---|---|
| L1 | Naive UI | 通用基础组件（按钮、输入、表格、模态等） |
| L2 | `packages/stage-ui` | 跨业务复用的自研组件（如情绪指示器、关系进度条） |
| L3 | `apps/lifeos-web/src/components` | 单一业务专用组件 |

### 3.2 决策树

```
需要 UI 组件
├─ 是通用基础？→ 用 Naive UI（禁止重造）
├─ 跨 2+ 业务复用？→ 提到 packages/stage-ui
└─ 单业务专用？→ 放 apps/lifeos-web/src/components/<domain>/
```

### 3.3 Live2D / VRM 组件硬规则

```ts
// ✅ 正确：用 shallowRef + markRaw，禁止进入响应式
import { shallowRef, markRaw } from 'vue'
const live2dModel = shallowRef<Live2DModel | null>(null)
live2dModel.value = markRaw(new Live2DModel(...))

// ❌ 错误：直接 ref 会让 Live2D 内部对象被响应式代理，性能毁灭
const live2dModel = ref<Live2DModel | null>(null) // 禁止
```

- 渲染循环独立于 Vue reactivity，通过事件 / 命令模式通信
- 画布 z-index 固定 `--z-live2d-overlay` (900)
- 模型实例禁止作为 props 向下传递，用 provide/inject + shallowRef

### 3.4 组件 props 规则

- 必须声明类型（TS interface），禁止 `any`
- 必须有默认值或 required 标记
- 复杂对象 prop 用 `shallowRef` / `markRaw` 接收
- 事件用 `defineEmits` 显式声明

### 3.5 组件粒度

- 单组件 ≤ 300 行（SFC 总行数），超出必须拆分
- 单组件职责单一，禁止"上帝组件"

---

## 4. 状态管理规则

### 4.1 何时用 Pinia

- 跨组件共享状态 → Pinia
- 跨路由持久状态 → Pinia + 持久化插件
- 仅组件内状态 → `ref` / `reactive`，不进 Pinia

### 4.2 Store 命名与位置

```
apps/lifeos-web/src/stores/
├── theme.ts          # useThemeStore
├── auth.ts           # useAuthStore
├── community.ts      # useCommunityStore
└── digital-life.ts   # useDigitalLifeStore
```

- 文件名 `kebab-case.ts`
- 导出函数 `use<Domain>Store`
- 禁止在 store 内直接调 API，调用走 `api/` 层

### 4.3 异步状态

```ts
// ✅ 用 setup 风格 store
export const useCommunityStore = defineStore('community', () => {
  const posts = ref<Post[]>([])
  async function loadFeed() { ... }
  return { posts, loadFeed }
})
```

---

## 5. 样式规则

### 5.1 样式来源优先级

1. UnoCSS 原子类（首选）
2. Naive UI 内置样式（组件库自带）
3. 组件 `<style scoped>`（仅当 1、2 无法表达时）
4. 全局 CSS（仅 token 定义、reset、字体）

### 5.2 Token 引用

```vue
<!-- ✅ 正确 -->
<template>
  <div class="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] rounded-[var(--radius-lg)]">
    ...
  </div>
</template>

<!-- ❌ 错误：硬编码 -->
<template>
  <div style="background:#1A1820;color:#fff;border-radius:12px">...</div>
</template>
```

### 5.3 UnoCSS 配置

- `uno.config.ts` 中将 design token 注册为 theme，支持 `bg-surface` / `text-primary` 等语义类名
- 禁止在 `uno.config.ts` 之外定义新色值

### 5.4 暗色模式

- 切换只改 `<html data-theme>`，组件代码零改动
- 禁止用 `@media (prefers-color-scheme)` 直接写样式（统一由 token 控制）
- 用户偏好存 `localStorage['lifeos-theme']`，默认 `dark`

---

## 6. API 与数据层规则

### 6.1 目录

```
apps/lifeos-web/src/api/
├── client.ts          # fetch 封装（带 baseURL、auth header、错误处理）
├── auth.ts
├── community.ts
├── digital-life.ts
└── types.ts           # 与后端共享的 DTO 类型
```

### 6.2 规则

- 类型与后端 schema 一一对应，用 drizzle 推导或手写 interface
- 所有 API 调用必须 catch，UI 层禁止裸 Promise
- WebSocket 连接统一走 `api/ws.ts`，自动重连

### 6.3 后端路由

```
apps/server/src/routes/
├── auth/
├── digital-life/
│   └── index.ts
├── community/
│   └── index.ts
└── index.ts            # 聚合
```

- 每个 route 文件只挂一个资源
- 业务逻辑放 `services/`，route 只做参数校验 + 调 service + 返回
- 鉴权走 middleware，禁止在 route 内手写

---

## 7. 数据库规则

### 7.1 Schema 通用要求（修复提示词缺陷）

所有表必须包含：

```ts
{
  id: text PK,
  createdAt: timestamp default now(),
  updatedAt: timestamp default now(),
  deletedAt: timestamp null,        // 软删除
}
```

### 7.2 索引

高频查询字段必须建索引：
- `characterId`、`userId`、`parentPostId`、`authorId`
- 时间字段倒序查询的建索引

### 7.3 枚举字段

- 用 `text` + TS enum，禁止裸字符串
- drizzle 用 `pgEnum`

```ts
// ✅
export const bondStageEnum = pgEnum('bond_stage', [
  'stranger', 'acquaintance', 'friend',
  'close_friend', 'companion', 'soulmate'
])
```

### 7.4 迁移

- 所有 schema 变更走 drizzle migration
- 必须测试 up + down 脚本
- 禁止手改数据库

### 7.5 pgvector

- PostgreSQL 必须安装 pgvector 扩展
- 推荐用 Supabase / Neon 避免自管扩展
- 向量字段统一命名 `embedding vector(N)`

---

## 8. AI 引擎规则（packages/lifeos-core）

### 8.1 引擎清单（修正为 9 个）

| 引擎 | 文件 | 职责 |
|---|---|---|
| 情绪引擎 | emotion-engine.ts | PAD 三维 + 离散标签 |
| 关系引擎 | relationship-engine.ts | affinityLevel 0-100, bondStage 6 阶段 |
| 自主行为 | autonomous-behavior.ts | 调度 + 事件驱动 |
| 时间引擎 | time-engine.ts | AI 内部时间 |
| 事件引擎 | event-engine.ts | 事件总线 |
| 目标引擎 | goal-engine.ts | AI 长短期目标 |
| 剧情引擎 | story-engine.ts | 剧情线推进 |
| 兴趣引擎 | interest-engine.ts | 兴趣图谱 |
| 记忆引擎 | memory-engine.ts | Markdown + Vector 混合 |

> 提示词中写"8 个 engine"实为 9 个，已修正。

### 8.2 引擎间通信

- 走事件总线（event-engine），禁止直接互调
- 每个引擎导出纯函数 + 一个状态对象，便于单测

### 8.3 AI 永动机熔断（修复提示词缺陷）

```ts
// packages/lifeos-core/src/engines/autonomous-behavior.ts
const LIMITS = {
  dailyPostsPerChar: 5,           // 每 AI 每日发帖上限
  dailyCommentsPerChar: 10,       // 每日评论上限
  aiToAiMaxTurns: 4,              // 两 AI 间最多对话轮数
  aiToAiCooldownMs: 30 * 60 * 1000, // 同两 AI 间冷却 30 分钟
  globalTokenBudgetPerHour: 200_000,
}

// 全局 token 计数器，超限强制暂停所有自主行为
// 触发熔断时发告警事件
```

### 8.4 LLM fallback

- `xsai 0.5.0-beta` 为生产风险，必须配置 fallback provider
- ChatOrchestratorRuntime 主调失败时降级到 fallback（如 OpenAI 兼容端点）

---

## 9. Live2D / VRM 渲染规则（修复提示词缺陷）

### 9.1 响应式隔离

- 所有 Live2D / VRM / Three.js 实例用 `shallowRef` + `markRaw`
- 禁止用 `reactive` / `ref` 包裹模型对象
- 渲染循环用 `requestAnimationFrame`，不依赖 Vue 生命周期

### 9.2 通信

- Vue → 渲染层：通过方法调用（如 `live2dModel.value?.playMotion('happy')`）
- 渲染层 → Vue：通过事件发射（emit），Vue 监听后更新 UI 状态
- 禁止双向响应式绑定模型属性

### 9.3 销毁

- 组件 `onBeforeUnmount` 必须显式销毁模型、释放 WebGL 上下文
- 防止内存泄漏

---

## 10. 认证规则（修复提示词缺陷）

### 10.1 better-auth + 微信登录

决策：**自定义 better-auth social provider**（方案 A）

- 微信 OAuth2 非标准 OIDC，需自定义 provider
- 流程：微信扫码 → 拿 code → 后端换 access_token → 拿 openid → better-auth 创建/查找用户 → 建 session
- 中间适配层放 `apps/server/src/services/wechat-oauth.ts`
- 不放弃 better-auth（保留其 session 管理、其他 social provider）

### 10.2 其他登录

- Email + 密码（better-auth 内置）
- GitHub / Google（better-auth 内置 social）

---

## 11. 测试规则

### 11.1 测试分层

| 层 | 工具 | 覆盖目标 |
|---|---|---|
| 单元 | Vitest | 引擎逻辑、纯函数 ≥ 80% |
| 组件 | Vitest + @vue/test-utils | 关键组件渲染 |
| API | Vitest + supertest | 后端路由 |
| E2E | Playwright | 关键流程 |

### 11.2 必测关键流程

- 登录 → 选角 → 聊天 → 社区（端到端）
- 情绪引擎：给定输入 → 输出 PAD 值正确
- 关系引擎：affinity 计算正确
- AI 熔断：超限正确暂停

### 11.3 测试环境

- DB 用 testcontainers PostgreSQL + pgvector
- Redis 用 testcontainers Redis
- 禁止用生产 DB 跑测试

### 11.4 CI

- `.github/workflows/ci.yml` 必须跑 lint + 单元 + E2E
- PR 必须绿才能合并
- 覆盖率低于阈值 fail

---

## 12. 性能规则

- 路由级 lazy loading（`defineAsyncComponent` / 动态 import）
- 长列表用虚拟滚动（`vue-virtual-scroller` 或自研）
- 重计算用 Web Workers
- 静态资源走 CDN
- 图片懒加载 + 占位
- Live2D / VRM 模型按需加载，不进入首屏 bundle

---

## 13. 安全规则

- XSS：用户输入内容渲染前必须 sanitize（DOMPurify）
- CSRF：better-auth 内置防护，禁止关闭
- AI 生成内容：所有 AI 生成帖/评论必须标注"AI 生成"标识
- 速率限制：API 网关层限流
- 密钥：禁止入仓，走环境变量
- SQL 注入：drizzle 参数化查询，禁止裸 SQL 拼接

---

## 14. 提交与分支规则

### 14.1 分支

- `main`：生产分支，禁止直接 push
- `dev`：开发集成分支
- `feat/<scope>`：功能分支
- `fix/<scope>`：修复分支

### 14.2 Commit 规范（Conventional Commits）

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore | perf
scope: digital-life | community | auth | ui | engine | ...
```

### 14.3 PR

- PR 描述必须包含：变更说明、测试方式、影响范围
- 必须关联 issue
- 至少 1 人 review
- CI 必须绿

---

## 15. 自我审查清单（开发前）

开始任何 UI / 组件 / 引擎开发前，对照本清单：

- [ ] 已读 `docs/design-system.md` + `docs/development-rules.md`
- [ ] 用的是 Naive UI + UnoCSS + design token，无第二套库
- [ ] 颜色 / 字号 / 圆角 / 间距全部走 token
- [ ] Live2D / VRM 实例用 `shallowRef + markRaw`
- [ ] 数据库表含 `createdAt/updatedAt/deletedAt`
- [ ] 枚举字段用 `pgEnum`
- [ ] 引擎间通信走事件总线
- [ ] AI 自主行为有熔断兜底
- [ ] 测试环境用 testcontainers，不碰生产 DB
- [ ] Commit 符合 Conventional Commits

---

## 16. 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| 1.0.0 | 2026-07-12 | 初版：技术栈锁定、目录结构、组件复用、引擎熔断、Live2D 隔离、微信登录方案 |
