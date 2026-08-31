# session-lore

> Real-time episodic memory for AI agents.
> Append every message to per-day logs instantly — an agent never forgets a whole day again.

## Why

Most agent memory stacks vectorize conversations **once a day** (or worse, never). Everything that happens between two vectorization jobs is a blind spot: decisions made at 2am are invisible to the session that starts at 9am. You don't discover the gap until the user says *"didn't we discuss this last night?"* — and the agent confidently answers wrong.

**session-lore** closes the gap with one primitive: **every message is appended to a per-day log file the moment it happens.** Cheap to write, cheap for humans to read, cheap for vectorizers to index later.

## Architecture

```
                ┌──────────────────────────────┐
 inbound ─────► │  handler (message:received)  │
 outbound ────► │  handler (message:sent)      │
                └──────────────┬───────────────┘
                               │ append, capped at 300 lines/day
                               ▼
                 ~/.session-lore/2026-08-31.md
                 ┌──────────────────────────────┐
                 │ # 2026-08-31                 │
                 │ ...                          │
                 │ ## 情景日志 (episodic log)   │
                 │ - 09:15 收[user]: ...        │
                 │ - 09:16 发[agent]: ...       │
                 └──────────────────────────────┘
```

Design rules learned in production:

1. **Write path is sacred** — logging must never break the message flow. Every failure is swallowed silently.
2. **Bounded per day** — oldest lines are pruned past the cap. A runaway conversation cannot grow the file forever.
3. **Human-readable, machine-indexable** — plain Markdown, one file per day, one line per message.

## Install

```bash
npm install session-lore
```

## Usage (OpenClaw hook)

Hook metadata (`HOOK.md`):

```yaml
---
name: live-session-log
description: "Real-time episodic memory: append every message to a per-day log"
metadata:
  { "events": ["message:received", "message:sent"], "requires": { "bins": ["node"] } }
---
```

Handler (`handler.ts`):

```ts
import handler from "session-lore";
export default handler;
```

Storage location defaults to `~/.session-lore/`; override with `SESSION_LORE_DIR`.

## Usage (any framework)

```ts
import { handler, appendEpisodicLine } from "session-lore";

// On every inbound message
await handler({ type: "message", action: "received", context: { from: "user", content: "hi" } });

// On every outbound message
await handler({ type: "message", action: "sent", context: { to: "user", content: "hello" } });
```

## The bigger picture

session-lore is one layer of a five-layer memory design that has been running in production since early 2026:

| Layer | What | Where |
|---|---|---|
| Real-time index | core facts + pointers | a slim, human-curated index file |
| Daily log | today's events + episodic log | `memory/YYYY-MM-DD.md` (this package writes it) |
| Session archive | full per-day conversation archive | daily cron |
| Topic stores | lessons / projects / protocols | purpose-built files |
| Full archive | complete historical detail | indexed vault |

Read the full methodology in [`docs/`](docs/):

- [`docs/architecture.md`](docs/architecture.md) — five-layer storage, four-level retrieval chain
- [`docs/methodology.md`](docs/methodology.md) — verification SOPs: fact-check flow, four-part reporting, no-grayscale delivery
- [`docs/integration.md`](docs/integration.md) — wiring cron pipelines (daily archive, vectorization, heartbeat inspection)

## Case study

This design powers a production assistant that handles business negotiations, market research, and investment analysis across multiple channels for months without a single "forgot what we discussed" incident — after the episodic layer went live. (Full anonymized write-up: [`docs/case-study.md`](docs/case-study.md).)

## License

MIT © chunjiang
