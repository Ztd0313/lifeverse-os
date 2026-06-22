# LifeVerse OS

> Every life deserves its own universe.

LifeVerse 是一个 AI 生命操作系统，帮助人们理解自己、理解过去、理解未来，并在重大选择时与智慧、记忆和未来版本的自己共同对话。

## Repository 8 层架构

```
lifeverse-os/
├── docs/
│   ├── world/          # L1 世界观（8 文件）
│   ├── prd/            # L2 PRD（6 文件）
│   └── architecture/   # 架构文档
├── agents/             # L3 Agent 人格库（12 文件）
├── prompts/            # L4 Prompt Chain（6 文件）
├── database/           # L5 SQL Schema（6 文件）
├── components/         # L6 UI 组件规格（9 文件）
├── .skills/            # L7 Skill 定义（8 文件）
├── tasks/              # L8 Task System（1 文件，120 Task）
├── app/                # Next.js App Router（开发产出）
└── public/             # 静态资源
```

## 技术栈

- **前端**: Next.js 15 + TypeScript + TailwindCSS + Shadcn UI + Framer Motion
- **后端**: Supabase + PostgreSQL
- **AI**: OpenAI + LangGraph
- **认证**: Clerk
- **部署**: Vercel → lifeverse.ai

## 7 大模块

| 模块 | 英文 | 定位 |
|------|------|------|
| 智慧议会 | Wisdom Council | 7 位智者多轮辩论 + 命运报告 |
| 未来议会 | Future Council | 20/50/80 岁的自己 + 时间线推演 |
| 内心世界 | Inner World | 6 个内心人格 + 冲突雷达 |
| 记忆星球 | Memory Planet | 上传资料 → 5 个星球 → 人生地图 |
| 梦想档案 | Dream Archive | 儿时梦想 + AI 儿时自己 |
| 重逢 | Reunion | AI 父亲/母亲/亲人 → 私人议会 |
| 历史 | History | 全记录 + 时间轴 + 搜索 |

## 开发工作流

1. **Product Manager Skill** → 生成 PRD
2. **Architect Skill** → 生成架构 + 数据库
3. **Prompt Engineer Skill** → 生成 Agent + Prompt Chain
4. **Frontend Skill** → 逐页面开发
5. **Motion Skill** → 动画实现
6. **QA Skill** → 自动测试
7. **Storytelling Skill** → 品牌包装
8. **部署上线** → Vercel

## 规模

- 120 Task · 60 Components · 12 Agent · 6 Prompt Chain · 9 SQL 表 · 8 Skill · 14 Page
- 预估 30000-50000 行代码
- 16 周开发周期（4 Phase）

## 开发计划

查看完整开发工作流：`lifeverse-os-dev-plan.html`

---

LifeVerse OS · 2026-06-21 · Founder Mode
