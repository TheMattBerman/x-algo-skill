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

Will this post get seen? Paste it and you get five doors that can put this in a feed — your
followers and four stranger paths — plus the kill switch that can void them, closed ones first,
plus the one edit that reopens the door that matters. Every call is a yes or no in X's published
code, cited to the line.

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
- Video duration in ms, if media is video? (door 5 index gate / VQV)
- Does the account have <= 1000 followers? (door 2)
- Any known visibility label or URL verdict already supplied by the user? (door 6) — never invent one

If a door does not depend on the answer, do not ask.

### Output order (fixed)

1. **The doors.** All six, one line each, **OPEN / CLOSED / PENDING**, with reason and
   `file:line`. **Closed first**, then pending, then open. A PENDING line MUST name the
   post-publish signal that unlocks it (see [references/doors.md](references/doors.md) § Door states).
2. **Judgment pass (required).** Run the four judgment rules in
   [references/rules.md](references/rules.md) against the draft **TEXT**:
   `J-ENGAGEMENT-BAIT`, `J-REPLY-BAIT`, `J-NEGATIVE-FEEDBACK-RISK`, `J-DUPLICATE-RISK`.
   These are the only machinery in the kit that reads the draft. They are part of Job 1's
   main path — not an appendix, not optional, and not limited to the internal script section.
3. **The one edit.** Derive it with the lever ladder below. Single highest-leverage change
   and which door it opens or protects. Not a list. Never improvise outside the ladder.
4. **The rewrite.** Draft edited with the change marked (or omit if no lever applies).
5. **Scope footer** (exactly one line, at the bottom):

`This reads the code they published, not the live knobs they can turn on you tomorrow.`

### Door line templates

Use the Grok door labels. Keep citations intact.

- `CLOSED — {label}: {reason} ({file:line})`
- `PENDING — {label}: eligible, pending {signal that unlocks it} ({file:line})`
- `OPEN — {label}: {reason} ({file:line})`

Door labels: Your followers (Thunder) · A bump while you're small (cold start) · Strangers'
For You (Phoenix retrieval) · People already into this (SimClusters) · Still findable next
month (video long tail) · The kill switch (visibility filtering).

Door 2: if draft-time gates pass, render **PENDING** on top-85% pool position — never OPEN by
dropping that gate. Door 3 originals: **PENDING** on first like (1fav) and 32 likes (32fav).
Door 4: **PENDING** on 8 likes (persistent embedding).

### The one edit — lever ladder

Doors are gated on follower count, like count, and media type. None of those move by rewording,
so the doors readout alone cannot produce an edit. After the doors and the judgment pass, pick
**the highest-ranked lever that actually applies**. Tiebreak order is the list order:

1. **Reopen a closed door.** Structural, biggest move. Make it an original rather than a reply
   (opens door 3). Take the clip past 10,000 ms (opens door 5 / 48h–720h index gate via
   `eventProcessing.strato:24, 389-405`).
2. **Remove kill-switch risk.** Protects door 6, which can silently void every other door.
   Link reputation, pinned-link exposure, anything a J-rule flags as bait that draws Grox
   scrutiny. Traction buys a more expensive inspection: deluxe pass at 64 likes, PTOS at 128
   (`grox/config/config.py:112`, `grox/flows/ptos/constants.py:25`).
3. **Design for the heaviest weights inside an open door.** Copy-link (20.0) and follow (4.0)
   carry the most weight (`param.rs:325-330, 345-350`). Weight-framed only; rare-event caveat
   in the same breath when stating ratios (`param.rs:279-281`). This is a rewrite lever, not a
   structural one.
4. **Avoid a modifier penalty.** Same-refresh stacking, near-duplicate format against your own
   recent posts (`ranking_scorer.rs:614-616`; `dpp_model.rs:147-150`).

**If nothing in the ladder applies, say so plainly.** Do not manufacture an edit to fill the slot.

One-edit sentence shape: `The one edit: {change}. Opens / protects {door}.`

Rewrite markup: strike the removed phrase with `~~like this~~` and bold the replacement
`**like this**`. Show the full rewritten draft under a `### Rewrite` heading.

### Worked example (ladder → one edit)

**Draft (before):** a reply under a large account that also ends with "like if you agree and tag
3 friends so this blows up."

**Doors (abbrev.):** door 3 CLOSED (reply; `phoenixRankAllCandidateProcessor.strato:441-446`);
door 2 CLOSED (reply); door 4 PENDING on 8 likes only after an original path exists; door 6
OPEN (no supplied label) but J-ENGAGEMENT-BAIT flags the close.

**Ladder:** rung 1 applies — make it an original. That reopens door 3 (and restores cold-start
eligibility on door 2 if followers ≤ 1000). Rung 2 would also strip the bait, but a reopened
door beats a removed risk.

**The one edit:** Post this as an original on your timeline, not a reply. Opens Strangers' For
You (Phoenix retrieval).

**Rewrite:** drop the reply framing; replace `~~like if you agree and tag 3 friends so this
blows up~~` with a concrete claim someone would **copy-link** to a friend (rung 3 is available
only after rung 1 is done — do not stack a second "one edit").

### Door evaluation quick rules

Use [references/doors.md](references/doors.md). Summary:

- **Door 1 Thunder:** OPEN by default; replies/reposts served at 0.75 (`param.rs:246-265`).
- **Door 2 Cold start:** CLOSED unless original + followers<=1000 + views<1000; else
  **PENDING** on top-85% pool position (never silently drop). Bottom 15% ineligible
  (`author_cold_start.rs:86-91, 167-189`).
