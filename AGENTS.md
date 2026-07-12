# AGENTS.md

> 本文件是 LifeOS Social 项目对 AI Agent 与人类开发者的强制索引。
> **任何开发任务开始前，必须先读以下两份文档全文，并严格遵守。**
> 违反文档规则的代码贡献一律打回，CI 失败。

---

## 强制前置阅读（每次开发前必读）

| # | 文档 | 路径 | 内容 |
|---|---|---|---|
| 1 | 设计规范 | [docs/design-system.md](docs/design-system.md) | 主色 / 配色 / 字号 / 圆角 / 间距 / 动效 / z-index / 双模式 token / Naive UI 对接 |
| 2 | 开发规则 | [docs/development-rules.md](docs/development-rules.md) | 技术栈 / 目录结构 / 组件复用 / 状态管理 / 数据库 / AI 引擎 / Live2D 隔离 / 测试 |

---

## 阅读协议（对 AI Agent）

### 启动检查

每次接收到 LifeOS Social 项目的开发任务时，AI Agent 必须在动手前执行：

1. 读取 `docs/design-system.md` 全文
2. 读取 `docs/development-rules.md` 全文
3. 对照两份文档末尾的「自我审查清单」确认本次任务涉及的规则
4. 在第一次回复中声明：「已读 design-system.md v1.0.0 + development-rules.md v1.0.0，将遵守：…（列出本次任务相关条款）」
5. 然后才可开始编码 / 设计 / 改动

### 禁止行为

- ❌ 未读两份文档即开始编码
- ❌ 读后不声明、直接动手
- ❌ 在组件内硬编码色值 / 字号 / 圆角 / 间距
- ❌ 引入除 Naive UI 之外的任何通用 UI 组件库
- ❌ 把 Live2D / VRM 实例塞进 Vue 响应式系统（必须 `shallowRef + markRaw`）
- ❌ 跨引擎直接互调（必须走事件总线）
- ❌ 跳过 drizzle migration 直接改数据库
- ❌ 用生产数据库跑测试

### 允许行为

- ✅ 在两份文档覆盖不全处，按文档风格推断并标注「推断」
- ✅ 发现文档冲突时停止并向用户确认
- ✅ 改进文档本身（提交 PR 修订 `docs/*.md`）

---

## 阅读协议（对人类开发者）

- PR 模板必须勾选「已读 design-system.md + development-rules.md」
- Code Review 必须对照两份文档末尾的清单逐条核验
- 文档版本变更时，全组重新通读

---

## 文档版本

| 文档 | 当前版本 |
|---|---|
| docs/design-system.md | 1.0.0 |
| docs/development-rules.md | 1.0.0 |
| AGENTS.md | 1.0.0 |

文档版本变更规则：语义化版本（major.minor.patch）。
- major：技术栈 / 主色 / 组件库等破坏性变更
- minor：新增 token / 新增规则章节
- patch：措辞修正 / 错别字

---

## 快速定位

| 我想做的事 | 看哪一节 |
|---|---|
| 取主色 / 配色 | design-system.md §2、§3 |
| 取字号 / 字重 / 行高 | design-system.md §4 |
| 取圆角 / 间距 / 阴影 | design-system.md §5、§6、§7 |
| 取动效 / z-index / 断点 | design-system.md §8、§9、§10 |
| AI 情绪如何影响主色 | design-system.md §3.4 |
| 哪个组件库 / 禁止什么库 | development-rules.md §1 |
| 目录怎么放 | development-rules.md §2 |
| Live2D 怎么写 | development-rules.md §3.3、§9 |
| 数据库表必须有什么字段 | development-rules.md §7.1 |
| AI 死循环怎么防 | development-rules.md §8.3 |
| 微信登录怎么做 | development-rules.md §10 |
| commit 怎么写 | development-rules.md §14.2 |

---

## 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| 1.0.0 | 2026-07-12 | 初版：索引 design-system v1.0.0 + development-rules v1.0.0 |
