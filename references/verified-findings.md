# Verified findings

Citation index for `xai-org/x-algorithm@a389166`, released 2026-08-13.
Paths below are source-code citations relative to that repository.

This file indexes two research documents:

- Retrieval, writers vs readers, served corpora:
  Vault `MatthewBerman/02-projects/x-algorithm/retrieval-findings-2026-08-14.md`
  (sections A, N, O corrected)
- Ranking, weights, visibility filtering, safety labels:
  Vault `MatthewBerman/02-projects/x-algorithm/x-algorithm-verified-findings.md`

The product translation lives in [how-reach-works.md](how-reach-works.md)
and [index-map.md](index-map.md). Do not cite those research files from
Job 1 output. Cite the clone.

## Scope caveat

`home-mixer/params/param.rs:1` says its values mirror production-primary
feature-switch defaults, last synced 2026-08-12. A viewer can be in another
experiment arm. Authors can be bucketed into feature-switch arms by
`AuthorRulesEvaluator` (`home-mixer/util/author_rules.rs:37-53`). The
weights multiply unpublished learned action probabilities, so they are not
a live-score calculator.

## Retrieval readers (load-bearing)

- `RetrievalDataset` enum, no `post_creation` member:
  `phoenix/xrex/data/retrieval_dataset.py:229-285`
- `HOME` is `1fav_1day`: `:231-235`
- Launched default is `HOME` alone:
  `phoenix/xrex/inference/model_runner.py:543`;
  `phoenix/xrex/inference/launch_inference.py:496-501`
- Feed drops everything past 48 hours:
  `home-mixer/filters/age_filter.rs:16-20`;
  `home-mixer/params/config.rs:36`
- Seven For You sources:
  `home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:315-323`
- Thunder enable and follow graph:
  `home-mixer/sources/thunder_source.rs:25-27, 30`
- Phoenix retrieval enable:
  `home-mixer/sources/phoenix_source.rs:62-67`
- SimClusters enable and signals:
  `home-mixer/sources/simclusters_source.rs:88-93, 139-147`
- Phoenix topics enable and surface:
  `home-mixer/sources/phoenix_topics_source.rs:25-30`;
  `home-mixer/scored_posts_server.rs:21, 147-155`
- TweetMixer / Phoenix MoE default off:
  `home-mixer/params/param.rs:41-46, 134-139`
- `PipelineKind::is_implemented`:
  `phoenix-rankall/src/config/mod.rs:127-133`

## Writers (necessary, not sufficient)

- `post_creation` written with no fav check:
  `phoenixRankAllCandidateProcessor.strato:266-273, 469`;
  `config/mod.rs:142`
- Exclusion block order and counters: `strato:430-455`
- `isNsfwPost` versus `isAdultPost`:
  `eventProcessing.strato:308-326` with the call site at `strato:438`
- `search_unfiltered` written before the block: `strato:433-435`;
  fav check at `:49`
- `buildMetadataDump` sets no `indexName`: `strato:321-340`;
  `SidTail` defaults to `"metadata"`: `sid_tail_processor.rs:71-75`
- `hasValidImmersiveVideo` `forall` and strict `>`:
  `eventProcessing.strato:24, 389-404`
- Rankall routes a record only to windows whose name equals `index_name`:
  `phoenix-rankall/src/store/base.rs:983-991`

## Scoring defaults

`RankingScorer` combines predicted action probabilities with action
weights. Published defaults include copy-link share 20.0; reply, quote, and
DM share 5.0; follow 4.0; generic share 2.0; repost 1.0; like 0.5; click
0.4; link open 0.2; photo expand, video open, and VQV 0.05. Citations:
`home-mixer/params/param.rs:282-380`.

Negative defaults are report -234.0, mute -58.8, not interested -43.2,
block -31.2, and not dwelled -0.02. A net-negative result is compressed
into `[0, 0.001]`, below every net-positive result. Citations:
`home-mixer/params/param.rs:424-448`;
`home-mixer/scorers/ranking_scorer.rs:496-533`;
`home-mixer/params/config.rs:40`.

A mutually followed viewer receives the default
`BidirectionalFollowReplyWeightBoost` of +15 on an eligible original,
taking reply weight from 5.0 to 20.0. Eligibility requires an original post
and `is_mutual_follow_author == Some(true)`; replies and reposts are
excluded. Citations: `home-mixer/params/param.rs:284-289`;
`home-mixer/scorers/ranking_scorer.rs:180-193`.

## Discovery and structural rules

- An original from an author with at most 1,000 followers and fewer than
  1,000 views can receive the default-on cold-start lift. At shipped
  defaults the target range is one value (`15..16`). The post must already
  sit in the top 85 percent of the non-zero-scored pool. Replies and
  reposts are excluded. Citations:
  `home-mixer/scorers/author_cold_start.rs:86-91, 130-139, 165-179`;
  `home-mixer/params/param.rs:621-656`.
