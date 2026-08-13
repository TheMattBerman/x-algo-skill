# The doors model

Six routes to being seen. Every job in this skill is this model in a different tense.
Citations are relative to `xai-org/x-algorithm@a389166` and must trace to
[verified-findings.md](verified-findings.md). Do not invent a seventh door.

Eligibility only. No score, no verdict band, no reach prediction.

## Door states

Every door 1–5 resolves to exactly one of three states. Fixed wording:

- **OPEN** — every condition is determinable now and satisfied.
- **CLOSED** — a condition is determinable now and failed. This is the actionable state.
- **PENDING** — structurally eligible, but entry is gated on a post-publish signal. The line
  **MUST** name the signal that unlocks it.

Door 6 (kill switch) is not a door you open. Fixed wording: **CLEAR** or **TRIPPED**. Never OPEN.

Never render a PENDING door as OPEN. Never drop an unknowable gate to make a door render cleanly.

| Door | Determinable at draft time | Gated on post-publish signal |
|---|---|---|
| 1 in-network | all (retention, reply/repost status) | none |
| 2 cold start | original, followers <= 1000, views < 1000 | top-85% pool position (per request, unknowable) |
| 3 Phoenix OON | reply/repost/community lockout | 1 like (1fav index), 32 likes (32fav) |
| 4 SimClusters | none | 8 likes (persistent embedding) |
| 5 video tail | has video, duration > 10,000 ms | none |
| 6 kill switch | known labels/verdicts only; NEVER inferred | server-side labels are never visible. States: **CLEAR** / **TRIPPED**, never OPEN |

## Door 1 — Your followers (Thunder)

Your followers.

**Open by default.** Replies and reposts are still served in-network, at the 0.75 factor.

Constraints:

- Thunder keeps 50 most recent originals and 30 most recent replies per author
  (`thunder/config.rs:5-6`).
- Retention is 2 days / 172800 seconds (`thunder/args.rs:48-49`).
- Feed age gate is 48 hours (`home-mixer/params/config.rs:36`).
- Replies and reposts take `OonWeightFactor` 0.75 even in-network when
  `EnableOonRescoreForInNetworkRepliesRetweets` is on (default true)
  (`home-mixer/params/param.rs:246-251, 260-265`;
  `home-mixer/scorers/ranking_scorer.rs:747-754, 847-856`).

Pipeline caption (no creator implication beyond candidate sources): candidates arrive
from Thunder, Phoenix retrieval, Phoenix topics, and SimClusters ANN; TweetMixer and
Phoenix MoE are off by default
(`home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:315-323`;
`home-mixer/params/param.rs:11-14, 42-52, 135-138`). After scoring, `TopKScoreSelector`
keeps 50 (`home-mixer/params/config.rs:17`;
`home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:398`).

## Door 2 — A bump while you're small (cold start)

Deterministic lift to rank index 15 for one eligible post per request.

**Determinable now (must all hold, else CLOSED):**

- not a reply
- not a repost
- author followers <= 1000 (`ColdStartFollowerCap`, `home-mixer/params/param.rs:638-643`)
- views < 1000 (`ColdStartImpressionThreshold`, `:620-625`; checked at
  `home-mixer/scorers/author_cold_start.rs:179`)

**PENDING when the above hold:** the post must already sit in the **top 85%** of the
non-zero-scored pool (`LowImpressionsMaxPositionRatio` 0.85 at
`author_cold_start.rs:167-178`; `param.rs:651-656`). That pool position is a
**per-request runtime property** and is unknowable before publish. Bottom-15% posts are
**ineligible**. Never silently drop this gate to render the door OPEN.

Enabled by default (`EnableViewerColdStart = true`, `param.rs:658-663`). At shipped
defaults `ColdStartSlotMin = 15` / `ColdStartSlotMax = 16` make
`random_range(15..16)` a one-element range, so the target is deterministically rank
index 15 (`author_cold_start.rs:130-138, 189`; `param.rs:626-637`).

PENDING line must name the unlock: top-85% pool position (per request).

## Door 3 — Strangers' For You (Phoenix retrieval)

The main stranger path.

**CLOSED** for replies, reposts, and community posts
(`phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:441-446`).
OON replies and reposts are also dropped pre-scoring
(`home-mixer/filters/oon_retweet_reply_filter.rs:13-18`).

