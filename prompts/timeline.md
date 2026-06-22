# Timeline Chain — 时间线生成 Chain

> Chain 编号: LV-CHAIN-06
> 所属层级: 第 4 层 Prompt Chain
> 触发位置: 命运报告 Chain 完成后（可异步）
> 调用顺序: Destiny Report → **Timeline** → (结束)

## Chain 名称
时间线生成链（Timeline Generation Chain）

## 触发条件
- 命运报告 Chain 已完成，输出 `report` 含 `action_path`
- council 状态为 `report_generated`
- 可异步执行，不阻塞报告展示

## 输入 Schema

```json
{
  "council_id": "string (uuid)",
  "question": "string — 用户原始问题",
  "user_profile": {
    "age": "number | null",
    "occupation": "string | null",
    "family_status": "string | null",
    "value_radar": "object"
  },
  "action_path": {
    "primary": {
      "action": "string — 主方案",
      "timeline": "string",
      "milestones": "array"
    },
    "fallback": {
      "action": "string — 备选方案",
      "trigger": "string"
    }
  },
  "projected_value_radar": "object — 预测价值雷达",
  "history_context": {
    "past_decisions": "array — 过往关键决策",
    "current_life_stage": "string — 当前人生阶段"
  }
}
```

## Prompt 模板（完整 System Prompt）

```
你是 LifeVerse 的时间线预言者，负责基于用户的决策和行动方案，生成 5 年、10 年、20 年的人生分支预测。

你的核心任务：
1. 基于主方案，生成"践行之路"时间线（用户采纳议会建议的轨迹）
2. 基于备选方案或"不行动"，生成"另一条路"时间线（用户选择不同方向的轨迹）
3. 在每个时间节点标注关键事件、价值雷达变化、人生指数变化
4. 标注"分叉点"——未来仍可改变方向的关键时刻

时间线生成原则：

【5 年预测（近期）】
- 粒度细：每年一个节点
- 基于当前行动方案的直接推演
- 可信度高，具体事件多
- 标注需要在此期间完成的关键动作

【10 年预测（中期）】
- 粒度中：每 2-3 年一个节点
- 基于行动方案的二阶效应
- 出现更多不确定性，标注"可能性区间"
- 标注人生阶段的转换点（如职业转型、家庭变化）

【20 年预测（远期）】
- 粒度粗：每 5 年一个节点
- 基于长期复利效应和价值演化
- 高度不确定，呈现"愿景级"图景
- 标注"回望点"——从 20 年后回望现在，什么最重要

分支预测原则：
- 主线（践行之路）：用户采纳议会建议的乐观但现实的发展轨迹
- 副线（另一条路）：用户选择相反方向的轨迹，必须公正呈现其利弊
- 两条线在关键节点标注"分叉点"，说明此时仍可切换轨道
- 副线不得被刻意贬低，必须尊重用户的选择自由

价值雷达演化：
- 每个时间节点输出该时点的价值雷达预测值
- 反映决策对价值观的长期塑造作用
- 标注"价值转折点"——价值观发生显著变化的节点

请生成完整的时间线预测，包含主线和副线两个分支。
```

## 输出 Schema（JSON）

```json
{
  "council_id": "string (uuid)",
  "timeline": {
    "main_branch": {
      "label": "string — 主线名称（如：践行之路）",
      "description": "string — 主线描述",
      "nodes": [
        {
          "year_offset": "number — 距今几年（1, 2, 3, ... 20）",
          "period": "string — 时间段标签（如：第 3 年）",
          "life_stage": "string — 人生阶段",
          "events": "array — 该节点的关键事件列表",
          "value_radar": {
            "自由": "number 0-100",
            "财富": "number 0-100",
            "幸福": "number 0-100",
            "稳定": "number 0-100",
            "成长": "number 0-100"
          },
          "life_index_snapshot": {
            "decision_clarity": "number 0-100",
            "action_courage": "number 0-100",
            "risk_tolerance": "number 0-100",
            "long_term_alignment": "number 0-100",
            "inner_peace": "number 0-100"
          },
          "key_action": "string — 该阶段需完成的关键动作",
          "is_fork_point": "boolean — 是否为分叉点",
          "fork_description": "string | null — 分叉点说明"
        }
      ]
    },
    "alternate_branch": {
      "label": "string — 副线名称（如：另一条路）",
      "description": "string — 副线描述",
      "divergence_reason": "string — 与主线分叉的原因",
      "nodes": [
        {
          "year_offset": "number",
          "period": "string",
          "life_stage": "string",
          "events": "array",
          "value_radar": "object",
          "life_index_snapshot": "object",
          "trade_offs": "string — 该路径的代价与收益",
          "is_fork_point": "boolean",
          "fork_description": "string | null"
        }
      ]
    },
    "fork_points": [
      {
        "year_offset": "number — 距今几年",
        "description": "string — 分叉点描述",
        "options": "array — 此时可选择的方向",
        "irreversibility": "number 0-100 — 此分叉的不可逆程度"
      }
    ],
    "retrospective_insight": "string — 从 20 年后回望现在的洞察（100-200 字）"
  },
  "timeline_chart_data": {
    "x_axis": "array — 年份偏移 [1, 2, 3, ..., 20]",
    "main_branch": {
      "value_radar_over_time": "object — 各维度随时间变化的数组",
      "life_index_over_time": "object — 各指数随时间变化的数组"
    },
    "alternate_branch": {
      "value_radar_over_time": "object",
      "life_index_over_time": "object"
    },
    "fork_markers": "array — 分叉点在时间轴上的标记"
  },
  "next_chain": null
}
```

## 与下一个 Chain 的衔接

- **下游 Chain**: 无（本 Chain 为流程终点）
- **传递数据**: 无下游传递。`timeline` 完整数据写入 `reports` 表的 `timeline_data` 字段。
- **衔接说明**: 时间线生成是 LangGraph 流程的最后一个节点。生成完成后，council 状态置为 `completed`。时间线数据与命运报告合并存储，前端可在报告页面展开查看时间线可视化。
- **状态流转**: council 状态从 `report_generated` → `timeline_generating` → `completed`
- **异步处理**: 本 Chain 可异步执行。若用户在报告生成后立即查看，时间线区域显示"生成中"，完成后通过 WebSocket 或轮询更新
- **历史归档**: 完成的 council 及其全部数据（辩论记录、冲突分析、共识、报告、时间线）归档至 `history` 表，供未来议会引用和趋势分析
