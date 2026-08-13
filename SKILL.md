---
name: x-reach
description: Check which X feed routes a draft is eligible for (the doors model). Use for reach eligibility, closed-door diagnosis, shadowban differential diagnosis, and recent-post pattern reads against published x-algorithm defaults.
---

# X Reach Check

Eligibility, not prediction. Evaluate the six doors in [references/doors.md](references/doors.md).
Never emit a score, verdict band, or reach prediction. Never infer a safety label or URL
verdict from post text or a domain name.

Source commit: `xai-org/x-algorithm@a389166`. Every numeric claim needs a `file:line` that
traces to [references/verified-findings.md](references/verified-findings.md).

<!-- GROK: one-line product promise for in-flow greetings; eligibility not prediction -->

## Job selection

Pick the job from the user request. Default to Job 1 when they paste a draft.

| Signal | Job |
|---|---|
| Pasted draft / "make this get seen" / pre-publish | Job 1 (primary) |
| "Why did this die" / post + observed symptoms | Job 2 |
| "Am I shadowbanned" / sudden follower-only reach | Job 3 |
| "Audit my last N posts" / pattern across recent posts | Job 4 |

---

## Job 1 — Make this post get seen (PRIMARY)

Happy path: the user pastes a draft. **No CLI flags.** Do not teach `scripts/` as the interface.

### Facts you may need (ask in ONE batch, only when a door depends on them)

Infer what you can from the draft (link presence, obvious reply markers if the UI paste includes
them). Ask only for uninferable facts that change a door, in a single batch:

- Is this a reply or a repost? (doors 2, 3, 4 eligibility; door 1 haircut)
- Video duration in ms, if media is video? (door 5 VQV / long-tail eligibility)
- Does the account have <= 1000 followers? (door 2)
- Any known visibility label or URL verdict already supplied by the user? (door 6) — never invent one

If a door does not depend on the answer, do not ask.

### Output order (fixed)

1. **The doors.** All six, one line each, open or closed, with reason and `file:line`.
   **Closed doors first**, then open.
2. **The one edit.** Single highest-leverage change and which door it opens. Not a list.
3. **The rewrite.** Draft edited with the change marked.
4. **Scope footer** (exactly one line, at the bottom):

`Scope: eligibility against open-sourced code at a389166, not live production weights.`

<!-- GROK: door open/closed line templates; keep citations intact -->
<!-- GROK: "the one edit" sentence template naming the door it opens -->
<!-- GROK: rewrite markup convention (e.g. how the change is marked) -->

### Door evaluation quick rules

Use [references/doors.md](references/doors.md). Summary:

- **Door 1 Thunder:** open by default; note 0.75 haircut if reply/repost (`param.rs:246-265`).
- **Door 2 Cold start:** closed unless original + followers<=1000 + views<1000 + already top 85% of non-zero pool. Bottom 15% ineligible (`author_cold_start.rs:86-91, 167-189`).
- **Door 3 Phoenix OON:** hard-closed for reply/repost/community (`phoenixRankAllCandidateProcessor.strato:441-446`).
- **Door 4 SimClusters:** needs 8 likes for persistent embedding (`Configs.scala:65`); closed for reply/repost OON path.
- **Door 5 Video tail:** closed without video; VQV needs >10000 ms (`param.rs:677-682`).
- **Door 6 VF kill switch:** open unless a *known supplied* label/verdict applies; never infer from text.

Accuracy guards: weight-framed claims only ("the weight on a copy-link share is 40x the weight on a like"); rare-event caveat (`param.rs:279-281`) in the same paragraph as any weight-ratio claim; mutual-follow +15 is a reply-term boost (5→20), not a post-level 4x; diversity is per request/refresh, never per day.

---

## Job 2 — Why did my post die

Same doors model, retrospective.

Input: the post plus whatever the user observed (impressions, who saw it, timing).

Output:

1. Closed doors ranked by fit with the symptom (followers-only → door 3/4/6; zero impressions → door 1 retention / age gate / diversity burst; etc.).
2. Name what cannot be determined from the outside (server-side labels, unpublished `P(action)`, experiment arm) rather than guessing.
3. Scope footer as in Job 1.

<!-- GROK: retrospective symptom → door mapping copy -->

---

## Job 3 — Am I shadowbanned

**Honest framing is mandatory.** Say early, in one line: this kit cannot detect a label;
labels are server-side and the code only shows what a label does.

Then deliver a differential diagnosis. Symptom pattern narrows to branches below. Each branch
states what the user would observe if that were the cause. Cite. Do not claim a diagnosis is
confirmed.

Branches (see [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md)):

1. **NSFW 3-of-last-5 rollup** — 3 of last 5 posts labeled `NSFW_HIGH_PRECISION` within 60 days → account label 7 days; `highPageRankOrGreyBadge: false` so credibility does not exempt (`safety-label-user-agg/postToUserLabelRules.strato:396-426`).
2. **Retroactive URL verdict** — UNSAFE applies four OON-drop labels; verdict changes relabel old posts (cap 5,000) (`rtf_tweets_on_unsafe_verdict.bot:17-27`).
3. **Pinned-post trap** — pin BAD/LOW_QUALITY URL → account `SPAM_HIGH_RECALL` 7 days; re-check on every follow (`PinnedLowQualityOrBadUrl.bot:8-41`; `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`).
4. **Four FOSNR labels that also kill in-network** — `FOSNR_HATEFUL_CONDUCT`, `FOSNR_VIOLENT_SPEECH`, `FOSNR_ABUSE`, `FOSNR_CIVIC_INTEGRITY` (insults-level FOSNR is OON-only).
5. **`DO_NOT_AMPLIFY_NON_FOLLOWER`** — followers still see you; strangers do not (`user_label_drops.rs:101-119`).
6. **Other of the 26 OON-only drops** — full list in the cheat sheet (`registry.rs:141-166`).

<!-- GROK: mandatory one-line "cannot detect labels" framing -->
<!-- GROK: differential-diagnosis branch headers and observation sentences -->

Scope footer as in Job 1.

---

## Job 4 — Audit recent posts (thin)

Paste up to 10 recent posts. Pattern read only. No per-post scoring.

Look for:

- Originals-vs-replies mix (doors 2–4 closed for replies/reposts)
- Burst clustering against per-request diversity decay 1.0 / 0.625 / 0.4375 (`ranking_scorer.rs:614-649`)
- Repeated-format DPP risk (theta 0.65 → unselected score 0.0) (`dpp_model.rs:147-150`)
- Link reputation concentration (reputation, not link presence; `param.rs:310`)

<!-- GROK: pattern-read summary template for Job 4 -->

Scope footer as in Job 1.

---

## Internal metadata check (not the taught interface)

`scripts/check-metadata.mjs` is an internal supplied-metadata check for contributors. Do not
present CLI flags as the user-facing path. Job 1 works from a pasted draft.

```bash
node "$CLAUDE_SKILL_DIR/scripts/check-metadata.mjs" --self-test
```

Judgment rules that still need a human/LLM call (bait, duplicate risk, negative-feedback risk)
live in [references/rules.md](references/rules.md). They never produce a reach score.