**PENDING for originals** (structurally eligible; index writes are post-publish):

- pending the first like → 1fav index (`phoenixRankAllCandidateProcessor.strato:78-92`)
- pending 32 likes → 32fav index (`:62-76`)

Text retention windows are 24h and 48h (`phoenix-rankall/src/config/mod.rs:139-156`).

PENDING lines must name the unlock signal (1 like / 32 likes).

## Door 4 — People already into this (SimClusters)

**PENDING** on 8 likes for a persistent embedding
(`simclusters/simclusters_v2/summingbird/common/Configs.scala:65`;
`simclusters/simclusters_v2/summingbird/storm/PersistentTweetJob.scala:23, 54`).
ANN min score 0.5 (`home-mixer/sources/simclusters_source.rs:35`).
8-hour half-life (`Configs.scala:39`) — the only real engagement half-life in the
release.

PENDING line must name the unlock: 8 likes (persistent embedding).

## Door 5 — Still findable next month (video long tail)

Requires video. Determinable at draft time when duration is known; no post-publish signal.

Retention: `video` 48 / 96 / 168 / 336 / **720h**; `nsfw_video` **48h and 168h only**;
evergreen video 5 years (`24 * 365 * 5` hours); evergreen Grok video 30 days
(`phoenix-rankall/src/config/mod.rs:139-156`).

The `video` 48h–720h and `nsfw_video` 48h/168h windows are gated by `hasValidImmersiveVideo`:
duration must be **strictly greater than** 10,000 ms (exactly 10,000 ms is also excluded)
(`phoenix-rankall-strato/lib/eventProcessing.strato:24, 389-405`). That duration floor
does **not** apply to the 5-year evergreen writers in the published code (media type
only; the promotion job is not in the repo). Do not merge `nsfw_video` into the 96/336/720h
set (`config/mod.rs:151-152`).

Separately, VQV **weight** credit (weight 0.05) requires duration > 10,000 ms
(`home-mixer/params/param.rs:677-682`; `home-mixer/util/candidates_util.rs:19-40`)
and is zeroed for **viewers** over 10,000 followers, not authors
(`candidates_util.rs:4, 25-29`). Index gate and VQV weight credit are distinct mechanisms.

## Door 6 — The kill switch (visibility filtering)

Not a door you open. A labeled post can occupy a top-50 slot and then vanish; VF runs
after selection (`phoenix_candidate_pipeline.rs:398-421`).

- 28 base rules run for everyone (`visibility-filtering/rules/registry.rs:101-132`)
- 26 additional drop-only rules run for viewers who do not follow you (`:138-170`)
- Labels are set membership only: score, expiry, country, and holdback are discarded
  (`visibility-filtering/models/safety_labels.rs:21-28`)

At draft time: **CLEAR** unless a *known supplied* label/verdict applies (**TRIPPED**).
Never infer. Never render this as OPEN — it is not a door you open. Server-side labels
the kit cannot see remain unknowable — say so; do not invent PENDING as a diagnosis.
A Job 1 J-rule flag may append `See Judgment: …` on a CLEAR line. That is a pointer, not
a state change.

Full OON-only drop list, NSFW rollup, URL landmine, and FOSNR in-network kills:
[creator-cheat-sheet.md](creator-cheat-sheet.md).

## Modifiers (do not open or close a door)

Report only when triggered:

| Modifier | Rule | Citation |
|---|---|---|
| Author diversity | per request / per refresh multipliers 1.0 / 0.625 / 0.4375 / 0.34375, floor 0.25 | `home-mixer/scorers/ranking_scorer.rs:614-616`; `param.rs:222-239` |
| DPP near-duplicate | unselected candidates scored 0.0 at theta 0.65 | `vm-ranker/scoring/dpp_model.rs:147-150`; `param.rs:608-619` |
| Retweet dedup | keeps first arrival in source order, not best | `home-mixer/filters/retweet_deduplication_filter.rs:19-26` |
| Negative compression | net-negative posts squeezed into `[0, 0.001]` | `ranking_scorer.rs:525-533`; `config.rs:40` |
| Exploration bonus | 0.02 for in-network originals under 24h with views below 3% of followers | `param.rs:351-356`; `phoenix/xrex/data/recsys/recsys_batch.py:45-47` |

Never say diversity is "per day." It is per request / per refresh.
