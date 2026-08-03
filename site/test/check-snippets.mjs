/**
 * 「请求代码」生成的片段是否真能跑、方法是否正确。
 *
 *   node test/check-snippets.mjs     # 需要先 npm run data 生成 site.json
 *
 * 做法：起一个本地 HTTP 服务，把 public/app.js 里真实的 snippet() 抽出来，
 * 对每个接口生成 cURL / Python，把地址换成本地服务后真的执行，
 * 再比对服务端收到的方法。全程不碰线上。
 *
 * 这里盯的是两类真实事故：
 *   - cURL 少了 --request，PATCH 被当成 POST 发、DELETE 退化成 GET
 *   - Python 里出现 JSON 的 true/false/null，一运行就 NameError
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const appSrc = fs.readFileSync("public/app.js", "utf8");
const from = appSrc.indexOf("  function snippet(lang) {");
const to = appSrc.indexOf("  var SNIP_LANG =");
if (from === -1 || to === -1) {
  console.error("✗ 找不到 public/app.js 里的 snippet() 区块");
  process.exit(1);
}
const block = appSrc.slice(from, to);

const site = JSON.parse(fs.readFileSync("src/data/site.json", "utf8"));
const endpoints = Object.entries(site.docs)
  .filter(([, d]) => d.api && d.api.runnable !== false)
  .map(([route, api]) => ({ route, api: api.api }));

// Python 的 requests 不一定装了；没装就只验证代码能被 Python 解析（布尔值仍然会暴露）
let hasRequests = true;
try {
  await run("python3", ["-c", "import requests"]);
} catch {
  hasRequests = false;
  console.log("  ! 本机没有 python3 requests，Python 只做语法检查（CI 里会装上做完整验证）");
}

const received = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    received.push({ method: req.method, url: req.url, body });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const LOCAL = `http://127.0.0.1:${server.address().port}`;

function snippetFor(ep, method) {
  const a = ep.api;
  const reqPath = String(a.path).replace(/[A-Z_]{3,}/g, (t) => "X" + t.toLowerCase()); // 占位符填假值
  const body = ["POST", "PUT", "PATCH"].includes(method) ? a.requestExample || "" : "";
  return new Function(
    "API_BASE", "state", "api", "builtPath", "bodyText", "curMethod", "basic",
    block + "\nreturn snippet;"
  )(LOCAL, { creds: { key: "KEY", secret: "SECRET" }, lang: "curl" }, () => a, () => reqPath,
    () => body, () => method, () => "Basic S0VZOlNFQ1JFVA==");
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jsj-snippet-"));
const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name });
  if (!ok) console.log(`  ✗ ${name}\n      ${detail}`);
}

console.log("请求代码端到端（每个接口的 cURL 与 Python 都真的执行一遍）：");

for (const ep of endpoints) {
  for (const method of [ep.api.method, ...(ep.api.alsoMethods || [])]) {
    const snippet = snippetFor(ep, method);

    // ---- cURL ----
    const curlCode = snippet("curl");
    check(new RegExp(`--request ${method}\\b`).test(curlCode),
      `${ep.route} ${method} cURL 显式声明方法`, `生成的命令里没有 --request ${method}：\n${curlCode.split("\n")[0]}`);
    const beforeCurl = received.length;
    try {
      await run("/bin/sh", ["-c", curlCode.replace(/^curl /, "curl -s -o /dev/null ")]);
    } catch (e) {
      check(false, `${ep.route} ${method} cURL 可执行`, e.message);
    }
    const gotCurl = received[beforeCurl];
    check(gotCurl && gotCurl.method === method, `${ep.route} ${method} cURL 实际发出的方法正确`,
      `服务端收到的是 ${gotCurl ? gotCurl.method : "（没有请求）"}`);

    // ---- Python ----
    const pyCode = snippet("python");
    check(!/[:\s,[{]\s*(true|false|null)\s*[,}\]\n]/.test(pyCode),
      `${ep.route} ${method} Python 不含 JSON 的 true/false/null`, "Python 里必须是 True/False/None");
    const pyFile = path.join(tmp, "t.py");
    fs.writeFileSync(pyFile, pyCode);
    if (hasRequests) {
      const beforePy = received.length;
      try {
        await run("python3", [pyFile]);
      } catch (e) {
        check(false, `${ep.route} ${method} Python 可执行`, (e.stderr || e.message).trim().split("\n").pop());
      }
      const gotPy = received[beforePy];
      check(gotPy && gotPy.method === method, `${ep.route} ${method} Python 实际发出的方法正确`,
        `服务端收到的是 ${gotPy ? gotPy.method : "（没有请求）"}`);
    } else {
      try {
        await run("python3", ["-c", `import ast,sys; ast.parse(open(${JSON.stringify(pyFile)}).read())`]);
      } catch (e) {
        check(false, `${ep.route} ${method} Python 语法正确`, (e.stderr || e.message).trim().split("\n").pop());
      }
    }
  }
}

server.close();
fs.rmSync(tmp, { recursive: true, force: true });

const failed = results.filter((x) => !x.ok);
console.log(`  —— ${endpoints.length} 个接口、${results.length} 项断言，失败 ${failed.length} 项`);
process.exit(failed.length === 0 ? 0 : 1);
