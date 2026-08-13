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
- About how many seconds is the video, if media is video? (door 5 index gate / VQV) — ask in
  seconds, never in milliseconds. Convert internally (`seconds * 1000`). The published gate is
  strict `>` 10,000 ms (`eventProcessing.strato:24, 389-405`). If they say "about 10 seconds" or
  anything in 9–11s without a clear over/under, do not guess: ask once whether it is clearly
  longer than 10 seconds, or at/under. Exactly 10 seconds is still out. Until that is answered,
  render door 5 **PENDING** on duration.
- Does the account have <= 1000 followers? (door 2)
- Has X sent a warning, restriction, or notice about this account or a link in the draft?
  (door 6) — only if they actually report one. Never infer a label or URL verdict from the
  post text or a domain.

If a door does not depend on the answer, do not ask.

### Output order (fixed)

1. **The doors.** All six, one line each. Doors 1–5 use **OPEN / CLOSED / PENDING**. Door 6
   (kill switch) uses **CLEAR / TRIPPED** — never OPEN; it is not a door anyone opens. Closed
   and tripped first, then pending, then open, then clear. A PENDING line MUST name the
   post-publish signal that unlocks it (see [references/doors.md](references/doors.md) § Door states).
2. **Judgment.** Exactly one line — the receipt that the required pass ran. Never omit it.
   Never expand it into findings.
3. **The one edit** or **No edit.** Derive with the lever ladder below. Single highest-leverage
   change, or the fixed No-edit outcome. Not a list. Never improvise outside the ladder.
4. **The rewrite.** Draft edited with the change marked. **Omit** when the outcome is No edit.
5. **Scope footer** (exactly one line, at the bottom):

`This reads the code they published, not the live knobs they can turn on you tomorrow.`

### Judgment pass (required, between doors and the one edit)

Run the four judgment rules in [references/rules.md](references/rules.md) against the draft
**TEXT**: `J-ENGAGEMENT-BAIT`, `J-REPLY-BAIT`, `J-NEGATIVE-FEEDBACK-RISK`, `J-DUPLICATE-RISK`.
These are the only machinery in the kit that reads the draft. They are part of Job 1's main
path — not an appendix, not optional, and not limited to the internal script section.

Receipt line (always emit, never a findings dump):

- `Judgment: none flagged.`
- `Judgment: {flagged J-rule names}.`

A flagged rule may also feed the chosen lever. Do not add a separate judgment section beyond
that one line. If any J-rule flags, the CLEAR door-6 line still stays CLEAR (text never trips
the kill switch) but **must** carry a pointer to that Judgment line so a six-door skim cannot
read CLEAR as "nothing to fix."

### Door line templates

Use the Grok door labels. Keep citations intact.

Doors 1–5:

- `CLOSED — {label}: {reason} ({file:line})`
- `PENDING — {label}: eligible, pending {signal that unlocks it} ({file:line})`
- `OPEN — {label}: {reason} ({file:line})`

Door 6 (kill switch — never OPEN or CLOSED):

- `CLEAR — The kill switch: no supplied label or URL verdict; VF is idle ({file:line})`
- `CLEAR — The kill switch: no supplied label or URL verdict; VF is idle ({file:line}). See Judgment: {flagged J-rule names} (text only; does not trip this door).` — use this CLEAR form when a J-rule flagged; state remains CLEAR
- `TRIPPED — The kill switch: {known supplied label or verdict} ({file:line})`

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

1. **Reopen a closed door.** Structural, biggest move. Only on conditions already true of this
   draft: make it an original rather than a reply (opens door 3). **Media length/type applies
   only when media is already in the draft and is the wrong length or type** — then take that
   clip clearly past 10 seconds (opens door 5 / `video` 48h–720h index gate; `nsfw_video` is
   only 48h and 168h — `eventProcessing.strato:24, 389-405`;
   `phoenix-rankall/src/config/mod.rs:146-152`). Adding media that is not in the draft is not
   a same-draft edit and must not be proposed as the one edit. Door 5 CLOSED for "no video"
   is not a rung-1 reopen.
2. **Remove kill-switch risk.** Protects door 6, which can silently void every other door.
   Link reputation, pinned-link exposure, anything a J-rule flags as bait that draws Grox
   scrutiny. Traction buys a more expensive inspection: deluxe pass at 64 likes, PTOS at 128
   (`grox/config/config.py:112`, `grox/flows/ptos/constants.py:25`).
3. **Nameable reuse gap — not "make it sharper."** Fires ONLY when the draft states news or a
   fact with no takeaway a third party could reuse: there is no reason for anyone to send it to
   someone else. Then, and only then, rewrite toward a reusable takeaway, weight-framed to
   copy-link (20.0) and follow (4.0) (`param.rs:325-330, 345-350`) with the rare-event caveat
   in the same breath (`param.rs:279-281`). If the draft already has a reusable takeaway, this
   rung does **not** apply. Do not fire it to tighten copy, punch up a hook, or fill the slot.
