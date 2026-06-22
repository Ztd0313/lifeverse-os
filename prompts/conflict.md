# Conflict Chain — 冲突检测 Chain

> Chain 编号: LV-CHAIN-03
> 所属层级: 第 4 层 Prompt Chain
> 触发位置: 辩论 Chain 完成后
> 调用顺序: Debate → **Conflict** → Consensus → ...

## Chain 名称
冲突检测链（Conflict Detection Chain）

## 触发条件
- 辩论 Chain 已完成，输出完整的 `rounds` 和 `debate_summary`
- council 状态为 `debated`
- 辩论记录中存在至少 2 位 Agent 的发言

## 输入 Schema

```json
{
  "council_id": "string (uuid)",
  "question": "string — 用户原始问题",
  "rounds": [
    {
      "round_number": "number",
      "messages": [
        {
          "agent_id": "string",
          "council": "wisdom | future",
          "content": "string",
          "stance": "support | oppose | neutral | question",
          "references": "array"
        }
      ],
      "conflict_markers": "array"
    }
  ],
  "debate_summary": {
    "main_conflicts": "array",
    "key_points": "array",
    "emergent_themes": "array"
  },
  "agent_value_radars": "object — 各参与 Agent 的价值雷达数据 { agent_id: { 自由, 财富, 幸福, 稳定, 成长 } }"
}
```

## Prompt 模板（完整 System Prompt）

```
你是 LifeVerse 的冲突分析师，负责从辩论记录中检测、量化和可视化 Agent 之间的冲突。

你的核心任务：
1. 识别 Agent 之间的立场对立点（支持 vs 反对、激进 vs 保守、理性 vs 感性）
2. 基于价值雷达数据，计算 Agent 之间的价值观冲突强度
3. 生成冲突可视化数据，供前端渲染冲突图谱和雷达图
4. 判断冲突是否需要升级处理（如触发额外辩论轮次）

冲突检测维度：

【立场冲突】
- 直接对立：Agent A 支持 X，Agent B 反对 X
- 间接对立：Agent A 的方案隐含否定 Agent B 的核心前提
- 量化：stance 字段为 support/oppose 的对立组合，冲突值 0-100

【价值观冲突】
- 基于 agent_value_radars 计算两位 Agent 在 5 个维度上的差异
- 冲突值 = 两个雷达向量的余弦距离 × 100，归一化到 0-100
- 维度差异 > 30 的维度标记为"高冲突维度"

【风格冲突】
- 理性派（musk, buffett, munger）vs 感性派（jobs, mother, future20）
- 入世派（musk, buffett, father）vs 出世派（zhuangzi, future80, socrates）
- 量化：基于 Agent 标签的冲突矩阵

【冲突等级判定】
- 0-30：低冲突（观点互补，可自然形成共识）
- 31-60：中冲突（存在分歧，需要显性化处理后共识）
- 61-85：高冲突（根本性对立，需要用户介入裁决）
- 86-100：极冲突（价值观根本对立，可能无法形成单一共识，需输出多方案）

请分析辩论记录，输出冲突检测结果和可视化数据。
```

## 输出 Schema（JSON）

```json
{
  "council_id": "string (uuid)",
  "conflict_analysis": {
    "overall_conflict_score": "number 0-100 — 整体冲突强度",
    "conflict_level": "low | medium | high | extreme",
    "conflict_pairs": [
      {
        "agent_a": "string",
        "agent_b": "string",
        "conflict_score": "number 0-100",
        "conflict_type": "stance | value | style",
        "high_conflict_dimensions": "array — 高冲突的价值维度",
        "description": "string — 冲突点描述"
      }
    ],
    "conflict_matrix": {
      "agents": "array — 参与的 agent_id 列表",
      "matrix": "array — N×N 冲突值矩阵"
    }
  },
  "visualization_data": {
    "conflict_graph": {
      "nodes": [
        {
          "id": "string — agent_id",
          "label": "string — Agent 显示名",
          "council": "wisdom | future",
          "value_radar": "object — 该 Agent 的价值雷达"
        }
      ],
      "edges": [
        {
          "source": "string — agent_id",
          "target": "string — agent_id",
          "weight": "number — 冲突值 0-100",
          "type": "stance | value | style"
        }
      ]
    },
    "radar_comparison": {
      "agents": "array — agent_id 列表",
      "dimensions": ["自由", "财富", "幸福", "稳定", "成长"],
      "values": "object — { agent_id: [5 个维度的值] }"
    },
    "conflict_heatmap": "array — 冲突热力图数据，用于前端渲染"
  },
  "user_intervention_required": "boolean — 是否需要用户介入裁决",
  "intervention_prompt": "string | null — 若需要用户介入，生成给用户的提问",
  "next_chain": "consensus"
}
```

## 与下一个 Chain 的衔接

- **下游 Chain**: `consensus.md`（共识形成 Chain）
- **传递数据**: `council_id`、`conflict_analysis`（含冲突等级和冲突对）、`rounds`（辩论记录，从 Debate Chain 透传）、`user_intervention_required`
- **衔接说明**: 冲突检测完成后，将冲突分析结果连同辩论记录传入共识形成 Chain。共识 Chain 会基于冲突等级采取不同策略：低冲突直接提取共识；中冲突显性化分歧后求同存异；高冲突若 `user_intervention_required` 为 true，则暂停等待用户裁决后再继续。
- **状态流转**: council 状态从 `debated` → `conflict_analyzed` → 若需用户介入则 `awaiting_user` → 用户回应后 `user_resolved` → 进入共识形成阶段
- **前端联动**: `visualization_data` 直接传给前端，渲染冲突图谱、雷达对比图和冲突热力图
