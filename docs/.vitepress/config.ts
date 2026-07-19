import {defineConfig} from 'vitepress';
import mathjax3 from 'markdown-it-mathjax3';
import nav from './generated-nav.json';

export default defineConfig({
  title: 'ArcheBase Physical AI Handbook',
  description: '具身智能的开放课程与数据实践手册',
  lang: 'zh-CN',
  cleanUrls: true,
  srcDir: '.',
  base: process.env.VITEPRESS_BASE || '/',
  themeConfig: {
    siteTitle: 'ArcheBase · Physical AI Handbook',
    nav: [
      {text: '课程目录', link: '/guide/catalog'},
      {text: '飞书源目录', link: 'https://archebase.feishu.cn/docx/T7dLdyp0RolnUgxQCqTcXyZZnbc'},
      {text: 'Demo 数据', link: '/data/demo-data'},
      {text: 'GitHub', link: 'https://github.com/archebase/physical-ai-handbook'}
    ],
    sidebar: [{text: '课程路线', items: [{text: '总目录', link: '/guide/catalog'}]}, ...nav, {text: 'Demo 数据', items: [{text: '数据说明', link: '/data/demo-data'}]}],
    search: {provider: 'local'},
    outline: {level: [2, 3]},
    socialLinks: [{icon: 'github', link: 'https://github.com/archebase/physical-ai-handbook'}],
    footer: {message: 'ArcheBase · Physical AI Handbook', copyright: 'Content source: ArcheBase Feishu course tree'}
  },
  markdown: {config: (md) => md.use(mathjax3)}
});
