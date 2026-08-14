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

Will this post get seen? Paste it and you get five doors that can put this in a feed: your
followers and four stranger paths, plus the kill switch that can void them, closed ones first,
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

## How to ask (every job)

Whenever this skill asks the user anything, use this format. One block per question. Number
them Q1, Q2, Q3 in a single batch. Ask ONLY for facts that change a door (or, in Job 2, the
symptom the table needs). Never a plain bulleted ask-batch.

```
❓ **Q1** - **<short question title>**: <question body; may be multiple sentences and may list
the choices inline>

➡️ <your recommended answer>
```

Rules:

- **Every question carries a `➡️` recommended answer.** A `➡️` line has two legitimate forms,
  and only these two. Pick by whether the draft actually carries a signal. Never fill the slot
  with a plausible-sounding guess.

  1. **Derived:** there IS a signal in the draft. Name the signal.

     `➡️ Reply. The draft opens by agreeing with a specific point ("the part about retrieval
     indexes"), which only makes sense under someone else's post.`

  2. **No signal:** say so plainly, name the default you will take, and say what it costs.

     `➡️ Nothing in the draft tells me either way. I will assume over 1,000 unless you say
     otherwise; that only changes whether the cold-start line reads closed or pending.`

- NEVER invent a reason. If the draft carries no signal, form 2 is mandatory.
- Form 2 must name the consequence of the assumption so a user knows whether to bother
  correcting it. That is what keeps it low friction.
- Do not pad form 2 into sounding like form 1. "Reads like a smaller account" from a draft
  with no follower signal is exactly the banned move.
- Directly after the last question, one line offering that answering "yes" / "go" takes all
  recommendations. Make proceeding the low-friction path.
- Do not ask if a door does not depend on the answer.

---

## Job 1: Make this post get seen (PRIMARY)

Happy path: the user pastes a draft. **No CLI flags.** Do not teach `scripts/` as the interface.

### Facts you may need (ask in ONE batch, only when a door depends on them)

Infer what you can from the draft (link presence, obvious reply markers if the UI paste includes
them). Ask only for uninferable facts that change a door, in a single batch, using **How to ask**.
The facts that can change a door:

- Is this a reply or a repost? (doors 2, 3, 4 eligibility; door 1 haircut)
- About how many seconds is the video, if media is video? (door 5 index gate / VQV). Ask in
  seconds, never in milliseconds. Convert internally (`seconds * 1000`). The published gate is
  strict `>` 10,000 ms (`eventProcessing.strato:24, 389-405`). If they say "about 10 seconds" or
  anything in 9–11s without a clear over/under, do not guess: ask once whether it is clearly
  longer than 10 seconds, or at/under. Exactly 10 seconds is still out. Until that is answered,
  render door 5 **PENDING** on duration.
- Does the account have <= 1000 followers? (door 2)
- Has X sent a warning, restriction, or notice about this account or a link in the draft?
  (door 6) only if they actually report one. Never infer a label or URL verdict from the
  post text or a domain.

If a door does not depend on the answer, do not ask.

### Output order (fixed)

Print in this order and nothing else above the doors. Do not narrate the derivation. Do not
explain which rungs were considered. Do not preface the doors with analysis. The lever ladder
runs silently; only its result is printed. The judgment receipt is one line and never expands
into findings.

1. **The doors.** All six, each as a two-line aligned block (state + label on line 1; reason
   on line 2; citation on its own indented line). Doors 1–5 use **OPEN / CLOSED / PENDING**.
   Door 6 (kill switch) uses **CLEAR / TRIPPED**, never OPEN; it is not a door anyone opens.
   Closed and tripped first, then pending, then open, then clear. A PENDING line MUST name the
   post-publish signal that unlocks it (see [references/doors.md](references/doors.md) § Door states).
2. **Judgment.** Exactly one line: the receipt that the required pass ran. Never omit it.
   Never expand it into findings.
3. **The one edit** or **No edit.** Derive with the lever ladder below. Single highest-leverage
   change, or the fixed No-edit outcome. Not a list. Never improvise outside the ladder.
   Print only the result sentence. Do not print which rungs fired or did not.
4. **The rewrite.** Paste-ready draft plus one line naming what changed. **Omit** when the
   outcome is No edit.
5. **Scope footer** (exactly one line, at the bottom):

`This reads the code they published, not the live knobs they can turn on you tomorrow.`

