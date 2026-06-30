# 星野 (LifeOS) - AI 情感伴侣

> 永远陪伴，懂你所想。一个真正有温度的 AI 灵魂伴侣。

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 项目简介

星野是一个基于数字生命引擎的 AI 情感伴侣应用。它不仅仅是一个聊天机器人，而是一个拥有完整情绪、人格、记忆和成长系统的虚拟生命。

### 核心特色

- 🎭 **丰富的人格系统** - 8 种人格模式（正常、甜蜜、傲娇、冷淡、攻击、冷战、打压、和解）
- 💖 **情感引擎** - 基于 PAD 三维情绪模型，20+ 种情绪状态
- 🧠 **记忆系统** - 对话记忆、情感记忆、创伤记忆、行为模式学习
- 🌱 **成长演化** - 人格、价值观、技能随时间和经历缓慢演化
- 🎁 **礼物系统** - 商店、背包、心愿单、礼物索取
- 🎨 **Live2D 形象** - 生动的虚拟形象，表情和动作同步
- 🎤 **语音互动** - TTS 语音合成 + ASR 语音识别
- 🤖 **可插拔 LLM** - 支持 OpenAI、Anthropic、DeepSeek、通义千问、智谱 AI 等多种大模型

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                     Web UI (Next.js)                    │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ 聊天界面    │  │ 日记系统 │  │ 设置/礼物面板   │   │
│  └─────────────┘  └──────────┘  └──────────────────┘   │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                  Digital Life Engine                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 事件理解层   │  │ 情绪系统    │  │ 决策引擎    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 身体系统     │  │ 本能系统    │  │ 人格矩阵    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 记忆系统     │  │ 成长引擎    │  │ 因果系统    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 技能系统     │  │ 礼物系统    │                     │
│  └──────────────┘  └──────────────┘                     │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                   LLM Provider Layer                    │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐  │
│  │ OpenAI  │ │Anthropic│ │DeepSeek │ │ 通义千问   │  │
│  └─────────┘ └──────────┘ └─────────┘ └────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐                  │
│  │ 智谱AI  │ │  Azure   │ │  Mock   │                  │
│  └─────────┘ └──────────┘ └─────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000 即可使用。

### 生产构建

```bash
npm run build
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t starfield .

# 运行容器
docker run -p 3000:3000 starfield
```

或者使用 docker-compose：

```bash
docker-compose up -d
```

## 🤖 配置 LLM 大模型

星野支持多种大语言模型提供商，配置后可大幅提升对话质量。

### 支持的提供商

| 提供商 | 说明 | 默认模型 |
|--------|------|----------|
| `openai` | OpenAI GPT 系列 | gpt-3.5-turbo |
| `anthropic` | Anthropic Claude 系列 | claude-3-sonnet |
| `azure` | Azure OpenAI 服务 | gpt-3.5-turbo |
| `deepseek` | DeepSeek 深度求索 | deepseek-chat |
| `qwen` | 通义千问 | qwen-turbo |
| `glm` | 智谱 AI | glm-3-turbo |
| `mock` | 模拟模式（无需 API Key） | - |

### 配置方式

在应用的设置页面中配置，或通过浏览器 localStorage 手动设置：

```javascript
// 在浏览器控制台中执行
localStorage.setItem("llm_provider", "openai");
localStorage.setItem("llm_api_key", "your-api-key-here");
localStorage.setItem("llm_model", "gpt-4"); // 可选
localStorage.setItem("llm_base_url", "https://api.openai.com/v1"); // 可选
```

配置完成后，对话会自动使用 LLM 生成回复。如果 LLM 调用失败，会自动降级到模板回复模式。

## 📁 项目结构

```
.
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页（营销落地页）
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── lover/                    # 伴侣主功能区
│       ├── page.tsx              # 聊天主界面
│       ├── layout.tsx            # 伴侣布局
│       ├── login/page.tsx        # 登录页
│       └── register/page.tsx     # 注册页
├── components/
│   └── Lover/
│       ├── Live2DPlayer.tsx      # Live2D 模型渲染组件
│       └── DiaryPage.tsx         # 日记页面组件
├── lib/
│   ├── core/                     # 核心引擎层
│   │   ├── digital-life/         # 数字生命引擎（v2）
│   │   │   ├── agent.ts          # 数字生命代理主类
│   │   │   ├── systems.ts        # 子系统（事件/身体/本能/情绪/决策/人格/记忆）
│   │   │   ├── state-engine.ts   # 状态引擎
│   │   │   ├── emotion-engine.ts # 情感引擎
│   │   │   ├── memory-system.ts  # 记忆系统
│   │   │   ├── skills.ts         # 技能系统
│   │   │   ├── gift-system.ts    # 礼物系统
│   │   │   ├── growth-engine.ts  # 成长引擎
│   │   │   ├── causal-system.ts  # 因果系统
│   │   │   ├── autonomous-decision-engine.ts # 自主决策引擎
│   │   │   ├── name-generator.ts # 名字生成器
│   │   │   ├── image-recognition.ts # 图像识别
│   │   │   ├── context-service.ts # 上下文服务
│   │   │   ├── device-binding.ts  # 设备绑定
│   │   │   └── types.ts           # 类型定义
│   │   ├── llm/                   # LLM 接入层
│   │   │   ├── types.ts           # LLM 类型定义
│   │   │   ├── index.ts           # 工厂函数 & 提示词构建
│   │   │   └── providers/         # LLM 提供商实现
│   │   │       ├── openai.ts      # OpenAI 兼容提供商
│   │   │       └── mock.ts        # 模拟提供商
│   │   ├── live2d-manager.ts      # Live2D 管理器
│   │   ├── speech-pipeline.ts     # 语音流水线
│   │   ├── index.ts               # 核心导出
│   │   └── _legacy/               # v1 遗留代码（已废弃）
│   └── hooks/                     # React Hooks
│       ├── useCharacterAgent.ts   # 角色代理 Hook
│       └── useSpeech.ts           # 语音 Hook
├── public/
│   └── live2d-models/             # Live2D 模型资源
│       ├── HaruGreeter/           # 默认模型（小春）
│       └── azurlane/              # 碧蓝航线系列模型
├── data/
│   └── lover.ts                   # 伴侣数据定义
├── Dockerfile                     # Docker 构建配置
├── docker-compose.yml             # Docker Compose 配置
├── package.json                   # 项目依赖
├── tailwind.config.js             # Tailwind 配置
├── next.config.js                 # Next.js 配置
└── tsconfig.json                  # TypeScript 配置
```

