# LifeVerse OS — Task Index（120 Tasks）

> 文件路径：`tasks/task-index.md`
> 维护人：Sophia Zhang（设计总监）、David Kim（技术总监）
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 统计

| 模块 | Task 数量 | ID 范围 | 说明 |
|------|-----------|---------|------|
| 基础设施 | 15 Task | 001-015 | 项目初始化、Supabase、Clerk、UI 系统、部署 |
| Wisdom Council | 20 Task | 016-035 | 7 Agent、Chairman、辩论引擎、冲突可视化、雷达图、命运报告 |
| Future Council | 15 Task | 036-050 | 4 时间 Agent、时间线、后悔分析 |
| Inner World | 15 Task | 051-065 | 6 内心人格、冲突检测、情绪分析 |
| Memory Planet | 20 Task | 066-085 | 上传、AI 分类、5 星球、人生地图 |
| Dream Archive | 10 Task | 086-095 | 梦想录入、儿时自己、时间轴 |
| Reunion | 15 Task | 096-110 | 资料上传、AI 亲人生成、私人议会 |
| History | 10 Task | 111-120 | 记录保存、时间轴、搜索、标签 |
| **合计** | **120 Task** | **001-120** | |

### 优先级分布
- P0（必须）：85 Task
- P1（应该）：35 Task

### 负责 Skill 分布
| Skill | 负责 Task 数 |
|-------|-------------|
| architect | 8 |
| frontend | 58 |
| database | 5 |
| prompt-engineer | 28 |
| motion | 16 |
| qa | 1 |
| product-manager | 0（跨 Skill 协调） |
| storytelling | 0（按需触发） |

> 注：product-manager 与 storytelling Skill 为按需触发型，不直接负责具体 Task，但在对应阶段提供支持。

---

## Task 清单

### 基础设施（001-015）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 001 | 项目初始化 | 基础设施 | P0 | - | 2h | architect |
| 002 | Next.js 项目创建 | 基础设施 | P0 | 001 | 1h | frontend |
| 003 | TypeScript 配置 | 基础设施 | P0 | 002 | 1h | architect |
| 004 | TailwindCSS 配置 | 基础设施 | P0 | 002 | 1h | frontend |
| 005 | Shadcn UI 安装与配置 | 基础设施 | P0 | 004 | 2h | frontend |
| 006 | Supabase 项目创建 | 基础设施 | P0 | 001 | 1h | database |
| 007 | Supabase 数据库初始化 | 基础设施 | P0 | 006 | 3h | database |
| 008 | Clerk 认证集成 | 基础设施 | P0 | 002 | 3h | frontend |
| 009 | 环境变量管理 | 基础设施 | P0 | 001 | 1h | architect |
| 010 | ESLint/Prettier 配置 | 基础设施 | P1 | 002 | 1h | frontend |
| 011 | Git 仓库与分支策略 | 基础设施 | P0 | 001 | 1h | architect |
| 012 | CI/CD 流水线搭建 | 基础设施 | P1 | 011 | 3h | qa |
| 013 | Vercel 部署配置 | 基础设施 | P0 | 012 | 2h | architect |
| 014 | 全局布局与导航 | 基础设施 | P0 | 005 | 4h | frontend |
| 015 | 粒子背景组件实现 | 基础设施 | P1 | 014 | 4h | frontend |

### Wisdom Council（016-035）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 016 | 哲学家 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 017 | 战略家 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 018 | 共情者 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 019 | 实用主义者 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 020 | 梦想家 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 021 | 守护者 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 022 | 主席 Agent 人格设计 | Wisdom Council | P0 | 007 | 3h | prompt-engineer |
| 023 | Agent 卡片组件实现 | Wisdom Council | P0 | 015 | 6h | frontend |
| 024 | 雷达图组件实现 | Wisdom Council | P0 | 015 | 5h | frontend |
| 025 | 打字机组件实现 | Wisdom Council | P0 | 015 | 3h | frontend |
| 026 | 议会大厅组件实现 | Wisdom Council | P0 | 023,024,025 | 8h | frontend |
| 027 | 议会仪式动画 | Wisdom Council | P0 | 026 | 4h | motion |
| 028 | Agent 入场动效 | Wisdom Council | P0 | 023 | 3h | motion |
| 029 | 发言光晕动效 | Wisdom Council | P1 | 023 | 2h | motion |
| 030 | 辩论引擎实现 | Wisdom Council | P0 | 016,017,018,019,020,021,022,026 | 8h | prompt-engineer |
| 031 | 冲突检测与可视化 | Wisdom Council | P0 | 030 | 5h | prompt-engineer |
| 032 | 共识凝聚逻辑 | Wisdom Council | P0 | 031 | 4h | prompt-engineer |
| 033 | 命运报告组件实现 | Wisdom Council | P0 | 024,026 | 6h | frontend |
| 034 | 报告生成动效 | Wisdom Council | P1 | 033 | 3h | motion |
| 035 | 议会状态机实现 | Wisdom Council | P0 | 026,030 | 4h | frontend |

