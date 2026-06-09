# LifeOS Marketing Agent V3.0

## AI爆品发现 + 内容工厂 + 矩阵带货系统

```
爆品发现 → 热点匹配 → 内容生产 → 自动混剪 → 矩阵发布 → 带货成交
```

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    LifeOS V3.0 系统                          │
├─────────────────────────────────────────────────────────────┤
│  Agent 1: 爆品雷达    │  自动抓取抖音/京东/淘宝/拼多多联盟   │
│  Agent 2: 热点雷达    │  自动采集抖音/微博/百度/小红书热搜    │
│  Agent 3: 趋势匹配    │  热点+商品智能匹配                    │
│  Agent 4: 卖点分析    │  DeepSeek分析痛点/卖点/场景          │
│  Agent 5: 内容工厂    │  批量生成图文/口播/种草文案          │
│  Agent 6: 图片重组    │  商品图自动处理                      │
│  Agent 7: 视频混剪    │  FFmpeg自动剪辑+字幕+配音            │
│  Agent 8: 矩阵发布    │  Playwright自动发布到多平台          │
│  Agent 9: 数据分析    │  运营统计+佣金追踪                   │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
marketing-agent/
├── agents/                 # AI Agent模块
│   ├── product_radar.py    # Agent 1: 爆品雷达
│   ├── topic_radar.py       # Agent 2: 热点雷达
│   ├── product_analyzer.py   # Agent 4: 卖点分析
│   ├── content_factory.py    # Agent 5: 内容工厂
│   └── publisher.py          # Agent 8: 矩阵发布
├── database/               # 数据库
│   └── models.py            # SQLite数据模型
├── services/               # 服务层
│   └── api.py               # Flask API服务
└── web/                    # 前端仪表盘
    ├── src/pages/          # 页面组件
    └── vite.config.js       # Vite配置
```

## 快速启动

### 1. 安装依赖

```bash
# Python依赖
pip install flask flask-cors aiohttp

# 前端依赖
cd web && npm install
```

### 2. 启动API服务

```bash
cd services
python api.py
# 服务运行在 http://localhost:3002
```

### 3. 启动前端

```bash
cd web
npm run dev
# 前端运行在 http://localhost:5174
```

## 核心功能

### Agent 1: 爆品雷达
- 自动抓取抖音/京东/淘宝/拼多多联盟商品
- 计算爆品指数：销量×0.3 + 增长率×0.3 + 佣金率×0.2 + 评分×0.2
- 实时更新爆品池

### Agent 2: 热点雷达
- 监控抖音/微博/百度/小红书热搜
- 热点与商品智能匹配

### Agent 4: 卖点分析
- DeepSeek分析用户痛点
- 生成核心卖点、使用场景、目标人群
- 情绪触发点挖掘

### Agent 5: 内容工厂
- 批量生成小红书种草文案
- 抖音口播脚本
- 测评/对比文案

### Agent 8: 矩阵发布
- Playwright自动化发布
- 多平台支持：小红书/抖音/视频号/快手
- 多账号管理

## MVP开发路线

| Phase | 内容 | 周期 |
|-------|------|------|
| Phase 1 | 爆品抓取 + 内容生成 + 小红书发布 | 3天 |
| Phase 2 | 图片重组 + 自动封面 | 3天 |
| Phase 3 | 自动混剪 + 字幕 + 配音 | 5天 |
| Phase 4 | 视频号/抖音发布 | 5天 |
| Phase 5 | 数据统计 + 佣金追踪 | 5天 |

## 技术栈

- **内容生成**: DeepSeek API
- **图片处理**: Pillow, OpenCV
- **视频处理**: FFmpeg, MoviePy
- **配音**: Edge-TTS
- **自动化**: Playwright
- **数据库**: SQLite (MVP) / MySQL (Production)
- **前端**: React + Vite + TailwindCSS

## 设计原则

### 不做
- AI绘图/AI视频生成/数字人
- 高额API调用
- 高额GPU算力

### 采用
- 商品素材抓取
- 图片自动重组
- 免费视频混剪
- 免费配音
- 自动发布

目标：**最低成本运行**
