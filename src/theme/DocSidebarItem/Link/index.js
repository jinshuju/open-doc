/**
 * 侧边栏条目：给接口条目标上请求方法（GET / POST / PATCH / DELETE）。
 *
 * 做法是往 item.className 里塞两个类名——原组件会把它透传到 <li> 上，
 * 标记本身由 CSS 的 ::after 生成。所以这里一个 DOM 节点都不新增：
 *   - 整行（含标记那块）仍然是同一个 <a>，点哪儿都能选中，选中态高亮铺满整行
 *   - <ul> 下仍然直接是 <li>，不会产生非法嵌套
 *
 * 之前的写法是在外面套一个 <div>，结果 <ul><div><li> 是非法 HTML，
 * 标记落在 <a> 外面所以那块点不到、高亮也只到文字为止，
 * 而且 .jsj-sidebar-item > a 这种选择器根本匹配不到（<a> 其实是孙子节点）。
 *
 * 方法值来自各篇文档 front matter 的 sidebar_custom_props.method。
 * 侧边栏要在「还没打开那一页」时就显示标记，而运行时只看得到当前页的 DOM，
 * 所以这一个字段写在 front matter 里；面板用的方法/路径/参数仍然现读页面。
 */

import React from 'react';
import Link from '@theme-original/DocSidebarItem/Link';

export default function LinkWrapper(props) {
  const method = props?.item?.customProps?.method;
  if (!method) return <Link {...props} />;
  const verb = String(method).toUpperCase();
  const item = {
    ...props.item,
    className: [props.item.className, 'jsj-has-verb', 'jsj-verb-' + verb.toLowerCase()]
      .filter(Boolean)
      .join(' '),
  };
  return <Link {...props} item={item} />;
}
