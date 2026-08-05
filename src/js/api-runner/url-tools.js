/**
 * URL 传参那两页的链接生成器。
 *
 * 这两页讲的是手工拼带签名的表单链接，右侧面板不是「在线调试」而是生成器：
 * 主按钮是「复制链接」，不发任何请求。
 *   form_field_url_params  → 带 sign 的链接（HMAC-SHA256 → hex → Base64）
 *   global_field_url_params → 带 cusd 的链接（JWT HS256）
 *
 * 算法原样来自独立站那版，那边有一组测试拿它对着 Python 的独立实现逐字节比对过、
 * 生成的 JWT 也用 pyjwt 反向验过，所以这里一个字节都不改。
 *
 * 全部在浏览器里用 Web Crypto 计算：sign_secret 不发给任何服务器、也不落盘。
 *
 * 字段会自动按 API CODE 字典序升序重排——顺序错了签名就对不上，
 * 所以界面上把参与签名的参数串显示出来，方便和自己的实现对照。
 */

import { el, esc, codeBlock, copy, toast, hlJson, stashCopy } from "./helpers.js";
import {
  state, registerUrlTools,
  // 面板下半部分的重绘、正文跳转按钮、几个字符串转义——与在线调试面板共用
  renderOut, bindCopy, syncUrl, paramHelpButtonHtml, q, shq, rq,
} from "./runner.js";

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
      '<code class="runner-url" id="jsj-run-url"></code>';
    el("btn-send").disabled = false;
    el("btn-send").textContent = "复制链接";
    el("btn-send").classList.remove("cancel");
    el("btn-reset").hidden = false;

    el("runner-scroll").innerHTML =
      '<div class="rsec">' +
      '<div class="rrow"><label for="ut-token">form_token<span class="star">*</span></label>' +
      '<input class="ipt" id="jsj-ut-token" type="text" autocomplete="off" spellcheck="false" ' +
      'placeholder="表单链接 /f/ 后六位编码"></div>' +
      '<div class="rrow"><label for="ut-secret">sign_secret' +
      (cfg.jwt ? '<span class="star">*</span>' : "") + "</label>" +
      '<input class="ipt" id="jsj-ut-secret" type="password" autocomplete="off" placeholder="企业密钥"></div></div>' +
      '<div class="rsec"><div class="rsec-head">' +
      '<span class="rsec-tag">FIELDS</span>' +
      '<span class="rsec-name">' + esc(cfg.rowHint) + "</span>" +
      '<span class="grow"></span>' + paramHelpButtonHtml("如何配置", "配置说明") + "</div>" +
      '<div id="jsj-ut-rows"></div>' +
      '<button class="urltool-add" id="jsj-ut-add" type="button">+ 添加字段</button>' +
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
        ? '<select class="lang-select" id="jsj-ut-lang">' + UT_LANGS.map(function (l) {
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


// runner.js 里那几个 state.toolMode === "url" 的分支通过这里拿到本模块的能力。
// 用注册而不是让 runner.js 直接 import 本模块，避免两个模块互相引用。
registerUrlTools({
  resetUrlTool: resetUrlTool,
  renderUrlOut: renderUrlOut,
  result: function () { return UT.result; },
  formBase: FORM_BASE,
});

export { URL_TOOLS, renderUrlRunner };
