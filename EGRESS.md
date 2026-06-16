# Egress budget — rules to never blow the Supabase free cap (5 GB/month)

The project once exceeded the cap and got its API restricted. The root causes
were fixed; this doc keeps them from coming back. **Read before adding any query.**

## The one rule that matters

**A query that grows with table size, and runs repeatedly (polling) or on every
visit, is an egress bomb.** Egress = payload_size × frequency × users. As data
accumulates, payload grows → egress grows → cap blown.

## Frequency, not concurrency, is the egress risk

100 users hitting the app *at the same instant* is fine — egress is the monthly
byte sum and doesn't care about timing; only the 60-connection pool cares, and we
peak at ~3. The real risk is **total opens/month**: 100 users × many opens/day.
The biggest per-open payload is the `['players']` list (~18 KB), pulled on almost
every screen. It barely changes, so it's cached for **10 minutes**
(`setQueryDefaults(['players'])` in `src/lib/query-client.js`) — safe because
every player mutation already `invalidateQueries(['players'])`, so a real change
refetches immediately. This cuts the frequency-driven egress ~88%.

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

## All quota dimensions (not just query egress)

| Dimension | Free cap | Status | Protection |
|---|---|---|---|
| Egress (queries) | 5 GB/mo | safe (capped) | limits + RPC aggregates |
| Database size | 500 MB | 12 MB used | tiny; no base64 in rows |
| **Storage** | 1 GB | safe | **images compressed to ~250 KB on upload** |
| Storage egress | — | safe | compressed + 1-year CDN cache |
| Monthly Active Users | 50,000 | nowhere near | — |
| Realtime | 200 conn | **0 used** (not used) | — |

**Images**: `uploadFile()` compresses before upload (`src/lib/imageCompress.js`).
It downscales to max 1600px and steps JPEG quality (80%→42%, then width) down
until the result is **actually under a hard 250 KB ceiling** — not a fixed
quality that merely hopes to land there. A phone photo (3–12 MB) becomes ~250 KB.
Why the ceiling is enforced, not assumed: the victory photo is the heaviest asset
in the app. 100 people viewing one after a match each pull it from origin once
(cold CDN); at 4.45 MB that's ~425 MB/match → would blow the cap in ~12 matches.
At 250 KB it's ~24 MB/match. Never upload raw user files.

**Old uncompressed photos** (uploaded before compression existed) are retrofitted
by `scripts/recompress-storage-photos.cjs` — downloads each Storage victory photo,
re-encodes with `sharp` to ≤250 KB, re-uploads to the same path (URL unchanged).
Dry-run by default; `--apply` to write. Needs `SUPABASE_SERVICE_ROLE_KEY` in env
(local admin run only — never in the client bundle).

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
