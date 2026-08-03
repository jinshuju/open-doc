/**
 * URL 传参生成器的算法：拿 public/app.js 里的真代码，对着 Python 的独立实现逐个比对。
 *
 *   node test/check-url-params.mjs
 *
 * 盯的是文档里那几个极易搞错的点：
 *   - 字段 API CODE 按字典序升序拼接（顺序错了签名对不上）
 *   - 签名针对未编码的原始值
 *   - HMAC 先转 hex 字符串，再对那串 hex 做 Base64（不是对原始字节做）
 *   - JWT 用 base64url、无填充
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const appSrc = fs.readFileSync("public/app.js", "utf8");
const from = appSrc.indexOf("  var FORM_BASE =");
const to = appSrc.indexOf("  /* ---------- 生成代码");
if (from === -1 || to === -1) {
  console.error("✗ 找不到 public/app.js 里的 URL 传参算法区块");
  process.exit(1);
}
const block = appSrc.slice(from, to);
const { signParams, jwtHS256, FORM_BASE } = new Function(
  block + "\nreturn { signParams, jwtHS256, FORM_BASE };"
)();

// 生成代码那部分：连同它依赖的引号工具一起抽出来
const snipFrom = appSrc.indexOf("  var UT_LANGS = [");
const snipTo = appSrc.indexOf("  /* ---------- 面板形态的生成器");
const quoteFrom = appSrc.indexOf("  function q(s) {");
const quoteTo = appSrc.indexOf("  // JSON 直接塞进 Python");
if (snipFrom === -1 || snipTo === -1 || quoteFrom === -1 || quoteTo === -1) {
  console.error("✗ 找不到 public/app.js 里的生成代码区块");
  process.exit(1);
}
const { urlSnippet, UT_LANGS } = new Function(
  "esc", "state",
  appSrc.slice(quoteFrom, quoteTo) + appSrc.slice(snipFrom, snipTo) +
  "\nreturn { urlSnippet, UT_LANGS };"
)((s) => String(s), { utLang: "python" });

const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : "\n      " + detail}`);
}

// ---- Python 参照实现：严格照文档里的 Python 示例 ----
const PY = `
import hmac, hashlib, base64, json, sys
def sign(secret, url_params):
    h = hmac.new(secret.encode(), url_params.encode(), hashlib.sha256).hexdigest()
    return base64.b64encode(h.encode()).decode()
def b64u(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()
def jwt(secret, payload):
    head = b64u(json.dumps({"alg":"HS256","typ":"JWT"}, separators=(",",":")).encode())
    body = b64u(json.dumps(payload, separators=(",",":"), ensure_ascii=False).encode())
    signing = head + "." + body
    sig = b64u(hmac.new(secret.encode(), signing.encode(), hashlib.sha256).digest())
    return signing + "." + sig
task = json.loads(sys.argv[1])
if task["kind"] == "sign":
    print(sign(task["secret"], task["params"]), end="")
else:
    print(jwt(task["secret"], task["payload"]), end="")
`;

async function py(task) {
  const { stdout } = await run("python3", ["-c", PY, JSON.stringify(task)]);
  return stdout;
}

console.log("表单字段签名（对着 Python 实现逐字节比对）：");
const signCases = [
  { secret: "123456", params: "field_1=James&field_2=13888888888" },     // 文档里的示例
  { secret: "123456", params: "field_1=call&field_2=me&field_3=golden&field_5=data" },
  { secret: "s3cr3t", params: "field_1=张三&field_2=研发部" },            // 中文，验 UTF-8
  { secret: "密钥", params: "field_1=a b&field_2=x&y" },                  // 密钥是中文、值带空格和 &
];
for (const c of signCases) {
  const mine = await signParams(c.secret, c.params);
  const theirs = await py({ kind: "sign", ...c });
  check(mine === theirs, `sign(${JSON.stringify(c.secret)}, ${JSON.stringify(c.params)})`,
    `我们的 ${mine}\n      Python ${theirs}`);
}

// Web Crypto 不接受零长度密钥（浏览器同样如此），所以界面在没填 sign_secret 时
// 必须走「不签名」分支，不能把空串喂给签名函数
let zeroKeyRejected = false;
try {
  await signParams("", "field_1=x");
} catch {
  zeroKeyRejected = true;
}
check(zeroKeyRejected, "空 sign_secret 会被 Web Crypto 拒绝（所以 UI 不填密钥时不签名）",
  "居然没报错，说明这个前提变了，UI 的分支要重新确认");

console.log("JWT（全局字段传参）：");
const jwtCases = [
  { secret: "123456", payload: { gf_1: "张三", gf_2: "研发部" } },        // 文档里的示例
  { secret: "123456", payload: { gf_1: "a+b/c=d" } },                     // 会撞上 base64url 的替换字符
  { secret: "s", payload: {} },
];
for (const c of jwtCases) {
  const mine = await jwtHS256(c.secret, c.payload);
  const theirs = await py({ kind: "jwt", ...c });
  check(mine === theirs, `jwt(${JSON.stringify(c.payload)})`, `我们的 ${mine}\n      Python ${theirs}`);
}

console.log("JWT 格式：");
const sample = await jwtHS256("k", { gf_1: "v" });
check(sample.split(".").length === 3, "三段结构", sample);
check(!/[+/=]/.test(sample), "用 base64url、无填充（不含 + / =）", sample);

console.log("升序排序（必须是字典序，跟文档的 TreeMap / sorted 一致）：");
// 生成器里的排序逻辑
const sortKeys = (keys) => keys.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const { stdout: pySorted } = await run("python3", ["-c",
  "import json,sys; print(json.dumps(sorted(json.loads(sys.argv[1])), separators=(',',':')), end='')",
  JSON.stringify(["field_10", "field_2", "field_1", "field_5"])]);
const mineSorted = sortKeys(["field_10", "field_2", "field_1", "field_5"]);
check(JSON.stringify(mineSorted) === pySorted, "field_10 排在 field_2 之前（字典序，不是数值序）",
  `我们的 ${JSON.stringify(mineSorted)}\n      Python ${pySorted}`);

check(FORM_BASE === "https://jinshuju.net/f/", "表单链接前缀", FORM_BASE);

/* ---------- 生成的代码必须真的能跑，而且算出同一个链接 ---------- */

