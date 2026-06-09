# 电商商品价格自动化采集与对比工具

一个支持多平台（京东、淘宝、拼多多模拟）商品价格采集、清洗、对比与可视化的命令行工具 + Web 演示。

## 功能特性

- 🔍 **多平台采集**：按关键词从多个电商平台批量采集商品信息
- 🧹 **智能清洗**：自动去重、异常值过滤、数据标准化
- 📊 **多维对比**：横向对比表 + 价格从低到高排序 + 性价比智能标注
- 📈 **趋势图表**：自动生成价格分布与平台对比图表
- 💻 **双端运行**：命令行 CLI + Flask Web 演示界面

## 目录结构

```
/workspace
├── cli.py                  # 命令行入口
├── app.py                  # Flask Web 演示入口
├── requirements.txt        # 依赖
├── sample/
│   └── sample_data.py      # 示例数据（用于初始化演示）
├── scraper/
│   ├── __init__.py
│   ├── base.py             # 采集器基类
│   ├── jd.py               # 京东采集器
│   ├── taobao.py           # 淘宝采集器
│   └── pdd.py              # 拼多多采集器
├── analyzer/
│   ├── __init__.py
│   ├── cleaner.py          # 数据清洗与去重
│   ├── comparator.py       # 排序与性价比评分
│   └── visualizer.py       # 图表生成
├── templates/
│   └── index.html          # 演示网页
└── output/                 # 运行结果输出目录
```

## 快速开始

```bash
pip install -r requirements.txt

# 命令行方式
python cli.py --keyword "iPhone 15" --output output/

# Web 演示方式
python app.py
# 访问 http://localhost:5000
```

## 架构说明

1. **采集层**：平台专用采集器统一继承 `BaseScraper`，输出标准化数据结构
2. **分析层**：清洗 → 去重 → 排序 → 性价比评分流水线处理
3. **展示层**：CLI 输出 JSON/CSV + Web 端实时渲染图表与对比表
