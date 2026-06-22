# Destiny Report Chain — 命运报告 Chain

> Chain 编号: LV-CHAIN-05
> 所属层级: 第 4 层 Prompt Chain
> 触发位置: 共识形成 Chain 完成后
> 调用顺序: Consensus → **Destiny Report** → Timeline → ...

## Chain 名称
命运报告生成链（Destiny Report Generation Chain）

## 触发条件
- 共识形成 Chain 已完成，输出 `consensus` 和 `chairman_closing`
- council 状态为 `consensus_formed`
- 这是面向用户的最终报告生成环节

## 输入 Schema

```json
{
  "council_id": "string (uuid)",
  "question": "string — 用户原始问题",
  "user_profile": {
    "age": "number | null",
    "occupation": "string | null",
    "family_status": "string | null",
    "value_radar": {
      "自由": "number 0-100",
      "财富": "number 0-100",
      "幸福": "number 0-100",
      "稳定": "number 0-100",
      "成长": "number 0-100"
    }
  },
  "consensus": {
    "consensus_points": "array",
    "divergence_points": "array",
    "actionable_advice": "array"
  },
  "chairman_closing": {
    "summary": "string",
    "key_message": "string",
    "user_next_step": "string"
  },
  "debate_summary": "object — 辩论摘要",
  "conflict_analysis": "object — 冲突分析",
  "history_context": {
    "past_councils": "array — 过往议会摘要（用于趋势分析）",
    "value_radar_history": "array — 价值雷达历史变化"
  }
}
```

## Prompt 模板（完整 System Prompt）

```
你是 LifeVerse 的命运报告撰写者，负责将整场议会的成果转化为一份完整、深刻、可行动的命运报告。

报告必须包含以下 6 个维度：

【维度 1：决策洞察（Decision Insight）】
- 对用户问题的本质剖析
- 议会达成的核心共识
- 关键分歧及处理方式

【维度 2：价值雷达（Value Radar）】
- 基于用户当前价值雷达和议会讨论，输出更新后的价值雷达
- 5 个维度：自由、财富、幸福、稳定、成长
- 标注本次议会对各维度的影响（+/- 变化）

【维度 3：人生指数（Life Index）】
计算 5 大指数（0-100）：
- 决策清晰度（Decision Clarity）：用户对问题的认知清晰程度
- 行动勇气（Action Courage）：用户采取行动的意愿强度
- 风险承受力（Risk Tolerance）：用户能承受的最坏情况
- 长期一致性（Long-term Alignment）：决策与长期目标的一致程度
- 内心平和度（Inner Peace）：决策带来的心理安宁程度

【维度 4：冲突地图（Conflict Map）】
- 议会中的主要冲突点
- 各阵营的核心主张
- 冲突对用户决策的启示

【维度 5：行动路径（Action Path）】
- 主方案：基于共识的首要行动建议
- 备选方案：若主方案受阻的替代路径
- 检查点：执行过程中的关键验证节点

【维度 6：心灵寄语（Soul Message）】
- 从议会中提炼的一段给用户的话
- 语气温暖而有力量
- 不说教，而是启发

报告撰写要求：
- 语言：中文，兼具深度和可读性
- 长度：总报告 800-1500 字
- 结构清晰，每个维度有明确标题
- 雷达图和指数数据必须以 JSON 格式输出，供前端渲染
- 心灵寄语要让人读完有"被看见"的感觉

请基于议会全过程，生成完整的命运报告。
```

## 输出 Schema（JSON）

```json
{
  "council_id": "string (uuid)",
  "report": {
    "title": "string — 报告标题（基于用户问题生成）",
    "generated_at": "string (ISO 8601)",
    "dimensions": {
      "decision_insight": {
        "essence": "string — 问题本质剖析",
        "core_consensus": "string — 核心共识",
        "key_divergence": "string — 关键分歧及处理"
      },
      "value_radar": {
        "current": {
          "自由": "number 0-100",
          "财富": "number 0-100",
          "幸福": "number 0-100",
          "稳定": "number 0-100",
          "成长": "number 0-100"
        },
        "projected": {
          "自由": "number 0-100",
          "财富": "number 0-100",
          "幸福": "number 0-100",
          "稳定": "number 0-100",
          "成长": "number 0-100"
        },
        "changes": {
          "自由": "number — 变化值（正负）",
          "财富": "number",
          "幸福": "number",
          "稳定": "number",
          "成长": "number"
        }
      },
      "life_index": {
        "decision_clarity": "number 0-100",
        "action_courage": "number 0-100",
        "risk_tolerance": "number 0-100",
        "long_term_alignment": "number 0-100",
        "inner_peace": "number 0-100",
        "overall": "number 0-100 — 5 项加权平均"
      },
      "conflict_map": {
        "main_conflicts": "array — 主要冲突点",
        "factions": "array — 各阵营主张",
        "implication": "string — 冲突对决策的启示"
      },
      "action_path": {
        "primary": {
          "action": "string — 主方案",
          "timeline": "string — 建议时间线",
          "milestones": "array — 关键里程碑"
        },
        "fallback": {
          "action": "string — 备选方案",
          "trigger": "string — 触发备选方案的条件"
        },
        "checkpoints": "array — 检查点列表"
      },
      "soul_message": "string — 心灵寄语（100-200 字）"
    },
    "radar_chart_data": {
      "labels": ["自由", "财富", "幸福", "稳定", "成长"],
      "datasets": [
        {
          "label": "当前",
          "data": "array — 5 个维度的当前值"
        },
        {
          "label": "预测",
          "data": "array — 5 个维度的预测值"
        }
      ]
    },
    "index_chart_data": {
      "labels": ["决策清晰度", "行动勇气", "风险承受力", "长期一致性", "内心平和度"],
      "data": "array — 5 项指数值"
    }
  },
  "next_chain": "timeline"
}
```

## 与下一个 Chain 的衔接

- **下游 Chain**: `timeline.md`（时间线生成 Chain）
- **传递数据**: `council_id`、`report.dimensions.action_path`（行动路径）、`report.dimensions.value_radar.projected`（预测价值雷达）、`user_profile`、`question`
- **衔接说明**: 命运报告生成后，将行动路径和预测价值雷达传入时间线生成 Chain。时间线 Chain 会基于行动方案，生成 5 年/10 年/20 年的分支预测，展示不同选择下的人生轨迹。
- **状态流转**: council 状态从 `consensus_formed` → `report_generated` → 进入时间线生成阶段
- **持久化**: 完整 `report` 写入 `reports` 表，`radar_chart_data` 和 `index_chart_data` 作为 JSON 字段存储，供前端直接渲染
- **用户交付**: 报告生成后即可向用户展示，时间线作为报告的延伸模块异步生成
