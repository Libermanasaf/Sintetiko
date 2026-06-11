# Egress budget — rules to never blow the Supabase free cap (5 GB/month)

The project once exceeded the cap and got its API restricted. The root causes
were fixed; this doc keeps them from coming back. **Read before adding any query.**

## The one rule that matters

**A query that grows with table size, and runs repeatedly (polling) or on every
visit, is an egress bomb.** Egress = payload_size × frequency × users. As data
accumulates, payload grows → egress grows → cap blown.

## Hard rules (enforced by review)

1. **Never store base64 in a table column.** Images go to Storage via
   `uploadFile()` (returns a URL). A base64 blob is re-downloaded on every
   `select('*')`. (Regressions found twice — both from rounds inserted by scripts.)

2. **Never fetch a whole growing table to find one row.** The active round is
   found by `Round.list('-created_date', 5)` — NOT `Round.list()`. Capped at 5.

3. **History / stats views must paginate or cap.** GameHistory loads 50 (with
   "load more"); PlayerStatsModal caps at 100. Never `Round.list()` unbounded in
   a screen users open repeatedly.

4. **Polling intervals ≥ 60s** (bets 30s is the floor, one small round only).
   Global `staleTime: 30s` so navigation between screens doesn't refetch.

5. **The only unbounded `Round.list()` allowed is Backup.jsx** — it genuinely
   needs all rounds, and runs only on a manual admin "export" click.

## Current projection (modeled from measured byte-sizes)

| Scenario | Egress/month | % of 5GB cap |
|---|---|---|
| 200 players / 200 rounds / 80 daily users | ~0.97 GB | 19% |
| 300 / 500 / 120 | ~1.7 GB | 34% |
| 500 / 1000 / 200 (insane) | ~3.4 GB | 68% |
| 5000 rounds | ~1.7 GB | 34% (round count no longer matters) |

After the caps, **round count does not affect egress**. The only growth term is
`Player.list` (scales with player count, not rounds) — modest.

## Structural safety net (you can't "forget" a limit)

`storage.js list()` enforces a **hard default cap of 1000 rows**. A query that
forgets to pass a limit can't pull a whole growing table — it's capped
automatically. To get more, pass an explicit number; to get everything (Backup
only), pass `limit: 'all'`. This protects code that hasn't been written yet.

**Aggregates run in the DB, not the client.** Per-player rating averages come
from the `admin_rating_averages()` / `my_rating_summary()` RPCs — we never pull
the whole player_ratings table just to average it. Any new "compute over a whole
growing table" need should be a SECURITY DEFINER RPC returning the aggregate.

## Monitoring (the last line of defense)

Automated egress alerts aren't available via SQL (the metric lives in Supabase's
management API, not the database). So the human check stays: once a month, open
**Usage Dashboard → Egress**. If a single table dominates, it's almost certainly
a new unbounded/polling query — apply the rules above.

Measure a query's real cost: `select sum(pg_column_size(t.*)) from <table> t;`

## Projection ceiling (where free tier genuinely ends)

Modeled: the app stays under cap up to ~500 players / 1000 rounds / 200 daily
active users (~57%). Beyond ~1000 players with 300+ daily-active users, the
polling load alone exceeds free tier — that's a Pro-plan-sized org regardless of
code. Content size (rounds, ratings) no longer matters at all.
