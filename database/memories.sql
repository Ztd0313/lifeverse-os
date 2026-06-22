-- ============================================================
-- LifeVerse OS — 记忆表 + 梦想表 + 历史表
-- 文件: memories.sql
-- 说明: 创建 memories（记忆）、dreams（梦想）、history（历史归档）三张表
-- 执行顺序: 在 schema.sql, users.sql, meetings.sql, agents.sql, messages.sql 之后执行
-- 数据库: PostgreSQL (Supabase)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 记忆表（memories）
-- 存储用户的人生记忆，供议会引用和人格演化
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS memories (
    -- 主键
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 所属用户
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 记忆类型：event/emotion/insight/decision/relationship
    type            memory_type NOT NULL,

    -- 记忆标题
    title           VARCHAR(256) NOT NULL,

    -- 记忆内容
    content         TEXT NOT NULL,

    -- 记忆发生时间（用户指定，可能是过去某个时间点）
    occurred_at     DATE,

    -- 情绪标签：joy/anger/sadness/fear/love/disgust/surprise/neutral
    emotion         memory_emotion DEFAULT 'neutral',

    -- 情绪强度：0-100
    emotion_intensity INT DEFAULT 50 CHECK (emotion_intensity BETWEEN 0 AND 100),

    -- 重要性：0-100（影响议会的引用权重）
    importance      INT NOT NULL DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),

    -- 关联的议会 ID（若该记忆由某次议会触发）
    council_id      UUID REFERENCES councils(id) ON DELETE SET NULL,

    -- 关联的人物（JSONB 数组，存储相关人物名称）
    -- 格式: ["父亲", "前女友", "导师"]
    related_people  JSONB DEFAULT '[]'::jsonb,

    -- 标签
    tags            TEXT[] DEFAULT '{}',

    -- 价值雷达影响：该记忆对用户价值观的影响
    -- 格式: {"自由": +10, "稳定": -5}
    value_impact    JSONB DEFAULT '{}'::jsonb,

    -- AI 生成的记忆摘要（用于议会快速引用）
    summary         TEXT,

    -- 记忆向量嵌入（用于语义检索，pgvector 扩展）
    -- 若启用 pgvector: embedding VECTOR(1536)
    embedding       JSONB,

    -- 是否已归档
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,

    -- 时间戳
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. memories 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE memories IS '记忆表，存储用户的人生记忆，供议会引用和人格演化';
COMMENT ON COLUMN memories.id IS '记忆唯一 ID';
COMMENT ON COLUMN memories.user_id IS '所属用户 ID';
COMMENT ON COLUMN memories.type IS '记忆类型：event/emotion/insight/decision/relationship';
COMMENT ON COLUMN memories.title IS '记忆标题';
COMMENT ON COLUMN memories.content IS '记忆内容';
COMMENT ON COLUMN memories.occurred_at IS '记忆发生时间（用户指定）';
COMMENT ON COLUMN memories.emotion IS '情绪标签';
COMMENT ON COLUMN memories.emotion_intensity IS '情绪强度 0-100';
COMMENT ON COLUMN memories.importance IS '重要性 0-100（影响议会引用权重）';
COMMENT ON COLUMN memories.council_id IS '关联议会 ID（若由议会触发）';
COMMENT ON COLUMN memories.related_people IS '相关人物 JSON 数组';
COMMENT ON COLUMN memories.tags IS '标签数组';
COMMENT ON COLUMN memories.value_impact IS '价值雷达影响 JSON';
COMMENT ON COLUMN memories.summary IS 'AI 生成的记忆摘要';
COMMENT ON COLUMN memories.embedding IS '记忆向量嵌入（用于语义检索）';
COMMENT ON COLUMN memories.is_archived IS '是否已归档';
COMMENT ON COLUMN memories.created_at IS '创建时间';
COMMENT ON COLUMN memories.updated_at IS '更新时间';

