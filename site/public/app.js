/* 金数据开放平台 · API 文档站前端
 *
 * 内容源是同仓库 docs/ 里的 markdown（由 site/scripts/build-data.mjs 生成 site.json），
 * 排版沿用原站；新增的只有右侧「在线调试」——真实发请求 + 生成多语言请求代码。
 *
 * 路由是真实路径（/api_v1/authentication），不是 hash：构建时每个路由都预渲染了一份
 * 带正文的 HTML，所以站外深链、搜索收录、无 JS 阅读都和原站一致；站内点击再由这里
 * 接管，走 pushState 不刷整页。
 */
import { createMarkdown } from "./markdown.js";
import { createNav } from "./nav.js";

(function () {
  "use strict";

  var API_BASE = "https://jinshuju.net";
  // 当前页对应哪个路由，由页面模板写在 <html data-route> 上（预渲染时就已确定）。
  // 站点基地址 = 当前 pathname 去掉这段路由，于是部署在任意子路径下都成立。
  var ROUTE0 = document.documentElement.getAttribute("data-route") || "";
  var SITE = (function () {
    var p = location.pathname.replace(/\/+$/, "");
    if (ROUTE0 && p.slice(-ROUTE0.length) === ROUTE0) p = p.slice(0, -ROUTE0.length);
    return p.replace(/\/+$/, "") + "/";
  })();
  // 静态资源（含正文图片）的基地址，由页面模板写在 <html data-asset-base> 上。
  // 部署到 WDL 时 public/ 在 CDN 上，站点路径下并没有这些文件，所以不能用 SITE 拼图片。
  var ASSET_BASE = (document.documentElement.getAttribute("data-asset-base") || SITE);
  // 留空 = 浏览器直连（默认）。想走转发就设 window.__JSJ_PROXY_URL__
  var PROXY_URL = (typeof window !== "undefined" && window.__JSJ_PROXY_URL__) || "";
  var REQUEST_TIMEOUT_MS = 15000;

  var LANGS = [
    { id: "curl", label: "cURL" },
    { id: "js", label: "JavaScript" },
    { id: "node", label: "Node.js" },
    { id: "python", label: "Python" },
    { id: "php", label: "PHP" },
    { id: "ruby", label: "Ruby" },
    { id: "java", label: "Java" },
    { id: "go", label: "Go" },
  ];

  var state = {
    nav: [],
    docs: {},
    order: [],
    current: null,
    filter: "",
    runnerOpen: true,
    creds: { key: "", secret: "" },
    tab: "result",
    lang: "curl",
    utLang: "python", // URL 传参生成器的语言
    toolMode: "api",  // 右侧面板当前是接口调试还是 URL 传参生成
    response: null,
    sending: false,
    abort: null,
    collapsed: {},
    closeFullEditor: null,
  };

  /* ================= 工具 ================= */

  // 正文渲染、代码高亮、链接协议白名单都在 markdown.js 里——构建脚本预渲染时
  // 要跑的就是这一份，浏览器和构建产物才不会出现两套排版。
  var md = createMarkdown({ site: SITE, assetBase: ASSET_BASE, state: state });
  var esc = md.esc;
  var codeBlock = md.codeBlock;
  var hlJson = md.hlJson;
  var stashCopy = md.stashCopy;
  var renderMarkdown = md.renderMarkdown;
  var tocItems = md.tocItems; // 数组身份固定，md.resetRender() 只清空不重建

  function el(id) { return document.getElementById(id); }

  var toastTimer;
  function toast(msg) {
    var t = el("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1700);
  }
  function copy(text, label) {
    navigator.clipboard.writeText(text).then(
      function () { toast((label || "内容") + "已复制"); },
      function () { toast("复制失败"); }
    );
  }

  /* ================= 目录树 ================= */

  // 目录树同样在 nav.js 里，构建时会用它把目录直接写进预渲染的 HTML
  var navTree = createNav({ state: state, esc: esc, site: SITE });
  var eachDoc = navTree.eachDoc;
  var menuHtml = navTree.menuHtml;

  function renderMenu() {
    var menu = el("menu");
    var q = state.filter.trim().toLowerCase();
    var r = menuHtml(state.nav, 0, q);
    menu.innerHTML = r.any ? r.html : '<div class="menu-empty">没有匹配的内容</div>';

    menu.querySelectorAll(".menu-group-label").forEach(function (n) {
      n.addEventListener("click", function () {
        var g = n.parentElement.getAttribute("data-key");
        state.collapsed[g] = !state.collapsed[g];
        n.parentElement.classList.toggle("collapsed");
      });
    });
    // 目录项是 <a href>，点击由下面那个全局链接拦截器统一处理，这里不用再绑
  }

  /* ================= 本页总览 ================= */

  function renderToc() {
    var box = el("toc");
    if (!tocItems.length) { box.innerHTML = ""; box.classList.add("empty"); return; }
    box.classList.remove("empty");
    box.innerHTML = '<div class="toc-inner"><div class="toc-title">本页总览</div><ul class="toc-list">' +
      tocItems.map(function (t) {
        return '<li class="lv' + t.level + '"><a href="#" data-toc="' + esc(t.id) + '">' + esc(t.text) + "</a></li>";
      }).join("") + "</ul></div>";

    box.querySelectorAll("[data-toc]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var target = document.getElementById(a.getAttribute("data-toc"));
        if (target) el("main").scrollTo({ top: target.offsetTop - 16, behavior: "smooth" });
      });
    });
    spyToc();
  }

  function spyToc() {
    if (!tocItems.length) return;
    var main = el("main");
    var top = main.scrollTop + 90;
    var active = tocItems[0].id;
    for (var i = 0; i < tocItems.length; i++) {
      var n = document.getElementById(tocItems[i].id);
      if (n && n.offsetTop <= top) active = tocItems[i].id;
    }
    el("toc").querySelectorAll("[data-toc]").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("data-toc") === active);
    });
  }

  /* ================= 在线调试 ================= */

  function api() { return state.current && state.current.api ? state.current.api : null; }

  // 读某个 Path / Query 参数当前填了什么。
  // 千万别叫 valueOf——那是 Object.prototype 上的方法名，拼错作用域时不会报错，
  // 只会静默拿到 Object.prototype.valueOf 并返回 truthy。
  function paramValue(kind, name) {
    var value = "";
    document.querySelectorAll("[data-" + kind + "]").forEach(function (n) {
      if (n.getAttribute("data-" + kind) === name) value = n.value.trim();
    });
    return value;
  }

  function builtPath() {
    var a = api();
    if (!a) return "";
    var p = a.path;
    document.querySelectorAll("[data-pp]").forEach(function (n) {
      var name = n.getAttribute("data-pp");
      var v = n.value.trim();
      if (v) p = p.split(name).join(encodeURIComponent(v));
    });
    var qs = [];
    document.querySelectorAll("[data-qp]").forEach(function (n) {
      if (n.value.trim()) qs.push(encodeURIComponent(n.getAttribute("data-qp")) + "=" + encodeURIComponent(n.value.trim()));
    });
    return p + (qs.length ? "?" + qs.join("&") : "");
  }

  function bodyText() {
    var t = el("in-body");
    return t && t.value.trim() ? t.value : null;
  }

  function requestReadiness() {
    var a = api();
    var issues = [];
    if (!state.creds.key.trim()) issues.push("缺少 API_KEY");
    if (!state.creds.secret.trim()) issues.push("缺少 API_SECRET");

    if (a) {
      (a.pathParams || []).forEach(function (p) {
        if (p.required && !paramValue("pp", p.name)) issues.push("缺少 Path 参数 " + p.name);
      });
      (a.queryParams || []).forEach(function (p) {
        if (p.required && !paramValue("qp", p.name)) issues.push("缺少 Query 参数 " + p.name);
      });
    }

    var body = bodyText();
    if (body) {
      try { JSON.parse(body); }
      catch (err) { issues.push("Body JSON 不合法"); }
    }
    return { ok: issues.length === 0, issues: issues };
  }

  // heading 是正文里的标题名，点了滚过去；不同页面能跳的标题不一样
  function paramHelpButtonHtml(heading, label) {
    heading = heading || "Request";
    return '<button class="doc-jump" type="button" data-doc-jump="' + esc(heading) +
      '" title="定位正文' + esc(heading) + '">' +
      '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="M3 2.5h7.25A1.75 1.75 0 0 1 12 4.25V13H4.75A1.75 1.75 0 0 0 3 14.75V2.5Z"/>' +
      '<path d="M3 12.75h7.25M6 5.5h3.5M6 8h3.5"/></svg>' +
      "<span>" + esc(label || "参数说明") + '</span><span aria-hidden="true">↗</span></button>';
  }

  function scrollToDocHeading(name) {
    var item = tocItems.find(function (entry) {
      return entry.text.trim().toLowerCase() === String(name).trim().toLowerCase();
    });
    var target = item ? document.getElementById(item.id) : null;
    if (!target) return false;
    el("main").scrollTo({ top: target.offsetTop - 16, behavior: "smooth" });
    return true;
  }

  // 路径参数的填写说明。只写确定的：另外两个（view_token / serial_number）
  // 文档里没给格式，与其编一个不如留参数名当占位
  var PATH_HINTS = {
    form_token: "表单链接 /f/ 后六位编码",
  };

  function renderRunner() {
    var wrap = el("runner-scroll");
    var a = api();
    if (!a) return;

    if (state.closeFullEditor) { state.closeFullEditor(); state.closeFullEditor = null; }
    var mr = el("modal-root");
    if (mr) { mr.innerHTML = ""; mr.hidden = true; }
    document.body.classList.remove("modal-open");

    state.toolMode = "api";
    var canRun = a.runnable !== false;
    var methods = [a.method].concat(a.alsoMethods || []);

    // 顶部栏：方法胶囊 + 标题/地址两行 + 复制/重置/发送，跟着接口变
    el("runner-req").innerHTML =
      (methods.length > 1
        ? '<select class="runner-verb-sel verb ' + a.method.toLowerCase() + '" id="in-method" ' +
          'title="该接口支持多种方法">' +
          methods.map(function (m) { return '<option value="' + m + '">' + m + "</option>"; }).join("") +
          "</select>"
        : '<span class="verb ' + a.method.toLowerCase() + '">' + esc(a.method) + "</span>") +
      '<code class="runner-url" id="run-url">' + esc(API_BASE + a.path) + "</code>";
    el("btn-send").disabled = !canRun;
    el("btn-send").textContent = "发送请求";
    el("btn-send").classList.remove("cancel");
    el("btn-reset").hidden = !canRun;

    var html = "";

    html += '<div class="rsec"><div class="rsec-head">' +
      '<span class="rsec-tag">AUTH</span><span class="rsec-name">Basic 认证</span></div>' +
      '<div class="rrow"><label for="in-key">API_KEY<span class="star">*</span></label>' +
      '<input class="ipt" id="in-key" type="text" autocomplete="off" placeholder="你的 API Key"></div>' +
      '<div class="rrow"><label for="in-secret">API_SECRET<span class="star">*</span></label>' +
      '<input class="ipt" id="in-secret" type="password" autocomplete="off" placeholder="你的 API Secret"></div>' +
      '<div class="cred-links">在 <a href="https://next.jinshuju.net/profile/api" target="_blank" rel="noopener">个人中心 → API</a>' +
      ' 或 <a href="https://next.jinshuju.net/system/api_licence" target="_blank" rel="noopener">系统设置 → 企业 API</a> 获取</div></div>';

    if (a.pathParams.length) {
      html += '<div class="rsec"><div class="rsec-head">' +
        '<span class="rsec-tag">PATH</span><span class="rsec-name">路径参数</span></div>' +
        a.pathParams.map(function (p) {
          // 数据里的占位符是 FORM_TOKEN 这种大写，显示成小写更像参数名
          var key = p.name.toLowerCase();
          return '<div class="rrow"><label title="' + esc(p.desc || p.name) + '">' + esc(key) +
            (p.required ? '<span class="star">*</span>' : "") + "</label>" +
            '<input class="ipt" data-pp="' + esc(p.name) + '" placeholder="' +
            esc(PATH_HINTS[key] || key) + '"></div>';
        }).join("") + "</div>";
    }

    if (a.queryParams.length) {
      html += '<div class="rsec"><div class="rsec-head">' +
        '<span class="rsec-tag">QUERY</span><span class="rsec-name">查询参数</span>' +
        '<span class="grow"></span>' + paramHelpButtonHtml() + "</div>" +
        a.queryParams.map(function (p) {
          return '<div class="rrow"><label title="' + esc(p.name) + '">' + esc(p.name) +
            (p.required ? '<span class="star">*</span>' : "") + "</label>" +
            '<input class="ipt" data-qp="' + esc(p.name) + '" placeholder="选填"></div>';
        }).join("") + "</div>";
    }

    if (!canRun) {
      html += '<div class="rsec"><div class="rsec-head">' +
        '<span class="rsec-tag">BODY</span><span class="rsec-name">' + esc(a.contentType) + "</span>" +
        '<span class="grow"></span>' +
        (a.bodyParams && a.bodyParams.length ? paramHelpButtonHtml() : "") + "</div>" +
        '<div class="hint-box">该接口是文件上传（multipart/form-data），在线调试暂不支持；' +
        "正文「示例代码」一节给出了可直接使用的写法。</div></div>";
    } else if (["POST", "PUT", "PATCH"].indexOf(a.method) !== -1 || (a.alsoMethods || []).length) {
      // JSON 编辑器的状态和工具按钮都提到分区标题行上，编辑器本身只剩行号 + 代码
      html += '<div class="rsec"><div class="rsec-head">' +
        '<span class="rsec-tag">BODY</span>' +
        '<span class="jsed-status" id="jsed-status"></span>' +
        '<span class="grow"></span>' +
        "</div>" +
        // 格式化 / 全屏 / 参数说明都挂在编辑器自己的菜单栏上，分区标题行保持短，窄面板下才不折行
        jsonEditorHtml(bodyDefault(a), a.bodyParams && a.bodyParams.length) +
        '<div class="rsec-hint">点击任意位置直接编辑 JSON</div></div>';
    }

    wrap.innerHTML = html;

    var k = el("in-key"), s = el("in-secret");
    k.value = state.creds.key; s.value = state.creds.secret;
    function onCred() {
      // 凭据只留在内存里：刷新或重新打开都不该还在（见 init 里的清理）
      state.creds.key = k.value; state.creds.secret = s.value;
      if (state.tab === "code") renderOut();
    }
    k.addEventListener("input", onCred);
    s.addEventListener("input", onCred);

    wrap.querySelectorAll("[data-pp],[data-qp]").forEach(function (n) {
      n.addEventListener("input", function () { syncUrl(); if (state.tab === "code") renderOut(); });
    });
    wrap.querySelectorAll("[data-doc-jump]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var heading = btn.getAttribute("data-doc-jump");
        if (!scrollToDocHeading(heading)) { toast("正文中未找到 " + heading); return; }
        toast("已定位到正文 " + heading);
      });
    });
    // 方法下拉自己就是那个彩色标签，切换时同步配色
    var ms = el("in-method");
    if (ms) ms.addEventListener("change", function () {
      ms.className = "runner-verb-sel verb " + ms.value.toLowerCase();
      if (state.tab === "code") renderOut();
    });

    initJsonEditor(function () { if (state.tab === "code") renderOut(); });

    syncUrl();
    state.response = null;
    renderOut();
  }

  // 文档里的示例值：Path 参数用 example，Body 用 requestExample
  function bodyDefault(a) {
    var init = a.requestExample || "{\n  \n}";
    try { init = JSON.stringify(JSON.parse(init), null, 2); } catch (err) { /* 原样 */ }
    return init;
  }

  function resetRunner() {
    if (state.toolMode === "url") return resetUrlTool();
    var a = api();
    if (!a) return;
    el("runner-scroll").querySelectorAll("[data-pp],[data-qp]").forEach(function (n) { n.value = ""; });
    var ta = el("in-body");
    if (ta) {
      ta.value = bodyDefault(a);
      ta.dispatchEvent(new Event("input"));
    }
    var ms = el("in-method");
    if (ms) { ms.value = a.method; ms.dispatchEvent(new Event("change")); }
    state.response = null;
    syncUrl();
    renderOut();
    toast("已恢复成文档里的示例值");
  }

  function curMethod() {
    var ms = el("in-method");
    return ms ? ms.value : (api() ? api().method : "GET");
  }

  function syncUrl() {
    var u = el("run-url");
    if (!u) return;
    if (state.toolMode === "url") {
      u.textContent = UT.result ? UT.result.url : FORM_BASE;
      u.scrollLeft = u.scrollWidth;
      return;
    }
    var path = builtPath();
    // 还没填的路径参数显示成 {form_token}，一眼看出是占位符而不是真值
    var a = api();
    if (a) {
      (a.pathParams || []).forEach(function (p) {
        if (!paramValue("pp", p.name)) {
          path = path.split(p.name).join("{" + p.name.toLowerCase() + "}");
        }
      });
    }
    u.textContent = API_BASE + path;
    // 放不下时保留末尾可见：路径尾部（资源、参数）比域名前缀更该被看到。
    // 想看前面往左滚即可。
    u.scrollLeft = u.scrollWidth;
  }

  /* ---------- JSON 编辑器 ---------- */

  // 菜单栏在编辑器自己顶上：左边 JSON，右边格式化 / 全屏 / 参数说明
  function jsonEditorHtml(initial, withParamHelp) {
    return '<div class="jsed" id="jsed">' +
      '<div class="jsed-bar">' +
      '<span class="jsed-name">JSON</span>' +
      '<span class="grow"></span>' +
      '<button class="rtool" id="jsed-fmt" type="button" title="按 2 空格缩进重新格式化">格式化</button>' +
      '<button class="rtool rtool-icon" id="jsed-full" type="button"></button>' +
      (withParamHelp ? paramHelpButtonHtml() : "") +
      "</div>" +
      '<div class="jsed-body">' +
      '<div class="jsed-gutter" id="jsed-gutter"></div>' +
      '<div class="jsed-code">' +
      '<pre class="jsed-hl" id="jsed-hl" aria-hidden="true"><code></code></pre>' +
      '<textarea class="jsed-input" id="in-body" spellcheck="false" wrap="off"' +
      ' autocapitalize="off" autocorrect="off">' + esc(initial) + "</textarea>" +
      "</div></div></div>";
  }

  function initJsonEditor(onChange) {
    var box = el("jsed"), ta = el("in-body"), hl = el("jsed-hl"),
        gutter = el("jsed-gutter"), status = el("jsed-status");
    if (!box || !ta) return;

    function paint() {
      var src = ta.value;
      hl.firstChild.innerHTML = hlJson(src) + "\n";
      var t = src.trim();
      var errorInfo = null;
      if (!t) { status.className = "jsed-status"; status.textContent = "空"; status.title = "空"; }
      else {
        try {
          JSON.parse(src); status.className = "jsed-status ok"; status.textContent = "JSON 合法";
          status.title = "JSON 合法";
        } catch (err) {
          errorInfo = jsonErrorInfo(err, src);
          status.className = "jsed-status bad"; status.textContent = "格式错误";
          status.title = errorInfo.detail;
        }
      }
      var n = src.split("\n").length, nums = "";
      for (var i = 1; i <= n; i++) {
        var bad = errorInfo && errorInfo.line === i;
        nums += '<span class="jsed-line' + (bad ? " has-error" : "") + '"' +
          (bad ? ' title="' + esc(errorInfo.detail) + '"' : "") + ">" + i + "</span>";
      }
      gutter.innerHTML = nums;
      sync();
    }
    function sync() {
      hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop;
    }

    ta.addEventListener("input", function () { paint(); if (onChange) onChange(); });
    ta.addEventListener("scroll", sync);
    ta.addEventListener("keydown", function (ev) {
      if (ev.key === "Tab") {
        ev.preventDefault();
        var a1 = ta.selectionStart, a2 = ta.selectionEnd;
        ta.value = ta.value.slice(0, a1) + "  " + ta.value.slice(a2);
        ta.selectionStart = ta.selectionEnd = a1 + 2;
        paint(); if (onChange) onChange();
      }
    });

    el("jsed-fmt").addEventListener("click", function () {
      try {
        ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
        paint(); if (onChange) onChange();
        toast("已格式化");
      } catch (err) { paint(); toast("JSON 不合法，无法格式化"); }
    });

    var modal = el("modal-root");
    var home = document.createElement("div");
    home.className = "jsed-slot";

    // 四角折线：开口朝外 = 展开到四角；开口朝内 = 收拢回中心
    var ICON_EXPAND = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10"/></svg>';
    var ICON_SHRINK = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2.5 6H6V2.5M13.5 6H10V2.5M2.5 10H6v3.5M13.5 10H10v3.5"/></svg>';
    var fullBtn = el("jsed-full");
    function syncFullBtn() {
      var on = box.classList.contains("jsed-full");
      // 始终只放图标：塞进「退出全屏」四个字会把这个图标按钮的宽度撑爆
      fullBtn.innerHTML = on ? ICON_SHRINK : ICON_EXPAND;
      fullBtn.title = on ? "退出全屏（Esc）" : "全屏编辑";
    }
    function enterFull() {
      if (box.classList.contains("jsed-full")) return;
      box.parentNode.insertBefore(home, box);
      modal.appendChild(box);
      modal.hidden = false;
      box.classList.add("jsed-full");
      document.body.classList.add("modal-open");
      ta.focus(); paint();
    }
    function exitFull() {
      if (!box.classList.contains("jsed-full")) return;
      box.classList.remove("jsed-full");
      if (home.parentNode) home.parentNode.replaceChild(box, home);
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      paint();
    }
    fullBtn.addEventListener("click", function () {
      if (box.classList.contains("jsed-full")) exitFull(); else enterFull();
      syncFullBtn();
    });
    // 编辑器每换一个接口页面就重建一次，所以这里不能再往 document / modal 上挂监听，
    // 否则每次都新增一份、永不移除。Esc 和点遮罩关闭统一由 init() 注册一次，
    // 通过 state.closeFullEditor 回调到当前这个编辑器。
    state.closeFullEditor = function () {
      if (!box.classList.contains("jsed-full")) return;
      exitFull();
      syncFullBtn();
    };

    syncFullBtn();
    paint();
  }

  function jsonErrorInfo(err, src) {
    var msg = String(err.message || err);
    var line = 1, col = null;
    var pos = msg.match(/position\s+(\d+)/i);
    if (pos) {
      var idx = +pos[1], before = src.slice(0, idx);
      line = before.split("\n").length;
      col = idx - before.lastIndexOf("\n");
    } else {
      var ln = msg.match(/line\s+(\d+)/i);
      var cn = msg.match(/column\s+(\d+)/i);
      if (ln) line = +ln[1];
      if (cn) col = +cn[1];
    }
    var prefix = "第 " + line + " 行" + (col ? "第 " + col + " 列" : "");
    return {
      line: line,
      column: col,
      detail: prefix + ": " + msg.replace(/\s*in JSON at position.*$/, "").replace(/^JSON\.parse:\s*/, ""),
    };
  }

  /* ---------- 发送 ---------- */

  function basic(key, secret) {
    var bytes = new TextEncoder().encode(key + ":" + secret);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return "Basic " + btoa(bin);
  }

  // 金数据 API 开放了 CORS（Access-Control-Allow-Origin: *，允许 authorization 头），
  // 所以默认浏览器直连——凭据不经任何第三方服务器。
  // PROXY_URL 只是给「CORS 被收紧」或「需要内网出口」这类情况留的后门，默认不启用。
  function sendDirect(method, path, body, signal) {
    var started = Date.now();
    var headers = {
      Authorization: basic(state.creds.key, state.creds.secret),
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    return fetch(API_BASE + path, { method: method, headers: headers, body: body || undefined, signal: signal })
      .then(function (r) {
        return r.text().then(function (text) {
          return {
            status: r.status,
            statusText: r.statusText,
            durationMs: Date.now() - started,
            contentType: r.headers.get("content-type") || "",
            body: text,
          };
        });
      });
  }

  function sendViaProxy(method, path, body, signal) {
    return fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: signal,
      body: JSON.stringify({
        method: method, path: path,
        apiKey: state.creds.key, apiSecret: state.creds.secret,
        body: body || undefined,
      }),
    }).then(function (r) { return r.json(); });
  }

  function setSendBtn(text, sending) {
    var btn = el("btn-send");
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = text;
    btn.classList.toggle("cancel", !!sending);
    btn.title = sending ? "点击中止本次请求" : "";
  }

  function cancelSend() {
    if (state.abort) state.abort();
  }

  function send() {
    // URL 传参页那个面板不发请求，主按钮是「复制链接」
    if (state.toolMode === "url") {
      if (UT.result) copy(UT.result.url, "链接");
      return;
    }
    if (state.sending) { cancelSend(); return; } // 发送中再点一次 = 取消
    var readiness = requestReadiness();
    if (!readiness.ok) { toast(readiness.issues.join("；")); return; }
    var body = bodyText();

    var method = curMethod(), path = builtPath();

    // 网络挂住时不能一直停在「发送中」：超时自动中断，中途也允许手动取消
    var controller = new AbortController();
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT_MS);

    state.sending = true;
    state.abort = function () { clearTimeout(timer); controller.abort(); };
    setSendBtn("取消", true);
    state.tab = "result"; state.response = { pending: true };
    renderOut();

    (PROXY_URL
      ? sendViaProxy(method, path, body, controller.signal)
      : sendDirect(method, path, body, controller.signal))
      .then(function (r) { state.response = r; })
      .catch(function (err) {
        var aborted = err && (err.name === "AbortError" || err.name === "TimeoutError");
        if (aborted && timedOut) {
          state.response = {
            error: "请求超时：" + Math.round(REQUEST_TIMEOUT_MS / 1000) + " 秒内没有收到响应。\n\n" +
              "可以检查网络后重试，或确认地址与参数是否正确。",
          };
        } else if (aborted) {
          state.response = { error: "已取消本次请求。" };
        } else {
          state.response = {
            error: "请求失败：" + String(err && err.message ? err.message : err) +
              "\n\n浏览器直连被拦截时，常见原因是网络策略或 CORS。" +
              "可以在页面里设置 window.__JSJ_PROXY_URL__ 指向一个转发端点（见 README）。",
          };
        }
      })
      .finally(function () {
        clearTimeout(timer);
        state.sending = false;
        state.abort = null;
        setSendBtn("发送请求", false);
        renderOut();
      });
  }

  /* ---------- 请求代码 ---------- */

  function snippet(lang) {
    if (!api()) return "";
    var url = API_BASE + builtPath();
    var key = state.creds.key;
    var secret = state.creds.secret;
    var body = bodyText();
    var compact = null;
    if (body) { try { compact = JSON.stringify(JSON.parse(body)); } catch (e) { compact = null; } }
    var m = curMethod();
    var authorization = basic(key, secret);

    switch (lang) {
      case "curl":
        // --request 必须显式给出：只有 --data 时 curl 会按 POST 发，
        // 不带 body 的 DELETE 会退化成 GET
        var curlLines = ["curl --location --request " + m + " " + shq(url),
          "--header " + shq("Authorization: " + authorization),
          "--header 'Content-Type: application/json'",
          "--header 'Accept: application/json'"];
        if (compact) {
          curlLines.push("--data " + shq(compact));
        }
        var curlCommand = curlLines.map(function (line, i) {
          return line + (i < curlLines.length - 1 ? " \\" : "");
        }).join("\n");
        return curlCommand;

      case "js":
        return ["const headers = new Headers();",
          "headers.append(\"Authorization\", " + q(authorization) + ");",
          "headers.append(\"Content-Type\", \"application/json\");",
          "headers.append(\"Accept\", \"application/json\");"]
          .concat(["", "const requestOptions = {", "  method: " + q(m) + ",", "  headers,",
            compact ? "  body: JSON.stringify(" + pretty(body, 2) + ")," : "",
            '  redirect: "follow",', "};", "",
            "fetch(" + q(url) + ", requestOptions)", "  .then((response) => response.text())",
            "  .then(console.log)", "  .catch(console.error);"])
          .filter(function (line) { return line !== "" || !compact; }).join("\n");

      case "node":
        return ["// npm i axios", 'import axios from "axios";', "",
          "const config = {", "  method: " + q(m.toLowerCase()) + ",", "  maxBodyLength: Infinity,",
          "  url: " + q(url) + ",", "  headers: {", "    Authorization: " + q(authorization) + ",",
          '    "Content-Type": "application/json",', '    Accept: "application/json",']
          .concat(["  },"])
          .concat(compact ? ["  data: " + pretty(body, 2) + ","] : [])
          .concat(["};", "", "axios.request(config)", "  .then((response) => console.log(response.data))",
            "  .catch((error) => console.error(error));"]).join("\n");

      case "python":
        var pythonLines = ["import requests"];
        if (compact) pythonLines.push("import json");
        pythonLines.push("", "url = " + q(url), "");
        pythonLines.push(compact ? "payload = json.dumps(" + pyPayload(body, 0) + ")" : "payload = {}");
        pythonLines.push("", "headers = {", "  'Authorization': " + rq(authorization) + ",",
          "  'Content-Type': 'application/json',", "  'Accept': 'application/json'");
        pythonLines.push("}", "", "response = requests.request(" + q(m) + ", url, headers=headers, data=payload)", "", "print(response.text)");
        return pythonLines.join("\n");

      case "php":
        return ["<?php", "", "$curl = curl_init();", "", "curl_setopt_array($curl, [",
          "    CURLOPT_URL => " + rq(url) + ",", "    CURLOPT_RETURNTRANSFER => true,",
          "    CURLOPT_FOLLOWLOCATION => true,", "    CURLOPT_CUSTOMREQUEST => " + rq(m) + ","]
          .concat(compact ? ["    CURLOPT_POSTFIELDS => " + rq(compact) + ","] : [])
          .concat(["    CURLOPT_HTTPHEADER => [", "        " + rq("Authorization: " + authorization) + ",",
            "        'Content-Type: application/json',", "        'Accept: application/json'", "    ],", "]);", "",
            "$response = curl_exec($curl);", "curl_close($curl);", "", "echo $response;"]).join("\n");

      case "ruby":
        return ["require 'uri'", "require 'net/http'", "", "url = URI(" + rq(url) + ")", "",
          "https = Net::HTTP.new(url.host, url.port)", "https.use_ssl = true", "",
          "request = Net::HTTP::" + rubyClass(m) + ".new(url)",
          "request['Authorization'] = " + rq(authorization),
          "request['Content-Type'] = 'application/json'", "request['Accept'] = 'application/json'"]
          .concat(compact ? ["request.body = " + rq(compact)] : [])
          .concat(["", "response = https.request(request)", "puts response.read_body"]).join("\n");

      case "java":
        var javaLines = ["import java.net.URI;", "import java.net.http.*;", "", "public class Main {",
          "  public static void main(String[] args) throws Exception {", "    HttpRequest request = HttpRequest.newBuilder()",
          "        .uri(URI.create(" + q(url) + "))",
          "        .header(\"Authorization\", " + q(authorization) + ")",
          '        .header("Content-Type", "application/json")',
          '        .header("Accept", "application/json")'];
        return javaLines.concat([
          "        " + javaVerb(m, compact), "        .build();", "",
          "    HttpResponse<String> response = HttpClient.newHttpClient()",
          "        .send(request, HttpResponse.BodyHandlers.ofString());", "", "    System.out.println(response.body());",
          "  }", "}"]).join("\n");

      case "go":
        var goLines = ["package main", "", "import (", '\t"fmt"', '\t"io"', '\t"net/http"'];
        if (compact) goLines.push('\t"strings"');
        goLines.push(")", "", "func main() {");
        if (compact) goLines.push("\tbody := strings.NewReader(" + gq(compact) + ")");
        goLines.push("\treq, _ := http.NewRequest(" + q(m) + ", " + q(url) + ", " + (compact ? "body" : "nil") + ")");
        goLines.push("\treq.Header.Add(\"Authorization\", " + q(authorization) + ")");
        goLines.push('\treq.Header.Add("Content-Type", "application/json")');
        goLines.push('\treq.Header.Add("Accept", "application/json")');
        goLines.push("", "\tres, err := http.DefaultClient.Do(req)", "\tif err != nil {", "\t\tpanic(err)", "\t}",
          "\tdefer res.Body.Close()", "", "\tbody, err := io.ReadAll(res.Body)",
          "\tif err != nil {", "\t\tpanic(err)", "\t}", "\tfmt.Println(string(body))", "}");
        return goLines.join("\n");
    }
    return "";
  }

  function q(s) { return JSON.stringify(String(s)); }
  function shq(s) { return "'" + String(s).replace(/'/g, "'\"'\"'") + "'"; }
  function rq(s) { return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'"; }
  function gq(s) { return "`" + String(s).replace(/`/g, '` + "`" + `') + "`"; }
  function rubyClass(m) { return { GET: "Get", POST: "Post", PUT: "Put", PATCH: "Patch", DELETE: "Delete" }[m] || "Get"; }
  function javaVerb(m, compact) {
    var pub = compact ? "HttpRequest.BodyPublishers.ofString(" + q(compact) + ")" : "HttpRequest.BodyPublishers.noBody()";
    if (m === "GET") return ".GET()";
    if (m === "DELETE") return ".DELETE()";
    if (m === "POST") return ".POST(" + pub + ")";
    if (m === "PUT") return ".PUT(" + pub + ")";
    return '.method("' + m + '", ' + pub + ")";
  }
  // JSON 直接塞进 Python 会报 NameError：true/false/null 得写成 True/False/None。
  // 字符串沿用 JSON.stringify——它产出的转义（\n \t \" \\ \uXXXX）Python 全都认。
  function pyLiteral(value, indent) {
    if (value === null) return "None";
    if (value === true) return "True";
    if (value === false) return "False";
    if (typeof value === "number") return isFinite(value) ? String(value) : "None";
    if (typeof value === "string") return JSON.stringify(value);
    var pad = " ".repeat(indent), padIn = " ".repeat(indent + 2);
    if (Array.isArray(value)) {
      if (!value.length) return "[]";
      return "[\n" + value.map(function (v) { return padIn + pyLiteral(v, indent + 2); }).join(",\n") +
        "\n" + pad + "]";
    }
    var keys = Object.keys(value);
    if (!keys.length) return "{}";
    return "{\n" + keys.map(function (k) {
      return padIn + JSON.stringify(k) + ": " + pyLiteral(value[k], indent + 2);
    }).join(",\n") + "\n" + pad + "}";
  }

  function pyPayload(body, indent) {
    try {
      return pyLiteral(JSON.parse(body), indent);
    } catch (err) {
      return pretty(body, indent); // 调用点已确认 body 是合法 JSON，这里只是兜底
    }
  }

  function pretty(json, indent) {
    try {
      var s = JSON.stringify(JSON.parse(json), null, 2), pad = " ".repeat(indent);
      return s.split("\n").map(function (l, i) { return i === 0 ? l : pad + l; }).join("\n");
    } catch (e) { return json; }
  }
  var SNIP_LANG = { curl: "bash", js: "javascript", node: "javascript", python: "python", php: "php", ruby: "ruby", java: "java", go: "go" };

  function renderOut() {
    if (state.toolMode === "url") return renderUrlOut();
    if (!api()) return;
    var tabs = el("out-tabs"), pane = el("out-pane");
    var readiness = requestReadiness();

    var right = "";
    if (state.tab === "result" && state.response && !state.response.pending && !state.response.error) {
      var ok = state.response.status >= 200 && state.response.status < 300;
      right = ok
        ? '<span class="pill ok">' + state.response.status + "</span>"
        : '<button class="pill bad status-doc-jump" type="button" title="查看正文状态码说明">' +
          state.response.status + "</button>";
      right +=
        '<span class="ms">' + state.response.durationMs + " ms</span>";
    } else if (state.tab === "code") {
      right = '<span class="pill ' + (readiness.ok ? "ok" : "bad") + '">' +
        (readiness.ok ? "可执行" : "待填写") + '</span>' +
        '<select class="lang-select" id="lang-sel">' + LANGS.map(function (l) {
        return '<option value="' + l.id + '"' + (l.id === state.lang ? " selected" : "") + ">" + l.label + "</option>";
      }).join("") + "</select>";
    }

    tabs.innerHTML =
      '<button class="tab' + (state.tab === "result" ? " on" : "") + '" data-tab="result">返回结果</button>' +
      '<button class="tab' + (state.tab === "code" ? " on" : "") + '" data-tab="code">请求代码</button>' +
      '<span class="right">' + right + "</span>";

    if (state.tab === "code") {
      if (!readiness.ok) {
        pane.innerHTML = '<div class="out-empty"><div class="ico">' +
          '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<path d="M12 8v5M12 16.5v.5M10.3 3.8L2.5 17.3A2 2 0 004.2 20h15.6a2 2 0 001.7-2.7L13.7 3.8a2 2 0 00-3.4 0z"/></svg></div>' +
          '<div><strong>填写完整后生成可执行代码</strong><br>' + esc(readiness.issues.join("；")) + "</div></div>";
      } else {
        pane.innerHTML = '<div class="code-ready-note">已代入当前参数和凭据，请勿分享生成的代码。</div>' +
          codeBlock(snippet(state.lang), SNIP_LANG[state.lang]);
      }
    } else if (!state.response) {
      pane.innerHTML = '<div class="out-empty"><div class="ico">' +
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M5 19l3.5-1.2 8-8a2.5 2.5 0 10-3.5-3.5l-8 8L5 19z"/></svg></div>' +
        "<div>填好参数后点「发送」查看真实返回<br>也可以切到「请求代码」直接复制</div></div>";
    } else if (state.response.pending) {
      pane.innerHTML = '<div class="out-empty">请求中…<br><span class="note">最多等 ' +
        Math.round(REQUEST_TIMEOUT_MS / 1000) + ' 秒，也可以点「取消」中止</span></div>';
    } else if (state.response.error) {
      pane.innerHTML = codeBlock(state.response.error, "text");
    } else {
      var t = state.response.body || "";
      try { t = JSON.stringify(JSON.parse(t), null, 2); } catch (err) { /* 原样 */ }
      pane.innerHTML = codeBlock(t, "json");
    }

    tabs.querySelectorAll("[data-tab]").forEach(function (n) {
      n.addEventListener("click", function () { state.tab = n.getAttribute("data-tab"); renderOut(); });
    });
    var sel = el("lang-sel");
    if (sel) sel.addEventListener("change", function () { state.lang = sel.value; renderOut(); });
    var statusJump = tabs.querySelector(".status-doc-jump");
    if (statusJump) statusJump.addEventListener("click", function () {
      if (scrollToDocHeading("状态码")) { toast("已定位到正文状态码"); return; }
      go("api_v1/status_code");
    });
    bindCopy(pane);
  }

  // 源码从 store 转交给闭包持有：元素被下一次 innerHTML 覆盖时一起回收，
  // 不会像原来那样把历史代码（含已替换的 Authorization）一直攒在 store 里
  function bindCopy(root) {
    root.querySelectorAll("[data-copy]").forEach(function (n) {
      var id = n.getAttribute("data-copy");
      var src = (codeBlock.store && codeBlock.store[id]) || "";
      if (codeBlock.store) delete codeBlock.store[id];
      n.addEventListener("click", function () { copy(src, "代码"); });
    });
  }

  /* ================= URL 传参生成器 ================= */

  // 这两页讲的是怎么手工拼带签名的表单链接，最容易错的两处交给代码做：
  //   1. 字段 API CODE 必须按字典序升序拼接（和文档里 Java TreeMap / Python sorted 一致），
  //      顺序错了签名就对不上
  //   2. 签名针对「未编码的原始值」计算，最终 URL 里才做 URL 编码
  // sign_secret 只在浏览器里参与计算，不发给任何服务器。
  var URL_TOOLS = {
    "url_params/form_field_url_params": {
      title: "在线生成带签名的表单链接",
      prefix: "field_",
      placeholder: "field_1",
      rowHint: "字段 API CODE 与要传入的值",
      secretHint: "企业密钥 sign_secret（只在本机参与计算，不会发送）",
    },
    "url_params/global_field_url_params": {
      title: "在线生成带 JWT 的表单链接",
      prefix: "gf_",
      placeholder: "gf_1",
      rowHint: "全局字段 API CODE 与要传入的值",
      secretHint: "企业密钥 sign_secret（JWT 必需，只在本机参与计算，不会发送）",
      jwt: true,
    },
  };

  var FORM_BASE = "https://jinshuju.net/f/";
  var utf8 = new TextEncoder();

  function bytesToB64(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function bytesToHex(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i++) out += ("0" + bytes[i].toString(16)).slice(-2);
    return out;
  }
  function b64ToB64Url(s) {
    return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function hmacSha256(secret, message) {
    return crypto.subtle
      .importKey("raw", utf8.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
      .then(function (key) { return crypto.subtle.sign("HMAC", key, utf8.encode(message)); })
      .then(function (sig) { return new Uint8Array(sig); });
  }

  // 文档里三份示例（Java/Python/Ruby）都是：先取 hex 摘要，再对那串 hex 做 Base64
  function signParams(secret, urlParams) {
    return hmacSha256(secret, urlParams).then(function (bytes) {
      return bytesToB64(utf8.encode(bytesToHex(bytes)));
    });
  }

  function jwtHS256(secret, payload) {
    var head = b64ToB64Url(bytesToB64(utf8.encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))));
    var body = b64ToB64Url(bytesToB64(utf8.encode(JSON.stringify(payload))));
    var signing = head + "." + body;
    return hmacSha256(secret, signing).then(function (bytes) {
      return signing + "." + b64ToB64Url(bytesToB64(bytes));
    });
  }

  var UT_LANGS = [
    { id: "shell", label: "Shell", hl: "bash" },
    { id: "python", label: "Python", hl: "python" },
    { id: "node", label: "Node.js", hl: "javascript" },
    { id: "php", label: "PHP", hl: "php" },
    { id: "ruby", label: "Ruby", hl: "ruby" },
  ];

  var ICON_TRASH = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
    'stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M2.5 4.5h11M6 4.5V3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5M4 4.5l.6 8a1 1 0 001 .9h4.8a1 1 0 001-.9l.6-8"/>' +
    '<path d="M6.5 7v4M9.5 7v4"/></svg>';

  /* ---------- 生成代码：都封装成一个可直接搬走的函数 ---------- */

  // 各语言的映射字面量。缩进两级（函数调用实参里），跟模板里的排版对齐
  function mapLiteral(lang, pairs) {
    var wrap = { python: ["{", "}"], node: ["{", "}"], php: ["[", "]"], ruby: ["{", "}"] }[lang];
    if (!wrap) return ""; // shell 直接拼字符串，用不到映射字面量
    if (!pairs.length) return wrap[0] + wrap[1];
    var pad = "  ";
    var body = pairs.map(function (p) {
      switch (lang) {
        case "python": return pad + q(p.key) + ": " + q(p.value) + ",";
        case "node": return pad + p.key + ": " + q(p.value) + ",";
        case "php": return pad + "  " + rq(p.key) + " => " + rq(p.value) + ",";
        case "ruby": return pad + rq(p.key) + " => " + rq(p.value) + ",";
        default: return "";
      }
    }).join("\n").replace(/,$/, "");
    return wrap[0] + "\n" + body + "\n" + (lang === "php" ? "  " : "") + wrap[1];
  }

  function urlSnippet(lang, ctx) {
    var token = ctx.token || "YOUR_FORM_TOKEN";
    var secret = ctx.secret || "YOUR_SIGN_SECRET";
    var pairs = ctx.pairs.length ? ctx.pairs : [{ key: ctx.prefix + "1", value: "" }];
    var map = mapLiteral(lang, pairs);
    var rawParams = pairs.map(function (p) { return p.key + "=" + p.value; }).join("&");
    var encodedParams = pairs.map(function (p) {
      return p.key + "=" + encodeURIComponent(p.value);
    }).join("&");
    var jsonPayload = "{" + pairs.map(function (p) { return q(p.key) + ":" + q(p.value); }).join(",") + "}";

    if (ctx.jwt) {
      switch (lang) {
        case "shell":
          return ["#!/usr/bin/env bash",
            "# 把全局字段打成 JWT（HS256），输出带 cusd 的表单链接。",
            "# 只做签名、不加密——别放私密信息。",
            "",
            "b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }",
            "",
            "build_form_url() {",
            '  local form_token="$1" sign_secret="$2" payload_json="$3"',
            "  local header payload signing signature",
            `  header=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)`,
            `  payload=$(printf '%s' "$payload_json" | b64url)`,
            '  signing="${header}.${payload}"',
            `  signature=$(printf '%s' "$signing" | openssl dgst -sha256 -hmac "$sign_secret" -binary | b64url)`,
            `  printf 'https://jinshuju.net/f/%s?cusd=%s.%s\\n' "$form_token" "$signing" "$signature"`,
            "}",
            "",
            "build_form_url " + shq(token) + " " + shq(secret) + " " + shq(jsonPayload)].join("\n");

        case "python":
          return ["import base64", "import hashlib", "import hmac", "import json", "",
            "",
            "def build_form_url(form_token, sign_secret, fields):",
            '    """把全局字段打成 JWT（HS256），返回带 cusd 的表单链接。',
            "",
            "    只做签名、不加密——别放私密信息。装了 pyjwt 的话，等价于",
            '    jwt.encode(fields, sign_secret, algorithm="HS256")。',
            '    """',
            "    def b64url(raw):",
            '        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()',
            "",
            '    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())',
            '    payload = b64url(json.dumps(fields, separators=(",", ":"), ensure_ascii=False).encode())',
            '    signing = header + "." + payload',
            "    signature = b64url(hmac.new(sign_secret.encode(), signing.encode(), hashlib.sha256).digest())",
            '    return "https://jinshuju.net/f/%s?cusd=%s.%s" % (form_token, signing, signature)',
            "", "",
            "print(build_form_url(" + q(token) + ", " + q(secret) + ", " + map + "))"].join("\n");

        case "node":
          return ['const crypto = require("node:crypto");', "",
            "/**",
            " * 把全局字段打成 JWT（HS256），返回带 cusd 的表单链接。",
            " * 只做签名、不加密——别放私密信息。",
            " */",
            "function buildFormUrl(formToken, signSecret, fields) {",
            '  const b64url = (raw) => Buffer.from(raw).toString("base64url");',
            '  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));',
            "  const payload = b64url(JSON.stringify(fields));",
            "  const signing = `${header}.${payload}`;",
            '  const signature = crypto.createHmac("sha256", signSecret).update(signing).digest("base64url");',
            "  return `https://jinshuju.net/f/${formToken}?cusd=${signing}.${signature}`;",
            "}", "",
            "console.log(buildFormUrl(" + q(token) + ", " + q(secret) + ", " + map + "));"].join("\n");

        case "php":
          return ["<?php", "",
            "/**",
            " * 把全局字段打成 JWT（HS256），返回带 cusd 的表单链接。",
            " * 只做签名、不加密——别放私密信息。",
            " */",
            "function buildFormUrl(string $formToken, string $signSecret, array $fields): string",
            "{",
            "    $b64url = fn (string $raw): string => rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');",
            "    $header = $b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));",
            "    $payload = $b64url(json_encode($fields, JSON_UNESCAPED_UNICODE));",
            "    $signing = $header . '.' . $payload;",
            "    $signature = $b64url(hash_hmac('sha256', $signing, $signSecret, true));",
            "",
            "    return 'https://jinshuju.net/f/' . $formToken . '?cusd=' . $signing . '.' . $signature;",
            "}", "",
            "echo buildFormUrl(" + rq(token) + ", " + rq(secret) + ", " + map + ");"].join("\n");

        case "ruby":
          return ["require 'base64'", "require 'json'", "require 'openssl'", "",
            "# 把全局字段打成 JWT（HS256），返回带 cusd 的表单链接。",
            "# 只做签名、不加密——别放私密信息。",
            "def build_form_url(form_token, sign_secret, fields)",
            "  b64url = ->(raw) { Base64.urlsafe_encode64(raw, padding: false) }",
            "  header = b64url.call(JSON.generate({ alg: 'HS256', typ: 'JWT' }))",
            "  payload = b64url.call(JSON.generate(fields))",
            '  signing = "#{header}.#{payload}"',
            "  signature = b64url.call(OpenSSL::HMAC.digest('sha256', sign_secret, signing))",
            '  "https://jinshuju.net/f/#{form_token}?cusd=#{signing}.#{signature}"',
            "end", "",
            "puts build_form_url(" + rq(token) + ", " + rq(secret) + ", " + map + ")"].join("\n");
      }
      return "";
    }

    switch (lang) {
      case "shell":
        return ["#!/usr/bin/env bash",
          "# 输出带 sign 的表单链接。",
          "#",
          "# raw 和 query 是分开传的，因为签名和链接用的不是同一份内容：",
          "#   raw   —— 按字段 API CODE 升序排列的原始值，用来算签名（不要编码）",
          "#   query —— 同样的字段，但值已做 URL 编码，用来拼链接",
          "# 在 shell 里实现正确的 UTF-8 百分号编码不划算，所以 query 直接给出。",
          "",
          "build_form_url() {",
          '  local form_token="$1" sign_secret="$2" raw="$3" query="$4"',
          "  local digest sign",
          `  digest=$(printf '%s' "$raw" | openssl dgst -sha256 -hmac "$sign_secret" | awk '{print $NF}')`,
          "  # base64 里的 + / = 在 query 里必须转义，否则 + 会被当成空格",
          `  sign=$(printf '%s' "$digest" | base64 | tr -d '\\n' | sed 's/+/%2B/g; s|/|%2F|g; s/=/%3D/g')`,
          `  printf 'https://jinshuju.net/f/%s?%s&sign=%s\\n' "$form_token" "$query" "$sign"`,
          "}", "",
          "build_form_url " + shq(token) + " " + shq(secret) + " " + shq(rawParams) +
            " " + shq(encodedParams)].join("\n");

      case "python":
        return ["import base64", "import hashlib", "import hmac", "from urllib.parse import quote", "",
          "",
          "def build_form_url(form_token, sign_secret, fields):",
          '    """返回带 sign 的表单链接。',
          "",
          "    两个容易踩的点：字段必须按 API CODE 升序拼接，",
          "    且签名针对未编码的原始值——URL 里的值才做转义。",
          '    """',
          "    keys = sorted(fields)",
          '    raw = "&".join("%s=%s" % (k, fields[k]) for k in keys)',
          "    digest = hmac.new(sign_secret.encode(), raw.encode(), hashlib.sha256).hexdigest()",
          "    sign = base64.b64encode(digest.encode()).decode()",
          '    query = "&".join("%s=%s" % (k, quote(str(fields[k]), safe="")) for k in keys)',
          '    return "https://jinshuju.net/f/%s?%s&sign=%s" % (form_token, query, quote(sign, safe=""))',
          "", "",
          "print(build_form_url(" + q(token) + ", " + q(secret) + ", " + map + "))"].join("\n");

      case "node":
        return ['const crypto = require("node:crypto");', "",
          "/**",
          " * 返回带 sign 的表单链接。",
          " * 两个容易踩的点：字段必须按 API CODE 升序拼接，",
          " * 且签名针对未编码的原始值——URL 里的值才做转义。",
          " */",
          "function buildFormUrl(formToken, signSecret, fields) {",
          "  const keys = Object.keys(fields).sort();",
          "  const raw = keys.map((k) => `${k}=${fields[k]}`).join(\"&\");",
          '  const digest = crypto.createHmac("sha256", signSecret).update(raw).digest("hex");',
          '  const sign = Buffer.from(digest).toString("base64");',
          '  const query = keys.map((k) => `${k}=${encodeURIComponent(fields[k])}`).join("&");',
          "  return `https://jinshuju.net/f/${formToken}?${query}&sign=${encodeURIComponent(sign)}`;",
          "}", "",
          "console.log(buildFormUrl(" + q(token) + ", " + q(secret) + ", " + map + "));"].join("\n");

      case "php":
        return ["<?php", "",
          "/**",
          " * 返回带 sign 的表单链接。",
          " * 两个容易踩的点：字段必须按 API CODE 升序拼接，",
          " * 且签名针对未编码的原始值——URL 里的值才做转义。",
          " */",
          "function buildFormUrl(string $formToken, string $signSecret, array $fields): string",
          "{",
          "    ksort($fields);",
          "    $raw = [];",
          "    $query = [];",
          "    foreach ($fields as $key => $value) {",
          "        $raw[] = $key . '=' . $value;",
          "        $query[] = $key . '=' . rawurlencode((string) $value);",
          "    }",
          "    $digest = hash_hmac('sha256', implode('&', $raw), $signSecret);",
          "    $sign = base64_encode($digest);",
          "",
          "    return 'https://jinshuju.net/f/' . $formToken . '?' . implode('&', $query)",
          "        . '&sign=' . rawurlencode($sign);",
          "}", "",
          "echo buildFormUrl(" + rq(token) + ", " + rq(secret) + ", " + map + ");"].join("\n");

      case "ruby":
        return ["require 'base64'", "require 'erb'", "require 'openssl'", "",
          "# 返回带 sign 的表单链接。",
          "# 两个容易踩的点：字段必须按 API CODE 升序拼接，",
          "# 且签名针对未编码的原始值——URL 里的值才做转义。",
          "def build_form_url(form_token, sign_secret, fields)",
          "  sorted = fields.sort.to_h",
          '  raw = sorted.map { |k, v| "#{k}=#{v}" }.join(\'&\')',
          "  digest = OpenSSL::HMAC.hexdigest('sha256', sign_secret, raw)",
          "  sign = Base64.strict_encode64(digest)",
          "  # 用 ERB::Util.url_encode 而不是 encode_www_form_component：后者把空格编成 +",
          '  query = sorted.map { |k, v| "#{k}=#{ERB::Util.url_encode(v.to_s)}" }.join(\'&\')',
          '  "https://jinshuju.net/f/#{form_token}?#{query}&sign=#{ERB::Util.url_encode(sign)}"',
          "end", "",
          "puts build_form_url(" + rq(token) + ", " + rq(secret) + ", " + map + ")"].join("\n");
    }
    return "";
  }

  /* ---------- 面板形态的生成器：结构与「在线调试」一致 ---------- */

  var UT = { cfg: null, rows: [], seq: 0, result: null };

  function renderUrlRunner(cfg) {
    state.toolMode = "url";
    UT.cfg = cfg;
    UT.rows = [{ key: cfg.prefix + "1", value: "" }, { key: cfg.prefix + "2", value: "" }];
    UT.result = null;

    el("runner-req").innerHTML =
      '<span class="verb link">LINK</span>' +
      '<code class="runner-url" id="run-url"></code>';
    el("btn-send").disabled = false;
    el("btn-send").textContent = "复制链接";
    el("btn-send").classList.remove("cancel");
    el("btn-reset").hidden = false;

    el("runner-scroll").innerHTML =
      '<div class="rsec">' +
      '<div class="rrow"><label for="ut-token">form_token<span class="star">*</span></label>' +
      '<input class="ipt" id="ut-token" type="text" autocomplete="off" spellcheck="false" ' +
      'placeholder="表单链接 /f/ 后六位编码"></div>' +
      '<div class="rrow"><label for="ut-secret">sign_secret' +
      (cfg.jwt ? '<span class="star">*</span>' : "") + "</label>" +
      '<input class="ipt" id="ut-secret" type="password" autocomplete="off" placeholder="企业密钥"></div></div>' +
      '<div class="rsec"><div class="rsec-head">' +
      '<span class="rsec-tag">FIELDS</span>' +
      '<span class="rsec-name">' + esc(cfg.rowHint) + "</span>" +
      '<span class="grow"></span>' + paramHelpButtonHtml("如何配置", "配置说明") + "</div>" +
      '<div id="ut-rows"></div>' +
      '<button class="urltool-add" id="ut-add" type="button">+ 添加字段</button>' +
      '<div class="rsec-hint">' + esc(cfg.rowNote) + "</div></div>";

    drawUtRows();
    el("ut-token").addEventListener("input", computeUrlTool);
    el("ut-secret").addEventListener("input", computeUrlTool);
    el("ut-add").addEventListener("click", function () {
      UT.rows.push({ key: UT.cfg.prefix + (UT.rows.length + 1), value: "" });
      drawUtRows(); computeUrlTool();
    });
    el("runner-scroll").querySelectorAll("[data-doc-jump]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var heading = btn.getAttribute("data-doc-jump");
        if (!scrollToDocHeading(heading)) { toast("正文中未找到 " + heading); return; }
        toast("已定位到正文 " + heading);
      });
    });

    computeUrlTool();
  }

  function drawUtRows() {
    var box = el("ut-rows");
    box.innerHTML = UT.rows.map(function (r, i) {
      return '<div class="urltool-row">' +
        '<input class="ipt mono" data-k="' + i + '" value="' + esc(r.key) +
        '" placeholder="' + esc(UT.cfg.placeholder) + '" autocomplete="off" spellcheck="false">' +
        '<input class="ipt" data-v="' + i + '" value="' + esc(r.value) +
        '" placeholder="要传入的值" autocomplete="off">' +
        '<button class="urltool-del" data-del="' + i + '" type="button" title="删除这一行" ' +
        'aria-label="删除这一行">' + ICON_TRASH + "</button></div>";
    }).join("");
    box.querySelectorAll("[data-k]").forEach(function (n) {
      n.addEventListener("input", function () { UT.rows[+n.getAttribute("data-k")].key = n.value; computeUrlTool(); });
    });
    box.querySelectorAll("[data-v]").forEach(function (n) {
      n.addEventListener("input", function () { UT.rows[+n.getAttribute("data-v")].value = n.value; computeUrlTool(); });
    });
    box.querySelectorAll("[data-del]").forEach(function (n) {
      n.addEventListener("click", function () {
        UT.rows.splice(+n.getAttribute("data-del"), 1);
        if (!UT.rows.length) UT.rows.push({ key: UT.cfg.prefix + "1", value: "" });
        drawUtRows(); computeUrlTool();
      });
    });
  }

  // 表单 Token 那栏允许直接粘整条表单链接
  function utToken() {
    var raw = (el("ut-token") || { value: "" }).value.trim();
    var m = raw.match(/\/f\/([^/?#\s]+)/);
    return m ? m[1] : raw.replace(/^https?:\/\/[^/]*\/?/, "");
  }

  function computeUrlTool() {
    var cfg = UT.cfg;
    if (!cfg) return;
    var token = utToken();
    var secret = el("ut-secret").value;
    var filled = UT.rows.filter(function (r) { return r.key.trim(); });
    var mine = ++UT.seq; // 签名是异步算的，只认最后一次输入

    // 升序是签名能对上的前提（与文档示例的 TreeMap / sorted 一致）
    var sorted = filled.slice().sort(function (a, b) {
      return a.key.trim() < b.key.trim() ? -1 : a.key.trim() > b.key.trim() ? 1 : 0;
    });
    var pairs = sorted.map(function (r) { return { key: r.key.trim(), value: r.value }; });
    var reordered = sorted.some(function (r, i) { return r !== filled[i]; });
    var shownToken = token || "YOUR_FORM_TOKEN";

    function done(result) {
      if (mine !== UT.seq) return;
      UT.result = result;
      syncUrl();
      renderOut();
    }

    if (cfg.jwt) {
      var payload = {};
      pairs.forEach(function (p) { payload[p.key] = p.value; });
      if (!pairs.length || !secret) {
        done({ pairs: pairs, payload: payload, reordered: reordered, token: token,
          secret: secret, url: FORM_BASE + shownToken });
        return;
      }
      jwtHS256(secret, payload).then(function (jwt) {
        done({ pairs: pairs, payload: payload, reordered: reordered, token: token, secret: secret,
          jwt: jwt, url: FORM_BASE + shownToken + "?cusd=" + jwt });
      });
      return;
    }

    // 签名针对未编码的原始值；URL 里的值才做转义
    var signBase = pairs.map(function (p) { return p.key + "=" + p.value; }).join("&");
    var query = pairs.map(function (p) { return p.key + "=" + encodeURIComponent(p.value); }).join("&");
    // 值一个都还没填时，别把 ?field_1=&field_2= 这种半截 query 拼进链接
    var anyValue = pairs.some(function (p) { return p.value !== ""; });
    if (!pairs.length || !secret) {
      done({ pairs: pairs, signBase: signBase, reordered: reordered, token: token, secret: secret,
        url: FORM_BASE + shownToken + (anyValue ? "?" + query : "") });
      return;
    }
    signParams(secret, signBase).then(function (sign) {
      done({ pairs: pairs, signBase: signBase, reordered: reordered, token: token, secret: secret,
        sign: sign, url: FORM_BASE + shownToken + "?" + query + "&sign=" + encodeURIComponent(sign) });
    });
  }

  function resetUrlTool() {
    UT.rows = [{ key: UT.cfg.prefix + "1", value: "" }, { key: UT.cfg.prefix + "2", value: "" }];
    el("ut-token").value = "";
    drawUtRows();
    computeUrlTool();
    toast("已清空字段");
  }

  function urlResBlock(label, text, opts) {
    opts = opts || {};
    var id = stashCopy(text);
    return '<div class="urltool-res' + (opts.primary ? " primary" : "") + '">' +
      '<div class="urltool-res-head"><span>' + esc(label) + "</span>" +
      '<button class="urltool-copy" type="button" data-copy="' + id + '">复制</button></div>' +
      // 说明单独一行：跟标题挤在一起会把标题行撑成两行，复制按钮就跟着错位
      (opts.note ? '<div class="urltool-res-note">' + esc(opts.note) + "</div>" : "") +
      '<pre class="urltool-res-body"><code>' + (opts.json ? hlJson(text) : esc(text)) + "</code></pre></div>";
  }

  function renderUrlOut() {
    var tabs = el("out-tabs"), pane = el("out-pane");
    var r = UT.result, cfg = UT.cfg;
    if (!r || !cfg) return;

    var ready = r.pairs.length && (cfg.jwt ? !!r.secret : true);
    tabs.innerHTML =
      '<button class="tab' + (state.tab === "result" ? " on" : "") + '" data-tab="result">生成结果</button>' +
      '<button class="tab' + (state.tab === "code" ? " on" : "") + '" data-tab="code">生成代码</button>' +
      '<span class="right">' +
      (state.tab === "code"
        ? '<select class="lang-select" id="ut-lang">' + UT_LANGS.map(function (l) {
            return '<option value="' + l.id + '"' + (l.id === state.utLang ? " selected" : "") + ">" + l.label + "</option>";
          }).join("") + "</select>"
        : '<span class="pill ' + (ready ? "ok" : "bad") + '">' + (ready ? "已生成" : "待填写") + "</span>") +
      "</span>";

    if (state.tab === "code") {
      var meta = UT_LANGS.filter(function (l) { return l.id === state.utLang; })[0] || UT_LANGS[0];
      pane.innerHTML = '<div class="code-ready-note">已代入当前字段与密钥，请勿分享生成的代码。</div>' +
        codeBlock(urlSnippet(state.utLang, {
          token: r.token, secret: r.secret, pairs: r.pairs, prefix: cfg.prefix, jwt: !!cfg.jwt,
        }), meta.hl);
    } else {
      var parts = [];
      if (!r.pairs.length) {
        parts.push('<div class="urltool-note">填一个字段 API CODE 就能看到生成结果。</div>');
      } else if (cfg.jwt) {
        parts.push(urlResBlock("原始数据", JSON.stringify(r.payload, null, 2), { json: true }));
        if (r.jwt) parts.push(urlResBlock("JWT", r.jwt));
        parts.push(urlResBlock("表单链接", r.url, { primary: true }));
        if (!r.secret) parts.push('<div class="urltool-note">填入 sign_secret 后会生成 JWT。' +
          "JWT 只签名、不加密，别放私密信息。</div>");
      } else {
        parts.push(urlResBlock("签名用的参数串", r.signBase, { note: "按 API CODE 升序，值不编码" }));
        if (r.reordered) {
          parts.push('<div class="urltool-note">你填的顺序不是升序，已自动重排——顺序错了签名就对不上。</div>');
        }
        if (r.sign) parts.push(urlResBlock("sign", r.sign));
        parts.push(urlResBlock(r.sign ? "表单链接" : "表单链接（未签名）", r.url, { primary: true }));
        if (!r.secret) parts.push('<div class="urltool-note">填入 sign_secret 后会追加 sign 参数。</div>');
      }
      if (r.pairs.length && !r.token) {
        parts.push('<div class="urltool-note">填入 form_token 才是可直接打开的链接。</div>');
      }
      pane.innerHTML = parts.join("");
    }

    tabs.querySelectorAll("[data-tab]").forEach(function (n) {
      n.addEventListener("click", function () { state.tab = n.getAttribute("data-tab"); renderOut(); });
    });
    var sel = el("ut-lang");
    if (sel) sel.addEventListener("change", function () { state.utLang = sel.value; renderOut(); });
    bindCopy(pane);
  }

  /* ================= 路由 ================= */

  // 当前地址 → 文档 + 页内锚点。路由取自 pathname（去掉部署基路径），锚点取自 hash。
  function resolve() {
    var raw = location.pathname;
    if (raw.indexOf(SITE) === 0) raw = raw.slice(SITE.length);
    raw = raw.replace(/^\/+/, "").replace(/\/+$/, "");
    // 中文路由在地址栏里是百分号编码的，解码后才能对上 site.json 里的键
    try { raw = decodeURIComponent(raw); } catch (err) { /* 保持原样 */ }
    // 中文标题在 location.hash 里同样是百分号编码的，解码后才能对上元素 id
    var frag = location.hash.replace(/^#/, "");
    try { frag = decodeURIComponent(frag); } catch (err) { /* 保持原样 */ }
    var doc = state.docs[raw];
    if (!doc && raw === "") doc = state.docs[""];
    if (!doc) doc = state.docs[state.order[0]];
    return { doc: doc, frag: frag };
  }

  // 站内跳转：换地址栏 + 重渲染，不刷整页（参数别叫 route，会遮住下面的渲染函数）
  function go(to, frag) {
    var url = SITE + String(to == null ? "" : to).replace(/^\/+/, "") + (frag ? "#" + frag : "");
    if (url === location.pathname + location.hash) return;
    history.pushState(null, "", url);
    route();
  }

  // 早先版本是 hash 路由，站外可能还留着 #/xxx 的老链接，进来先换成真实路径。
  // 用 replace 不留历史记录，浏览器「后退」不会又弹回老地址。
  function redirectLegacyHash() {
    if (location.hash.indexOf("#/") !== 0) return false;
    var rest = location.hash.slice(2), frag = "";
    var hi = rest.indexOf("#");
    if (hi !== -1) { frag = rest.slice(hi + 1); rest = rest.slice(0, hi); }
    location.replace(SITE + rest.replace(/^\/+|\/+$/g, "") + (frag ? "#" + frag : ""));
    return true;
  }

  // 站内链接统一由前端接管，省掉整页刷新；带修饰键、新标签、跨站的一律放给浏览器
  function bindLinks() {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      var u;
      try { u = new URL(a.href, location.href); } catch (err) { return; }
      if (u.origin !== location.origin || u.pathname.indexOf(SITE) !== 0) return;
      // 纯页内锚点交给浏览器和原有的锚点逻辑，别在这儿抢
      if (u.pathname === location.pathname && u.hash) return;
      e.preventDefault();
      history.pushState(null, "", u.pathname + u.hash);
      route();
    });
    window.addEventListener("popstate", route);
  }

  var COPY_PAGE_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
    '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1A1.5 1.5 0 011 9V2.5A1.5 1.5 0 012.5 1H9a1.5 1.5 0 011.5 1.5v1"/></svg>';
  var RUNNER_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
    '<circle cx="8" cy="8" r="6.25"/><path d="M6.5 5.25L10.75 8 6.5 10.75z" fill="currentColor" stroke="none"/></svg>';

  var breadcrumbsHtml = navTree.breadcrumbsHtml; // 与预渲染共用，见 nav.js

  function route() {
    var r = resolve();
    if (!r.doc) return;
    state.current = r.doc;

    md.resetRender(); // 标题去重表、本页总览、代码块原文都属于上一页，留着会串页
    var bodyHtml = renderMarkdown(r.doc.markdown, true);

    // URL 传参这两页讲的是手工拼签名链接，正文末尾接一个生成器
    // URL 传参这两页的生成器放在右侧面板里，跟接口页的「在线调试」同一个形态
    var urlTool = URL_TOOLS[r.doc.route];
    var hasRunner = !!(r.doc.api || urlTool);

    el("doc").innerHTML =
      '<div class="doc-head' + (r.doc.route === "" ? " no-crumbs" : "") + '">' +
      breadcrumbsHtml(r.doc) +
      '<div class="doc-head-actions">' +
      '<button class="btn" data-act="copy-page" title="复制原始 Markdown">' + COPY_PAGE_ICON + '<span>复制页面</span></button>' +
      (hasRunner ? '<button class="btn" data-act="toggle-runner">' + RUNNER_ICON +
        "<span>" + (urlTool ? "生成链接" : "在线调试") + "</span></button>" : "") +
      "</div></div>" +
      '<div class="markdown" id="md">' + bodyHtml + "</div>";

    var layout = el("layout");
    layout.classList.toggle("has-api", hasRunner);
    if (hasRunner) {
      layout.classList.toggle("runner-open", state.runnerOpen);
      if (urlTool) renderUrlRunner(urlTool); else renderRunner();
    } else {
      layout.classList.remove("runner-open");
    }
    if (state.refreshLayout) state.refreshLayout();

    renderToc();
    renderMenu();
    // pageTitle 由 build-data.mjs 定稿，预渲染用的是同一个字段，
    // 所以同一页「直接打开」和「站内点进来」标题一致
    document.title = r.doc.pageTitle || r.doc.title + " | 金数据开放平台";
    // canonical 跟着走，免得 pushState 之后还指着上一页
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", canon.href.replace(/^(https?:\/\/[^/]+)\/.*$/, "$1/") + r.doc.route);

    var main = el("main");
    main.scrollTop = 0;
    if (r.frag) {
      var target = document.getElementById(r.frag);
      if (target) main.scrollTop = target.offsetTop - 16;
    }

    var doc = el("doc");
    bindCopy(doc);
    doc.querySelectorAll("[data-act]").forEach(function (n) {
      n.addEventListener("click", function () {
        var a = n.getAttribute("data-act");
        if (a === "copy-page") copy(r.doc.markdown.replace(/\s+$/, "") + "\n", "Markdown");
        else if (a === "toggle-runner") {
          state.runnerOpen = !layout.classList.contains("runner-open");
          layout.classList.toggle("runner-open", state.runnerOpen);
          if (state.refreshLayout) state.refreshLayout();
        }
      });
    });
  }

  /* ================= 主题 ================= */

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("jsj_theme", t); } catch (e) { /* noop */ }
    el("btn-theme").innerHTML = t === "dark"
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14.5A8.2 8.2 0 019.5 4 8.5 8.5 0 1020 14.5z"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>';
  }

  /* ================= 可调布局 ================= */

  var MAIN_SAFE_WIDTH = 760;

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function initResizers() {
    var root = document.documentElement;
    var runner = document.querySelector(".runner");
    var runnerTop = document.querySelector(".runner-top");
    var runnerOut = document.querySelector(".runner-out");

    function remember(key, value) {
      try { localStorage.setItem(key, String(Math.round(value))); } catch (e) { /* noop */ }
    }

    function recalled(key, fallback) {
      try {
        var value = Number(localStorage.getItem(key));
        return Number.isFinite(value) && value > 0 ? value : fallback;
      } catch (e) { return fallback; }
    }

    function cssNumber(name) {
      return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
    }

    function sidebarBounds() {
      return { min: 220, max: Math.min(420, Math.max(280, window.innerWidth * 0.32)) };
    }

    function runnerDockLimit() {
      var sidebarWidth = window.innerWidth > 1240 ?
        document.querySelector(".sidebar").getBoundingClientRect().width : 0;
      var safeMax = window.innerWidth - sidebarWidth - MAIN_SAFE_WIDTH - 24;
      var defaultWidth = window.innerWidth <= 1560 ? 440 : 480;
      return Math.max(defaultWidth, Math.min(720, safeMax));
    }

    function runnerBounds() {
      var max = Math.min(960, window.innerWidth * 0.68, window.innerWidth - 32);
      return { min: 360, max: Math.max(360, max) };
    }

    function updateRunnerMode(value) {
      var layout = el("layout");
      if (!layout.classList.contains("runner-open") || window.innerWidth <= 820) {
        layout.classList.remove("runner-overlay");
        return;
      }
      var limit = runnerDockLimit();
      if (!layout.classList.contains("runner-overlay") && value > limit + 1) {
        layout.classList.add("runner-overlay");
      } else if (layout.classList.contains("runner-overlay") && value <= limit) {
        layout.classList.remove("runner-overlay");
      }
    }

    function splitBounds() {
      var topHeight = runnerTop ? runnerTop.getBoundingClientRect().height : 50;
      var available = runner ? runner.getBoundingClientRect().height - topHeight - 262 : 520;
      return { min: 180, max: Math.max(180, available) };
    }

    function setValue(handle, property, value, bounds) {
      value = clamp(value, bounds.min, bounds.max);
      root.style.setProperty(property, Math.round(value) + "px");
      handle.setAttribute("aria-valuemin", Math.round(bounds.min));
      handle.setAttribute("aria-valuemax", Math.round(bounds.max));
      handle.setAttribute("aria-valuenow", Math.round(value));
      return value;
    }

    function bind(handle, options) {
      if (!handle) return;

      function current() { return options.measure(); }
      function defaultValue() {
        return typeof options.defaultValue === "function" ? options.defaultValue() : options.defaultValue;
      }
      function apply(value) {
        var bounds = options.bounds();
        value = clamp(value, bounds.min, bounds.max);
        if (options.beforeApply) options.beforeApply(value);
        return setValue(handle, options.property, value, bounds);
      }
      function finish(value) { remember(options.storage, apply(value)); }

      handle.addEventListener("pointerdown", function (ev) {
        if (ev.isPrimary === false) return;
        ev.preventDefault();
        var startPoint = options.axis === "x" ? ev.clientX : ev.clientY;
        var startValue = current();
        var bodyClass = options.axis === "x" ? "resize-col" : "resize-row";
        handle.classList.add("active");
        document.body.classList.add(bodyClass);
        if (handle.setPointerCapture) handle.setPointerCapture(ev.pointerId);

        function move(moveEvent) {
          var point = options.axis === "x" ? moveEvent.clientX : moveEvent.clientY;
          apply(startValue + (point - startPoint) * options.direction);
        }
        function end(endEvent) {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", end);
          window.removeEventListener("pointercancel", end);
          handle.classList.remove("active");
          document.body.classList.remove(bodyClass);
          if (handle.releasePointerCapture && handle.hasPointerCapture(endEvent.pointerId)) {
            handle.releasePointerCapture(endEvent.pointerId);
          }
          finish(current());
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      });

      handle.addEventListener("keydown", function (ev) {
        var physical = 0;
        if (options.axis === "x" && ev.key === "ArrowLeft") physical = -10;
        if (options.axis === "x" && ev.key === "ArrowRight") physical = 10;
        if (options.axis === "y" && ev.key === "ArrowUp") physical = -12;
        if (options.axis === "y" && ev.key === "ArrowDown") physical = 12;
        if (!physical) return;
        ev.preventDefault();
        finish(current() + physical * options.direction);
      });

      handle.addEventListener("dblclick", function () { finish(defaultValue()); });
      apply(recalled(options.storage, defaultValue()));
      options.refresh = function () { apply(cssNumber(options.property) || current()); };
    }

    var configs = [
      {
        handle: el("resize-sidebar"), property: "--sidebar-w", storage: "jsj_sidebar_w",
        axis: "x", direction: 1, defaultValue: 280, bounds: sidebarBounds,
        measure: function () { return document.querySelector(".sidebar").getBoundingClientRect().width; },
      },
      {
        handle: el("resize-runner"), property: "--runner-w", storage: "jsj_runner_w",
        axis: "x", direction: -1,
        defaultValue: function () { return window.innerWidth <= 1560 ? 440 : 480; },
        bounds: runnerBounds,
        beforeApply: updateRunnerMode,
        measure: function () { return runner.getBoundingClientRect().width; },
      },
      {
        handle: el("resize-runner-split"), property: "--runner-out-h", storage: "jsj_runner_out_h",
        axis: "y", direction: -1, defaultValue: 344, bounds: splitBounds,
        measure: function () { return runnerOut.getBoundingClientRect().height; },
      },
    ];

    // 1280 这类窗口上，停靠的调试面板 + 目录 + 总览会把正文压到三百来像素。
    // 正文低于这个宽度就先收起「本页总览」——它是三者里最可让的。
    var MIN_DOC_WIDTH = 520;
    function syncTocVisibility() {
      var layout = el("layout"), main = el("main");
      if (!layout || !main) return;
      var tocWidth = cssNumber("--toc-w") || 210;
      // 浮层模式下 main 是全宽，这里量出来自然就够宽，总览会保留
      var available = main.getBoundingClientRect().width - tocWidth - 44;
      layout.classList.toggle("toc-cramped", available < MIN_DOC_WIDTH);
    }

    configs.forEach(function (config) { bind(config.handle, config); });
    function refreshAll() {
      configs.forEach(function (config) { if (config.refresh) config.refresh(); });
      syncTocVisibility();
    }
    state.refreshLayout = refreshAll;
    refreshAll();
    window.addEventListener("resize", refreshAll);

    // 切页面时 refreshAll 的测量会早于浏览器把新布局算出来，光靠它会漏判；
    // 直接盯正文区的实际宽度，拖面板、缩窗口、换页面都能覆盖。
    // （收起总览不改变 main 的宽度，所以不会自激。）
    if (window.ResizeObserver) {
      new ResizeObserver(syncTocVisibility).observe(el("main"));
    }
  }

  /* ================= 启动 ================= */

  function init() {
    // 老的 #/xxx 链接先换成真实路径，页面会重新加载，后面的初始化就不必做了
    if (redirectLegacyHash()) return;

    var th = "light";
    try { th = localStorage.getItem("jsj_theme") || "light"; } catch (e) { /* noop */ }
    applyTheme(th);
    initResizers();
    el("btn-theme").addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    // 顶部栏的按钮是静态的，只绑一次；renderRunner 只改它们的状态
    el("btn-send").addEventListener("click", send);
    el("btn-reset").addEventListener("click", resetRunner);
    el("btn-close-runner").addEventListener("click", function () {
      state.runnerOpen = false;
      el("layout").classList.remove("runner-open", "runner-overlay");
      if (state.refreshLayout) state.refreshLayout();
    });
    el("runner-backdrop").addEventListener("click", function () {
      state.runnerOpen = false;
      el("layout").classList.remove("runner-open", "runner-overlay");
      if (state.refreshLayout) state.refreshLayout();
    });

    var search = el("search");
    search.addEventListener("input", function () { state.filter = search.value; renderMenu(); });
    document.addEventListener("keydown", function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") { ev.preventDefault(); search.focus(); search.select(); }
      if (ev.key === "Escape") {
        if (document.activeElement === search) {
          search.value = ""; state.filter = ""; renderMenu(); search.blur();
        } else if (state.closeFullEditor) {
          state.closeFullEditor(); // 全屏 JSON 编辑器；不在全屏时它自己会忽略
        }
      }
    });

    // 点全屏遮罩空白处关闭：只在这里注册一次，编辑器重建时不重复挂
    el("modal-root").addEventListener("mousedown", function (ev) {
      if (ev.target === ev.currentTarget && state.closeFullEditor) state.closeFullEditor();
    });

    // API 凭据和 sign_secret 一律不落盘：刷新、重开都要求重填。
    // 这里顺手清掉早先版本写进 sessionStorage 的那份，免得老用户浏览器里一直留着。
    try { sessionStorage.removeItem("jsj_creds"); } catch (e) { /* noop */ }

    el("main").addEventListener("scroll", function () {
      if (spyToc.raf) return;
      spyToc.raf = requestAnimationFrame(function () { spyToc.raf = null; spyToc(); });
    });

    bindLinks();

    fetch(SITE + "data.json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.nav = d.nav || [];
        state.docs = d.docs || {};
        state.order = [];
        eachDoc(state.nav, function (it) { state.order.push(it.route); });
        route();
      })
      .catch(function (err) {
        el("doc").innerHTML = '<div class="markdown"><p>文档数据加载失败：' + esc(String(err)) + "</p></div>";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
