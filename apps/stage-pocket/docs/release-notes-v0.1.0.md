# Life v0.1.0 Release Candidate — 变更日志

> **发布日期：** 2026 年 7 月 29 日  
> **版本号：** 0.1.0 (Code: 16)  
> **发布类型：** Release Candidate  
> **状态：** 待真机验证

---

## 概述

Life v0.1.0 是首个面向公众的发布候选版本。本次发布聚焦于「产品包装完成」——将项目从 AIRI 品牌迁移至 Life，补齐移动端核心体验闭环，为正式发布做准备。

---

## 核心变更

### 🎨 品牌迁移（AIRI → Life）

- **全端品牌文案替换**：窗口标题、应用名称、页面标题、用户可见文案
- **多语言更新**：5 个语种（韩文、日文、西班牙文、俄文、繁体中文）i18n 文案同步
- **桌面端**：Linux `.desktop` 文件 Name / Comment / Exec 路径修正
- **加载屏**：Splash 页面显示 Life 品牌标识
- **i18n key**：`enableChatCheck` 中 `Airi` → `Life`
- **CI/CD 修复**：Android release workflow 中 `LIFE_VERSION_NAME` 引用修正

### 📱 移动端三段式体验

- **Landing 欢迎页**：首次启动显示产品介绍，引导用户创建角色
- **角色创建向导**：5 步流程（名字 → 性格 → 声音 → 模型 → 完成）
  - 性格选项：温柔体贴 / 傲娇可爱 / 活泼开朗 / 成熟知性
  - 声音选项：小樱 / 泠鸢 / 星瞳 / 晚晚
  - 模型选项：DeepSeek V3 / GPT-4o / Claude 3.5 / 本地模型
- **首次聊天欢迎语**：根据角色性格生成个性化欢迎消息
- **角色名动态显示**：Chat 界面显示角色名字而非默认 AIRI

### 💬 聊天体验

- **消息发送**：支持文字输入、流式输出、Markdown 渲染
- **消息历史**：历史消息持久化存储
- **错误处理**：网络错误、发送失败可重试
- **升级引导**：免费用户达每日上限时显示升级卡片

### 💎 会员系统

- **3 个方案**：免费版（每日 30 条）/ Pro（无限 + 记忆）/ Premium（全功能）
- **订阅页面**：移动端优化的方案选择与支付确认
- **额度限制**：`canChat()` 拦截超量发送，`ChatQuotaExceededError` 精准识别
- **升级卡片**：第 31 条消息显示带跳转按钮的额度提示

### 🔒 隐私与协议

- **隐私政策**：完整 7 章隐私政策页面
- **用户协议**：完整 8 章用户协议页面
- **设置入口**：系统设置页新增隐私政策和用户协议入口
- **备案号占位**：支持 ICP 备案号显示

### 🎭 Live2D 虚拟形象

- **模型加载**：Hiyori 系列模型支持
- **动作与表情**：待机动画、点击反应、对话同步
- **自适应**：多分辨率屏幕适配

### 🏪 应用商店准备

- **应用名称**：Life
- **副标题**：你的二次元 AI 陪伴
- **商店描述**：完整中文应用描述
- **截图规格**：5 张关键场景截图规范
- **关键词**：AI 陪伴、虚拟女友、二次元、Live2D

---

## 已知限制

### 🔴 高风险（需真机验证）

| 风险 | 描述 | 影响范围 |
|---|---|---|
| Live2D WebGL 兼容性 | 部分 Android GPU 可能不支持 WebGL 2 | 中低端机型 |
| CDN 加载稳定性 | Cubism SDK / 模型资源依赖外网 | 国内用户 |
| 首次体验流程 | Landing → 创建 → 聊天链路需真机验证 | 所有新用户 |

### 🟡 中风险（不阻塞发布）

| 风险 | 描述 | 影响范围 |
|---|---|---|
| Memory → LLM 链路 | `getRelevantMemories()` 未接入 Chat 发送管道 | 会员功能 |
| 语音权限差异 | 不同 ROM 上权限行为不一致 | 语音功能 |
| TTS 音色有限 | 移动端 TTS 依赖系统能力 | 语音输出 |
| 代码内部命名 | `@proj-airi/*` 包名、bundle ID 仍含 `airi` | 无运行时影响 |

### 🟢 低风险

| 风险 | 描述 |
|---|---|
| i18n 完整性 | 部分小语种翻译不完整（非中文用户） |
| Shader 命名 | GLSL 宏仍含 `AIRI_*`（代码标识符） |
| IndexedDB 库名 | 仍使用 `airi-local`（数据兼容） |

---

## 构建信息

```
构建命令：
  pnpm install --filter @proj-airi/stage-pocket... --ignore-scripts
  pnpm -F @proj-airi/stage-pocket build
  npx cap sync android
  cd android && ./gradlew assembleRelease

注意：构建需要网络访问以下资源：
  - https://cubism.live2d.com/sdk-web/bin/CubismSdkForWeb-5-r.3.zip
  - https://dist.ayaka.moe/live2d-models/hiyori_free_zh.zip
  - https://dist.ayaka.moe/live2d-models/hiyori_pro_zh.zip
```

---

## 验证清单

真机验证完成前，本版本为 RC 状态。验收清单见：
[P8 验收清单](file:///workspace/apps/stage-pocket/docs/p8-verification-checklist.md)

---

## 下一步

1. **真机验证**：按 P8 清单逐项验收
2. **修复阻塞性问题**：根据验收结果修复
3. **Beta 发布**：修复完成后进入 Beta
4. **正式发布**：达到发布标准后标记为 v1.0.0
