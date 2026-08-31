# session-lore

> **Your AI forgets 16 hours of every day. You just haven't noticed yet.**
>
> Real-time episodic memory for AI agents. Every message, every decision, every 2am promise — written to disk the moment it happens.

[中文](README.zh-CN.md)

---

## The problem nobody sees

Most agent memory stacks look complete. A rules library. A knowledge base. A vector store indexed nightly.

Here's what's missing: **today.**

Everything that happens after the last index job is a blind spot. A decision made at 2am in the web panel is invisible to the messaging channel at 9am. The agent answers from the stale index — confidently, completely wrong — and the user has to say the sentence every builder dreads:

> *"Didn't we discuss this last night?"*

That's not a model problem. It's a memory-architecture problem.

## What session-lore does

One primitive, done ruthlessly well:

```
                ┌──────────────────────────────┐
 inbound ─────► │  handler (message:received)  │
 outbound ────► │  handler (message:sent)      │
                └──────────────┬───────────────┘
                               │ append immediately
                               ▼
                 ~/.session-lore/2026-08-31.md
                 ┌──────────────────────────────┐
                 │ # 2026-08-31                 │
                 │ ## 情景日志                  │
                 │ - 09:15 收[user]: ...        │
                 │ - 09:16 发[agent]: ...       │
                 └──────────────────────────────┘
```

Three laws, learned the hard way in production:

1. **The write path is sacred.** Memory logging must never break the message flow. Every failure is swallowed silently — a memory writer that can crash your agent is worse than no memory at all.
2. **Bounded by day.** 300 lines max per day, oldest pruned first. A runaway conversation cannot grow the file forever.
3. **Readable by humans, indexable by machines.** Plain Markdown. One file per day. One line per message.

## It works — here's the receipt

This package is extracted from a production assistant that has run since early 2026 across multiple channels — business negotiation by day, market research and investment analysis by night, plus autonomous overnight jobs (data scans, competition submissions, pipeline builds) — **for months straight without a single "forgot what we discussed" incident** after the episodic layer went live.

The incident that made this package exist: the 2am decision was *in the day file* — the hook had written it correctly. The morning session still missed it. **Write-side automation without read-side procedure is a diary nobody opens.**

The full playbook — five-layer storage, four-level retrieval, cron wiring, verification SOPs — is in [`docs/`](docs/):

- [`docs/architecture.md`](docs/architecture.md) — five layers of memory, four-level retrieval chain, anti-patterns
- [`docs/methodology.md`](docs/methodology.md) — the SOPs that keep an agent trustworthy (fact-check flow, four-part reports, no-shelfware delivery)
- [`docs/integration.md`](docs/integration.md) — cron pipelines: daily archive, two-shift vectorization, heartbeat P0
- [`docs/case-study.md`](docs/case-study.md) — anonymized production write-up, real numbers

## Install

```bash
npm install session-lore
```

## Usage (OpenClaw hook)

`HOOK.md`:

```yaml
---
name: live-session-log
description: "Real-time episodic memory: append every message to a per-day log"
metadata:
  { "events": ["message:received", "message:sent"], "requires": { "bins": ["node"] } }
---
```

`handler.ts`:

```ts
import handler from "session-lore";
export default handler;
```

Storage defaults to `~/.session-lore/`; override with `SESSION_LORE_DIR`.

## Usage (any framework)

```ts
import { handler } from "session-lore";

await handler({ type: "message", action: "received", context: { from: "user", content: "hi" } });
await handler({ type: "message", action: "sent", context: { to: "user", content: "hello" } });
```

## Why "session-lore"

*lore* is the accumulated memory of a world. session-lore is the accumulated memory of an agent's world — what happened today, what was promised last night, what must not be forgotten tomorrow.

## License

MIT © chunjiang