-- ------------------------------------------------------------
-- 3. memories 索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_user_importance ON memories(user_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_user_occurred ON memories(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_user_archived ON memories(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_memories_council_id ON memories(council_id);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memories_related_people ON memories USING GIN(related_people);
CREATE INDEX IF NOT EXISTS idx_memories_content_trgm ON memories USING GIN(content gin_trgm_ops);

-- ------------------------------------------------------------
-- 4. memories 触发器
-- ------------------------------------------------------------

CREATE TRIGGER trg_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 5. memories RLS 策略
-- ------------------------------------------------------------

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY memories_select_own
    ON memories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY memories_insert_own
    ON memories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY memories_update_own
    ON memories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY memories_delete_own
    ON memories FOR DELETE
    USING (auth.uid() = user_id);

-- service_role 可以读取记忆（供 LangGraph 议会流程引用）
CREATE POLICY memories_select_service
    ON memories FOR SELECT
    USING (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 6. 梦想表（dreams）
-- 存储用户的梦想和目标，供议会参考和追踪
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dreams (
    -- 主键
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 所属用户
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 梦想标题
    title           VARCHAR(256) NOT NULL,

    -- 梦想描述
    description     TEXT NOT NULL,

    -- 梦想类别：career/family/health/wealth/creation/experience/spiritual
    category        VARCHAR(32) NOT NULL,

    -- 目标完成时间
    target_date     DATE,

    -- 梦想状态：active/achieved/abandoned/dormant
    status          dream_status NOT NULL DEFAULT 'active',

    -- 优先级：1-5（5 最高）
    priority        INT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),

    -- 完成进度：0-100
    progress        INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

    -- 关联的价值维度（该梦想主要影响哪个价值维度）
    -- 格式: ["自由", "成长"]
    value_dimensions TEXT[] DEFAULT '{}',

    -- 梦想起源：哪个议会/记忆触发了这个梦想
    origin_council_id UUID REFERENCES councils(id) ON DELETE SET NULL,
    origin_memory_id  UUID REFERENCES memories(id) ON DELETE SET NULL,

    -- 实现该梦想的关键步骤（JSONB 数组）
    -- 格式: [{"step": "...", "done": false}, ...]
    milestones      JSONB DEFAULT '[]'::jsonb,

    -- 时间戳
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    achieved_at     TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 7. dreams 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE dreams IS '梦想表，存储用户的梦想和目标';
COMMENT ON COLUMN dreams.id IS '梦想唯一 ID';
COMMENT ON COLUMN dreams.user_id IS '所属用户 ID';
COMMENT ON COLUMN dreams.title IS '梦想标题';
COMMENT ON COLUMN dreams.description IS '梦想描述';
COMMENT ON COLUMN dreams.category IS '梦想类别：career/family/health/wealth/creation/experience/spiritual';
COMMENT ON COLUMN dreams.target_date IS '目标完成时间';
COMMENT ON COLUMN dreams.status IS '梦想状态：active/achieved/abandoned/dormant';
COMMENT ON COLUMN dreams.priority IS '优先级 1-5（5 最高）';
COMMENT ON COLUMN dreams.progress IS '完成进度 0-100';
COMMENT ON COLUMN dreams.value_dimensions IS '关联的价值维度数组';
COMMENT ON COLUMN dreams.origin_council_id IS '触发该梦想的议会 ID';
COMMENT ON COLUMN dreams.origin_memory_id IS '触发该梦想的记忆 ID';
COMMENT ON COLUMN dreams.milestones IS '关键步骤 JSON 数组';
COMMENT ON COLUMN dreams.created_at IS '创建时间';
COMMENT ON COLUMN dreams.updated_at IS '更新时间';
COMMENT ON COLUMN dreams.achieved_at IS '梦想实现时间';

-- ------------------------------------------------------------
-- 8. dreams 索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_user_status ON dreams(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dreams_user_priority ON dreams(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_user_category ON dreams(user_id, category);
CREATE INDEX IF NOT EXISTS idx_dreams_target_date ON dreams(target_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_dreams_origin_council ON dreams(origin_council_id);

-- ------------------------------------------------------------
-- 9. dreams 触发器
-- ------------------------------------------------------------

CREATE TRIGGER trg_dreams_updated_at
    BEFORE UPDATE ON dreams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 梦想状态变为 achieved 时自动设置 achieved_at
CREATE OR REPLACE FUNCTION set_dream_achieved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'achieved' AND OLD.status != 'achieved' AND NEW.achieved_at IS NULL THEN
        NEW.achieved_at := NOW();
        NEW.progress := 100;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dreams_achieved
    BEFORE UPDATE ON dreams
    FOR EACH ROW
    EXECUTE FUNCTION set_dream_achieved_at();

-- ------------------------------------------------------------
-- 10. dreams RLS 策略
-- ------------------------------------------------------------

ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY dreams_select_own
    ON dreams FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY dreams_insert_own
    ON dreams FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY dreams_update_own
    ON dreams FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY dreams_delete_own
    ON dreams FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY dreams_select_service
    ON dreams FOR SELECT
    USING (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 11. 历史归档表（history）
-- 存储已完成议会的完整归档，用于趋势分析和未来议会引用
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS history (
    -- 主键
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 所属用户
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 议会 ID（关联 councils 表）
    council_id      UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,

    -- 会话编号
    session_number  INT NOT NULL,

    -- 用户原始问题
    question        TEXT NOT NULL,

    -- 问题维度
    dimension       VARCHAR(32),

    -- 议会类型
    council_type    council_type NOT NULL,

    -- 参与的 Agent 列表
    -- 格式: ["musk", "buffett", "future20"]
    participating_agents TEXT[] NOT NULL DEFAULT '{}',

    -- 辩论轮次
    debate_rounds   INT,

    -- 辩论结构
    debate_structure debate_structure,

    -- 整体冲突分数
    conflict_score  INT,

    -- 冲突等级
    conflict_level  conflict_level,

    -- 主席总结
    chairman_closing TEXT,

    -- 核心共识点
    -- 格式: ["共识1", "共识2"]
    consensus_points TEXT[] DEFAULT '{}',

    -- 核心分歧点
    divergence_points TEXT[] DEFAULT '{}',

    -- 行动建议
    actionable_advice TEXT[] DEFAULT '{}',

    -- 价值雷达快照（本次议会时的用户价值雷达）
    value_radar_snapshot JSONB,

    -- 价值雷达变化（本次议会对雷达的影响）
    value_radar_change JSONB,

    -- 人生指数快照
    life_index_snapshot JSONB,

    -- 心灵寄语
    soul_message    TEXT,

    -- 关联的报告 ID
    report_id       UUID REFERENCES reports(id) ON DELETE SET NULL,

    -- 议会耗时（毫秒）
    duration_ms     INT,

    -- 议会完成时间
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 创建时间
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 12. history 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE history IS '历史归档表，存储已完成议会的完整摘要，用于趋势分析';
COMMENT ON COLUMN history.id IS '归档记录唯一 ID';
COMMENT ON COLUMN history.user_id IS '所属用户 ID';
COMMENT ON COLUMN history.council_id IS '议会 ID';
COMMENT ON COLUMN history.session_number IS '会话编号';
COMMENT ON COLUMN history.question IS '用户原始问题';
COMMENT ON COLUMN history.dimension IS '问题维度';
COMMENT ON COLUMN history.council_type IS '议会类型';
COMMENT ON COLUMN history.participating_agents IS '参与的 Agent 标识符数组';
COMMENT ON COLUMN history.debate_rounds IS '辩论轮次';
COMMENT ON COLUMN history.debate_structure IS '辩论结构';
COMMENT ON COLUMN history.conflict_score IS '整体冲突分数 0-100';
COMMENT ON COLUMN history.conflict_level IS '冲突等级';
COMMENT ON COLUMN history.chairman_closing IS '主席总结陈词';
COMMENT ON COLUMN history.consensus_points IS '核心共识点数组';
COMMENT ON COLUMN history.divergence_points IS '核心分歧点数组';
COMMENT ON COLUMN history.actionable_advice IS '行动建议数组';
COMMENT ON COLUMN history.value_radar_snapshot IS '价值雷达快照 JSON';
COMMENT ON COLUMN history.value_radar_change IS '价值雷达变化 JSON';
COMMENT ON COLUMN history.life_index_snapshot IS '人生指数快照 JSON';
COMMENT ON COLUMN history.soul_message IS '心灵寄语';
COMMENT ON COLUMN history.report_id IS '关联报告 ID';
COMMENT ON COLUMN history.duration_ms IS '议会耗时（毫秒）';
COMMENT ON COLUMN history.completed_at IS '议会完成时间';
COMMENT ON COLUMN history.created_at IS '归档创建时间';

-- ------------------------------------------------------------
-- 13. history 索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_session ON history(user_id, session_number);
CREATE INDEX IF NOT EXISTS idx_history_user_completed ON history(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_dimension ON history(dimension);
CREATE INDEX IF NOT EXISTS idx_history_council_type ON history(council_type);
CREATE INDEX IF NOT EXISTS idx_history_agents ON history USING GIN(participating_agents);
CREATE INDEX IF NOT EXISTS idx_history_conflict_level ON history(conflict_level);

-- ------------------------------------------------------------
-- 14. history RLS 策略
-- ------------------------------------------------------------

ALTER TABLE history ENABLE ROW LEVEL SECURITY;

CREATE POLICY history_select_own
    ON history FOR SELECT
    USING (auth.uid() = user_id);

-- 历史记录由系统自动归档，用户不能直接插入/修改/删除
CREATE POLICY history_insert_service
    ON history FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY history_delete_admin
    ON history FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin');

-- service_role 可以读取历史（供议会引用）
CREATE POLICY history_select_service
    ON history FOR SELECT
    USING (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- 15. 辅助函数
-- ------------------------------------------------------------

-- 获取用户最近的 N 条记忆（按重要性排序，供议会引用）
CREATE OR REPLACE FUNCTION get_recent_memories(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS SETOF memories AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM memories
    WHERE user_id = p_user_id
      AND is_archived = FALSE
    ORDER BY importance DESC, created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 获取用户活跃的梦想（供议会引用）
CREATE OR REPLACE FUNCTION get_active_dreams(p_user_id UUID)
RETURNS SETOF dreams AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM dreams
    WHERE user_id = p_user_id
      AND status = 'active'
    ORDER BY priority DESC, target_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 获取用户的历史议会摘要（供趋势分析）
CREATE OR REPLACE FUNCTION get_council_history(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS SETOF history AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM history
    WHERE user_id = p_user_id
    ORDER BY completed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 归档已完成的议会到 history 表
CREATE OR REPLACE FUNCTION archive_council(p_council_id UUID)
RETURNS UUID AS $$
DECLARE
    v_council councils%ROWTYPE;
    v_history_id UUID;
    v_report reports;
    v_duration INT;
BEGIN
    -- 获取议会信息
    SELECT * INTO v_council FROM councils WHERE id = p_council_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 计算耗时
    IF v_council.started_at IS NOT NULL AND v_council.completed_at IS NOT NULL THEN
        v_duration := EXTRACT(EPOCH FROM (v_council.completed_at - v_council.started_at)) * 1000;
    END IF;

    -- 获取关联报告
    SELECT * INTO v_report FROM reports WHERE council_id = p_council_id AND type = 'destiny' LIMIT 1;

    -- 插入历史归档
    INSERT INTO history (
        user_id, council_id, session_number, question, dimension,
        council_type, participating_agents, debate_rounds, debate_structure,
        conflict_score, conflict_level, chairman_closing,
        consensus_points, divergence_points, actionable_advice,
        value_radar_snapshot, value_radar_change, life_index_snapshot,
        soul_message, report_id, duration_ms, completed_at
    ) VALUES (
        v_council.user_id, v_council.id, v_council.session_number, v_council.question, v_council.dimension,
        v_council.type,
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_council.dispatch_plan -> 'agents' -> 'agent_id')), ARRAY[]::TEXT[]),
        v_council.debate_rounds, v_council.debate_structure,
        (v_council.conflict_analysis ->> 'overall_conflict_score')::INT,
        (v_council.conflict_analysis ->> 'conflict_level')::conflict_level,
        v_council.chairman_closing,
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_council.consensus_result -> 'consensus_points' -> 'point')), ARRAY[]::TEXT[]),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_council.consensus_result -> 'divergence_points' -> 'point')), ARRAY[]::TEXT[]),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(v_council.consensus_result -> 'actionable_advice' -> 'advice')), ARRAY[]::TEXT[]),
        v_report.value_radar -> 'current',
        v_report.value_radar -> 'changes',
        v_report.life_index,
        v_report.soul_message,
        v_report.id,
        v_duration,
        COALESCE(v_council.completed_at, NOW())
    ) RETURNING id INTO v_history_id;

    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 16. 记录 Schema 版本
-- ------------------------------------------------------------

INSERT INTO schema_versions (version, file_name, description)
VALUES ('1.5.0', 'memories.sql', '记忆表 memories + 梦想表 dreams + 历史表 history + 索引 + RLS + 归档函数')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- 文件结束 — memories.sql
-- 依赖: schema.sql, users.sql, meetings.sql, messages.sql
-- 全部 SQL 文件执行完毕
-- 执行顺序: schema.sql → users.sql → meetings.sql → agents.sql → messages.sql → memories.sql
-- ============================================================
