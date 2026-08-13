---
name: x-algo-audit
description: Audit an X draft or account behavior against published X algorithm defaults and cited judgment rules. Use for X post audits, reach constraints, and evidence-grounded drafting guidance.
---

# X Algorithm Audit Kit

Use this as a pre-publish gate, not as a reach prediction. Numeric defaults are mirrored production-primary feature-switch values from `xai-org/x-algorithm@a389166`; experiments and unpublished model probabilities can differ.

## Audit a post

Collect the draft plus metadata: reply or repost status, media type, video duration, known URL verdict, and known visibility labels. Never infer a label or unsafe verdict from text or a domain.

```bash
node "$CLAUDE_SKILL_DIR/scripts/audit-post.mjs" (--text "Draft text" | --file PATH) [--reply] [--repost] [--media photo|video|other] [--video-duration-ms NUMBER] [--known-oon-drop-label LABEL] [--url-verdict unsafe]
```

`$CLAUDE_SKILL_DIR` resolves to this installed skill's directory, so do not run the script from the user's project-relative `scripts/` path. Before relying on the gate, verify its deterministic checks with:

```bash
node "$CLAUDE_SKILL_DIR/scripts/audit-post.mjs" --self-test
```

See [fixture documentation](tests/fixtures/README.md) for the cases covered by the self-test.

Interpret exit codes as deterministic results only: `0` PASS, `1` FLAG, `2` FAIL, `3` usage error. A PASS is not a complete audit. Complete every judgment rule in [references/rules.md](references/rules.md), then return a scorecard with every applicable rule, result, citation, and factual rationale.

Reply and repost drafts should be flagged when discovery is the goal: the published pipeline excludes them from OON retrieval and drops them pre-scoring OON. Do not call them bad content; they can serve conversation and relationship goals.

## Drafting guidance

Use [post templates](references/post-templates.md) as editorial patterns to test, not algorithmic predictions. Prefer useful, accurate material that may earn a copy-link share or a follow. Do not promise a format, length, media choice, question, hashtag, or timing will cause a platform outcome.

Media is a format choice, not a universal bonus. Links need reputation verification, not categorical avoidance. Avoid engagement bait and reply bait through judgment, never a keyword claim. See [creator cheat sheet](references/creator-cheat-sheet.md) and [pipeline](references/pipeline.md).

## Account audit

Ask for typical posting bursts, originals versus replies/reposts mix, link reputation, media/video details, known labels or URL verdicts, and known NSFW high-precision label history. Apply account rules in [references/rules.md](references/rules.md). Separate self-reported facts from inferences.

End every audit scorecard with exactly:

`Scope: this audits against the open-sourced code, not X's live production weights.`
