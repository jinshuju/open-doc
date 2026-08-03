/* 正文渲染 —— 浏览器与构建脚本共用的纯字符串逻辑。
 *
 * 抽出来的原因：构建时要为 51 个路由各预渲染一份带正文的 HTML（保住深链和 SEO），
 * 那就必须在 Node 里跑同一套 markdown 渲染，不能让浏览器和构建各写一份。
 * 这里面没有任何 DOM 依赖，输入输出都是字符串。
 *
 *   const md = createMarkdown({ site: "/", assetBase: "/", state });
 *   md.renderMarkdown(doc.markdown, true);
 *
 * site      站点基地址，以 / 结尾；正文里的站内链接拼在它后面
 * assetBase 静态资源基地址（图片可能在 CDN 上，不一定等于 site）
 * state     至少要有 state.docs，用来校验站内链接的目标路由是否存在
 */

export function createMarkdown(opts) {
  var SITE = opts.site || "/";
  var ASSET_BASE = opts.assetBase || SITE;
  var state = opts.state || { docs: {} };

  /* ================= 工具 ================= */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function unesc2(s) { return s.replace(/&amp;(lt|gt|amp|quot|#\d+);/g, "&$1;"); }

  /* ================= 语法高亮 ================= */

  function hlJson(src) {
    var out = "", last = 0, m;
    var re = /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],])/g;
    while ((m = re.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      if (m[1] !== undefined) {
        out += m[2] ? '<span class="tok-key">' + esc(m[1]) + "</span>" + esc(m[2])
                    : '<span class="tok-str">' + esc(m[1]) + "</span>";
      } else if (m[3] !== undefined) out += '<span class="tok-bool">' + esc(m[3]) + "</span>";
      else if (m[4] !== undefined) out += '<span class="tok-num">' + esc(m[4]) + "</span>";
      else out += '<span class="tok-punc">' + esc(m[5]) + "</span>";
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  function hlGeneric(src) {
    var out = "", last = 0, m;
    var re = /(#[^\n]*|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b(?:GET|POST|PUT|PATCH|DELETE)\b)|(\b\d+\b)/g;
    while ((m = re.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      if (m[1] !== undefined) out += '<span class="tok-cmt">' + esc(m[1]) + "</span>";
      else if (m[2] !== undefined) out += '<span class="tok-str">' + esc(m[2]) + "</span>";
      else if (m[3] !== undefined) out += '<span class="tok-bool">' + esc(m[3]) + "</span>";
      else out += '<span class="tok-num">' + esc(m[4]) + "</span>";
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  var LANG_LABEL = {
    json: "json", bash: "bash", shell: "bash", sh: "bash", text: "text", http: "http",
    python: "python", ruby: "ruby", java: "java", javascript: "javascript", js: "javascript",
    php: "php", go: "go", jsonc: "jsonc", yaml: "yaml", ts: "typescript", csharp: "csharp",
  };

  // 复制按钮拿的是原文，不是高亮后的 HTML；bindCopy 取走后就从 store 删掉
  function stashCopy(src) {
    var id = "cb" + (codeBlock._n = (codeBlock._n || 0) + 1);
    codeBlock.store = codeBlock.store || {};
    codeBlock.store[id] = src;
    return id;
  }

  function codeBlock(src, lang, opts) {
    opts = opts || {};
    src = String(src == null ? "" : src).replace(/\s+$/, "");
    var isJson = lang === "json" || lang === "jsonc" || (!lang && /^\s*[[{]/.test(src));
    var body = isJson ? hlJson(src) : hlGeneric(src);
    var label = LANG_LABEL[lang] || lang || "text";
    var id = stashCopy(src);
    return '<div class="code-block">' +
      '<div class="code-block-head"><span>' + esc(label) + '</span><span class="grow"></span>' +
      (opts.noCopy ? "" : '<button class="mini" data-copy="' + id + '">复制</button>') +
      "</div><pre><code>" + body + "</code></pre></div>";
  }

  /* ================= 链接 / 图片地址 ================= */

  // 正文经过 esc()，地址里可能残留 &#58; 这类实体；浏览器读属性时会解码，
  // 所以协议判断必须先解码，否则 `javascript&#58;` 能绕过白名单。
  var NAMED_ENTITY = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
  function decodeEntities(s) {
    return String(s).replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|(lt|gt|amp|quot|apos));/g,
      function (_, dec, hex, name) {
        if (dec) return String.fromCharCode(+dec);
        if (hex) return String.fromCharCode(parseInt(hex, 16));
        return NAMED_ENTITY[name] || "";
      });
  }

  function protocolOf(url) {
    var s = decodeEntities(url).replace(/[\u0000-\u0020]/g, "").toLowerCase();
    var m = s.match(/^([a-z][a-z0-9+.\-]*):/);
    return m ? m[1] : "";
  }

  var LINK_PROTOCOLS = { http: 1, https: 1, mailto: 1, tel: 1 };
  var RESOURCE_EXT = /\.(png|jpe?g|gif|svg|webp|pdf|zip|csv|xlsx?|docx?)$/i;

  // 站内路径按「站点根」解析（open-doc 里就是根相对写法），再拼上部署子路径。
  function stripBase(path) {
    return path.replace(/^(?:\.{1,2}\/)+/, "").replace(/^\/+/, "");
  }

  // 构建时 index/overview 会折叠到目录本身（url_params/overview → url_params），
  // 但正文里还按原文件名写链接，这里兜一下，免得落到不存在的路由
  function resolveRoute(route) {
    var docs = state.docs || {};
    if (docs[route] !== undefined) return route;
    var folded = route.replace(/\/(overview|index|readme)$/i, "");
    if (folded !== route && docs[folded] !== undefined) return folded;
    return route;
  }

  // 站内文档链接落到真实路径（SITE + 路由），与原站 URL 一字不差，
  // 这样站外深链、搜索收录和「复制地址」都还是原来那套地址。
  function internalHref(href) {
    var raw = decodeEntities(href);
    var frag = "";
    var qi = raw.indexOf("?");
    if (qi !== -1) {
      var id = raw.slice(qi + 1).match(/(?:^|&)id=([^&]*)/); // docsify 风格的 ?id=锚点
      if (id) frag = id[1];
      raw = raw.slice(0, qi);
    }
    var hi = raw.indexOf("#");
    if (hi !== -1) {
      if (!frag) frag = raw.slice(hi + 1);
      raw = raw.slice(0, hi);
    }
    var path = stripBase(raw);
    if (!path) return frag ? "#" + frag : SITE;
    // 图片、附件之类的静态资源：拼资源基地址，别当路由
    if (RESOURCE_EXT.test(path)) return ASSET_BASE + path;
    var route = resolveRoute(path.replace(/\.md$/i, "").replace(/\/$/, ""));
    return SITE + route + (frag ? "#" + frag : "");
  }

  // 返回 null 表示协议不在白名单，调用方退化成纯文本
  function safeLinkHref(href) {
    var proto = protocolOf(href);
    if (!proto) {
      var raw = decodeEntities(href);
      if (raw.charAt(0) === "#") return raw; // 页内锚点
      return internalHref(href);
    }
    return LINK_PROTOCOLS[proto] ? decodeEntities(href) : null;
  }

  function safeImgSrc(src) {
    var raw = decodeEntities(src);
    var proto = protocolOf(src);
    if (!proto) {
      var path = stripBase(raw);
      return path ? ASSET_BASE + path : null;
    }
    if (proto === "http" || proto === "https") return raw;
    if (proto === "data" && /^data:image\//i.test(raw.trim())) return raw;
    return null;
  }

  /* ================= Markdown ================= */

  function inlineMd(s) {
    var out = unesc2(esc(s));
    var codes = [];
    out = out.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return "\u0000" + (codes.length - 1) + "\u0000";
    });
    out = out
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (_, alt, src) {
        var safeSrc = safeImgSrc(src);
        if (!safeSrc) return alt;
        return '<img src="' + esc(safeSrc) + '" alt="' + alt + '" loading="lazy">';
      })
      .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, function (_, a, b) { return "<strong>" + (a || b) + "</strong>"; })
      .replace(/\\([\\`*_{}\[\]()#+\-.!|])/g, "$1")
      .replace(/\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (_, txt, href) {
        var safeHref = safeLinkHref(href);
        if (safeHref === null) return txt; // 协议不在白名单：只留文字，不生成链接
        var ext = /^https?:/i.test(safeHref);
        return '<a href="' + esc(safeHref) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + txt + "</a>";
      });
    out = out.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return "<code>" + unesc2(esc(codes[+i])) + "</code>";
    });
    return out;
  }

  var slugSeen = {};
  function slugify(text) {
    var base = text.toLowerCase().trim()
      .replace(/<[^>]*>/g, "")
      .replace(/[\s]+/g, "-")
      .replace(/[^\w\u4e00-\u9fa5-]/g, "");
    base = base || "section";
    if (slugSeen[base] === undefined) { slugSeen[base] = 0; return base; }
    slugSeen[base]++;
    return base + "-" + slugSeen[base];
  }

  // 渲染时顺带收集 h2/h3 供「本页总览」使用。
  // 数组身份保持不变（只清空不重建），调用方可以一直拿着同一个引用。
  var tocItems = [];

  // 换页前调用：标题去重表、总览、代码块原文都属于上一页，留着会串页
  function resetRender() {
    slugSeen = {};
    tocItems.length = 0;
    codeBlock.store = {};
  }

  function renderMarkdown(md, topLevel) {
    var lines = String(md || "").split("\n");
    var out = [], i = 0;

    while (i < lines.length) {
      var line = lines[i];

      var fence = line.match(/^\s*```(\S*)\s*$/);
      if (fence) {
        var lang = fence[1] || "", buf = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push(codeBlock(buf.join("\n").replace(/[ \t]+$/gm, ""), lang));
        continue;
      }

      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:\-|]+\|\s*$/.test(lines[i + 1])) {
        var cut = function (l) {
          var t = l.trim().replace(/^\|/, "").replace(/\|$/, "");
          var parts = [], cur = "";
          for (var k = 0; k < t.length; k++) {
            if (t[k] === "\\" && t[k + 1] === "|") { cur += "|"; k++; }
            else if (t[k] === "|") { parts.push(cur); cur = ""; }
            else cur += t[k];
          }
          parts.push(cur);
          return parts.map(function (x) { return x.trim(); });
        };
        var head = cut(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cut(lines[i])); i++; }
        out.push('<div class="table-wrap"><table><thead><tr>' +
          head.map(function (c) { return "<th>" + inlineMd(c) + "</th>"; }).join("") +
          "</tr></thead><tbody>" +
          rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inlineMd(c) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>");
        continue;
      }

      var hd = line.match(/^(#{1,6})\s+(.*)$/);
      if (hd) {
        var lv = Math.min(hd[1].length, 4);
        var txt = inlineMd(hd[2].trim());
        if (topLevel && (lv === 2 || lv === 3)) {
          var id = slugify(hd[2].trim());
          tocItems.push({ level: lv, id: id, text: hd[2].trim().replace(/[`*_]/g, "") });
          out.push("<h" + lv + ' id="' + id + '">' + txt + "</h" + lv + ">");
        } else {
          out.push("<h" + lv + ">" + txt + "</h" + lv + ">");
        }
        i++;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        out.push("<blockquote>" + renderMarkdown(q.join("\n"), false) + "</blockquote>");
        continue;
      }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

      if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        var ordered = /^\s*\d+\./.test(line);
        var items = [], baseIndent = line.match(/^\s*/)[0].length;
        while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
          var ind = lines[i].match(/^\s*/)[0].length;
          var t2 = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, "");
          if (ind > baseIndent && items.length) {
            var host = items[items.length - 1];
            host.sub = host.sub || [];
            host.sub.push(t2);
          } else items.push({ txt: t2, sub: null });
          i++;
          while (i < lines.length && lines[i].trim() !== "" &&
                 !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) && !/^\s*(#|```|\||>)/.test(lines[i]) &&
                 lines[i].match(/^\s*/)[0].length > baseIndent) {
            items[items.length - 1].txt += " " + lines[i].trim();
            i++;
          }
        }
        var tag = ordered ? "ol" : "ul";
        out.push("<" + tag + ">" + items.map(function (it) {
          return "<li>" + inlineMd(it.txt) +
            (it.sub ? "<ul>" + it.sub.map(function (s) { return "<li>" + inlineMd(s) + "</li>"; }).join("") + "</ul>" : "") +
            "</li>";
        }).join("") + "</" + tag + ">");
        continue;
      }

      if (line.trim() === "") { i++; continue; }

      var p = [];
      while (i < lines.length && lines[i].trim() !== "" &&
             !/^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>|\||```|-{3,}$)/.test(lines[i])) {
        p.push(lines[i]); i++;
      }
      var html = inlineMd(p.join(" "));
      // 独立成段的图片不要包在 <p> 里
      out.push(/^<img[^>]*>$/.test(html) ? '<p class="img-only">' + html + "</p>" : "<p>" + html + "</p>");
    }
    return out.join("\n");
  }

  return {
    esc: esc,
    unesc2: unesc2,
    hlJson: hlJson,
    hlGeneric: hlGeneric,
    codeBlock: codeBlock,
    stashCopy: stashCopy,
    safeLinkHref: safeLinkHref,
    safeImgSrc: safeImgSrc,
    inlineMd: inlineMd,
    slugify: slugify,
    renderMarkdown: renderMarkdown,
    resetRender: resetRender,
    tocItems: tocItems,
  };
}
