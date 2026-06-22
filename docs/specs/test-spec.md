# LifeVerse 测试规范文档

> **文档版本**：v1.0.0
> **负责人**：David Kim（技术总监 / QA 负责人）
> **最后更新**：2026-06-22
> **项目技术栈**：Next.js 15 + TypeScript + TailwindCSS + Zustand + Framer Motion

---

## 目录

1. [测试策略](#1-测试策略)
2. [单元测试规范](#2-单元测试规范)
3. [集成测试规范](#3-集成测试规范)
4. [E2E 测试规范](#4-e2e-测试规范)
5. [性能测试规范](#5-性能测试规范)
6. [安全测试规范](#6-安全测试规范)
7. [测试 CI/CD](#7-测试-cicd)
8. [Bug 管理流程](#8-bug-管理流程)

---

## 1. 测试策略

### 1.1 测试金字塔

LifeVerse 采用经典测试金字塔模型，确保测试覆盖面与执行效率的平衡：

```
        /\
       /E2E\          ← 10%：覆盖关键用户流程
      /------\
     / 集成测试 \      ← 20%：覆盖模块交互
    /----------\
   /   单元测试   \    ← 70%：覆盖函数与组件
  /--------------\
```

| 测试层级 | 占比 | 数量目标 | 执行时间 | 触发时机 |
|----------|------|----------|----------|----------|
| 单元测试 | 70% | 100+ | < 10s | 每次 commit |
| 集成测试 | 20% | 30+ | < 30s | PR 提交 |
| E2E 测试 | 10% | 20+ | < 5min | 合并主分支 / 部署前 |

### 1.2 覆盖率目标

| 模块类型 | 覆盖率目标 | 当前状态 | 说明 |
|----------|-----------|----------|------|
| 核心逻辑（utils / agents / stores） | 90%+ | 达标 | 工具函数、Agent 数据、状态管理 |
| 组件（components） | 70%+ | 待补充 | UI 组件渲染与交互 |
| 页面（app） | 50%+ | 待补充 | 页面加载与导航 |
| API 路由（api） | 80%+ | 待补充 | 接口输入输出验证 |

### 1.3 测试工具栈

| 工具 | 用途 | 版本 |
|------|------|------|
| Jest | 单元测试框架 | ^29.7.0 |
| Testing Library | React 组件测试 | ^16.1.0 |
| jest-environment-jsdom | DOM 环境模拟 | ^29.7.0 |
| Playwright | E2E 测试 | ^1.49.0 |
| TypeScript | 类型安全 | ^5.7.2 |
| next/jest | Next.js Jest 集成 | 15.1.0 |

---

## 2. 单元测试规范

### 2.1 框架与配置

- **框架**：Jest + Testing Library
- **配置文件**：`jest.config.ts`
- **Setup 文件**：`jest.setup.ts`（包含 next/navigation、next/link、framer-motion、matchMedia、ResizeObserver 的 mock）
- **测试环境**：jsdom
- **路径别名**：`@/` 映射到 `src/`

### 2.2 命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 测试文件 | `*.test.ts(x)` | `utils.test.ts`、`RadarChart.test.tsx` |
| 测试目录 | `__tests__/` | `src/lib/__tests__/`、`src/stores/__tests__/` |
| describe 块 | 模块名 — 功能描述 | `describe('cn() — Tailwind 类名合并')` |
| test 用例 | 行为描述（中文） | `test('应合并多个字符串类名')` |

### 2.3 测试结构

所有测试用例遵循 **Arrange-Act-Assert** 模式：

```typescript
test('应正确设置问题与类型', () => {
  // Arrange — 准备测试数据
  const question = '要不要辞职创业？';
  const type: QuestionType = 'career';

  // Act — 执行被测操作
  useCouncilStore.getState().setQuestion(question, type);

  // Assert — 验证结果
  const state = useCouncilStore.getState();
  expect(state.question).toBe(question);
  expect(state.questionType).toBe(type);
});
```

### 2.4 Mock 规范

| 依赖类型 | Mock 策略 | 示例 |
|----------|----------|------|
| 外部 API（OpenAI / Supabase） | 必须 mock | `jest.mock('@/lib/ai/openai-client')` |
| Next.js 路由 | 全局 mock（jest.setup.ts） | `jest.mock('next/navigation')` |
| next/link | 全局 mock（jest.setup.ts） | 渲染为 `<a>` 标签 |
| framer-motion | 全局 mock（jest.setup.ts） | 直接渲染子组件 |
| 浏览器 API（matchMedia / ResizeObserver） | 全局 mock（jest.setup.ts） | 提供桩实现 |
| Zustand persist | 测试前清除 localStorage | `window.localStorage.clear()` |

### 2.5 现有用例清单

#### utils 工具函数测试（28 个用例）

文件：`src/lib/__tests__/utils.test.ts`

| 模块 | 用例数 | 覆盖函数 |
|------|--------|----------|
| `cn()` — Tailwind 类名合并 | 4 | 字符串合并、假值过滤、条件类名、冲突解决 |
| `formatDate()` — 相对时间格式化 | 5 | 刚刚、分钟前、小时前、天前、完整日期 |
| `formatSessionNumber()` — 议会编号 | 1 | 格式验证 |
| `truncate()` — 文本截断 | 4 | 不截断、边界值、截断加省略号、空字符串 |
| `getConflictLevel()` — 冲突等级 | 6 | 激烈冲突、明显分歧、温和讨论、基本一致、边界值 |
| `radarPoint()` — 雷达图坐标 | 4 | 中心点、正上方、右上方、半径中点 |
| `generateId()` — ID 生成 | 3 | 类型验证、格式验证、唯一性 |
| `delay()` — 异步延迟 | 1 | 延迟时间验证 |

#### agents 数据测试（15 个用例）

文件：`src/lib/__tests__/agents.test.ts`

| 模块 | 用例数 | 覆盖内容 |
|------|--------|----------|
| AGENTS 数组 | 5 | 长度、必填字段、id 唯一性、radar 维度、类型验证 |
| `getAgentById()` | 3 | 有效 id、不存在 id、引用一致性 |
| `getAgentsByType()` | 3 | sage(7)、time(3)、relation(2) |
| 预设议会组合 | 4 | 智慧议会(7)、未来议会(3)、关系(2)、内心(6)、id 不重叠 |

#### RadarChart 组件测试（16 个用例）

文件：`src/components/__tests__/RadarChart.test.tsx`

| 模块 | 用例数 | 覆盖内容 |
|------|--------|----------|
| 基础渲染 | 3 | SVG 元素、尺寸、无障碍 title/desc |
| 单组数据集 | 2 | 多边形数量、数据点数量 |
| 多组数据集 | 2 | 多边形数量、数据点数量 |
| 标签显示 | 3 | 默认标签、隐藏标签、自定义标签 |
| 网格显示 | 3 | 默认网格、隐藏网格、刻度数值 |
| 数值标签 | 1 | showValues 渲染 |
| 自定义类名 | 1 | className 应用 |

---

## 3. 集成测试规范

### 3.1 API 路由测试

对 `src/app/api/` 下的路由进行集成测试，验证请求处理与响应格式。

| API 路由 | 测试内容 | 优先级 |
|----------|----------|--------|
| `/api/agent` | GET 返回 Agent 列表，POST 创建 Agent | P1 |
| `/api/council` | POST 发起议会，GET 获取议会列表 | P0 |

**测试要点**：
- Mock 外部 AI 服务（OpenAI / LangGraph）
- 验证请求参数校验（Zod schema）
- 验证错误状态码（400 / 401 / 500）
- 验证响应数据结构

### 3.2 Store 状态管理测试

对 Zustand Store 进行集成测试，验证状态流转与 action 组合。

| Store | 测试文件 | 测试内容 |
|-------|----------|----------|
| `council-store` | `src/stores/__tests__/council-store.test.ts` | 初始状态、setQuestion、setPersonas、addMessage、reset、incrementSession |
| `memory-store` | `src/stores/__tests__/memory-store.test.ts` | 初始状态、addMemory、deleteMemory、selectPlanet、selectMemory |

**测试要点**：
- 每个测试前重置 Store 状态
- council-store 使用 persist 中间件，需清除 localStorage
- 验证 action 副作用（如 addMessage 自动生成 id 和 timestamp）
- 验证 reset 保留 sessionNumber 的行为

### 3.3 组件组合测试

测试多个组件组合后的交互行为。

| 组合场景 | 测试内容 | 优先级 |
|----------|----------|--------|
| QuestionInput + MeetingRoom | 输入问题后触发议会流程 | P0 |
| PlanetNav + MemoryCard + MemoryDetail | 星球切换后记忆列表更新，点击卡片弹出详情 | P1 |
| AdminSidebar + DataTable | 侧边栏导航切换页面，表格数据加载 | P1 |
| AgentCard + RadarChart | Agent 卡片展示雷达图数据 | P2 |

---

## 4. E2E 测试规范

### 4.1 框架与配置

- **框架**：Playwright
- **配置文件**：`playwright.config.ts`
- **测试目录**：`./e2e`
- **基础 URL**：`http://localhost:3000`
- **浏览器**：Chromium（Desktop Chrome）
- **超时**：120s（议会流程含动画延迟）
- **并行执行**：`fullyParallel: true`
- **自动启动**：dev server（`npm run dev`）
- **语言**：`zh-CN`

### 4.2 测试场景清单

#### 前台页面（10 个页面）

| 页面 | 路由 | 测试文件 | 测试内容 |
|------|------|----------|----------|
| 首页 | `/` | `home.spec.ts` | 标题、模块卡片、导航、CTA 按钮 |
| 智慧议会 | `/council` | `council.spec.ts` | 问题输入、Agent 选择、完整议会流程、命运报告 |
| 未来议会 | `/council/future` | 待补充 | 未来自我对话流程 |
| 记忆星球 | `/memory` | `memory.spec.ts` | 星球导航、记忆卡片、上传弹窗 |
| 梦想档案 | `/dream` | 待补充 | 梦想列表与编辑 |
| 内心世界 | `/inner` | 待补充 | 内心人格对话 |
| 重逢 | `/reunion` | 待补充 | 重逢对话流程 |
| 历史 | `/history` | 待补充 | 历史记录列表与筛选 |
| 命运报告 | `/report/[id]` | 待补充 | 报告详情展示 |
| 设置 | `/settings` | 待补充 | 用户设置表单 |

#### 管理后台（8 个页面）

| 页面 | 路由 | 测试文件 | 测试内容 |
|------|------|----------|----------|
| Dashboard | `/admin` | `admin.spec.ts` | 统计卡片、趋势图、议会记录表格 |
| 用户管理 | `/admin/users` | `admin.spec.ts` | 用户列表、搜索、筛选、详情弹窗 |
| 议会管理 | `/admin/councils` | `admin.spec.ts` | 议会列表、筛选、详情、删除 |
| 记忆管理 | `/admin/memories` | 待补充 | 记忆列表与管理 |
| Agent 管理 | `/admin/agents` | 待补充 | Agent 配置与管理 |
| 内容管理 | `/admin/content` | 待补充 | 内容审核与管理 |
| 运营管理 | `/admin/operations` | 待补充 | 运营数据与操作 |
| 系统设置 | `/admin/settings` | 待补充 | 系统参数配置 |

### 4.3 页面流程测试

#### 议会完整流程（P0）

```
输入问题 → 选择 Agent → 召集议会 → 仪式动画 → 第一轮表态 → 第二轮质疑 → 第三轮共识 → 生成命运报告 → 查看时间线
```

验证点：
- 问题输入后"召集议会"按钮启用
- 7 位智者 Agent 默认全选
- 仪式动画显示"议会正在召集..."
- 三轮讨论标题正确显示
- 命运报告包含核心指数、维度分析、各方共识、免责声明
- "新建议会"与"查看命运时间线"按钮可用

#### 记忆上传流程（P1）

```
进入记忆星球 → 选择星球 → 点击"记录此刻" → 填写标题与内容 → 选择情感色调 → 保存记忆 → 验证新记忆出现在列表
```

验证点：
- 5 个星球导航可切换
- 每个星球显示对应记忆卡片
- 上传弹窗表单验证（标题与内容必填）
- 保存后弹窗关闭，新记忆出现在列表顶部

#### 管理后台操作流程（P1）

```
进入 Dashboard → 侧边栏导航 → 用户管理（搜索/筛选/查看详情）→ 议会管理（筛选/查看详情/删除）
```

验证点：
- Dashboard 显示 4 个统计卡片与趋势图
- 侧边栏 8 个导航项可点击切换
- 用户管理搜索与状态筛选正常工作
- 议会管理详情弹窗与删除确认流程

### 4.4 视觉回归测试

使用 Playwright 截图对比功能进行视觉回归测试：

```typescript
test('首页视觉回归', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('home.png', {
    maxDiffPixelRatio: 0.01,
    threshold: 0.2,
  });
});
```

| 页面 | 截图名称 | 视口 | 容差 |
|------|----------|------|------|
| 首页 | `home-desktop.png` | 1440x900 | 1% |
| 议会页面 | `council-desktop.png` | 1440x900 | 1% |
| 记忆星球 | `memory-desktop.png` | 1440x900 | 1% |
| 管理后台 Dashboard | `admin-dashboard.png` | 1440x900 | 1% |
| 首页（移动端） | `home-mobile.png` | 375x812 | 2% |

### 4.5 跨浏览器测试

| 浏览器 | 配置 | 优先级 | 说明 |
|--------|------|--------|------|
| Chromium | Desktop Chrome | P0 | 主力测试浏览器 |
| Firefox | Desktop Firefox | P1 | 渐变与动画兼容性 |
| WebKit | Desktop Safari | P1 | 字体渲染与布局差异 |
| Mobile Chrome | Pixel 5 | P2 | 移动端响应式 |
| Mobile Safari | iPhone 13 | P2 | iOS Safari 兼容性 |

---

## 5. 性能测试规范

### 5.1 Lighthouse CI 指标

| 指标 | 目标值 | 当前基线 | 说明 |
|------|--------|----------|------|
| Performance | >= 90 | 待测量 | 综合性能评分 |
| Accessibility | >= 90 | 待测量 | 无障碍评分 |
| Best Practices | >= 90 | 待测量 | 最佳实践评分 |
| SEO | >= 90 | 待测量 | SEO 评分 |

### 5.2 核心性能指标

| 指标 | 目标值 | 测量方式 | 说明 |
|------|--------|----------|------|
| 首屏加载时间（FCP） | < 3s | Lighthouse / Playwright | 首次内容绘制 |
| 最大内容绘制（LCP） | < 4s | Lighthouse | 最大内容绘制 |
| 累积布局偏移（CLS） | < 0.1 | Lighthouse | 视觉稳定性 |
| 首字节时间（TTFB） | < 600ms | Lighthouse | 服务器响应速度 |
| 交互延迟（INP） | < 200ms | Lighthouse | 用户交互响应 |

### 5.3 API 响应时间

| API 端点 | 目标响应时间 | 测试方法 |
|----------|-------------|----------|
| `GET /api/agent` | < 200ms | Playwright API 测试 |
| `POST /api/council` | < 500ms | Playwright API 测试 |
| 页面路由 SSR | < 500ms | Playwright 导航计时 |

### 5.4 动画帧率

| 场景 | 目标帧率 | 测量方式 |
|------|----------|----------|
| 粒子背景（桌面端） | 60fps | Chrome DevTools Performance |
| 粒子背景（移动端） | 30fps+ | Chrome DevTools Performance |
| 议会流程动画 | 60fps | Framer Motion 性能监控 |
| 星球切换动画 | 60fps | Playwright + Performance Observer |

**帧率测试示例**：

```typescript
test('粒子背景应保持 60fps', async ({ page }) => {
  await page.goto('/');
  const fps = await page.evaluate(async () => {
    return new Promise<number>((resolve) => {
      let frames = 0;
      const start = performance.now();
      function tick() {
        frames++;
        if (performance.now() - start >= 1000) {
          resolve(frames);
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  });
  expect(fps).toBeGreaterThanOrEqual(55); // 允许 5fps 误差
});
```

---

## 6. 安全测试规范

### 6.1 XSS 防护测试

| 测试项 | 测试方法 | 预期结果 |
|--------|----------|----------|
| 用户输入转义 | 在输入框注入 `<script>alert(1)</script>` | 脚本不执行，文本被转义 |
| 议会问题输入 | 注入 `<img src=x onerror=alert(1)>` | 不触发 onerror 事件 |
| 记忆标题与内容 | 注入恶意 HTML 标签 | 标签被转义为纯文本 |
| URL 参数注入 | 在 URL 中注入 `?q=<script>...</script>` | 参数被正确编码 |

### 6.2 CSRF 防护测试

| 测试项 | 测试方法 | 预期结果 |
|--------|----------|----------|
| 跨域请求拦截 | 从不同 origin 发起 POST 请求 | 请求被拒绝 |
| CSRF Token 验证 | 发送不带 Token 的 POST 请求 | 返回 403 |
| SameSite Cookie | 检查 Cookie 属性 | 包含 `SameSite=Lax` 或 `SameSite=Strict` |

### 6.3 API Key 泄露检测

| 测试项 | 测试方法 | 预期结果 |
|--------|----------|----------|
| 环境变量检查 | 搜索代码中的硬编码 Key | 无硬编码 API Key |
| 客户端 bundle 检查 | 检查构建产物中是否包含 Key | 客户端代码不含敏感 Key |
| `.env` 文件排除 | 检查 `.gitignore` | `.env` 已被排除 |
| Source Map 检查 | 检查生产构建的 source map | 不包含敏感信息 |

**自动化检测脚本**：

```bash
# 检查硬编码 API Key
grep -rn "sk-[a-zA-Z0-9]\{48\}" src/ --include="*.ts" --include="*.tsx"
grep -rn "OPENAI_API_KEY\s*=\s*['\"]sk-" src/ --include="*.ts"

# 检查 .env 是否在 .gitignore 中
grep ".env" .gitignore
```

### 6.4 输入验证测试

| 测试项 | 测试方法 | 预期结果 |
|--------|----------|----------|
| Zod schema 验证 | 发送不符合 schema 的数据 | 返回 400 错误 |
| 超长输入 | 输入超过限制的文本 | 被截断或返回错误 |
| 特殊字符 | 输入 SQL 注入尝试 | 被 Zod 验证拦截 |
| 空值处理 | 发送空 body 或缺失字段 | 返回 400 错误 |

---

## 7. 测试 CI/CD

### 7.1 CI/CD 流水线概览

```
PR 提交 → 单元测试 + 类型检查 → 代码审查 → 合并主分支 → 全量测试 + E2E → 部署前冒烟测试 → 生产部署
```

### 7.2 PR 提交触发

**触发条件**：向 `main` 分支发起 Pull Request

**执行任务**：

| 任务 | 命令 | 超时 | 必须通过 |
|------|------|------|----------|
| 类型检查 | `npx tsc --noEmit` | 60s | 是 |
| 单元测试 | `npx jest --coverage` | 120s | 是 |
| Lint 检查 | `npm run lint` | 60s | 是 |
| 构建验证 | `npm run build` | 180s | 是 |

**GitHub Actions 配置示例**：

```yaml
name: PR Check
on:
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx jest --coverage --silent
      - run: npm run lint
      - run: npm run build
```

### 7.3 合并主分支触发

**触发条件**：代码合并到 `main` 分支

**执行任务**：

| 任务 | 命令 | 超时 | 必须通过 |
|------|------|------|----------|
| 全量单元测试 | `npx jest --coverage` | 120s | 是 |
| E2E 测试 | `npx playwright test` | 600s | 是 |
| 构建验证 | `npm run build` | 180s | 是 |
| 覆盖率报告 | 生成并上传 | - | 否（仅报告） |

### 7.4 部署前触发

**触发条件**：准备部署到生产环境

**执行任务（冒烟测试）**：

| 任务 | 命令 | 超时 | 必须通过 |
|------|------|------|----------|
| 冒烟单元测试 | `npx jest --testPathPattern="utils|agents" --silent` | 30s | 是 |
| 冒烟 E2E | `npx playwright test --grep="@smoke"` | 180s | 是 |
| 构建验证 | `npm run build` | 180s | 是 |
| 健康检查 | 访问首页与 API 端点 | 30s | 是 |

### 7.5 覆盖率报告

- **工具**：Jest 内置 coverage（Istanbul）
- **报告格式**：HTML + JSON
- **存储位置**：`coverage/` 目录
- **上传**：CI 中作为 artifact 上传
- **目标**：核心逻辑 90%+，组件 70%+，页面 50%+

---

## 8. Bug 管理流程

### 8.1 Bug 等级定义

| 等级 | 名称 | 定义 | 示例 |
|------|------|------|------|
| **P0** | 阻断 | 核心功能完全无法使用，无 workaround | 议会流程无法启动；页面白屏；API 全部 500 |
| **P1** | 严重 | 核心功能受损，影响主流程，有 workaround | 议会报告无法生成；Agent 发言缺失；管理后台无法加载 |
| **P2** | 一般 | 非核心功能异常，有 workaround | 搜索功能不工作；筛选结果不正确；动画卡顿 |
| **P3** | 轻微 | 视觉或体验问题，不影响使用 | 文字溢出；间距不一致；颜色偏差；文案错误 |

### 8.2 处理时限

| 等级 | 响应时间 | 修复时限 | 验证时限 | 上报要求 |
|------|----------|----------|----------|----------|
| **P0** | 立即（< 15min） | 立即（< 4h） | 修复后立即 | 通知全团队，技术总监直接跟进 |
| **P1** | < 2h | < 24h | < 4h | 通知技术总监与产品经理 |
| **P2** | < 1 天 | < 3 天 | < 1 天 | 在 Sprint 中排期 |
| **P3** | < 3 天 | < 1 周 | 下次发版前 | 记录到 Backlog |

### 8.3 Bug 报告模板

```markdown
## Bug 报告

### 基本信息
- **Bug ID**：BUG-2026-001
- **标题**：[简明描述问题]
- **等级**：P0 / P1 / P2 / P3
- **报告人**：[姓名]
- **报告日期**：2026-MM-DD
- **指派人**：[姓名]

### 环境信息
- **浏览器**：Chrome 120 / Firefox / Safari
- **设备**：Desktop / Tablet / Mobile
- **操作系统**：Windows / macOS / iOS / Android
- **环境**：Development / Staging / Production
- **URL**：[触发问题的页面 URL]

### 复现步骤
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

### 预期结果
[描述应该发生什么]

### 实际结果
[描述实际发生了什么]

### 附件
- [截图 / 录屏]
- [控制台错误日志]
- [Network 请求记录]

### 根因分析
[开发人员填写：问题根因]

### 修复方案
[开发人员填写：修复方案与影响范围]

### 回归测试
- [ ] 原 Bug 场景已修复
- [ ] 相关功能无回归
- [ ] 新增/更新测试用例
```

### 8.4 Bug 生命周期

```
新建（New）→ 确认（Confirmed）→ 分配（Assigned）→ 修复中（In Progress）→ 待验证（Resolved）→ 已验证（Verified）→ 已关闭（Closed）
                                                                    ↓
                                                              重新打开（Reopened）
```

| 状态 | 说明 | 操作人 |
|------|------|--------|
| New | 新提交的 Bug | 报告人 |
| Confirmed | QA 确认可复现 | QA |
| Assigned | 分配给开发 | 技术总监 |
| In Progress | 开发正在修复 | 开发 |
| Resolved | 开发标记已修复 | 开发 |
| Verified | QA 验证通过 | QA |
| Closed | Bug 关闭 | QA |
| Reopened | 验证不通过，重新打开 | QA |

---

## 附录

### A. 测试命令速查

```bash
# 单元测试
npx jest                          # 运行所有单元测试
npx jest --coverage               # 运行并生成覆盖率报告
npx jest --silent                 # 静默模式运行
npx jest utils                    # 运行指定文件的测试
npx jest --watch                  # 监听模式

# E2E 测试
npx playwright test               # 运行所有 E2E 测试
npx playwright test admin.spec    # 运行指定测试文件
npx playwright test --headed      # 有头模式运行
npx playwright test --debug       # 调试模式
npx playwright show-report        # 查看测试报告

# 类型检查
npx tsc --noEmit                  # TypeScript 类型检查

# 构建
npm run build                     # 生产构建
npm run lint                      # ESLint 检查
```

### B. 相关文件索引

| 文件 | 说明 |
|------|------|
| `jest.config.ts` | Jest 配置 |
| `jest.setup.ts` | Jest 测试环境初始化（Mock 配置） |
| `playwright.config.ts` | Playwright 配置 |
| `tsconfig.json` | TypeScript 配置（strict mode） |
| `package.json` | 项目依赖与脚本 |
| `.github/workflows/ci.yml` | CI 流水线配置 |
| `.github/workflows/deploy.yml` | 部署流水线配置 |
