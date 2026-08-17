# Judgment and account rules

Layers and deterministic eligibility live in
[how-reach-works.md](how-reach-works.md). Source citations in
[verified-findings.md](verified-findings.md). Kill-switch detail in
[creator-cheat-sheet.md](creator-cheat-sheet.md).

**Scope caveat:** `param.rs` mirrors production-primary defaults, an
experiment arm can differ, and weights multiply unpublished learned
probabilities. This checks eligibility against the open-sourced code, not
X's live production weights.

These rules never produce a reach score or verdict band.

## DETERMINISTIC (supplied metadata only)

Used by the internal `scripts/check-metadata.mjs`. Never infer labels or
URL verdicts from text.

### D-REPLY-REPOST-OON

Flag a supplied reply or repost: excluded from Phoenix stranger files and
dropped before scoring on the SimClusters path. `OonWeightFactor = 0.75`
also applies to replies and reposts shown to followers by default.
Citation: `home-mixer/params/param.rs:246-251`;
`phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:430-446`;
`home-mixer/filters/oon_retweet_reply_filter.rs:13-18`.

### D-EXTERNAL-LINK-REPUTATION

Flag an external URL for reputation verification; do not call the link
itself a penalty. Fail only supplied unsafe verdict metadata.
Citation: `home-mixer/params/param.rs:310`;
`phoenix/python/common/xai-proto/proto/recsys.proto:1105-1112`;
`botmaker-rules/scarecrow/bot/Tweet_Search_Blacklist_RTF_All_UNSAFE_URL_Sources.bot:35-53`.

### D-KNOWN-OON-VISIBILITY-LABEL

Fail supplied known stranger-drop labels. Labels are set-membership checks
without a threshold or expiry in this path.
Citation: `visibility-filtering/rules/registry.rs:138-170`;
`visibility-filtering/models/safety_labels.rs:21-28`.

### D-VIDEO-DURATION

Flag supplied video at or under 10,000 ms, or video sitting next to other
media, because the index gate `hasValidImmersiveVideo` fails.

Primary cite is the index gate: `eventProcessing.strato:24, 389-404`
(`durationMillis > minLongVideoDurationMillis`, and `forall` every media
entity). Exactly 10,000 ms fails. Mixed media fails.

The ranking-side VQV weight credit is a separate `MinVideoDurationMs` gate
(`home-mixer/params/param.rs:317,677-682`;
`home-mixer/util/candidates_util.rs:19-40`). Name the index gate first.

## JUDGMENT

Used by **Job 1** (required pass over draft TEXT before the one edit). See
`SKILL.md` lever ladder. J-rules feed the receipt line and the ladder
only. They must not drive a Layer C row.

- **J-ENGAGEMENT-BAIT:** Judge apparent manufactured or traded engagement.
  Named policy types exist; rubric withheld. Citation:
  `grox/flows/ptos/state.py:24-70`.
- **J-REPLY-BAIT:** Judge repetitive, low-substance reply calls. A 0.97
  LLM threshold exists but cannot be computed here. Citation:
  `botmaker-rules/scarecrow/bot/GroxTweetProcessor.bot:8,24-29`.
- **J-NEGATIVE-FEEDBACK-RISK:** Judge report, mute, not-interested, or
  block risk as a writing observation. Predicted viewer-action weights, not
  historical counts. Citation: `home-mixer/params/param.rs:424-448`;
  `home-mixer/scorers/ranking_scorer.rs:496-533`.
- **J-DUPLICATE-RISK:** Judge repeated-format risk against the author's
  own recent posts as a writing observation. Do not claim a DPP outcome.
  Citation: `home-mixer/params/param.rs:608-619`;
  `vm-ranker/scoring/dpp_model.rs:90,147-152`.
- **J-OFF-CATEGORY:** Judge category drift against the topic consistency
  gate. Fires only when QK was actually answered (Jobs 2 and 4, or Job 1
  on an explicit request about reach beyond For You). If QK was not asked
  or not answered, this rule cannot fire. Attach the open question: the
  published code reads a store of the author's recent posts; which posts
  that store holds is not published. Citation:
  `eventProcessing.strato:461-465, 467-505, 586-604`;
  `home-mixer/params/param.rs:103-108`.

## ACCOUNT-LEVEL (Job 4 pattern reads)

- **A-POSTING-BURST-DIVERSITY:** Flag bursts likely to overlap a viewer
  refresh. Per-request multipliers 1.000, 0.625, 0.4375 for the first
  three posts. Never "per day." Citation:
  `home-mixer/params/param.rs:222-239`;
  `home-mixer/scorers/ranking_scorer.rs:614-649`.
- **A-ORIGINALS-MIX:** Flag reply/repost-heavy mixes when stranger
  discovery is the goal. Citation:
  `home-mixer/scorers/ranking_scorer.rs:180-193`;
  `home-mixer/scorers/author_cold_start.rs:86-91`;
  `phoenixRankAllCandidateProcessor.strato:430-446`.
- **A-LINK-REPUTATION:** Flag unknown domain reputation and fail known
  unsafe verdicts. Citation:
  `botmaker-rules/scarecrow/bot/rtf_tweets_on_unsafe_verdict.bot:17-27`.
- **A-NSFW-ROLLUP:** Fail known crossings of 3 of the last 5
  `NSFW_HIGH_PRECISION` labels within 60 days, or more than 2 NSFW labels
  in a day; otherwise record unknown. Citation:
  `safety-label-user-agg/postToUserLabelRules.strato:396-426`;
  `botmaker-rules/scarecrow/derived-feature/ApplyNsfwUserLabel.df:35-40`.
- **A-TOPIC-CONSISTENCY:** Pattern-read category mix across originals and
  quotes. Infer from the pasted posts and state that inference as an
  inference. Attach the store open question. Citation:
  `eventProcessing.strato:461-465, 467-505, 586-604`.
