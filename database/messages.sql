-- ============================================================
-- LifeVerse OS — 消息表 + 报告表
-- 文件: messages.sql
-- 说明: 创建 messages 表（辩论消息）和 reports 表（命运报告）
-- 执行顺序: 在 schema.sql, users.sql, meetings.sql, agents.sql 之后执行
-- 数据库: PostgreSQL (Supabase)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 消息表（messages）
-- 存储议会中每条发言（用户、Agent、主席、系统）
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
    -- 主键
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 所属议会
    council_id      UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,

    -- 发送者类型：user / agent / chairman / system
    sender_type     message_sender_type NOT NULL,

    -- 发送者 ID：
    -- - sender_type=agent 时，关联 agents.id 或 private_agents.id
    -- - sender_type=user 时，关联 users.id
    -- - sender_type=chairman/system 时，为 NULL
    sender_id       UUID,

    -- 发送者标识（冗余字段，便于查询，如 'musk', 'user', 'chairman'）
    sender_key      VARCHAR(64),

    -- 发送者显示名称
    sender_name     VARCHAR(128),

    -- 消息内容
    content         TEXT NOT NULL,

    -- 所属辩论轮次（第 1 轮、第 2 轮...）
    round_number    INT NOT NULL DEFAULT 1,

    -- 发言角度（Agent 的具体发言角度，由 Chairman 调度时指定）
    speaking_angle  TEXT,

    -- 立场：support / oppose / neutral / question
    stance          message_stance,

    -- 引用/反驳的其他消息 ID 列表
    references      UUID[] DEFAULT '{}',

    -- 价值雷达影响：本条消息对用户价值雷达的建议变化
    -- 格式: {"自由": +5, "稳定": -3}
    value_impact    JSONB,

    -- Token 数（用于成本统计）
    token_count     INT,

    -- 模型（生成该消息使用的 LLM）
    model           VARCHAR(32),

    -- 时间戳
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. messages 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE messages IS '消息表，存储议会中的所有发言记录';
COMMENT ON COLUMN messages.id IS '消息唯一 ID';
COMMENT ON COLUMN messages.council_id IS '所属议会 ID';
COMMENT ON COLUMN messages.sender_type IS '发送者类型：user/agent/chairman/system';
COMMENT ON COLUMN messages.sender_id IS '发送者 ID（关联对应表）';
COMMENT ON COLUMN messages.sender_key IS '发送者标识（冗余，便于查询）';
COMMENT ON COLUMN messages.sender_name IS '发送者显示名称';
COMMENT ON COLUMN messages.content IS '消息内容';
COMMENT ON COLUMN messages.round_number IS '所属辩论轮次';
COMMENT ON COLUMN messages.speaking_angle IS 'Agent 发言角度（Chairman 指定）';
COMMENT ON COLUMN messages.stance IS '立场：support/oppose/neutral/question';
COMMENT ON COLUMN messages.references IS '引用/反驳的其他消息 ID 列表';
COMMENT ON COLUMN messages.value_impact IS '价值雷达影响 JSON';
COMMENT ON COLUMN messages.token_count IS 'Token 数（成本统计）';
COMMENT ON COLUMN messages.model IS '生成该消息使用的 LLM 模型';
COMMENT ON COLUMN messages.created_at IS '创建时间';

-- ------------------------------------------------------------
-- 3. messages 索引
-- ------------------------------------------------------------

-- 议会 ID 索引（查询某次议会的所有消息）
CREATE INDEX IF NOT EXISTS idx_messages_council_id ON messages(council_id);

-- 议会 + 轮次复合索引（按轮次查询消息）
CREATE INDEX IF NOT EXISTS idx_messages_council_round ON messages(council_id, round_number);

-- 发送者类型索引（筛选 Agent 发言）
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- 议会 + 创建时间复合索引（按时间顺序获取消息）
CREATE INDEX IF NOT EXISTS idx_messages_council_created ON messages(council_id, created_at);

-- 发送者 ID 索引（查询某 Agent 的所有发言）
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id) WHERE sender_type = 'agent';

-- ------------------------------------------------------------
-- 4. messages 触发器
-- ------------------------------------------------------------

-- messages 表只有 created_at，无 updated_at，不需要更新触发器

-- ------------------------------------------------------------
-- 5. messages RLS 策略
-- ------------------------------------------------------------

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己议会中的消息
-- 需要通过 council_id 关联到 councils 表验证 user_id
CREATE POLICY messages_select_own
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM councils c
            WHERE c.id = messages.council_id
            AND c.user_id = auth.uid()
        )
    );

-- 用户不能直接插入消息（消息由系统/LangGraph 生成）
-- 仅允许 service_role 插入
CREATE POLICY messages_insert_service
    ON messages FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- 用户不能直接更新/删除消息
-- 仅允许 service_role 操作
CREATE POLICY messages_update_service
    ON messages FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY messages_delete_service
    ON messages FOR DELETE
    USING (auth.role() = 'service_role');

-- 管理员拥有全部权限
CREATE POLICY messages_admin_all
    ON messages FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ------------------------------------------------------------
