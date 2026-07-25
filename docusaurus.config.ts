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

  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        title: '金数据开放平台文档',
        description: '金数据 API、Webhook、URL 传参等系统集成能力文档',
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
