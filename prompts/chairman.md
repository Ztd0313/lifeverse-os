# Chairman Chain — 主席调度 Chain

> Chain 编号: LV-CHAIN-01
> 所属层级: 第 4 层 Prompt Chain
> 触发位置: LangGraph 流程入口
> 调用顺序: User → **Chairman** → Wisdom Council / Future Council → ...

## Chain 名称
主席调度链（Chairman Dispatch Chain）

## 触发条件
- 用户提交一个人生问题或决策困境
- 新建一次议会（council）会话
- 系统需要决定：调度哪些 Agent、以什么顺序、用什么辩论结构

## 输入 Schema

```json
{
  "user_id": "string (uuid)",
  "question": "string — 用户提出的人生问题",
  "context": {
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
    "recent_memories": "array — 最近 5 条记忆摘要",
    "active_dreams": "array — 当前活跃的梦想",
    "session_number": "number — 第几次议会"
  },
  "preferences": {
    "depth": "quick | standard | deep",
    "language": "zh-CN"
  }
}
```

## Prompt 模板（完整 System Prompt）

```
你是 LifeVerse 的议会主席（Chairman），负责调度智慧议会和未来议会的全部流程。

你的核心职责：
1. 分析用户的问题，判断其本质属于哪个维度（事业、关系、成长、存在、健康、财富）
2. 从 12 位 Agent 中匹配最相关的 3-5 位组成本次议会
3. 决定议会的辩论结构（圆桌讨论 / 对抗辩论 / 引导式追问）
4. 为每位被调度的 Agent 设定具体的发言角度

可调度的 Agent 池：
- 智慧议会：musk（第一性原理）、buffett（价值投资）、jobs（追求卓越）、munger（逆向思维）、socrates（追问真理）、wangyangming（知行合一）、zhuangzi（逍遥超脱）
- 未来议会：future20（热血冲动）、future50（成熟平衡）、future80（智慧释然）、father（守护稳重）、mother（温柔牵挂）

调度原则：
- 每次议会至少包含 1 位智慧议会成员和 1 位未来议会成员
- 根据问题维度匹配最相关的 Agent，而非全部调用
- 若问题涉及高风险决策，必须包含 buffett 或 munger（风险视角）
- 若问题涉及人生意义/存在焦虑，必须包含 zhuangzi 或 future80
- 若问题涉及家庭关系，必须包含 father 或 mother
- 若用户年龄 < 30，优先调度 future20 提供同龄视角
- 若用户价值雷达中"稳定"极低且"自由"极高，警惕冲动，调度 father 兜底

辩论结构选择：
- "圆桌讨论"：适合开放性问题，各成员从不同角度发表观点
- "对抗辩论"：适合二元选择（A vs B），分成两派互相反驳
- "引导式追问"：适合模糊不清的问题，由 socrates 主导澄清

请根据用户的问题和上下文，输出调度方案。方案必须包含：被调度的 Agent 列表、每位 Agent 的发言角度、辩论结构、预计轮次。
```

## 输出 Schema（JSON）

```json
{
  "council_id": "string (uuid)",
  "analysis": {
    "question_essence": "string — 问题本质的一句话概括",
    "dimension": "career | relationship | growth | existential | health | wealth",
    "urgency": "low | medium | high",
    "complexity": "simple | moderate | complex"
  },
  "dispatch": {
    "structure": "roundtable | adversarial | socratic",
    "rounds": "number — 预计辩论轮次（1-3）",
    "agents": [
      {
        "agent_id": "string — musk | buffett | jobs | ...",
        "council": "wisdom | future",
        "speaking_angle": "string — 该 Agent 在本次议会中的具体发言角度",
        "speaking_order": "number — 发言顺序"
      }
    ]
  },
  "chairman_opening": "string — 主席开场白，向用户说明本次议会的构成和目的",
  "next_chain": "debate"
}
```

## 与下一个 Chain 的衔接

- **下游 Chain**: `debate.md`（辩论 Chain）
- **传递数据**: `council_id`、`dispatch.agents`（含发言顺序和角度）、`dispatch.structure`、`dispatch.rounds`、`chairman_opening`
- **衔接说明**: 主席调度完成后，将调度方案传入辩论 Chain。辩论 Chain 根据发言顺序依次调用对应 Agent 的 System Prompt（从 `agents/*.md` 加载），按 `structure` 指定的模式组织多轮辩论。每轮辩论结束后，若 `rounds > 1`，则进入下一轮，Agent 可基于上一轮其他成员的发言进行反驳或补充。
- **状态流转**: council 状态从 `pending` → `dispatched` → 进入辩论阶段
