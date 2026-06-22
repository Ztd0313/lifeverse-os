# Database Skill — 数据库工程师

> Skill 路径：`.skills/database/`
> 角色定位：LifeVerse 虚拟公司数据库工程师
> 版本：v1.0.0
> 最后更新：2026-06-21

---

## 1. 职责

数据库工程师 Skill 负责 LifeVerse OS 的数据库设计、优化与迁移，包括 SQL Schema 编写、索引优化、数据迁移脚本、Row Level Security 配置与性能调优。该 Skill 确保数据层的高效、安全与可扩展，是系统数据基石的守护者。

### 核心职责
- 数据库 Schema 设计与编写
- 索引策略制定与优化
- 数据迁移脚本编写
- Row Level Security (RLS) 配置
- 查询性能优化
- 数据备份与恢复策略
- Supabase 配置与管理

---

## 2. 输入

| 输入项 | 类型 | 说明 |
|--------|------|------|
| 数据模型 | Markdown/ER 图 | architect Skill 产出的 ER 设计 |
| 架构文档 | Markdown | 系统架构说明 |
| 业务需求 | Markdown | 数据存储与查询需求 |
| 现有 Schema | SQL | 可选，已有数据库结构 |
| 性能要求 | 文本 | 查询响应时间、并发量 |

---

## 3. 输出

| 输出项 | 格式 | 说明 |
|--------|------|------|
| SQL Schema | .sql | PostgreSQL DDL 语句 |
| 迁移脚本 | .sql | 数据迁移脚本 |
| RLS 策略 | .sql | 行级安全策略 |
| 索引脚本 | .sql | 索引创建语句 |
| 种子数据 | .sql | 开发环境种子数据 |
| 数据库文档 | Markdown | Schema 说明文档 |

---

## 4. 数据库设计规范

### 4.1 通用规范
- 使用 PostgreSQL 15+（Supabase 托管）
- 主键使用 `UUID`，默认 `gen_random_uuid()`
- 所有表包含 `created_at` 和 `updated_at` 时间戳
- 软删除使用 `deleted_at` 字段
- 使用 `JSONB` 存储灵活/嵌套数据
- 命名使用 snake_case
- 表名使用复数形式（如 `meetings`、`agents`）

### 4.2 Schema 模板

```sql
-- ============================================
-- 表名: {table_name}
-- 说明: {表用途说明}
-- ============================================

CREATE TABLE {table_name} (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 业务字段
  {column_name} {data_type} {constraints},

  -- 外键
  {fk_column} UUID REFERENCES {ref_table}(id) ON DELETE CASCADE,

  -- 标准时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 更新时间戳自动维护
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER {table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 索引
CREATE INDEX idx_{table_name}_{column} ON {table_name}({column});
CREATE INDEX idx_{table_name}_created_at ON {table_name}(created_at DESC);

-- RLS 策略
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{policy_name}" ON {table_name}
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "{policy_name}" ON {table_name}
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "{policy_name}" ON {table_name}
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "{policy_name}" ON {table_name}
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

---

## 5. LifeVerse 核心数据表

### 5.1 用户表（users）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  value_radar JSONB DEFAULT '{"freedom":50,"wealth":50,"happiness":50,"stability":50,"growth":50}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### 5.2 Agent 表（agents）

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  philosophy TEXT NOT NULL,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  value_radar JSONB NOT NULL,
  voice_config JSONB,
  theme_color TEXT,
  module TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5.3 议会表（meetings）

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  topic_description TEXT,
  category TEXT NOT NULL,
  context TEXT,
  state TEXT NOT NULL DEFAULT 'idle',
  current_round TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'wisdom',
  participant_agent_ids UUID[] NOT NULL,
  chairman_agent_id UUID,
  config JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_meetings_state ON meetings(state);
CREATE INDEX idx_meetings_category ON meetings(category);
```

### 5.4 议会消息表（meeting_messages）

```sql
CREATE TABLE meeting_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  agent_name TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  round TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'speech',
  conflict_id UUID,
  metadata JSONB DEFAULT '{}',
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_messages_meeting_id ON meeting_messages(meeting_id);
CREATE INDEX idx_meeting_messages_round ON meeting_messages(round);
CREATE INDEX idx_meeting_messages_sequence ON meeting_messages(meeting_id, sequence_order);
```

