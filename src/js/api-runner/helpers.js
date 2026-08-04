/**
 * 面板用到的小工具：转义、JSON / 通用代码高亮、代码块、toast、复制。
 *
 * 都是纯字符串处理，和「谁拥有页面」无关，所以从独立站那版原样搬过来即可。
 *
 * el() 统一加 jsj- 前缀：面板是插进 Docusaurus 页面里的，元素 id 必须自带命名空间，
 * 否则可能和主题或正文锚点撞车。加了前缀之后，面板逻辑里写的还是 el("in-key")，
 * 一行都不用改。
 */

export const el = (id) => document.getElementById("jsj-" + id);

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function unesc2(s) {
  return s.replace(/&amp;(lt|gt|amp|quot|#\d+);/g, "&$1;");
}

export function hlJson(src) {
  let out = "", last = 0, m;
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],])/g;
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

export function hlGeneric(src) {
  let out = "", last = 0, m;
  const re = /(#[^\n]*|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b(?:GET|POST|PUT|PATCH|DELETE)\b)|(\b\d+\b)/g;
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

const LANG_LABEL = {
  json: "json", bash: "bash", shell: "bash", sh: "bash", text: "text", http: "http",
  python: "python", ruby: "ruby", java: "java", javascript: "javascript", js: "javascript",
  php: "php", go: "go", jsonc: "jsonc", yaml: "yaml", ts: "typescript", csharp: "csharp",
};

// 复制按钮拿的是原文，不是高亮后的 HTML；bindCopy 取走后就从 store 删掉
export function stashCopy(src) {
  const id = "cb" + (codeBlock._n = (codeBlock._n || 0) + 1);
  codeBlock.store = codeBlock.store || {};
  codeBlock.store[id] = src;
  return id;
}

export function codeBlock(src, lang, opts) {
  opts = opts || {};
  src = String(src == null ? "" : src).replace(/\s+$/, "");
  const isJson = lang === "json" || lang === "jsonc" || (!lang && /^\s*[[{]/.test(src));
  const body = isJson ? hlJson(src) : hlGeneric(src);
  const label = LANG_LABEL[lang] || lang || "text";
  const id = stashCopy(src);
  return '<div class="code-block">' +
    '<div class="code-block-head"><span>' + esc(label) + '</span><span class="grow"></span>' +
    (opts.noCopy ? "" : '<button class="mini" data-copy="' + id + '">复制</button>') +
    "</div><pre><code>" + body + "</code></pre></div>";
}

let toastTimer;
export function toast(msg) {
  let t = document.getElementById("jsj-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "jsj-toast";
    t.className = "jsj-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1700);
}

export function copy(text, label) {
  navigator.clipboard.writeText(text).then(
    () => toast((label || "内容") + "已复制"),
    () => toast("复制失败")
  );
}

/**
 * 滚到正文里某个标题。
 *
 * 独立站那版是查自己维护的 tocItems、再滚动 .main 容器；这里正文是 Docusaurus 的，
 * 滚动容器是 window，所以按标题文字在 .theme-doc-markdown 里现找。
 * 标题文字末尾带一个零宽空格（锚点链接留下的），比较前要去掉。
 */
export function scrollToDocHeading(name) {
  const root = document.querySelector(".theme-doc-markdown");
  if (!root) return false;
  const want = String(name).trim().toLowerCase();
  const target = Array.from(root.querySelectorAll("h1, h2, h3, h4")).find(
    (h) => h.textContent.replace(/\u200b/g, "").trim().toLowerCase() === want
  );
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
