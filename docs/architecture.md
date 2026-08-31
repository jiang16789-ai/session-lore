# Architecture — five layers of agent memory

session-lore is the write side of a five-layer memory design. This document
explains the full stack so you can see where the package fits and build the
rest of the layers the same way.

## The five layers

| # | Layer | Contents | Written by | Read when |
|---|---|---|---|---|
| 1 | **Real-time index** | core facts + pointers, deliberately slim | human (curated) | boot, quick context |
| 2 | **Daily log** | today's events + episodic log | session-lore (realtime) | "what happened today" |
| 3 | **Session archive** | full conversation archive, one file per day | daily cron | "what exactly was said" |
| 4 | **Topic stores** | lessons / projects / protocols | nightly review | scenario lookups |
| 5 | **Full archive** | complete historical detail + index | weekly + on demand | deep dives |

Key property: **layer 1 is a pointer file, not a database.** It stays tiny
because the detail lives in layers 2-5. An index that grows without bound
becomes unreadable and stops being read.

## The four-level retrieval chain

```
Level 1: rules file (hard laws, real-time)     ← always loaded
Level 2: behavior rules (expanded, ~hundreds)  ← on conflict
Level 3: knowledge store (fused knowledge)     ← on "how do I do X"
Level 4: vector store (semantic search)        ← last resort
```

Rules are ordered: a hard law at level 1 overrides anything found at level 4.
The vector store is a fallback, not the first answer — because daily-indexed
vectors always have a freshness gap.

## The freshness gap (why this package exists)

Vector stores are typically indexed on a cron (e.g. nightly). Anything that
happens after the last index job is invisible to semantic search. Two failure
modes follow:

1. **Cross-session amnesia** — a decision made at 2am in channel A is unknown
   to the session that opens at 9am in channel B.
2. **Confident wrong answers** — the agent answers from the stale index
   instead of admitting it hasn't looked at the day file.

The fix is procedural, not technical: **"what happened recently" questions
must read the day files first, semantic search second.** Write the rule down
in your agent's rule layer — see [methodology.md](methodology.md).

## Anti-patterns that look like good ideas

- **One giant memory file** — grows unbounded, context windows choke, edits
  clobber each other. Split by day, split by topic.
- **Vector-only memory** — freshness gap + no audit trail. Keep plaintext
  files as the source of truth; vectors are an index over them.
- **Fancy write paths** — a memory writer that can crash the message flow is
  worse than no memory at all. session-lore's write path swallows failures by
  design.
- **Auto-growing indexes** — a pointer file that accumulates everything
  becomes unreadable. Curate it, or split it.
