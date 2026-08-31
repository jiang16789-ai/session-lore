# session-lore

> **你的 AI 每天都在失忆 16 小时——你只是还没发现。**
>
> AI 智能体的实时情景记忆层。每条消息、每个决定、每个凌晨两点的承诺——在发生的那一刻就写进磁盘。

[English](README.md)

---

## 没人看见的问题

大多数智能体记忆栈看起来是完整的：规则库、知识库、每晚定时索引的向量库。

缺的一样东西：**今天**。

最后一次索引之后发生的一切都是盲区。凌晨两点在网页面板做的决定，早上九点的主聊天渠道完全看不见。智能体从过时的索引里自信满满地回答——错的离谱——然后用户说出每个搭建者最怕听到的那句话：

> *"我们昨晚不是讨论过吗？"*

这不是模型问题。这是记忆架构问题。

## session-lore 做什么

一个原语，做到极致：

```
                ┌──────────────────────────────┐
 收消息 ──────► │  handler (message:received)  │
 发消息 ──────► │  handler (message:sent)      │
                └──────────────┬───────────────┘
                               │ 即刻追加写入
                               ▼
                 ~/.session-lore/2026-08-31.md
                 ┌──────────────────────────────┐
                 │ # 2026-08-31                 │
                 │ ## 情景日志                  │
                 │ - 09:15 收[user]: ...        │
                 │ - 09:16 发[agent]: ...       │
                 └──────────────────────────────┘
```

三条铁律，生产环境里拿事故换来的：

1. **写路径是神圣的。** 记忆日志绝不能拖垮消息流。所有失败静默吞掉——一个能拖垮智能体的记忆写入器，比没有记忆更糟。
2. **每天有边界。** 每日上限 300 行，最旧的先裁掉。失控的对话永远撑不爆文件。
3. **人可读，机器可索引。** 纯 Markdown。一天一文件。一条消息一行。

## 它真的有效——证据在此

这个包是从一个生产环境助手里提炼出来的。它从 2026 年初跑到今天，横跨多个渠道——白天商务谈判，夜里市场研究和投资分析，外加全自动的过夜任务（数据扫描、比赛提交、流水线搭建）——**情景层上线后，连续数月"忘记我们讨论过什么"的事故为零**。

催生这个包的那次事故：凌晨两点的决定其实**已经写进当日文件了**——hook 写得没错。早上的会话还是没读到。**写入侧自动化了、读取侧没有流程，等于一本没人翻开的日记。**

完整打法——五层存储、四级检索、cron 接线、验证 SOP——全在 [`docs/`](docs/)：

- [`docs/architecture.md`](docs/architecture.md) —— 五层记忆、四级检索链、反模式清单
- [`docs/methodology.md`](docs/methodology.md) —— 让智能体保持可信的 SOP（查证流程、四段式汇报、拒绝吃灰交付）
- [`docs/integration.md`](docs/integration.md) —— cron 管道：日档归档、双班向量化、心跳 P0
- [`docs/case-study.md`](docs/case-study.md) —— 匿名化生产案例，真实数字

## 安装

```bash
npm install session-lore
```

## 用法（OpenClaw hook）

`HOOK.md`：

```yaml
---
name: live-session-log
description: "实时情景记忆：每条消息即时落盘到当日日志"
metadata:
  { "events": ["message:received", "message:sent"], "requires": { "bins": ["node"] } }
---
```

`handler.ts`：

```ts
import handler from "session-lore";
export default handler;
```

存储默认 `~/.session-lore/`，用 `SESSION_LORE_DIR` 覆盖。

## 用法（任意框架）

```ts
import { handler } from "session-lore";

await handler({ type: "message", action: "received", context: { from: "user", content: "你好" } });
await handler({ type: "message", action: "sent", context: { to: "user", content: "你好" } });
```

## 为什么叫 session-lore

*lore* 是一个世界的记忆总和。session-lore 是智能体世界的记忆总和——今天发生了什么、昨晚承诺了什么、明天不该忘什么。

## 协议

MIT © chunjiang
