import { syncLayout } from "./layout.js";

/**
 * 面板骨架：创建 DOM，提供 runner.js 期望的那些元素。
 *
 * 刻意做成「固定定位的侧滑面板 + 默认隐藏」，而不是像独立站那版一样占据一整列：
 * 这样完全不改动 Docusaurus 的页面布局，不开面板时页面和原来一模一样，
 * 回归风险为零。
 *
 * 元素 id 全部带 jsj- 前缀（helpers.js 的 el() 会自动补），避免和主题或正文锚点撞车。
 * 类名沿用独立站那版，靠 .jsj-runner-root 作用域圈住，不会漏到页面其他地方。
 */

const CLOSE_ICON =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' +
  '<path d="M4 4l8 8M12 4l-8 8"/></svg>';

const RUN_ICON =
  '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="6.25"/><path d="M6.5 5.25L10.75 8 6.5 10.75z" fill="currentColor" stroke="none"/></svg>';

export const IDS = {
  root: "jsj-runner-root",
  toggle: "jsj-open-runner",
};

// 面板本体只建一次，之后换页只是重新填内容
export function ensurePanel() {
  let root = document.getElementById(IDS.root);
  if (root) return root;

  root = document.createElement("div");
  root.id = IDS.root;
  root.className = "jsj-runner-root";
  root.hidden = true;
  root.innerHTML =
    '<button class="jsj-backdrop" id="jsj-runner-backdrop" type="button" aria-label="关闭在线调试"></button>' +
    '<aside class="runner" role="dialog" aria-label="在线调试">' +
    // 左边缘拖宽窄；请求区与结果区之间拖高低。双击复位，方向键也能调。
    '<div class="resize-handle resize-runner" id="jsj-resize-runner" role="separator"' +
    ' aria-label="调整面板宽度" aria-orientation="vertical" tabindex="0"></div>' +
    '<div class="runner-top">' +
    '<div class="runner-req" id="jsj-runner-req"></div>' +
    '<div class="runner-acts">' +
    '<button class="btn" id="jsj-btn-reset" title="参数与 JSON 恢复成文档里的示例值">重置</button>' +
    '<button class="btn btn-accent" id="jsj-btn-send">发送请求</button>' +
    '<button class="clean-btn" id="jsj-btn-close-runner" title="收起">' + CLOSE_ICON + "</button>" +
    "</div></div>" +
    '<div class="runner-scroll" id="jsj-runner-scroll"></div>' +
    '<div class="resize-handle resize-runner-split" id="jsj-resize-runner-split" role="separator"' +
    ' aria-label="调整请求与结果区域高度" aria-orientation="horizontal" tabindex="0"></div>' +
    '<div class="runner-out">' +
    '<div class="tabs" id="jsj-out-tabs"></div>' +
    '<div class="out-pane" id="jsj-out-pane"></div>' +
    "</div></aside>" +
    '<div class="modal-root" id="jsj-modal-root" hidden></div>';

  document.body.appendChild(root);
  return root;
}

// 换到没有接口的页面时把面板内容清空，别留着上一页的方法、地址和返回结果
export function clearPanel() {
  const root = document.getElementById(IDS.root);
  if (!root) return;
  for (const id of ["jsj-runner-req", "jsj-runner-scroll", "jsj-out-tabs", "jsj-out-pane"]) {
    const n = root.querySelector("#" + id);
    if (n) n.innerHTML = "";
  }
}

export function openPanel() {
  const root = ensurePanel();
  root.hidden = false;
  // 读一次 offsetWidth 强制回流，过渡才有起点。
  // 别用 requestAnimationFrame——标签页在后台时它不触发，面板就永远打不开了。
  void root.offsetWidth;
  root.classList.add("open");
  // body 上这个类负责把正文压窄（停靠），见 api-runner.css
  document.body.classList.add("jsj-runner-open");
  // 立刻判一次：正文会不会被压得太窄，需不需要降级成覆盖浮窗
  syncLayout();
}

export function closePanel() {
  document.body.classList.remove("jsj-runner-open", "jsj-runner-overlay");
  const root = document.getElementById(IDS.root);
  if (!root) return;
  root.classList.remove("open");
  // 等过渡结束再真正隐藏，免得下次打开是硬闪
  setTimeout(() => {
    if (!root.classList.contains("open")) root.hidden = true;
  }, 200);
}

export function isOpen() {
  const root = document.getElementById(IDS.root);
  return !!root && root.classList.contains("open");
}

/**
 * 把按钮放到面包屑那一行的右侧（和原来独立站那版位置一致）。
 *
 * 用绝对定位对齐，而不是把面包屑搬进自己的 flex 容器里——那些节点是 React 管的，
 * 搬动它们会和 Docusaurus 的更新打架。这里只给 <article> 加一个类当定位参照，
 * 按钮自己浮在右上角。
 */
export function ensureToggle(onClick, label) {
  const md = document.querySelector(".theme-doc-markdown");
  if (!md) return null;
  const article = md.closest("article") || md.parentElement;
  if (!article) return null;
  article.classList.add("jsj-has-actions");

  let box = document.getElementById(IDS.toggle + "-box");
  if (!box || !box.isConnected) {
    box = document.createElement("div");
    box.id = IDS.toggle + "-box";
    box.className = "jsj-doc-actions";
    article.insertBefore(box, article.firstChild);
  }

  let btn = document.getElementById(IDS.toggle);
  if (btn && btn.isConnected) {
    btn.querySelector(".jsj-toggle-label").textContent = label;
    return btn;
  }
  btn = document.createElement("button");
  btn.id = IDS.toggle;
  btn.type = "button";
  btn.className = "jsj-open-runner";
  btn.innerHTML = RUN_ICON + '<span class="jsj-toggle-label"></span>';
  btn.querySelector(".jsj-toggle-label").textContent = label;
  btn.addEventListener("click", onClick);
  box.appendChild(btn);
  return btn;
}

// 换页时把上一页留下的按钮清掉（面板本体留着复用）
export function removeToggle() {
  const btn = document.getElementById(IDS.toggle);
  if (btn) btn.remove();
  const box = document.getElementById(IDS.toggle + "-box");
  if (box) box.remove();
}
