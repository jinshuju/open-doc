/**
 * 在线调试面板 —— 逻辑原样来自独立站那版（archive/static-render-layer 的
 * site/public/app.js），只换了三处接缝：
 *
 *   1. api()               原来读构建时生成的 site.json，现在读 parse.js 从页面 DOM
 *                          解析出来的结果（由 index.js 通过 setApi 注入）
 *   2. scrollToDocHeading  原来查自己维护的 tocItems 并滚动 .main，
 *                          现在按标题文字在 .theme-doc-markdown 里找，滚 window
 *                          （见 helpers.js）
 *   3. gotoDoc             原来走自己的 hash 路由，现在交给 Docusaurus 的路由
 *
 * 其余——怎么拼 Basic 认证、怎么生成八种语言的可运行片段、JSON 怎么按行列报错、
 * 请求怎么超时和取消——都是纯逻辑，和谁拥有页面无关，一行没动。
 *
 * 凭据只留在这个模块的内存里：不写 localStorage / sessionStorage，
 * 刷新或重新打开都要重填，也不经过任何第三方服务器。
 */

import { el, esc, unesc2, hlJson, hlGeneric, codeBlock, stashCopy, toast, copy, scrollToDocHeading } from "./helpers.js";

const API_BASE = "https://jinshuju.net";
// 留空 = 浏览器直连（默认）。金数据 API 自己开了 CORS，所以不需要任何服务端。
const PROXY_URL = (typeof window !== "undefined" && window.__JSJ_PROXY_URL__) || "";
const REQUEST_TIMEOUT_MS = 15000;

const LANGS = [
  { id: "curl", label: "cURL" },
  { id: "js", label: "JavaScript" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "ruby", label: "Ruby" },
  { id: "java", label: "Java" },
  { id: "go", label: "Go" },
];

const state = {
  creds: { key: "", secret: "" },
  tab: "result",
  lang: "curl",
  response: null,
  sending: false,
  abort: null,
  closeFullEditor: null,
};

// 当前这一页的接口信息，由 index.js 在每次路由变化后注入
let currentApi = null;
export function setApi(a) { currentApi = a; }
export { state };

function api() { return currentApi; }

// URL 传参页的生成器由 url-tools.js 注册进来。用注册而不是直接 import，
// 避免两个模块互相引用（它要用这里的 state 和面板元素）。
let urlTools = null;
export function registerUrlTools(t) { urlTools = t; }

// 站内跳转交给 Docusaurus 的路由，别整页刷新
function gotoDoc(path) {
  const link = document.querySelector('a.menu__link[href="' + path + '"], a[href="' + path + '"]');
  if (link) { link.click(); return; }
  window.location.assign(path);
}

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
        ? '<select class="runner-verb-sel verb ' + a.method.toLowerCase() + '" id="jsj-in-method" ' +
          'title="该接口支持多种方法">' +
          methods.map(function (m) { return '<option value="' + m + '">' + m + "</option>"; }).join("") +
          "</select>"
        : '<span class="verb ' + a.method.toLowerCase() + '">' + esc(a.method) + "</span>") +
      '<code class="runner-url" id="jsj-run-url">' + esc(API_BASE + a.path) + "</code>";
    el("btn-send").disabled = !canRun;
    el("btn-send").textContent = "发送请求";
    el("btn-send").classList.remove("cancel");
    el("btn-reset").hidden = !canRun;

    var html = "";

    html += '<div class="rsec"><div class="rsec-head">' +
      '<span class="rsec-tag">AUTH</span><span class="rsec-name">Basic 认证</span></div>' +
      '<div class="rrow"><label for="in-key">API_KEY<span class="star">*</span></label>' +
      '<input class="ipt" id="jsj-in-key" type="text" autocomplete="off" placeholder="你的 API Key"></div>' +
      '<div class="rrow"><label for="in-secret">API_SECRET<span class="star">*</span></label>' +
      '<input class="ipt" id="jsj-in-secret" type="password" autocomplete="off" placeholder="你的 API Secret"></div>' +
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
        '<span class="jsed-status" id="jsj-jsed-status"></span>' +
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
    if (state.toolMode === "url") return urlTools.resetUrlTool();
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
      u.textContent = urlTools.result() ? urlTools.result().url : urlTools.formBase;
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
    return '<div class="jsed" id="jsj-jsed">' +
      '<div class="jsed-bar">' +
      '<span class="jsed-name">JSON</span>' +
      '<span class="grow"></span>' +
      '<button class="rtool" id="jsj-jsed-fmt" type="button" title="按 2 空格缩进重新格式化">格式化</button>' +
      '<button class="rtool rtool-icon" id="jsj-jsed-full" type="button"></button>' +
      (withParamHelp ? paramHelpButtonHtml() : "") +
      "</div>" +
      '<div class="jsed-body">' +
      '<div class="jsed-gutter" id="jsj-jsed-gutter"></div>' +
      '<div class="jsed-code">' +
      '<pre class="jsed-hl" id="jsj-jsed-hl" aria-hidden="true"><code></code></pre>' +
      '<textarea class="jsed-input" id="jsj-in-body" spellcheck="false" wrap="off"' +
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
      if (urlTools.result()) copy(urlTools.result().url, "链接");
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
    if (state.toolMode === "url") return urlTools.renderUrlOut();
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
        '<select class="lang-select" id="jsj-lang-sel">' + LANGS.map(function (l) {
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
      gotoDoc("/api_v1/status_code");
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


export { renderRunner, resetRunner, renderOut, send, cancelSend, bindCopy, requestReadiness, syncUrl, initJsonEditor };
// url-tools.js 复用这几个：正文跳转按钮、字符串转义、以及面板下半部分的重绘
export { paramHelpButtonHtml, q, shq, rq };