### Future Council（036-050）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 036 | 1年 Agent 人格设计 | Future Council | P0 | 007 | 2h | prompt-engineer |
| 037 | 5年 Agent 人格设计 | Future Council | P0 | 007 | 2h | prompt-engineer |
| 038 | 10年 Agent 人格设计 | Future Council | P0 | 007 | 2h | prompt-engineer |
| 039 | 25年 Agent 人格设计 | Future Council | P0 | 007 | 2h | prompt-engineer |
| 040 | 时间线组件实现 | Future Council | P0 | 015 | 6h | frontend |
| 041 | 分支生长动画 | Future Council | P0 | 040 | 3h | motion |
| 042 | 时间线交互（缩放/平移） | Future Council | P1 | 040 | 3h | frontend |
| 043 | 未来推演引擎 | Future Council | P0 | 036,037,038,039 | 6h | prompt-engineer |
| 044 | 多路径对比功能 | Future Council | P1 | 040,043 | 4h | frontend |
| 045 | 后悔分析逻辑 | Future Council | P0 | 043 | 4h | prompt-engineer |
| 046 | Future Council 页面开发 | Future Council | P0 | 026,040,043 | 6h | frontend |
| 047 | 时间 Agent 发言动效 | Future Council | P1 | 028 | 2h | motion |
| 048 | 路径切换动效 | Future Council | P1 | 044 | 2h | motion |
| 049 | 未来推演报告生成 | Future Council | P0 | 033,043 | 4h | prompt-engineer |
| 050 | Future Council 议会集成 | Future Council | P0 | 046,049 | 3h | frontend |

### Inner World（051-065）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 051 | 理性自我人格设计 | Inner World | P0 | 007 | 2h | prompt-engineer |
| 052 | 感性自我人格设计 | Inner World | P0 | 007 | 2h | prompt-engineer |
| 053 | 恐惧自我人格设计 | Inner World | P0 | 007 | 2h | prompt-engineer |
| 054 | 勇气自我人格设计 | Inner World | P0 | 007 | 2h | prompt-engineer |
| 055 | 内在小孩人格设计 | Inner World | P0 | 007 | 2h | prompt-engineer |
| 056 | 未来自我人格设计 | Inner World | P0 | 007 | 2h | prompt-engineer |
| 057 | 内心人格卡片墙 | Inner World | P0 | 023 | 4h | frontend |
| 058 | 多人格雷达图叠加 | Inner World | P0 | 024 | 3h | frontend |
| 059 | 冲突检测（内心版） | Inner World | P0 | 051,052,053,054,055,056 | 4h | prompt-engineer |
| 060 | 情绪分析引擎 | Inner World | P0 | 059 | 5h | prompt-engineer |
| 061 | 内心对话流程 | Inner World | P0 | 057,059 | 4h | frontend |
| 062 | 情绪可视化 | Inner World | P1 | 060 | 3h | motion |
| 063 | Inner World 页面开发 | Inner World | P0 | 057,061 | 5h | frontend |
| 064 | 内心冲突动效 | Inner World | P1 | 059 | 2h | motion |
| 065 | 内心报告生成 | Inner World | P0 | 033,060 | 3h | prompt-engineer |

