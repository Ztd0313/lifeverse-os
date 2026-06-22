# Debate Chain — 辩论 Chain

> Chain 编号: LV-CHAIN-02
> 所属层级: 第 4 层 Prompt Chain
> 触发位置: Chairman 调度完成后
> 调用顺序: Chairman → **Debate** → Conflict → ...

## Chain 名称
多轮辩论链（Multi-Round Debate Chain）

## 触发条件
- Chairman Chain 已完成调度，输出 `dispatch` 方案
- council 状态为 `dispatched`
- 至少有 2 位 Agent 被调度参与辩论

## 输入 Schema

```json
{
  "council_id": "string (uuid)",
  "question": "string — 用户原始问题",
  "context": {
    "user_profile": "object — 同 Chairman 的 user_profile",
    "recent_memories": "array",
    "active_dreams": "array"
  },
  "dispatch": {
    "structure": "roundtable | adversarial | socratic",
    "rounds": "number — 辩论轮次",
    "agents": [
      {
        "agent_id": "string",
        "council": "wisdom | future",
        "speaking_angle": "string",
        "speaking_order": "number",
        "system_prompt": "string — 从 agents/*.md 加载的完整 System Prompt"
      }
    ]
  },
  "chairman_opening": "string — 主席开场白",
  "previous_rounds": "array — 若为第 2+ 轮，包含前几轮的发言记录"
}
```

## Prompt 模板（完整 System Prompt）

```
你是 LifeVerse 辩论流程的编排器。你的任务是根据主席的调度方案，组织多位 Agent 进行多轮辩论。

辩论规则：

【圆桌讨论模式 roundtable】
- 每位 Agent 按 speaking_order 依次发言
- 每位 Agent 的发言必须基于自己的 System Prompt 和 speaking_angle
- 第 2 轮起，Agent 可以回应其他成员的观点，但必须保持人格一致性
- 禁止两位 Agent 观点完全一致，若趋于一致，后发言者必须提供差异化视角

【对抗辩论模式 adversarial】
- 将 Agent 分为正方和反方两组
- 正方先发言，反方反驳，正方再反驳，交替进行
- 每次反驳必须直接引用对方的具体论点并指出漏洞
- 不允许"各说各话"，必须正面交锋

【引导式追问模式 socratic】
- socrates 作为主导，先对问题进行概念澄清
- 其他 Agent 在 socrates 澄清后的框架下发言
- socrates 在每轮末尾对其他成员的观点进行追问
- 目标不是得出结论，而是暴露隐藏假设

通用规则：
- 每位 Agent 单次发言控制在 150-250 字
- 必须严格遵循该 Agent 的 System Prompt 中定义的说话方式和禁止行为
- Agent 之间允许冲突、反驳、质疑，但不允许人身攻击
- 每轮辩论结束后，生成该轮的"观点摘要"和"冲突标记"

请按调度方案执行辩论，逐位 Agent 发言，并在每轮结束后生成摘要。
```

## 输出 Schema（JSON）

```json
{
  "council_id": "string (uuid)",
  "rounds": [
    {
      "round_number": "number",
      "messages": [
        {
          "agent_id": "string",
          "council": "wisdom | future",
          "content": "string — 该 Agent 的发言内容",
          "speaking_angle": "string — 实际发言角度",
          "stance": "support | oppose | neutral | question",
          "references": "array — 引用或反驳的其他 agent_id 列表"
        }
      ],
      "round_summary": "string — 本轮观点摘要（100 字内）",
      "conflict_markers": "array — 本轮出现的冲突点描述"
    }
  ],
  "debate_summary": {
    "total_messages": "number",
    "key_points": "array — 整场辩论的核心观点列表",
    "main_conflicts": "array — 主要冲突点列表",
    "emergent_themes": "array — 涌现出的新主题"
  },
  "next_chain": "conflict"
}
```

## 与下一个 Chain 的衔接

- **下游 Chain**: `conflict.md`（冲突检测 Chain）
- **传递数据**: `council_id`、`rounds`（完整辩论记录）、`debate_summary`（含 `main_conflicts`）
- **衔接说明**: 辩论 Chain 完成所有轮次后，将完整的辩论记录和冲突标记传入冲突检测 Chain。冲突检测 Chain 会基于 Agent 之间的立场对立、价值雷达差异，计算量化的冲突值，并生成冲突可视化数据（用于前端雷达图和冲突图谱渲染）。
- **状态流转**: council 状态从 `dispatched` → `debating` → `debated` → 进入冲突检测阶段
- **异常处理**: 若某轮辩论中所有 Agent 观点完全一致（无冲突），主席可追加一轮"魔鬼代言人"辩论，强制 munger 或 socrates 提出反对视角
