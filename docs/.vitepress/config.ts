import {defineConfig} from 'vitepress';
import mathjax3 from 'markdown-it-mathjax3';
import navZh from './generated-nav.json';
import navEn from './generated-nav.en.json';

const github = 'https://github.com/archebase/physical-ai-handbook';
const feishuCatalog = 'https://archebase.feishu.cn/docx/T7dLdyp0RolnUgxQCqTcXyZZnbc';

const zhTheme = {
  nav: [
    {text: '课程目录', link: '/guide/catalog'},
    {text: '飞书源目录', link: feishuCatalog},
    {text: 'Demo 数据', link: 'https://robodata.archebase.ai'},
    {text: 'GitHub', link: github}
  ],
  sidebar: [
    {text: '课程路线', items: [{text: '总目录', link: '/guide/catalog'}]},
    ...navZh,
    {text: 'Demo 数据', items: [{text: '数据说明', link: '/data/demo-data'}]},
    {text: '许可', items: [{text: 'Apache License 2.0', link: '/license'}]}
  ],
  search: {
    provider: 'local' as const,
    options: {
      translations: {
        button: {buttonText: '搜索', buttonAriaLabel: '搜索文档'},
        modal: {noResultsText: '未找到相关结果', resetButtonTitle: '清除查询', backButtonTitle: '关闭搜索'}
      }
    }
  },
  outline: {level: [2, 3] as [number, number], label: '本页目录'},
  docFooter: {prev: '上一篇', next: '下一篇'},
  darkModeSwitchLabel: '外观',
  lightModeSwitchTitle: '切换到浅色主题',
  darkModeSwitchTitle: '切换到深色主题',
  sidebarMenuLabel: '菜单',
  returnToTopLabel: '返回顶部',
  langMenuLabel: '切换语言',
  skipToContentLabel: '跳到正文',
  footer: {
    message: `文章正文采用 <a href="${github}/blob/main/LICENSE-CONTENT">Apache License 2.0</a>`,
    copyright: 'Copyright 2026 ArcheBase · Content source: ArcheBase Feishu course tree'
  }
};

const enTheme = {
  nav: [
    {text: 'Course Catalog', link: '/en/guide/catalog'},
    {text: 'Feishu Source', link: feishuCatalog},
    {text: 'Demo Data', link: 'https://robodata.archebase.ai'},
    {text: 'GitHub', link: github}
  ],
  sidebar: [
    {text: 'Learning Routes', items: [{text: 'Full Catalog', link: '/en/guide/catalog'}]},
    ...navEn,
    {text: 'Demo Data', items: [{text: 'Data Guide', link: '/en/data/demo-data'}]},
    {text: 'License', items: [{text: 'Apache License 2.0', link: '/en/license'}]}
  ],
  search: {
    provider: 'local' as const,
    options: {
      translations: {
        button: {buttonText: 'Search', buttonAriaLabel: 'Search documentation'},
        modal: {noResultsText: 'No results found', resetButtonTitle: 'Reset search', backButtonTitle: 'Close search'}
      }
    }
  },
  outline: {level: [2, 3] as [number, number], label: 'On this page'},
  docFooter: {prev: 'Previous page', next: 'Next page'},
  darkModeSwitchLabel: 'Appearance',
  lightModeSwitchTitle: 'Switch to light theme',
  darkModeSwitchTitle: 'Switch to dark theme',
  sidebarMenuLabel: 'Menu',
  returnToTopLabel: 'Return to top',
  langMenuLabel: 'Change language',
  skipToContentLabel: 'Skip to content',
  footer: {
    message: `Article text is licensed under the <a href="${github}/blob/main/LICENSE-CONTENT">Apache License 2.0</a>`,
    copyright: 'Copyright 2026 ArcheBase · Content source: ArcheBase Feishu course tree'
  }
};

export default defineConfig({
  title: 'ArcheBase Physical AI Handbook',
  description: 'An open handbook for embodied intelligence and robotics data practice',
  lang: 'zh-CN',
  cleanUrls: true,
  srcDir: '.',
  base: process.env.VITEPRESS_BASE || '/',
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/',
      description: '具身智能的开放课程与数据实践手册',
      themeConfig: zhTheme
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description: 'An open handbook for embodied intelligence and robotics data practice',
      themeConfig: enTheme
    }
  },
  themeConfig: {
    logo: {
      light: '/brand/archebase-logo-black-h.png',
      dark: '/brand/archebase-logo-white-h.png',
      alt: 'ArcheBase'
    },
    siteTitle: false,
    socialLinks: [{icon: 'github', link: github}],
    i18nRouting: true
  },
  markdown: {config: (md) => md.use(mathjax3)}
});
