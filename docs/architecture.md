# Architecture · 技术架构

> 本文档定义 DreamLife 的技术分层、模块边界与扩展契约。
> 任何代码改动必须能映射到本文档中的某个组件，否则视为越界。

---

## 1. 顶层架构

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation                          │
│  Next.js App Router  ·  Live2D Canvas  ·  Voice UI         │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ 事件 / API / Hooks
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   AIRI Runtime（身体层）                   │
│  Live2D · Voice · Animation · Chat Transport              │
│  ↑ 禁止修改核心，仅通过扩展点接入                            │
└─────────────────────────────────────────────────────────┘
                            ▲ 事件总线 / 扩展契约
                            │
┌─────────────────────────────────────────────────────────┐
│                Life Runtime（灵魂层）                      │
│  Personality · Emotion · Memory · Relationship            │
│  Goal · Behavior · Growth                                  │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ Domain Events
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Persistence                              │
│  Prisma + SQLite/Postgres · Live2D Assets · Vector Store   │
└─────────────────────────────────────────────────────────┘
```

## 2. 分层契约

### 2.1 AIRI Runtime（身体层）

**职责**：

- Live2D 模型加载与渲染
- 语音合成 / 识别
- 动作 / 表情 / 物理参数
- 聊天消息收发

**契约**：

- ✅ 通过 AIRI 暴露的扩展点（事件、钩子、参数接口）接入
- ✅ 在 `lib/core/live2d-*` 等适配层包装 AIRI API
- ❌ 禁止修改 AIRI 仓库核心源码
- ❌ 禁止在身体层直接实现情绪 / 记忆 / 关系逻辑

### 2.2 Life Runtime（灵魂层）

**位置**：`lib/core/digital-life/`

**子系统**：

| 模块 | 文件 | 职责 |
|---|---|---|
| Personality | `personality/` | 性格参数、价值观、语言风格 |
| Emotion | `state-engine.ts` | PAD 情绪状态机 |
| Memory | `md-memory/` | 分层长期记忆 |
| Relationship | （待建） | 多维关系向量 |
| Goal | （待建） | 目标 / 意图系统 |
| Behavior | `autonomous-decision-engine.ts` | 自主行为决策 |
| Growth | `growth-engine.ts` | 成长系统 |
| Agent | `agent.ts` | 灵魂层总入口 |

**契约**：

- ✅ 每个子系统独立、可单测、可演化
- ✅ 通过 Domain Events 与 AIRI Runtime 通信
- ✅ 持久化通过 `persistence.ts` 统一接入
- ❌ 禁止灵魂层直接操作 Live2D Canvas（必须走事件）

## 3. 数据流

### 3.1 一次对话的完整流转

```
用户输入
   │
   ▼
[AIRI Runtime] 聊天接收
   │ chat.incoming 事件
   ▼
[Life Runtime]
   ├─ Context Service     ← 注入记忆 / 关系 / 人格
   ├─ Agent               ← 调用 LLM 生成回复
   ├─ Emotion Engine      ← 更新 PAD 状态
   ├─ Memory Engine       ← 写入情节 / 情绪记忆
   ├─ Relationship Engine ← 更新关系向量
   └─ Growth Engine      ← 累积成长信号
   │ life.response 事件（含 emotion / motion 指令）
   ▼
[AIRI Runtime]
   ├─ 文字气泡渲染
   ├─ Voice TTS
   ├─ Live2D 表情 / 动作参数
   └─ 物理参数微调
   │
   ▼
用户感知「她在回应我」
```

### 3.2 自主行为流（无用户输入）

```
[Behavior Engine] 定时器 / 事件触发
   │
   ├─ 读取当前 Goal / Mood / 关系
   ├─ 生成意图（找用户 / 自言自语 / 静默）
   ├─ 经 Agent 决策
   │
   ▼
[AIRI Runtime] 主动发起动作 / 语音 / 表情
```

## 4. 目录结构（约定）

```
/workspace
├── AGENTS.md                      # 项目宪法
├── docs/                          # 设计 / 决策文档
├── app/                           # Next.js 页面与 API
│   ├── api/                       # 后端路由
│   └── lover/                     # 主交互页面
├── components/                    # UI 组件（视觉层）
│   └── Lover/                     # 主角色相关组件
├── lib/
│   ├── core/
│   │   ├── digital-life/          # ★ Life Runtime 灵魂层
│   │   │   ├── agent.ts
│   │   │   ├── state-engine.ts        # Emotion
│   │   │   ├── growth-engine.ts       # Growth
│   │   │   ├── autonomous-decision-engine.ts  # Behavior
│   │   │   ├── context-service.ts     # 上下文编排
│   │   │   ├── md-memory/             # Memory
│   │   │   ├── systems.ts             # 系统注册表
│   │   │   └── types.ts               # 领域类型
│   │   ├── llm/                       # LLM Provider 抽象
│   │   ├── live2d-manager.ts          # AIRI 适配层
│   │   ├── live2d-animation-controller.ts
│   │   ├── speech-pipeline.ts         # 语音管线
│   │   ├── scene-system.ts            # 场景系统
│   │   └── persistence.ts             # 持久化统一入口
│   └── hooks/                        # React Hooks
├── prisma/                           # 数据模型
└── public/live2d-models/             # Live2D 资源
```

## 5. 关键类型契约（已存在 / 待建）

参考 `lib/core/digital-life/types.ts`：

| 类型 | 含义 | 状态 |
|---|---|---|
| `EmotionState` | PAD + mood + intensity | ✅ 已有 |
| `MoodType` | 20 种心情枚举 | ✅ 已有 |
| `MemoryType` | 9 种记忆类型 | ✅ 已有 |
| `RelationshipType` | 关系类型 | ✅ 已有 |
| `BehaviorTag` | 行为标签 | ✅ 已有 |
| `PersonaMode` | 人格模式 | ✅ 已有 |

**待建类型**：

- `PersonalityProfile` —— 数据化人格
- `RelationshipVector` —— 多维关系向量
- `GrowthMilestone` —— 成长里程碑
- `Goal` —— 自主目标

## 6. 扩展点（接入 AIRI 的合法方式）

新增能力时，优先使用以下扩展点，而非改 AIRI：

1. **事件监听**：订阅 AIRI 的 chat / motion / idle 事件
2. **参数注入**：在 AIRI 渲染前注入 Live2D 表情 / 动作参数
3. **消息中间件**：在 AIRI 的消息流中插入 Life Runtime 的预处理 / 后处理
4. **资源替换**：通过配置加载自定义模型 / 动作 / 表情

## 7. 持久化策略

| 数据 | 存储 |
|---|---|
| 对话消息 | Prisma（Postgres / SQLite） |
| 记忆条目 | Prisma + 向量库 |
| 情绪状态 | Prisma（时间序列） |
| 关系向量 | Prisma（JSON 字段） |
| 人格档案 | Prisma |
| Live2D 资源 | 文件系统 `public/live2d-models/` |

## 8. 架构红线

- ❌ 禁止 AIRI 核心源码被修改
- ❌ 禁止 UI 组件直接访问 Prisma
- ❌ 禁止灵魂层直接操作 DOM / Canvas
- ❌ 禁止在身体层实现情绪 / 记忆 / 关系逻辑
- ❌ 禁止跨层共享可变全局状态（必须通过事件）

## 9. 演进路径

- **v0.x**：单文件系统逐步迁移到 DDD 模块化（见 roadmap.md）
- **v1.0**：五引擎完整闭环
- **v2.0**：多角色 / 多关系网络
