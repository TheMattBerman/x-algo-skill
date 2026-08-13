# X Reach Check

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Corrected against xai-org/x-algorithm](https://img.shields.io/badge/corrected%20against-xai--org%2Fx--algorithm%40a389166-000000.svg)

![Six doors to being seen](assets/doors-diagram.svg)

<!-- GROK: hero promise line under the doors diagram — eligibility for stranger feeds, not a score -->

## Six behavior changes

Source framing: public cheat sheet + corrected weight language. Citations: `xai-org/x-algorithm@a389166`.

1. <!-- GROK: behavior change 1 — write originals; replies never enter OON index -->
   Replies, reposts, and community posts are skipped before Phoenix OON index assignment (`phoenixRankAllCandidateProcessor.strato:441-446`) and dropped pre-scoring OON (`oon_retweet_reply_filter.rs:13-18`).

2. <!-- GROK: behavior change 2 — space posts across scrolls; per refresh not per day -->
   Author diversity multipliers are per request: 1.000 / 0.625 / 0.4375 for the first three posts from one author in one refresh (`ranking_scorer.rs:614-649`; `param.rs:222-239`).

3. <!-- GROK: behavior change 3 — design for copy-link and follow; weight-framed 40x / 8x -->
   The weight on a copy-link share is 40x the weight on a like (20.0 / 0.5); follow weight is 8x like weight (4.0 / 0.5). Weights multiply unpublished predicted probabilities; the file comment says the table reflects rarity as well as value (`param.rs:279-281, 282, 325-330, 345-350`).

4. <!-- GROK: behavior change 4 — first like / eighth / 32nd as indexing events -->
   One like writes the 1-fav index; eight likes earn a persistent SimClusters embedding; thirty-two likes open the 32-fav index (`phoenixRankAllCandidateProcessor.strato:62-92`; `Configs.scala:65`).

5. <!-- GROK: behavior change 5 — do not pin a sketchy link; pinned URL + follow re-check -->
   Pinning a BAD or LOW_QUALITY URL applies account-level `SPAM_HIGH_RECALL` for 7 days and re-checks on every follow (`PinnedLowQualityOrBadUrl.bot:8-41`; `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`).

6. <!-- GROK: behavior change 6 — video >10s for long tail / VQV -->
   Text retrieval is 24–48h; video windows reach 720h; evergreen video is 5 years. VQV requires duration > 10,000 ms (`phoenix-rankall/src/config/mod.rs:139-156`; `param.rs:677-682`).

## The price list

![What X actually pays for](assets/price-list.svg)

Each weight multiplies an unpublished predicted probability. Relative pricing, not an exchange rate.

| Action | Weight | File:line |
|---|---:|---|
| share via copy link | **20.0** | `home-mixer/params/param.rs:325-330` |
| reply | 5.0 | `home-mixer/params/param.rs:283` |
| quote | 5.0 | `home-mixer/params/param.rs:332` |
| share via DM | 5.0 | `home-mixer/params/param.rs:319-324` |
| follow the author | 4.0 | `home-mixer/params/param.rs:345-350` |
| generic share | 2.0 | `home-mixer/params/param.rs:318` |
| repost | 1.0 | `home-mixer/params/param.rs:296` |
| like | **0.5** | `home-mixer/params/param.rs:282` |
| click | 0.4 | `home-mixer/params/param.rs:309` |
| open a link | 0.2 | `home-mixer/params/param.rs:310` |
| photo expand | 0.05 | `home-mixer/params/param.rs:297-300` |
| video open | 0.05 | `home-mixer/params/param.rs:303-308` |
| video quality view | 0.05 | `home-mixer/params/param.rs:317` |
| unexplored in-network post | 0.02 | `home-mixer/params/param.rs:351-356` |
| continuous dwell time | 0.004 | `home-mixer/params/param.rs:375-380` |
| binary dwell | **0.0** | `home-mixer/params/param.rs:331` |
| profile click | **0.0** | `home-mixer/params/param.rs:311-316` |

Mutual-follow boost: on originals shown to mutuals, reply weight goes 5 → 20 (+15). That is the reply term only, not a post-level 4x (`param.rs:284-289`; `ranking_scorer.rs:180-193`).

## The penalty ledger

The weight on a report is 468× the weight on a like (−234 / 0.5). The same file comment notes negatives are large because they are rare (`param.rs:279-281, 442`). A predicted report of 0.01 is not 468 likes.

| Action | Weight | File:line |
|---|---:|---|
| report | **-234.0** | `home-mixer/params/param.rs:442` |
| mute the author | **-58.8** | `home-mixer/params/param.rs:436-441` |
| not interested | -43.2 | `home-mixer/params/param.rs:424-429` |
| block the author | -31.2 | `home-mixer/params/param.rs:430-435` |
| not dwelled | -0.02 | `home-mixer/params/param.rs:443-448` |

Mute is priced worse than block. Net-negative posts are compressed into `[0, 0.001]`, not deleted (`ranking_scorer.rs:525-533`; `config.rs:40`).

## What they held back

<!-- GROK: held-back section lede — community-note shield / bookmark tone -->

- **No trained Phoenix checkpoints.** Training code and synthetic data only; every `P(action)` comes from absent learned parameters (`README.md:32`; `phoenix/README.md:59-65`).
- **Mock `12.34`.** Abuse-enforcement follower floor is explicitly a mock "to reduce gaming" (`enforcement_user.yaml:18-20`).
- **Sentinel `9.99`.** Every BDSM per-head operating point is out of range and cannot fire (`bdsm/runtime/sink_policy.yaml:9-31`).
- **Withheld Grox `.j2` prompts** and velocity / anti-automation botmaker rules (`README.md:297, 403-406`).
- **Dead config.** `possibly_nsfw_account` requires 11 matches in a 10-post window and cannot fire (`postToUserLabelRules.strato:363-394`).
- **Params are a mirror.** Last synced 2026-08-12; experiment arms can differ (`param.rs:1`; `README.md:387-391`).

Full kill-switch list (26 OON-only drops), NSFW rollup, URL landmine, and doors detail: [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md) · [references/doors.md](references/doors.md).

## Install

Clone, then symlink into Claude Code skills:

```bash
git clone https://github.com/themattberman/x-algo-skill.git
cd x-algo-skill
mkdir -p ~/.claude/skills
ln -s "$(pwd)" ~/.claude/skills/x-reach
```

Ask Claude to check which doors a draft can open, diagnose why a post died, or run a shadowban differential. Invoke with `/x-reach`.

Paste a draft for the primary path. No CLI flags required.

## License

[MIT](LICENSE)
