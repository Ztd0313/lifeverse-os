# LifeVerse 部署指南

本文档描述如何将 LifeVerse 部署到生产环境。推荐使用 Vercel 部署，同时提供 Docker 备用方案。

---

## 目录

1. [前置条件](#1-前置条件)
2. [环境变量配置](#2-环境变量配置)
3. [Vercel 部署步骤](#3-vercel-部署步骤)
4. [Supabase 配置](#4-supabase-配置)
5. [Clerk 配置](#5-clerk-配置)
6. [域名配置](#6-域名配置)
7. [Docker 部署（备用方案）](#7-docker-部署备用方案)
8. [CI/CD 配置](#8-cicd-配置)
9. [故障排查](#9-故障排查)

---

## 1. 前置条件

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 20.x | 推荐 LTS 版本 |
| npm | 10.x | 随 Node.js 安装 |
| Git | 2.x | 版本控制 |
| Vercel 账户 | - | 部署平台 |
| Supabase 账户 | - | 数据库与存储 |
| Clerk 账户 | - | 用户认证 |
| OpenAI API Key | - | AI 对话能力 |

### 本地验证

```bash
# 克隆仓库
git clone https://github.com/lifeverse-ai/lifeverse.git
cd lifeverse

# 安装依赖
npm install --legacy-peer-deps

# 复制环境变量模板
cp .env.example .env.local
# 编辑 .env.local 填入实际密钥

# 启动开发服务器
npm run dev

# 运行测试
npm test              # 单元测试
npx playwright test   # E2E 测试

# 类型检查
npx tsc --noEmit

# 构建生产版本
npm run build
```

---

## 2. 环境变量配置

在 `.env.local`（本地开发）或 Vercel Dashboard（生产环境）中配置以下变量：

### 数据库（Supabase）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL（服务端） | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase 匿名密钥（服务端） | `eyJxxx` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（服务端） | `eyJxxx` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（客户端） | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥（客户端） | `eyJxxx` |

### 认证（Clerk）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 公钥（客户端） | `pk_xxx` |
| `CLERK_SECRET_KEY` | Clerk 密钥（服务端） | `sk_xxx` |

### AI（OpenAI）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | `sk-xxx` |

### 应用

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | 应用公开 URL | `https://lifeverse.ai` |

> **安全提示**：以 `NEXT_PUBLIC_` 开头的变量会暴露到客户端，切勿放入敏感密钥。

---

## 3. Vercel 部署步骤

### 方式一：通过 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **New Project**
3. 导入 GitHub 仓库 `lifeverse-ai/lifeverse`
4. Framework Preset 选择 **Next.js**
5. 配置以下选项：
   - **Build Command**: `npm run build`（默认）
   - **Install Command**: `npm install --legacy-peer-deps`
   - **Output Directory**: `.next`（默认）
6. 在 **Environment Variables** 中添加所有环境变量（见第 2 节）
7. 选择部署区域：**Hong Kong (hkg1)** — 面向亚太用户
8. 点击 **Deploy**

### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目根目录执行
vercel

# 首次部署会提示配置项目，按提示操作即可

# 部署到生产环境
vercel --prod
```

### vercel.json 配置说明

项目根目录的 `vercel.json` 已配置：
- **安装命令**：`npm install --legacy-peer-deps`（解决 peer dependency 冲突）
- **部署区域**：`hkg1`（香港，亚太低延迟）
- **安全响应头**：X-Content-Type-Options、X-Frame-Options、Referrer-Policy、HSTS、Permissions-Policy

---

## 4. Supabase 配置

### 创建项目

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 点击 **New Project**
3. 填写项目名称：`lifeverse`
4. 设置数据库密码（妥善保存）
5. 选择区域：**Southeast Asia (Singapore)** — 与 Vercel hkg1 区域就近
6. 点击 **Create new project**

### 初始化数据库

```bash
# 在 Supabase SQL Editor 中执行 database/schema.sql
# 或通过 Supabase CLI:
npx supabase db push
```

需要执行的 SQL 文件（按顺序）：
1. `database/schema.sql` — 创建扩展和基础结构
2. `database/users.sql` — 用户表
3. `database/agents.sql` — Agent 配置表
4. `database/memories.sql` — 记忆存储表
5. `database/meetings.sql` — 议会会议表
6. `database/messages.sql` — 议会消息表

### 获取 API 密钥

1. 进入 **Settings → API**
2. 复制以下值到环境变量：
   - **Project URL** → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`（仅服务端，切勿暴露）

### 配置 Row Level Security (RLS)

在 Supabase SQL Editor 中为每张表启用 RLS，确保用户只能访问自己的数据：

```sql
-- 示例：为 memories 表启用 RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的记忆"
  ON memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的记忆"
  ON memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. Clerk 配置

### 创建应用

1. 登录 [Clerk Dashboard](https://dashboard.clerk.com)
2. 点击 **Add Application**
3. 选择 **Next.js**
4. 配置认证方式：
   - Email/Password（必选）
   - Google OAuth（推荐）
   - Apple OAuth（推荐）
   - GitHub OAuth（可选）
5. 点击 **Create Application**

### 获取 API 密钥

1. 进入 **API Keys** 页面
2. 复制以下值到环境变量：
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### 配置回调 URL

在 Clerk Dashboard 的 **Paths** 设置中：
- **Sign In**: `/sign-in`
- **Sign Up**: `/sign-up`
- **After Sign In**: `/`
- **After Sign Up**: `/`

### 配置 Allowed Origins

在 **Domains** 页面添加：
- `http://localhost:3000`（开发环境）
- `https://lifeverse.ai`（生产环境）

---

## 6. 域名配置

### Vercel 域名绑定

1. 在 Vercel Dashboard → **Settings → Domains**
2. 添加自定义域名：`lifeverse.ai`
3. 添加 www 重定向：`www.lifeverse.ai` → `lifeverse.ai`
4. 按提示在域名注册商处添加 DNS 记录：
   - **A 记录**：`@` → `76.76.21.21`（Vercel Anycast IP）
   - **CNAME 记录**：`www` → `cname.vercel-dns.com`

### DNS 配置示例

| 类型 | 主机 | 值 | TTL |
|------|------|-----|-----|
| A | @ | 76.76.21.21 | Auto |
| CNAME | www | cname.vercel-dns.com | Auto |

### 等待 DNS 生效

DNS 传播通常需要几分钟到 48 小时。可在 Vercel Dashboard 查看域名状态：
- **Configuration** → DNS 记录已正确添加
- **Active** → SSL 证书已签发，域名可访问

---

## 7. Docker 部署（备用方案）

### 前置条件

需要在 `next.config.ts` 中启用 standalone 输出：

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ...其他配置
};
```

### 构建镜像

```bash
# 构建生产镜像
docker build -t lifeverse:latest .

# 运行容器
docker run -d \
  --name lifeverse \
  -p 3000:3000 \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_ANON_KEY=eyJxxx \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJxxx \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx \
  -e CLERK_SECRET_KEY=sk_xxx \
  -e OPENAI_API_KEY=sk-xxx \
  -e NEXT_PUBLIC_APP_URL=https://lifeverse.ai \
  lifeverse:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  lifeverse:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    restart: unless-stopped
```

---

## 8. CI/CD 配置

项目已配置 GitHub Actions 工作流：

### CI/CD 流水线（`.github/workflows/ci.yml`）

在 push 到 main 或提交 PR 时自动运行：
1. 安装依赖
2. TypeScript 类型检查（`tsc --noEmit`）
3. ESLint 代码规范检查
4. Jest 单元测试
5. 生产构建

### 部署流水线（`.github/workflows/deploy.yml`）

在 push 到 main 时自动部署到 Vercel 生产环境。

### 配置 GitHub Secrets

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加：
- `VERCEL_TOKEN` — Vercel API Token（在 Vercel Settings → Tokens 创建）
- `VERCEL_ORG_ID` — Vercel 组织 ID（在 Vercel Settings → General 查看）
- `VERCEL_PROJECT_ID` — Vercel 项目 ID（在项目 Settings → General 查看）

---

## 9. 故障排查

### 构建失败：peer dependency 冲突

**症状**：`npm install` 报错 `ERESOLVE could not resolve`

**解决**：使用 `--legacy-peer-deps` 标志：
```bash
npm install --legacy-peer-deps
```
此配置已在 `vercel.json` 和 CI 中预设。

### 构建失败：TypeScript 类型错误

**症状**：`npm run build` 报 TypeScript 错误

**解决**：
```bash
# 查看详细类型错误
npx tsc --noEmit

# 修复后重新构建
npm run build
```

### 运行时错误：Supabase 连接失败

**症状**：页面报错 `Supabase client not initialized`

**排查**：
1. 检查环境变量是否正确配置（`SUPABASE_URL`、`SUPABASE_ANON_KEY`）
2. 检查 Supabase 项目是否处于暂停状态（免费版闲置一周后自动暂停）
3. 检查网络是否可访问 Supabase URL

### 运行时错误：Clerk 认证失败

**症状**：登录页面白屏或报错

**排查**：
1. 检查 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 是否正确
2. 在 Clerk Dashboard → **Domains** 中确认域名已添加
3. 检查浏览器控制台是否有 CORS 错误

### 运行时错误：OpenAI API 调用失败

**症状**：议会页面 Agent 不回复或报错

**排查**：
1. 检查 `OPENAI_API_KEY` 是否有效
2. 检查 API 余额是否充足
3. 检查 API 速率限制
4. 查看服务端日志中的错误详情

### Vercel 部署后页面 404

**症状**：部分路由（如 `/council/wisdom`）返回 404

**排查**：
1. 确认对应页面文件存在于 `src/app/` 目录下
2. 检查动态路由参数是否正确
3. 查看构建日志中是否有页面编译错误

### E2E 测试超时

**症状**：`npx playwright test` 超时失败

**排查**：
1. 确保开发服务器已启动（`npm run dev`）
2. 议会流程包含动画延迟，超时已设置为 120s
3. 检查浏览器是否已安装：`npx playwright install chromium`

### 性能优化建议

1. 在 `next.config.ts` 中启用图片优化
2. 使用 `next/dynamic` 懒加载非首屏组件
3. 在 Supabase 中为常用查询字段创建索引
4. 配置 CDN 缓存策略（Vercel Edge Network 已默认启用）

---

## 联系与支持

- GitHub Issues: [lifeverse-ai/lifeverse/issues](https://github.com/lifeverse-ai/lifeverse/issues)
- Twitter: [@lifeverse_ai](https://twitter.com/lifeverse_ai)
