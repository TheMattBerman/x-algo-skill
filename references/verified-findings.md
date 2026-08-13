# Verified findings

This reference adapts the canonical research for `xai-org/x-algorithm@a389166`, released 2026-08-13. Paths below are source-code citations relative to that repository.

## Scope caveat

`home-mixer/params/param.rs:1` says its values mirror production-primary feature-switch defaults, last synced 2026-08-12. A viewer can be in another experiment arm. The weights multiply unpublished learned action probabilities, so they are not a live-score calculator.

## Scoring defaults

`RankingScorer` combines predicted action probabilities with action weights. Published defaults include copy-link share 20.0; reply, quote, and DM share 5.0; follow 4.0; generic share 2.0; repost 1.0; like 0.5; click 0.4; link open 0.2; photo expand, video open, and VQV 0.05. Citations: `home-mixer/params/param.rs:282-380`.

Negative defaults are report -234.0, mute -58.8, not interested -43.2, block -31.2, and not dwelled -0.02. A net-negative result is compressed into `[0, 0.001]`, below every net-positive result. Citations: `home-mixer/params/param.rs:424-448`; `home-mixer/scorers/ranking_scorer.rs:496-533`; `home-mixer/params/config.rs:40`.

A mutually followed viewer receives the default `BidirectionalFollowReplyWeightBoost` of +15 on an eligible original, taking reply weight from 5.0 to 20.0. Eligibility requires an original post and `is_mutual_follow_author == Some(true)`; replies and reposts are excluded. Citations: `home-mixer/params/param.rs:284-289`; `home-mixer/scorers/ranking_scorer.rs:180-193`.

## Discovery and structural rules

- An original from an author with at most 1,000 followers and fewer than 1,000 views can receive the default-on cold-start lift to rank index 15, subject to published eligibility. Replies and reposts are excluded. Citations: `home-mixer/scorers/author_cold_start.rs:86-91, 130-189`; `home-mixer/params/param.rs:620-663`.
- First like, eighth like, and 32nd like are distinct indexing or embedding milestones. Citations: `phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:62-92`; `simclusters/simclusters_v2/summingbird/common/Configs.scala:65`; `simclusters/simclusters_v2/summingbird/storm/PersistentTweetJob.scala:23,54`.
- Text retrieval windows are 24 or 48 hours. Video has windows up to 720 hours and evergreen video paths. Citation: `phoenix-rankall/src/config/mod.rs:139-156`.
- Feed maximum age is 48 hours, with learned age-bucket features. There is no published ranking half-life. Citations: `home-mixer/params/config.rs:36`; `home-mixer/filters/age_filter.rs`; `phoenix/xrex/models/recsys_feature_prep.py`.
- Replies and reposts are skipped for Phoenix OON indexing, dropped pre-scoring OON, excluded from cold start and mutual-follow boost, and receive the 0.75 OON factor in-network by default. Topic requests use 0.5. Citations: `phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:441-446`; `home-mixer/filters/oon_retweet_reply_filter.rs:13-18`; `home-mixer/scorers/ranking_scorer.rs:747-856`; `home-mixer/params/param.rs:246-271`.
- Per-request author diversity uses decay 0.5 and floor 0.25: 1.000, 0.625, 0.4375, 0.34375 for k=0 through k=3. Citation: `home-mixer/params/param.rs:222-239`; `home-mixer/scorers/ranking_scorer.rs:614-649`.

## Media, links, and visibility

There is no generic media multiplier. VQV is credited only over 10,000 ms and is zeroed for viewers over 10,000 followers. Citations: `home-mixer/params/param.rs:297-317,677-682`; `home-mixer/util/candidates_util.rs:19-40`.

There is no `has_link` ranking feature; link opening has a 0.2 default weight. Unsafe URL verdicts can apply `SEARCH_BLACKLIST`, `UNSAFE_URL`, `DO_NOT_AMPLIFY`, and `MALICIOUS_URL`, which cause OON drops. Citations: `phoenix/python/common/xai-proto/proto/recsys.proto:1105-1112`; `home-mixer/params/param.rs:310`; `botmaker-rules/scarecrow/bot/Tweet_Search_Blacklist_RTF_All_UNSAFE_URL_Sources.bot:35-53`; `botmaker-rules/scarecrow/bot/rtf_tweets_on_unsafe_verdict.bot:17-27`.

No Premium or verified multiplier exists in the For You ranking path. Premium's mechanical role is the PageRank teleport seed set, not a ranking boost. Citations: `user-cred-v2/UserCredV2App.scala:174,177-190`; `home-mixer/side_effects/ads_injection_logging_side_effect.rs:161-162`.

Published visibility rules check labels as set membership. The recommendation policy has 26 additional OON drop-only rules. Citations: `visibility-filtering/rules/registry.rs:138-170`; `visibility-filtering/models/safety_labels.rs:21-28`.

## Content and safety limits

Grox names engagement-bait, engagement-farming, engagement-trading, hashtag-abuse, and related policy types, but its rubrics are withheld. The code verifies a banger classifier and `slop_score` output, not a direct ranking boost or rubric. Citations: `grox/flows/ptos/state.py:11-70`; `grox/flows/upa/classifier_banger_initial_screen_gemma.py:44-51`.

An LLM reply-spam score at least 0.97 applies `RISKY_HIGH_VIZ_REPLY` for 14 days. Citation: `botmaker-rules/scarecrow/bot/GroxTweetProcessor.bot:8,24-29`.
