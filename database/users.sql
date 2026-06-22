-- ============================================================
-- LifeVerse OS — 用户表
-- 文件: users.sql
-- 说明: 创建 users 表，存储用户基本信息和订阅状态
-- 执行顺序: 在 schema.sql 之后执行
-- 数据库: PostgreSQL (Supabase)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 用户表（users）
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    -- 主键：UUID，自动生成
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 邮箱：唯一，用于登录和通知
    email           VARCHAR(255) NOT NULL UNIQUE,

    -- 用户名：显示名称
    name            VARCHAR(128) NOT NULL,

    -- 头像 URL
    avatar          TEXT,

    -- 订阅计划：free / pro / lifetime
    plan            user_plan NOT NULL DEFAULT 'free',

    -- 价值雷达：JSONB，存储用户的 5 维度价值观
    -- 格式: {"自由": 70, "财富": 60, "幸福": 80, "稳定": 50, "成长": 75}
    value_radar     JSONB NOT NULL DEFAULT '{"自由": 50, "财富": 50, "幸福": 50, "稳定": 50, "成长": 50}'::jsonb,

    -- 用户画像：JSONB，存储年龄、职业、家庭状态等
    -- 格式: {"age": 28, "occupation": "工程师", "family_status": "已婚"}
    profile         JSONB DEFAULT '{}'::jsonb,

    -- 本月已使用议会次数
    monthly_usage   INT NOT NULL DEFAULT 0,

    -- 上次重置使用次数的日期（每月重置）
    usage_reset_at  TIMESTAMPTZ DEFAULT NOW(),

    -- 最后登录时间
    last_login_at   TIMESTAMPTZ,

    -- 软删除标记
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,

    -- 时间戳
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE users IS 'LifeVerse 用户表，存储用户基本信息、订阅状态和价值雷达';
COMMENT ON COLUMN users.id IS '用户唯一 ID（UUID）';
COMMENT ON COLUMN users.email IS '用户邮箱，唯一，用于登录和通知';
COMMENT ON COLUMN users.name IS '用户显示名称';
COMMENT ON COLUMN users.avatar IS '用户头像 URL';
COMMENT ON COLUMN users.plan IS '订阅计划：free(免费) / pro(专业) / lifetime(终身)';
COMMENT ON COLUMN users.value_radar IS '价值雷达 JSON：{自由, 财富, 幸福, 稳定, 成长}，各 0-100';
COMMENT ON COLUMN users.profile IS '用户画像 JSON：年龄、职业、家庭状态等';
COMMENT ON COLUMN users.monthly_usage IS '本月已使用的议会次数';
COMMENT ON COLUMN users.usage_reset_at IS '上次重置使用次数的日期，每月重置';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.is_deleted IS '软删除标记：true 表示已删除';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';

-- ------------------------------------------------------------
-- 3. 索引
-- ------------------------------------------------------------

-- 邮箱索引（唯一索引已在列定义中，此处补充用于查询优化）
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_deleted = FALSE;

-- 订阅计划索引（用于统计和配额检查）
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan) WHERE is_deleted = FALSE;

-- 创建时间索引（用于排序和分页）
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 价值雷达 GIN 索引（用于基于价值观的匹配查询）
CREATE INDEX IF NOT EXISTS idx_users_value_radar ON users USING GIN(value_radar);

-- ------------------------------------------------------------
-- 4. 触发器：自动更新 updated_at
-- ------------------------------------------------------------

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 5. RLS（Row Level Security）策略
-- ------------------------------------------------------------

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 策略 1：用户只能查看自己的信息
-- auth.uid() 是 Supabase Auth 提供的函数，返回当前登录用户的 ID
CREATE POLICY users_select_own
    ON users FOR SELECT
    USING (auth.uid() = id AND is_deleted = FALSE);

-- 策略 2：用户只能更新自己的信息
CREATE POLICY users_update_own
    ON users FOR UPDATE
    USING (auth.uid() = id AND is_deleted = FALSE)
    WITH CHECK (auth.uid() = id);

-- 策略 3：用户可以插入自己的记录（注册时）
-- 注意：注册时 auth.uid() 可能尚未绑定，使用 email 匹配
CREATE POLICY users_insert_own
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 策略 4：管理员可以查看所有用户（通过 auth.jwt() 中的 role 判断）
CREATE POLICY users_select_admin
    ON users FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- 策略 5：管理员可以更新所有用户
CREATE POLICY users_update_admin
    ON users FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ------------------------------------------------------------
-- 6. 辅助函数
-- ------------------------------------------------------------

-- 检查用户本月议会配额是否已用完
-- 返回 true 表示还有配额可用
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan user_plan;
    v_usage INT;
    v_limit INT;
BEGIN
    SELECT plan, monthly_usage INTO v_plan, v_usage
    FROM users
    WHERE id = p_user_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    v_limit := CASE v_plan
        WHEN 'free' THEN 3
        WHEN 'pro' THEN 30
        WHEN 'lifetime' THEN 999999
    END;

    RETURN v_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- 用户使用一次议会后，增加计数
CREATE OR REPLACE FUNCTION increment_user_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET monthly_usage = monthly_usage + 1
    WHERE id = p_user_id AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 每月重置使用次数（由定时任务调用）
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET monthly_usage = 0,
        usage_reset_at = NOW()
    WHERE is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 7. 记录 Schema 版本
-- ------------------------------------------------------------

INSERT INTO schema_versions (version, file_name, description)
VALUES ('1.1.0', 'users.sql', '用户表：users + 索引 + RLS + 配额函数')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- 文件结束 — users.sql
-- 依赖: schema.sql
-- 后续: meetings.sql, agents.sql, messages.sql, memories.sql
-- ============================================================