Forbidden above the doors (or anywhere as a preface): reasoning about which J-rule was a
candidate, why a flag did not fire, or which ladder rung applies. That work stays internal.

### Judgment pass (required, between doors and the one edit)

Run the four judgment rules in [references/rules.md](references/rules.md) against the draft
**TEXT**: `J-ENGAGEMENT-BAIT`, `J-REPLY-BAIT`, `J-NEGATIVE-FEEDBACK-RISK`, `J-DUPLICATE-RISK`.
These are the only machinery in the kit that reads the draft. They are part of Job 1's main
path, not an appendix, not optional, and not limited to the internal script section.

Receipt line (always emit, never a findings dump). Keep it to one line in every case:

- Clear-cut: `Judgment: J-ENGAGEMENT-BAIT.`
- Arguable: `Judgment: J-REPLY-BAIT, borderline.`
- Nothing: `Judgment: none flagged.`

Test: if the draft contains an explicit ask for engagement, it is clear-cut. If the call
rests on tone, substance, or how repetitive the reply reads, it is borderline. Do not expand
the receipt beyond one line in either case. If several rules flag, stay on one line; append
`, borderline.` only to the names whose call is arguable.

A flagged rule may also feed the chosen lever. Do not add a separate judgment section beyond
that one line. If any J-rule flags, the CLEAR door-6 line still stays CLEAR (text never trips
the kill switch) but **must** append ` See the flag below.` so a six-door skim cannot
read CLEAR as "nothing to fix." Do not restate the J-rule name on that door line.

### Door line templates

Use the Grok door labels. Keep citations intact. Match the kit cheat sheet: monospace-aligned,
zero colour, structure carries the emphasis. Never use an em dash (`—`) in user-facing output.

Each door is a block. Pad the state token to width 7 (PENDING and TRIPPED are the longest),
then two spaces, then the label. Continuation lines indent 9 spaces so they sit under the label.

Reason lines are plain sentences that state the consequence. Citations carry the precision.
Do not put engineering nouns in a reason line (no OON, VF, in-network, pre-scoring, persistent
embedding, supplied label, URL verdict, index write, candidate pool, bare "retrieval", or a
bare decimal). Wrap any reason that would run long enough to break the left column. Prefer two
short lines over one long one. Print the sentences below, not the evaluation jargon.

Doors 1–5 (use the matching case; keep the citation on its own indented line):

```
OPEN     Your followers (Thunder)
         Goes to your followers at full weight.
         (param.rs:246-265)

OPEN     Your followers (Thunder)
         Goes to your followers, but at three quarters the weight
         because it is a reply.
         (param.rs:246-265)
```

Adapt the reply line for a repost: `because it is a repost.`

```
CLOSED   A bump while you're small (cold start)
         Replies do not qualify. This one is for original posts only.
         (author_cold_start.rs:86-91)

CLOSED   A bump while you're small (cold start)
         Only for accounts under 1,000 followers.
         (author_cold_start.rs:86-91)

PENDING  A bump while you're small (cold start)
         You qualify. Whether it actually fires depends on where this
         lands in someone's scroll, which nobody can see before you post.
         (author_cold_start.rs:86-91, 167-189)

CLOSED   Strangers' For You (Phoenix retrieval)
         Replies never get filed where strangers can find them.
         Not a slower path, no path.
         (phoenixRankAllCandidateProcessor.strato:441-446)
```

Adapt the first sentence for a repost or a community post (`Reposts never get filed...` /
`Community posts never get filed...`).

```
PENDING  Strangers' For You (Phoenix retrieval)
         Open to you, but nothing reaches strangers until someone likes it.
         That first like is what files it.
         (phoenixRankAllCandidateProcessor.strato:78-92, 62-76)

PENDING  People already into this (SimClusters)
         Needs 8 likes before X builds a lasting picture of who this
         post is for.
         (Configs.scala:65)

CLOSED   Still findable next month (video long tail)
         No video, so there is nothing to keep.
         Text drops out of circulation in a day or two.
         (eventProcessing.strato:24, 389-405)

CLOSED   Still findable next month (video long tail)
         Clips of 10 seconds or less do not get kept.
         Yours needs to be clearly longer.
         (eventProcessing.strato:24, 389-405)

OPEN     Still findable next month (video long tail)
         Video over 10 seconds stays findable for up to 30 days.
         (eventProcessing.strato:24, 389-405)
```

Door 6 (kill switch; never OPEN or CLOSED):

