# LifeVerse API 规范

> 版本：v1.0.0  
> 最后更新：2026-06-22  
> 维护人：David Kim（技术总监）、James Park（高级前端）

本规范定义 LifeVerse 所有 API 的设计原则、端点文档、请求/响应格式、错误码、认证方案与限流策略。

---

## 目录

1. [RESTful API 设计原则](#1-restful-api-设计原则)
2. [现有 API 端点文档](#2-现有-api-端点文档)
3. [管理后台 API 端点设计](#3-管理后台-api-端点设计)
4. [请求/响应格式规范](#4-请求响应格式规范)
5. [错误码定义](#5-错误码定义)
6. [认证方案](#6-认证方案)
7. [限流策略](#7-限流策略)

---

## 1. RESTful API 设计原则

### 1.1 基本约定

- **协议**：生产环境强制 HTTPS
- **数据格式**：JSON（`Content-Type: application/json`）
- **字符编码**：UTF-8
- **时间格式**：ISO 8601（如 `2026-06-22T10:00:00+08:00`）
- **时区**：所有时间默认带时区偏移，服务端按 UTC 存储
- **语言**：中文（`Accept-Language: zh-CN`）
- **版本**：通过 URL 路径前缀（`/api/`），暂不引入显式版本号

### 1.2 URL 设计

**规则：**
- 使用名词复数表示资源集合：`/api/users`、`/api/councils`
- 使用名词单数表示单个资源：`/api/users/{id}`
- 层级不超过 3 层：`/api/admin/users/{id}/councils`
- 查询参数使用 camelCase：`?pageSize=10&sortBy=createdAt`
- 路径参数使用 kebab-case 或纯 ID：`/api/councils/{councilId}`

**示例：**

```
GET    /api/councils              # 获取议会列表
POST   /api/councils              # 创建议会
GET    /api/councils/{id}         # 获取单个议会
DELETE /api/councils/{id}         # 删除议会
GET    /api/users/{id}/councils   # 获取某用户的议会列表
```

### 1.3 HTTP 方法语义

| 方法 | 语义 | 幂等 | 安全 | 示例 |
|------|------|------|------|------|
| GET | 获取资源 | 是 | 是 | `GET /api/councils` |
| POST | 创建资源 | 否 | 否 | `POST /api/councils` |
| PUT | 全量更新资源 | 是 | 否 | `PUT /api/councils/{id}` |
| PATCH | 部分更新资源 | 否 | 否 | `PATCH /api/councils/{id}` |
| DELETE | 删除资源 | 是 | 否 | `DELETE /api/councils/{id}` |

### 1.4 状态码使用

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET、PUT、PATCH、DELETE 成功 |
| 201 Created | 资源创建成功 | POST 创建成功 |
| 204 No Content | 无返回内容 | DELETE 成功（无响应体） |
| 400 Bad Request | 请求参数错误 | 参数校验失败 |
| 401 Unauthorized | 未认证 | 缺少或无效的认证凭证 |
| 403 Forbidden | 无权限 | 已认证但无权访问该资源 |
| 404 Not Found | 资源不存在 | 资源 ID 无效 |
| 409 Conflict | 资源冲突 | 唯一约束冲突 |
| 422 Unprocessable Entity | 语义错误 | 业务逻辑校验失败 |
| 429 Too Many Requests | 请求过多 | 触发限流 |
| 500 Internal Server Error | 服务端错误 | 未捕获的异常 |
| 502 Bad Gateway | 网关错误 | 上游服务不可用 |
| 503 Service Unavailable | 服务不可用 | 维护中或过载 |

---

## 2. 现有 API 端点文档

### 2.1 POST /api/council — 执行命运议会

调用 DeepSeek AI（兼容 OpenAI 协议）执行完整的议会流程，返回议会结果。

**请求**

```http
POST /api/council HTTP/1.1
Content-Type: application/json

{
  "question": "我应该接受海外 offer 还是留在国内陪伴父母？",
  "agentIds": ["musk", "buffett", "father", "mother"],
  "councilType": "wisdom",
  "rounds": 2,
  "userContext": {
    "age": 28,
    "occupation": "软件工程师",
    "familyStatus": "未婚，与父母同城"
  }
}
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | string | 是 | 用户的人生问题（1-500 字） |
| `agentIds` | string[] | 否 | 参与的 Agent ID 列表，不传则由主席自动调度 |
| `councilType` | string | 否 | 议会类型：`wisdom` / `future` / `inner` / `reunion` |
| `rounds` | number | 否 | 辩论轮次（1-3，默认 2） |
| `userContext` | object | 否 | 用户画像，用于个性化 |

**响应（200 OK）**

```json
{
  "councilId": "council-1719033600000-abc1234",
  "question": "我应该接受海外 offer 还是留在国内陪伴父母？",
  "councilType": "wisdom",
  "agentIds": ["musk", "buffett", "father", "mother"],
  "messages": [
    {
      "id": "msg-001",
      "personaId": "chairman",
      "personaName": "主席",
      "role": "system",
      "content": "本次智慧议会召集了 4 位智者...",
      "round": 0,
      "timestamp": 1719033600000
    },
    {
      "id": "msg-002",
      "personaId": "musk",
      "personaName": "马斯克",
      "role": "agent",
      "content": "第一性原理来看，这个问题本质是...",
      "round": 1,
      "timestamp": 1719033605000
    }
  ],
  "conflicts": [
    {
      "personaA": "musk",
      "personaB": "father",
      "value": 78,
      "label": "明显分歧",
      "color": "#e8a05d"
    }
  ],
  "report": {
    "id": "report-001",
    "councilId": "council-1719033600000-abc1234",
    "question": "我应该接受海外 offer 还是留在国内陪伴父母？",
    "summary": "本次议会围绕海外 offer 与陪伴父母的抉择展开...",
    "dimensions": [
      { "title": "事业维度", "content": "...", "icon": "career" }
    ],
    "indices": {
      "conflict": 78,
      "growth": 65,
      "happiness": 72,
      "freedom": 85,
      "stability": 60
    },
    "radar": {
      "freedom": 85,
      "wealth": 70,
      "happiness": 72,
      "stability": 60,
      "growth": 65
    },
    "consensusPoints": [
      "无论选择哪条路，定期回家陪伴父母是底线",
      "海外经历对长期职业发展有显著正向价值"
    ],
    "disclaimer": "本报告由 AI 生成，仅供参考，不构成专业建议。",
    "timestamp": 1719033660000
  },
  "timeline": [
    {
      "node": "now",
      "label": "当下",
      "description": "面临海外 offer 抉择",
      "happinessProb": 0.7,
      "regretProb": 0.3,
      "incomeChange": "0%",
      "growthRate": "0%"
    }
  ],
  "isMock": false
}
```

**响应字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `councilId` | string | 议会唯一 ID |
| `question` | string | 用户问题（回显） |
| `councilType` | string | 议会类型 |
| `agentIds` | string[] | 实际参与的 Agent ID 列表 |
| `messages` | Message[] | 议会发言记录（按时间排序） |
| `conflicts` | ConflictPair[] | 冲突对列表 |
| `report` | DestinyReport | 命运报告 |
| `timeline` | TimelineBranch[] | 时间线分支 |
| `isMock` | boolean | 是否为 Mock 数据（未配置 API Key 时为 true） |

**错误响应**

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | `INVALID_QUESTION` | question 为空或非字符串 |
| 400 | `INVALID_AGENT_IDS` | agentIds 非字符串数组 |
| 400 | `INVALID_COUNCIL_TYPE` | councilType 不在枚举内 |
| 400 | `INVALID_ROUNDS` | rounds 不在 1-3 范围 |

**降级策略：**
- 未配置 `DEEPSEEK_API_KEY` 时返回 Mock 数据（HTTP 200，`isMock: true`）
- AI 引擎执行失败时降级到 Mock 数据，保证前端可用

---

### 2.2 GET /api/council — API 说明

返回 API 端点说明，便于调试。

**响应（200 OK）**

```json
{
  "endpoint": "/api/council",
  "method": "POST",
  "description": "执行命运议会流程，返回完整的议会结果",
  "requestSchema": {
    "question": "string (required) — 用户的人生问题",
    "agentIds": "string[] (optional) — 参与的 Agent ID 列表",
    "councilType": "wisdom | future | inner | reunion (optional)",
    "rounds": "number 1-3 (optional, default 2)",
    "userContext": "object (optional) — 用户画像"
  },
  "responseSchema": {
    "councilId": "string",
    "question": "string",
    "messages": "Message[]",
    "conflicts": "ConflictPair[]",
    "report": "DestinyReport",
    "timeline": "TimelineBranch[]",
    "isMock": "boolean"
  },
  "configured": true
}
```

---

### 2.3 POST /api/agent — 获取单个 Agent 回复

调用 DeepSeek AI 获取指定 Agent 对用户追问的回复。

**请求**

```http
POST /api/agent HTTP/1.1
Content-Type: application/json

{
  "agentId": "musk",
  "question": "你刚才说的第一性原理，能再具体解释一下吗？",
  "context": "前序发言摘要：马斯克认为应该接受海外 offer..."
}
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agentId` | string | 是 | Agent ID（如 `musk`、`buffett`、`jobs` 等 12 个） |
| `question` | string | 是 | 用户追问（1-500 字） |
| `context` | string | 否 | 议会上下文（前序发言摘要） |

**响应（200 OK）**

```json
{
  "content": "第一性原理的意思是，不要用类比来思考...",
  "agentId": "musk",
  "agentName": "马斯克",
  "isMock": false
}
```

**响应字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `content` | string | Agent 回复内容（150-250 字） |
| `agentId` | string | Agent ID（回显） |
| `agentName` | string | Agent 名称 |
| `isMock` | boolean | 是否为 Mock 回复 |

**错误响应**

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | `INVALID_AGENT_ID` | agentId 为空或非合法 ID |
| 400 | `INVALID_QUESTION` | question 为空或非字符串 |
| 404 | `AGENT_NOT_FOUND` | Agent 不存在 |

**合法的 Agent ID：**

```
musk, buffett, jobs, munger, socrates, wangyangming, zhuangzi,
future20, future50, future80, father, mother
```

---

### 2.4 GET /api/agent — API 说明

返回 API 端点说明，便于调试。

**响应（200 OK）**

```json
{
  "endpoint": "/api/agent",
  "method": "POST",
  "description": "获取单个 Agent 的回复（用于追问功能）",
  "requestSchema": {
    "agentId": "string (required) — Agent ID",
    "question": "string (required) — 用户追问",
    "context": "string (optional) — 议会上下文"
  },
  "responseSchema": {
    "content": "string — Agent 回复内容",
    "agentId": "string",
    "agentName": "string",
    "isMock": "boolean"
  },
  "configured": true
}
```

---

## 3. 管理后台 API 端点设计

> 以下为管理后台 API 的设计规范，当前阶段使用前端 Mock 数据，后续接入后端时按此规范实现。

### 3.1 端点总览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/dashboard` | 获取仪表盘统计数据 |
| GET | `/api/admin/users` | 获取用户列表 |
| GET | `/api/admin/users/{id}` | 获取用户详情 |
| PATCH | `/api/admin/users/{id}/status` | 更新用户状态（启用/禁用） |
| GET | `/api/admin/councils` | 获取议会记录列表 |
| GET | `/api/admin/councils/{id}` | 获取议会记录详情 |
| DELETE | `/api/admin/councils/{id}` | 删除议会记录 |
| GET | `/api/admin/memories` | 获取记忆列表 |
| DELETE | `/api/admin/memories/{id}` | 删除记忆 |
| GET | `/api/admin/agents` | 获取 Agent 列表 |
| PATCH | `/api/admin/agents/{id}` | 更新 Agent 配置（启用/禁用、System Prompt） |
| GET | `/api/admin/content/questions` | 获取预设问题列表 |
| POST | `/api/admin/content/questions` | 添加预设问题 |
| DELETE | `/api/admin/content/questions/{id}` | 删除预设问题 |
| GET | `/api/admin/content/planets` | 获取星球配置 |
| PUT | `/api/admin/content/planets/{id}` | 更新星球配置 |
| GET | `/api/admin/content/banners` | 获取 Banner 列表 |
| POST | `/api/admin/content/banners` | 添加 Banner |
| PUT | `/api/admin/content/banners/{id}` | 更新 Banner |
| DELETE | `/api/admin/content/banners/{id}` | 删除 Banner |
| PATCH | `/api/admin/content/banners/{id}/order` | 调整 Banner 排序 |
| GET | `/api/admin/operations/announcements` | 获取公告列表 |
| POST | `/api/admin/operations/announcements` | 添加公告 |
| PUT | `/api/admin/operations/announcements/{id}` | 更新公告 |
| DELETE | `/api/admin/operations/announcements/{id}` | 删除公告 |
| GET | `/api/admin/operations/feedbacks` | 获取用户反馈列表 |
| PATCH | `/api/admin/operations/feedbacks/{id}/status` | 更新反馈状态 |
| GET | `/api/admin/operations/export` | 导出运营数据 |
| GET | `/api/admin/settings` | 获取系统设置 |
| PUT | `/api/admin/settings` | 更新系统设置 |

### 3.2 GET /api/admin/dashboard — 仪表盘统计

**查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `range` | string | 时间范围：`7d`（默认）/ `30d` / `90d` |

**响应（200 OK）**

```json
{
  "stat": {
    "totalUsers": 1286,
    "todayActive": 248,
    "totalCouncils": 8421,
    "totalMemories": 5632,
    "totalAgents": 12,
    "avgConflict": 64,
    "mockRate": 12
  },
  "trend": [
    { "date": "2026-06-16", "councils": 142, "users": 198 },
    { "date": "2026-06-17", "councils": 168, "users": 215 }
  ],
  "agentRank": [
    {
      "agentId": "musk",
      "name": "马斯克",
      "avatar": "🚀",
      "appearances": 1842,
      "avgScore": 4.6
    }
  ],
  "recentCouncils": [
    {
      "id": "c-001",
      "question": "我应该接受海外 offer 还是留在国内陪伴父母？",
      "councilType": "wisdom",
      "participants": ["musk", "buffett", "father", "mother"],
      "conflictValue": 78,
      "createdAt": "2026-06-22T09:12:00+08:00",
      "userId": "u-001",
      "userName": "林深"
    }
  ]
}
```

### 3.3 GET /api/admin/users — 用户列表

**查询参数**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数（最大 100） |
| `search` | string | - | 搜索昵称或邮箱 |
| `status` | string | `all` | 状态筛选：`all` / `active` / `disabled` |
| `sortBy` | string | `createdAt` | 排序字段 |
| `sortOrder` | string | `desc` | 排序方向：`asc` / `desc` |

**响应（200 OK）**

```json
{
  "data": [
    {
      "id": "u-001",
      "avatar": "🦊",
      "nickname": "林深",
      "email": "linshen@example.com",
      "registeredAt": "2024-09-12T10:24:00+08:00",
      "lastActiveAt": "2026-06-22T08:15:00+08:00",
      "councilCount": 42,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1286,
    "totalPages": 129
  }
}
```

### 3.4 PATCH /api/admin/users/{id}/status — 更新用户状态

**请求**

```json
{
  "status": "disabled"
}
```

**响应（200 OK）**

```json
{
  "id": "u-001",
  "status": "disabled",
  "updatedAt": "2026-06-22T10:00:00+08:00"
}
```

### 3.5 GET /api/admin/councils — 议会记录列表

**查询参数**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数 |
| `search` | string | - | 搜索问题 |
| `councilType` | string | `all` | 议会类型筛选 |
| `range` | string | `all` | 时间范围：`all` / `1d` / `7d` / `30d` |
| `sortBy` | string | `createdAt` | 排序字段 |
| `sortOrder` | string | `desc` | 排序方向 |

**响应（200 OK）**

```json
{
  "data": [
    {
      "id": "c-001",
      "question": "我应该接受海外 offer 还是留在国内陪伴父母？",
      "councilType": "wisdom",
      "participants": ["musk", "buffett", "father", "mother"],
      "conflictValue": 78,
      "createdAt": "2026-06-22T09:12:00+08:00",
      "userId": "u-001",
      "userName": "林深"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 8421,
    "totalPages": 843
  }
}
```

### 3.6 PATCH /api/admin/agents/{id} — 更新 Agent 配置

**请求**

```json
{
  "enabled": false,
  "systemPrompt": "你是马斯克..."
}
```

**响应（200 OK）**

```json
{
  "id": "musk",
  "enabled": false,
  "systemPrompt": "你是马斯克...",
  "updatedAt": "2026-06-22T10:00:00+08:00"
}
```

### 3.7 PUT /api/admin/settings — 更新系统设置

**请求**

```json
{
  "ai": {
    "apiKey": "sk-xxx",
    "model": "deepseek-chat",
    "temperature": 0.8,
    "maxTokens": 600,
    "baseUrl": "https://api.deepseek.com/v1"
  },
  "council": {
    "defaultRounds": 2,
    "timeoutSeconds": 60,
    "maxAgents": 7
  },
  "email": {
    "enabled": false,
    "smtpHost": "smtp.example.com",
    "smtpPort": 587,
    "smtpUser": "user@example.com",
    "smtpPassword": "xxx",
    "fromAddress": "noreply@lifeverse.app"
  }
}
```

**响应（200 OK）**

```json
{
  "updated": true,
  "updatedAt": "2026-06-22T10:00:00+08:00"
}
```

---

## 4. 请求/响应格式规范

### 4.1 通用请求头

```http
Content-Type: application/json
Accept: application/json
Accept-Language: zh-CN
Authorization: Bearer {token}    # 认证接口需要
X-Request-Id: {uuid}             # 可选，请求追踪 ID
```

### 4.2 通用响应头

```http
Content-Type: application/json; charset=utf-8
X-Request-Id: {uuid}             # 请求追踪 ID
X-RateLimit-Limit: 60            # 限流配额
X-RateLimit-Remaining: 58        # 剩余配额
X-RateLimit-Reset: 1719033660    # 配额重置时间（Unix 时间戳）
```

### 4.3 列表响应格式

所有列表接口统一返回：

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 4.4 错误响应格式

所有错误统一返回：

```json
{
  "error": {
    "code": "INVALID_QUESTION",
    "message": "Field \"question\" is required and must be a non-empty string",
    "details": {
      "field": "question",
      "constraint": "min:1, max:500"
    }
  },
  "requestId": "req-abc-123"
}
```

### 4.5 字段命名

- 请求/响应字段统一使用 **camelCase**
- 数据库字段使用 **snake_case**（通过 ORM 转换）
- 时间字段后缀：`At`（如 `createdAt`、`updatedAt`）
- 布尔字段前缀：`is` / `has`（如 `isEnabled`、`hasPermission`）
- 计数字段后缀：`Count`（如 `councilCount`、`userCount`）

---

## 5. 错误码定义

### 5.1 错误码格式

错误码使用 `UPPER_SNAKE_CASE`，由模块前缀 + 错误描述组成。

### 5.2 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `BAD_REQUEST` | 400 | 请求参数格式错误 |
| `UNAUTHORIZED` | 401 | 未认证或认证过期 |
| `FORBIDDEN` | 403 | 无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `VALIDATION_FAILED` | 422 | 业务校验失败 |
| `RATE_LIMITED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务端内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

### 5.3 议会模块错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `INVALID_QUESTION` | 400 | question 为空或非字符串 |
| `INVALID_AGENT_IDS` | 400 | agentIds 非字符串数组 |
| `INVALID_COUNCIL_TYPE` | 400 | councilType 不在枚举内 |
| `INVALID_ROUNDS` | 400 | rounds 不在 1-3 范围 |
| `COUNCIL_NOT_FOUND` | 404 | 议会记录不存在 |
| `COUNCIL_ENGINE_FAILED` | 500 | 议会引擎执行失败 |

### 5.4 Agent 模块错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `INVALID_AGENT_ID` | 400 | agentId 为空或非合法 ID |
| `INVALID_QUESTION` | 400 | question 为空或非字符串 |
| `AGENT_NOT_FOUND` | 404 | Agent 不存在 |
| `AI_API_FAILED` | 500 | AI API 调用失败 |

### 5.5 管理后台错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `ADMIN_UNAUTHORIZED` | 401 | 管理员未登录 |
| `ADMIN_FORBIDDEN` | 403 | 非管理员角色 |
| `USER_NOT_FOUND` | 404 | 用户不存在 |
| `MEMORY_NOT_FOUND` | 404 | 记忆不存在 |
| `ANNOUNCEMENT_NOT_FOUND` | 404 | 公告不存在 |
| `INVALID_STATUS` | 400 | 状态值不合法 |

---

## 6. 认证方案

### 6.1 前台用户认证

**方案：Clerk + JWT**

- 用户登录后，Clerk 签发 JWT Token
- 前端将 Token 存储在 HttpOnly Cookie 中
- API 路由通过 `auth()` 中间件验证 Token

**认证流程：**

```
1. 用户通过 Clerk 登录
2. Clerk 签发 JWT，写入 HttpOnly Cookie
3. 前端请求 API，自动携带 Cookie
4. API 路由调用 auth() 验证 Token
5. 验证通过 → 处理请求；失败 → 返回 401
```

**示例（API 路由）：**

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  // 处理请求...
}
```

### 6.2 管理后台认证

**方案：Clerk RBAC + 中间件**

- 管理员账号在 Clerk 中标记 `role: 'admin'`
- 管理后台路由通过中间件验证管理员角色
- 当前阶段（mock 模式）不启用认证

**中间件示例：**

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export function adminAuth() {
  const { userId, sessionClaims } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'ADMIN_UNAUTHORIZED', message: 'Admin login required' } },
      { status: 401 }
    );
  }
  const role = (sessionClaims as { role?: string })?.role;
  if (role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'ADMIN_FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }
  return null;
}
```

### 6.3 API Key 认证（服务间调用）

- 内部服务间调用使用 API Key 认证
- API Key 通过 `X-API-Key` 请求头传递
- API Key 在管理后台生成，绑定权限范围

---

## 7. 限流策略

### 7.1 限流规则

| 接口分类 | 限流维度 | 配额 | 窗口 |
|----------|----------|------|------|
| 只读接口（GET） | 每用户 | 60 次 | 1 分钟 |
| 写入接口（POST/PUT/DELETE） | 每用户 | 30 次 | 1 分钟 |
| AI 接口（/api/council） | 每用户 | 10 次 | 1 分钟 |
| AI 接口（/api/agent） | 每用户 | 20 次 | 1 分钟 |
| 登录接口 | 每 IP | 5 次失败 | 1 分钟 |
| 管理后台接口 | 每管理员 | 120 次 | 1 分钟 |
| 未认证请求 | 每 IP | 20 次 | 1 分钟 |

### 7.2 限流算法

采用 **滑动窗口 + Redis** 实现：

```typescript
// 伪代码
async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // 移除窗口外的记录
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // 获取当前窗口内请求数
  const count = await redis.zcard(key);
  
  if (count >= limit) {
    return false; // 限流
  }
  
  // 记录本次请求
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, windowMs / 1000);
  
  return true;
}
```

### 7.3 限流响应

触发限流时返回 `429 Too Many Requests`：

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1719033660

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "details": {
      "limit": 60,
      "window": "60s",
      "retryAfter": 60
    }
  },
  "requestId": "req-abc-123"
}
```

### 7.4 降级策略

- AI 接口超时或失败时，降级返回 Mock 数据（`isMock: true`）
- 数据库不可用时，返回缓存数据（标注 `cached: true`）
- 限流触发时，前端展示友好提示并禁用操作按钮

---

## 附录

### A. Postman 集合

所有 API 端点的 Postman 集合维护在 `/docs/postman/lifeverse-api.json`。

### B. OpenAPI Schema

完整的 OpenAPI 3.0 Schema 维护在 `/docs/openapi.yaml`。

### C. 变更日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0.0 | 2026-06-22 | 初始版本，定义核心 API 规范 |
