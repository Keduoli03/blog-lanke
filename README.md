# Ditto's Blog

基于 [Gyoza](https://github.com/lxchapu/astro-gyoza) 主题二次开发的个人博客，源码：[blog-lanke](https://github.com/Keduoli03/blog-lanke)。

![astro version](https://img.shields.io/badge/astro-7.0-red)

## ✨ Features

- 基于 Gyoza 主题深度定制，大幅重构交互与视觉
- Swup 页面过渡动画，流畅的 SPA 体验
- 朋友圈（Memos）集成
- 社交链接快捷入口
- 夜间模式 / 强调色切换
- 评论系统（Artalk）
- RSS 订阅 & 站点地图
- LLMs.txt 支持
- Pagefind 全文搜索
- SEO 友好的 URL 与 OpenGraph 信息
- 响应式设计，移动端深度适配

## 🔧 Tech Stack

- [Astro 7](https://astro.build/)
- [React 19](https://reactjs.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Swup](https://swup.js.org/)
- [Artalk](https://artalk.js.org/)

## 🚀 Quick Start

```bash
pnpm i
pnpm dev
```

访问 `localhost:4321`。

## 📦 Build & Deploy

```bash
pnpm build    # 构建到 ./dist/
pnpm preview  # 本地预览
```

部署于 [Vercel](https://vercel.com/)，推送到 `main` 分支自动部署。

## 📂 Project Structure

```text
src/
├── components/       # 组件
├── content/          # 文章 & 配置
├── layouts/          # 页面布局
├── pages/            # 路由页面
├── scripts/          # 前端脚本
├── styles/           # 样式
├── utils/            # 工具函数
└── config.json       # 站点配置
```

## 📝 License

MIT
