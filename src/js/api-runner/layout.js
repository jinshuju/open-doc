/**
 * 面板的停靠、压缩正文与拖拽调节。
 *
 * 行为对齐独立站那版：
 *   - 默认「停靠」——打开时把正文区压窄，而不是盖在正文上面
 *   - 往左拖越过正文安全宽度后自动切成覆盖浮窗（带遮罩），缩回来又变回停靠
 *   - 面板宽度、请求区/结果区的分割高度都能拖，双击复位，记在 localStorage 里
 *   - 正文被压得太窄时先收起「本页总览」，它是三者里最可让的
 *
 * 与独立站版的区别只在「压缩谁」：那边压自己的 .layout，这里压 Docusaurus 的
 * .main-wrapper，并且不碰它的侧边栏宽度（那是主题自己的事）。
 * 用到的都是 Docusaurus 稳定的 theme 类，不碰带构建哈希的类名。
 */

const MAIN_SAFE_WIDTH = 760; // 正文低于这个宽度就别再停靠了，改成浮窗

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// 窄一点的屏默认窄一点，和独立站那版一致
const defaultRunnerWidth = () => (window.innerWidth <= 1560 ? 440 : 480);

const docSidebar = () => document.querySelector(".theme-doc-sidebar-container");
const article = () => document.querySelector(".theme-doc-markdown");
const contentCol = () => {
  const a = article();
  return a ? a.closest("main") || a.parentElement : null;
};

export function isOverlay() {
  return document.body.classList.contains("jsj-runner-overlay");
}

/**
 * 每次开关面板、拖动、缩窗口后都要跑：决定停靠还是浮窗，以及要不要收起总览。
 */
export function syncLayout() {
  const body = document.body;
  const root = document.documentElement;
  const open = body.classList.contains("jsj-runner-open");

  if (!open || window.innerWidth <= 996) {
    // 窄屏下 Docusaurus 自己就把侧边栏收成抽屉了，这里一律用浮窗
    body.classList.toggle("jsj-runner-overlay", open && window.innerWidth <= 996);
    return;
  }

  const width = parseFloat(getComputedStyle(root).getPropertyValue("--runner-w")) || defaultRunnerWidth();
  const sidebarWidth = docSidebar() ? docSidebar().getBoundingClientRect().width : 0;
  const safeMax = window.innerWidth - sidebarWidth - MAIN_SAFE_WIDTH - 24;
  // 下界是「默认宽度」而不是一个小常数：否则 1440 这类窗口算出来的 safeMax 只有
  // 三百多，默认宽度的面板一开就被判成浮窗，正文和右侧目录全被盖住。
  const dockLimit = Math.max(defaultRunnerWidth(), Math.min(720, safeMax));
  body.classList.toggle("jsj-runner-overlay", width > dockLimit + 1);

}

// 刻意不做「正文变窄就自动收起本页总览」：独立站那版有这个降级，但实际用起来
// 一开面板目录就消失，比正文窄一点更让人困惑。极端窄屏交给 Docusaurus 自己的
// 响应式规则处理。

function remember(key, value) {
  try { localStorage.setItem(key, String(Math.round(value))); } catch (e) { /* noop */ }
}

function recalled(key, fallback) {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : fallback;
  } catch (e) { return fallback; }
}

/**
 * 绑一个拖拽手柄。用 pointer 事件 + setPointerCapture，
 * 所以鼠标拖出手柄范围甚至拖出窗口都不会丢焦点。
 */
