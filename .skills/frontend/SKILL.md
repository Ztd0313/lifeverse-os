# Frontend Skill — 前端工程师

> Skill 路径：`.skills/frontend/`
> 角色定位：LifeVerse 虚拟公司前端工程师
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 职责

前端工程师 Skill 负责 LifeVerse OS 的逐页面开发与组件实现，将设计稿与组件规格转化为高质量的 React/Next.js 代码。该 Skill 遵循架构师制定的技术方案，实现产品经理定义的功能需求，是代码产出的核心力量。

### 核心职责
- 逐页面开发（14 个页面）
- UI 组件实现（60 个组件）
- 页面路由与导航
- 状态管理
- API 对接
- 响应式适配
- 性能优化
- 代码质量保障

---

## 2. 输入

| 输入项 | 类型 | 说明 |
|--------|------|------|
| 设计稿 | Figma/图片 | 页面视觉设计 |
| 组件规格 | Markdown | components/ 下的 spec.md |
| 架构文档 | Markdown | architect Skill 产出 |
| API 文档 | Markdown | 接口定义 |
| PRD | Markdown | 功能需求 |
| 动效需求 | Markdown | motion Skill 产出 |

---

## 3. 输出

| 输出项 | 格式 | 说明 |
|--------|------|------|
| 页面代码 | .tsx | Next.js 页面组件 |
| 组件代码 | .tsx | React 组件实现 |
| Hook 代码 | .ts | 自定义 Hooks |
| 类型定义 | .ts | TypeScript 类型 |
| 工具函数 | .ts | 工具函数 |
| 样式文件 | .css/.scss | 全局/组件样式 |

---

## 4. 代码规范

### 4.1 文件组织
```
lifeverse-os/
├── app/                    # Next.js App Router 页面
│   ├── (auth)/             # 认证相关页面
│   ├── (main)/             # 主应用页面
│   │   ├── wisdom-council/
│   │   ├── future-council/
│   │   ├── inner-world/
│   │   ├── memory-planet/
│   │   ├── dream-archive/
│   │   ├── reunion/
│   │   └── history/
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── components/             # UI 组件（9 个目录）
│   ├── agent-card/
│   ├── meeting-room/
│   ├── timeline/
│   ├── report/
│   ├── radar-chart/
│   ├── particle/
│   ├── typing/
│   ├── voice/
│   └── history/
├── lib/                    # 工具库
├── types/                  # 类型定义
└── styles/                 # 全局样式
```

### 4.2 命名规范
- 组件文件：PascalCase（`AgentCard.tsx`）
- 页面文件：`page.tsx`（Next.js 约定）
- Hook 文件：camelCase（`useAgent.ts`）
- 类型文件：camelCase（`agent.ts`）
- 常量：UPPER_SNAKE_CASE
- CSS 类名：kebab-case（TailwindCSS 优先）

### 4.3 TypeScript 规范
- 严格模式（`strict: true`）
- 所有 Props 定义 interface
- 避免 `any`，使用 `unknown` 替代
- 公共类型定义在 `types/` 目录
- 使用 `as const` 替代 enum

---

## 5. 工作流程

### 阶段 1：需求理解
1. 接收设计稿与组件规格
2. 阅读架构文档与 API 文档
3. 理解功能需求与交互逻辑
4. 识别技术难点与风险
5. 输出：开发计划

### 阶段 2：环境准备
1. 确认开发环境（Node.js 20+, pnpm）
2. 拉取最新代码
3. 安装依赖
4. 配置环境变量
5. 启动开发服务器验证

### 阶段 3：类型定义
1. 根据组件规格定义 TypeScript 接口
2. 定义 API 请求/响应类型
3. 定义状态管理类型
4. 输出：types/ 目录文件

### 阶段 4：组件开发
1. 按组件规格实现 UI 组件
2. 遵循 Shadcn UI 设计系统
3. 使用 TailwindCSS 编写样式
4. 集成 Framer Motion 动效（按 motion Skill 产出）
5. 实现响应式布局
6. 输出：components/ 目录文件

