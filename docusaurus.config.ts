import {themes as prismThemes} from 'prism-react-renderer';
import type {PrismTheme} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// 代码块底色跟站点保持一致（对应 custom.css 里的 --gd-bg-subtle）。
// prism 主题的 plain 会变成 <pre> 的行内样式，所以只能在这里改，不能靠 CSS 覆盖。
const withCodeBackground = (
  theme: PrismTheme,
  backgroundColor: string,
): PrismTheme => ({
  ...theme,
  plain: {...theme.plain, backgroundColor, textShadow: 'none'},
});

// llms.txt / llms-full.txt 不收 API v1 的页面：页面只写了人读的部分，
// 接口的完整定义以线上 openapi.yaml 为准，直接把 LLM 指过去。
const apiV1ForLLMs = `金数据 API v1 的接口以 OpenAPI 文档为准，本站的 API v1 页面不收在本文件里。

## API v1

- [API v1 OpenAPI 定义](https://jinshuju.net/api/v1/openapi.yaml): 全部接口的路径、参数、请求体、响应与状态码，以及认证、速率限制、错误格式、分页等约定（OpenAPI 3.1，YAML）
- [获取 Access Token](https://open.jinshuju.net/api_v1/authentication): 在金数据后台创建个人 / 企业 Access Token 的位置`;

const config: Config = {
  title: '金数据开放平台',
  tagline: '强大灵活的系统集成能力',
  favicon: 'img/logo.png',

  future: {
    v4: true,
  },

  url: 'https://open.jinshuju.net',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // 接口页右侧的「在线调试」面板：纯客户端脚本，不改内容也不 swizzle 主题。
  // 它在浏览器里读已经渲染出来的页面（见 src/js/api-runner/parse.js），
  // 读不出接口信息就什么都不做，页面与没装它时完全一致。
  clientModules: ['./src/js/api-runner/index.js'],

  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        title: '金数据开放平台文档',
        description: '金数据 API、Webhook、URL 传参等系统集成能力文档',
        ignoreFiles: ['docs/api_v1.md', 'docs/api_v1/**'],
        rootContent: apiV1ForLLMs,
        fullRootContent: apiV1ForLLMs,
        pathTransformation: {
          ignorePaths: ['docs'],
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    docs: {
      // 不提供「收起侧边栏」按钮（与主题默认一致，这里显式写出以免又被打开）
      sidebar: {hideable: false},
    },
    navbar: {
      title: '金数据开放平台',
      logo: {
        alt: '金数据',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '文档',
        },
        {
          href: 'https://jinshuju.net',
          label: '金数据首页',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '文档',
          items: [
            {
              label: 'MCP Server',
              to: '/mcp',
            },
            {
              label: 'API v1',
              to: '/api_v1',
            },
            {
              label: 'Webhook',
              to: '/webhook',
            },
            {
              label: 'URL 传参',
              to: '/url_params',
            },
            {
              label: '表单嵌入',
              to: '/embedded/overview',
            },
          ],
        },
        {
          title: '开发者资源',
          items: [
            {
              label: '场景案例',
              to: '/best_practice',
            },
            {
              label: 'API 状态码',
              to: '/api_v1/status_code',
            },
            {
              label: 'API 请求速率',
              to: '/api_v1/request_rate',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/jinshuju',
            },
          ],
        },
        {
          title: '更多',
          items: [
            {
              label: '金数据首页',
              href: 'https://jinshuju.net',
            },
            {
              label: '帮助中心',
              href: 'https://help.jinshuju.net',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} 金数据开放平台 - 文档中心`,
    },
    prism: {
      theme: withCodeBackground(prismThemes.oneLight, '#fbfaf9'),
      darkTheme: withCodeBackground(prismThemes.oneDark, '#17171b'),
      additionalLanguages: ['bash', 'ruby', 'java', 'python', 'json', 'http'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
