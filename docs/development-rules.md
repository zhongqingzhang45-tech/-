# Development Rules · 开发规则

> 本文档定义 DreamLife 的代码规范与开发流程。
> Trae 与所有贡献者必须遵守。

---

## 1. 开发前置流程（每次任务 MUST 执行）

按顺序：

1. 阅读 `AGENTS.md`
2. 阅读 `docs/architecture.md`
3. 阅读 `docs/design-system.md`（若涉及 UI）
4. 阅读 `docs/decision-log.md`（确认未冲突已存在 ADR）
5. 输出**开发计划**
6. **等待用户确认**
7. 确认后开始编码

❌ 禁止跳过 5、6 步直接写代码。

---

## 2. 技术栈约束

| 项 | 选择 |
|---|---|
| 语言 | TypeScript（Strict） |
| 框架 | Next.js（已有，禁止替换） |
| UI | 自研组件 + Glass Morphism（禁止引入新 UI 框架） |
| 数据 | Prisma + Postgres / SQLite |
| Live2D | AIRI（禁止替换） |
| 状态 | React Hooks（已存在） |

- ❌ 禁止引入新的 UI 框架（Material UI / Ant Design / Chakra 等）
- ❌ 禁止引入新的状态管理库，除非有强理由并提交 ADR
- ❌ 禁止替换 AIRI 核心实现

---

## 3. 代码规范

### 3.1 TypeScript

- 必须 `strict: true`
- 禁止 `any`，必要时用 `unknown` + 类型守卫
- 公共 API 必须显式声明返回类型
- 类型定义统一放 `types.ts`

### 3.2 文件大小

- **单文件 ≤ 300 行**（含注释与空行）
- 超过即拆分

### 3.3 模块化

- 采用 DDD 思想
- 每个子系统独立目录
- 通过明确接口 / 事件通信
- 禁止跨子系统直接访问内部状态

### 3.4 命名

| 类型 | 风格 | 示例 |
|---|---|---|
| 文件 | kebab-case | `state-engine.ts` |
| 类型 / 接口 | PascalCase | `EmotionState` |
| 函数 / 变量 | camelCase | `updateEmotion` |
| 常量 | UPPER_SNAKE | `MAX_MEMORY_ITEMS` |
| React 组件 | PascalCase | `LoverApp` |

### 3.5 注释

- 仅在逻辑非自明处写注释
- 公共 API 必须有 JSDoc
- 禁止「为了写而写」的注释

### 3.6 重复代码

- ❌ 禁止重复代码
- 三次以上重复必须抽象
- 但禁止为「未来可能的需求」过度抽象

---

## 4. 功能开发流程

任何功能必须先提交 **Feature Proposal**，格式：

```markdown
## Feature Proposal

- 功能名称：
- 目的：
- 解决的问题：
- 影响模块：
  - [ ] AIRI Runtime（身体层）
  - [ ] Life Runtime（灵魂层）
  - [ ] UI
  - [ ] Persistence
- 数据结构：（新增 / 修改的类型）
- UI 变化：（若有，附视觉说明）
- 风险：
- 关联 ADR：（若有）
```

**流程**：

1. 提交 Proposal
2. 用户确认
3. 进入开发
4. 开发完成后自检（见 AGENTS.md §9）
5. 提交 PR / 代码

---

## 5. UI 开发流程

UI 任务必须先输出，确认后再编码：

1. **页面结构**：层级骨架
2. **组件树**：组件拆分与职责
3. **交互流程**：用户操作 → 系统响应
4. **视觉说明**：色彩 / 圆角 / 动效 / Glass / 留白
5. **数据绑定**：哪些状态 / 领域数据驱动 UI

确认后编码。

---

## 6. 提交规范

### 6.1 Commit Message

采用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>
```

type：

- `feat` 新功能
- `fix` 修复
- `refactor` 重构（不改行为）
- `docs` 文档
- `chore` 杂项
- `test` 测试

scope 示例：`emotion` / `memory` / `relationship` / `live2d` / `ui`

### 6.2 自检清单

提交前对照 `AGENTS.md §9` 自我审查清单。

---

## 7. 测试

- 关键逻辑必须有单测（情绪状态机、记忆写入、关系更新）
- UI 至少做一次手测截图
- LLM 调用必须有 mock provider（已有 `lib/core/llm/providers/mock.ts`）

---

## 8. 持久化

- 所有持久化通过 `lib/core/persistence.ts`
- 数据模型变更必须更新 `prisma/schema.prisma` 并执行 migration
- 禁止 UI 组件直接读 Prisma

---

## 9. LLM 调用

- 通过 `lib/core/llm/` 抽象层调用
- 必须支持 mock provider 用于测试
- 禁止在 UI 组件直接调 LLM API

---

## 10. 禁止事项汇总

- ❌ 自行增加功能
- ❌ 改变产品定位（变成聊天机器人 / 助手）
- ❌ 引入新的 UI 框架
- ❌ 为了完成任务牺牲架构
- ❌ 生成普通 AI 聊天页面
- ❌ 推翻 `docs/decision-log.md` 中的 ADR
- ❌ 修改 AIRI 核心源码
- ❌ 单文件超过 300 行
- ❌ 使用 `any`
- ❌ 重复代码
- ❌ 跨层访问（UI 直接访问 Prisma / 灵魂层直接操作 Canvas）

---

## 11. 任务模板（Trae 使用）

每次 Trae 接到开发任务，应使用以下模板响应：

```markdown
你现在是 DreamLife AI 项目的核心开发工程师。

开始任何工作前：

1. 阅读：
   - AGENTS.md
   - docs/architecture.md
   - docs/design-system.md

2. 理解当前项目定位：
   这是 AI 数字生命，不是聊天机器人。

任务：
开发：<功能名称>

要求：
不要立即写代码。先输出：

1. 技术分析
2. 架构影响
3. UI 设计方案（若涉及 UI）
4. 数据结构设计
5. 开发步骤

等待确认。
```

Trae 不得跳过到编码阶段。
