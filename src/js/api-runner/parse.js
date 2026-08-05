/**
 * 从「已经渲染出来的页面」里读出接口信息。
 *
 * 刻意不去解析 docs/ 下的 .md 源码，也不在构建时预生成任何元数据：读的就是读者眼前
 * 这一页的 DOM。于是不存在「文档一份、调试工具一份」两份真相要同步的问题——
 * 改了 .md，页面变了，这里读到的自然就是新的；新增接口也不需要任何登记。
 *
 * 认不出来就返回 null，调用方什么都不注入，页面和原来一模一样。
 *
 * 依赖的 DOM 结构（都是 Docusaurus 的稳定 theme 类，不碰 codeBlockContainer_xxxx
 * 这类带构建哈希的类名）：
 *
 *   .theme-doc-markdown        正文容器
 *   h3#request                 「### Request」渲染出来的锚点
 *   .theme-code-block          代码块
 *   table                      紧随代码块的参数表
 */

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const HEADING = /^H[1-6]$/;

/**
 * 取代码块里的源码文本。
 *
 * 必须逐行取：Docusaurio 把每一行渲染成 <span class="token-line">…<br></span>，
 * HTML 里没有任何真正的换行符，所以 pre.textContent 会把
 * 「PATCH/POST/PUT https://…/entries/SERIAL_NUMBER」和紧跟的 JSON body 粘成一行，
 * 请求行就再也解析不出来了。
 */
function codeText(block) {
  const lines = block.querySelectorAll(".token-line");
  if (lines.length) return Array.from(lines, (l) => l.textContent).join("\n");
  const pre = block.querySelector("pre");
  return pre ? pre.textContent : "";
}

// 从某个元素往后找兄弟节点，遇到下一个标题就停——免得把下一节的代码块或表格也算进来
function nextUntilHeading(from, match) {
  for (let el = from.nextElementSibling; el && !HEADING.test(el.tagName); el = el.nextElementSibling) {
    if (match(el)) return el;
  }
  return null;
}

const isCodeBlock = (el) => el.classList && el.classList.contains("theme-code-block");
const isTable = (el) => el.tagName === "TABLE";

// 从一段文本里取出第一个配平且能被 JSON.parse 的对象/数组
function firstJson(text) {
  for (let i = 0; i < text.length; i++) {
    const open = text[i];
    if (open !== "{" && open !== "[") continue;
    const close = open === "{" ? "}" : "]";
    let depth = 0, inStr = false, escaped = false;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (inStr) {
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(i, j + 1);
          try { JSON.parse(candidate); return candidate; } catch { break; }
        }
      }
    }
  }
  return null;
}

// 参数表 → [{name, type, required, desc}]
function paramsFromTable(table) {
  if (!table) return [];
  const head = Array.from(table.querySelectorAll("thead th"), (th) => th.textContent.trim());
  const iName = head.findIndex((h) => /参数名称|字段|属性名/.test(h));
  if (iName === -1) return [];
  const iReq = head.findIndex((h) => /是否必须|必填/.test(h));
  const iType = head.findIndex((h) => /^类型$/.test(h));
  const iDesc = head.findIndex((h) => /说明|描述/.test(h));

  const out = [];
  for (const tr of table.querySelectorAll("tbody tr")) {
    const td = tr.querySelectorAll("td");
    if (!td.length) continue;
    const cell = (i) => (i >= 0 && td[i] ? td[i].textContent.trim() : "");
    const name = cell(iName).replace(/`/g, "");
    if (!name || /^-+$/.test(name)) continue;
    out.push({
      name,
      type: cell(iType).replace(/`/g, ""),
      required: iReq >= 0 ? /是|✔|必/.test(cell(iReq)) : false,
      desc: cell(iDesc),
    });
  }
  return out;
}

export function parseApi(root) {
  if (!root) return null;

  // 「### Request」的锚点。Docusaurus 由标题文字生成 id，英文 Request → "request"；
  // 万一以后标题写法变了，退回按文字找一次。
  let heading = root.querySelector("h3#request, h2#request");
  if (!heading) {
    heading = Array.from(root.querySelectorAll("h2, h3")).find(
      (h) => h.textContent.replace(/​/g, "").trim().toLowerCase() === "request"
    );
  }
  if (!heading) return null;

  const block = nextUntilHeading(heading, isCodeBlock);
  if (!block) return null;

  const code = codeText(block);
  if (!code.trim()) return null;

  // 请求行形如：POST https://jinshuju.net/api/v1/forms/FORM_TOKEN/copy
  // 也可能一行写多个方法：PATCH/POST/PUT https://…
  const VERBS = `(?:${METHODS.join("|")})`;
  const reqLine = new RegExp(`^\\s*(${VERBS}(?:/${VERBS})*)\\s+(?:https?://[^/\\s]+)?(/\\S*)`);
  const lines = code.split(/\r?\n/);

  let method = null, urlPath = null;
  const allMethods = [];
  for (const line of lines) {
    const m = line.match(reqLine);
    if (!m) continue;
    for (const v of m[1].split("/")) if (!allMethods.includes(v)) allMethods.push(v);
    if (!method) { method = m[1].split("/")[0]; urlPath = m[2]; }
  }
  if (!method) return null;

  const cleanPath = urlPath.split("?")[0].replace(/\/$/, "");
  const isMultipart = /multipart\/form-data/i.test(code);

  // GET / DELETE 没有请求体，代码块里那段 JSON 是返回示例或参数示例，不能当 body 初值
  const requestExample = ["GET", "DELETE"].includes(method) ? null : firstJson(code);

  // 参数表：代码块之后、下一个标题之前的第一张表
  const all = paramsFromTable(nextUntilHeading(block, isTable));

  // URL 里的大写占位符就是 path 参数
  const placeholders = cleanPath.match(/[A-Z][A-Z0-9_]{2,}/g) || [];
  const query = new Set();
  const qs = urlPath.includes("?") ? urlPath.slice(urlPath.indexOf("?") + 1) : "";
  for (const kv of qs.split("&")) if (kv) query.add(kv.split("=")[0]);
  // 代码块里其他示例行的查询串也算
  for (const line of lines) {
    const m = line.match(/\?([^\s#]+)/);
    if (m) for (const kv of m[1].split("&")) if (kv) query.add(kv.split("=")[0]);
  }

  // 有请求体的方法：路径参数之外的都算 body；multipart 也算 body（表单字段）
  const takesBody = isMultipart || ["POST", "PUT", "PATCH"].includes(method);

  const pathParams = [], queryParams = [], bodyParams = [];
  for (const p of all) {
    const bare = p.name.replace(/\\/g, "");
    if (placeholders.includes(bare)) pathParams.push(p);
    else if (query.has(bare)) queryParams.push(p);
    else if (takesBody) bodyParams.push(p);
    else queryParams.push(p);
  }

  return {
    method,
    alsoMethods: allMethods.filter((v) => v !== method),
    path: cleanPath,
    contentType: isMultipart ? "multipart/form-data" : "application/json",
    runnable: !isMultipart,
    pathParams,
    queryParams,
    bodyParams,
    requestExample,
  };
}