```
CLEAR    The kill switch
         Nothing you told me trips it. I cannot check this one myself:
         X keeps these flags on their side, so it only shows up here
         if you already got a warning.
         (registry.rs:101-170)

TRIPPED  The kill switch
         You said X sent {the warning/restriction}.
         That hides this from everyone who does not already follow you.
         (registry.rs:101-170)
```

When a J-rule flagged, keep state CLEAR. Same CLEAR sentences, then ` See the flag below.`
Do not restate the rule name inline. Keep it short enough not to break the aligned column:

```
CLEAR    The kill switch
         Nothing you told me trips it. I cannot check this one myself:
         X keeps these flags on their side, so it only shows up here
         if you already got a warning. See the flag below.
         (registry.rs:101-170)
```

Door labels: Your followers (Thunder) · A bump while you're small (cold start) · Strangers'
For You (Phoenix retrieval) · People already into this (SimClusters) · Still findable next
month (video long tail) · The kill switch (visibility filtering).

Door 2: if draft-time gates pass, render **PENDING** (scroll position; nobody can see it
before you post), never OPEN by dropping that gate. Door 3 originals: **PENDING** on the
first like (citation also covers the later 32-like path). Door 4: **PENDING** on 8 likes,
always. SimClusters has no draft-time lockout; a reply still prints PENDING on 8 likes.
Do not wait for an original path.

### The one edit: lever ladder

Doors are gated on follower count, like count, and media type. None of those move by rewording,
so the doors readout alone cannot produce an edit. After the doors and the judgment pass, pick
**the highest-ranked lever that actually applies**. Tiebreak order is the list order. Run this
silently. Print only the one-edit sentence or the No-edit outcome, never the walk through the
rungs.