4. **Avoid a modifier penalty.** Same-refresh stacking, near-duplicate format against your own
   recent posts (`ranking_scorer.rs:614-616`; `dpp_model.rs:147-150`).

**No edit is a first-class outcome.** If nothing in the ladder applies, do not manufacture an
edit. Emit this wording (second sentence lists costs that are **absent**, not actions to take;
do not add a rewrite):

`No edit: this draft is not leaving reach on the table. None of what would have cost you reach is present: a reply or repost (would close stranger doors), a clip already in the draft at or under 10 seconds (would close the long video index), a J-rule bait close, news with no reusable takeaway, or a restriction notice from X.`

One-edit sentence shapes (do not bend rung 1's template onto 3 or 4):

- Rungs 1–2: `The one edit: {change}. Opens / protects {door}.`
- Rung 3: `The one edit: {change}. Raises the odds inside {already-open or pending door}; it does not open a door.`
- Rung 4: `The one edit: {change}. Avoids a modifier penalty inside doors that are already open or pending.`

Rewrite markup: strike the removed phrase with `~~like this~~` and bold the replacement
`**like this**`. Show the full rewritten draft under a `### Rewrite` heading. Omit `### Rewrite`
when the outcome is No edit.

### Worked example (ladder → one edit)

**Draft (before):** a reply under a large account that also ends with "like if you agree and tag
3 friends so this blows up."

**Doors (abbrev.):** door 3 CLOSED (reply; `phoenixRankAllCandidateProcessor.strato:441-446`);
door 2 CLOSED (reply); door 4 PENDING on 8 likes only after an original path exists; door 6
CLEAR (no supplied label) with pointer `See Judgment: J-ENGAGEMENT-BAIT` — bait does not trip
the door.

**Ladder:** rung 1 applies — make it an original. That reopens door 3 (and restores cold-start
eligibility on door 2 if followers ≤ 1000). Rung 2 would also strip the bait, but a reopened
door beats a removed risk.

**The one edit:** Post this as an original on your timeline, not a reply. Opens Strangers' For
You (Phoenix retrieval).

**Rewrite:** drop the reply framing; replace `~~like if you agree and tag 3 friends so this
blows up~~` with a concrete claim someone would **copy-link** to a friend (rung 3 is available
only after rung 1 is done — do not stack a second "one edit").

### Worked example (no edit)

**Draft:** a clean original with a reusable takeaway. No video, not a reply, no bait, no
risky link, no same-refresh stack.

**Ladder:** rungs 1, 2, 4 find nothing. Rung 3 does not fire — the draft is not news-with-no-
takeaway. Stop. Do not staple `param.rs:325-330` onto generic copy advice.

**Judgment:** none flagged.

**No edit:** this draft is not leaving reach on the table. None of what would have cost you
reach is present: a reply or repost (would close stranger doors), a clip already in the draft
at or under 10 seconds (would close the long video index), a J-rule bait close, news with no
reusable takeaway, or a restriction notice from X.

### Door evaluation quick rules

Use [references/doors.md](references/doors.md). Summary:

- **Door 1 Thunder:** OPEN by default; replies/reposts served at 0.75 (`param.rs:246-265`).
- **Door 2 Cold start:** CLOSED unless original + followers<=1000 + views<1000; else
  **PENDING** on top-85% pool position (never silently drop). Bottom 15% ineligible
  (`author_cold_start.rs:86-91, 167-189`).
- **Door 3 Phoenix OON:** CLOSED for reply/repost/community; originals **PENDING** on 1 like
  (1fav `:78-92`) and 32 likes (32fav `:62-76`).
- **Door 4 SimClusters:** **PENDING** on 8 likes for persistent embedding (`Configs.scala:65`).
- **Door 5 Video tail:** CLOSED without video. `video` index: 48/96/168/336/720h when duration
  **>** 10 seconds (`eventProcessing.strato:24, 389-405`; `config/mod.rs:146-150`). `nsfw_video`
  has only 48h and 168h (`config/mod.rs:151-152`). VQV weight credit separately (`param.rs:677-682`).
- **Door 6 VF kill switch:** **CLEAR** unless a *known supplied* label/verdict applies (then
  **TRIPPED**); never infer from text. Never render as OPEN. A J-rule flag may append
  `See Judgment:` on a CLEAR line; that does not trip the door.

Accuracy guards: weight-framed claims only ("the weight on a copy-link share is 40x the weight on a like"); rare-event caveat (`param.rs:279-281`) in the same paragraph as any weight-ratio claim; mutual-follow +15 is a reply-term boost (5→20), not a post-level 4x; diversity is per request/refresh, never per day.

---

## Job 2 — Why did my post die

Same doors model, retrospective.

Input: the post plus whatever the user observed (impressions, who saw it, timing).

### Facts you may need (ask in ONE batch)

Same askable facts as Job 1 — Job 2's symptom table depends on them. Infer what you can
from the post; ask the rest in a single batch, including:

- Is this a reply or a repost? (do not infer from tone)
- About how many seconds was the video, if any? (seconds, not ms; same 10-second boundary
  rule as Job 1)
- Follower count vs 1000, and whether X has sent a warning, restriction, or notice about the
  account or a link (never infer a label or URL verdict from text or a domain)
- What they observed (who saw it, impressions, timing)

Output:

1. Closed / pending / tripped doors ranked by fit with the symptom (followers-only → door 3/4/6; zero
   impressions → door 1 retention / age gate / diversity burst; etc.).
2. Name what cannot be determined from the outside (server-side labels, unpublished `P(action)`,
   experiment arm, per-request top-85% pool position) rather than guessing.
3. Scope footer as in Job 1.

Symptom → door mapping (start here, then cite):

- Almost only followers saw it → door 3 CLOSED (reply/repost/community) or still PENDING on
  first/32nd like; or door 6 TRIPPED (OON drop).
- Never left your own network and you are under 1k → door 2 may have been PENDING on top-85%
  and lost the slot.
- Died after early likes → check door 4's 8-like embedding + 8h half-life; door 6 if a label
  landed after publish.
- Video vanished after ~2 days → door 5 CLOSED (no video / at-or-under 10s for `video`
  48h–720h windows; `nsfw_video` is 48h and 168h only).

---

## Job 3 — Am I shadowbanned

Lead with this, then stop burying it:

`I can't see whether X labeled you. What I can do is name which published kill-switch produces exactly the way your reach died.`

Then a **capped** differential. Rank: (1) follower-vs-stranger split they
described; (2) published duration/expiry vs their timeline; (3) unmentioned required
trigger (pinned URL, NSFW history) ranks lower; (4) contradiction last or out — e.g. FOSNR
(also kills in-network) if followers still see them. Emit:

1. The lead line above (first, always).
2. **Top 3 branches** by that rubric. Each: name, what they would observe if that were the
   cause, cite. Do not claim a diagnosis is confirmed.
3. **The rest, one collapsed line:** `Also on the board, lower fit: {names of remaining branches}.`
4. Scope footer as in Job 1.

Do not walk all six.

Branches (see [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md)):

1. **NSFW 3-of-last-5 rollup** — Observe: strangers vanish ~7 days after an NSFW cluster;
   followers may still see you. 3 of last 5 `NSFW_HIGH_PRECISION` in 60 days → account label
   7 days; `highPageRankOrGreyBadge: false` (`safety-label-user-agg/postToUserLabelRules.strato:396-426`).
2. **Retroactive URL verdict** — Observe: old posts with that URL die together when the verdict
   flips (cap 5,000). UNSAFE applies four OON-drop labels (`rtf_tweets_on_unsafe_verdict.bot:17-27`).
3. **Pinned-post trap** — Observe: account-level stranger drop while the pin stays bad;
   re-triggers on follow. Pin BAD/LOW_QUALITY URL → account `SPAM_HIGH_RECALL` 7 days
   (`PinnedLowQualityOrBadUrl.bot:8-41`; `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`).
   `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo; 7 days is implied by the
   constant name.
4. **Four FOSNR labels that also kill in-network** — Observe: followers and strangers both lose
   the post. `FOSNR_HATEFUL_CONDUCT`, `FOSNR_VIOLENT_SPEECH`, `FOSNR_ABUSE`,
   `FOSNR_CIVIC_INTEGRITY` (insults-level FOSNR is OON-only).
5. **`DoNotAmplifyNonFollowerRule`** — Observe: followers still see you; strangers do not.
   A **rule**, not a safety label. `"DoNotAmplifyNonFollowerRule"`, account label
   `LabelValue::DO_NOT_AMPLIFY`, `require_non_follower = true` (`user_label_drops.rs:113-119`).
   Pair with `ABUSIVE_HIGH_RECALL_USER_DROP` (`:101-106`). Adjacent
   `NSFW_NEAR_PERFECT_USER_DROP` ships `false` (`:107-112`).
6. **Other of the 26 OON-only drops** — Observe: same follower-only pattern without the pinned-URL
   or NSFW-rollup timeline. Full list in the cheat sheet (`registry.rs:141-166`).

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