function bind(handle, opts) {
  if (!handle) return null;
  const root = document.documentElement;

  const defaultValue = () =>
    typeof opts.defaultValue === "function" ? opts.defaultValue() : opts.defaultValue;

  // 记住最后一次真正应用的值。松手时别再去测量元素的实际尺寸——
  // 那受过渡动画和布局时序影响，会把刚拖好的宽度又量回旧值（实测拖到 600 后
  // 松手被打回 480）。
  let lastValue = null;

  function apply(value) {
    const b = opts.bounds();
    value = clamp(value, b.min, b.max);
    lastValue = value;
    root.style.setProperty(opts.property, Math.round(value) + "px");
    handle.setAttribute("aria-valuemin", Math.round(b.min));
    handle.setAttribute("aria-valuemax", Math.round(b.max));
    handle.setAttribute("aria-valuenow", Math.round(value));
    syncLayout();
    return value;
  }
  const finish = (v) => remember(opts.storage, apply(v));

  handle.addEventListener("pointerdown", (ev) => {
    if (ev.isPrimary === false) return;
    ev.preventDefault();
    const startPoint = opts.axis === "x" ? ev.clientX : ev.clientY;
    const startValue = opts.measure();
    const bodyClass = opts.axis === "x" ? "jsj-resize-col" : "jsj-resize-row";
    handle.classList.add("active");
    document.body.classList.add(bodyClass);

    const move = (e) => {
      const point = opts.axis === "x" ? e.clientX : e.clientY;
      apply(startValue + (point - startPoint) * opts.direction);
    };
    const end = (e) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      handle.classList.remove("active");
      document.body.classList.remove(bodyClass);
      try {
        if (handle.releasePointerCapture && handle.hasPointerCapture(e.pointerId)) {
          handle.releasePointerCapture(e.pointerId);
        }
      } catch (err) { /* 没捕获过就不用释放 */ }
      finish(lastValue == null ? opts.measure() : lastValue);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    // 抢指针捕获是为了拖出手柄范围也不丢焦点，但它对某些指针会抛异常。
    // 必须放在注册监听之后并且包住：之前放在前面且没包，一抛就整段跳过，拖动直接失效。
    try { if (handle.setPointerCapture) handle.setPointerCapture(ev.pointerId); } catch (e) { /* 没捕获也能拖 */ }
  });

  // 键盘也能调，手柄是可聚焦的 separator
  handle.addEventListener("keydown", (ev) => {
    let step = 0;
    if (opts.axis === "x" && ev.key === "ArrowLeft") step = -10;
    if (opts.axis === "x" && ev.key === "ArrowRight") step = 10;
    if (opts.axis === "y" && ev.key === "ArrowUp") step = -12;
    if (opts.axis === "y" && ev.key === "ArrowDown") step = 12;
    if (!step) return;
    ev.preventDefault();
    finish((lastValue == null ? opts.measure() : lastValue) + step * opts.direction);
  });

  handle.addEventListener("dblclick", () => finish(defaultValue()));
  apply(recalled(opts.storage, defaultValue()));
  return () => apply(
    parseFloat(getComputedStyle(root).getPropertyValue(opts.property)) || opts.measure()
  );
}

export function initLayout(panelRoot) {
  const panel = panelRoot.querySelector(".runner");
  const top = panelRoot.querySelector(".runner-top");
  const out = panelRoot.querySelector(".runner-out");

  const refreshers = [
    bind(panelRoot.querySelector("#jsj-resize-runner"), {
      property: "--runner-w", storage: "jsj_runner_w",
      axis: "x", direction: -1,
      defaultValue: defaultRunnerWidth,
      bounds: () => ({
        min: 360,
        max: Math.max(360, Math.min(960, window.innerWidth * 0.68, window.innerWidth - 32)),
      }),
      measure: () => panel.getBoundingClientRect().width,
    }),
    bind(panelRoot.querySelector("#jsj-resize-runner-split"), {
      property: "--runner-out-h", storage: "jsj_runner_out_h",
      axis: "y", direction: -1, defaultValue: 344,
      bounds: () => {
        const topH = top ? top.getBoundingClientRect().height : 50;
        const avail = panel ? panel.getBoundingClientRect().height - topH - 262 : 520;
        return { min: 180, max: Math.max(180, avail) };
      },
      measure: () => out.getBoundingClientRect().height,
    }),
  ].filter(Boolean);

  const refreshAll = () => { refreshers.forEach((f) => f()); syncLayout(); };
  refreshAll();
  window.addEventListener("resize", refreshAll);

  // 换页时测量会早于浏览器算完新布局，光靠 resize 事件会漏判；
  // 直接盯正文列的实际宽度。（收起总览不改变这一列的宽度，所以不会自激。）
  const col = contentCol();
  if (window.ResizeObserver && col) new ResizeObserver(syncLayout).observe(col);

  return refreshAll;
}
