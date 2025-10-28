# 项目概览

这是一个基于 Hexo 的个人博客网站项目，部署在 GitHub Pages 上（https://edison-a-n.github.io/）。项目使用 Hexo 框架生成静态网站，包含多篇技术文章，主要涉及敏捷开发、DDD、Python、REST API、GraphQL、微服务、多租户等技术主题。

## 技术栈

- **框架**: Hexo 6.3.0
- **主题**: archer 主题
- **部署**: GitHub Pages
- **内容格式**: Markdown 文件

## 项目结构

- `_config.yml`: Hexo 站点配置文件
- `package.json`: Node.js 依赖配置
- `source/`: 源文件目录，包含文章、页面等
- `themes/`: 主题目录，当前使用 archer 主题
- `public/`: 生成的静态网站文件
- `scaffolds/`: 文章模板

## 主要功能

- 文章管理: 通过 Markdown 文件管理博客文章
- 主题定制: 使用 archer 主题进行页面展示
- 静态生成: 将 Markdown 文件转换为静态 HTML 页面
- 部署: 通过 hexo-deployer-git 部署到 GitHub Pages

## 文章内容

`source/_posts/` 目录下包含多篇技术文章，涵盖以下主题：
- 敏捷开发（Agile Design & Development）
- 领域驱动设计（DDD）
- Python 框架（Django, DRF, ASGI）
- API 设计（REST, GraphQL, MCP）
- 微服务架构
- 多租户系统
- LLM 应用
- 软件设计原则
- Git 工作流

## 构建与运行

- `npm run build`: 生成静态网站（hexo generate）
- `npm run server`: 启动本地服务器（hexo server）
- `npm run deploy`: 部署到 GitHub Pages（hexo deploy）
- `npm run clean`: 清理生成的文件（hexo clean）

## 开发约定

- 文章使用 Markdown 格式编写，位于 `source/_posts/` 目录
- 文章文件名格式为 `:title.md`
- 文章头部包含标题、日期、标签等元信息
- 使用 Mermaid 图表支持