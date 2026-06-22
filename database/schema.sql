-- ============================================================
-- LifeVerse OS — 总 Schema
-- 文件: schema.sql
-- 说明: 创建 extension、枚举类型、通用函数
-- 执行顺序: 本文件必须最先执行，其他 .sql 文件依赖此文件
-- 数据库: PostgreSQL (Supabase)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 扩展（Extensions）
-- ------------------------------------------------------------

-- pgcrypto: 提供 gen_random_uuid() 用于生成 UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- pg_trgm: 提供文本相似度搜索（用于记忆和梦想的模糊检索）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- "uuid-ossp": UUID 生成（备用，主要使用 pgcrypto 的 gen_random_uuid）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 2. 枚举类型（Enum Types）
-- ------------------------------------------------------------

-- 用户订阅计划
CREATE TYPE user_plan AS ENUM (
    'free',      -- 免费版：每月 3 次议会
    'pro',       -- 专业版：每月 30 次议会
    'lifetime'   -- 终身版：无限议会
);

-- 议会类型
CREATE TYPE council_type AS ENUM (
    'wisdom',        -- 智慧议会（名人 Agent）
    'future',        -- 未来议会（未来自己 + 家人）
    'mixed'          -- 混合议会（智慧 + 未来）
);

-- 议会状态
CREATE TYPE council_status AS ENUM (
    'pending',              -- 待调度
    'dispatched',           -- 已调度，待辩论
    'debating',             -- 辩论中
    'debated',              -- 辩论完成
    'conflict_analyzed',    -- 冲突分析完成
    'awaiting_user',        -- 等待用户裁决
    'user_resolved',        -- 用户已裁决
    'consensus_formed',     -- 共识已形成
    'report_generated',     -- 报告已生成
    'timeline_generating',  -- 时间线生成中
    'completed',            -- 全部完成
    'failed',               -- 失败
    'cancelled'             -- 用户取消
);

-- 辩论结构
CREATE TYPE debate_structure AS ENUM (
    'roundtable',    -- 圆桌讨论
    'adversarial',   -- 对抗辩论
    'socratic'       -- 引导式追问
);

-- Agent 所属议会
CREATE TYPE agent_council AS ENUM (
    'wisdom',   -- 智慧议会
    'future'    -- 未来议会
);

-- Agent 使用的模型
CREATE TYPE agent_model AS ENUM (
    'gpt-4o',         -- OpenAI GPT-4o
    'deepseek-r1'     -- DeepSeek R1
);

-- 消息发送者类型
CREATE TYPE message_sender_type AS ENUM (
    'user',           -- 用户
    'agent',          -- Agent
    'chairman',       -- 主席
    'system'          -- 系统
);

-- 消息立场
CREATE TYPE message_stance AS ENUM (
    'support',   -- 支持
    'oppose',    -- 反对
    'neutral',   -- 中立
    'question'   -- 质疑/追问
);

-- 冲突等级
CREATE TYPE conflict_level AS ENUM (
    'low',       -- 低冲突 0-30
    'medium',    -- 中冲突 31-60
    'high',      -- 高冲突 61-85
    'extreme'    -- 极冲突 86-100
);

-- 记忆类型
CREATE TYPE memory_type AS ENUM (
    'event',       -- 事件记忆
    'emotion',     -- 情绪记忆
    'insight',     -- 洞察记忆
    'decision',    -- 决策记忆
    'relationship' -- 关系记忆
);

-- 记忆情绪标签
CREATE TYPE memory_emotion AS ENUM (
    'joy',         -- 喜
    'anger',       -- 怒
    'sadness',     -- 哀
    'fear',        -- 惧
    'love',        -- 爱
    'disgust',     -- 恶
    'surprise',    -- 惊
    'neutral'      -- 平静
);

-- 梦想状态
CREATE TYPE dream_status AS ENUM (
    'active',       -- 活跃中
    'achieved',     -- 已实现
    'abandoned',    -- 已放弃
    'dormant'       -- 休眠中
);

-- 报告类型
CREATE TYPE report_type AS ENUM (
    'destiny',      -- 命运报告
    'timeline',     -- 时间线报告
    'summary'       -- 摘要报告
);

-- ------------------------------------------------------------
-- 3. 通用函数（Utility Functions）
-- ------------------------------------------------------------

-- 更新时间戳函数：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 生成 UUID 函数（封装 pgcrypto，便于统一调用）
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- 计算价值雷达相似度（余弦相似度）
-- 输入：两个 JSONB 类型的价值雷达 {自由, 财富, 幸福, 稳定, 成长}
-- 输出：0-1 的相似度
CREATE OR REPLACE FUNCTION value_radar_similarity(radar_a JSONB, radar_b JSONB)
RETURNS FLOAT AS $$
DECLARE
    dims TEXT[] := ARRAY['自由', '财富', '幸福', '稳定', '成长'];
    a_val FLOAT;
    b_val FLOAT;
    dot_product FLOAT := 0;
    norm_a FLOAT := 0;
    norm_b FLOAT := 0;
    dim TEXT;
BEGIN
    FOREACH dim IN ARRAY dims LOOP
        a_val := COALESCE((radar_a ->> dim)::FLOAT, 0);
        b_val := COALESCE((radar_b ->> dim)::FLOAT, 0);
        dot_product := dot_product + a_val * b_val;
        norm_a := norm_a + a_val * a_val;
        norm_b := norm_b + b_val * b_val;
    END LOOP;

    IF norm_a = 0 OR norm_b = 0 THEN
        RETURN 0;
    END IF;

    RETURN dot_product / (SQRT(norm_a) * SQRT(norm_b));
END;
$$ LANGUAGE plpgsql;

-- 计算价值雷达冲突值（1 - 相似度，归一化到 0-100）
CREATE OR REPLACE FUNCTION value_radar_conflict(radar_a JSONB, radar_b JSONB)
RETURNS INT AS $$
BEGIN
    RETURN ROUND((1 - value_radar_similarity(radar_a, radar_b)) * 100);
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 4. 通用触发器模板（各表创建后挂载）
-- ------------------------------------------------------------

-- 说明：每个需要 updated_at 的表，在创建后执行以下模式：
-- CREATE TRIGGER set_updated_at
--     BEFORE UPDATE ON [表名]
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 5. Schema 元信息
-- ------------------------------------------------------------

-- 记录 Schema 版本（便于后续迁移管理）
CREATE TABLE IF NOT EXISTS schema_versions (
    id          SERIAL PRIMARY KEY,
    version     VARCHAR(32) NOT NULL UNIQUE,   -- 版本号
    file_name   VARCHAR(128) NOT NULL,          -- 执行的文件名
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 执行时间
    description TEXT                              -- 描述
);

COMMENT ON TABLE schema_versions IS 'Schema 版本管理表，记录每次数据库迁移';

-- 插入初始版本记录
INSERT INTO schema_versions (version, file_name, description)
VALUES ('1.0.0', 'schema.sql', 'LifeVerse OS 初始 Schema：扩展、枚举类型、通用函数')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- 文件结束 — schema.sql
-- 依赖: 无（本文件为数据库初始化的第一个文件）
-- 后续: users.sql, meetings.sql, agents.sql, messages.sql, memories.sql
-- ============================================================