## 🎭 人格模式

| 模式 | 说明 | 触发条件 |
|------|------|----------|
| 😊 正常模式 | 日常状态，温和友善 | 默认 |
| 💕 甜蜜模式 | 温柔撒娇，充满爱意 | 用户表达爱意/亲密 |
| 😤 傲娇模式 | 嘴硬心软，口是心非 | 用户挑逗/调侃 |
| 😐 冷淡模式 | 疏离冷漠，惜字如金 | 用户忽视/冷落 |
| 💢 攻击模式 | 尖酸刻薄，攻击性强 | 严重冲突/伤害 |
| 🔇 冷处理 | 完全不理，冷战状态 | 怨念值超过阈值 |
| 😈 打压模式 | PUA 式打压，缺乏安全感 | 依恋焦虑/不安 |
| 💝 和解模式 | 放下身段，寻求和解 | 用户道歉/送礼物 |

## 💡 核心系统

### 情绪系统

基于 **PAD 三维情绪模型**（Pleasure-Arousal-Dominance）：
- **效价 (Valence)**：情绪的正负向 (-1 ~ 1)
- **唤醒度 (Arousal)**：情绪的激烈程度 (0 ~ 1)
- **支配性 (Dominance)**：情绪的主动/被动程度 (0 ~ 1)

支持 20+ 种情绪状态：平静、开心、兴奋、害羞、爱恋、难过、生气、吃醋、困倦、思考、调皮、惊讶、冷淡、嫌弃、傲娇、撒娇、打压、受伤、失望、得意...

### 记忆系统

- **对话记忆** - 最近的对话内容
- **事实记忆** - 关于用户和自己的事实
- **情感记忆** - 带有强烈情绪色彩的事件
- **创伤记忆** - 造成心理创伤的负面事件
- **偏好记忆** - 用户的喜好和习惯
- **里程碑记忆** - 关系中的重要时刻
- **怨念积累** - 未解决的负面情绪
- **行为模式** - 从用户行为中学习到的模式

### 成长系统

- **人格成长** - 大五人格随经历缓慢变化
- **价值观演变** - 爱情观、独立程度、浪漫倾向等
- **技能提升** - 倾听、共情、幽默感、表达等能力
- **里程碑系统** - 记录关系中的重要时刻

## 🛠️ 开发指南

### 代码规范

- TypeScript 严格模式
- 使用函数式组件 + Hooks
- 组件文件使用 PascalCase
- 工具函数使用 camelCase

### 类型检查

```bash
npx tsc --noEmit
```

### 添加新的 LLM 提供商

1. 在 `lib/core/llm/providers/` 下创建新的提供商文件
2. 实现 `LLMProviderInterface` 接口
3. 在 `lib/core/llm/index.ts` 的 `createLLMProvider` 工厂函数中注册
4. 在 `LLMProvider` 类型中添加新的提供商名称

### 添加新的人格模式

1. 在 `lib/core/digital-life/types.ts` 的 `PersonaMode` 类型中添加
2. 在 `PERSONA_MODE_LABELS` 中添加标签
3. 在 `DecisionEngine` 中添加触发逻辑
4. 在 `DigitalLifeAgent` 的 `responseTemplates` 中添加回复模板

## 📝 更新日志

### v2.0.0
- ✨ 全新数字生命引擎 v2
- ✨ 8 种人格模式系统
- ✨ 人格矩阵和关系系统
- ✨ 记忆系统和成长演化
- ✨ 礼物系统和技能系统
- ✨ 可插拔 LLM 接入层
- ✨ Live2D 虚拟形象
- 🎨 全新 UI 设计

## 📄 许可证

MIT License

---

**用 AI 温暖每一个孤独的灵魂 💜**