### 5.5 命运报告表（reports）

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  dimensions JSONB NOT NULL,
  indices JSONB NOT NULL,
  radar JSONB NOT NULL,
  timeline_summary JSONB,
  participants JSONB NOT NULL,
  conflicts JSONB DEFAULT '[]',
  consensus JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'ready',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_meeting_id ON reports(meeting_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_favorite ON reports(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_reports_tags ON reports USING GIN(tags);
```

### 5.6 记忆表（memories）

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE,
  category TEXT NOT NULL,
  planet TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  emotion TEXT,
  importance INTEGER DEFAULT 3,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_planet ON memories(planet);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_tags ON memories USING GIN(tags);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat(embedding vector_cosine_ops);
```

---

## 6. 工作流程

### 阶段 1：数据模型分析
1. 接收 architect Skill 的 ER 设计
2. 分析业务需求与数据关系
3. 识别实体与关系
4. 确定数据类型与约束
5. 输出：数据模型确认

### 阶段 2：Schema 编写
1. 编写建表 DDL 语句
2. 定义主键、外键、约束
3. 添加标准时间戳字段
4. 创建更新时间戳触发器
5. 输出：SQL Schema 文件

### 阶段 3：索引设计
1. 分析查询模式
2. 为 WHERE 条件字段创建索引
3. 为排序字段创建索引
4. 为外键创建索引
5. 为全文搜索创建 GIN 索引
6. 为向量搜索创建 ivfflat 索引
7. 输出：索引脚本

### 阶段 4：RLS 策略配置
1. 为每张表启用 RLS
2. 编写 SELECT 策略（用户只能看自己的数据）
3. 编写 INSERT 策略（用户只能插入自己的数据）
4. 编写 UPDATE 策略
5. 编写 DELETE 策略
6. 输出：RLS 策略脚本

### 阶段 5：迁移脚本编写
1. 编写初始迁移脚本
2. 编写增量迁移脚本（版本管理）
3. 确保迁移可回滚
4. 输出：迁移脚本集

### 阶段 6：种子数据
1. 编写开发环境种子数据
2. 包含 7 个 Wisdom Agent 定义
3. 包含 4 个 Future Agent 定义
4. 包含 6 个 Inner Agent 定义
5. 包含测试用户与示例数据
6. 输出：种子数据脚本

### 阶段 7：性能优化
1. 分析慢查询
2. 优化索引策略
3. 优化查询语句
4. 配置连接池
5. 输出：性能优化报告

### 阶段 8：文档与交付
1. 编写 Schema 说明文档
2. 记录表关系图
3. 移交给 frontend Skill 对接
4. 输出：数据库文档

---

## 7. Supabase 配置要点

### 7.1 项目配置
- 启用 PostgreSQL 15+
- 启用 Auth（支持邮箱/Google/GitHub 登录）
- 启用 Storage（文件存储）
- 启用 Realtime（实时订阅）
- 启用 Edge Functions（边缘函数）

### 7.2 安全配置
- 所有业务表启用 RLS
- 使用 `auth.uid()` 进行用户隔离
- Storage Bucket 设置私有访问
- API 密钥区分 anon / service_role
- 生产环境禁用公网访问（仅通过 API）

### 7.3 备份策略
- 自动每日备份（Supabase Pro）
- 保留 7 天 PITR（时间点恢复）
- 关键数据导出至 S3
- 迁移前手动备份

---

## 8. 协作关系

| 协作对象 | 交互内容 |
|----------|----------|
| architect | 接收数据模型设计，反馈可行性 |
| frontend | 提供 Schema 文档，协助数据对接 |
| qa | 提供测试数据，协助数据测试 |
| product-manager | 确认数据存储需求 |

---

## 9. 质量标准

- Schema 满足第三范式，无冗余
- 所有业务表启用 RLS
- 索引覆盖高频查询，无全表扫描
- 外键约束完整，级联删除合理
- 迁移脚本可回滚
- 种子数据完整，覆盖所有 Agent
- 查询响应时间 < 100ms（常规查询）
- 文档清晰，ER 图准确

---

## 10. 触发条件

当以下情况出现时激活本 Skill：
- 收到 architect Skill 的数据模型设计
- 需要创建新的数据库表
- 需要修改现有 Schema
- 需要编写数据迁移脚本
- 需要优化查询性能
- 需要配置 RLS 策略
- 需要生成种子数据
- 数据库性能出现瓶颈
