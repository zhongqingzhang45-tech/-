/* ========================================================
 * Marketing Agent · 运营后台前端逻辑
 * 原生 JS · fetch · 模板字符串渲染
 * ======================================================== */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  function fmtDate(d) {
    if (!d) return "-";
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate())
      + " " + pad(dt.getHours()) + ":" + pad(dt.getMinutes()) + ":" + pad(dt.getSeconds());
  }

  function fmtNum(n) {
    if (n === null || n === undefined || n === "") return "-";
    var num = Number(n);
    if (isNaN(num)) return String(n);
    if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, "") + "w";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toLocaleString("zh-CN");
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function toast(msg, type) {
    var el = $("toast");
    if (!el) return;
    var colors = {
      info: "bg-slate-700 text-white",
      success: "bg-emerald-600 text-white",
      error: "bg-red-600 text-white",
      warn: "bg-amber-600 text-white"
    };
    el.textContent = msg;
    el.className = "fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm shadow-lg " + colors[type || "info"];
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 3000);
  }

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

  function unwrap(resp) {
    if (!resp) return resp;
    if (Array.isArray(resp)) return resp;
    if (resp.data !== undefined && resp.data !== null) return resp.data;
    return resp;
  }

  /* ================= Tab 切换 */
  var TAB_TITLES = {
    dashboard: "📊 仪表盘",
    products: "📦 商品库",
    contents: "✍️ 内容库",
    hot: "🔥 热点 Radar",
    publish: "🚀 发布记录",
    rankings: "🏆 排行榜",
    logs: "📝 日志"
  };

  function switchTab(tab) {
    document.querySelectorAll(".tab-panel").forEach(function (el) { el.classList.add("hidden"); });
    var panel = document.getElementById("tab-" + tab);
    if (panel) panel.classList.remove("hidden");
    document.querySelectorAll(".menu-item").forEach(function (el) {
      el.classList.toggle("active", el.dataset.tab === tab);
    });
    var pt = document.getElementById("pageTitle");
    if (pt) pt.textContent = TAB_TITLES[tab] || "仪表盘";
    if (tab === "dashboard") loadDashboard();
    else if (tab === "products") productsState.refresh();
    else if (tab === "contents") contentsState.refresh();
    else if (tab === "hot") loadHotTopics();
    else if (tab === "publish") publishState.refresh();
    else if (tab === "rankings") loadRankings();
    else if (tab === "logs") loadLogs();
  }

  /* ================= 仪表盘 */
  var statCardConfig = [
    { key: "products", label: "商品总数", icon: "📦",
      grad: "linear-gradient(90deg, #10b981, #6ee7b7)" },
    { key: "contents", label: "内容总数", icon: "✍️",
      grad: "linear-gradient(90deg, #3b82f6, #60a5fa)" },
    { key: "publish_count", label: "发布数", icon: "🚀",
      grad: "linear-gradient(90deg, #8b5cf6, #a78bfa)" },
    { key: "hot_topics", label: "热点数", icon: "🔥",
      grad: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
    { key: "images", label: "图片数", icon: "🖼️",
      grad: "linear-gradient(90deg, #ec4899, #f472b6)" },
    { key: "total_commission", label: "总佣金(¥)", icon: "💰",
      grad: "linear-gradient(90deg, #14b8a6, #2dd4bf)" }
  ];

  function renderStatCards(stats) {
    stats = stats || {};
    var html = statCardConfig.map(function (c) {
      var val = stats[c.key];
      var displayVal = (val !== undefined && val !== null) ? fmtNum(val) : "0";
      return '<div class="stat-card" style="--grad:' + c.grad + '">'
        + '<div class="stat-icon">' + c.icon + '</div>'
        + '<div class="stat-value">' + displayVal + '</div>'
        + '<div class="stat-label">' + c.label + '</div>'
        + '</div>';
    }).join("");
    var el = $("statsCards");
    if (el) el.innerHTML = html;
  }

  function renderTopProducts(items) {
    items = items || [];
    var chartEl = $("topProductsChart");
    if (!chartEl) return;
    if (!items.length) {
      chartEl.innerHTML = '<div class="text-slate-500 text-center py-8 text-sm">暂无数据</div>';
      return;
    }
    var max = Math.max.apply(null, items.map(function (x) { return Number(x.commission || x.sales || x.count || 1); }));
    var html = items.slice(0, 5).map(function (item) {
      var value = Number(item.commission || item.sales || item.count || 0);
      var pct = max > 0 ? (value / max) * 100 : 0;
      var label = item.title || item.name || "（未命名";
      var display = item.commission !== undefined
        ? "¥" + fmtNum(item.commission)
        : fmtNum(value);
      return '<div class="bar-row">'
        + '<div class="bar-label" title="' + esc(label) + '">' + esc(label) + '</div>'
        + '<div class="bar-track"><div class="bar-fill" style="width:' + pct.toFixed(1) + '%">' + display + '</div></div>'
        + '<div class="bar-value">' + display + '</div>'
        + '</div>';
    }).join("");
    chartEl.innerHTML = html;
  }

  function renderPlatformDonut(items) {
    items = items || [];
    var donut = $("platformDonut");
    var legend = $("platformLegend");
    if (!donut || !legend) return;
    if (!items.length) {
      donut.style.background = "#334155";
      legend.innerHTML = '<div class="text-slate-500 text-sm">暂无数据</div>';
      return;
    }
    var colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308"];
    var total = items.reduce(function (s, x) { return s + Number(x.count || 1); }, 0);
    var gradParts = [];
    var acc = 0;
    items.forEach(function (item, idx) {
      var c = colors[idx % colors.length];
      var start = (acc / total) * 360;
      acc += Number(item.count || 1);
      var end = (acc / total) * 360;
      gradParts.push(c + " " + start.toFixed(2) + "deg " + end.toFixed(2) + "deg");
    });
    donut.style.background = "conic-gradient(" + gradParts.join(", ") + ")";
    var legendHtml = items.map(function (item, idx) {
      var c = colors[idx % colors.length];
      var name = item.platform || item.name || "未知";
      var count = item.count || 0;
      var pct = ((count / total) * 100).toFixed(0);
      return '<div class="legend-row">'
        + '<span class="legend-swatch" style="background:' + c + '"></span>'
        + '<span class="legend-text"><span>' + esc(name) + '</span><span class="count">' + count + ' · ' + pct + '%</span></span>'
        + '</div>';
    }).join("");
    legend.innerHTML = legendHtml;
  }

  function renderRecentPublish(rows) {
    rows = rows || [];
    var el = $("recentPublishTable");
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<tr class="empty-row"><td colspan="4">暂无发布记录</td></tr>';
      return;
    }
    var html = rows.slice(0, 5).map(function (r) {
      var st = String(r.status || "pending").toLowerCase();
      return '<tr>'
        + '<td>' + esc(r.product_title || r.title || "-") + '</td>'
        + '<td>' + esc(r.platform || "-") + '</td>'
        + '<td><span class="status-pill ' + st + '">' + esc(r.status || st) + '</span></td>'
        + '<td>' + fmtDate(r.created_at || r.publish_time || r.time) + '</td>'
        + '</tr>';
    }).join("");
    el.innerHTML = html;
  }

  async function loadDashboard() {
    try {
      var data = await apiGet("/api/stats");
      var stats = unwrap(data) || {};
      renderStatCards(stats);
      renderTopProducts(stats.top_products || stats.products || []);
      renderPlatformDonut(stats.platform_distribution || stats.platforms || []);
      renderRecentPublish(stats.recent_publishes || stats.recent || []);
    } catch (e) {
      console.warn("dashboard load failed:", e);
      renderStatCards({});
      var chart = $("topProductsChart");
      if (chart) chart.innerHTML = '<div class="text-slate-500 text-sm text-center py-4">数据加载失败：' + esc(e.message) + '</div>';
      var donut = $("platformDonut");
      if (donut) donut.style.background = "#334155";
      var legend = $("platformLegend");
      if (legend) legend.innerHTML = '<div class="text-slate-500 text-sm">API 尚未启动</div>';
      var recent = $("recentPublishTable");
      if (recent) recent.innerHTML = '<tr class="empty-row"><td colspan="4">API 尚未启动</td></tr>';
    }
  }

  /* ================= 商品库 */
  var productsState = {
    page: 1,
    page_size: 20,
    keyword: "",
    refresh: function () {
      var searchEl = $("productSearch");
      this.keyword = searchEl ? searchEl.value.trim() : "";
      this.page = 1;
      this.fetchAndRender();
    },
    fetchAndRender: function () {
      var self = this;
      apiGet("/api/products", {
        page: self.page, page_size: self.page_size, keyword: self.keyword
      }).then(function (data) {
        var rows = Array.isArray(data) ? data : (unwrap(data) || data.items || data.data || []);
        renderProducts(rows);
        var total = data.total || data.count || (Array.isArray(data) ? data.length : rows.length);
        renderPager("productsPager", self, Number(total || 0));
      }).catch(function (e) {
        var el = $("productsTable");
        if (el) el.innerHTML = '<tr class="empty-row"><td colspan="9">加载失败：' + esc(e.message) + '</td></tr>';
      });
    },
    prev: function () { if (this.page > 1) { this.page--; this.fetchAndRender(); } },
    next: function () { this.page++; this.fetchAndRender(); }
  };

  function renderProducts(rows) {
    var el = $("productsTable");
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<tr class="empty-row"><td colspan="9">暂无数据</td></tr>';
      return;
    }
    var html = rows.map(function (r, idx) {
      var id = r.id !== undefined ? r.id : idx;
      var isHot = r.is_hot || r.hot || r.is_hot_product || false;
      var priceStr = (r.price !== undefined && r.price !== null) ? "¥" + Number(r.price).toFixed(2) : "-";
      var commissionStr = (r.commission !== undefined && r.commission !== null) ? "¥" + Number(r.commission).toFixed(2) : "-";
      var salesStr = r.sales !== undefined ? r.sales : (r.sold_count !== undefined ? r.sold_count : "-");
      return '<tr data-product-id="' + id + '">'
        + '<td>' + (r.id !== undefined ? r.id : "-") + '</td>'
        + '<td style="max-width:280px">' + esc(r.title || r.name || "-") + '</td>'
        + '<td>' + esc(r.platform || "-") + '</td>'
        + '<td>' + priceStr + '</td>'
        + '<td>' + commissionStr + '</td>'
        + '<td>' + fmtNum(salesStr) + '</td>'
        + '<td>' + (r.rating !== undefined ? r.rating : "-") + '</td>'
        + '<td>' + (isHot ? '<span class="status-pill success">🔥 爆品</span>' : '<span class="text-slate-500">—</span>') + '</td>'
        + '<td>' + fmtDate(r.created_at) + '</td>'
        + '</tr>';
    }).join("");
    el.innerHTML = html;
    el.querySelectorAll("tr[data-product-id]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var next = tr.nextElementSibling;
        if (next && next.classList && next.classList.contains("row-expand")) {
          next.parentNode.removeChild(next);
          return;
        }
        document.querySelectorAll("#productsTable .row-expand").forEach(function (e) { e.parentNode.removeChild(e); });
        var id = tr.getAttribute("data-product-id");
        var expand = document.createElement("tr");
        expand.className = "row-expand";
        expand.innerHTML = '<td colspan="9"><div class="expand-content">加载中...</div></td>';
        tr.parentNode.insertBefore(expand, tr.nextSibling);
        var container = expand.querySelector(".expand-content");
        apiGet("/api/products/" + id).then(function (d) {
          container.innerHTML = renderProductDetail(unwrap(d));
        }).catch(function (err) {
          container.innerHTML = '<div class="text-red-400">加载失败：' + esc(err.message) + '</div>';
        });
      });
    });
  }

  function listFromArrayOrString(x) {
    if (Array.isArray(x)) {
      return x.map(function (i) { return '<li>' + esc(typeof i === "string" ? i : JSON.stringify(i)) + '</li>'; }).join("");
    }
    if (typeof x === "string" && x) {
      return x.split(/\n|;|,/).filter(Boolean).map(function (i) { return '<li>' + esc(i.trim()) + '</li>'; }).join("");
    }
    if (x) return '<li>' + esc(JSON.stringify(x)) + '</li>';
    return '<li class="text-slate-500">暂无</li>';
  }

  function renderProductDetail(p) {
    if (!p) return "无详情数据";
    var html = "";
    var analysis = p.analysis || p.product_analysis || {};
    var extras = [];
    var meta = { "价格": p.price, "佣金": p.commission, "销量": p.sales, "评分": p.rating, "平台": p.platform, "URL": p.url, "分类": p.category, "品牌": p.brand };
    Object.keys(meta).forEach(function (k) {
      var v = meta[k];
      if (v !== undefined && v !== null && v !== "") {
        extras.push('<div class="kv"><span class="k">' + esc(k) + '</span><span class="v">' + esc(typeof v === "object" ? JSON.stringify(v) : v) + '</span></div>');
      }
    });
    html += '<div class="section-title">📌 基本信息</div>';
    html += '<div class="kv-grid">' + (extras.join("") || '<div class="text-slate-500">暂无</div>') + '</div>';
    html += '<div class="section-title">🎯 痛点 (Pain Points)</div>';
    html += '<ul>' + listFromArrayOrString(analysis.pain_points || p.pain_points) + '</ul>';
    html += '<div class="section-title">✨ 卖点 (Selling Points)</div>';
    html += '<ul>' + listFromArrayOrString(analysis.selling_points || p.selling_points) + '</ul>';
    html += '<div class="section-title">🛠️ 使用场景</div>';
    html += '<ul>' + listFromArrayOrString(analysis.use_scenarios || p.use_scenarios) + '</ul>';

    if (p.tags) {
      var tags = Array.isArray(p.tags) ? p.tags : String(p.tags).split(",");
      html += '<div class="section-title">🏷️ 标签</div>';
      html += '<div class="tags-row">' + tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>';
    }
    if (p.contents && p.contents.length) {
      html += '<div class="section-title">📝 已生成内容 (' + p.contents.length + ')</div>';
      html += p.contents.slice(0, 5).map(function (c) {
        var body = c.body || c.content || "";
        return '<div style="padding:8px; background:rgba(15,23,42,0.6); border-radius:6px; margin-top:4px">'
          + '<div style="color:#6ee7b7; font-weight:600">' + esc(c.title || c.content_type || "内容") + '</div>'
          + '<div style="color:#cbd5e1; margin-top:4px; max-height:80px; overflow:auto">' + esc(body.slice(0, 200)) + (body.length > 200 ? "..." : "") + '</div>'
          + '</div>';
      }).join("");
    }
    if (p.images && p.images.length) {
      html += '<div class="section-title">🖼️ 图片 (' + p.images.length + ')</div>';
      html += '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px">' + p.images.slice(0, 12).map(function (img) {
        var src = typeof img === "string" ? img : (img.url || img.src || img);
        return '<img src="' + esc(src) + '" style="width:120px; height:120px; object-fit:cover; border-radius:8px; border:1px solid #334155" onerror="this.style.display=\'none\'" />';
      }).join("") + '</div>';
    }
    var raw = JSON.stringify(p, null, 2);
    if (raw.length > 50) {
      html += '<div class="section-title">📦 原始数据</div>';
      html += '<pre class="json-box">' + esc(raw) + '</pre>';
    }
    return html;
  }

  /* ================= 内容库 */
  var contentsState = {
    page: 1,
    page_size: 20,
    refresh: function () {
      this.page = 1;
      this.fetchAndRender();
    },
    fetchAndRender: function () {
      var self = this;
      var fp = $("filterPlatform");
      var fc = $("filterContentType");
      var fs = $("filterStatus");
      apiGet("/api/contents", {
        page: self.page, page_size: self.page_size,
        platform: fp ? fp.value : "",
        content_type: fc ? fc.value : "",
        status: fs ? fs.value : ""
      }).then(function (data) {
        var rows = Array.isArray(data) ? data : (unwrap(data) || data.items || data.data || []);
        renderContents(rows);
        var total = data.total || data.count || (Array.isArray(data) ? data.length : rows.length);
        renderPager("contentsPager", self, Number(total || 0));
      }).catch(function (e) {
        var el = $("contentsTable");
        if (el) el.innerHTML = '<tr class="empty-row"><td colspan="7">加载失败：' + esc(e.message) + '</td></tr>';
      });
    },
    prev: function () { if (this.page > 1) { this.page--; this.fetchAndRender(); } },
    next: function () { this.page++; this.fetchAndRender(); }
  };

  var _contentsCache = [];

  function renderContents(rows) {
    _contentsCache = rows || [];
    var el = $("contentsTable");
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<tr class="empty-row"><td colspan="7">暂无数据</td></tr>';
      return;
    }
    var html = rows.map(function (r, idx) {
      var id = r.id !== undefined ? r.id : idx;
      var st = String(r.status || "draft").toLowerCase();
      return '<tr data-content-id="' + id + '">'
        + '<td>' + (r.id !== undefined ? r.id : "-") + '</td>'
        + '<td style="max-width:200px">' + esc(r.product_title || r.product || "-") + '</td>'
        + '<td>' + esc(r.platform || "-") + '</td>'
        + '<td>' + esc(r.content_type || r.type || "-") + '</td>'
        + '<td style="max-width:240px">' + esc(r.title || "(无标题)") + '</td>'
        + '<td><span class="status-pill ' + st + '">' + esc(r.status || st) + '</span></td>'
        + '<td>' + fmtDate(r.created_at) + '</td>'
        + '</tr>';
    }).join("");
    el.innerHTML = html;
    el.querySelectorAll("tr[data-content-id]").forEach(function (tr, idx) {
      tr.addEventListener("click", function () {
        var next = tr.nextElementSibling;
        if (next && next.classList && next.classList.contains("row-expand")) {
          next.parentNode.removeChild(next);
          return;
        }
        document.querySelectorAll("#contentsTable .row-expand").forEach(function (e) { e.parentNode.removeChild(e); });
        var id = tr.getAttribute("data-content-id");
        var expand = document.createElement("tr");
        expand.className = "row-expand";
        expand.innerHTML = '<td colspan="7"><div class="expand-content">加载中...</div></td>';
        tr.parentNode.insertBefore(expand, tr.nextSibling);
        var container = expand.querySelector(".expand-content");
        var row = _contentsCache.find(function (x) { return String(x.id) == String(id); }) || _contentsCache[idx];
        container.innerHTML = renderContentDetail(row);
      });
    });
  }

  function renderContentDetail(c) {
    if (!c) return "无详情";
    var html = "";
    if (c.body || c.content) {
      html += '<div class="section-title">📝 正文</div>';
      html += '<div style="white-space:pre-wrap; background:rgba(15,23,42,0.6); padding:12px; border-radius:6px; line-height:1.7; color:#e2e8f0">' + esc(c.body || c.content) + '</div>';
    }
    if (c.tags) {
      var tags = Array.isArray(c.tags) ? c.tags : String(c.tags).split(",");
      html += '<div class="section-title">🏷️ 标签</div>';
      html += '<div class="tags-row">' + tags.filter(Boolean).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>';
    }
    if (c.call_to_action || c.cta) {
      html += '<div class="section-title">🎯 Call to Action</div>';
      html += '<div>' + esc(c.call_to_action || c.cta) + '</div>';
    }
    if (c.cart_text || c.cart) {
      html += '<div class="section-title">🛒 购物车文案</div>';
      html += '<div>' + esc(c.cart_text || c.cart) + '</div>';
    }
    var raw = JSON.stringify(c, null, 2);
    if (raw.length > 50) {
      html += '<div class="section-title">📦 原始数据</div>';
      html += '<pre class="json-box">' + esc(raw) + '</pre>';
    }
    return html;
  }

  /* ================= 热点 Radar */
  async function loadHotTopics() {
    try {
      var data = await apiGet("/api/hot_topics", { limit: 100 });
      var rows = Array.isArray(data) ? data : (unwrap(data) || data.items || data.data || []);
      rows.sort(function (a, b) { return Number(b.heat_value || b.heat || 0) - Number(a.heat_value || a.heat || 0); });
      renderHot(rows);
    } catch (e) {
      var el = $("hotTable");
      if (el) el.innerHTML = '<tr class="empty-row"><td colspan="8">加载失败：' + esc(e.message) + '</td></tr>';
    }
  }

  function renderHot(rows) {
    var el = $("hotTable");
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<tr class="empty-row"><td colspan="8">暂无数据</td></tr>';
      return;
    }
    var html = rows.map(function (r, idx) {
      var fire = idx < 3 ? "🔥 " : "";
      var growth = r.heat_growth !== undefined ? r.heat_growth : r.growth;
      var growthText = "-";
      if (growth !== undefined && growth !== null) {
        var gn = Number(growth);
        if (!isNaN(gn)) {
          if (gn >= 0) growthText = '<span style="color:#6ee7b7">↑ ' + gn.toFixed(1) + '</span>';
          else growthText = '<span style="color:#fca5a5">↓ ' + Math.abs(gn).toFixed(1) + '</span>';
        }
      }
      return '<tr>'
        + '<td>' + fire + (idx + 1) + '</td>'
        + '<td style="font-weight:500; color:#e2e8f0">' + esc(r.keyword || r.title || r.name || "-") + '</td>'
        + '<td>' + esc(r.source || "-") + '</td>'
        + '<td style="color:#fbbf24; font-weight:600">' + fmtNum(r.heat_value || r.heat || 0) + '</td>'
        + '<td>' + growthText + '</td>'
        + '<td>' + esc(r.category || "-") + '</td>'
        + '<td>' + (r.rank !== undefined ? r.rank : "-") + '</td>'
        + '<td>' + fmtDate(r.created_at || r.time) + '</td>'
        + '</tr>';
    }).join("");
    el.innerHTML = html;
  }

  /* ================= 发布记录 */
  var publishState = {
    page: 1,
    page_size: 20,
    refresh: function () {
      this.page = 1;
      this.fetchAndRender();
    },
    fetchAndRender: function () {
      var self = this;
      apiGet("/api/publish_records", { page: self.page, page_size: self.page_size })
        .then(function (data) {
          var rows = Array.isArray(data) ? data : (unwrap(data) || data.items || data.data || []);
          renderPublish(rows);
          var total = data.total || data.count || (Array.isArray(data) ? data.length : rows.length);
          renderPager("publishPager", self, Number(total || 0));
        })
        .catch(function (e) {
          var el = $("publishTable");
          if (el) el.innerHTML = '<tr class="empty-row"><td colspan="5">加载失败：' + esc(e.message) + '</td></tr>';
        });
    },
    prev: function () { if (this.page > 1) { this.page--; this.fetchAndRender(); } },
    next: function () { this.page++; this.fetchAndRender(); }
  };

  function renderPublish(rows) {
    var el = $("publishTable");
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<tr class="empty-row"><td colspan="5">暂无数据</td></tr>';
      return;
    }
    var html = rows.map(function (r) {
      var st = String(r.status || "pending").toLowerCase();
      return '<tr>'
        + '<td style="max-width:240px">' + esc(r.product_title || r.product || r.title || "-") + '</td>'
        + '<td>' + esc(r.platform || "-") + '</td>'
        + '<td style="max-width:280px">' + esc(r.title || r.content_title || "-") + '</td>'
        + '<td><span class="status-pill ' + st + '">' + esc(r.status || st) + '</span></td>'
        + '<td>' + fmtDate(r.publish_time || r.created_at || r.time) + '</td>'
        + '</tr>';
    }).join("");
    el.innerHTML = html;
  }

  /* ================= 排行榜 */
  async function loadRankings() {
    try {
      var data = await apiGet("/api/rankings");
      var r = unwrap(data) || {};
      var products = r.top_products || r.products || r.top_commission || [];
      var contents = r.top_contents || r.contents || [];
      var hot = r.top_hot_topics || r.hot_topics || r.hot || [];
      renderRankList("rankProducts", products, function (p) {
        var title = p.title || p.name || "（未命名";
        var metaParts = [];
        if (p.platform) metaParts.push(p.platform);
        if (p.sales !== undefined) metaParts.push("销量" + p.sales);
        var value = p.commission !== undefined ? "¥" + fmtNum(p.commission) : fmtNum(p.score || p.sales || 0);
        return { title: title, meta: metaParts.join(" · "), value: value };
      });
      renderRankList("rankContents", contents, function (c) {
        var title = c.title || c.content || "（无标题";
        var metaParts = [];
        if (c.platform) metaParts.push(c.platform);
        if (c.content_type || c.type) metaParts.push(c.content_type || c.type);
        var value;
        if (c.views !== undefined || c.likes !== undefined) {
          value = fmtNum(c.views || 0) + "👁 " + fmtNum(c.likes || 0) + "❤";
        } else {
          value = fmtNum(c.engagement || c.score || 0);
        }
        return { title: title, meta: metaParts.join(" · "), value: value };
      });
      renderRankList("rankHot", hot, function (h) {
        return {
          title: h.keyword || h.title || h.name || "（未命名",
          meta: h.source || h.category || "",
          value: fmtNum(h.heat_value || h.heat || 0)
        };
      });
    } catch (e) {
      ["rankProducts", "rankContents", "rankHot"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '<li class="text-slate-500 text-sm">加载失败：' + esc(e.message) + '</li>';
      });
    }
  }

  function renderRankList(containerId, list, formatter) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<li class="text-slate-500 text-sm">暂无数据</li>';
      return;
    }
    var html = list.slice(0, 10).map(function (item, idx) {
      var info = formatter(item, idx) || {};
      var rankClass = idx < 3 ? "top-" + (idx + 1) : "";
      return '<li class="rank-item ' + rankClass + '">'
        + '<span class="rank-no">' + (idx + 1) + '</span>'
        + '<div class="rank-body">'
        + '<div class="rank-title" title="' + esc(info.title) + '">' + esc(info.title) + '</div>'
        + '<div class="rank-meta">' + esc(info.meta) + '</div>'
        + '</div>'
        + '<span class="rank-value">' + esc(info.value) + '</span>'
        + '</li>';
    }).join("");
    el.innerHTML = html;
  }

  /* ================= 日志 */
  async function loadLogs() {
    var el = $("logsArea");
    if (!el) return;
    el.textContent = "加载中...";
    try {
      var data = await apiGet("/api/logs", { tail_n: 200 });
      var text = typeof data === "string" ? data : (unwrap(data) || data.logs || data.lines || JSON.stringify(data, null, 2));
      el.textContent = Array.isArray(text) ? text.join("\n") : text;
    } catch (e) {
      el.textContent = "加载失败：" + e.message + "\n\n提示：请确保后端 /api/logs 接口正常启动";
    }
  }

  /* ================= 分页器 */
  function renderPager(containerId, state, total) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var totalPages = Math.max(1, Math.ceil(total / state.page_size));
    var hasPrev = state.page > 1;
    var hasNext = state.page < totalPages;
    el.innerHTML = "";
    var info = document.createElement("span");
    info.textContent = "共 " + total + " 条 · 第 " + state.page + " / " + totalPages + " 页";
    var prev = document.createElement("button");
    prev.textContent = "上一页";
    prev.disabled = !hasPrev;
    prev.onclick = function () { state.prev(); };
    var next = document.createElement("button");
    next.textContent = "下一页";
    next.disabled = !hasNext;
    next.onclick = function () { state.next(); };
    el.appendChild(info);
    el.appendChild(prev);
    el.appendChild(next);
  }

  /* ================= Modal */
  function closeModal() {
    var w = $("modalWrap");
    if (w) w.classList.add("hidden");
  }

  /* ================= Action 按钮 */
  async function runSmokeTest() {
    var btn = $("btnSmoke");
    var resultEl = $("actionResult");
    btn.disabled = true;
    btn.textContent = "执行中...";
    resultEl.classList.remove("hidden");
    resultEl.textContent = "正在冒烟测试...";
    try {
      var resp = await apiPost("/api/actions/run_smoke_test", {});
      var msg = typeof resp === "string" ? resp : (resp.message || resp.msg || JSON.stringify(resp));
      resultEl.textContent = "✓ " + (typeof msg === "string" ? msg.slice(0, 60) : "成功");
      toast("冒烟测试执行成功", "success");
      loadDashboard();
    } catch (e) {
      resultEl.textContent = "✗ " + e.message;
      toast("冒烟测试失败：" + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 触发冒烟测试";
      setTimeout(function () { resultEl.classList.add("hidden"); }, 5000);
    }
  }

  async function runPipeline() {
    var btn = $("btnPipeline");
    var resultEl = $("actionResult");
    btn.disabled = true;
    btn.textContent = "执行中...";
    resultEl.classList.remove("hidden");
    resultEl.textContent = "正在运行全流程...";
    try {
      var resp = await apiPost("/api/actions/run_pipeline", {
        n_products: 5, top_publish: 3, skip_publish: true
      });
      var msg = typeof resp === "string" ? resp : (resp.message || resp.msg || JSON.stringify(resp));
      resultEl.textContent = "✓ " + (typeof msg === "string" ? msg.slice(0, 60) : "成功");
      toast("全流程已启动", "success");
      loadDashboard();
    } catch (e) {
      resultEl.textContent = "✗ " + e.message;
      toast("全流程启动失败：" + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "⚡ 触发全流程";
      setTimeout(function () { resultEl.classList.add("hidden"); }, 5000);
    }
  }

  /* ================= 侧边栏折叠 */
  function toggleSidebar() {
    var sb = $("sidebar");
    if (!sb) return;
    sb.classList.toggle("sidebar-collapsed");
    sb.classList.toggle("sidebar-expanded");
    try { localStorage.setItem("sidebar-collapsed", sb.classList.contains("sidebar-collapsed")); } catch (e) {}
  }

  /* ================= 初始化 */
  function init() {
    try {
      if (localStorage.getItem("sidebar-collapsed") === "true") {
        var sb = $("sidebar");
        if (sb) {
          sb.classList.remove("sidebar-expanded");
          sb.classList.add("sidebar-collapsed");
        }
      }
    } catch (e) {}

    var now = new Date();
    var weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    var td = $("todayDate");
    if (td) td.textContent = now.getFullYear() + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日 " + weekdays[now.getDay()];

    document.querySelectorAll(".menu-item").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        switchTab(el.dataset.tab);
      });
    });

    var st = $("sidebarToggle");
    if (st) st.addEventListener("click", toggleSidebar);
    var smk = $("btnSmoke");
    if (smk) smk.addEventListener("click", runSmokeTest);
    var pl = $("btnPipeline");
    if (pl) pl.addEventListener("click", runPipeline);
    var ps = $("productSearch");
    if (ps) ps.addEventListener("keydown", function (e) { if (e.key === "Enter") productsState.refresh(); });
    var mw = $("modalWrap");
    if (mw) mw.addEventListener("click", function (e) { if (e.target.id === "modalWrap") closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    loadDashboard();
  }

  /* 暴露到全局 */
  window.productsState = productsState;
  window.contentsState = contentsState;
  window.publishState = publishState;
  window.loadLogs = loadLogs;
  window.closeModal = closeModal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
