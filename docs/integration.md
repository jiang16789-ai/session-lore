# Integration — wiring the cron pipelines

session-lore writes the daily file. Four cron jobs around it complete the
system. All examples assume the memory root is `~/.session-lore/`.

## 1. Daily session archive (23:45)

Builds the full per-day conversation archive from raw session transcripts.

```bash
#!/usr/bin/env bash
# archive_daily.sh — idempotent, safe to rerun
set -euo pipefail
python3 scripts/session_daily_archive.py \
  --in  ~/.openclaw/agents/main/sessions \
  --out ~/.session-lore/sessions/session-$(date +%F).md
```

## 2. Vectorization (23:45 + 08:00 morning catch-up)

Two shifts close the freshness gap: the night job indexes the whole day, the
morning job catches the hours between midnight and morning that the night job
missed. The morning shift is not optional — it is the fix for "last night's
conversation is invisible to this morning's session".

```bash
# mem0_ingest.sh — idempotent by design
bash ~/mem0/mem0.sh ingest
```

## 3. Heartbeat inspection (10:00 / 22:00)

A periodic autonomous scan with a mandatory first step:

```
P0. Read today's and yesterday's day files in full (including the episodic
    log section). Check for overnight conversations, promises, or
    broken-handoff points that were not archived completely. If found,
    backfill them into the archive immediately.
P1. Memory consolidation — scan the last 24h for new lessons, promote to rules.
P2. Gap detection — memory vs. knowledge-base contradictions.
P3. Trend sensing — optional, time-boxed, skip on network trouble.
P4. Skill decay warning — rules untouched for 7+ days get scheduled practice.
```

P0 exists because of a real incident: a decision made in a secondary UI at
2am was invisible to the main channel at 9am, the agent asserted "nothing was
decided", and the user had to correct it. The read side of memory needs
procedure as much as the write side needs hooks.

## 4. Nightly self-evolution (00:30)

Scan yesterday's signals → backfill micro-lessons into yesterday's log →
when the same lesson triggers 3 times, promote it to a hard rule. Promotion
is the difference between a diary and a system that gets better.

## Wiring order for a new install

1. Install session-lore, attach the hook to message events.
2. Add the archive + vectorize crons.
3. Add the morning catch-up vectorization.
4. Add the heartbeat with P0 as step zero.
5. Write the "recent questions read day files first" rule into your rule layer.

Steps 3 and 4 are where most setups stop — and where the freshness gap lives.
