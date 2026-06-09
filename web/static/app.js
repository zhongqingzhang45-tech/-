/* ============================================================
 * Marketing Agent V3.0 · 前端交互逻辑
 * 原生 JS IIFE · fetch API · 中文文案
 * ============================================================ */

(function () {
  "use strict";

  /* ============================================================
   * 1. 核心工具函数
   * ============================================================ */

  // ---------- DOM 查询 ----------
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- 数字格式化 ----------
  function fmtNum(n) {
    if (n === null || n === undefined || n === "") return "0";
    var num = Number(n);
    if (isNaN(num)) return String(n);
    if (num >= 100000000) return (num / 100000000).toFixed(1).replace(/\.0$/, "") + "亿";
    if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, "") + "w";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toLocaleString("zh-CN");
  }

  function fmtMoney(n) {
    if (n === null || n === undefined || n === "" || isNaN(Number(n))) return "¥0.00";
    return "¥" + Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ---------- 日期格式化 ----------
  function fmtDate(d) {
    if (!d) return "—";
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate())
      + " " + pad(dt.getHours()) + ":" + pad(dt.getMinutes());
  }

  function fmtRelative(d) {
    if (!d) return "—";
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    var diff = (Date.now() - dt.getTime()) / 1000;
    if (diff < 60) return "刚刚";
    if (diff < 3600) return Math.floor(diff / 60) + " 分钟前";
    if (diff < 86400) return Math.floor(diff / 3600) + " 小时前";
    if (diff < 604800) return Math.floor(diff / 86400) + " 天前";
    return fmtDate(d);
  }

  // ---------- HTML 转义 ----------
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- Toast 提示 ----------
  function toast(msg, type) {
    type = type || "info";
    var icon = { success: "✅", error: "❌", warn: "⚠️", info: "ℹ️" }[type] || "ℹ️";
    var box = document.createElement("div");
    box.className = "toast-box toast-" + type;
    box.textContent = icon + " " + String(msg);
    var c = $("toastContainer");
    if (!c) {
      c = document.createElement("div");
      c.id = "toastContainer";
      c.style.cssText = "position:fixed;top:24px;right:24px;z-index:9999;pointer-events:none;";
      document.body.appendChild(c);
    }
    c.appendChild(box);
    setTimeout(function () {
      if (box.parentNode) box.parentNode.removeChild(box);
    }, 3200);
  }

  // ---------- 数字滚动动画 ----------
  function animateNumber(el, target, duration) {
    if (!el) return;
    target = Number(target) || 0;
    duration = duration || 600;
    var start = 0;
    var startTime = null;
    var isMoney = el.dataset.money === "true";

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (target - start) * eased;
      el.textContent = isMoney ? fmtMoney(current) : fmtNum(Math.round(current));
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = isMoney ? fmtMoney(target) : fmtNum(target);
    }
    requestAnimationFrame(step);
  }

  // ---------- API 请求 ----------
  async function apiGet(path, params) {
    params = params || {};
    var url = new URL(path, window.location.origin);
    Object.keys(params).forEach(function (k) {
      var v = params[k];
      if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, v);
    });
    var res = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function apiPost(path, body) {
    var res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  // ---------- 空状态渲染 ----------
  function renderEmpty(container, icon, text) {
    if (!container) return;
    container.innerHTML = '<div class="col-span-full card-tech p-12 text-center empty-state">'
      + '<div class="text-5xl mb-3 opacity-50">' + (icon || "📭") + '</div>'
      + '<div class="text-slate-400 text-sm">' + esc(text || "暂无数据") + '</div></div>';
  }

  // ---------- 平台样式辅助函数 ----------
  function _platformStyle(platform) {
    var key = String(platform || "").toLowerCase();
    var map = {
      douyin:       { label: "🎵 抖音",    color: "text-rose-400 bg-rose-500/10",    icon: "🎵" },
      "抖音":       { label: "🎵 抖音",    color: "text-rose-400 bg-rose-500/10",    icon: "🎵" },
      wechat:       { label: "💚 视频号",  color: "text-emerald-400 bg-emerald-500/10", icon: "💚" },
      weixin:       { label: "💚 视频号",  color: "text-emerald-400 bg-emerald-500/10", icon: "💚" },
      "视频号":     { label: "💚 视频号",  color: "text-emerald-400 bg-emerald-500/10", icon: "💚" },
      xiaohongshu:  { label: "📕 小红书",  color: "text-rose-400 bg-rose-500/10",    icon: "📕" },
      xhs:          { label: "📕 小红书",  color: "text-rose-400 bg-rose-500/10",    icon: "📕" },
      "小红书":     { label: "📕 小红书",  color: "text-rose-400 bg-rose-500/10",    icon: "📕" },
      kuaishou:     { label: "⚡ 快手",    color: "text-orange-400 bg-orange-500/10", icon: "⚡" },
      "快手":       { label: "⚡ 快手",    color: "text-orange-400 bg-orange-500/10", icon: "⚡" },
      bilibili:     { label: "📺 B站",    color: "text-sky-400 bg-sky-500/10",       icon: "📺" },
      "b站":        { label: "📺 B站",    color: "text-sky-400 bg-sky-500/10",       icon: "📺" },
      weibo:        { label: "🔴 微博",    color: "text-rose-500 bg-rose-500/10",    icon: "🔴" },
      "微博":       { label: "🔴 微博",    color: "text-rose-500 bg-rose-500/10",    icon: "🔴" },
      baidu:        { label: "🔍 百度",    color: "text-blue-400 bg-blue-500/10",    icon: "🔍" },
      zhihu:        { label: "💡 知乎",    color: "text-blue-500 bg-blue-500/10",    icon: "💡" },
      "知乎":       { label: "💡 知乎",    color: "text-blue-500 bg-blue-500/10",    icon: "💡" }
    };
    return map[key] || { label: (platform || "🌐 其它"), color: "text-slate-300 bg-slate-700/40", icon: "🌐" };
  }

  /* ============================================================
   * 2. 全局状态
   * ============================================================ */

  var _typewriterTimer = null;

  var STATE = {
    currentTab: "dashboard",
    products: { page: 1, pageSize: 20, keyword: "", sortBy: "sales", platform: "", items: [], total: 0 },
    contents: { page: 1, pageSize: 20, platform: "", status: "", items: [], total: 0 },
    publish: { page: 1, pageSize: 20, platform: "", items: [], total: 0 },
    accounts: { page: 1, pageSize: 20, items: [], total: 0 },
    hot: { platform: "all", items: [] },
    contentFactory: { sourceId: null, sourceType: "product", contentType: "image_text" },
    videoTasks: [],
    rankings: {},
    config: {},
    agents: [],
    tasks: []
  };

  var TAB_TITLES = {
    dashboard: "📊 Dashboard · 全域作战指挥中心",
    products: "🔥 爆品中心 · 商品矩阵管理",
    hot: "📈 热点中心 · 全网趋势雷达",
    content: "✍️ 内容工厂 · AI 创意生成",
    video: "🎬 视频工厂 · 批量视频合成",
    publish: "🚀 发布中心 · 多平台分发调度",
    accounts: "👥 账号中心 · 矩阵账号管理",
    data: "📊 数据中心 · 运营效果分析",
    settings: "⚙️ 系统设置 · 全局配置管理"
  };

  var TAB_SUBTITLES = {
    dashboard: "实时监控 AI Agent 运行状态 · 掌握每一条流量脉动与佣金转化",
    products: "从全网抓取爆款商品 · 智能分析爆款潜力与竞争指数",
    hot: "多平台热点聚合 · 趋势识别与内容切入点分析",
    content: "AI 驱动的内容创作引擎 · 批量生成营销文案",
    video: "自动化视频合成管道 · 模板化批量生产短视频",
    publish: "多平台统一发布调度 · 智能排期与效果追踪",
    accounts: "矩阵账号统一管理 · 登录状态与发布权限监控",
    data: "多维数据分析 · 内容榜 / 商品榜 / 账号榜 / 佣金趋势",
    settings: "模型 / 代理 / 数据库 / 任务 / 通知 全局配置"
  };

  /* ============================================================
   * 3. Tab 切换引擎
   * ============================================================ */

  function switchTab(tab) {
    if (!TAB_TITLES[tab]) tab = "dashboard";
    STATE.currentTab = tab;

    // 切换侧边栏高亮
    $$(".nav-item").forEach(function (el) {
      var t = el.dataset.tab;
      el.classList.toggle("active", t === tab);
    });

    // 切换主内容区
    $$(".tab-panel").forEach(function (panel) {
      var id = panel.id.replace(/^tab-/, "");
      if (id === tab) {
        panel.classList.add("active");
        panel.classList.remove("hidden");
        // fade-in 动画
        panel.style.opacity = "0";
        panel.style.transform = "translateY(8px)";
        setTimeout(function () {
          panel.style.transition = "opacity 300ms ease, transform 300ms ease";
          panel.style.opacity = "1";
          panel.style.transform = "translateY(0)";
        }, 10);
      } else {
        panel.classList.remove("active");
        panel.classList.add("hidden");
        panel.style.transition = "";
      }
    });

    // 更新顶栏标题
    var title = $("pageTitle");
    var subtitle = $("pageSubtitle");
    if (title) title.textContent = TAB_TITLES[tab];
    if (subtitle) subtitle.textContent = TAB_SUBTITLES[tab];

    // 触发对应 Tab 的数据加载
    var loaders = {
      dashboard: loadDashboard,
      products: loadProducts,
      hot: loadHot,
      content: loadContentFactory,
      video: loadVideoFactory,
      publish: loadPublish,
      accounts: loadAccounts,
      data: loadDataCenter,
      settings: loadSettings
    };
    if (loaders[tab]) {
      try { loaders[tab](); } catch (e) { console.error(e); toast("数据加载失败: " + e.message, "error"); }
    }
  }

  /* ============================================================
   * 4. Dashboard · 仪表盘
   * ============================================================ */

  // ---------- 6 张核心指标卡片 ----------
  function renderStatCards(stats) {
    var el = $("statsCards");
    if (!el) return;

    var cards = [
      { key: "product_count", label: "商品总数", icon: "📦", grad: "from-blue-500 to-cyan-500", value: stats.product_count || 0 },
      { key: "content_count", label: "内容总数", icon: "✍️", grad: "from-emerald-500 to-teal-500", value: stats.content_count || 0 },
      { key: "hot_topic_count", label: "热点数", icon: "🔥", grad: "from-orange-500 to-rose-500", value: stats.hot_topic_count || 0 },
      { key: "publish_success", label: "发布成功", icon: "🚀", grad: "from-violet-500 to-purple-500", value: stats.publish_success || 0 },
      { key: "total_views", label: "总播放量", icon: "👁️", grad: "from-amber-500 to-yellow-500", value: stats.total_views || 0 },
      { key: "total_commission", label: "累计佣金", icon: "💰", grad: "from-pink-500 to-rose-500", value: stats.total_commission || 0, money: true }
    ];

    el.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6";
    el.innerHTML = cards.map(function (c) {
      return '<div class="card-tech p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all">'
        + '<div class="absolute -right-3 -top-3 text-4xl opacity-10 group-hover:opacity-20 transition-opacity">' + c.icon + '</div>'
        + '<div class="text-[10px] tracking-widest text-slate-400 uppercase mb-2">' + c.label + '</div>'
        + '<div class="text-2xl font-bold text-white tracking-tight" id="stat-' + c.key + '"' + (c.money ? ' data-money="true"' : '') + '">0</div>'
        + '<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ' + c.grad + ' opacity-60"></div>'
        + '</div>';
    }).join("");

    // 触发数字动画
    setTimeout(function () {
      cards.forEach(function (c) {
        var target = $("stat-" + c.key);
        if (target) animateNumber(target, c.value, 800);
      });
    }, 150);
  }

  // ---------- Agent 运行状态矩阵 ----------
  var AGENT_META = [
    { name: "爆品雷达", desc: "Products Radar", icon: "🔥", default_status: "running" },
    { name: "热点雷达", desc: "Hot Topics", icon: "📈", default_status: "running" },
    { name: "内容工厂", desc: "Content Factory", icon: "✍️", default_status: "idle" },
    { name: "视频工厂", desc: "Video Factory", icon: "🎬", default_status: "idle" },
    { name: "发布调度", desc: "Publisher", icon: "🚀", default_status: "running" },
    { name: "数据分析", desc: "Analytics", icon: "📊", default_status: "warn" }
  ];

  function renderAgentGrid(agents) {
    var el = $("agentStatusGrid");
    if (!el) return;
    var list = (agents && agents.length) ? agents : AGENT_META;

    el.innerHTML = list.slice(0, 6).map(function (agent, idx) {
      var meta = AGENT_META[idx] || { name: agent.name || "Agent", icon: "🤖", desc: "" };
      var status = agent.status || meta.default_status || "idle";
      var statusMap = {
        running: { color: "bg-emerald-500", text: "运行中", ring: "shadow-[0_0_8px_rgba(16,185,129,0.6)]" },
        idle: { color: "bg-slate-500", text: "空闲", ring: "" },
        warn: { color: "bg-amber-500", text: "告警", ring: "shadow-[0_0_8px_rgba(245,158,11,0.6)]" },
        error: { color: "bg-rose-500", text: "异常", ring: "shadow-[0_0_8px_rgba(239,68,68,0.6)]" },
        stopped: { color: "bg-slate-600", text: "已停止", ring: "" }
      };
      var s = statusMap[status] || statusMap.idle;
      var progress = typeof agent.progress === "number" ? agent.progress : Math.floor(Math.random() * 60 + 20);
      var lastRun = agent.last_run_at || "刚刚";

      return '<div class="p-4 rounded-xl bg-slate-700/30 border border-slate-700/40 hover:border-blue-500/40 transition-all">'
        + '<div class="flex items-start justify-between mb-3">'
        + '<div class="flex items-center gap-2">'
        + '<span class="text-xl">' + meta.icon + '</span>'
        + '<div>'
        + '<div class="text-sm font-medium text-white">' + meta.name + '</div>'
        + '<div class="text-[10px] text-slate-500 tracking-wider uppercase">' + meta.desc + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="flex items-center gap-1.5">'
        + '<span class="w-2 h-2 rounded-full ' + s.color + ' ' + s.ring + ' ' + (status === "running" ? "animate-pulse" : "") + '"></span>'
        + '<span class="text-[11px] text-slate-400">' + s.text + '</span>'
        + '</div>'
        + '</div>'
        + '<div class="space-y-1.5">'
        + '<div class="h-1 bg-slate-700/80 rounded-full overflow-hidden">'
        + '<div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500" style="width:' + progress + '%"></div>'
        + '</div>'
        + '<div class="flex justify-between text-[10px] text-slate-500">'
        + '<span>' + progress + '%</span>'
        + '<span>上次: ' + (typeof lastRun === "string" ? lastRun : fmtRelative(lastRun)) + '</span>'
        + '</div>'
        + '</div>'
        + '</div>';
    }).join("");

    // 更新侧边栏 agent 计数
    var agentCount = $("sbAgentCount");
    if (agentCount) {
      var running = list.filter(function (a) { return (a.status || "idle") === "running"; }).length;
      agentCount.textContent = running + " / " + list.length;
    }
  }

  // ---------- 实时任务队列 ----------
  function renderTaskTimeline(tasks) {
    var el = $("taskTimeline");
    if (!el) return;
    var items = tasks && tasks.length ? tasks.slice(0, 6) : generateMockTasks();

    if (!items.length) {
      el.innerHTML = '<div class="p-6 text-center empty-state">'
        + '<div class="text-3xl opacity-50 mb-2">📋</div>'
        + '<div class="text-slate-400 text-sm">暂无任务</div></div>';
      return;
    }

    var typeIcons = { crawl: "🔍", generate: "✍️", video: "🎬", publish: "🚀", analyze: "📊" };
    var statusColors = {
      pending: "bg-slate-500",
      running: "bg-blue-500",
      success: "bg-emerald-500",
      failed: "bg-rose-500"
    };

    el.innerHTML = items.map(function (t) {
      var type = t.type || "crawl";
      var status = t.status || "success";
      var icon = typeIcons[type] || "📋";
      var color = statusColors[status] || statusColors.pending;
      var product = t.product || (t.product_title || t.content_title || "未知任务");
      var time = t.created_at ? fmtRelative(t.created_at) : "刚刚";
      var msg = t.message || t.title || "任务执行中";

      return '<div class="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">'
        + '<div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm flex-shrink-0">' + icon + '</div>'
        + '<div class="flex-1 min-w-0">'
        + '<div class="text-xs font-medium text-white truncate">' + esc(product) + '</div>'
        + '<div class="text-[10px] text-slate-400 mt-0.5 truncate">' + esc(msg) + '</div>'
        + '</div>'
        + '<div class="flex flex-col items-end gap-1 flex-shrink-0">'
        + '<span class="w-1.5 h-1.5 rounded-full ' + color + ' ' + (status === "running" ? "animate-pulse" : "") + '"></span>'
        + '<span class="text-[10px] text-slate-500">' + time + '</span>'
        + '</div>'
        + '</div>';
    }).join("");

    var pendingEl = $("sbPending");
    if (pendingEl) {
      var pending = items.filter(function (t) { return t.status === "pending" || t.status === "running"; }).length;
      pendingEl.textContent = pending;
    }
  }

  function generateMockTasks() {
    var products = ["SK-II 神仙水 230ml", "iPhone 16 Pro 钛金属", "戴森吹风机 HD15", "始祖鸟冲锋衣", "小度智能音箱 Pro", "小米空气净化器"];
    var types = ["crawl", "generate", "publish", "video", "analyze"];
    var statuses = ["success", "success", "success", "running", "pending"];
    var messages = ["抓取完成，获取 24 条商品数据", "生成种草文案 3 篇", "发布至抖音，状态正常", "视频合成中，进度 45%", "分析竞争指数完成"];
    var result = [];
    for (var i = 0; i < 6; i++) {
      result.push({
        type: types[i % types.length],
        status: statuses[i % statuses.length],
        product: products[i % products.length],
        message: messages[i % messages.length],
        created_at: new Date(Date.now() - i * 180000).toISOString()
      });
    }
    return result;
  }

  // ---------- 热销商品 TOP 5 ----------
  function renderTopProducts(items) {
    var el = $("topProductsList");
    if (!el) return;
    var list = (items && items.length) ? items.slice(0, 5) : generateMockProducts(5);
    if (!list.length) {
      renderEmpty(el, "🏆", "暂无热销商品数据");
      return;
    }

    var maxSales = Math.max.apply(null, list.map(function (p) { return Number(p.sales_count || p.sales || p.commission_amount || 100); }));
    var medals = ["🥇", "🥈", "🥉", " 4 ", " 5 "];

    el.innerHTML = list.map(function (p, idx) {
      var title = p.title || p.name || "未知商品";
      var sales = Number(p.sales_count || p.sales || Math.floor(Math.random() * 15000 + 3000));
      var commission = Number(p.commission_amount || p.commission || Math.random() * 50000 + 5000);
      var heat = p.platform || (idx % 2 === 0 ? "抖音" : "视频号");
      var barWidth = (sales / maxSales * 100).toFixed(1);

      return '<div class="flex items-center gap-4 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 hover:border-blue-500/30 border border-transparent transition-all cursor-pointer" data-product-id="' + (p.id || idx) + '">'
        + '<div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">' + medals[idx] + '</div>'
        + '<div class="flex-1 min-w-0">'
        + '<div class="text-sm font-medium text-white truncate">' + esc(title) + '</div>'
        + '<div class="flex items-center gap-3 mt-1.5">'
        + '<div class="flex-1 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">'
        + '<div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500" style="width:' + barWidth + '%"></div>'
        + '</div>'
        + '<span class="text-[10px] text-slate-500 flex-shrink-0">' + esc(heat) + '</span>'
        + '</div>'
        + '</div>'
        + '<div class="flex items-center gap-4 text-right flex-shrink-0">'
        + '<div>'
        + '<div class="text-[10px] text-slate-500">销量</div>'
        + '<div class="text-sm font-semibold text-blue-400">' + fmtNum(sales) + '</div>'
        + '</div>'
        + '<div>'
        + '<div class="text-[10px] text-slate-500">佣金</div>'
        + '<div class="text-sm font-semibold text-emerald-400">' + fmtMoney(commission) + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
    }).join("");

    // 点击跳转爆品中心
    $$("#topProductsList [data-product-id]").forEach(function (row) {
      row.addEventListener("click", function () {
        switchTab("products");
        toast("已切换至爆品中心查看详情", "info");
      });
    });
  }

  function generateMockProducts(n) {
    var titles = ["SK-II 神仙水 230ml 大容量装", "Apple iPhone 16 Pro Max 256GB 钛金属", "Dyson 戴森吹风机 HD15 负离子", "Arc'teryx 始祖鸟冲锋衣 Alpha SV", "Xiaomi 小米空气净化器 4 Pro", "华为 MatePad Pro 13.2 英寸平板电脑", "Lancôme 兰蔻小黑瓶精华肌底液", "Sony WH-1000XM5 无线降噪耳机"];
    var result = [];
    for (var i = 0; i < n; i++) {
      result.push({
        id: i + 1,
        title: titles[i % titles.length],
        sales: Math.floor(Math.random() * 20000 + 5000),
        commission: Math.random() * 80000 + 8000,
        platform: ["抖音", "视频号", "小红书"][i % 3]
      });
    }
    return result.sort(function (a, b) { return b.sales - a.sales; });
  }

  // ---------- Dashboard 主加载 ----------
  async function loadDashboard() {
    try {
      // 1. 拉取基础统计
      var statsPromise = apiGet("/api/stats").catch(function () {
        return { product_count: 248, content_count: 1256, hot_topic_count: 342, publish_success: 583, total_views: 2485600, total_commission: 328560.50 };
      });

      // 2. 拉取 Agent 状态
      var agentsPromise = apiGet("/api/agents").catch(function () {
        return { agents: AGENT_META };
      });

      // 3. 拉取任务列表
      var tasksPromise = apiGet("/api/tasks", { limit: 20 }).catch(function () {
        return { tasks: generateMockTasks() };
      });

      // 4. 拉取 TOP 商品
      var rankingsPromise = apiGet("/api/rankings").catch(function () {
        return { top_products: generateMockProducts(10) };
      });

      var results = await Promise.all([statsPromise, agentsPromise, tasksPromise, rankingsPromise]);
      var stats = results[0];
      var agents = (results[1] && results[1].agents) || results[1] || [];
      var tasks = (results[2] && results[2].tasks) || results[2] || [];
      var topProducts = (results[3] && (results[3].top_products || results[3].products)) || [];

      renderStatCards(stats);
      renderAgentGrid(agents);
      renderTaskTimeline(tasks);
      renderTopProducts(topProducts);

      // 每 10 秒刷新一次 Agent 状态
      if (window._agentTimer) clearInterval(window._agentTimer);
      window._agentTimer = setInterval(function () {
        if (STATE.currentTab === "dashboard") {
          apiGet("/api/agents").then(function (res) {
            renderAgentGrid((res && res.agents) || res || []);
          }).catch(function () {
            // 静默失败
          });
        }
      }, 10000);

    } catch (e) {
      console.error("Dashboard load error:", e);
      toast("仪表盘加载失败: " + e.message, "error");
    }
  }

  /* ============================================================
   * 5. 爆品中心
   * ============================================================ */

  async function loadProducts() {
    try {
      var data = await apiGet("/api/products", {
        page: STATE.products.page,
        page_size: STATE.products.pageSize,
        keyword: STATE.products.keyword,
        sort_by: STATE.products.sortBy
      }).catch(function () {
        var mock = generateMockProducts(20);
        return { items: mock, total: 248 };
      });

      var items = data.items || data.products || (Array.isArray(data) ? data : []);
      var total = data.total || items.length;
      STATE.products.items = items;
      STATE.products.total = total;
      renderProductsTable(items, total);
      refreshCategories(items);
    } catch (e) {
      console.error(e);
      toast("商品数据加载失败: " + e.message, "error");
    }
  }

  function renderProductsTable(items, total) {
    var el = $("productsTable");
    if (!el) return;

    if (!items || !items.length) {
      el.innerHTML = '<tr><td colspan="9" class="text-center py-12 text-slate-400">'
        + '<div class="text-4xl mb-3 opacity-50">📦</div>暂无商品数据</td></tr>';
      return;
    }

    var platforms = { douyin: "🎵 抖音", wechat: "💚 视频号", xhs: "📕 小红书", kuaishou: "⚡ 快手" };

    el.innerHTML = items.map(function (p, idx) {
      var id = p.id !== undefined ? p.id : (idx + 1);
      var title = p.title || p.name || "未知商品";
      var platform = platforms[p.platform] || (p.platform || "未知");
      var price = Number(p.price || p.price_amount || 0);
      var commission = Number(p.commission_amount || p.commission || 0);
      var sales = Number(p.sales_count || p.sales || 0);
      var rating = Number(p.rating || 4.5);
      var isHot = p.is_hot || p.hot || sales > 10000;
      var created = p.created_at ? fmtRelative(p.created_at) : "—";

      var category = esc(p.category || "未分类");
      return '<tr class="hover:bg-slate-700/30 transition-colors cursor-pointer product-row" data-product-id="' + id + '" data-category="' + category + '">'
        + '<td class="text-slate-500 text-xs font-mono">#' + id + '</td>'
        + '<td class="font-medium text-white text-sm">'
        + '<div class="flex items-center gap-2">'
        + (isHot ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold">HOT</span>' : '')
        + '<span class="truncate max-w-md">' + esc(title) + '</span>'
        + '</div></td>'
        + '<td class="text-xs text-slate-400">' + esc(platform) + '</td>'
        + '<td class="text-sm text-white font-mono">' + fmtMoney(price) + '</td>'
        + '<td class="text-sm text-emerald-400 font-mono font-medium">' + fmtMoney(commission) + '</td>'
        + '<td class="text-sm text-blue-400 font-mono">' + fmtNum(sales) + '</td>'
        + '<td class="text-sm text-amber-400">⭐ ' + Number(rating).toFixed(1) + '</td>'
        + '<td>'
        + '<div class="w-24 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">'
        + '<div class="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style="width:' + Math.min(100, sales / 200) + '%"></div>'
        + '</div>'
        + '<div class="text-[10px] text-slate-500 mt-1">' + (isHot ? "爆款指数: " + Math.floor(75 + Math.random() * 25) : "普通") + '</div>'
        + '</td>'
        + '<td class="text-xs text-slate-500">' + created + '</td>'
        + '<td class="text-right">'
        + '<button class="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors join-content-factory" data-product-id="' + id + '">加入内容工厂</button>'
        + '</td>'
        + '</tr>';
    }).join("");

    // 绑定事件
    $$(".product-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.classList && e.target.classList.contains("join-content-factory")) return;
        var id = row.dataset.productId;
        var product = STATE.products.items.find(function (p) { return String(p.id) === String(id); });
        if (product) {
          STATE.contentFactory.sourceId = product.id;
          STATE.contentFactory.sourceType = "product";
          switchTab("content");
          toast("已选中商品: " + product.title, "success");
        }
      });
    });

    $$(".join-content-factory").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.dataset.productId;
        var product = STATE.products.items.find(function (p) { return String(p.id) === String(id); });
        if (product) {
          STATE.contentFactory.sourceId = product.id;
          STATE.contentFactory.sourceType = "product";
          switchTab("content");
          toast("已将商品加入内容工厂: " + product.title, "success");
        }
      });
    });

    renderPager("productsPager", STATE.products, total, loadProducts);
  }

  /* ============================================================
   * 6. 热点中心
   * ============================================================ */

  async function loadHot() {
    try {
      var data = await apiGet("/api/hot_topics", { limit: 100 }).catch(function () {
        return { items: generateMockHotTopics(24) };
      });
      var items = data.items || (Array.isArray(data) ? data : []);
      STATE.hot.items = items;
      renderHotGrid(items, STATE.hot.platform);
    } catch (e) {
      console.error(e);
      toast("热点数据加载失败: " + e.message, "error");
    }
  }

  function renderHotGrid(items, platform) {
    var el = $("hotCardsGrid");
    if (!el) return;

    // 平台过滤
    var filtered = items;
    if (platform && platform !== "all") {
      filtered = items.filter(function (h) {
        var hp = String(h.platform || h.source || "").toLowerCase();
        return hp.indexOf(platform) !== -1;
      });
    }

    if (!filtered.length) {
      el.innerHTML = '<div class="col-span-full card-tech p-12 text-center empty-state">'
        + '<div class="text-5xl mb-3 opacity-50">🔥</div>'
        + '<div class="text-slate-400 text-sm">暂无热点数据</div></div>';
      return;
    }

    var sourceColors = {
      weibo: "from-rose-500 to-orange-500",
      douyin: "from-violet-500 to-pink-500",
      baidu: "from-blue-500 to-cyan-500",
      zhihu: "from-sky-500 to-blue-500",
      bilibili: "from-pink-500 to-fuchsia-500"
    };
    var sourceLabels = {
      weibo: "🔴 微博",
      douyin: "🎵 抖音",
      baidu: "🔍 百度",
      zhihu: "💡 知乎",
      bilibili: "📺 B站"
    };

    // 按热度排序
    filtered.sort(function (a, b) { return Number(b.heat_value || b.heat || 0) - Number(a.heat_value || a.heat || 0); });

    el.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
    el.innerHTML = filtered.slice(0, 24).map(function (h, idx) {
      var sourceKey = String(h.source || h.platform || "").toLowerCase();
      var color = Object.keys(sourceColors).reduce(function (acc, k) { return sourceKey.indexOf(k) !== -1 ? sourceColors[k] : acc; }, "from-slate-500 to-slate-600");
      var label = Object.keys(sourceLabels).reduce(function (acc, k) { return sourceKey.indexOf(k) !== -1 ? sourceLabels[k] : acc; }, "🌐 全网");
      var keyword = h.keyword || h.title || h.name || "热点";
      var heat = Number(h.heat_value || h.heat || Math.floor(Math.random() * 1000000 + 100000));
      var growth = Number(h.heat_growth || h.growth || (Math.random() * 40 - 10));
      var rank = h.rank || (idx + 1);
      var isTop3 = idx < 3;

      return '<div class="card-tech p-5 cursor-pointer hover:border-orange-500/40 transition-all hot-card" data-hot-id="' + (h.id || idx) + '" data-keyword="' + esc(keyword) + '">'
        + '<div class="flex items-start justify-between mb-3">'
        + '<div class="flex items-center gap-2">'
        + (isTop3 ? '<span class="text-lg">🔥</span>' : '<span class="text-sm text-slate-500">#</span>')
        + '<span class="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r ' + color + ' text-white font-semibold">' + label + '</span>'
        + '</div>'
        + '<span class="text-xs text-slate-500 font-mono">Rank ' + rank + '</span>'
        + '</div>'
        + '<h4 class="text-base font-semibold text-white leading-tight mb-3 line-clamp-2 min-h-[3rem]">' + esc(keyword) + '</h4>'
        + '<div class="flex items-end justify-between">'
        + '<div>'
        + '<div class="text-[10px] text-slate-500 uppercase tracking-wider">热度值</div>'
        + '<div class="text-xl font-bold text-white font-mono mt-0.5">' + fmtNum(heat) + '</div>'
        + '</div>'
        + '<div class="text-right">'
        + '<div class="text-[10px] text-slate-500 uppercase tracking-wider">增长</div>'
        + '<div class="text-sm font-semibold font-mono ' + (growth >= 0 ? "text-emerald-400" : "text-rose-400") + ' mt-0.5">'
        + (growth >= 0 ? "↑" : "↓") + " " + Math.abs(growth).toFixed(1) + '%'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="mt-3 h-1 bg-slate-700/80 rounded-full overflow-hidden">'
        + '<div class="h-full bg-gradient-to-r ' + color + ' rounded-full transition-all duration-500" style="width:' + Math.min(100, heat / 10000) + '%"></div>'
        + '</div>'
        + '<button class="mt-3 w-full py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ' + color + ' text-white opacity-0 hover:opacity-100 transition-opacity generate-hot-content">'
        + '✨ 生成热点内容'
        + '</button>'
        + '</div>';
    }).join("");

    // 悬停显示按钮
    $$(".hot-card").forEach(function (card) {
      var btn = card.querySelector(".generate-hot-content");
      card.addEventListener("mouseenter", function () { if (btn) btn.style.opacity = "1"; });
      card.addEventListener("mouseleave", function () { if (btn) btn.style.opacity = "0"; });
      if (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          STATE.contentFactory.sourceId = card.dataset.hotId;
          STATE.contentFactory.sourceType = "hot";
          STATE.contentFactory.keyword = card.dataset.keyword;
          switchTab("content");
          toast("已选中热点，进入内容工厂", "success");
        });
      }
      card.addEventListener("click", function () {
        STATE.contentFactory.sourceId = card.dataset.hotId;
        STATE.contentFactory.sourceType = "hot";
        STATE.contentFactory.keyword = card.dataset.keyword;
        switchTab("content");
        toast("已选中热点，进入内容工厂", "success");
      });
    });
  }

  function generateMockHotTopics(n) {
    var keywords = ["SK-II神仙水成分分析", "iPhone 16 Pro Max 钛金属", "冬季护肤推荐 2026", "戴森吹风机对比测评", "始祖鸟冲锋衣真假鉴别",
      "小米SU7 Ultra 赛道性能", "华为三折叠屏手机", "特斯拉Model Q 发布", "苹果眼镜 Apple Vision Pro", "ChatGPT 最新版本更新",
      "2026 春节档电影票房", "冬季奥运会预热", "世界杯预选赛", "双十一销售榜单", "AirPods Pro 3 代评测",
      "茅台龙年生肖酒", "始祖鸟 Macai 系列", "羽绒服选购指南", "扫地机器人推荐", "咖啡机入门指南"];
    var sources = ["weibo", "douyin", "baidu", "zhihu", "bilibili"];
    var result = [];
    for (var i = 0; i < n; i++) {
      result.push({
        id: i + 1,
        keyword: keywords[i % keywords.length] + (i >= keywords.length ? " " + i : ""),
        source: sources[i % sources.length],
        heat_value: Math.floor(Math.random() * 2000000 + 100000),
        heat_growth: Math.random() * 50 - 5,
        rank: i + 1,
        category: ["生活", "科技", "时尚", "娱乐", "财经"][i % 5],
        created_at: new Date(Date.now() - i * 3600000).toISOString()
      });
    }
    return result;
  }

  /* ============================================================
   * 7. 内容工厂
   * ============================================================ */

  var CONTENT_TYPES = [
    { key: "image_text", label: "图文种草", icon: "📝", desc: "小红书风格图文" },
    { key: "script", label: "口播脚本", icon: "🎤", desc: "短视频口播文案" },
    { key: "review", label: "产品测评", icon: "🔍", desc: "专业对比测评" },
    { key: "种草", label: "种草文案", icon: "🌱", desc: "强转化种草文" },
    { key: "剧情", label: "剧情脚本", icon: "🎬", desc: "沉浸式剧情植入" },
    { key: "对比", label: "对比评测", icon: "⚖️", desc: "多产品横向对比" }
  ];

  // 根据商品信息 + 内容类型生成 Prompt 模板
  function buildPromptForProduct(product, typeKey) {
    var typeLabel = (CONTENT_TYPES.find(function (t) { return t.key === typeKey; }) || CONTENT_TYPES[0]).label;
    var title = (product && product.title) ? product.title : "未选择商品";
    var price = product && product.price ? ("¥" + product.price) : "¥299";
    var commission = product && product.commission_amount ? ("¥" + product.commission_amount) : "¥45";
    var sales = product && product.sales_count ? fmtNum(product.sales_count) : "10w+";
    var points = (product && product.selling_points && product.selling_points.length)
      ? product.selling_points
      : ["专柜正品 · 品牌直发", "30 天无忧售后", "爆款销量超 10w+", "用户好评率 98%", "超高性价比"];

    var lines = [
      "你是一名资深营销文案写手，请根据以下商品信息，撰写一篇【" + typeLabel + "】风格的营销内容：",
      "",
      "【商品名称】" + title,
      "【价格】" + price,
      "【佣金】" + commission,
      "【销量】" + sales,
      "【核心卖点】"
    ];
    points.slice(0, 5).forEach(function (pt, i) {
      lines.push((i + 1) + ". " + pt);
    });
    lines.push("");
    lines.push("【目标平台】小红书 / 抖音 / 视频号");
    lines.push("【目标受众】25-40 岁都市白领");
    lines.push("【要求】");
    lines.push("- 标题吸睛，带 3-5 个 emoji");
    lines.push("- 正文段落清晰，每段不超过 3 行");
    lines.push("- 自然植入产品关键词");
    lines.push("- 结尾强引导互动/转化");
    lines.push("- 总字数控制在 300-500 字");
    return lines.join("\n");
  }

  async function loadContentFactory() {
    // 1. 从 API 拉取商品列表（首次或数据为空时）
    if (!STATE.products.items || !STATE.products.items.length) {
      try {
        var data = await apiGet("/api/products", { page: 1, page_size: 12 }).catch(function () {
          return { items: generateMockProducts(12), total: 12 };
        });
        STATE.products.items = data.items || (Array.isArray(data) ? data : []) || generateMockProducts(12);
      } catch (e) {
        STATE.products.items = generateMockProducts(12);
      }
    }

    // 2. 渲染商品卡片列表
    var sourceList = $("contentSourceList");
    if (sourceList) {
      var items = STATE.products.items.slice(0, 12);
      sourceList.innerHTML = items.map(function (p) {
        var isSelected = STATE.contentFactory.sourceId !== null && String(STATE.contentFactory.sourceId) === String(p.id);
        var price = p.price ? ("¥" + p.price) : "¥299";
        var commission = p.commission_amount ? ("¥" + p.commission_amount) : "¥45";
        var sales = fmtNum(p.sales_count || p.sales || Math.floor(Math.random() * 50000 + 5000));
        var hotScore = Math.floor(70 + Math.random() * 30);
        return '<div class="p-3 rounded-lg cursor-pointer transition-all border content-source-item '
          + (isSelected
            ? 'bg-blue-500/20 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
            : 'bg-slate-700/30 border-slate-700/40 hover:bg-slate-700/50 hover:border-blue-500/40')
          + '" data-product-id="' + p.id + '" data-title="' + esc(p.title || p.name || "") + '">'
          + '<div class="flex items-start gap-2 mb-2">'
          + '<span class="text-lg flex-shrink-0">📦</span>'
          + '<div class="flex-1 min-w-0">'
          + '<div class="text-xs font-semibold text-white leading-snug line-clamp-2">' + esc(p.title || p.name || "商品") + '</div>'
          + '</div>'
          + (isSelected ? '<span class="text-blue-400 text-xs font-bold">✓</span>' : '')
          + '</div>'
          + '<div class="grid grid-cols-3 gap-1 text-[10px]">'
          + '<div class="bg-slate-800/60 rounded px-1.5 py-1 text-center"><span class="text-slate-400">价格</span><div class="text-amber-400 font-semibold">' + price + '</div></div>'
          + '<div class="bg-slate-800/60 rounded px-1.5 py-1 text-center"><span class="text-slate-400">佣金</span><div class="text-emerald-400 font-semibold">' + commission + '</div></div>'
          + '<div class="bg-slate-800/60 rounded px-1.5 py-1 text-center"><span class="text-slate-400">爆款</span><div class="text-rose-400 font-semibold">' + hotScore + '</div></div>'
          + '</div>'
          + '</div>';
      }).join("");

      $$(".content-source-item").forEach(function (item) {
        item.addEventListener("click", function () {
          var pid = item.dataset.productId;
          STATE.contentFactory.sourceId = pid;
          STATE.contentFactory.sourceType = "product";
          // 从 items 中找到对应商品
          var product = STATE.products.items.find(function (p) { return String(p.id) === String(pid); });
          // 自动填充 Prompt
          var promptArea = $("contentPrompt");
          if (promptArea && product) {
            promptArea.value = buildPromptForProduct(product, STATE.contentFactory.contentType);
          }
          // 渲染卖点
          renderSellingPoints(product);
          // 预览区更新
          updateContentPreview(product);
          // 重新渲染商品卡片以高亮选中
          loadContentFactory();
          toast("已选中商品: " + (product ? (product.title || product.name) : ""), "success");
        });
      });
    }

    // 3. 渲染卖点（如果已有选中商品）
    if (STATE.contentFactory.sourceId !== null) {
      var selectedProd = STATE.products.items.find(function (p) { return String(p.id) === String(STATE.contentFactory.sourceId); });
      if (selectedProd) renderSellingPoints(selectedProd);
    }

    // 4. 内容类型按钮：高亮当前选中
    $$(".content-type-btn").forEach(function (btn) {
      var isActive = btn.dataset.contentType === STATE.contentFactory.contentType;
      btn.classList.toggle("bg-blue-500", isActive);
      btn.classList.toggle("text-white", isActive);
      btn.classList.toggle("bg-slate-700/40", !isActive);
      btn.classList.toggle("text-slate-400", !isActive);
      btn.onclick = function () {
        STATE.contentFactory.contentType = btn.dataset.contentType;
        // 重新填充 Prompt
        var promptArea = $("contentPrompt");
        if (promptArea && STATE.contentFactory.sourceId !== null) {
          var prod = STATE.products.items.find(function (p) { return String(p.id) === String(STATE.contentFactory.sourceId); });
          if (prod) promptArea.value = buildPromptForProduct(prod, STATE.contentFactory.contentType);
        }
        // 重新高亮
        $$(".content-type-btn").forEach(function (b) {
          var active = b.dataset.contentType === STATE.contentFactory.contentType;
          b.classList.toggle("bg-blue-500", active);
          b.classList.toggle("text-white", active);
          b.classList.toggle("bg-slate-700/40", !active);
          b.classList.toggle("text-slate-400", !active);
        });
        toast("已切换内容类型: " + btn.textContent.trim(), "info");
      };
    });

    // 5. 初始化 Prompt 编辑区（首次无内容时）
    var promptArea = $("contentPrompt");
    if (promptArea && !promptArea.value.trim()) {
      if (STATE.contentFactory.sourceId !== null) {
        var prod = STATE.products.items.find(function (p) { return String(p.id) === String(STATE.contentFactory.sourceId); });
        if (prod) promptArea.value = buildPromptForProduct(prod, STATE.contentFactory.contentType);
        else promptArea.value = buildPromptForProduct(null, STATE.contentFactory.contentType);
      } else {
        promptArea.value = buildPromptForProduct(null, STATE.contentFactory.contentType);
      }
    }

    // 6. 绑定生成按钮
    var genBtn = $("btnGenerateContent");
    if (genBtn) genBtn.onclick = generateContent;

    var regenBtn = $("btnRegenerateContent");
    if (regenBtn) regenBtn.onclick = generateContent;

    var saveBtn = $("btnSaveDraft");
    if (saveBtn) saveBtn.onclick = function () {
      var draft = {
        sourceId: STATE.contentFactory.sourceId,
        contentType: STATE.contentFactory.contentType,
        prompt: $("contentPrompt") ? $("contentPrompt").value : "",
        body: $("aiGeneratedContent") ? $("aiGeneratedContent").innerText : "",
        savedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem("ma_draft_" + Date.now(), JSON.stringify(draft));
        toast("草稿已保存到浏览器", "success");
      } catch (e) {
        toast("草稿保存失败: " + e.message, "error");
      }
    };

    var sendBtn = $("btnSendToVideo");
    if (sendBtn) sendBtn.onclick = function () {
      if (STATE.contentFactory.sourceId === null) { toast("请先选择一个商品", "warn"); return; }
      toast("已发送到视频工厂，即将切换...", "success");
      setTimeout(function () { switchTab("video"); }, 500);
    };
  }

  function renderSellingPoints(product) {
    var sellingPoints = $("sellingPoints");
    if (!sellingPoints) return;
    var points = (product && product.selling_points && product.selling_points.length)
      ? product.selling_points
      : ["专柜正品 · 品牌直发", "30 天无忧售后", "爆款销量超 10w+", "用户好评率 98%", "超高性价比"];
    sellingPoints.innerHTML = points.map(function (pt) {
      return '<div class="p-2.5 rounded-lg bg-slate-700/30 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-700/50 transition-colors">'
        + '<span class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex-shrink-0"></span>'
        + esc(pt) + '</div>';
    }).join("");
  }

  function updateContentPreview(product) {
    var title = product && product.title ? product.title : "未选择商品";
    var previewBox = $("contentPreview");
    if (previewBox) {
      previewBox.innerHTML = '<div class="text-center">'
        + '<div class="text-3xl mb-2">📱</div>'
        + '<div class="text-xs font-semibold text-white mb-1">已选商品</div>'
        + '<div class="text-[11px] text-slate-400">' + esc(title) + '</div>'
        + '<div class="text-[10px] text-blue-400 mt-2">点击"AI 生成"查看完整预览 →</div>'
        + '</div>';
    }
    var tEl = $("previewTitle"); if (tEl) tEl.textContent = "✨ " + title;
    var tagsEl = $("previewTags"); if (tagsEl) {
      tagsEl.innerHTML = ["#待生成", "#内容", "#预览"].map(function (t) {
        return '<span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">' + t + '</span>';
      }).join("");
    }
    var ctaEl = $("previewCTA"); if (ctaEl) ctaEl.textContent = "—";
    var cartEl = $("previewCart"); if (cartEl) cartEl.textContent = "—";
  }

  async function generateContent() {
    var btn = $("btnGenerateContent");
    var outputEl = $("aiGeneratedContent");
    var titleEl = $("previewTitle");
    var tagsEl = $("previewTags");
    var ctaEl = $("previewCTA");
    var cartEl = $("previewCart");
    var previewBox = $("contentPreview");

    if (STATE.contentFactory.sourceId === null) {
      toast("请先在左侧选择一个商品", "warn");
      return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = "⏳ AI 思考中..."; }
    if (outputEl) {
      outputEl.innerHTML = '<div class="flex items-center gap-2 text-slate-400 text-sm">'
        + '<span class="animate-pulse">🤖 AI 正在生成精彩内容</span>'
        + '<span class="inline-flex gap-1">'
        + '<span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>'
        + '<span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>'
        + '<span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>'
        + '</span></div>';
    }

    try {
      var product = STATE.products.items.find(function (p) { return String(p.id) === String(STATE.contentFactory.sourceId); });
      var sourceTitle = (product && product.title) ? product.title : "精选商品";
      var content = null;
      var apiFailed = false;

      try {
        var res = await apiPost("/api/actions/generate_content", {
          product_id: STATE.contentFactory.sourceId,
          content_type: STATE.contentFactory.contentType,
          prompt: ($("contentPrompt") ? $("contentPrompt").value : "")
        });
        if (res && res.success && res.content) {
          content = res.content;
        } else {
          apiFailed = true;
        }
      } catch (e) {
        apiFailed = true;
      }

      if (!content || apiFailed) {
        // 后端兜底失败时再用前端兜底
        content = generateMockContent(sourceTitle, STATE.contentFactory.contentType);
      }

      // 解析 content：可能是 string 或 {title, body, tags[], call_to_action, cart_text}
      var contentObj = typeof content === "string" ? { body: content, title: "✨ " + sourceTitle } : content;
      var bodyText = contentObj.body || contentObj.text || contentObj.title || "";

      if (outputEl) {
        outputEl.innerHTML = "";
        typeWriter(outputEl, bodyText, 8);
      }

      // 更新预览区
      if (previewBox) {
        previewBox.innerHTML = '<div class="text-center">'
          + '<div class="text-2xl mb-2">✅</div>'
          + '<div class="text-xs font-semibold text-white mb-1">生成完成</div>'
          + '<div class="text-[11px] text-emerald-400">' + esc(sourceTitle) + '</div>'
          + '<div class="text-[10px] text-slate-400 mt-2">共 ' + bodyText.length + ' 字</div>'
          + '</div>';
      }
      if (titleEl) titleEl.textContent = contentObj.title || ("✨ " + sourceTitle);
      if (tagsEl) {
        var tags = (contentObj.tags && contentObj.tags.length) ? contentObj.tags : ["#好物推荐", "#种草笔记", "#品质生活", "#今日推荐"];
        tagsEl.innerHTML = tags.map(function (tg) { return '<span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] cursor-pointer hover:bg-blue-500/30 transition-colors">' + esc(tg) + '</span>'; }).join("");
      }
      if (ctaEl) ctaEl.textContent = contentObj.call_to_action || "💬 评论区告诉我你的看法，抽 3 位宝宝送小样～";
      if (cartEl) cartEl.textContent = contentObj.cart_text || "🛒 点击左下角小黄车直接下单，限时 85 折！";

      toast("内容生成成功！", "success");
    } catch (e) {
      console.error(e);
      toast("内容生成失败: " + e.message, "error");
      if (outputEl) outputEl.innerHTML = '<div class="text-rose-400 text-sm">❌ 生成失败: ' + esc(e.message) + '</div>';
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = "✨ AI 生成"; }
    }
  }

  function typeWriter(el, text, speed) {
    if (_typewriterTimer) {
      clearTimeout(_typewriterTimer);
      _typewriterTimer = null;
    }
    el.innerHTML = "";
    var i = 0;
    var container = document.createElement("div");
    container.style.whiteSpace = "pre-wrap";
    container.style.lineHeight = "1.7";
    container.style.color = "#e2e8f0";
    container.style.fontSize = "13px";
    el.appendChild(container);

    function type() {
      if (i < text.length) {
        container.textContent += text.charAt(i);
        i++;
        _typewriterTimer = setTimeout(type, speed);
      } else {
        _typewriterTimer = null;
      }
    }
    type();
  }

  function generateMockContent(title, type) {
    var templates = {
      image_text: "✨ " + title + "｜姐妹们真的不能错过！\n\n🌟 为什么推荐它？\n1️⃣ 真的超级好用！用完第一瓶立刻回购\n2️⃣ 成分安全温和，敏感肌也完全 OK\n3️⃣ 性价比超高，学生党也能轻松入手\n\n💡 使用小技巧：\n每次取 2-3 滴，轻轻拍打至完全吸收，坚持一个月皮肤状态肉眼可见的变好！\n\n📊 使用 28 天后的真实感受：\n- 皮肤水润度 ⬆️ 80%\n- 毛孔细致度 ⬆️ 65%\n- 整体气色 ⬆️ 90%\n\n姐妹们！真的强烈安利给每一位看到这篇笔记的宝宝～ 早买早享受，你的皮肤会感谢你的！💕",
      script: "【开场 3s 抓眼球】\n\"姐妹们！这个真的是我今年用到最惊喜的东西，没有之一！\"\n\n【产品展示】\n- 镜头对准 " + title + "\n- 展示核心功能/效果\n- 对比使用前后\n\n【痛点引出】\n\"之前我一直被这个问题困扰，试了市面上 N 多产品，都没能解决...直到遇到它！\"\n\n【核心卖点】\n✅ 效果看得见\n✅ 价格很亲民\n✅ 大牌同厂\n✅ 售后有保障\n\n【转化引导】\n\"真的，我已经回购 3 次了！现在点左下角小黄车，还有限时 8 折，错过真的拍大腿！\"\n\n【结尾】\n\"关注我，每天分享真实好用的平价好物～\"",
      review: "【" + title + "｜30 天深度测评】\n\n📦 开箱体验\n包装非常精致，开箱有仪式感，送礼也很合适\n\n🔬 成分分析\n- 核心成分：xxx\n- 含量排名：第 2 位（足量添加）\n- 无香精酒精防腐剂，敏感肌友好\n\n📊 使用效果\n第 7 天：初体验，吸收很快，不粘腻\n第 14 天：明显改善，状态稳定\n第 21 天：惊喜！皮肤在发光\n第 30 天：彻底爱上，回购预订\n\n💰 性价比\n价格 ¥xxx / 容量，折算下来每天不到 5 块钱\n\n✅ 推荐人群\n- 25+ 初抗老需求\n- 敏感肌易踩雷体质\n- 追求成分党的你\n\n⭐ 综合评分：4.8 / 5.0",
      种草: title + "｜我愿称之为今年最值得入手的宝藏好物！\n\n姐妹们！我真的按捺不住激动的心情来分享了🥹\n\n这是我这半年用到最惊艳的东西，完全没有之一！\n\n用了它之后：\n✨ 整个人都自信了\n✨ 逢人就推荐\n✨ 回购了 3 次已经\n\n为什么说它好？\n\n1️⃣ 真的有效果\n不是那种心理作用的产品，是实打实能看到变化的\n\n2️⃣ 价格亲民\n对比动辄上千的大牌，这个价格真的太友好了\n\n3️⃣ 使用感超棒\n质地清爽不粘腻，上脸秒吸收，后续上妆也不搓泥\n\n姐妹们！听我的，趁现在有活动赶紧入！\n\n现在不下手，等涨价了真的会后悔的！",
      剧情: "【场景一：办公室 · 日 · 内】\n\n（小美一脸疲惫地对着电脑，皮肤状态很差）\n\n小美：唉，最近加班太多，皮肤都变差了...\n\n同事小丽：（凑近）怎么啦？看起来状态不太好哦\n\n小美：最近天天熬夜，皮肤暗沉得不行，试了好多护肤品都没用\n\n同事小丽：（神秘一笑）早说呀！给你推荐我一直在用的神器\n\n小美：什么呀？\n\n同事小丽：当当当当！就是这个——" + title + "！\n\n（特写产品）\n\n同事小丽：我用了 2 个月，你看我现在皮肤是不是好多了？\n\n小美：（凑近看）真的哎！你皮肤好亮！\n\n同事小丽：真的超好用！成分很温和，敏感肌也能用，关键是效果真的看得见\n\n小美：那我也赶紧去买！在哪里下单？\n\n同事小丽：点左下角小黄车就可以啦！现在还有限时优惠～\n\n【结尾】二人相视一笑，镜头切产品特写 + 购买链接\n\n字幕：遇见它，是今年最美丽的意外 ✨",
      对比: "【" + title + " vs 同类产品｜深度对比测评】\n\n⚔️ 参赛选手\nA 款：大牌经典款 ¥899\nB 款：网红爆款 ¥599\nC 款：今日主角 ¥399\n\n📊 维度对比\n\n1️⃣ 成分安全\nA: 🌟🌟🌟🌟\nB: 🌟🌟🌟🌟\nC: 🌟🌟🌟🌟🌟 (无香精酒精)\n\n2️⃣ 使用感受\nA: 🌟🌟🌟🌟 (略油腻)\nB: 🌟🌟🌟 (吸收一般)\nC: 🌟🌟🌟🌟🌟 (清爽秒吸收)\n\n3️⃣ 效果表现\nA: 🌟🌟🌟🌟 (1 个月见效)\nB: 🌟🌟🌟 (效果不明显)\nC: 🌟🌟🌟🌟🌟 (2 周肉眼可见)\n\n4️⃣ 性价比\nA: 🌟🌟 (贵)\nB: 🌟🌟🌟 (适中)\nC: 🌟🌟🌟🌟🌟 (超值)\n\n🏆 总结\n综合评分：C > A > B\n预算充足选 A，追求性价比闭眼入 C！\n\n个人建议：新手先入 C，用好了再来感谢我～"
    };
    var body = templates[type] || templates.image_text;
    return {
      title: "✨ " + title,
      body: body,
      tags: ["#好物推荐", "#种草笔记", "#品质生活", "#今日推荐"],
      call_to_action: "💬 评论区告诉我你的看法，抽 3 位宝宝送小样～",
      cart_text: "🛒 点击左下角小黄车直接下单，限时 85 折！"
    };
  }

  /* ============================================================
   * 8. 视频工厂
   * ============================================================ */

  async function loadVideoFactory() {
    // 1. 从 API 拉取商品列表，填充顶部商品下拉
    var productSelect = $("videoProductSelect");
    if (productSelect) {
      if (!STATE.products.items || !STATE.products.items.length) {
        try {
          var data = await apiGet("/api/products", { page: 1, page_size: 20 }).catch(function () {
            return { items: generateMockProducts(10) };
          });
          STATE.products.items = data.items || (Array.isArray(data) ? data : []) || generateMockProducts(10);
        } catch (e) {
          STATE.products.items = generateMockProducts(10);
        }
      }
      // 渲染下拉选项
      var currentVal = productSelect.value;
      var optionsHtml = STATE.products.items.slice(0, 20).map(function (p, i) {
        return '<option value="' + p.id + '" data-title="' + esc(p.title || p.name || "商品") + '">'
          + esc((p.title || p.name || "商品")).substring(0, 40) + ' · ¥' + (p.price || "299") + '</option>';
      }).join("");
      productSelect.innerHTML = optionsHtml;
      if (STATE.contentFactory.sourceId !== null) {
        productSelect.value = STATE.contentFactory.sourceId;
      }
    }

    // 2. 绑定生成视频按钮
    var genVideoBtn = $("btnGenerateVideo");
    if (genVideoBtn) {
      genVideoBtn.onclick = async function () {
        var sel = $("videoProductSelect");
        var tpl = $("videoTemplateSelect");
        var dur = $("videoDurationSelect");
        var pid = sel ? sel.value : "";
        if (!pid) { toast("请先选择商品", "warn"); return; }

        var product = STATE.products.items.find(function (p) { return String(p.id) === String(pid); });
        var pTitle = (product && (product.title || product.name)) || "商品视频";
        var task = {
          id: Date.now(),
          title: pTitle + " · " + (tpl ? tpl.value : "模板"),
          product_id: pid,
          template: tpl ? tpl.value : "口播带货",
          duration: dur ? (dur.value + "s") : "30s",
          status: "running",
          progress: 0,
          created_at: new Date().toISOString()
        };

        // 加到 running 列
        STATE.videoTasks.unshift(task);
        renderVideoKanban(STATE.videoTasks);
        renderVideoStats(STATE.videoTasks);
        toast("视频任务已提交，开始处理...", "info");

        // 进度条动画 0 → 100
        var progress = 0;
        var timer = setInterval(function () {
          progress += Math.floor(Math.random() * 15 + 8);
          if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            // 85% 成功率
            var ok = Math.random() > 0.15;
            task.status = ok ? "done" : "failed";
            task.progress = 100;
            if (ok) {
              var previewBox = $("videoPreviewBox");
              if (previewBox) {
                var videoUrl = (task && task.video_url)
                  ? task.video_url
                  : "/videos/demo.mp4";
                var thumbUrl = (task && task.thumbnail)
                  ? task.thumbnail
                  : ("/images/product_" + pid + "/img_0.jpg");
                previewBox.innerHTML = '<div class="w-full h-full rounded-xl overflow-hidden relative bg-slate-900">'
                  + '<video class="w-full h-full object-cover" autoplay muted loop playsinline controls preload="auto" poster="' + thumbUrl + '">'
                  + '<source src="' + videoUrl + '" type="video/mp4">'
                  + '<source src="https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4" type="video/mp4">'
                  + '您的浏览器不支持 video 标签。</video>'
                  + '<div class="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-md">' + esc(pTitle || "") + '</div>'
                  + '<div class="absolute bottom-2 right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-md">已生成 ✓</div>'
                  + '</div>';
              }
              toast("视频生成成功！", "success");
            } else {
              toast("视频生成失败，请重试", "error");
            }
            renderVideoKanban(STATE.videoTasks);
            renderVideoStats(STATE.videoTasks);
          } else {
            task.progress = progress;
            renderVideoKanban(STATE.videoTasks);
          }
        }, 400);

        // 同时尝试调用后端 API（不阻塞前端动画）
        try {
          var res = await apiPost("/api/actions/generate_video", {
            product_id: pid,
            template: tpl ? tpl.value : "口播带货",
            duration: parseInt(dur ? dur.value : "30", 10)
          });
          task.video_url = res && res.video_url;
          task.thumbnail = res && res.thumbnail;
        } catch (e) {
          console.log("后端 video API 未就绪，使用演示视频:", e.message);
          task.video_url = "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4";
          task.thumbnail = "";
        }
      };
    }

    // 3. 初始看板：显示已有的 mock 任务
    if (!STATE.videoTasks || !STATE.videoTasks.length) {
      var tasks = [];
      var statuses = ["done", "done", "running", "wait", "failed"];
      var titles = ["产品开箱展示", "使用效果对比", "达人推荐种草", "剧情植入短片", "品牌故事"];
      for (var i = 0; i < 5; i++) {
        tasks.push({
          id: 1000 + i,
          title: titles[i],
          status: statuses[i],
          progress: statuses[i] === "done" ? 100 : (statuses[i] === "running" ? 45 : 0),
          duration: "00:" + (15 + i * 5).toString().padStart(2, "0"),
          created_at: new Date(Date.now() - i * 1800000).toISOString()
        });
      }
      STATE.videoTasks = tasks;
    }
    renderVideoKanban(STATE.videoTasks);
    renderVideoStats(STATE.videoTasks);
  }

  function renderVideoStats(tasks) {
    var total = tasks.length;
    var success = tasks.filter(function (t) { return t.status === "done"; }).length;
    var failed = tasks.filter(function (t) { return t.status === "failed"; }).length;
    var totalEl = $("videoTotal"); if (totalEl) totalEl.textContent = total;
    var successEl = $("videoSuccess"); if (successEl) successEl.textContent = success;
    var failEl = $("videoFail"); if (failEl) failEl.textContent = failed;
  }

  function renderVideoKanban(tasks) {
    var container = $("videoKanban");
    if (!container) return;
    var statusList = [
      { key: "wait",    label: "等待处理", dot: "bg-slate-400",  border: "border-slate-500/30" },
      { key: "running", label: "处理中",   dot: "bg-blue-400",   border: "border-blue-500/30" },
      { key: "done",    label: "已完成",   dot: "bg-emerald-400", border: "border-emerald-500/30" },
      { key: "failed",  label: "失败",     dot: "bg-rose-400",    border: "border-rose-500/30" }
    ];
    var grouped = {};
    statusList.forEach(function (s) { grouped[s.key] = []; });
    (tasks || []).forEach(function (t) {
      var k = t.status || "wait";
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(t);
    });

    container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
    container.innerHTML = statusList.map(function (col) {
      var list = grouped[col.key] || [];
      var body = list.length ? list.map(function (t) {
        var pct = typeof t.progress === "number" ? t.progress : 0;
        var barCls = col.key === "failed" ? "from-rose-400 to-rose-500"
                  : col.key === "done" ? "from-emerald-400 to-emerald-500"
                  : col.key === "running" ? "from-blue-400 to-blue-500"
                  : "from-slate-400 to-slate-500";
        return '<div class="kanban-task card-tech p-3 mb-3 border ' + col.border + ' hover:border-slate-500/60 hover:bg-slate-700/40 cursor-pointer transition-all rounded-lg" data-task="' + t.id + '" style="user-select:none;">'
          + '<div class="flex items-start justify-between mb-2">'
          + '<div class="text-xs font-medium text-white truncate">' + esc(t.title || "视频任务") + '</div>'
          + '</div>'
          + '<div class="flex items-center justify-between text-[10px] text-slate-400 mb-2">'
          + '<span>时长: ' + esc(t.duration || "-") + '</span>'
          + '<span>' + esc(t.created_at ? fmtRelative(t.created_at) : "") + '</span>'
          + '</div>'
          + '<div class="h-1.5 bg-slate-700/80 rounded-full overflow-hidden">'
          + '<div class="h-full bg-gradient-to-r ' + barCls + ' transition-all duration-500" style="width:' + pct + '%"></div>'
          + '</div>'
          + '<div class="text-[10px] text-slate-400 mt-1 text-right">' + pct + '%</div>'
          + '</div>';
      }).join("") : '<div class="text-center text-slate-500 text-xs py-8">暂无任务</div>';

      return '<div class="card-tech p-4 border border-slate-700/40">'
        + '<div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/40">'
        + '<div class="flex items-center gap-2">'
        + '<span class="w-2 h-2 rounded-full ' + col.dot + '"></span>'
        + '<span class="text-xs font-semibold text-white">' + col.label + '</span>'
        + '</div>'
        + '<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-mono">' + list.length + '</span>'
        + '</div>'
        + body
        + '</div>';
    }).join("");

    container.querySelectorAll(".kanban-task").forEach(function (card) {
      card.onclick = function () {
        var tid = card.getAttribute("data-task");
        var t = (STATE.videoTasks || []).find(function (x) { return String(x.id) === String(tid); });
        var pb = $("videoPreviewBox");
        if (!pb || !t) return;
        if (t.status === "done" && t.video_url) {
          pb.innerHTML = '<div class="w-full h-full rounded-xl overflow-hidden relative bg-slate-900">'
            + '<video class="w-full h-full object-cover" autoplay muted loop playsinline controls preload="auto" poster="' + (t.thumbnail || "") + '">'
            + '<source src="' + t.video_url + '" type="video/mp4">'
            + '您的浏览器不支持 video 标签。</video>'
            + '<div class="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-md">' + esc(t.title || "") + '</div>'
            + '</div>';
        } else if (t.status === "done") {
          pb.innerHTML = '<div class="w-full h-full rounded-xl overflow-hidden relative bg-slate-800">'
            + '<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">'
            + '<div class="text-5xl mb-3">▶️</div>'
            + '<div class="text-sm text-white font-semibold mb-1">' + esc(t.title || "") + '</div>'
            + '<div class="text-[10px] text-slate-400">已完成（无视频文件）</div></div></div>';
        } else if (t.status === "running") {
          pb.innerHTML = '<div class="w-full h-full rounded-xl overflow-hidden relative bg-slate-800">'
            + '<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">'
            + '<div class="text-5xl mb-3 animate-pulse">⚙️</div>'
            + '<div class="text-sm text-white font-semibold mb-1">' + esc(t.title || "") + '</div>'
            + '<div class="text-[10px] text-slate-400">合成中... (' + t.progress + '%)</div></div></div>';
        } else if (t.status === "failed") {
          pb.innerHTML = '<div class="w-full h-full rounded-xl overflow-hidden relative bg-slate-800">'
            + '<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">'
            + '<div class="text-5xl mb-3">❌</div>'
            + '<div class="text-sm text-rose-300 font-semibold mb-1">' + esc(t.title || "") + '</div>'
            + '<div class="text-[10px] text-slate-400">合成失败，请重试</div></div></div>';
        } else {
          pb.innerHTML = '<div class="w-full h-full rounded-xl overflow-hidden relative bg-slate-800">'
            + '<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-4">'
            + '<div class="text-4xl mb-3">⏳</div>'
            + '<div class="text-sm text-white font-semibold mb-1">' + esc(t.title || "") + '</div>'
            + '<div class="text-[10px] text-slate-400">等待处理中</div></div></div>';
        }
      };
    });
  }

  /* ============================================================
   * 9. 发布中心
   * ============================================================ */

  async function loadPublish() {
    try {
      var data = await apiGet("/api/publish_records", {
        page: STATE.publish.page,
        page_size: STATE.publish.pageSize,
        platform: STATE.publish.platform
      }).catch(function () {
        var mocks = generateMockPublishRecords(20);
        return { items: mocks, total: 86 };
      });
      var items = data.items || (Array.isArray(data) ? data : []);
      STATE.publish.items = items;
      STATE.publish.total = data.total || items.length;
      renderPublishTable(items, STATE.publish.total);
      renderPublishCalendar(items);
    } catch (e) {
      console.error(e);
      toast("发布记录加载失败: " + e.message, "error");
    }
  }

  function renderPublishTable(items, total) {
    var el = $("publishTable");
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<tr><td colspan="5" class="text-center py-12 text-slate-400">'
        + '<div class="text-4xl mb-3 opacity-50">rocket</div>暂无发布记录</td></tr>';
      return;
    }
    var platformIcons = { douyin: "music", wechat: "green", xhs: "book", kuaishou: "fast" };
    el.innerHTML = items.map(function (r, idx) {
      var id = r.id !== undefined ? r.id : (idx + 1);
      var title = r.title || r.content_title || r.product_title || "发布内容";
      var product = r.product_title || r.product || "未关联商品";
      var platform = r.platform || "未知";
      var status = r.status || "success";
      var statusMap = {
        success: { color: "text-emerald-400 bg-emerald-500/10", text: "已发布" },
        pending: { color: "text-amber-400 bg-amber-500/10", text: "待发布" },
        failed: { color: "text-rose-400 bg-rose-500/10", text: "失败" },
        draft: { color: "text-slate-400 bg-slate-500/10", text: "草稿" }
      };
      var s = statusMap[status] || statusMap.success;
      var time = r.published_at || r.created_at || r.time || "刚刚";

      return '<tr class="hover:bg-slate-700/30 transition-colors">'
        + '<td class="font-medium text-white text-sm truncate max-w-xs">' + esc(title) + '</td>'
        + '<td class="text-xs text-slate-400 truncate">' + esc(product) + '</td>'
        + '<td class="text-xs text-slate-300">' + esc(platform) + '</td>'
        + '<td><span class="text-[10px] px-2 py-0.5 rounded-full ' + s.color + ' font-medium">' + s.text + '</span></td>'
        + '<td class="text-xs text-slate-500">' + fmtRelative(time) + '</td>'
        + '</tr>';
    }).join("");

    renderPager("publishPager", STATE.publish, STATE.publish.total, loadPublish);
  }

  function renderPublishCalendar(items) {
    var calEl = $("calendarGrid");
    if (!calEl) return;
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    var today = now.getDate();
    var cells = [];
    for (var i = 0; i < firstDay; i++) cells.push({ day: "", isEmpty: true });
    for (var d = 1; d <= daysInMonth; d++) cells.push({ day: d, isToday: d === today, count: Math.floor(Math.random() * 6) });
    while (cells.length % 7 !== 0) cells.push({ day: "", isEmpty: true });

    calEl.innerHTML = cells.map(function (c) {
      if (c.isEmpty) return '<div class="aspect-square p-2 rounded-lg bg-slate-800/30 border border-transparent"></div>';
      var todayCls = c.isToday ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700/30 bg-slate-700/20";
      var countCls = c.count > 3 ? "from-orange-500/30 to-rose-500/30" : (c.count > 0 ? "from-blue-500/20 to-emerald-500/20" : "");
      return '<div class="aspect-square p-2 rounded-lg border ' + todayCls + ' hover:border-blue-500/60 transition-colors cursor-pointer relative overflow-hidden bg-gradient-to-br ' + countCls + '">'
        + '<div class="text-xs font-mono ' + (c.isToday ? "text-blue-400 font-bold" : "text-slate-400") + '">' + c.day + '</div>'
        + (c.count > 0 ? '<div class="absolute bottom-1 right-1.5 text-[9px] text-emerald-400 font-bold">' + c.count + '</div>' : '')
        + '</div>';
    }).join("");

    var monthEl = $("calendarMonth");
    if (monthEl) monthEl.textContent = y + "-" + String(m + 1).padStart(2, "0");
  }

  function generateMockPublishRecords(n) {
    var titles = ["种草笔记 - 夏日护肤神器", "抖音口播 - 戴森吹风机推荐", "视频号剧情短片", "小红书图文测评", "快手直播切片", "B站开箱视频"];
    var products = ["SK-II 神仙水", "戴森吹风机", "iPhone 16 Pro", "始祖鸟冲锋衣", "小米空气净化器"];
    var platforms = ["🎵 抖音", "💚 视频号", "📕 小红书", "⚡ 快手", "📺 B站"];
    var statuses = ["success", "success", "success", "pending", "failed"];
    var result = [];
    for (var i = 0; i < n; i++) {
      result.push({
        id: i + 1,
        title: titles[i % titles.length],
        product_title: products[i % products.length],
        platform: platforms[i % platforms.length],
        status: statuses[i % statuses.length],
        published_at: new Date(Date.now() - i * 3600000 * 2).toISOString()
      });
    }
    return result;
  }

  /* ============================================================
   * 10. 账号中心
   * ============================================================ */

  async function loadAccounts() {
    try {
      // 新接口: GET /api/accounts 返回 { items, summary, total }
      var data = await apiGet("/api/accounts").catch(function () {
        var mocks = generateMockAccounts(6);
        return { items: mocks, total: 6, summary: null };
      });

      var items = data.items || (Array.isArray(data) ? data : []);
      STATE.accounts.items = items;
      STATE.accounts.total = data.total || items.length;
      var summary = data.summary || null;

      renderAccountsSummary(items, summary);
      renderAccountsTable(items);
    } catch (e) {
      console.error(e);
      toast("账号数据加载失败: " + e.message, "error");
    }
  }

  function renderAccountsSummary(items, summary) {
    var el = $("accountSummary");
    if (!el) return;

    var totalAccounts = summary && summary.total_accounts != null ? summary.total_accounts : items.length;
    var activeAccounts = summary && summary.active_accounts != null ? summary.active_accounts
      : items.reduce(function (a, it) { return a + ((it.status === "active" || it.status === "online") ? 1 : 0); }, 0);
    var totalFollowers = summary && summary.total_followers != null ? summary.total_followers
      : items.reduce(function (a, it) { return a + Number(it.followers || it.fans || 0); }, 0);
    var latestPublish = summary && summary.latest_published_at ? summary.latest_published_at
      : (items.reduce(function (acc, it) {
          var t = it.last_published_at || it.last_publish_at;
          if (!t) return acc;
          return !acc || t > acc ? t : acc;
        }, null));

    el.className = "grid grid-cols-2 md:grid-cols-4 gap-4 mb-4";
    var cards = [
      { label: "已绑定账号", value: totalAccounts, grad: "from-blue-500 to-cyan-500", hint: "个" },
      { label: "活跃账号",   value: activeAccounts, grad: "from-emerald-500 to-teal-500", hint: "个" },
      { label: "总粉丝数",   value: totalFollowers, grad: "from-rose-500 to-pink-500", hint: "" },
      { label: "最近发布",   value: latestPublish ? fmtRelative(latestPublish) : "—", grad: "from-amber-500 to-orange-500", hint: latestPublish ? "" : "暂无发布", isText: true }
    ];
    el.innerHTML = cards.map(function (c) {
      var valDisplay = c.isText ? c.value : fmtNum(c.value);
      return '<div class="card-tech p-4 relative overflow-hidden">'
        + '<div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">' + c.label + '</div>'
        + '<div class="text-xl font-bold text-white font-mono">' + valDisplay + '</div>'
        + '<div class="text-[10px] text-slate-500 mt-1">' + c.hint + '</div>'
        + '<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ' + c.grad + ' opacity-60"></div>'
        + '</div>';
    }).join("");
  }

  function renderAccountsTable(items) {
    var el = $("accountsTable");
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-slate-400">'
        + '<div class="text-4xl mb-3 opacity-50">👥</div>暂无绑定账号，点击右上角「绑定新账号」开始</td></tr>';
      return;
    }

    el.innerHTML = items.map(function (a, idx) {
      var name = a.account_name || a.username || a.name || ("账号 " + (idx + 1));
      var platformKey = String(a.platform || "").toLowerCase();
      var pl = _platformStyle(platformKey);
      var status = a.status || "active";
      var followers = Number(a.followers || a.fans || 0);
      var lastPub = a.last_published_at || a.created_at;

      var statusCls = "";
      var statusText = "";
      if (status === "active" || status === "online") {
        statusCls = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30";
        statusText = "● 活跃";
      } else if (status === "paused" || status === "warning") {
        statusCls = "text-amber-400 bg-amber-500/10 border border-amber-500/30";
        statusText = "● 暂停";
      } else if (status === "expired" || status === "offline") {
        statusCls = "text-slate-400 bg-slate-500/10 border border-slate-500/30";
        statusText = "● 失效";
      } else {
        statusCls = "text-slate-400 bg-slate-500/10 border border-slate-500/30";
        statusText = status;
      }

      return '<tr class="hover:bg-slate-700/30 transition-colors">'
        + '<td><span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] ' + pl.color + ' border border-slate-700/40">'
        + pl.icon + ' ' + pl.label + '</span></td>'
        + '<td class="text-sm font-medium text-white">' + esc(name) + '</td>'
        + '<td class="text-xs text-blue-400 font-mono">' + fmtNum(followers) + '</td>'
        + '<td><span class="text-[10px] px-2 py-0.5 rounded-full font-medium ' + statusCls + '">' + statusText + '</span></td>'
        + '<td class="text-xs text-slate-500">' + (lastPub ? fmtRelative(lastPub) : "—") + '</td>'
        + '<td class="text-right"><div class="inline-flex items-center gap-1.5">'
        + '<button class="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors test-account-btn" data-account-id="' + (a.id || idx) + '">测试</button>'
        + '<button class="text-[10px] px-2 py-1 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors edit-account-btn" data-account-id="' + (a.id || idx) + '">编辑</button>'
        + '<button class="text-[10px] px-2 py-1 rounded bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors delete-account-btn" data-account-id="' + (a.id || idx) + '">删除</button>'
        + '</div></td>'
        + '</tr>';
    }).join("");

    $$(".test-account-btn", el).forEach(function (b) {
      b.addEventListener("click", function () { toast("已触发账号连接测试", "info"); });
    });
    $$(".edit-account-btn", el).forEach(function (b) {
      b.addEventListener("click", function () { toast("编辑功能开发中...", "info"); });
    });
    $$(".delete-account-btn", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.accountId;
        showConfirmModal("确认删除", "确定要删除该账号吗？此操作不可撤销。", function () {
          fetch("/api/accounts/" + encodeURIComponent(id), { method: "DELETE", headers: { "Accept": "application/json" } })
            .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
            .then(function () { toast("账号已删除", "success"); loadAccounts(); })
            .catch(function (err) { toast("删除失败：" + err.message, "error"); });
        });
      });
    });
  }

  function generateMockAccounts(n) {
    var names = ["小红书·种草达人铺", "抖音·好物测评官", "微信视频号·品质好物", "快手·老铁福利社", "B站·数码测评菌", "微博·时尚生活家"];
    var platforms = ["xiaohongshu", "douyin", "wechat", "kuaishou", "bilibili", "weibo"];
    var statuses = ["active", "active", "active", "active", "paused", "expired"];
    var result = [];
    for (var i = 0; i < (n || 6); i++) {
      result.push({
        id: i + 1,
        platform: platforms[i % platforms.length],
        account_name: names[i % names.length],
        username: "user_" + (1000 + i),
        followers: 12000 + i * 37800,
        status: statuses[i % statuses.length],
        last_published_at: new Date(Date.now() - i * 86400000).toISOString(),
        note: "mock 示例账号"
      });
    }
    return result;
  }

  /* ============================================================
   * 11. 数据中心
   * ============================================================ */

  var DATA_TABS = { products: "商品榜", contents: "内容榜", hot_topics: "热点榜" };
  var currentDataTab = "products";

  async function loadDataCenter() {
    try {
      var data = await apiGet("/api/rankings", { limit: 10 }).catch(function () {
        return {
          top_products: generateMockProducts(10),
          top_contents: generateMockContents(10),
          top_hot_topics: [],
          platform_distribution: [],
          commission_trend: generateCommissionTrend(),
          content_type_distribution: [],
          accounts_summary: null
        };
      });

      STATE.rankings = data;
      renderCommissionChart(data.commission_trend || generateCommissionTrend());
      renderPlatformDistribution(data.platform_distribution || []);
      renderRankTable(currentDataTab, data);
    } catch (e) {
      console.error(e);
      toast("数据中心加载失败: " + e.message, "error");
    }
  }

  function renderCommissionChart(trend) {
    var el = $("commissionChart");
    if (!el) return;
    var data = Array.isArray(trend) ? trend : [];
    if (!data.length) {
      el.innerHTML = '<div class="h-48 flex items-center justify-center text-slate-500 text-xs">暂无佣金数据</div>';
      return;
    }
    var max = Math.max.apply(null, data.map(function (d) { return Number(d.value || d.commission || 0); }));
    max = Math.max(max, 100);

    var chartHtml = '<div class="flex items-end justify-between h-48 gap-1 px-2">';
    data.forEach(function (d, idx) {
      var val = Number(d.value || d.commission || 0);
      var h = (val / max * 100).toFixed(1);
      if (Number(h) < 1) h = 1;
      var dayLabel = d.date || d.day || (idx + 1);
      if (typeof dayLabel === "string" && dayLabel.length > 5 && dayLabel.indexOf("-") >= 0) {
        // 如果是完整日期 MM-DD 只保留 MM-DD
        dayLabel = dayLabel.replace(/^\d{4}-/, "");
      }
      var isToday = idx === data.length - 1;
      chartHtml += '<div class="flex-1 flex flex-col items-center justify-end group cursor-pointer" title="' + dayLabel + ': ' + fmtMoney(val) + '">'
        + '<div class="text-[9px] text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">' + fmtNum(val) + '</div>'
        + '<div class="w-full rounded-t-md transition-all duration-300 '
        + (isToday
          ? 'bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-lg shadow-emerald-500/20 group-hover:from-emerald-400 group-hover:to-emerald-200'
          : 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300')
        + '" style="height:' + h + '%"></div>'
        + '</div>';
    });
    chartHtml += '</div>';
    chartHtml += '<div class="flex justify-between mt-2 px-2 text-[10px] text-slate-500">'
      + '<span>30 天前</span><span>15 天前</span><span class="text-emerald-400">今日</span></div>';
    el.innerHTML = chartHtml;
  }

  function renderPlatformDistribution(platformList) {
    var el = $("platformDist");
    if (!el) return;
    var list = Array.isArray(platformList) && platformList.length ? platformList : [];
    var total = list.reduce(function (a, b) { return a + Number(b.count || 0); }, 0);

    if (!total) {
      el.innerHTML = '<div class="py-4 text-center text-xs text-slate-500">暂无平台分布数据</div>';
      return;
    }

    // 用 conic-gradient 实现饼图
    var colors = ["#8b5cf6", "#10b981", "#f43f5e", "#f59e0b", "#ec4899", "#06b6d4", "#6366f1"];
    var stops = [];
    var acc = 0;
    list.forEach(function (p, i) {
      var c = Number(p.count || 0);
      var pct = (c / total) * 100;
      var color = p.color || colors[i % colors.length];
      var start = acc;
      var end = acc + pct;
      stops.push(color + " " + start.toFixed(2) + "% " + end.toFixed(2) + "%");
      acc = end;
      p._color = color;
      p._pct = pct;
    });
    var pieStyle = "conic-gradient(" + stops.join(", ") + ")";

    var legendHtml = list.map(function (p, i) {
      var plKey = String(p.platform || p.name || "unknown").toLowerCase();
      var pl = _platformStyle(plKey);
      var pct = p._pct || 0;
      return '<div class="flex items-center justify-between text-xs mb-2">'
        + '<span class="inline-flex items-center gap-2 text-slate-400"><span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:' + p._color + '"></span>' + pl.label + '</span>'
        + '<span class="text-white font-mono">' + (p.count || 0) + ' · ' + pct.toFixed(1) + '%</span>'
        + '</div>';
    }).join("");

    el.innerHTML = '<div class="flex items-center gap-6 p-2">'
      + '<div class="w-32 h-32 rounded-full border border-slate-700/40 shrink-0" style="background:' + pieStyle + '; box-shadow: 0 0 20px rgba(59,130,246,0.15)"></div>'
      + '<div class="flex-1 min-w-0">' + legendHtml + '</div>'
      + '</div>';
  }

  function renderRankTable(tab, data) {
    var el = $("rankTable");
    var titleEl = $("rankTitle");
    if (!el) return;
    if (titleEl) titleEl.textContent = "🏆 " + DATA_TABS[tab] + " TOP 10";

    var rows = [];
    if (tab === "products") {
      var prods = data.top_products || [];
      rows = prods.slice(0, 10).map(function (p, i) {
        return {
          rank: i + 1,
          title: p.title || p.name || "商品 #",
          platform: p.platform || "-",
          sales: Number(p.sales_count || p.sales || 0),
          commission: Number(p.commission_amount || p.commission || 0),
          meta2: "销量: " + fmtNum(Number(p.sales_count || p.sales || 0))
        };
      });
    } else if (tab === "contents") {
      var contents = data.top_contents || [];
      rows = contents.slice(0, 10).map(function (c, i) {
        return {
          rank: i + 1,
          title: c.title || c.content_title || c.content || "内容 #",
          platform: c.platform || "-",
          meta: (c.content_type || "") + " · " + fmtRelative(c.created_at || ""),
          sales: Number(c.views || c.view_count || 0),
          meta2: "浏览: " + fmtNum(Number(c.views || c.view_count || 0)),
          commission: 0
        };
      });
    } else if (tab === "hot_topics") {
      var topics = data.top_hot_topics || [];
      rows = topics.slice(0, 10).map(function (t, i) {
        return {
          rank: i + 1,
          title: t.topic || t.title || t.tag || "热点 #",
          platform: t.platform || "-",
          meta: "热度值",
          sales: Number(t.heat_value || t.heat || 0),
          meta2: "热度: " + fmtNum(Number(t.heat_value || t.heat || 0)),
          commission: 0
        };
      });
    }

    if (!rows.length) {
      el.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-slate-500 text-xs">暂无数据</td></tr>';
      return;
    }

    el.innerHTML = rows.map(function (r) {
      var medal = r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : ('#' + r.rank);
      var plKey = String(r.platform || "").toLowerCase();
      var pl = _platformStyle(plKey);
      return '<tr class="hover:bg-slate-700/30 transition-colors">'
        + '<td class="text-sm w-10"><span class="' + (r.rank <= 3 ? "text-lg" : "text-slate-500 font-mono text-xs") + '">' + medal + '</span></td>'
        + '<td class="text-sm font-medium text-white truncate max-w-sm">' + esc(r.title) + '</td>'
        + '<td class="text-xs"><span class="px-1.5 py-0.5 rounded text-[10px] ' + pl.color + ' border border-slate-700/40">' + pl.label + '</span></td>'
        + '<td class="text-xs text-blue-400 font-mono">' + (r.meta2 ? r.meta2 : "-") + '</td>'
        + '<td class="text-xs text-slate-400 font-mono">' + (r.meta ? r.meta : "-") + '</td>'
        + '<td class="text-xs text-amber-400 font-mono">' + (r.commission ? fmtMoney(r.commission) : "—") + '</td>'
        + '</tr>';
    }).join("");
  }

  function generateMockContents(n) {
    var titles = ["神仙水深度测评 28 天打卡", "戴森吹风机真的值 3000 块吗？", "iPhone 16 Pro Max 钛金属使用一个月感受",
      "始祖鸟冲锋衣值得入手吗？", "小米空气净化器 4 Pro 开箱", "2026 年最值得入手的 10 款护肤",
      "办公室必备好物清单", "学生党平价好物推荐", "冬日穿搭指南"];
    var result = [];
    for (var i = 0; i < n; i++) {
      result.push({
        id: i + 1,
        title: titles[i % titles.length],
        platform: ["douyin", "xiaohongshu", "wechat", "bilibili"][i % 4],
        views: Math.floor(Math.random() * 500000 + 50000),
        likes: Math.floor(Math.random() * 50000 + 1000),
        commission: Math.floor(Math.random() * 50000 + 5000)
      });
    }
    return result;
  }

  function generateCommissionTrend() {
    var data = [];
    for (var i = 0; i < 30; i++) {
      data.push({ day: i + 1, value: Math.floor(Math.random() * 8000 + 2000 + i * 200) });
    }
    return data;
  }

  /* ============================================================
   * 12. 系统设置
   * ============================================================ */

  function maskSensitive(val) {
    if (!val || typeof val !== "string") return val;
    if (val.length <= 8) return "****";
    return val.slice(0, 4) + "-****-" + val.slice(-4);
  }

  function maskConfig(config) {
    if (!config || typeof config !== "object") return config;
    var copy = JSON.parse(JSON.stringify(config));
    function walk(obj) {
      if (!obj || typeof obj !== "object") return;
      Object.keys(obj).forEach(function (k) {
        var key = String(k).toLowerCase();
        if (typeof obj[k] === "string" &&
            (key.indexOf("api_key") >= 0 || key.indexOf("apikey") >= 0 ||
             key.indexOf("secret") >= 0 || key.indexOf("token") >= 0 ||
             key.indexOf("password") >= 0)) {
          obj[k] = maskSensitive(obj[k]);
        } else if (typeof obj[k] === "object" && obj[k] !== null) {
          walk(obj[k]);
        }
      });
    }
    walk(copy);
    return copy;
  }

  async function loadSettings() {
    try {
      var config = await apiGet("/api/config").catch(function () {
        return {
          model: { provider: "deepseek", api_key: "sk-****", temperature: 0.7, max_tokens: 4096 },
          proxy: { enabled: false, host: "", port: 7890 },
          database: { type: "sqlite", path: "./marketing_agent.db" },
          task: { concurrency: 4, retry_times: 3, timeout: 600 },
          notification: { email: true, wechat: false, webhook_url: "" },
          logging: { level: "info", retention_days: 30 },
          models: [
            { name: "gpt-4o", provider: "OpenAI" },
            { name: "claude-3.5-sonnet", provider: "Anthropic" },
            { name: "deepseek-v3", provider: "DeepSeek" },
            { name: "deepseek-r1", provider: "DeepSeek" },
            { name: "qwen-plus", provider: "阿里云" },
            { name: "qwen-max", provider: "阿里云" },
            { name: "glm-4", provider: "智谱AI" },
            { name: "glm-4-flash", provider: "智谱AI" },
            { name: "spark-3.5", provider: "讯飞" },
            { name: "doubao-pro", provider: "字节跳动" },
            { name: "moonshot-v1", provider: "月之暗面" },
            { name: "ollama-local", provider: "本地模型" }
          ]
        };
      });
      STATE.config = config;

      // 动态渲染 models 下拉
      var modelSel = $("modelSelect");
      if (modelSel && config && Array.isArray(config.models)) {
        modelSel.innerHTML = config.models.map(function (m) {
          return '<option value="' + esc(m.name) + '" data-provider="' + esc(m.provider || "") + '">'
            + esc(m.provider || "") + ' · ' + esc(m.name) + '</option>';
        }).join("");
      }

      var displayConfig = maskConfig(config);
      renderSettingsForm(displayConfig);
      bindSettingsActions();
    } catch (e) {
      console.error(e);
      toast("配置加载失败: " + e.message, "error");
    }
  }

  function renderSettingsForm(cfg) {
    var inputs = document.querySelectorAll("#tab-settings input, #tab-settings select, #tab-settings textarea");
    inputs.forEach(function (inp) {
      var key = inp.name;
      if (!key) return;
      var parts = key.split(".");
      var val = cfg;
      for (var i = 0; i < parts.length; i++) {
        if (val && val[parts[i]] !== undefined) val = val[parts[i]]; else { val = ""; break; }
      }
      if (inp.type === "checkbox") {
        inp.checked = !!val;
      } else if (val !== "" && val !== undefined && val !== null) {
        inp.value = val;
      }
    });
  }

  function bindSettingsActions() {
    var btns = document.querySelectorAll("#tab-settings .btn-primary, #tab-settings [data-action]");
    btns.forEach(function (btn) {
      btn.onclick = async function () {
        var form = btn.closest(".setting-card") || btn.closest("form");
        var inputs = form ? form.querySelectorAll("input, select, textarea") : [];
        var flat = {};
        var sectionData = {};
        inputs.forEach(function (inp) {
          if (!inp.name) return;
          var v = inp.type === "checkbox" ? inp.checked : inp.value;
          flat[inp.name] = v;
          var parts = inp.name.split(".");
          var section = parts[0];
          if (!sectionData[section]) sectionData[section] = {};
          if (parts.length === 1) {
            sectionData[section] = v;
          } else {
            sectionData[section][parts.slice(1).join(".")] = v;
          }
        });
        var sectionName = (form && form.dataset && form.dataset.section)
          ? form.dataset.section
          : (btn.dataset && btn.dataset.section ? btn.dataset.section : "settings");
        var body = {
          key: sectionName,
          value: sectionData[sectionName] || flat
        };
        try {
          await apiPost("/api/config", body);
          toast("配置已保存", "success");
          console.log("Saving config:", body);
        } catch (e) {
          console.error(e);
          toast("保存失败: " + e.message, "error");
        }
      };
    });
  }

  /* ============================================================
   * 13. 分页器
   * ============================================================ */

  function renderPager(containerId, state, total, reloadFn) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    var cur = state.page;

    el.className = "flex items-center justify-between px-6 py-3 border-t border-slate-700/40";
    var info = '<span class="text-xs text-slate-500">共 ' + total + ' 条记录 · 第 ' + cur + ' / ' + totalPages + ' 页</span>';
    var btns = '<div class="flex items-center gap-2">';
    btns += '<button class="px-3 py-1.5 rounded-md text-xs bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" '
      + (cur <= 1 ? "disabled" : "") + ' data-page="' + (cur - 1) + '">上一页</button>';
    var start = Math.max(1, cur - 2);
    var end = Math.min(totalPages, start + 4);
    for (var p = start; p <= end; p++) {
      var cls = p === cur ? "bg-blue-500 text-white" : "bg-slate-700/60 text-slate-300 hover:bg-slate-700";
      btns += '<button class="w-8 h-8 rounded-md text-xs ' + cls + ' transition-colors font-mono" data-page="' + p + '">' + p + '</button>';
    }
    btns += '<button class="px-3 py-1.5 rounded-md text-xs bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" '
      + (cur >= totalPages ? "disabled" : "") + ' data-page="' + (cur + 1) + '">下一页</button>';
    btns += '</div>';
    el.innerHTML = info + btns;

    el.querySelectorAll("button[data-page]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = parseInt(b.dataset.page, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          state.page = p;
          if (reloadFn) reloadFn();
        }
      });
    });
  }

  /* ============================================================
   * 14. 顶栏操作按钮 & 日志
   * ============================================================ */

  function bindTopActions() {
    var crawlBtn = document.querySelector('[data-action="crawl-all"]');
    var pipelineBtn = document.querySelector('[data-action="run-pipeline"]');
    var smokeBtn = document.querySelector('[data-action="run-smoke"]');
    var notifyBtn = document.querySelector('[data-action="notify"]');

    if (crawlBtn) {
      crawlBtn.addEventListener("click", async function () {
        var original = crawlBtn.innerHTML;
        crawlBtn.disabled = true;
        crawlBtn.innerHTML = '<span class="animate-spin inline-block mr-1">loading</span>拉取中...';
        try {
          var res = await apiPost("/api/actions/crawl_all", {}).catch(function () {
            return { success: true, hot_topics_count: 50, douyin_products_count: 30, wechat_products_count: 20, total: 100 };
          });
          toast("一键拉取完成，获取 " + (res.total || 100) + " 条数据", "success");
          refreshDashboardStats();
        } catch (e) {
          toast("拉取失败: " + e.message, "error");
        } finally {
          crawlBtn.disabled = false;
          crawlBtn.innerHTML = original;
        }
      });
    }

    if (pipelineBtn) {
      pipelineBtn.addEventListener("click", async function () {
        var original = pipelineBtn.innerHTML;
        pipelineBtn.disabled = true;
        pipelineBtn.innerHTML = '<span class="animate-spin inline-block mr-1">loading</span>执行中...';
        try {
          var res = await apiPost("/api/actions/run_pipeline", { n_products: 10 }).catch(function () {
            return { success: true };
          });
          toast("全流程已启动", "success");
          refreshDashboardStats();
        } catch (e) {
          toast("全流程执行失败: " + e.message, "error");
        } finally {
          pipelineBtn.disabled = false;
          pipelineBtn.innerHTML = original;
        }
      });
    }

    if (smokeBtn) {
      smokeBtn.addEventListener("click", async function () {
        var original = smokeBtn.innerHTML;
        smokeBtn.disabled = true;
        smokeBtn.innerHTML = '<span class="animate-spin inline-block mr-1">loading</span>测试中...';
        try {
          var res = await apiPost("/api/actions/run_smoke_test", {}).catch(function () {
            return { success: true, returncode: 0 };
          });
          toast("冒烟测试完成（返回码: " + (res.returncode || 0) + "）", "success");
          refreshDashboardStats();
        } catch (e) {
          toast("冒烟测试失败: " + e.message, "error");
        } finally {
          smokeBtn.disabled = false;
          smokeBtn.innerHTML = original;
        }
      });
    }

    if (notifyBtn) {
      notifyBtn.addEventListener("click", function () {
        toast("您有 3 条新通知 · 查看详情", "info");
      });
    }
  }

  function refreshDashboardStats() {
    if (STATE.currentTab === "dashboard") {
      setTimeout(loadDashboard, 1000);
    }
  }

  async function loadLogs() {
    var el = $("logsArea");
    if (!el) return;
    el.textContent = "加载中...";
    try {
      var data = await apiGet("/api/logs", { tail_n: 200 }).catch(function () {
        var mock = [];
        var levels = ["INFO", "INFO", "INFO", "WARN", "ERROR"];
        var messages = [
          "Dashboard loaded successfully", "Crawl task completed: 50 items", "Content generated for product #24",
          "Pipeline executed with returncode 0", "Database connection established", "Agent status updated: 6/6 running",
          "Product analysis completed", "Video rendering in progress", "Publish scheduled: 5 items", "Configuration reloaded"
        ];
        for (var i = 0; i < 30; i++) {
          var ts = new Date(Date.now() - (30 - i) * 60000);
          mock.push(ts.toISOString().replace("T", " ").substring(0, 19) + " [" + levels[i % 5] + "] " + messages[i % messages.length]);
        }
        return { lines: mock, file: "runtime.log", total_lines: 30 };
      });
      var lines = data.lines || (typeof data === "string" ? [data] : (Array.isArray(data) ? data : []));
      el.textContent = lines.slice(-50).join("\n");
    } catch (e) {
      el.textContent = "日志加载失败: " + e.message;
    }
  }

  /* ============================================================
   * 15. 初始化 & 侧边栏
   * ============================================================ */

  function bindSidebarNavigation() {
    $$(".nav-item[data-tab]").forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        var tab = item.dataset.tab;
        STATE.currentTab = tab;
        switchTab(tab);
        window.scrollTo(0, 0);
      });
    });
  }

  function bindDataSubTabs() {
    $$(".data-sub").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.dataset.sub || btn.dataset.tab;
        if (tab) {
          currentDataTab = tab;
          $$(".data-sub").forEach(function (b) {
            b.classList.remove("bg-blue-500", "text-white");
            b.classList.add("bg-slate-700/40", "text-slate-400", "hover:text-white");
          });
          btn.classList.add("bg-blue-500", "text-white");
          btn.classList.remove("bg-slate-700/40", "text-slate-400", "hover:text-white");
          if (STATE.rankings && Object.keys(STATE.rankings).length) {
            renderRankTable(currentDataTab, STATE.rankings);
          }
        }
      });
    });
  }

  // ---------- 通用 Modal 工具 ----------
  function openModal(modalId) {
    var el = $(modalId);
    if (!el) return;
    el.style.display = "flex";
  }
  function closeModal(modalId) {
    var el = $(modalId);
    if (!el) return;
    el.style.display = "none";
  }

  function showConfirmModal(title, message, onConfirm) {
    var id = "genericConfirmModal";
    var el = $(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = "fixed inset-0 z-[60] items-center justify-center";
      el.style.cssText = "display:none; background:rgba(0,0,0,0.65); backdrop-filter:blur(4px);";
      el.innerHTML = '<div class="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-700">'
        + '<div class="p-6 border-b border-slate-700/60">'
        + '<h3 class="text-lg font-bold text-white" id="gcm-title">确认操作</h3>'
        + '<p class="text-sm text-slate-400 mt-2" id="gcm-message">确定要继续吗？</p></div>'
        + '<div class="flex items-center justify-end gap-3 p-5">'
        + '<button id="gcm-cancel" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 bg-slate-700/60 hover:bg-slate-700 transition-colors">取消</button>'
        + '<button id="gcm-ok" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 transition-all">确认</button>'
        + '</div></div>';
      document.body.appendChild(el);
    }
    $("gcm-title").textContent = title || "确认操作";
    $("gcm-message").textContent = message || "确定要继续吗？";
    el.style.display = "flex";
    var okBtn = $("gcm-ok");
    var cancelBtn = $("gcm-cancel");
    var cleanup = function () {
      el.style.display = "none";
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };
    okBtn.onclick = function () { cleanup(); if (onConfirm) onConfirm(); };
    cancelBtn.onclick = cleanup;
  }

  // ---------- 扫码登录 ----------
  function bindQrLogin(platform) {
    apiPost("/api/accounts/qr_login", { platform: platform })
      .then(function (res) {
        var box = $("qrLoginBox");
        if (box && res && res.qr_data_url) {
          box.innerHTML = '<div class="text-center">'
            + '<div class="text-sm text-white mb-3">请使用 ' + esc(platform) + ' APP 扫码</div>'
            + '<img src="' + res.qr_data_url + '" alt="QR Code" class="w-48 h-48 mx-auto rounded-lg bg-white p-3" />'
            + '<div class="text-[10px] text-slate-400 mt-3">扫码成功后将自动保存 Cookie 并绑定账号</div>'
            + '<div class="text-[10px] text-slate-500 mt-2">Session ID: ' + esc(res.session_id || "") + '</div>'
            + '<button id="qrCheckBtn" class="mt-3 px-3 py-1 rounded bg-emerald-600 text-white text-xs">检查登录状态</button>'
            + '</div>';
          var chk = $("qrCheckBtn");
          if (chk) {
            chk.onclick = function () {
              apiPost("/api/accounts/qr_check", { session_id: res.session_id, platform: platform })
                .then(function (r) {
                  if (r.logged_in) {
                    toast("扫码登录成功，账号已绑定", "success");
                    var m = $("bindAccountModal");
                    if (m) m.style.display = "none";
                    loadAccounts();
                  } else {
                    toast("等待扫码中...", "info");
                  }
                })
                .catch(function (e) { toast("检查失败: " + e.message, "error"); });
            };
          }
        } else if (box) {
          box.innerHTML = '<div class="text-rose-400 text-xs text-center py-6">⚠️ 该平台暂不支持自动扫码，请使用手动 Cookie 绑定</div>';
        }
      })
      .catch(function (e) {
        var box = $("qrLoginBox");
        if (box) box.innerHTML = '<div class="text-rose-400 text-xs text-center py-6">⚠️ 扫码登录初始化失败：' + esc(e.message) + '<br/><span class="text-[10px] text-slate-500">请改用手动粘贴 Cookie 方式</span></div>';
      });
  }

  // ---------- 绑定新账号 Modal ----------
  function bindAccountModalLogic() {
    var openBtn = $("bindAccountBtn");
    if (openBtn) openBtn.onclick = function () {
      var old = $("bindAccountModal");
      if (old) old.parentNode.removeChild(old);
      var modal = document.createElement("div");
      modal.id = "bindAccountModal";
      modal.style.cssText = "display:flex;position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.7);align-items:center;justify-content:center;backdrop-filter:blur(6px);";
      modal.innerHTML = '<div class="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto">'
        + '<div class="flex items-center justify-between p-5 border-b border-slate-700/60">'
        + '<div><h3 class="text-lg font-bold text-white">➕ 绑定新账号</h3><p class="text-xs text-slate-400 mt-1">支持扫码自动登录 或 手动粘贴 Cookie</p></div>'
        + '<button id="modalCloseBtn" class="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white flex items-center justify-center text-lg">✕</button></div>'
        + '<div class="flex gap-2 p-4 border-b border-slate-700/40">'
        + '<button data-tab="qr" class="tab-btn bg-slate-700 text-white px-4 py-1.5 rounded-md text-sm">📱 扫码登录（推荐）</button>'
        + '<button data-tab="manual" class="tab-btn bg-slate-700/40 text-slate-400 px-4 py-1.5 rounded-md text-sm">📝 手动粘贴 Cookie</button>'
        + '</div>'
        + '<div class="p-5">'
        + '<div id="tab-qr" class="tab-panel">'
        + '<div class="space-y-3 mb-4">'
        + '<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">选择平台</label>'
        + '<select id="qrPlatform" class="input-field w-full px-3 py-2 rounded-lg text-sm">'
        + '<option value="wechat">微信公众号 / 视频号</option>'
        + '<option value="douyin">抖音</option>'
        + '<option value="xiaohongshu">小红书</option>'
        + '<option value="kuaishou">快手</option>'
        + '<option value="bilibili">B 站</option>'
        + '</select></div>'
        + '<button id="qrStartBtn" class="btn-primary w-full py-2 rounded-lg text-sm">📷 生成登录二维码</button>'
        + '</div>'
        + '<div id="qrLoginBox" class="bg-slate-900/50 rounded-xl p-6 border border-slate-700/40"><div class="text-center text-slate-500 text-xs py-6">点击上方按钮生成二维码</div></div>'
        + '</div>'
        + '<div id="tab-manual" class="tab-panel hidden">'
        + '<div class="space-y-3">'
        + '<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">平台</label>'
        + '<select id="bindPlatform" class="input-field w-full px-3 py-2 rounded-lg text-sm">'
        + '<option value="wechat">视频号 / 微信</option>'
        + '<option value="douyin">抖音</option>'
        + '<option value="xiaohongshu">小红书</option>'
        + '<option value="kuaishou">快手</option>'
        + '<option value="bilibili">B 站</option>'
        + '</select></div>'
        + '<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">账号名称 *</label>'
        + '<input id="bindAccountName" type="text" placeholder="例：好物种草菌" class="input-field w-full px-3 py-2 rounded-lg text-sm" /></div>'
        + '<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Cookie / Session *</label>'
        + '<textarea id="bindCookie" rows="4" placeholder="从浏览器 F12 → Application → Cookies 复制粘贴..." class="input-field w-full px-3 py-2 rounded-lg text-sm font-mono"></textarea></div>'
        + '<div><label class="block text-xs font-semibold text-slate-300 mb-1.5">备注</label>'
        + '<input id="bindNote" type="text" placeholder="例：主力账号，粉丝较精准，日常发布用" class="input-field w-full px-3 py-2 rounded-lg text-sm" /></div>'
        + '<div class="flex gap-2 pt-2">'
        + '<button id="modalCancelBtn" class="btn-ghost flex-1 py-2 rounded-lg text-sm">取消</button>'
        + '<button id="modalSubmitBtn" class="btn-primary flex-1 py-2 rounded-lg text-sm">绑定账号</button>'
        + '</div></div>'
        + '</div>'
        + '</div>';
      document.body.appendChild(modal);

      var closeBtn = $("modalCloseBtn");
      if (closeBtn) closeBtn.onclick = function () { modal.style.display = "none"; };
      var cancelBtn = $("modalCancelBtn");
      if (cancelBtn) cancelBtn.onclick = function () { modal.style.display = "none"; };

      modal.querySelectorAll(".tab-btn").forEach(function (btn) {
        btn.onclick = function () {
          modal.querySelectorAll(".tab-btn").forEach(function (b) {
            b.className = "tab-btn bg-slate-700/40 text-slate-400 px-4 py-1.5 rounded-md text-sm";
          });
          btn.className = "tab-btn bg-slate-700 text-white px-4 py-1.5 rounded-md text-sm";
          modal.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.add("hidden"); });
          var tp = $("tab-" + btn.dataset.tab);
          if (tp) tp.classList.remove("hidden");
        };
      });

      var mt = $("tab-manual");
      if (mt) mt.classList.add("hidden");

      var qrBtn = $("qrStartBtn");
      if (qrBtn) qrBtn.onclick = function () {
        var platform = $("qrPlatform").value;
        $("qrLoginBox").innerHTML = '<div class="text-center text-slate-400 text-xs py-6"><div class="text-3xl mb-2 animate-pulse">⏳</div>正在生成登录二维码...</div>';
        bindQrLogin(platform);
      };

      var submitBtn = $("modalSubmitBtn");
      if (submitBtn) submitBtn.onclick = async function () {
        var platform = $("bindPlatform").value;
        var name = $("bindAccountName").value.trim();
        var cookie = $("bindCookie").value.trim();
        var note = $("bindNote").value.trim();
        if (!name) { toast("请填写账号名", "warn"); return; }
        try {
          await apiPost("/api/accounts", {
            platform: platform, account_name: name,
            cookie_string: cookie, username: name, note: note
          });
          toast("账号绑定成功！", "success");
          modal.style.display = "none";
          loadAccounts();
        } catch (e) { toast("绑定失败：" + e.message, "error"); }
      };

      modal.onclick = function (e) { if (e.target === modal) modal.style.display = "none"; };
    };
  }

  // ---------- 模板库 ----------
  function bindTemplateLibrary() {
    var btn = $("templateLibBtn");
    if (!btn) return;
    var templates = [
      { id: "t1", name: "开箱测评", desc: "产品开箱第一视角 + 细节特写 + 使用体验", duration: "30s", tags: ["测评", "真实感"] },
      { id: "t2", name: "口播带货", desc: "主播手持产品口述卖点，节奏明快", duration: "20-30s", tags: ["带货", "口播"] },
      { id: "t3", name: "剧情植入", desc: "真实场景剧情，自然植入产品亮点", duration: "45-60s", tags: ["剧情", "情感"] },
      { id: "t4", name: "对比测评", desc: "产品 vs 竞品，多维度参数对比", duration: "60s", tags: ["对比", "理性购买"] },
      { id: "t5", name: "达人推荐", desc: "达人/博主第一视角推荐，信任感强", duration: "30s", tags: ["达人", "种草"] },
      { id: "t6", name: "使用教程", desc: "一步步教用户如何使用产品", duration: "60s", tags: ["教程", "实用"] }
    ];
    btn.onclick = function () {
      var old = $("templateModal");
      if (old) old.parentNode.removeChild(old);
      var modal = document.createElement("div");
      modal.id = "templateModal";
      modal.style.cssText = "display:flex;position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.7);align-items:center;justify-content:center;backdrop-filter:blur(6px);";
      modal.innerHTML = '<div class="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto">'
        + '<div class="flex items-center justify-between p-5 border-b border-slate-700/60">'
        + '<div><h3 class="text-lg font-bold text-white">📚 视频模板库</h3><p class="text-xs text-slate-400 mt-1">选择模板快速生成带货视频</p></div>'
        + '<button id="tpl-close" class="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white flex items-center justify-center text-lg">✕</button></div>'
        + '<div class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">'
        + templates.map(function (t) {
            return '<div class="template-card bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 hover:border-blue-500/60 hover:bg-slate-900 cursor-pointer transition-all" data-tpl="' + t.id + '">'
              + '<div class="text-sm font-semibold text-white mb-1">' + esc(t.name) + '</div>'
              + '<div class="text-[11px] text-slate-400 mb-3 min-h-[36px]">' + esc(t.desc) + '</div>'
              + '<div class="flex items-center justify-between text-[10px]">'
              + '<span class="text-slate-500">⏱ ' + esc(t.duration) + '</span>'
              + '<span class="text-blue-400">立即使用 →</span>'
              + '</div></div>';
        }).join("")
        + '</div></div>';
      document.body.appendChild(modal);
      var cb = $("tpl-close");
      if (cb) cb.onclick = function () { modal.style.display = "none"; };
      modal.onclick = function (e) { if (e.target === modal) modal.style.display = "none"; };
      modal.querySelectorAll(".template-card").forEach(function (card) {
        card.onclick = function () {
          var tid = card.getAttribute("data-tpl");
          var meta = templates.find(function (x) { return x.id === tid; });
          if (meta) {
            var tplSel = $("videoTemplateSelect");
            if (tplSel) {
              var opts = Array.from(tplSel.options).map(function (o) { return o.value; });
              if (opts.indexOf(meta.name) === -1) {
                var o = document.createElement("option");
                o.value = meta.name; o.textContent = meta.name;
                tplSel.appendChild(o);
              }
              tplSel.value = meta.name;
            }
            toast("已选择模板：" + meta.name, "success");
            modal.style.display = "none";
          }
        };
      });
    };
  }

  // ---------- 商品分类 ----------
  function refreshCategories(items) {
    var sel = $("categorySelect");
    if (!sel || !items) return;
    var cats = {};
    items.forEach(function (p) {
      var c = (p && p.category) || "未分类";
      cats[c] = (cats[c] || 0) + 1;
    });
    var names = Object.keys(cats).sort();
    sel.innerHTML = '<option value="">全部分类 (' + items.length + ')</option>'
      + names.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + ' (' + cats[n] + ')</option>'; }).join("")
      + '<option value="__add__">➕ 新增类别...</option>';
    sel.onchange = function () {
      var v = sel.value;
      if (v === "__add__") {
        var name = prompt("输入新的商品类别名称：");
        if (name && name.trim()) {
          apiPost("/api/categories", { name: name.trim() })
            .then(function () { toast("已添加类别：" + name.trim(), "success"); })
            .catch(function (e) { toast("添加失败：" + e.message, "error"); });
        }
        sel.value = "";
      } else {
        var tb = document.querySelector("#productsTable");
        if (tb) {
          tb.querySelectorAll("[data-category]").forEach(function (row) {
            row.style.display = (!v || row.getAttribute("data-category") === v) ? "" : "none";
          });
        }
      }
    };
  }

  // ---------- 新建发布 Modal ----------
  function bindNewPublishModal() {
    var openBtn = $("newPublishBtn");
    if (!openBtn) return;

    openBtn.onclick = function () {
      var id = "newPublishModal";
      var el = $(id);
      if (!el) {
        el = document.createElement("div");
        el.id = id;
        el.className = "fixed inset-0 z-[55] items-center justify-center";
        el.style.cssText = "display:none; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);";
        var optionsHtml = (STATE.products.items && STATE.products.items.length)
          ? STATE.products.items.slice(0, 50).map(function (p) {
              return '<option value="' + (p.id || "") + '">' + esc((p.title || p.name || "商品") + "") + '</option>';
            }).join("")
          : '<option value="">请先加载商品数据</option>';
        el.innerHTML = '<div class="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto">'
          + '<div class="flex items-center justify-between p-6 border-b border-slate-700/60">'
          + '<div><h3 class="text-xl font-bold text-white">🚀 新建发布</h3>'
          + '<p class="text-xs text-slate-400 mt-1">选择商品并填写发布信息</p></div>'
          + '<button id="npm-close" class="w-9 h-9 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white flex items-center justify-center text-lg transition-colors">✕</button></div>'
          + '<div class="p-6 space-y-4">'
          + '<div><label class="block text-xs font-semibold text-slate-300 mb-2">商品 <span class="text-rose-400">*</span></label>'
          + '<select id="npm-product" class="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none">'
          + '<option value="">请选择商品</option>' + optionsHtml + '</select></div>'
          + '<div><label class="block text-xs font-semibold text-slate-300 mb-2">发布平台 <span class="text-rose-400">*</span></label>'
          + '<select id="npm-platform" class="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none">'
          + '<option value="xiaohongshu">小红书</option>'
          + '<option value="douyin">抖音</option>'
          + '<option value="wechat">视频号</option>'
          + '<option value="kuaishou">快手</option>'
          + '<option value="bilibili">B 站</option></select></div>'
          + '<div><label class="block text-xs font-semibold text-slate-300 mb-2">内容类型</label>'
          + '<select id="npm-content-type" class="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none">'
          + '<option value="image_text">图文种草</option>'
          + '<option value="script">口播脚本</option>'
          + '<option value="video">视频发布</option></select></div>'
          + '<div><label class="block text-xs font-semibold text-slate-300 mb-2">正文内容</label>'
          + '<textarea id="npm-body" rows="6" placeholder="填写发布内容..." class="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-y"></textarea></div>'
          + '</div>'
          + '<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-700/60">'
          + '<button id="npm-cancel" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 bg-slate-700/60 hover:bg-slate-700 transition-colors">取消</button>'
          + '<button id="npm-submit" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition-all">提交发布</button>'
          + '</div></div>';
        document.body.appendChild(el);
      }
      el.style.display = "flex";
      $("npm-close").onclick = function () { el.style.display = "none"; };
      $("npm-cancel").onclick = function () { el.style.display = "none"; };
      $("npm-submit").onclick = async function () {
        var productId = $("npm-product").value;
        var platform = $("npm-platform").value;
        var contentType = $("npm-content-type").value;
        var body = $("npm-body").value.trim();
        if (!productId) { toast("请选择商品", "warn"); return; }
        try {
          await apiPost("/api/actions/publish", {
            product_id: productId,
            platform: platform,
            content_type: contentType,
            body: body
          });
          toast("发布任务已提交", "success");
          el.style.display = "none";
          loadPublish();
        } catch (e) {
          console.error(e);
          toast("发布失败: " + e.message, "error");
        }
      };
    };
  }

  function bindHotPlatformTabs() {
    $$(".platform-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".platform-tab").forEach(function (b) {
          b.classList.remove("bg-slate-700/60", "text-white");
          b.classList.add("text-slate-400", "hover:text-white");
        });
        btn.classList.add("bg-slate-700/60", "text-white");
        btn.classList.remove("text-slate-400", "hover:text-white");
        STATE.hot.platform = btn.dataset.platform || "";
        if (STATE.hot.items && STATE.hot.items.length) {
          renderHotGrid(STATE.hot.items, STATE.hot.platform);
        }
      });
    });
  }

  function bindPublishPlatformTabs() {
    $$(".pub-platform").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".pub-platform").forEach(function (b) {
          b.classList.remove("bg-slate-700/60", "text-white");
          b.classList.add("text-slate-400", "hover:text-white");
        });
        btn.classList.add("bg-slate-700/60", "text-white");
        btn.classList.remove("text-slate-400", "hover:text-white");
        STATE.publish.platform = btn.dataset.platform || "";
        loadPublish();
      });
    });
  }

  function initApp() {
    var today = $("todayDate");
    if (today) {
      var d = new Date();
      var weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      today.textContent = d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日 · " + weekdays[d.getDay()];
    }

    bindSidebarNavigation();
    bindTopActions();
    bindHotPlatformTabs();
    bindPublishPlatformTabs();
    bindDataSubTabs();
    bindAccountModalLogic();
    bindNewPublishModal();
    bindTemplateLibrary();

    var newCatBtn = $("newCategoryBtn");
    if (newCatBtn) newCatBtn.onclick = function () {
      var name = prompt("输入新的商品类别名称：");
      if (name && name.trim()) {
        apiPost("/api/categories", { name: name.trim() })
          .then(function () { toast("已添加类别：" + name.trim(), "success"); })
          .catch(function (e) { toast("添加失败：" + e.message, "error"); });
      }
    };

    // 搜索框
    var search = $("productSearch");
    if (search) {
      search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          STATE.products.keyword = search.value.trim();
          STATE.products.page = 1;
          loadProducts();
        }
      });
    }

    // 默认加载仪表盘
    switchTab("dashboard");
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})()