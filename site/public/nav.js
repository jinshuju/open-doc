/* 左侧目录树 —— 浏览器与构建脚本共用。
 *
 * 抽出来的理由和 markdown.js 一样：预渲染的 HTML 里必须已经带着目录，
 * 否则爬虫只看到一个空 <div id="menu">，走不完 51 个页面的链接图。
 * 构建时和运行时跑的是同一个函数，所以产物和 JS 接管后的 DOM 一字不差，
 * 首屏也不会因为目录被重建而闪一下。
 *
 * 目录项是 <a href>：中键能在新标签打开，点击则由 app.js 拦下来走 pushState。
 */

export function createNav(opts) {
  var state = opts.state;
  var esc = opts.esc;
  var SITE = opts.site || "/";

  function eachDoc(items, fn) {
    items.forEach(function (it) {
      if (it.type === "category") eachDoc(it.items, fn);
      else fn(it);
    });
  }

  function hit(item, q) {
    if (!q) return true;
    var doc = state.docs[item.route] || {};
    return [item.name, doc.title, item.route, item.method, doc.api && doc.api.path]
      .filter(Boolean).join(" ").toLowerCase().indexOf(q) !== -1;
  }

  function menuHtml(items, depth, q) {
    var html = "", any = false;
    items.forEach(function (it) {
      if (it.type === "category") {
        var inner = menuHtml(it.items, depth + 1, q);
        if (!inner.any) return;
        any = true;
        var key = depth + ":" + it.label;
        var collapsed = state.collapsed[key] && !q;
        html += '<div class="menu-group d' + depth + (collapsed ? " collapsed" : "") + '" data-key="' + esc(key) + '">' +
          '<button class="menu-group-label"><span>' + esc(it.label) + "</span>" +
          '<svg class="caret" width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6.5l4 4 4-4"/></svg>' +
          '</button><div class="menu-list">' + inner.html + "</div></div>";
      } else {
        if (!hit(it, q)) return;
        any = true;
        var on = state.current && state.current.route === it.route;
        html += '<a class="menu-link d' + depth + (on ? " active" : "") + '" href="' + esc(SITE + it.route) + '">' +
          '<span class="txt">' + esc(it.name) + "</span>" +
          (it.method ? '<span class="verb ' + it.method.toLowerCase() + '">' + esc(it.method) + "</span>" : "") +
          "</a>";
      }
    });
    return { html: html, any: any };
  }

  var HOME_ICON = '<svg viewBox="0 0 24 24" class="breadcrumb-home" aria-hidden="true">' +
    '<path fill="currentColor" d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"/></svg>';

  // 与原站一致：首页图标 › 各级分类 › 当前页标题；首页本身不显示面包屑
  function breadcrumbsHtml(doc) {
    if (doc.route === "") return '<div class="breadcrumbs-placeholder"></div>';
    var items = '<li class="breadcrumbs__item"><a class="breadcrumbs__link" href="' + esc(SITE) + '" aria-label="主页">' +
      HOME_ICON + "</a></li>";
    (doc.breadcrumb || []).forEach(function (c) {
      items += '<li class="breadcrumbs__item"><span class="breadcrumbs__link">' + esc(c) + "</span></li>";
    });
    items += '<li class="breadcrumbs__item breadcrumbs__item--active">' +
      '<span class="breadcrumbs__link">' + esc(doc.title) + "</span></li>";
    return '<ul class="breadcrumbs" aria-label="面包屑导航">' + items + "</ul>";
  }

  return {
    eachDoc: eachDoc,
    hit: hit,
    menuHtml: menuHtml,
    breadcrumbsHtml: breadcrumbsHtml,
  };
}
