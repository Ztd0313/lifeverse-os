# Consensus Chain — 共识形成 Chain

> Chain 编号: LV-CHAIN-04
> 所属层级: 第 4 层 Prompt Chain
> 触发位置: 冲突检测 Chain 完成后
> 调用顺序: Conflict → **Consensus** → Destiny Report → ...

## Chain 名称
共识形成链（Consensus Formation Chain）

## 触发条件
- 冲突检测 Chain 已完成，输出 `conflict_analysis`
- council 状态为 `conflict_analyzed` 或 `user_resolved`
- 若 `user_intervention_required` 为 true，需等待用户回应后方可触发

## 输入 Schema

```json
{
  "council_id": "string (uuid)",
  "question": "string — 用户原始问题",
  "rounds": "array — 完整辩论记录（从 Debate Chain 透传）",
  "debate_summary": "object — 辩论摘要",
  "conflict_analysis": {
    "overall_conflict_score": "number 0-100",
    "conflict_level": "low | medium | high | extreme",
    "conflict_pairs": "array",
    "conflict_matrix": "object"
  },
  "user_intervention": {
    "required": "boolean",
    "user_response": "string | null — 用户对冲突的裁决回应",
    "user_lean": "string | null — 用户倾向的方向"
  },
  "user_profile": "object — 用户画像和价值雷达"
}
```

## Prompt 模板（完整 System Prompt）

```
你是 LifeVerse 的共识形成者，负责从辩论和冲突中提炼共识，生成最终给用户的议会总结。

你的核心任务：
1. 提取所有 Agent 达成一致的"共识点"
2. 保留无法消除的"分歧点"，以"求同存异"的方式呈现
3. 若用户已介入裁决，将用户倾向纳入共识权重
4. 生成一段主席的总结陈词，回应用户的原始问题

共识提取策略（根据冲突等级）：

【低冲突 0-30】
- 直接提取所有 Agent 的共同建议
- 共识点数量多，分歧点少
- 生成统一的行动建议

【中冲突 31-60】
- 提取"条件性共识"：在什么条件下大家一致，在什么条件下分歧
- 显性化分歧点，但给出"折中方案"或"分阶段方案"
- 行动建议包含主方案 + 备选方案

【高冲突 61-85】
- 若用户已介入：以用户倾向为主轴，整合支持该倾向的 Agent 观点
- 若用户未介入：输出 2 个对立方案，各自列出支持理由，交由用户最终选择
- 明确标注"议会无法形成单一共识"

【极冲突 86-100】
- 不强行求共识，输出"多元视角报告"
- 每个阵营的核心主张独立呈现
- 强调：这不是缺陷，而是问题的多面性，用户需自行裁决

共识总结要求：
- 共识点必须是 Agent 们实质上同意的内容，不能编造
- 分歧点必须公正呈现双方理由，不偏袒
- 主席总结陈词需回应用户的原始问题，给出可行动的方向
- 语气：主席的语气应沉稳、包容、有决断力

请基于辩论记录和冲突分析，生成本次议会的共识报告。
```

## 输出 Schema（JSON）

```json
{
  "council_id": "string (uuid)",
  "consensus": {
    "consensus_points": [
      {
        "point": "string — 共识点描述",
        "supporting_agents": "array — 支持该共识的 agent_id 列表",
        "confidence": "number 0-100 — 共识置信度"
      }
    ],
    "divergence_points": [
      {
        "point": "string — 分歧点描述",
        "position_a": {
          "agents": "array",
          "argument": "string — 该方论点"
        },
        "position_b": {
          "agents": "array",
          "argument": "string — 对立方论点"
        },
        "resolution": "compromise | deferred | user_decides — 如何处理该分歧"
      }
    ],
    "actionable_advice": [
      {
        "priority": "primary | secondary | fallback",
        "advice": "string — 具体行动建议",
        "conditions": "string | null — 适用条件",
        "supporting_agents": "array"
      }
    ]
  },
  "chairman_closing": {
    "summary": "string — 主席总结陈词（200-400 字），回应用户原始问题",
    "tone": "decisive | balanced | open — 主席语气",
    "key_message": "string — 一句话核心信息",
    "user_next_step": "string — 建议用户的下一步行动"
  },
  "consensus_quality": {
    "agreement_ratio": "number 0-1 — 共识比例",
    "resolution_completeness": "number 0-1 — 问题解决完整度",
    "user_alignment": "number 0-1 — 与用户价值雷达的契合度"
  },
  "next_chain": "destiny_report"
}
```

## 与下一个 Chain 的衔接

- **下游 Chain**: `destiny_report.md`（命运报告 Chain）
- **传递数据**: `council_id`、`consensus`（共识点、分歧点、行动建议）、`chairman_closing`（主席总结）、`consensus_quality`、`user_profile`、`question`
- **衔接说明**: 共识形成后，将共识结果和主席总结传入命运报告 Chain。命运报告 Chain 会基于共识、用户画像、辩论过程，生成完整的 6 维度命运报告、5 大人生指数和雷达图数据。这是面向用户的最终交付物。
- **状态流转**: council 状态从 `conflict_analyzed` / `user_resolved` → `consensus_formed` → 进入命运报告生成阶段
- **持久化**: `consensus` 和 `chairman_closing` 写入 `reports` 表，`consensus_quality` 作为报告质量指标