- Tail uses a different 1,000: skip at `followers >= 1000`. Citations:
  `sid_tail_processor.rs:78-80`; `config/mod.rs:88-89`.
- First like is the first proven entry into a searched corpus (`1fav` via
  `HOME`). 32 likes write a file no published dataset type names. 8 likes
  build a persistent SimClusters embedding. Citations:
  `strato:62-92`; `Configs.scala:65`; `retrieval_dataset.py:231-235`;
  `model_runner.py:543`.
- Two engagement half-lives exist: SimClusters `HalfLife = 8.hours`
  (`Configs.scala:39`) and `EXPLORATION_HALF_LIFE_HOURS = 8.0`
  (`phoenix/xrex/data/recsys/recsys_batch.py:47`). Neither is a
  ranking-time decay on the post's score.
- SimClusters candidate age cap is 48 hours
  (`simclusters_source.rs:33`). The ANN drop threshold is
  `POST_ANN_MIN_SCORE = 0.5` (`:35`), not `ANN_MIN_SCORE` (`:30` is 0.0).
- Replies and reposts are skipped for Phoenix stranger files, dropped
  before scoring out of network, excluded from cold start and
  mutual-follow boost, and receive the 0.75 factor even when shown to
  followers by default. Citations: `strato:430-446`;
  `oon_retweet_reply_filter.rs:13-18`;
  `ranking_scorer.rs:747-754`; `param.rs:246-251`.
- Per-request author diversity uses decay 0.5 and floor 0.25: 1.000,
  0.625, 0.4375, 0.34375 for k=0 through k=3. Citation:
  `home-mixer/params/param.rs:222-239`;
  `home-mixer/scorers/ranking_scorer.rs:614-649`.

## Media, links, and visibility

There is no generic media multiplier. VQV is credited only over 10,000 ms
and is zeroed for viewers over 10,000 followers. Citations:
`home-mixer/params/param.rs:297-317,677-682`;
`home-mixer/util/candidates_util.rs:19-40`. The index gate is separate
and primary: `eventProcessing.strato:24, 389-404`.

There is no `has_link` ranking feature; link opening has a 0.2 default
weight. Unsafe URL verdicts can apply `SEARCH_BLACKLIST`, `UNSAFE_URL`,
`DO_NOT_AMPLIFY`, and `MALICIOUS_URL`, which cause stranger drops.
Citations: `recsys.proto:1105-1112`; `param.rs:310`;
`Tweet_Search_Blacklist_RTF_All_UNSAFE_URL_Sources.bot:35-53`.

The unsafe-verdict bot iterates every tweet id returned for the URL, with
no cap in that file (`rtf_tweets_on_unsafe_verdict.bot:17-27`).

Do not attach a tweet-count safeguard to that file. The only published
tweet-count safeguard lives on a different bot, on the NSFW card-image
verdict path, and that is a separate mechanism. That bot sets
`val :tweetSafeguard = 5000`
(`NSFW_Card_Image_URL_to_Tweet_Verdict.bot:20-22`).

No Premium or verified multiplier exists in the For You ranking path.
Premium's mechanical role is the PageRank teleport seed set, not a ranking
boost. Citations: `user-cred-v2/UserCredV2App.scala:174,177-190`;
`home-mixer/side_effects/ads_injection_logging_side_effect.rs:161-162`.

Visibility filtering runs at index time via `shouldDropPostByVF`
(`eventProcessing.strato:246-265`, called at `strato:439`). A dropped post
is kept out of the files below. `search_unfiltered` can still fire on a
like and has no published reader. The request-time pass
(`phoenix_candidate_pipeline.rs:398-421`) is a second application over
posts that already survived the first. Published visibility rules check
labels as set membership. The recommendation policy has 26 additional
stranger-only drop rules. Citations:
`visibility-filtering/rules/registry.rs:138-170`;
`visibility-filtering/models/safety_labels.rs:21-28`.

## Content and safety limits

Grox names engagement-bait, engagement-farming, engagement-trading,
hashtag-abuse, and related policy types, but its rubrics are withheld.
The code verifies a banger classifier and `slop_score` output, not a
direct ranking boost or rubric. Citations: `grox/flows/ptos/state.py:11-70`;
`grox/flows/upa/classifier_banger_initial_screen_gemma.py:44-51`.

Deluxe pass at 64 likes (`grox/config/config.py:112`). PTOS at 128
(`grox/flows/ptos/constants.py:25`).

An LLM reply-spam score at least 0.97 applies `RISKY_HIGH_VIZ_REPLY` for
14 days. Citation: `botmaker-rules/scarecrow/bot/GroxTweetProcessor.bot:8,24-29`.