-- 6. 报告表（reports）
-- 存储命运报告、时间线报告等最终交付物
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
    -- 主键
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 所属议会
    council_id      UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,

    -- 所属用户（冗余，便于直接查询）
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 报告类型：destiny(命运报告) / timeline(时间线) / summary(摘要)
    type            report_type NOT NULL,

    -- 报告标题
    title           VARCHAR(256) NOT NULL,

    -- 报告内容：JSONB，存储完整的结构化报告
    -- destiny 类型包含: dimensions(6维度), radar_chart_data, index_chart_data
    -- timeline 类型包含: main_branch, alternate_branch, fork_points
    content         JSONB NOT NULL,

    -- 价值雷达数据：JSONB（当前 + 预测 + 变化）
    -- 格式: {"current": {...}, "projected": {...}, "changes": {...}}
    value_radar     JSONB,

    -- 人生指数数据：JSONB（5 大指数）
    -- 格式: {"decision_clarity": 80, "action_courage": 75, ...}
    life_index      JSONB,

    -- 雷达图数据：JSONB（直接供前端渲染）
    radar_chart_data JSONB,

    -- 指数图数据：JSONB（直接供前端渲染）
    index_chart_data JSONB,

    -- 时间线数据：JSONB（timeline 类型报告专用）
    timeline_data   JSONB,

    -- 冲突可视化数据：JSONB
    conflict_visualization JSONB,

    -- 报告质量指标：JSONB
    -- 格式: {"agreement_ratio": 0.7, "resolution_completeness": 0.8, "user_alignment": 0.85}
    quality_metrics JSONB,

    -- 心灵寄语
    soul_message    TEXT,

    -- 是否已读
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,

    -- 时间戳
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. reports 字段注释
-- ------------------------------------------------------------

COMMENT ON TABLE reports IS '报告表，存储命运报告、时间线等最终交付物';
COMMENT ON COLUMN reports.id IS '报告唯一 ID';
COMMENT ON COLUMN reports.council_id IS '所属议会 ID';
COMMENT ON COLUMN reports.user_id IS '所属用户 ID（冗余，便于查询）';
COMMENT ON COLUMN reports.type IS '报告类型：destiny/timeline/summary';
COMMENT ON COLUMN reports.title IS '报告标题';
COMMENT ON COLUMN reports.content IS '报告完整内容 JSON（结构化）';
COMMENT ON COLUMN reports.value_radar IS '价值雷达数据 JSON（当前+预测+变化）';
COMMENT ON COLUMN reports.life_index IS '人生指数 JSON（5 大指数）';
COMMENT ON COLUMN reports.radar_chart_data IS '雷达图渲染数据 JSON（直接供前端使用）';
COMMENT ON COLUMN reports.index_chart_data IS '指数图渲染数据 JSON';
COMMENT ON COLUMN reports.timeline_data IS '时间线数据 JSON（timeline 报告专用）';
COMMENT ON COLUMN reports.conflict_visualization IS '冲突可视化数据 JSON';
COMMENT ON COLUMN reports.quality_metrics IS '报告质量指标 JSON';
COMMENT ON COLUMN reports.soul_message IS '心灵寄语';
COMMENT ON COLUMN reports.is_read IS '用户是否已读';
COMMENT ON COLUMN reports.created_at IS '创建时间';
COMMENT ON COLUMN reports.updated_at IS '更新时间';

-- ------------------------------------------------------------
-- 8. reports 索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_reports_council_id ON reports(council_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_type ON reports(user_id, type);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports USING GIN(content);

-- ------------------------------------------------------------
-- 9. reports 触发器
-- ------------------------------------------------------------

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 10. reports RLS 策略
-- ------------------------------------------------------------

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的报告
CREATE POLICY reports_select_own
    ON reports FOR SELECT
    USING (auth.uid() = user_id);

-- 报告由系统生成，用户不能直接插入
CREATE POLICY reports_insert_service
    ON reports FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- 用户可以更新 is_read 字段（标记已读）
CREATE POLICY reports_update_own
    ON reports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 用户不能删除报告（仅管理员/service_role 可以）
CREATE POLICY reports_delete_admin
    ON reports FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

-- 管理员拥有全部权限
CREATE POLICY reports_admin_all
    ON reports FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ------------------------------------------------------------
-- 11. 辅助函数
-- ------------------------------------------------------------

-- 获取议会中某 Agent 的所有发言
CREATE OR REPLACE FUNCTION get_agent_messages(p_council_id UUID, p_agent_key VARCHAR)
RETURNS SETOF messages AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM messages
    WHERE council_id = p_council_id
      AND sender_key = p_agent_key
      AND sender_type = 'agent'
    ORDER BY round_number, created_at;
END;
$$ LANGUAGE plpgsql;

-- 获取议会的完整辩论记录（按轮次和时间排序）
CREATE OR REPLACE FUNCTION get_council_debate(p_council_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'round_number', m.round_number,
            'messages', (
                SELECT json_agg(
                    json_build_object(
                        'id', m2.id,
                        'sender_key', m2.sender_key,
                        'sender_name', m2.sender_name,
                        'content', m2.content,
                        'stance', m2.stance,
                        'speaking_angle', m2.speaking_angle,
                        'created_at', m2.created_at
                    )
                    ORDER BY m2.created_at
                )
                FROM messages m2
                WHERE m2.council_id = p_council_id
                  AND m2.round_number = m.round_number
            )
        )
        ORDER BY m.round_number
    ) INTO result
    FROM messages m
    WHERE m.council_id = p_council_id
      AND m.sender_type = 'agent'
    GROUP BY m.round_number;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 标记报告为已读
CREATE OR REPLACE FUNCTION mark_report_read(p_report_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reports
    SET is_read = TRUE
    WHERE id = p_report_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 12. 记录 Schema 版本
-- ------------------------------------------------------------

INSERT INTO schema_versions (version, file_name, description)
VALUES ('1.4.0', 'messages.sql', '消息表 messages + 报告表 reports + 索引 + RLS + 辅助函数')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- 文件结束 — messages.sql
-- 依赖: schema.sql, users.sql, meetings.sql
-- 后续: memories.sql
-- ============================================================
