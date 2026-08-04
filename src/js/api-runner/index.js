/**
 * Docusaurus client module 入口。
 *
 * 在 docusaurus.config.ts 里用一行 clientModules 挂上，不改 package.json、不装依赖、
 * 不 swizzle 任何主题组件。每次路由变化后跑一遍：
 *
 *   看这一页的 DOM 里能不能读出接口信息 → 能就放一个「在线调试」按钮，不能就什么都不做。
 *
 * 「不能就什么都不做」是这套东西的底线：非接口页、写法特殊的接口页、以后文档结构变了，
 * 结果都只是按钮不出现，页面本身和没装这个脚本时完全一样。
 */

import "../../css/api-runner.css";
import { parseApi } from "./parse.js";
import { setApi, state, renderRunner, resetRunner, renderOut, send, cancelSend, bindCopy } from "./runner.js";
import { URL_TOOLS, renderUrlRunner } from "./url-tools.js";
import { ensurePanel, ensureToggle, removeToggle, openPanel, closePanel, clearPanel, isOpen } from "./shell.js";
import { initLayout, syncLayout } from "./layout.js";

let wired = false;

// 面板上那几个常驻按钮只绑一次；换页只是重新渲染内容
function wirePanelOnce() {
  if (wired) return;
  wired = true;
  const panel = ensurePanel();

  panel.querySelector("#jsj-btn-send").addEventListener("click", () => {
    if (state.sending) cancelSend(); else send();
  });
  panel.querySelector("#jsj-btn-reset").addEventListener("click", resetRunner);
  panel.querySelector("#jsj-btn-close-runner").addEventListener("click", closePanel);
  panel.querySelector("#jsj-runner-backdrop").addEventListener("click", closePanel);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    // 全屏 JSON 编辑器优先自己关掉，再按一次才收面板
    if (state.closeFullEditor) { state.closeFullEditor(); return; }
    if (isOpen()) closePanel();
  });

  bindCopy(panel);

  // 停靠/浮窗切换与两个拖拽手柄
  initLayout(panel);
}

// 当前路由，用来认出 URL 传参那两页（本站 baseUrl 是 /）
function currentRoute() {
  return location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

function mount() {
  removeToggle();

  const api = parseApi(document.querySelector(".theme-doc-markdown"));
  // URL 传参那两页没有 ### Request 块，解析不出接口，但要挂链接生成器
  const urlTool = URL_TOOLS[currentRoute()];
  setApi(api);
  if (!api && !urlTool) {
    // 这一页没有接口：收起面板，并把上一页的内容清干净。
    // 不清的话面板里会一直留着上个接口的方法、地址和返回结果——虽然此刻看不见，
    // 但那是脏状态，下次真打开时可能闪一眼旧数据。
    closePanel();
    clearPanel();
    state.response = null;
    return;
  }

  wirePanelOnce();

  // multipart 上传没法在浏览器里如实复现，面板只说明情况，不假装能发；
  // URL 传参页那个面板不发请求，主按钮是「复制链接」
  ensureToggle(
    () => { openPanel(); },
    urlTool ? "生成链接" : api.runnable ? "在线调试" : "查看请求说明"
  );

  // 换页要清掉上一页的响应和填过的值，否则会串页
  state.response = null;
  state.tab = "result";
  // 两个 render 各自在末尾会渲染下半部分，这里不要再重复调 renderOut
  if (urlTool) renderUrlRunner(urlTool); else renderRunner();

  if (isOpen()) openPanel();
  syncLayout();
}

export function onRouteDidUpdate() {
  // Docusaurus 换页时正文是异步渲染的，让出一轮事件循环再读 DOM。
  // 用 setTimeout 而不是 requestAnimationFrame：后者在标签页不可见时不触发，
  // 那样在后台打开的页面就永远挂不上面板。
  setTimeout(() => {
    try { mount(); } catch (err) {
      // 解析或渲染出问题绝不能拖垮文档站本身
      console.warn("[api-runner] 挂载失败，已跳过：", err);
      removeToggle();
    }
  }, 0);
}
