# TailorBoost 官网（tbseo-site）

[TailorBoost](https://tailorboost.com) 企业官网，基于 **Nuxt 4** 与 [nuxtcms](https://github.com/guxingbiao0507/nuxtcms) 层构建，支持中英双语，部署在 **Cloudflare Pages**，数据存储于 **D1**，静态媒体资源托管于 **R2**。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Nuxt 4、Vue 3、Nuxt UI 4、Tailwind CSS 4 |
| CMS 层 | nuxtcms（Drizzle ORM + libSQL） |
| 国际化 | @nuxtjs/i18n（`prefix_except_default`） |
| SEO | @nuxtjs/seo、自定义 Sitemap API、Schema.org |
| 部署 | Cloudflare Pages + D1 + R2 |
| 包管理 | pnpm 10（Node.js ≥ 20） |

---

## 项目结构

```
tbseo-site/
├── app/                        # 站点前端（页面、组件、布局、样式）
│   ├── components/pages/       # 各页面主体组件
│   ├── composables/            # useSiteAsset、useLocaleData 等
│   ├── layouts/                # default（前台）、admin（后台）
│   ├── pages/                  # 路由页面（en 默认 + cn 前缀）
│   └── plugins/                  # gtag 等客户端插件
├── i18n/locales/               # en.json、cn.json 文案
├── public/
│   ├── images/                 # 主题图、Logo（14 张）
│   ├── uploads/blog/           # 博客封面（本地 + R2）
│   └── BingSiteAuth.xml        # Bing 站长验证
├── scripts/                    # 构建、部署、导入、运维脚本
├── server/api/__sitemap__/     # 动态 Sitemap 数据源
├── nuxt.config.ts              # Nuxt / i18n / SEO / CSP 配置
├── wrangler.toml               # D1 / R2 绑定
├── .env                        # 本地开发环境变量（不提交）
└── .cloudflare.env             # Cloudflare API 凭证（不提交）
```

---

## 快速开始

### 1. 安装依赖

```bash
corepack enable
pnpm install
```

> `nuxtcms` 为私有 GitHub 依赖。本地需能访问 `github.com/guxingbiao0507/nuxtcms`；Cloudflare 构建需在环境变量中配置 `GITHUB_TOKEN`。

### 2. 本地环境变量

创建 `.env`：

```env
DATABASE_URL=file:.data/tbseo.sqlite
```

### 3. 初始化管理员与站点设置

```bash
pnpm run install:admin
```

脚本会创建 CMS 管理员账号、写入站点名称与 Analytics 相关配置。首次登录后请在后台修改密码。

### 4. 启动开发服务器

```bash
pnpm dev
```

默认地址：`http://localhost:3000`（端口以终端输出为准）。

---

## 路由与国际化

| 语言 | 策略 | 示例 |
|------|------|------|
| English（默认） | 无前缀 | `/`、`/blog`、`/about` |
| 简体中文 | `/cn` 前缀 | `/cn`、`/cn/blog`、`/cn/about` |

主要页面：首页、关于、服务、案例、博客、联系。后台管理：`/admin`。

配置位置：`nuxt.config.ts` → `i18n` 段。

---

## 脚本一览

### 日常开发

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Nuxt 开发服务器 |
| `pnpm build` | 标准 Nuxt 构建 |
| `pnpm build:cf` | Cloudflare Pages 预设构建 + patch worker |

### Cloudflare 部署

| 命令 | 说明 |
|------|------|
| `pnpm run cf:build` | Git 部署用构建入口（见 `scripts/cf-pages-build.mjs`） |
| `pnpm run configure:cf` | 通过 API 同步 CF Pages 构建命令与环境变量 |
| `pnpm run deploy` | 手动部署到 Cloudflare Pages |
| `pnpm run deploy:migrate` | 部署并执行 D1 数据库迁移 |
| `pnpm run deploy:all` | 部署 + 上传静态资源到 R2 |

### 静态资源

| 命令 | 说明 |
|------|------|
| `pnpm run download:images` | 从 WordPress CDN 下载主题图到 `public/images/` |
| `pnpm run sync:assets` | 镜像 `public/` 资源到 `.data/uploads/`（本地 `/api/media/`） |
| `pnpm run upload:r2` | 上传 `public/images/` 与 `public/uploads/` 到 R2 bucket `tbseo` |

### 内容与数据

| 命令 | 说明 |
|------|------|
| `pnpm run import:blog` | 从 tailorboost.com 导入博客文章 |
| `pnpm run import:blog:replace` | 全量替换导入（含封面下载到 `public/uploads/blog/`） |
| `pnpm run install:admin` | 创建管理员、写入站点与 Analytics 设置 |
| `pnpm run seed:d1` | 将本地 SQLite 数据同步到远程 D1 |

### 脚本文件说明

| 文件 | 用途 |
|------|------|
| `scripts/cf-pages-build.mjs` | CF Git 构建：Nuxt build + patch worker |
| `scripts/cf-pages-install.sh` | CF 构建前安装依赖（配置 GitHub HTTPS + pnpm install） |
| `scripts/configure-cf-pages.mjs` | 批量设置 CF Pages 构建与环境变量 |
| `scripts/upload-public-to-r2.mjs` | R2 上传与本地 media 镜像 |
| `scripts/sync-local-assets.mjs` | 本地 media 目录同步 |
| `scripts/download-theme-images.mjs` | 主题图下载 |
| `scripts/import-tailorboost-blog.mjs` | 博客爬虫导入 |
| `scripts/deploy-with-r2.mjs` | 部署 + R2 一键流程 |
| `scripts/seed-d1-remote.mjs` | 本地 DB → 远程 D1 |
| `scripts/install-admin.mjs` | 管理员与站点初始化 |

> 以下脚本为历史遗留（旧站内容迁移），当前 TailorBoost 站点一般不需要：`seed.ts`、`scrape-content.mjs`、`import-content.mjs`、`upload-content-imgs.mjs`、`verify-scrape.cjs`、`inspect-product.mjs`、`seed-translations.ts`。

---

## SEO 与 Analytics

### 站点元信息

- **站点名称**：TailorBoost
- **Canonical 域名**：`https://tailorboost.com`（通过 `NUXT_PUBLIC_SITE_URL` 覆盖）
- **默认 Title 模板**：`%s | TailorBoost`
- **Favicon**：`/images/logo1.png`（`/favicon.ico` 等路径 301 重定向至此）

### Sitemap

- 模块：`@nuxtjs/seo`
- 分语言 Sitemap：`/sitemap_en.xml`、`/sitemap_cn.xml`
- 动态数据源：`server/api/__sitemap__/urls.get.ts`
  - 静态页面：首页、关于、博客列表、服务、案例、联系
  - 动态页面：已发布博客文章（含 `lastmod`）
  - 每条 URL 含 `hreflang`  alternate（en-US / zh-CN）

### 结构化数据

`app/app.vue` 注入 Organization Schema（JSON-LD），包含公司名称、描述、联系方式。

### 站长验证与统计

| 服务 | 配置位置 | ID / 文件 |
|------|----------|-----------|
| Google Analytics 4 | `app/plugins/gtag.client.ts` | `GT-TNC4SKVD` |
| Google Search Console | `app/app.vue` meta | `vTlCwi7aR1KIiK_bYP-lBwWIspwnONuIMKB2OFnpLDY` |
| Bing Webmaster | `public/BingSiteAuth.xml` + CMS 设置 | `8690095404B1D2C9E27332A5E5C889CE` |
| Microsoft Clarity | `app/app.vue` script | `rrkm4zjn1o` |

Analytics ID 同时写入 CMS 设置表，可通过 `pnpm run install:admin` 初始化。

### 安全与缓存

- **CSP**：`nuxt.config.ts` → `routeRules`，允许 GA、Clarity、GTM、jsDelivr 等域名
- **静态资源缓存**：`/images/**`、`/uploads/**` 设置 `max-age=31536000, immutable`
- **404 页**：`app/error.vue`，中英双语，10 秒倒计时自动跳转首页

---

## 静态资源与 R2

### 目录说明

| 路径 | 说明 |
|------|------|
| `public/images/` | 主题营销图、Logo、案例演示图 |
| `public/uploads/blog/` | 博客封面（数据库 `coverImage` 字段引用） |

### 资源解析

`app/composables/useSiteAsset.ts`：

- **开发 / 未启用 R2**：直接访问 `/images/...`、`/uploads/...`
- **生产 + `NUXT_PUBLIC_USE_R2_MEDIA=true`**：映射到 `/api/media/static/images/...` 或 `/api/media/uploads/...`

### R2 对象键规则

| 本地路径 | R2 Key |
|----------|--------|
| `public/images/logo1.png` | `static/images/logo1.png` |
| `public/uploads/blog/en-xxx.png` | `uploads/blog/en-xxx.png` |

上传命令：

```bash
pnpm run upload:r2
```

需配置 `.cloudflare.env`（参考 `.cloudflare.env.example`）。

---

## 部署

### Cloudflare 资源

| 资源 | 名称 |
|------|------|
| Pages 项目 | `tbseo` |
| D1 数据库 | `tbseo` |
| R2 Bucket | `tbseo` |

### Git 自动部署（推荐）

Cloudflare Pages 构建设置：

| 项 | 值 |
|----|-----|
| **Build command** | `bash scripts/cf-pages-install.sh && pnpm run cf:build` |
| **Build output** | `dist` |
| **Node.js** | 20 |

Production 环境变量：

| 变量 | 说明 |
|------|------|
| `NUXT_PUBLIC_SITE_URL` | 正式域名，如 `https://tailorboost.com` |
| `NUXT_PUBLIC_USE_R2_MEDIA` | `true` — 生产环境从 R2 提供图片 |
| `SKIP_DEPENDENCY_INSTALL` | `1` — 跳过 CF 默认安装，使用自定义脚本 |
| `GITHUB_TOKEN` | 私有 nuxtcms 依赖的 GitHub PAT（secret） |
| `NUXT_JWT_SECRET` | JWT 密钥（secret） |
| `NUXT_SESSION_PASSWORD` | Session 加密密钥（secret） |

一键同步 CF Pages 配置（需 `.cloudflare.env`）：

```bash
pnpm run configure:cf
```

### 手动部署

```bash
# 仅部署
pnpm run deploy

# 部署 + 数据库迁移
pnpm run deploy:migrate

# 部署 + R2 上传
pnpm run deploy:all

# 本地博客数据同步到远程 D1
pnpm run seed:d1
```

---

## 后台管理

- **地址**：`/admin`
- **初始化**：`pnpm run install:admin`
- **功能**：文章管理、站点设置、Analytics 配置等（由 nuxtcms 提供）

本地开发数据库默认路径：`.data/tbseo.sqlite`。

---

## 环境变量参考

### `.env`（本地开发）

```env
DATABASE_URL=file:.data/tbseo.sqlite
```

### `.cloudflare.env`（部署脚本，勿提交）

```env
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CF_PAGES_PROJECT=tbseo
CF_D1_DATABASE=tbseo
CF_R2_BUCKET=tbseo
GITHUB_TOKEN=...          # 可选，configure:cf 会同步到 Pages
NUXT_PUBLIC_SITE_URL=...  # 可选
```

完整说明见 [`.cloudflare.env.example`](.cloudflare.env.example)。

---

## 常用工作流

### 新博客导入

```bash
pnpm run import:blog:replace   # 导入文章 + 下载封面
pnpm run upload:r2             # 上传封面到 R2
pnpm run seed:d1               # 同步到远程 D1（如需要）
```

### 更新主题图

```bash
pnpm run download:images
pnpm run upload:r2
git add public/images && git commit -m "update theme images"
```

### 首次上线 checklist

- [ ] 配置 CF Pages 环境变量（含 `GITHUB_TOKEN`）
- [ ] 运行 `pnpm run configure:cf`
- [ ] 执行 `pnpm run upload:r2` 上传静态资源
- [ ] 运行 `pnpm run deploy:migrate` 或 Git push 触发构建
- [ ] 运行 `pnpm run seed:d1` 同步 CMS 数据
- [ ] 验证 Sitemap、GA4、Bing / Google 站长工具

---

## 许可证

Private — TailorBoost 内部项目。