1. **Reopen a closed door.** Structural, biggest move. Only on conditions already true of this
   draft: make it an original rather than a reply (opens door 3). **Before converting a
   reply, test whether the draft is self-contained:** would it still make sense with no
   parent post? It is **not** self-contained if it opens by agreeing or reacting ("Great
   breakdown", "This", "So true"), refers to "the part / this point / that section", uses a
   pronoun whose referent is in the parent, or is a fragment that only reads as a response.

   - **Self-contained reply** (the point stands alone): convert to an original and rewrite
     accordingly, same as today.
   - **Context-dependent reply** (the draft leans on the parent): rung 1 still applies,
     because the stranger door is the biggest lever. Do not ship the reply text relabelled
     as an original. The edit must say that posting it verbatim will not work, and that the
     standalone version has to carry the point on its own. The rewrite must then be an
     actual standalone post making the same point. If the point is too thin to stand alone,
     say that plainly instead of shipping an orphan: this one stays a reply and does not
     reach strangers. That is still `The one edit:`, not the No-edit outcome (No-edit is
     only for drafts that are not leaving reach on the table). Omit the rewrite when the
     point is too thin.

   **Media length/type applies only when media is already in the draft and is the wrong
   length or type**, then take that clip clearly past 10 seconds (opens door 5 / `video`
   48h–720h index gate; `nsfw_video` is only 48h and 168h,
   `eventProcessing.strato:24, 389-405`; `phoenix-rankall/src/config/mod.rs:146-152`).
   Adding media that is not in the draft is not a same-draft edit and must not be proposed
   as the one edit. Door 5 CLOSED for "no video" is not a rung-1 reopen.
2. **Remove kill-switch risk.** Protects door 6, which can silently void every other door.
   Link reputation, pinned-link exposure, anything a J-rule flags as bait that draws Grox
   scrutiny. Traction buys a more expensive inspection: deluxe pass at 64 likes, PTOS at 128
   (`grox/config/config.py:112`, `grox/flows/ptos/constants.py:25`).
3. **Nameable reuse gap, not "make it sharper."** Fires ONLY when the draft states news or a
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

`No edit: this draft is not leaving reach on the table. None of what would have cost you reach is present: a reply or repost (would hide this from strangers), a clip already in the draft at or under 10 seconds (would not stay findable), bait that asks people to like or tag, news with no reusable takeaway, or a restriction notice from X.`

One-edit sentence shapes (do not bend rung 1's template onto 3 or 4):

- Rung 1 self-contained reply, and rung 2: `The one edit: {change}. Opens / protects {door}.`
- Rung 1 context-dependent reply: `The one edit: {change}. Opens {door}; posting the reply as-is will not.`
- Rung 1 context-dependent, point too thin: `The one edit: Leave this a reply. The point does not stand on its own, so it will not reach strangers.`
- Rung 3: `The one edit: {change}. Raises the odds inside {already-open or pending door}; it does not open a door.`
- Rung 4: `The one edit: {change}. Avoids a modifier penalty inside doors that are already open or pending.`

Rewrite: no strikethrough, no bold markers. Those render as literal `~~` and `**` in a
terminal. Use a one-line `Rewrite:` naming what changed, then the full paste-ready draft.
Omit the rewrite block when the outcome is No edit, or when rung 1's honest outcome is
leave-this-a-reply (point too thin). For a context-dependent reply that can stand alone,
the paste-ready draft must carry the point with no parent post. Relabelling the reply is
not a rewrite.

```
Rewrite: {what changed}

{full rewritten draft}
```

### Worked example (ladder → one edit)

**Draft (before):** a reply under a large account that also ends with "like if you agree and tag
3 friends so this blows up."

Internal only (do not print): door 3 CLOSED (reply; `phoenixRankAllCandidateProcessor.strato:441-446`);
door 2 CLOSED (reply); door 4 PENDING on 8 likes always (no draft-time lockout, including
for replies); door 6
CLEAR (no warning supplied) with pointer `See the flag below.` (bait does not trip
the door). Rung 1 applies: make it an original. That reopens door 3 (and restores cold-start
eligibility on door 2 if followers ≤ 1000). Rung 2 would also strip the bait, but a reopened
door beats a removed risk. Do not print this paragraph.

Print this (doors first, no preface):

```
CLOSED   Strangers' For You (Phoenix retrieval)
         Replies never get filed where strangers can find them.
         Not a slower path, no path.
         (phoenixRankAllCandidateProcessor.strato:441-446)

CLOSED   A bump while you're small (cold start)
         Replies do not qualify. This one is for original posts only.
         (author_cold_start.rs:86-91)

CLOSED   Still findable next month (video long tail)
         No video, so there is nothing to keep.
         Text drops out of circulation in a day or two.
         (eventProcessing.strato:24, 389-405)

PENDING  People already into this (SimClusters)
         Needs 8 likes before X builds a lasting picture of who this
         post is for.
         (Configs.scala:65)

OPEN     Your followers (Thunder)
         Goes to your followers, but at three quarters the weight
         because it is a reply.
         (param.rs:246-265)

CLEAR    The kill switch
         Nothing you told me trips it. I cannot check this one myself:
         X keeps these flags on their side, so it only shows up here
         if you already got a warning. See the flag below.
         (registry.rs:101-170)

Judgment: J-ENGAGEMENT-BAIT.

The one edit: Post this as an original on your timeline, not a reply. Opens Strangers' For You (Phoenix retrieval).

Rewrite: posted as an original; dropped the tag-and-like closer.

{the rewritten original, paste-ready}

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

Do not stack a second "one edit." After rung 1, the bait closer is gone because the rewrite
is the original-post form of this draft, not a second lever.

### Worked example (context-dependent reply)

**Draft:** `Great breakdown. The part about retrieval indexes is what most people miss.`
Confirmed as a reply.

Internal only (do not print): not self-contained (opens by agreeing; "the part" refers to
the parent). Rung 1 still applies. Do not emit `Post this as an original, not a reply.`
with the reply text relabelled. Do not print this paragraph.

Print this (doors first, no preface; doors match any bait-free reply):

```
CLOSED   Strangers' For You (Phoenix retrieval)
         Replies never get filed where strangers can find them.
         Not a slower path, no path.
         (phoenixRankAllCandidateProcessor.strato:441-446)

CLOSED   A bump while you're small (cold start)
         Replies do not qualify. This one is for original posts only.
         (author_cold_start.rs:86-91)

CLOSED   Still findable next month (video long tail)
         No video, so there is nothing to keep.
         Text drops out of circulation in a day or two.
         (eventProcessing.strato:24, 389-405)

PENDING  People already into this (SimClusters)
         Needs 8 likes before X builds a lasting picture of who this
         post is for.
         (Configs.scala:65)

OPEN     Your followers (Thunder)
         Goes to your followers, but at three quarters the weight
         because it is a reply.
         (param.rs:246-265)

CLEAR    The kill switch
         Nothing you told me trips it. I cannot check this one myself:
         X keeps these flags on their side, so it only shows up here
         if you already got a warning.
         (registry.rs:101-170)

Judgment: none flagged.

The one edit: Post this as an original that states the point on its own. Opens Strangers' For You (Phoenix retrieval); posting the reply as-is will not.

Rewrite: posted as an original; the point now stands without the parent post.

Retrieval indexes are how a post gets filed so people who never followed you can still find it. Most write the breakdown and stop there. The index is what actually decides whether strangers ever see the work.

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

A rewrite that still says "the part" of a post that no longer exists is the defect this
example forbids.

### Worked example (no edit)

**Draft:** a clean original with a reusable takeaway. No video, not a reply, no bait, no
risky link, no same-refresh stack.

Internal only (do not print): rungs 1, 2, 4 find nothing. Rung 3 does not fire: the draft is
not news-with-no-takeaway. Stop. Do not staple `param.rs:325-330` onto generic copy advice.

Print this:

```
CLOSED   Still findable next month (video long tail)
         No video, so there is nothing to keep.
         Text drops out of circulation in a day or two.
         (eventProcessing.strato:24, 389-405)

PENDING  Strangers' For You (Phoenix retrieval)
         Open to you, but nothing reaches strangers until someone likes it.
         That first like is what files it.
         (phoenixRankAllCandidateProcessor.strato:78-92, 62-76)

PENDING  People already into this (SimClusters)
         Needs 8 likes before X builds a lasting picture of who this
         post is for.
         (Configs.scala:65)

PENDING  A bump while you're small (cold start)
         You qualify. Whether it actually fires depends on where this
         lands in someone's scroll, which nobody can see before you post.
         (author_cold_start.rs:86-91, 167-189)

OPEN     Your followers (Thunder)
         Goes to your followers at full weight.
         (param.rs:246-265)

CLEAR    The kill switch
         Nothing you told me trips it. I cannot check this one myself:
         X keeps these flags on their side, so it only shows up here
         if you already got a warning.
         (registry.rs:101-170)

Judgment: none flagged.

No edit: this draft is not leaving reach on the table. None of what would have cost you reach is present: a reply or repost (would hide this from strangers), a clip already in the draft at or under 10 seconds (would not stay findable), bait that asks people to like or tag, news with no reusable takeaway, or a restriction notice from X.

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

Door 2 in that print assumes followers <= 1000 were confirmed. If followers are over 1000,
door 2 is CLOSED on the follower cap instead, and still no manufactured edit.

### Door evaluation quick rules

Use [references/doors.md](references/doors.md). Summary:

- **Door 1 Thunder:** OPEN by default; replies/reposts served at 0.75 (`param.rs:246-265`).
- **Door 2 Cold start:** CLOSED unless original + followers<=1000 + views<1000; else
  **PENDING** on top-85% pool position (never silently drop). Bottom 15% ineligible
  (`author_cold_start.rs:86-91, 167-189`).
- **Door 3 Phoenix OON:** CLOSED for reply/repost/community; originals **PENDING** on 1 like
  (1fav `:78-92`) and 32 likes (32fav `:62-76`).
- **Door 4 SimClusters:** **PENDING** on 8 likes for a persistent embedding (`Configs.scala:65`).
- **Door 5 Video tail:** CLOSED without video. `video` index: 48/96/168/336/720h when duration
  **>** 10 seconds (`eventProcessing.strato:24, 389-405`; `config/mod.rs:146-150`). `nsfw_video`
  has only 48h and 168h (`config/mod.rs:151-152`). VQV weight credit separately (`param.rs:677-682`).
- **Door 6 VF kill switch:** **CLEAR** unless a *known supplied* label/verdict applies (then
  **TRIPPED**); never infer from text. Never render as OPEN. A J-rule flag may append
  `See the flag below.` on a CLEAR line; that does not trip the door.

Accuracy guards: weight-framed claims only ("the weight on a copy-link share is 40x the weight on a like"); rare-event caveat (`param.rs:279-281`) in the same paragraph as any weight-ratio claim; mutual-follow +15 is a reply-term boost (5→20), not a post-level 4x; diversity is per request/refresh, never per day.

---

## Job 2: Why did my post die

Same doors model, retrospective.

Input: the post plus whatever the user observed (impressions, who saw it, timing).

### Facts you may need (ask in ONE batch)

Same askable facts as Job 1. Job 2's symptom table depends on them. Infer what you can
from the post; ask the rest in a single batch using **How to ask**, including:

- Is this a reply or a repost? (do not infer from tone)
- About how many seconds was the video, if any? (seconds, not ms; same 10-second boundary
  rule as Job 1)
- Follower count vs 1000, and whether X has sent a warning, restriction, or notice about the
  account or a link (never infer a label or URL verdict from text or a domain)
- What they observed (who saw it, impressions, timing)

Output (no analysis preface; doors first, same two-line aligned blocks as Job 1, same
plain reason lines):

1. Closed / pending / tripped doors ranked by fit with the symptom (only followers saw it →
   doors 3/4/6; nobody saw it → door 1 age/retention; etc.).
2. Name what cannot be determined from the outside rather than guessing: whether X flagged
   you, which test group you were in, and where this sat in someone's scroll.
3. Scope footer as in Job 1.

Symptom → door mapping (start here, then cite; explain in the same plain register as Job 1):

- Almost only followers saw it → door 3 CLOSED (reply/repost/community) or still PENDING on
  the first like; or door 6 TRIPPED (hidden from everyone who does not already follow you).
- Never left people who already follow you, and you are under 1k → door 2 may have been
  PENDING on scroll position and lost the slot.
- Died after early likes → check door 4's 8-like lasting picture + 8h half-life; door 6 if a
  warning landed after publish.
- Video vanished after ~2 days → door 5 CLOSED (no video, or a clip at or under 10 seconds).

---

## Job 3: Am I shadowbanned

Lead with this, then stop burying it:

`I can't see whether X labeled you. What I can do is name which published kill-switch produces exactly the way your reach died.`

If a fact the differential needs is missing, ask it with **How to ask** (same Q-blocks, a
recommended answer, then the yes/go line). Do not invent a label.

Then a **capped** differential. Rank: (1) follower-vs-stranger split they
described; (2) published duration/expiry vs their timeline; (3) unmentioned required
trigger (pinned URL, NSFW history) ranks lower; (4) contradiction last or out, e.g. the
four flags that also hide you from followers, if followers still see them. Emit:

1. The lead line above (first, always).
2. **Top 3 branches** by that rubric. Each: name, what they would observe if that were the
   cause, cite. Do not claim a diagnosis is confirmed. No em dashes.
3. **The rest, one collapsed line:** `Also on the board, lower fit: {names of remaining branches}.`
4. Scope footer as in Job 1.

Do not walk all six.

Branches (see [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md)).
Print the name and Observe in plain language; keep the citation. Do not dump engineering nouns
into the Observe line.

1. **NSFW cluster (3 of last 5).** Observe: strangers vanish about 7 days after a cluster of
   NSFW posts; people who follow you may still see you.
   (`safety-label-user-agg/postToUserLabelRules.strato:396-426`)
2. **A link X later marked unsafe.** Observe: old posts with that URL die together when X
   flips the call (cap 5,000). That hides them from strangers
   (`rtf_tweets_on_unsafe_verdict.bot:17-27`).
3. **Pinned-post trap.** Observe: strangers stop seeing you while the pin stays bad; it can
   fire again when someone follows you. Pin a BAD or LOW_QUALITY URL and the account can be
   treated as spam for 7 days
   (`PinnedLowQualityOrBadUrl.bot:8-41`; `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`).
   `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo; 7 days is implied by the
   constant name.
4. **Four flags that also hide you from followers.** Observe: followers and strangers both lose
   the post. Published names: `FOSNR_HATEFUL_CONDUCT`, `FOSNR_VIOLENT_SPEECH`, `FOSNR_ABUSE`,
   `FOSNR_CIVIC_INTEGRITY`. Insults-level versions of these hide you from strangers only.
5. **Do not amplify to non-followers.** Observe: people who follow you still see you; strangers
   do not. A **rule**, not a safety label (`user_label_drops.rs:113-119`). Pair with
   `ABUSIVE_HIGH_RECALL_USER_DROP` (`:101-106`). Adjacent `NSFW_NEAR_PERFECT_USER_DROP` ships
   `false` (`:107-112`).
6. **Other of the 26 stranger-only hides.** Observe: same "only followers see you" pattern
   without the pinned-URL or NSFW-cluster timeline. Full list in the cheat sheet
   (`registry.rs:141-166`).

---

## Job 4: Audit recent posts (thin)

Paste up to 10 recent posts. Pattern read only. No per-post scoring.

If the posts are missing, or a door-changing fact is missing, ask with **How to ask**.

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
in [references/rules.md](references/rules.md). Do not treat that file as skippable metadata.