const TOKEN = "aBcDeF";
const SECRET = "s3cr3t";
// 故意用降序 + 中文 + 需要转义的值，把排序和编码两件事一起考到
const PAIRS = [
  { key: "field_5", value: "data" },
  { key: "field_10", value: "十" },
  { key: "field_1", value: "a b&c" },
];
const sortedPairs = PAIRS.slice().sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

// 页面自己算出来的那条链接，作为基准
async function expectedSignUrl() {
  const raw = sortedPairs.map((p) => `${p.key}=${p.value}`).join("&");
  const query = sortedPairs.map((p) => `${p.key}=${encodeURIComponent(p.value)}`).join("&");
  const sign = await signParams(SECRET, raw);
  return `${FORM_BASE}${TOKEN}?${query}&sign=${encodeURIComponent(sign)}`;
}
async function expectedJwtUrl() {
  const payload = {};
  sortedPairs.forEach((p) => (payload[p.key] = p.value));
  return `${FORM_BASE}${TOKEN}?cusd=${await jwtHS256(SECRET, payload)}`;
}

// 归一化成「服务端会看到的东西」：路径 + 解码后的参数
function normalize(url) {
  try {
    const u = new URL(url);
    const params = [...u.searchParams.entries()].sort();
    return u.origin + u.pathname + "|" + JSON.stringify(params);
  } catch {
    return "无法解析：" + url;
  }
}

const RUNNERS = {
  shell: { file: "s.sh", cmd: (f) => ["/bin/bash", [f]] },
  python: { file: "s.py", cmd: (f) => ["python3", [f]] },
  node: { file: "s.js", cmd: (f) => [process.execPath, [f]] },
  php: { file: "s.php", cmd: (f) => ["php", [f]] },
  ruby: { file: "s.rb", cmd: (f) => ["ruby", [f]] },
};

async function available(lang) {
  const [bin] = RUNNERS[lang].cmd("x");
  if (bin === process.execPath) return true;
  try {
    await run(bin, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jsj-urlsnip-"));
const skipped = [];

for (const jwt of [false, true]) {
  const label = jwt ? "全局字段（JWT）" : "表单字段（sign）";
  const want = jwt ? await expectedJwtUrl() : await expectedSignUrl();
  console.log(`${label} 的生成代码，实际执行后与页面结果比对：`);
  for (const lang of UT_LANGS.map((l) => l.id)) {
    if (!(await available(lang))) {
      skipped.push(`${lang}/${jwt ? "jwt" : "sign"}`);
      continue;
    }
    const code = urlSnippet(lang, { token: TOKEN, secret: SECRET, pairs: sortedPairs, prefix: "field_", jwt });
    const file = path.join(tmp, RUNNERS[lang].file);
    fs.writeFileSync(file, code);
    const [bin, args] = RUNNERS[lang].cmd(file);
    let got = "", err = null;
    try {
      const r = await run(bin, args);
      got = r.stdout.trim();
    } catch (e) {
      err = (e.stderr || e.message).trim().split("\n").slice(-3).join(" | ");
    }
    // 比服务端解出来的内容，而不是字符串字面：%20 和 + 都是合法的空格编码，
    // 各语言标准库风格不同，只要解码后一致就算对
    const same = !err && normalize(got) === normalize(want);
    check(same, `${lang}`,
      err ? `执行失败：${err}` : `生成代码输出：\n      ${got}\n      页面结果：  \n      ${want}`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
if (skipped.length) console.log(`  ! 本机缺运行环境，跳过：${skipped.join("、")}（CI 里会跑）`);

const failed = results.filter((x) => !x.ok);
console.log(`  —— ${results.length} 项，失败 ${failed.length} 项`);
process.exit(failed.length === 0 ? 0 : 1);
