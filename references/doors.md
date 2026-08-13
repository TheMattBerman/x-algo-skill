# The doors model

Six routes to being seen. Every job in this skill is this model in a different tense.
Citations are relative to `xai-org/x-algorithm@a389166` and must trace to
[verified-findings.md](verified-findings.md). Do not invent a seventh door.

Eligibility only. No score, no verdict band, no reach prediction.

## Door 1 — In-network (Thunder)

Your followers.

**Open by default** for originals that still sit inside Thunder's retention window.

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

## Door 2 — Cold-start force-slot

Deterministic lift to rank index 15 for one eligible post per request.

**Open only if ALL of:**

- not a reply
- not a repost
- author followers <= 1000 (`ColdStartFollowerCap`, `home-mixer/params/param.rs:638-643`)
- views < 1000 (`ColdStartImpressionThreshold`, `:620-625`; checked at
  `home-mixer/scorers/author_cold_start.rs:179`)
- the post already sits in the **top 85%** of the non-zero-scored pool
  (`LowImpressionsMaxPositionRatio` 0.85 at `author_cold_start.rs:167-178`;
  `param.rs:651-656`). Bottom-15% posts are **ineligible**.

Enabled by default (`EnableViewerColdStart = true`, `param.rs:658-663`). At shipped
defaults `ColdStartSlotMin = 15` / `ColdStartSlotMax = 16` make
`random_range(15..16)` a one-element range, so the target is deterministically rank
index 15 (`author_cold_start.rs:130-138, 189`; `param.rs:626-637`).

## Door 3 — Phoenix OON retrieval

The main stranger path.

**Hard-closed** for replies, reposts, and community posts
(`phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:441-446`).
OON replies and reposts are also dropped pre-scoring
(`home-mixer/filters/oon_retweet_reply_filter.rs:13-18`).

Index entry gates for originals:

- 1 like enters the 1fav index (`phoenixRankAllCandidateProcessor.strato:78-92`)
- 32 likes enters the 32fav index (`:62-76`)

Text retention windows are 24h and 48h (`phoenix-rankall/src/config/mod.rs:139-156`).

## Door 4 — SimClusters ANN

Needs a persistent embedding at 8 likes
(`simclusters/simclusters_v2/summingbird/common/Configs.scala:65`;
`simclusters/simclusters_v2/summingbird/storm/PersistentTweetJob.scala:23, 54`).
ANN min score 0.5 (`home-mixer/sources/simclusters_source.rs:35`).
8-hour half-life (`Configs.scala:39`) — the only real engagement half-life in the
release.

## Door 5 — Video long tail

Requires video.

Retention: 48 / 96 / 168 / 336 / **720h**; evergreen video 5 years
(`24 * 365 * 5` hours); evergreen Grok video 30 days
(`phoenix-rankall/src/config/mod.rs:139-156`).

VQV credit (weight 0.05) requires duration > 10,000 ms
(`home-mixer/params/param.rs:677-682`; `home-mixer/util/candidates_util.rs:19-40`)
and is zeroed for **viewers** over 10,000 followers, not authors
(`candidates_util.rs:4, 25-29`).

## Door 6 — Visibility filtering (kill switch)

Not a door you open. A labeled post can occupy a top-50 slot and then vanish; VF runs
after selection (`phoenix_candidate_pipeline.rs:398-421`).

- 28 base rules run for everyone (`visibility-filtering/rules/registry.rs:101-132`)
- 26 additional drop-only rules run for viewers who do not follow you (`:138-170`)
- Labels are set membership only: score, expiry, country, and holdback are discarded
  (`visibility-filtering/models/safety_labels.rs:21-28`)

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
