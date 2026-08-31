# Case study — one assistant, several channels, zero "forgot" incidents

*Anonymized production write-up. Names, industries, and channels are
generalized; the numbers are real.*

## Setup

- **Operator**: a business generalist — manages teams, negotiates enterprise
  deals, runs strategy consulting on the side, trades markets personally.
- **Assistant**: one agent persona across several chat surfaces (a primary
  messaging channel, a web panel, scheduled background jobs).
- **Workload**: business ops by day, market research and investment analysis
  by night, plus autonomous overnight jobs (data scans, competition
  submissions, pipeline builds).

## Before the episodic layer

Memory looked complete: a rules library, a knowledge base, and a vector store
indexed nightly. What was missing was *today*.

Three failure classes appeared repeatedly:

1. **Cross-surface amnesia** — a decision made at 2am in the web panel was
   invisible to the messaging channel at 9am. The assistant asserted "nothing
   was decided" and the operator had to correct it manually.
2. **Broken handoffs** — an overnight job was told "report the result in the
   morning"; the morning session had no record of the promise and never
   checked.
3. **Stale-search overconfidence** — semantic search returned hits from 3-6
   days ago with high confidence scores, and the assistant answered from them
   instead of admitting the last 24 hours were unindexed.

## The fix (in order of impact)

1. **Episodic hook** (this package): every message appended to the day file
   the moment it happens, across every surface.
2. **Morning vectorization shift**: the 08:00 catch-up job eliminated the
   23:45-to-morning blind spot.
3. **Heartbeat P0**: every inspection starts by reading today's and
   yesterday's day files in full, backfilling unarchived overnight content.
4. **Procedural rule**: "what happened recently" questions must read the day
   files first; semantic search is step two.

## The incident that made rule 4 permanent

The 2am decision was actually *in the day file* — the hook had written it
correctly. The morning session still missed it, because nobody had told the
read side to look there first. **Write-side automation without read-side
procedure is a diary nobody opens.**

After the read-side rule landed, the "forgot what we discussed" incident
count went to zero for the following months — including the busiest stretch
of the year, when the assistant was running competition submissions,
overnight scans, and daily trading reports in parallel.

## Numbers worth stealing

- **~300 lines/day cap** keeps any single day file human-scannable.
- **300 chars/message** keeps one token-bomb message from dominating the log.
- **Two vectorization shifts** (23:45 + 08:00) instead of one closed the gap
  at the cost of one extra cron line.
- **Silent-failure write path**: zero message-flow incidents across months.
