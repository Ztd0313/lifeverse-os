-- ============================================================
-- LifeVerse OS — 议会记录表
-- 文件: meetings.sql
-- 说明: 创建 councils 表，存储每次议会（council）的会话记录
-- 执行顺序: 在 schema.sql, users.sql 之后执行
-- 数据库: PostgreSQL (Supabase)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 议会记录表（councils）
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS councils (
    -- 主键：UUID，自动生成
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 用户 ID：外键关联 users 表
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 议会类型：wisdom(智慧) / future(未来) / mixed(混合)
    type            council_type NOT NULL DEFAULT 'mixed',

    -- 用户提出的问题
    question        TEXT NOT NULL,

    -- 问题维度：事业/关系/成长/存在/健康/财富
    dimension       VARCHAR(32),

    -- 议会状态
    status          council_status NOT NULL DEFAULT 'pending',

    -- 辩论结构
    debate_structure debate_structure,

    -- 辩论轮次
    debate_rounds   INT DEFAULT 1,

    -- 调度方案：JSONB，存储主席调度的 Agent 列表和发言角度
    -- 格式: [{"agent_id": "musk", "speaking_angle": "...", "speaking_order": 1}, ...]
    dispatch_plan   JSONB DEFAULT '[]'::jsonb,

    -- 冲突分析结果：JSONB
    -- 格式: {"overall_conflict_score": 65, "conflict_level": "high", "conflict_pairs": [...]}
    conflict_analysis JSONB,

    -- 共识结果：JSONB
    -- 格式: {"consensus_points": [...], "divergence_points": [...], "actionable_advice": [...]}
    consensus_result JSONB,

    -- 主席开场白
    chairman_opening TEXT,

    -- 主席总结陈词
    chairman_closing TEXT,

    -- 会话编号：该用户的第几次议会
    session_number  INT NOT NULL,

    -- 是否需要用户介入裁决
    user_intervention_required BOOLEAN NOT NULL DEFAULT FALSE,

    -- 用户裁决回应
    user_intervention_response TEXT,

    -- 错误信息（若状态为 failed）
    error_message   TEXT,

    -- 议会开始时间
    started_at      TIMESTAMPTZ,

    -- 议会完成时间
    completed_at    TIMESTAMPTZ,

    -- 时间戳
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE councils IS '议会记录表，存储每次议会会话的完整流程数据';
COMMENT ON COLUMN councils.id IS '议会唯一 ID（UUID）';
COMMENT ON COLUMN councils.user_id IS '发起议会的用户 ID';
COMMENT ON COLUMN councils.type IS '议会类型：wisdom(智慧议会) / future(未来议会) / mixed(混合)';
COMMENT ON COLUMN councils.question IS '用户提出的人生问题';
COMMENT ON COLUMN councils.dimension IS '问题维度：career/relationship/growth/existential/health/wealth';
COMMENT ON COLUMN councils.status IS '议会当前状态（见 council_status 枚举）';
COMMENT ON COLUMN councils.debate_structure IS '辩论结构：roundtable/adversarial/socratic';
COMMENT ON COLUMN councils.debate_rounds IS '辩论轮次（1-3）';
COMMENT ON COLUMN councils.dispatch_plan IS '调度方案 JSON：Agent 列表、发言角度、顺序';
COMMENT ON COLUMN councils.conflict_analysis IS '冲突分析结果 JSON：冲突值、冲突对、冲突矩阵';
COMMENT ON COLUMN councils.consensus_result IS '共识结果 JSON：共识点、分歧点、行动建议';
COMMENT ON COLUMN councils.chairman_opening IS '主席开场白';
COMMENT ON COLUMN councils.chairman_closing IS '主席总结陈词';
COMMENT ON COLUMN councils.session_number IS '该用户的第几次议会（从 1 开始）';
COMMENT ON COLUMN councils.user_intervention_required IS '是否需要用户介入裁决冲突';
COMMENT ON COLUMN councils.user_intervention_response IS '用户对冲突的裁决回应';
COMMENT ON COLUMN councils.error_message IS '错误信息（status 为 failed 时填充）';
COMMENT ON COLUMN councils.started_at IS '议会开始执行时间';
COMMENT ON COLUMN councils.completed_at IS '议会全部完成时间';
COMMENT ON COLUMN councils.created_at IS '创建时间';
COMMENT ON COLUMN councils.updated_at IS '更新时间';

-- ------------------------------------------------------------
-- 3. 索引
-- ------------------------------------------------------------

-- 用户 ID 索引（查询用户的所有议会）
CREATE INDEX IF NOT EXISTS idx_councils_user_id ON councils(user_id);

-- 状态索引（查询待处理/进行中的议会）
CREATE INDEX IF NOT EXISTS idx_councils_status ON councils(status);

-- 类型索引（按议会类型统计）
CREATE INDEX IF NOT EXISTS idx_councils_type ON councils(type);

-- 用户 + 创建时间复合索引（查询用户议会历史，按时间倒序）
CREATE INDEX IF NOT EXISTS idx_councils_user_created ON councils(user_id, created_at DESC);

-- 用户 + 状态复合索引（查询用户进行中的议会）
CREATE INDEX IF NOT EXISTS idx_councils_user_status ON councils(user_id, status);

-- 调度方案 GIN 索引（按 Agent 检索议会）
CREATE INDEX IF NOT EXISTS idx_councils_dispatch_plan ON councils USING GIN(dispatch_plan);

-- 冲突分析 GIN 索引（按冲突等级检索）
CREATE INDEX IF NOT EXISTS idx_councils_conflict ON councils USING GIN(conflict_analysis);

-- ------------------------------------------------------------
-- 4. 触发器：自动更新 updated_at
-- ------------------------------------------------------------

CREATE TRIGGER trg_councils_updated_at
    BEFORE UPDATE ON councils
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 5. RLS（Row Level Security）策略
-- ------------------------------------------------------------

ALTER TABLE councils ENABLE ROW LEVEL SECURITY;

-- 策略 1：用户只能查看自己的议会
CREATE POLICY councils_select_own
    ON councils FOR SELECT
    USING (auth.uid() = user_id);

-- 策略 2：用户只能插入自己的议会
CREATE POLICY councils_insert_own
    ON councils FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 策略 3：用户只能更新自己的议会
CREATE POLICY councils_update_own
    ON councils FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 策略 4：用户只能删除自己的议会
CREATE POLICY councils_delete_own
    ON councils FOR DELETE
    USING (auth.uid() = user_id);

-- 策略 5：管理员可以访问所有议会
CREATE POLICY councils_admin_all
    ON councils FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ------------------------------------------------------------
-- 6. 辅助函数
-- ------------------------------------------------------------

-- 获取用户的下一个会话编号
CREATE OR REPLACE FUNCTION get_next_session_number(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_next INT;
BEGIN
    SELECT COALESCE(MAX(session_number), 0) + 1 INTO v_next
    FROM councils
    WHERE user_id = p_user_id;

    RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- 创建议会时自动设置 session_number 和 started_at
CREATE OR REPLACE FUNCTION auto_set_council_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- 若未指定 session_number，自动生成
    IF NEW.session_number IS NULL OR NEW.session_number = 0 THEN
        NEW.session_number := get_next_session_number(NEW.user_id);
    END IF;

    -- 若状态从 pending 变为 dispatched，设置 started_at
    IF NEW.status != 'pending' AND NEW.started_at IS NULL THEN
        NEW.started_at := NOW();
    END IF;

    -- 若状态变为 completed，设置 completed_at
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_councils_defaults
    BEFORE INSERT OR UPDATE ON councils
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_council_defaults();

-- ------------------------------------------------------------
-- 7. 记录 Schema 版本
-- ------------------------------------------------------------

INSERT INTO schema_versions (version, file_name, description)
VALUES ('1.2.0', 'meetings.sql', '议会记录表：councils + 索引 + RLS + 会话编号函数')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- 文件结束 — meetings.sql
-- 依赖: schema.sql, users.sql
-- 后续: agents.sql, messages.sql, memories.sql
-- ============================================================
