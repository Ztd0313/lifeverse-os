# LifeVerse 开发规范

> 版本：v1.0.0  
> 最后更新：2026-06-22  
> 维护人：David Kim（技术总监）、James Park（高级前端）

本规范适用于 LifeVerse 全栈项目（Next.js 15 + TypeScript + TailwindCSS），所有贡献者必须遵守。

---

## 目录

1. [代码规范](#1-代码规范)
2. [Git 工作流](#2-git-工作流)
3. [环境管理](#3-环境管理)
4. [部署流程](#4-部署流程)
5. [性能要求](#5-性能要求)
6. [安全规范](#6-安全规范)

---

## 1. 代码规范

### 1.1 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 文件名（组件） | PascalCase | `Header.tsx`、`AgentCard.tsx` |
| 文件名（工具/库） | kebab-case | `mock-memories.ts`、`openai-client.ts` |
| 文件名（API 路由） | 小写 | `route.ts` |
| 文件夹名 | kebab-case | `agent-card/`、`meeting-room/` |
| 变量/函数 | camelCase | `getAgentById`、`councilCount` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRIES`、`DEFAULT_MODEL` |
| 类型/接口 | PascalCase | `Persona`、`CouncilState` |
| 枚举值 | 字符串字面量联合类型 | `'wisdom' \| 'future'` |
| React 组件 | PascalCase | `function Header() {}` |
| React Hook | camelCase + `use` 前缀 | `useCouncilStore` |
| CSS 类名 | TailwindCSS 优先 | `text-gold`、`bg-bg-card` |
| 环境变量 | UPPER_SNAKE_CASE | `DEEPSEEK_API_KEY`、`NEXT_PUBLIC_APP_URL` |

### 1.2 文件结构

项目目录结构遵循 Next.js App Router 约定：

```
src/
├── app/                    # 路由与页面
│   ├── api/                # API 路由（route.ts）
│   ├── admin/              # 管理后台
│   ├── council/            # 议会页面
│   ├── memory/             # 记忆星球
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── components/             # React 组件
│   ├── admin/              # 管理后台组件
│   ├── council/            # 议会相关组件
│   ├── layout/             # 布局组件（Header/Footer）
│   ├── ui/                 # 通用 UI 组件（Button/Card/Badge）
│   └── __tests__/          # 组件测试
├── lib/                    # 工具库与业务逻辑
│   ├── ai/                 # AI 客户端与引擎
│   ├── brand/              # 品牌与 SEO
│   ├── motion/             # 动画工具
│   ├── supabase/           # 数据库客户端
│   ├── agents.ts           # Agent 定义
│   ├── mock-memories.ts    # Mock 数据
│   └── utils.ts            # 通用工具函数
├── stores/                 # Zustand 状态管理
├── types/                  # TypeScript 类型定义
│   └── index.ts            # 全局类型
```

**规则：**
- 每个页面目录下只能有一个 `page.tsx`，复杂页面拆分为子组件放入 `components/` 对应子目录
- 组件文件名与默认导出名一致（如 `Header.tsx` 导出 `Header`）
- 类型定义集中在 `src/types/index.ts`，跨模块共享的类型必须从此处导出
- Mock 数据统一放在 `src/lib/` 下，文件名以 `mock-` 前缀

### 1.3 导入导出规范

**导入顺序（按组分隔，组间空行）：**

```typescript
// 1. React / Next.js 核心
import * as React from 'react';
import Link from 'next/link';

// 2. 第三方库
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

// 3. 项目内模块（使用 @/ 别名）
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// 4. 类型导入（使用 import type）
import type { Persona } from '@/types';
```

**导出规则：**
- 组件使用命名导出 + 默认导出双模式
- 工具函数仅使用命名导出
- 类型使用 `export interface` / `export type`
- 禁止使用 `export *`，必须显式列出导出项

```typescript
// ✅ 正确
export function getAgentById(id: string): Persona | undefined { ... }
export default Header;

// ❌ 错误
export * from './utils';
```

### 1.4 TypeScript 规范

- **strict mode 必须开启**（`tsconfig.json` 中 `"strict": true`）
- 禁止使用 `any`，必须使用 `unknown` + 类型守卫
- 函数参数与返回值必须显式标注类型
- 优先使用 `interface` 描述对象，`type` 描述联合类型
- 使用 `as const` 断言常量数组/对象

```typescript
// ✅ 正确
const NAV_LINKS = [
  { href: '/council/wisdom', label: '智慧议会' },
] as const;

function getAgentById(id: string): Persona | undefined { ... }

// ❌ 错误
const data: any = await fetch(...);
function getAgent(id) { ... }
```

### 1.5 React 规范

- 所有需要交互的组件必须标记 `'use client'`
- 使用函数组件，禁止使用 class 组件
- 状态管理优先使用 `useState` / `useReducer`，跨页面共享使用 Zustand
- 副作用使用 `useEffect`，必须返回清理函数（如有）
- 列表渲染必须提供稳定的 `key`
- 事件处理函数命名：`handle{Event}`（如 `handleClick`、`handleSubmit`）

### 1.6 样式规范

- 优先使用 TailwindCSS 工具类，避免手写 CSS
- 复用样式通过 `cn()` 工具函数组合（基于 `clsx` + `tailwind-merge`）
- 主题色通过 `tailwind.config.ts` 中定义的语义色（`bg`、`gold`、`text` 等）
- 禁止使用内联 `style` 属性（动态值除外，如 SVG 坐标、进度条宽度）
- 响应式断点：`sm: 640px`、`md: 768px`、`lg: 1024px`

### 1.7 注释规范

- 所有导出的函数/类/接口必须添加 JSDoc 注释
- 复杂逻辑必须添加行内注释解释「为什么」而非「做什么」
- TODO 注释格式：`// TODO(姓名): 描述`

```typescript
/**
 * 获取 DeepSeek 客户端单例
 *
 * @returns OpenAI 兼容客户端实例，若未配置 API key 则返回 null
 */
export function getOpenAIClient(): OpenAI | null { ... }
```

---

## 2. Git 工作流

### 2.1 分支策略

采用 Git Flow 简化版：

| 分支 | 用途 | 命名规则 |
|------|------|----------|
| `main` | 生产环境代码，受保护 | 固定 |
| `develop` | 集成测试分支 | 固定 |
| `feature/*` | 新功能开发 | `feature/council-streaming` |
| `fix/*` | Bug 修复 | `fix/header-settings-link` |
| `hotfix/*` | 生产紧急修复 | `hotfix/api-timeout` |
| `release/*` | 发布准备 | `release/v5.1.0` |

**规则：**
- `main` 与 `develop` 分支禁止直接 push，必须通过 PR 合并
- feature/fix 分支从 `develop` 拉出，完成后 PR 回 `develop`
- hotfix 分支从 `main` 拉出，修复后同时 PR 回 `main` 和 `develop`
- 分支名使用 kebab-case，全小写

### 2.2 提交规范

采用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type 取值：**

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（非新功能、非修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |
| `ci` | CI 配置变更 |

**示例：**

```
feat(admin): 新增管理后台 Dashboard 仪表盘

- 统计卡片（总用户/日活/议会数/记忆数）
- 7 天议会趋势折线图
- 最近 10 条议会记录表格
- 热门 Agent 排行

Closes #42
```

```
fix(header): 设置按钮改为 Link 跳转到 /settings

原 button 无导航行为，改为 next/link 组件。
```

**规则：**
- subject 不超过 50 字，使用中文（与项目语言一致）
- body 每行不超过 72 字
- 一个提交只做一件事，禁止混合多个不相关变更
- 禁止使用 `git push --force` 到受保护分支

### 2.3 PR 流程

1. **创建 PR**：从 feature/fix 分支向 `develop` 发起 PR
2. **PR 标题**：与首个提交的 subject 一致
3. **PR 描述**：必须包含
   - 变更说明（What & Why）
   - 测试方式（How to test）
   - 截图（UI 变更必须）
   - 关联 Issue（`Closes #xxx`）
4. **代码审查**：至少 1 名团队成员 Approve
5. **CI 检查**：所有 CI 检查通过（lint + type-check + test + build）
6. **合并**：使用 Squash Merge，保持提交历史整洁
7. **删除分支**：合并后自动删除 feature 分支

**审查清单：**
- [ ] 代码符合规范
- [ ] 无 TypeScript 类型错误
- [ ] 无 ESLint 警告
- [ ] 新增功能有对应测试
- [ ] 无敏感信息泄露（API Key、密码等）
- [ ] 性能无明显回退

---

## 3. 环境管理

### 3.1 环境划分

| 环境 | 用途 | URL | 分支 |
|------|------|-----|------|
| Local | 本地开发 | `http://localhost:3000` | feature/* |
| Development | 集成测试 | `https://dev.lifeverse.app` | develop |
| Staging | 预发布验证 | `https://staging.lifeverse.app` | release/* |
| Production | 生产环境 | `https://lifeverse.app` | main |

### 3.2 环境变量管理

**规则：**
- 所有环境变量在 `.env.example` 中记录占位符
- 实际值通过部署平台（阿里云/Verce）的 Secret Management 注入
- 禁止将真实密钥提交到 Git
- 前端可访问的变量必须以 `NEXT_PUBLIC_` 前缀
- 服务端变量（API Key、数据库密码）不加前缀

**核心环境变量：**

```bash
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AI（DeepSeek，兼容 OpenAI 协议）
DEEPSEEK_API_KEY=sk-xxx
# OpenAI（可选备用）
OPENAI_API_KEY=sk-xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3.3 本地开发环境

**前置要求：**
- Node.js >= 18.18.0（推荐 20.x LTS）
- npm >= 9.x
- Git >= 2.40

**初始化：**

```bash
# 克隆仓库
git clone git@github.com:lifeverse/lifeverse-os.git
cd lifeverse-os

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local
# 编辑 .env.local 填入实际值

# 启动开发服务器
npm run dev
```

**常用命令：**

```bash
npm run dev          # 启动开发服务器（热重载）
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
npm run type-check   # TypeScript 类型检查（tsc --noEmit）
npm test             # 运行 Jest 单元测试
npm run test:e2e     # 运行 Playwright E2E 测试
```

---

## 4. 部署流程

### 4.1 阿里云部署架构

```
                    ┌─────────────┐
                    │   CDN/SLB   │  阿里云 CDN + 负载均衡
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Nginx 反代 │  ECS 上的 Nginx
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Next.js    │  PM2 管理的 Node.js 进程
                    │  (SSR/SSG)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼───┐ ┌──────▼──────┐
       │  Supabase   │ │Redis │ │  DeepSeek   │
       │  (PostgreSQL)│ │缓存  │ │  AI API     │
       └─────────────┘ └──────┘ └─────────────┘
```

### 4.2 部署步骤（阿里云 ECS）

**1. 服务器准备**

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

**2. 代码部署**

```bash
# 克隆代码到部署目录
cd /var/www
git clone git@github.com:lifeverse/lifeverse-os.git
cd lifeverse-os

# 安装依赖（仅生产依赖）
npm ci --production=false

# 构建生产版本
npm run build

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 填入生产环境密钥
```

**3. PM2 进程管理**

```bash
# 启动应用
pm2 start npm --name "lifeverse" -- start

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 status          # 查看状态
pm2 logs lifeverse  # 查看日志
pm2 restart lifeverse  # 重启
```

**4. Nginx 配置**

```nginx
server {
    listen 80;
    server_name lifeverse.app;

    # 重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lifeverse.app;

    ssl_certificate /etc/ssl/certs/lifeverse.pem;
    ssl_certificate_key /etc/ssl/private/lifeverse.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

**5. SSL 证书**

```bash
# 使用 Let's Encrypt 免费证书
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lifeverse.app -d www.lifeverse.app
```

### 4.3 CI/CD 流程

通过 GitHub Actions 自动化（`.github/workflows/deploy.yml`）：

1. **触发条件**：push 到 `main` 分支或打 tag
2. **构建阶段**：lint → type-check → test → build
3. **部署阶段**：SSH 到 ECS → git pull → npm ci → npm run build → pm2 reload
4. **健康检查**：部署后请求健康检查接口
5. **回滚**：失败时自动回滚到上一版本

### 4.4 发布检查清单

- [ ] 所有 CI 检查通过
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npm run lint` 无警告
- [ ] 单元测试覆盖率 >= 80%
- [ ] E2E 测试全部通过
- [ ] 生产环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 健康检查接口正常
- [ ] 监控告警已配置

---

## 5. 性能要求

### 5.1 首屏加载

| 指标 | 目标值 | 测量工具 |
|------|--------|----------|
| FCP（First Contentful Paint） | < 1.2s | Lighthouse |
| LCP（Largest Contentful Paint） | < 2.0s | Lighthouse |
| FID（First Input Delay） | < 100ms | Lighthouse |
| CLS（Cumulative Layout Shift） | < 0.1 | Lighthouse |
| TTI（Time to Interactive） | < 3.0s | Lighthouse |
| Lighthouse 性能评分 | >= 90 | Lighthouse |

**优化策略：**
- 使用 Next.js App Router 的 Server Components 减少客户端 JS 体积
- 图片使用 `next/image` 自动优化（WebP/AVIF + 响应式尺寸）
- 字体使用 `next/font` 自托管，避免 FOIT/FOUT
- 第三方库按需导入，避免全量引入
- 关键路由预加载（`<Link prefetch>`）
- 静态页面使用 SSG，动态页面使用 SSR + ISR

### 5.2 API 响应时间

| 接口类型 | P50 | P95 | P99 |
|----------|-----|-----|-----|
| 只读接口（GET） | < 100ms | < 300ms | < 500ms |
| 写入接口（POST/PUT） | < 200ms | < 500ms | < 1s |
| AI 接口（/api/council） | < 5s | < 15s | < 30s |
| AI 接口（/api/agent） | < 2s | < 8s | < 15s |

**优化策略：**
- 数据库查询添加索引，避免 N+1 查询
- 使用 Redis 缓存热点数据（TTL 5-15 分钟）
- AI 请求使用流式响应（SSE），避免长等待
- API 路由设置 `maxDuration` 防止超时
- 使用 `Promise.all` 并行化无依赖请求

### 5.3 资源体积

| 资源 | 限制 |
|------|------|
| 首页 JS Bundle（gzip） | < 150KB |
| 单页 JS Bundle（gzip） | < 200KB |
| 首页 CSS（gzip） | < 30KB |
| 单张图片（压缩后） | < 200KB |
| 字体文件 | < 100KB/种 |

### 5.4 可用性

| 指标 | 目标值 |
|------|--------|
| 可用性（Uptime） | >= 99.9% |
| 月度停机时间 | < 43 分钟 |
| 错误率（5xx） | < 0.1% |
| API 成功率 | >= 99.5% |

---

## 6. 安全规范

### 6.1 API Key 管理

**规则：**
- 所有 API Key / 密钥必须通过环境变量注入，禁止硬编码到源码
- `.env.local` / `.env.production` 必须加入 `.gitignore`
- 生产环境密钥通过阿里云 KMS 或部署平台 Secret Management 管理
- 密钥轮换周期：每 90 天轮换一次
- 密钥泄露应急流程：立即吊销 → 生成新密钥 → 更新部署 → 审查日志

**当前项目的密钥清单：**

| 密钥 | 用途 | 存储位置 |
|------|------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek AI 调用 | 环境变量 |
| `SUPABASE_SERVICE_ROLE_KEY` | 数据库服务端访问 | 环境变量 |
| `CLERK_SECRET_KEY` | 认证服务 | 环境变量 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | 认证客户端 | 环境变量（前端可见） |

### 6.2 XSS 防护

**规则：**
- React 默认转义 JSX 插值，禁止使用 `dangerouslySetInnerHTML`
- 用户输入必须经过 sanitize 后再渲染（使用 `DOMPurify`）
- 富文本内容存储前过滤危险标签（`<script>`、`<iframe>`、`on*` 事件属性）
- CSP（Content Security Policy）头必须配置

**Next.js CSP 配置示例（`next.config.ts`）：**

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.deepseek.com https://*.supabase.co;
  frame-ancestors 'none';
`;
```

### 6.3 CSRF 防护

**规则：**
- 所有写操作（POST/PUT/DELETE）必须验证 CSRF Token
- 使用 SameSite=Strict 或 SameSite=Lax 的 Cookie
- API 路由验证 `Origin` / `Referer` 头
- 敏感操作（删除、支付）增加二次确认

### 6.4 认证与授权

**规则：**
- 使用 Clerk 作为认证服务，禁止自实现认证逻辑
- 服务端 API 路由必须验证用户身份（`auth()` 中间件）
- 管理后台路由必须验证管理员角色（RBAC）
- 数据库访问使用 RLS（Row Level Security）策略
- Session Token 有效期不超过 7 天，支持刷新

### 6.5 数据安全

**规则：**
- 密码使用 bcrypt 哈希存储（cost factor >= 12）
- 敏感数据（邮箱、手机号）存储前加密
- 数据库备份加密存储，保留 30 天
- 日志中禁止打印用户敏感信息（脱敏处理）
- HTTPS 强制启用，HSTS 头配置

### 6.6 输入校验

**规则：**
- 所有 API 请求体使用 Zod Schema 校验
- 字符串输入限制最大长度，防止缓冲区溢出
- 数字输入校验范围
- 文件上传校验 MIME 类型与大小

```typescript
import { z } from 'zod';

const CouncilSchema = z.object({
  question: z.string().min(1).max(500),
  agentIds: z.array(z.string()).optional(),
  councilType: z.enum(['wisdom', 'future', 'inner', 'reunion']).optional(),
  rounds: z.number().int().min(1).max(3).optional(),
});
```

### 6.7 限流与防刷

**规则：**
- API 限流：每用户每分钟 60 次请求
- AI 接口限流：每用户每分钟 10 次请求
- 登录限流：每 IP 每分钟 5 次失败尝试
- 使用 Redis + 滑动窗口算法实现限流
- 超出限流返回 `429 Too Many Requests`

### 6.8 依赖安全

**规则：**
- 定期运行 `npm audit` 检查已知漏洞
- 依赖更新频率：每月一次
- 重大版本升级需在独立分支测试
- 禁止使用未维护（> 2 年未更新）的依赖
- 锁文件 `package-lock.json` 必须提交

---

## 附录

### A. 推荐的 VSCode 扩展

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens
- Error Lens

### B. 推荐的 Chrome 扩展

- React Developer Tools
- Redux DevTools
- Lighthouse
- axe DevTools（无障碍检查）

### C. 参考文档

- [Next.js 15 文档](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