- **Door 3 Phoenix OON:** CLOSED for reply/repost/community; originals **PENDING** on 1 like
  (1fav `:78-92`) and 32 likes (32fav `:62-76`).
- **Door 4 SimClusters:** **PENDING** on 8 likes for persistent embedding (`Configs.scala:65`).
- **Door 5 Video tail:** CLOSED without video; 48h–720h index needs duration >10000 ms
  (`eventProcessing.strato:24, 389-405`); VQV weight credit separately (`param.rs:677-682`).
- **Door 6 VF kill switch:** OPEN unless a *known supplied* label/verdict applies; never infer from text.

Accuracy guards: weight-framed claims only ("the weight on a copy-link share is 40x the weight on a like"); rare-event caveat (`param.rs:279-281`) in the same paragraph as any weight-ratio claim; mutual-follow +15 is a reply-term boost (5→20), not a post-level 4x; diversity is per request/refresh, never per day.

---

## Job 2 — Why did my post die

Same doors model, retrospective.

Input: the post plus whatever the user observed (impressions, who saw it, timing).

Output:

1. Closed / pending doors ranked by fit with the symptom (followers-only → door 3/4/6; zero
   impressions → door 1 retention / age gate / diversity burst; etc.).
2. Name what cannot be determined from the outside (server-side labels, unpublished `P(action)`,
   experiment arm, per-request top-85% pool position) rather than guessing.
3. Scope footer as in Job 1.

Symptom → door mapping (start here, then cite):

- Almost only followers saw it → door 3 CLOSED (reply/repost/community) or still PENDING on
  first/32nd like; or door 6 OON drop.
- Never left your own network and you are under 1k → door 2 may have been PENDING on top-85%
  and lost the slot.
- Died after early likes → check door 4's 8-like embedding + 8h half-life; door 6 if a label
  landed after publish.
- Video vanished after ~2 days → door 5 CLOSED (no video / sub-10s for 48h–720h windows).

---

## Job 3 — Am I shadowbanned

I can't see whether X labeled you. What I can do is name which published kill-switch produces
exactly the way your reach died.

Then deliver a differential diagnosis. Symptom pattern narrows to branches below. Each branch
states what the user would observe if that were the cause. Cite. Do not claim a diagnosis is
confirmed.

Branches (see [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md)):

1. **NSFW 3-of-last-5 rollup** — Observe: strangers vanish for ~7 days after a cluster of NSFW
   labels; followers may still see you. 3 of last 5 posts labeled `NSFW_HIGH_PRECISION` within
   60 days → account label 7 days; `highPageRankOrGreyBadge: false` so credibility does not
   exempt (`safety-label-user-agg/postToUserLabelRules.strato:396-426`).
2. **Retroactive URL verdict** — Observe: old posts with that URL die together when the verdict
   flips (cap 5,000). UNSAFE applies four OON-drop labels (`rtf_tweets_on_unsafe_verdict.bot:17-27`).
3. **Pinned-post trap** — Observe: account-level stranger drop while the pin stays bad; re-triggers
   when you follow anyone. Pin BAD/LOW_QUALITY URL → account `SPAM_HIGH_RECALL` 7 days
   (`PinnedLowQualityOrBadUrl.bot:8-41`; `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`).
   `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo; 7 days is implied by the
   constant name.
4. **Four FOSNR labels that also kill in-network** — Observe: followers and strangers both lose
   the post. `FOSNR_HATEFUL_CONDUCT`, `FOSNR_VIOLENT_SPEECH`, `FOSNR_ABUSE`,
   `FOSNR_CIVIC_INTEGRITY` (insults-level FOSNR is OON-only).
5. **`DO_NOT_AMPLIFY_NON_FOLLOWER`** — Observe: followers still see you; strangers do not
   (`user_label_drops.rs:101-119`).
6. **Other of the 26 OON-only drops** — Observe: same follower-only pattern without the pinned-URL
   or NSFW-rollup timeline. Full list in the cheat sheet (`registry.rs:141-166`).

Scope footer as in Job 1.

---

## Job 4 — Audit recent posts (thin)

Paste up to 10 recent posts. Pattern read only. No per-post scoring.

Look for:

- Originals-vs-replies mix (doors 2–4 closed or pending-only for replies/reposts)
- Burst clustering against per-request diversity decay 1.0 / 0.625 / 0.4375 (`ranking_scorer.rs:614-649`)
- Repeated-format DPP risk (theta 0.65 → unselected score 0.0) (`dpp_model.rs:147-150`)
- Link reputation concentration (reputation, not link presence; `param.rs:310`)

Pattern-read summary shape:

`Pattern: {originals/replies mix}. Diversity risk: {none | N posts likely same refresh}. DPP: {none | repeated format}. Links: {clean | concentrate on unknown/unsafe domains}. Next move: {one sentence}.`

Scope footer as in Job 1.

---

## Internal metadata check (not the taught interface)

`scripts/check-metadata.mjs` is an internal supplied-metadata check for contributors. Do not
present CLI flags as the user-facing path. Job 1 works from a pasted draft.

```bash
node "$CLAUDE_SKILL_DIR/scripts/check-metadata.mjs" --self-test
```

Deterministic D-rules only. Judgment rules for draft text are owned by Job 1 above and defined
in [references/rules.md](references/rules.md) — do not treat that file as skippable metadata.
