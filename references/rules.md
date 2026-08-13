# Judgment and account rules

Doors and deterministic eligibility live in [doors.md](doors.md). Source citations in
[verified-findings.md](verified-findings.md). Kill-switch detail in
[creator-cheat-sheet.md](creator-cheat-sheet.md).

**Scope caveat:** `param.rs` mirrors production-primary defaults, an experiment arm can differ,
and weights multiply unpublished learned probabilities. This checks eligibility against the
open-sourced code, not X's live production weights.

These rules never produce a reach score or verdict band.

## DETERMINISTIC (supplied metadata only)

Used by the internal `scripts/check-metadata.mjs`. Never infer labels or URL verdicts from text.

### D-REPLY-REPOST-OON

Flag a supplied reply or repost: excluded from Phoenix OON retrieval and dropped pre-scoring OON.
`OonWeightFactor = 0.75` also applies to in-network replies/reposts by default.
Citation: `home-mixer/params/param.rs:246-265`;
`phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:441-446`;
`home-mixer/filters/oon_retweet_reply_filter.rs:13-18`.

### D-EXTERNAL-LINK-REPUTATION

Flag an external URL for reputation verification; do not call the link itself a penalty.
Fail only supplied unsafe verdict metadata.
Citation: `home-mixer/params/param.rs:310`;
`phoenix/python/common/xai-proto/proto/recsys.proto:1105-1112`;
`botmaker-rules/scarecrow/bot/Tweet_Search_Blacklist_RTF_All_UNSAFE_URL_Sources.bot:35-53`.

### D-KNOWN-OON-VISIBILITY-LABEL

Fail supplied known OON-drop labels. Labels are set-membership checks without a threshold or
expiry in this path.
Citation: `visibility-filtering/rules/registry.rs:138-170`;
`visibility-filtering/models/safety_labels.rs:21-28`.

### D-VIDEO-DURATION

Flag supplied video under 10,000 ms because VQV credit does not apply.
Citation: `home-mixer/params/param.rs:317,677-682`;
`home-mixer/util/candidates_util.rs:19-40`.

## JUDGMENT

Used by **Job 1** (required pass over draft TEXT before the one edit). See SKILL.md lever ladder.

- **J-ENGAGEMENT-BAIT:** Judge apparent manufactured or traded engagement. Named policy types exist; rubric withheld. Citation: `grox/flows/ptos/state.py:24-70`.
- **J-REPLY-BAIT:** Judge repetitive, low-substance reply calls. A 0.97 LLM threshold exists but cannot be computed here. Citation: `botmaker-rules/scarecrow/bot/GroxTweetProcessor.bot:8,24-29`.
- **J-NEGATIVE-FEEDBACK-RISK:** Judge likely report, mute, not-interested, or block risk. Predicted viewer-action weights, not historical counts. Citation: `home-mixer/params/param.rs:424-448`; `home-mixer/scorers/ranking_scorer.rs:496-533`.
- **J-DUPLICATE-RISK:** Judge likely near-duplicate risk in one ranked request. DPP theta 0.65; unselected candidates score 0.0. Citation: `home-mixer/params/param.rs:608-619`; `vm-ranker/scoring/dpp_model.rs:90,147-150`.

## ACCOUNT-LEVEL (Job 4 pattern reads)

- **A-POSTING-BURST-DIVERSITY:** Flag bursts likely to overlap a viewer refresh. Per-request multipliers 1.000, 0.625, 0.4375 for the first three posts. Never "per day." Citation: `home-mixer/params/param.rs:222-239`; `home-mixer/scorers/ranking_scorer.rs:614-649`.
- **A-ORIGINALS-MIX:** Flag reply/repost-heavy mixes when OON discovery is the goal. Citation: `home-mixer/scorers/ranking_scorer.rs:180-193`; `home-mixer/scorers/author_cold_start.rs:86-91`.
- **A-LINK-REPUTATION:** Flag unknown domain reputation and fail known unsafe verdicts. Citation: `botmaker-rules/scarecrow/bot/rtf_tweets_on_unsafe_verdict.bot:17-27`.
- **A-NSFW-ROLLUP:** Fail known crossings of 3 of the last 5 `NSFW_HIGH_PRECISION` labels within 60 days, or more than 2 NSFW labels in a day; otherwise record unknown. Citation: `safety-label-user-agg/postToUserLabelRules.strato:396-426`; `botmaker-rules/scarecrow/derived-feature/ApplyNsfwUserLabel.df:35-40`.