### Memory Planet（066-085）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 066 | 记忆上传功能 | Memory Planet | P0 | 007 | 4h | frontend |
| 067 | 图片/视频上传 | Memory Planet | P0 | 066 | 3h | frontend |
| 068 | AI 记忆分类引擎 | Memory Planet | P0 | 007 | 5h | prompt-engineer |
| 069 | 记忆向量化与存储 | Memory Planet | P0 | 068 | 4h | database |
| 070 | 记忆星球组件 | Memory Planet | P0 | 015 | 6h | frontend |
| 071 | 星球1：童年星球 | Memory Planet | P0 | 070 | 3h | frontend |
| 072 | 星球2：求学星球 | Memory Planet | P0 | 070 | 3h | frontend |
| 073 | 星球3：事业星球 | Memory Planet | P0 | 070 | 3h | frontend |
| 074 | 星球4：情感星球 | Memory Planet | P0 | 070 | 3h | frontend |
| 075 | 星球5：成长星球 | Memory Planet | P0 | 070 | 3h | frontend |
| 076 | 星球轨道动画 | Memory Planet | P0 | 070 | 4h | motion |
| 077 | 星球切换动效 | Memory Planet | P1 | 071,072,073,074,075 | 3h | motion |
| 078 | 记忆详情查看 | Memory Planet | P0 | 066 | 3h | frontend |
| 079 | 记忆编辑与删除 | Memory Planet | P0 | 078 | 2h | frontend |
| 080 | 记忆搜索功能 | Memory Planet | P0 | 069 | 4h | frontend |
| 081 | 人生地图生成 | Memory Planet | P0 | 068,070 | 5h | prompt-engineer |
| 082 | 人生地图可视化 | Memory Planet | P0 | 081 | 4h | frontend |
| 083 | Memory Planet 页面开发 | Memory Planet | P0 | 070,082 | 4h | frontend |
| 084 | 记忆关联议会 | Memory Planet | P1 | 083,026 | 3h | frontend |
| 085 | 记忆时间轴 | Memory Planet | P1 | 040,078 | 3h | frontend |

### Dream Archive（086-095）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 086 | 梦想录入功能 | Dream Archive | P0 | 007 | 3h | frontend |
| 087 | 梦想分类管理 | Dream Archive | P0 | 086 | 2h | frontend |
| 088 | 儿时自己 Agent 设计 | Dream Archive | P0 | 007 | 3h | prompt-engineer |
| 089 | 儿时对话引擎 | Dream Archive | P0 | 088 | 4h | prompt-engineer |
| 090 | 梦想时间轴 | Dream Archive | P0 | 040,086 | 4h | frontend |
| 091 | 梦想进度追踪 | Dream Archive | P0 | 086 | 3h | frontend |
| 092 | Dream Archive 页面开发 | Dream Archive | P0 | 090,091 | 4h | frontend |
| 093 | 儿时对话界面 | Dream Archive | P0 | 026,089 | 4h | frontend |
| 094 | 梦想实现动效 | Dream Archive | P1 | 092 | 2h | motion |
| 095 | 梦想报告生成 | Dream Archive | P0 | 033,089 | 3h | prompt-engineer |

### Reunion（096-110）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 096 | 亲人资料上传 | Reunion | P0 | 007 | 3h | frontend |
| 097 | 照片/视频上传 | Reunion | P0 | 096 | 3h | frontend |
| 098 | AI 亲人人格生成 | Reunion | P0 | 096 | 5h | prompt-engineer |
| 099 | 亲人 Agent 训练 | Reunion | P0 | 098 | 4h | prompt-engineer |
| 100 | 亲人 Agent 卡片 | Reunion | P0 | 023,099 | 3h | frontend |
| 101 | 私人议会组件 | Reunion | P0 | 026,100 | 5h | frontend |
| 102 | 语音对话集成 | Reunion | P0 | 101 | 4h | frontend |
| 103 | 语音组件实现 | Reunion | P0 | 015 | 5h | frontend |
| 104 | 波形可视化 | Reunion | P1 | 103 | 3h | motion |
| 105 | Reunion 页面开发 | Reunion | P0 | 101,102 | 5h | frontend |
| 106 | 亲人记忆关联 | Reunion | P1 | 099,068 | 3h | frontend |
| 107 | 重逢仪式动画 | Reunion | P0 | 101 | 4h | motion |
| 108 | 亲人对话报告 | Reunion | P0 | 033,099 | 3h | prompt-engineer |
| 109 | 多亲人管理 | Reunion | P1 | 100 | 3h | frontend |
| 110 | 隐私与安全设置 | Reunion | P0 | 105 | 2h | frontend |