### 阶段 5：页面开发
1. 创建 Next.js 页面路由
2. 组装 UI 组件
3. 实现页面交互逻辑
4. 对接 API（Server Actions / API Routes）
5. 实现状态管理
6. 输出：app/ 目录文件

### 阶段 6：联调与测试
1. 与后端 API 联调
2. 手动测试所有交互
3. 响应式测试（移动/平板/桌面）
4. 浏览器兼容性测试
5. 修复 Bug
6. 输出：可运行的页面

### 阶段 7：性能优化
1. 代码分割（dynamic import）
2. 图片优化（next/image）
3. 字体优化（next/font）
4. 减少客户端 JS（Server Components）
5. Lighthouse 性能审计
6. 输出：优化报告

### 阶段 8：代码审查与交付
1. 自查代码规范
2. 提交 Pull Request
3. 响应 Code Review 意见
4. 合并代码
5. 输出：PR 记录

---

## 6. 技术要点

### 6.1 Next.js 15 App Router
- 使用 Server Components 为默认
- 客户端交互使用 `'use client'` 指令
- 数据获取使用 Server Components
- 使用 `loading.tsx` / `error.tsx` 处理状态
- 使用 `layout.tsx` 共享布局

### 6.2 状态管理
- 服务端状态：Supabase Client + Server Actions
- 客户端状态：React Context + useReducer
- URL 状态：`useSearchParams` / `useRouter`
- 表单状态：`react-hook-form` + `zod`

### 6.3 样式方案
- TailwindCSS 3.x 为主要方案
- Shadcn UI 提供基础组件
- 自定义样式使用 `cn()` 工具合并
- 动画优先使用 Framer Motion
- 复杂动画使用 CSS keyframes

### 6.4 数据获取
- Server Components 中直接查询 Supabase
- 客户端使用 Supabase JS Client
- 实时数据使用 Supabase Realtime
- 使用 SWR 缓存客户端数据

---

## 7. 页面开发清单

| 序号 | 页面 | 路由 | 核心组件 |
|------|------|------|----------|
| 1 | 首页 | `/` | Particle, Agent Card |
| 2 | Wisdom Council | `/wisdom-council` | Meeting Room, Typing, Radar Chart |
| 3 | Future Council | `/future-council` | Timeline, Meeting Room |
| 4 | Inner World | `/inner-world` | Agent Card, Radar Chart |
| 5 | Memory Planet | `/memory-planet` | 自定义组件 |
| 6 | Dream Archive | `/dream-archive` | Timeline, Typing |
| 7 | Reunion | `/reunion` | Meeting Room, Voice |
| 8 | History | `/history` | History, Report |
| 9 | Settings | `/settings` | 表单组件 |
| 10 | Profile | `/profile` | 表单组件 |
| 11 | Onboarding | `/onboarding` | 多步表单 |
| 12 | Report Detail | `/report/[id]` | Report, Timeline |
| 13 | Agent Detail | `/agent/[id]` | Agent Card, Radar Chart |
| 14 | Meeting Replay | `/replay/[id]` | Meeting Room (readonly) |

---

## 8. 协作关系

| 协作对象 | 交互内容 |
|----------|----------|
| product-manager | 接收 PRD 与用户故事 |
| architect | 接收架构文档与 API 设计 |
| motion | 接收动效代码，集成到组件 |
| qa | 接收测试反馈，修复 Bug |
| database | 对接数据库 Schema |
| prompt-engineer | 集成 Agent Prompt 到前端 |

---

## 9. 质量标准

- TypeScript 严格模式无错误
- ESLint / Prettier 无警告
- 响应式覆盖移动/平板/桌面
- Lighthouse 性能评分 ≥ 90
- 无障碍满足 WCAG AA
- 组件可复用，Props 类型完整
- 代码注释清晰，复杂逻辑有说明
- 无 console.log 残留

---

## 10. 触发条件

当以下情况出现时激活本 Skill：
- 收到设计稿需要实现页面
- 收到组件规格需要实现组件
- 需要对接新的 API 接口
- 需要修复前端 Bug
- 需要进行性能优化
- 需要适配新的响应式断点
