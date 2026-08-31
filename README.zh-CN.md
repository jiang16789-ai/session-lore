# session-lore

> AI 智能体的实时情景记忆层。
> 每条消息即时追加到按天分组的日志文件——智能体从此不再"失忆一整天"。

[English](README.md)

## 为什么需要它

大多数智能体记忆栈**每天只做一次向量化**（甚至从不做）。两次向量化之间发生的一切都是盲区：凌晨两点做的决定，早上九点新开的会话完全看不见。直到用户问出那句——*"我们昨晚不是讨论过吗？"*——而智能体自信满满地答错。

**session-lore 用一条原语补上这个洞：每条消息在发生的那一刻就追加进按天分组的日志文件。** 写入便宜、人读得懂、向量化器以后也便宜。

## 架构

```
                ┌──────────────────────────────┐
 收消息 ──────► │  handler (message:received)  │
 发消息 ──────► │  handler (message:sent)      │
                └──────────────┬───────────────┘
                               │ 追加写入，每天上限 300 行
                               ▼
                 ~/.session-lore/2026-08-31.md
                 ┌──────────────────────────────┐
                 │ # 2026-08-31                 │
                 │ ...                          │
                 │ ## 情景日志                  │
                 │ - 09:15 收[user]: ...        │
                 │ - 09:16 发[agent]: ...       │
                 └──────────────────────────────┘
```

生产环境踩出来的设计铁律：

1. **写路径是神圣的**——记忆日志绝不能拖垮消息流。所有失败默认静默吞掉。
2. **每天有上限**——超过上限裁掉最旧的。失控的对话不会让文件无限膨胀。
3. **人可读、机器可索引**——纯 Markdown，一天一文件，一条消息一行。

## 安装

```bash
npm install session-lore
```

## 用法（OpenClaw hook）

Hook 元数据（`HOOK.md`）：

```yaml
---
name: live-session-log
description: "实时情景记忆：每条消息即时落盘到当日日志"
metadata:
  { "events": ["message:received", "message:sent"], "requires": { "bins": ["node"] } }
---
```

处理器（`handler.ts`）：

```ts
import handler from "session-lore";
export default handler;
```

存储位置默认 `~/.session-lore/`，可用 `SESSION_LORE_DIR` 覆盖。

## 用法（任意框架）

```ts
import { handler, appendEpisodicLine } from "session-lore";

// 每条收进来的消息
await handler({ type: "message", action: "received", context: { from: "user", content: "你好" } });

// 每条发出去的消息
await handler({ type: "message", action: "sent", context: { to: "user", content: "你好" } });
```

## 更大的图景

session-lore 是一套**五层记忆设计**中的一层。这套设计从 2026 年初起在生产环境运行至今：

| 层 | 内容 | 位置 |
|---|---|---|
| 实时索引 | 核心事实+指针，刻意保持精简 | 一个人工维护的索引文件 |
| 当日日志 | 今天的事件+情景日志 | `memory/YYYY-MM-DD.md`（本包写入的就是它） |
| 会话日档 | 当天完整对话归档 | 每日 cron |
| 专题库 | 教训/项目/协议 | 按用途建文件 |
| 全量归档 | 完整历史细节 | 带索引的归档库 |

完整方法论见 [`docs/`](docs/)：

- [`docs/architecture.md`](docs/architecture.md) —— 五层存储、四级检索链
- [`docs/methodology.md`](docs/methodology.md) —— 验证 SOP：查证流程、四段式汇报、拒绝吃灰交付
- [`docs/integration.md`](docs/integration.md) —— cron 管道接线（日档归档、双班向量化、心跳巡检）
- [`docs/case-study.md`](docs/case-study.md) —— 匿名化实战案例

## 实战案例

这套设计支撑着一个生产环境助手：跨多个渠道同时处理商务谈判、市场研究、投资分析，连续数月运行，在情景层上线后 **"忘记我们讨论过什么"的事故归零**。（完整匿名化案例：[`docs/case-study.md`](docs/case-study.md)。）

## 为什么叫 session-lore

lore = 一个世界的记忆总和。session-lore 记录的是智能体世界里每一刻发生的事——当天发生了什么、昨天承诺了什么、今天不该忘什么。

## 协议

MIT © chunjiang