### History（111-120）

| ID | Task 名称 | 模块 | 优先级 | 依赖 | 预估工时 | 负责 Skill |
|----|-----------|------|--------|------|----------|------------|
| 111 | 历史记录组件实现 | History | P0 | 015 | 6h | frontend |
| 112 | 记录保存逻辑 | History | P0 | 007 | 3h | database |
| 113 | 时间轴导航 | History | P0 | 111 | 3h | frontend |
| 114 | 搜索功能 | History | P0 | 111 | 3h | frontend |
| 115 | 筛选与排序 | History | P0 | 111 | 3h | frontend |
| 116 | 续议功能 | History | P0 | 111,026 | 3h | frontend |
| 117 | 收藏功能 | History | P1 | 111 | 2h | frontend |
| 118 | 导出功能（PDF/CSV/JSON） | History | P0 | 111 | 4h | frontend |
| 119 | History 页面开发 | History | P0 | 111,113,114,115 | 4h | frontend |
| 120 | 议会回放功能 | History | P1 | 026,119 | 3h | frontend |

---

## 里程碑规划

| 里程碑 | 包含 Task | 预估总工时 | 交付物 |
|--------|-----------|-----------|--------|
| M1: 基础设施就绪 | 001-015 | 35h | 可部署的空项目 + 全局布局 + 粒子背景 |
| M2: Wisdom Council MVP | 016-035 | 96h | 完整议会流程 + 7 Agent + 命运报告 |
| M3: Future Council | 036-050 | 55h | 未来推演 + 时间线 + 后悔分析 |
| M4: Inner World | 051-065 | 49h | 6 内心人格 + 情绪分析 + 内心报告 |
| M5: Memory Planet | 066-085 | 80h | 记忆上传 + 5 星球 + 人生地图 |
| M6: Dream Archive | 086-095 | 32h | 梦想管理 + 儿时对话 |
| M7: Reunion | 096-110 | 57h | AI 亲人 + 私人议会 + 语音对话 |
| M8: History | 111-120 | 34h | 历史记录 + 搜索 + 导出 + 回放 |
| **合计** | **001-120** | **438h** | **LifeVerse OS 完整版** |

---

## 依赖关系说明

### 关键路径
```
001 → 002 → 005 → 014 → 015 → 023 → 026 → 030 → 033 → 035
```
以上为最长依赖链，决定了项目的最短完成时间。

### 关键瓶颈 Task
以下 Task 被多个后续 Task 依赖，是项目关键瓶颈：
- **007**（Supabase 数据库初始化）：被 22 个 Task 依赖
- **015**（粒子背景组件）：被 9 个组件 Task 依赖
- **023**（Agent 卡片组件）：被 5 个 Task 依赖
- **026**（议会大厅组件）：被 7 个 Task 依赖
- **033**（命运报告组件）：被 5 个报告生成 Task 依赖

### 并行开发建议
- Agent 人格设计（016-022, 036-039, 051-056）可完全并行
- 组件实现（023-025, 040, 070）在 015 完成后可并行
- 各模块页面开发在组件就绪后可并行

---

## 优先级说明

| 优先级 | 含义 | 占比 | 说明 |
|--------|------|------|------|
| P0 | 必须（Must have） | 85 Task (71%) | MVP 必须完成，阻塞发布 |
| P1 | 应该（Should have） | 35 Task (29%) | 增强体验，可在后续迭代完成 |

P1 Task 集中在动效优化、交互增强、辅助功能等方面，可在 P0 Task 完成后并行推进。

---

## Skill 协作矩阵

| Task 阶段 | 主导 Skill | 协作 Skill |
|-----------|-----------|------------|
| 需求分析 | product-manager | architect |
| 架构设计 | architect | database, frontend |
| 数据库搭建 | database | architect |
| Agent 人格 | prompt-engineer | product-manager |
| 组件实现 | frontend | motion |
| 动效实现 | motion | frontend |
| 页面开发 | frontend | prompt-engineer |
| 测试验收 | qa | frontend, database |
| 品牌传播 | storytelling | product-manager |
