---
name: x-reach
description: Check whether a post will get seen, and what would make it get seen more. Use for a handle reach scan, a pasted draft, why a post died, and shadowban differential diagnosis against published x-algorithm defaults.
---

# X Reach Check

Eligibility, not prediction. Evaluate the three layers in
[references/how-reach-works.md](references/how-reach-works.md).
Never emit a score, verdict band, or reach prediction. Never infer a safety
label or URL verdict from post text or a domain name.

Source commit: `xai-org/x-algorithm@a389166`. Every numeric claim needs a
`file:line` that traces to
[references/verified-findings.md](references/verified-findings.md).

Will this post get seen, and what would make it get seen more. That is
the product. Follower vs non-follower is a mechanism, not the promise.
Thunder showing a post to followers at publish is the floor.

Paste a handle. That is Last 20. Two pulls: profile and
with_replies. Last 20 versus the published rulebook. A pasted draft
runs Rewrite. A pasted Under the Hood readout runs Under the Hood.

## Product selection

Pick the product from the user request. Default is Last 20.

| Input | Product |
|---|---|
| A handle, `@handle`, or `/x-reach` with nothing pasted | Last 20 |
| Pasted last-N posts and no draft | Last 20 |
| Pasted draft / "will this get seen" / "help this get seen more" / "rewrite this" | Rewrite |
| Pasted Under the Hood readout, or "translate this" plus that page | Under the Hood |
| "Why did this die" + a post + symptoms | Why this died |
| "Am I shadowbanned" | Shadowban check |

---

## How to ask (every job)

Whenever this skill asks the user anything, use this format. One block per
question. Number them Q1, Q2, Q3 in a single batch. Never a plain bulleted
ask. Directly after the last question, one line offering that answering
"yes" or "go" takes all recommendations.

```
❓ **Q1** - **<short title>**: <body; may be several sentences and may list choices inline>

➡️ <recommended answer>
```

Every question carries a `➡️` line with exactly two legitimate forms:

1. **Derived.** There is a signal in the draft. Name the signal.

   `➡️ Reply. The draft opens by agreeing with a specific point ("the part about retrieval indexes"), which only makes sense under someone else's post.`

2. **No signal.** Say so plainly, name the default you take, and say what
   that default costs.

   `➡️ Nothing in the draft tells me either way. I will assume over 1,000 followers unless you say otherwise; that only changes whether the small-account file and the cold-start lift show up.`

Never invent a rationale. Form 2 is mandatory when there is no signal. Never
pad form 2 into sounding like form 1. "Reads like a smaller account" from a
draft with no follower signal is the banned move.

Never infer: a safety label or URL verdict from text, a domain, a topic, or
a tone; NSFW status from subject matter; community status from formatting;
follower count from writing style or a claim inside the draft; reply status
from tone alone. Only from an explicit marker in the pasted text, and the
`➡️` line names that marker.

---

## Rewrite

Happy path: the user pastes a draft. **No CLI flags.** Do not teach
`scripts/` as the interface. Last 20 is the handle scan. Rewrite is the
draft path.

Sequence, silent until the printed output: parse the draft for signals; ask
the batch below; run the judgment pass and the lever ladder; print the
rewrite-first surface below. Do not print the file table. Nothing is
printed above `REWRITE`. No narration. No "let me check."

### Rewrite output (fixed)

Monospace-aligned plain text. No colour. No `**`. No fences in the body.
No em dashes. Citations stay out of the body.

```
REWRITE

CLOSED    this is a reply
          It can circulate for a moment.
          It has no published path to pick up new distribution.

THE ONE CHANGE
Post this as an original on your timeline, not a reply. Drop the
tag-and-like closer.

SEND
X retrieval only searches the one-like file for 48 hours.

FOLLOW
X retrieval only searches the one-like file for 48 hours. Follow if you
want the next one.

WHY
A reply, repost, or community post never enters the searched file.
Bait closers draw the inspection you do not want.
Copy-link is priced 40x a like. Bookmarks are not a ranking term.
The first like is the published ticket. The feed still drops it at 48
hours.

HOW THIS WORKS
An original gets into wider distribution after one like. That is the
file For You is published to search. The feed drops it at 48 hours,
even if it was working. Eight likes builds a lasting picture of who
it is for.
Replies, reposts, and thread parts never enter that file. Followers
can see them for a moment. They cannot grow.
Copy-link is priced 40x a like. Bookmarks and profile taps are not
how it picks winners.
Ask about any line.

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

Status token is `CLOSED` or `OPEN`. `OPEN` is an original or quote.
`CLOSED` is a reply, repost, community post, NSFW mark, or visibility
drop.

`THE ONE CHANGE` names the lever. `NO CHANGE` is first-class when the
draft is already an original that is not leaving reach on the table.

Then paste-ready variants. Omit empty ones.

- `SEND` is the draft shaped so someone would copy the link. Named
  system. No bait closer.
- `FOLLOW` asks for a follow, never a profile tap. Profile tap is 0.
  Follow is 4.0.
- `REPLY` only when a real question is already in the draft, or the
  draft is a named list someone could answer. Never bait. Omit it on a
  thin reply and omit it when the only honest question would be
  "what do you think."

A thin reply that cannot stand alone prints `THE ONE CHANGE` / leave
this a reply, and prints no variants.

The file table (where it can show up, what files it) is the model. Print
it only when they ask where this can show up. It is not Rewrite.

### Facts you may need (one batch, at most five)

### Facts you may need (one batch, at most five)

Priority when trimming: QT, QN, QC, QD plus QM as one block, QF. QW is a
sixth only when nothing else needed asking. QK and QS are Job 2 and Job 4
questions, or Job 1 only on an actual signal / explicit request about reach
beyond For You.

| ID | Question | Default if unanswered | Cost of the default |
|---|---|---|---|
| QT | Original, reply, repost, or quote | infer from the draft; if no signal, mandatory to ask | Wrong on this and the whole output is wrong |
| QC | Posted into an X Community | not a community post | Understates a total lockout. Ask whenever the draft is an original or quote |
| QF | Under 1,000, exactly 1,000, or over | over 1,000 | Two rows drop out. Form-2 default is fine |
| QV | Views, only for an already-published post | 0 for an unpublished draft | Job 1 drafts have zero views by construction |
| QD | Video duration in seconds, only when the draft has video | do not default; render video rows PENDING on duration until answered | Ask in seconds. If the answer is 9 to 11 without a clear over or under, ask once whether it is clearly longer than 10. Exactly 10 is out |
| QM | Other media alongside the video | assume video only | Overstates video eligibility. Ask whenever QD is asked |
| QN | Has this post been marked NSFW, by you or by X | not annotated | Massive understatement of a lockout the tool cannot see. Ask on every Rewrite run |
| QW | A warning, restriction, or notice from X about this account or a link in the draft | UNKNOWN | Never infer from text or a domain. Ask only, never guess |

QN is NSFW only. It does not say "adult." If a user volunteers "it is marked
adult but not NSFW," say the published code's index check reads the NSFW
flag only, treat the post as not annotated for Layer B, and add one sentence
that a separate adult flag exists in the same metadata but is not what this
check reads (`eventProcessing.strato:308-326`, bound at `strato:438`).

Convert seconds to ms internally (`seconds * 1000`). The index gate is
strict `>` 10,000 ms (`eventProcessing.strato:24, 389-404`).

### Model reference, only when they ask where it can show up

Default Rewrite output is the rewrite-first surface above. If they ask
where it can show up, print this order instead:

1. `WHERE IT CAN SHOW UP` (Layer A). Blocks in order: CLOSED, then UNPROVEN,
   then PENDING, then OPEN.
2. `X's safety flags`. One block. `UNKNOWN` or `TRIPPED`. Never `CLEAR`.
3. `WHAT FILES IT, AND FOR HOW LONG` (Layer B).
4. `ONCE IT IS IN THE RUNNING` (Layer C). Printed only when at least one
   modifier fires. Omitted entirely otherwise. Never printed as a list of
   modifiers that did not fire.
5. Judgment. Exactly one receipt line. Never expands into findings.
6. The one edit, or No edit.
7. Scope footer, exactly one line:

`This reads the code they published, not the live knobs they can turn on you tomorrow.`

The first time a stranger path (Phoenix retrieval, SimClusters, or tail)
resolves to OPEN, PENDING, or UNPROVEN, print this line once, after that
block:

`Whether any one person sees this comes down to what they have been liking and replying to lately, which is on their side and nobody can read it from here.`

### Formatting (non-negotiable)

- Monospace-aligned plain text. No colour. Structure carries the emphasis.
- No markdown that renders as literal characters in a terminal: no `**`, no
  `~~`, no backtick fences inside the output body.
- No em dashes anywhere in user-facing output.
- State token padded to width 8, then two spaces, then the label.
  Continuation lines indent 10 spaces. Citation on its own indented line in
  parentheses.
- Reason lines are plain sentences stating the consequence. Engineering
  nouns stay out of reason lines: no OON, VF, in-network, pre-scoring,
  persistent embedding, candidate pool, index write, bare "retrieval",
  bare decimals. Citations carry the precision.
- Prefer two short reason lines over one long one.

### State tokens

| Layer | Tokens |
|---|---|
| A paths | `OPEN` / `CLOSED` / `PENDING` / `UNPROVEN` |
| Safety flags | `UNKNOWN` / `TRIPPED` |
| B index rows | `ON 1 LIKE` / `ON 32 LIKES` / `WRITTEN` / `UNPROVEN` / `BLOCKED` / `n/a` |
| C modifiers | no token. One sentence each, printed only when fired |

`UNPROVEN`: the machinery that would do this is in the published code, and
the configuration that would switch it on for this feed is not published.
It is not a hedge and it is not a synonym for PENDING. PENDING means a
named thing the creator or a viewer can do will change the state. UNPROVEN
means no action changes it because the missing piece is a deploy flag
nobody outside X can see. An UNPROVEN line must name the missing config.

`PENDING` carries an internal subtype that never prints as a token:

- `PENDING(signal)`: unlocked by a post-publish signal the creator can
  influence. The first reason sentence must name the signal and the number.
- `PENDING(runtime)`: unlocked by a condition nobody can see. The first
  reason sentence must say plainly that nobody can see it.

One line, one subtype. When a path has both a creator-side signal and a
runtime unknown, the row's subtype is `PENDING(signal)`, the signal
sentence comes first, and the runtime unknown is a second sentence in the
same block introduced as a condition on top of it.

### Locked path labels

- `People who follow you (Thunder)`
- `Strangers' For You (Phoenix retrieval)`
- `People who liked things like this (SimClusters)`
- `Small-account shelf (tail)`
- `Topic feeds (Phoenix topics)` (Job 2 and Job 4 only, or on request)

Topic feeds are not printed on a Job 1 run unless the user asked about
reach beyond For You.

### Layer A block templates

```
OPEN      People who follow you (Thunder)
          Goes to people who follow you.
          (thunder_source.rs:25-27, 30)

OPEN      People who follow you (Thunder)
          Goes to people who follow you, but at three quarters the weight
          because it is a reply.
          (param.rs:246-251; ranking_scorer.rs:747-754)

PENDING   Strangers' For You (Phoenix retrieval)
          The first like is the published ticket into wider distribution.
          Followers can see it as soon as you post. That is the floor.
          X writes a file when you publish. They never published that anyone
          looks there.
          (retrieval_dataset.py:229-235; model_runner.py:543;
           launch_inference.py:496-501; strato:266-273, 469)

CLOSED    Strangers' For You (Phoenix retrieval)
          This can circulate for a moment. It has no published path to pick
          up new distribution.
          Replies are never written to any of these files at all.
          Not a slower path, no path.
          (phoenixRankAllCandidateProcessor.strato:437, 443-444)

UNPROVEN  Small-account shelf (tail)
          Under 1,000 followers, X writes your post to a small-account file
          about three minutes after you post, with no likes needed. There is
          a matching file this service knows how to load. Whether the For You
          feed asks for it is a setting they did not publish.
          (sid_tail_processor.rs:71-80; config/mod.rs:187;
           retrieval_dataset.py:276-280; launch_inference.py:496-501)

PENDING   People who liked things like this (SimClusters)
          Needs 8 likes before X builds a lasting picture of who this post
          is for. On top of that it only runs for viewers who already like
          and reply to things, or who dwell and click on them, and nobody
          can see that from here.
          (Configs.scala:65; simclusters_source.rs:88-93, 139-147)

CLOSED    People who liked things like this (SimClusters)
          Replies are thrown out before scoring on this path, so it never
          reaches anyone who does not already follow you.
          (oon_retweet_reply_filter.rs:13-18)
```

Adapt the reply sentence for a repost (`Reposts are never written...`) and
for a community post (`Community posts are never written...`). A quote post
is not a repost for this purpose.

For a community post, Thunder prints no state. Say the kit models the For
You path and the topics surface, not community timelines. There is no
community-membership check in this repo (`thunder_source.rs:25-27, 30`).

Headline sentence for an original with no likes:

`The first like is the published ticket into wider distribution. Followers can see it as soon as you post. That is the floor.`

That is the first Phoenix retrieval reason. The next sentences name the
publish-time file and say they never published that anyone looks there.

CLOSED reply, repost, or community, first line:

`This can circulate for a moment. It has no published path to pick up new distribution.`

Then the exclusion fact and the citation.

### Layer A resolution

Evaluate the exclusion block first, in this order, first match wins:
community, reply, repost, then VF or NSFW
(`phoenixRankAllCandidateProcessor.strato:430-455`). A community post that
is also a reply reports community, not reply. A reply that is also NSFW
reports reply, not NSFW. Report exactly one blocking reason.

| Post type | Thunder | Phoenix retrieval | SimClusters | tail (followers < 1000 only) |
|---|---|---|---|---|
| Original | OPEN. Do not print a weight. | PENDING(signal): 1 like | PENDING(signal): 8 likes, plus the viewer-history condition | UNPROVEN, else not printed |
| Quote | OPEN. Say nothing about ranking weight. | PENDING(signal): 1 like | PENDING(signal): same | same |
| Reply | OPEN at 0.75 | CLOSED: never written | CLOSED: dropped before scoring, and dropped again for empty ancestors | not printed |
| Repost | OPEN at 0.75 | CLOSED: never written | CLOSED: dropped before scoring | not printed |
| Community | no state; kit does not model community timelines | CLOSED: first check in the block | CLOSED | not printed |
| NSFW-annotated original | OPEN | CLOSED. Qualifying video + like reaches `nsfw_video`, whose corpus is not in the published default, so that row is UNPROVEN | CLOSED if the author is NSFW-labelled | UNPROVEN, not BLOCKED, if it has any video and a like and followers < 1000 |
| VF-dropped | OPEN; the author always sees their own post | CLOSED: none of the files below | CLOSED | CLOSED; none of the files below, including tail |

Do not say a quote avoids the 0.75 factor. Say nothing about a quote's
ranking weight. Exclusion block: treat a quote as an original.

NSFW-author SimClusters drop: `oon_nsfw_simclusters_filter.rs:19-23`.

### X's safety flags

Default `UNKNOWN`. `TRIPPED` only on a user-reported warning. No third
state. Never inferred. A J-rule flag never changes this block.

```
X's safety flags
UNKNOWN   X keeps these on their side. If one is set, none of the files
          below get written. It only shows up here if you already got a
          warning.
          (phoenixRankAllCandidateProcessor.strato:438-440, 447;
           eventProcessing.strato:246-265)
```

### Layer B

Two columns, and they are different things. Never merge them. Never print a
dump-window number as a stranger-reach duration. The only positive value
the right column may ever carry is `up to 48 h`, because
`MAX_POST_AGE = 48h` gates the feed with no exemption (`config.rs:36`;
`age_filter.rs:16-20`). Print `not published` whenever the row's index has
no matching `RetrievalDataset` member, or has one that is not in the
published default (`model_runner.py:543`).

```
WHAT FILES IT, AND FOR HOW LONG

                                              written    searchable
                                              and kept   on For You
WRITTEN     Publish-time file (post_creation)  24 h       not published
            (strato:266-273, 469; config/mod.rs:142; retrieval_dataset.py:229-285)
ON 1 LIKE   One-like file (1fav)               24 + 48 h  up to 48 h
            (strato:78-92; config/mod.rs:143-144; retrieval_dataset.py:231-235;
             age_filter.rs:16-20)
ON 32 LIKES Thirty-two-like file (32fav)       24 h       not published
            (strato:62-76; config/mod.rs:145; retrieval_dataset.py:229-285)
UNPROVEN    Small-account file (tail)          24 h       not published
            (sid_tail_processor.rs:71-80; config/mod.rs:187;
             retrieval_dataset.py:276-280)
n/a         No video, so the video files do not apply: video, nsfw_video,
            evergreen video.
```

Print applicable rows. Collapse non-applicable ones into one `n/a` line
naming the families. Never print more than seven rows; if more apply, keep
`post_creation`, `1fav`, `32fav`, `tail`, and the video family collapsed to
one row.

For a video post that passes `hasValidImmersiveVideo` (every media entity
is an accepted video type and duration strictly greater than 10 seconds):

- Left column: kept on their side as dump windows. Do not present those
  windows as feed reach.
- Right column: `up to 48 h if the video files are switched on, which is not published`.
- Token: `UNPROVEN` (matching dataset types exist, not in the published
  default).

For a video post that fails the gate (at or under 10 seconds, or mixed
media): video rows `BLOCKED` on that reason, not OPEN on duration.

A reply, repost, or community post with any video enters nothing. Video
rows `BLOCKED` on the exclusion reason, not on duration.

NSFW original: `post_creation`, `1fav`, `32fav`, and topic indexes
`BLOCKED`. It can still reach `search_unfiltered` with a like (reference
file only, never Job 1). For a small account with any video (media type
only, no duration test) and a like, `tail` is `UNPROVEN`, not `BLOCKED`.
A 5-second NSFW clip can dump metadata and feed `tail` while failing
`nsfw_video`. A VF drop that is not NSFW keeps this out of the files
below, including `tail`. Do not say a dropped post is never written
anywhere; `search_unfiltered` can still fire on a like, reference-only.

Do not print `search_unfiltered` or `metadata` on Job 1.

### Layer C modifiers (printed only when fired)

Only these five. No token. One sentence each.

| Modifier | Fires when | What the tool says | Cite |
|---|---|---|---|
| Cold-start lift | original or quote, followers `<= 1000`, views `< 1000` | One post per request gets pulled up to slot 15, and it has to already be in the top 85 percent of what got scored. Nobody can see that before you post. | `author_cold_start.rs:86-91`; `:130-138`; `:165-179`; `param.rs:621-656` |
| Author diversity | user confirms more than one post likely in the same refresh | Second post in the same scroll keeps 62.5 percent, third keeps 43.75 percent, floor 25 percent. Per refresh, never per day. | `ranking_scorer.rs:614-616`; `param.rs:222-239` |
| Out-of-network factor | reply or repost | Served at three quarters weight even to people who follow you. | `param.rs:246-251`; `ranking_scorer.rs:747-754` |
| Retweet dedup | user confirms someone reposted the original, or the draft is a repost of their own post | First arrival in source order wins, so a repost can evict the original. | `retweet_deduplication_filter.rs:19-26` |
| Subscriber-only | user says the post is subscriber-only | Reaches only subscribers. | `ineligible_subscription_filter.rs:21-27` |

The two 1,000s are different. Cold start is followers `<= 1000`. Tail is
followers strictly `< 1000`. At exactly 1,000 followers a creator has the
cold-start lift and not the tail file.

Cold start is a Layer C modifier. It gets no Layer A state.

Do not print DPP, negative compression, request-time visibility filtering,
empty-ancestors, or exploration bonus as Layer C rows.

### Judgment pass (required)

Run `J-ENGAGEMENT-BAIT`, `J-REPLY-BAIT`, `J-NEGATIVE-FEEDBACK-RISK`,
`J-DUPLICATE-RISK` from [references/rules.md](references/rules.md) against
the draft **TEXT**. These are the only machinery in the kit that reads the
draft. Emit exactly one receipt line:

- Clear-cut: `Judgment: J-ENGAGEMENT-BAIT.`
- Arguable: `Judgment: J-REPLY-BAIT, borderline.`
- Nothing: `Judgment: none flagged.`

Clear-cut means an explicit ask for engagement. Borderline means the call
rests on tone, substance, or repetitiveness. Several rules flagging still
produce one line.

A J-rule flag never changes the safety-flag state.

`J-DUPLICATE-RISK` and `J-NEGATIVE-FEEDBACK-RISK` feed the receipt line and
the ladder only. They must not drive a Layer C row.

`J-OFF-CATEGORY` fires only when QK was actually answered. If QK was not
asked or not answered, it cannot fire.

### The one edit: lever ladder

Layer A and B are gated on post type, follower count, like count, media
type, and category history. None of those move by rewording, so the readout
alone cannot produce an edit. After the output and the judgment pass, pick
the highest-ranked lever that actually applies. Tiebreak is list order. Run
silently. Print only the result sentence. Do not print which rungs fired.

1. **Reopen a closed path.** Structural. Only on conditions already true of
   this draft.
   - Make it an original rather than a reply. Before converting, test
     whether the draft is self-contained: would it still make sense with no
     parent post. It is not self-contained if it opens by agreeing or
     reacting, refers to "the part" or "this point," uses a pronoun whose
     referent is in the parent, or is a fragment that only reads as a
     response.
     - Self-contained: convert and rewrite.
     - Context-dependent: rung 1 still applies, but the edit must say
       posting it verbatim will not work and the standalone version has to
       carry the point on its own. The rewrite must be an actual standalone
       post. If the point is too thin to stand alone, say so plainly and
       omit the rewrite.
   - Convert a repost to a quote. A repost is excluded from every stranger
     file. A quote is not. Only if the draft has an added comment, or the
     user is willing to add one. Do not claim a ranking-weight advantage
     for the quote.
   - Media length or type applies only when media is already in the draft
     and is the wrong length or type. Adding media that is not in the draft
     is not a same-draft edit. "No video" is not a rung-1 reopen.
2. **Remove kill-switch risk.** Protects the safety-flag precondition.
   Link reputation, pinned-link exposure, anything a J-rule flags as bait
   that draws Grox scrutiny. Traction buys a more expensive inspection:
   deluxe pass at 64 likes (`grox/config/config.py:112`), PTOS at 128
   (`grox/flows/ptos/constants.py:25`).
3. **Nameable reuse gap, not "make it sharper."** Fires only when the draft
   states news or a fact with no takeaway a third party could reuse. Then
   rewrite toward a reusable takeaway, weight-framed to copy-link (20.0)
   and follow (4.0) (`param.rs:325-330, 345-350`) with the rarity caveat
   in the same breath (`param.rs:279-281`). If the draft already has a
   reusable takeaway, this rung does not apply. Never fire it to tighten
   copy or punch up a hook.
4. **Avoid a modifier penalty.** Same-refresh stacking, or a repeated
   format against the user's own recent posts as a writing observation
   (`ranking_scorer.rs:614-616`). Do not cite DPP here.

**No edit is a first-class outcome.** Fixed wording:

`No edit: this draft is not leaving reach on the table. None of what would have cost you reach is present: a reply, repost, or community post (would keep it out of the wider-distribution file), an NSFW mark (same), a clip already in the draft at or under 10 seconds or sitting next to a photo (would keep it off the video files), bait that asks people to like or tag, or a restriction notice from X.`

One-edit sentence shapes. Name reach, not "opens Strangers' For You" as
the sold outcome. The path label in parentheses may stay as a mechanism
name.

- Rung 1 self-contained reply, rung 1 repost-to-quote, rung 2:
  `The one edit: {change}. Opens a path to more reach ({path}).`
- Rung 1 context-dependent reply:
  `The one edit: {change}. Opens a path to more reach ({path}); posting the reply as-is will not.`
- Rung 1 context-dependent, point too thin:
  `The one edit: Leave this a reply. The point does not stand on its own, so it will not pick up new distribution.`
- Rung 3: `The one edit: {change}. Gives someone a reason to send this to someone else. It does not open a path that is closed.`
- Rung 4: `The one edit: {change}. Avoids a penalty inside paths that are already open.`

Rewrite block: no strikethrough, no bold markers. One `Rewrite:` line
naming what changed, then the full paste-ready draft.

```
Rewrite: {what changed}

{full rewritten draft}
```

### What the output must never show

- A score, a band, a percentage, a predicted impression count, or a rank.
- A modifier that did not fire.
- A restatement of a judgment rule name outside the one-line receipt.
- An index the post cannot reach, except in the single collapsed `n/a` line.
- A dump window presented as reach duration.
- The retired v3 product noun, or any invented replacement.

---

## Worked example 1: clean original, under 1,000 followers

**Draft:** a clean original with a reusable takeaway. No video, not a
reply, no bait, no risky link. Followers confirmed under 1,000.

Internal only (do not print): Phoenix PENDING on 1 like; publish-time file
named and disposed of; tail UNPROVEN; SimClusters PENDING on 8 likes plus
viewer history; Thunder OPEN; cold start fires as Layer C;
rungs find nothing. Stop.

Print this:

```
WHERE IT CAN SHOW UP

UNPROVEN  Small-account shelf (tail)
          Under 1,000 followers, X writes your post to a small-account file
          about three minutes after you post, with no likes needed. There is
          a matching file this service knows how to load. Whether the For You
          feed asks for it is a setting they did not publish.
          (sid_tail_processor.rs:71-80; config/mod.rs:187;
           retrieval_dataset.py:276-280; launch_inference.py:496-501)
          Whether any one person sees this comes down to what they have been liking and replying to lately, which is on their side and nobody can read it from here.

PENDING   Strangers' For You (Phoenix retrieval)
          The first like is the published ticket into wider distribution.
          Followers can see it as soon as you post. That is the floor.
          X writes a file when you publish. They never published that anyone
          looks there.
          (retrieval_dataset.py:229-235; model_runner.py:543;
           launch_inference.py:496-501; strato:266-273, 469)

PENDING   People who liked things like this (SimClusters)
          Needs 8 likes before X builds a lasting picture of who this post
          is for. On top of that it only runs for viewers who already like
          and reply to things, or who dwell and click on them, and nobody
          can see that from here.
          (Configs.scala:65; simclusters_source.rs:88-93, 139-147)

OPEN      People who follow you (Thunder)
          Goes to people who follow you.
          (thunder_source.rs:25-27, 30)

X's safety flags
UNKNOWN   X keeps these on their side. If one is set, none of the files
          below get written. It only shows up here if you already got a
          warning.
          (phoenixRankAllCandidateProcessor.strato:438-440, 447;
           eventProcessing.strato:246-265)

WHAT FILES IT, AND FOR HOW LONG

                                              written    searchable
                                              and kept   on For You
WRITTEN     Publish-time file (post_creation)  24 h       not published
            (strato:266-273, 469; config/mod.rs:142; retrieval_dataset.py:229-285)
ON 1 LIKE   One-like file (1fav)               24 + 48 h  up to 48 h
            (strato:78-92; config/mod.rs:143-144; retrieval_dataset.py:231-235;
             age_filter.rs:16-20)
ON 32 LIKES Thirty-two-like file (32fav)       24 h       not published
            (strato:62-76; config/mod.rs:145; retrieval_dataset.py:229-285)
UNPROVEN    Small-account file (tail)          24 h       not published
            (sid_tail_processor.rs:71-80; config/mod.rs:187;
             retrieval_dataset.py:276-280)
n/a         No video, so the video files do not apply: video, nsfw_video,
            evergreen video.

ONCE IT IS IN THE RUNNING
One post per request gets pulled up to slot 15, and it has to already be in the top 85 percent of what got scored. Nobody can see that before you post.
(author_cold_start.rs:86-91; :130-138; :165-179; param.rs:621-656)

Judgment: none flagged.

No edit: this draft is not leaving reach on the table. None of what would have cost you reach is present: a reply, repost, or community post (would keep it out of the wider-distribution file), an NSFW mark (same), a clip already in the draft at or under 10 seconds or sitting next to a photo (would keep it off the video files), bait that asks people to like or tag, or a restriction notice from X.

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

If followers are over 1,000, omit the tail rows and omit Layer C. Still
No edit.

---

## Worked example 2: reply with engagement bait, large account

**Draft (before):** a reply under a large account that also ends with
"like if you agree and tag 3 friends so this blows up."

Internal only (do not print): Phoenix CLOSED (reply); SimClusters CLOSED
(reply); Thunder OPEN at 0.75; tail not printed; no Layer C cold start
(reply, and over 1,000). Rung 1 applies: make it an original. Do not print
this paragraph.

Print this:

```
WHERE IT CAN SHOW UP

CLOSED    Strangers' For You (Phoenix retrieval)
          This can circulate for a moment. It has no published path to pick
          up new distribution.
          Replies are never written to any of these files at all.
          Not a slower path, no path.
          (phoenixRankAllCandidateProcessor.strato:437, 443-444)

CLOSED    People who liked things like this (SimClusters)
          Replies are thrown out before scoring on this path, so it never
          reaches anyone who does not already follow you.
          (oon_retweet_reply_filter.rs:13-18)

OPEN      People who follow you (Thunder)
          Goes to people who follow you, but at three quarters the weight
          because it is a reply.
          (param.rs:246-251; ranking_scorer.rs:747-754)

X's safety flags
UNKNOWN   X keeps these on their side. If one is set, none of the files
          below get written. It only shows up here if you already got a
          warning.
          (phoenixRankAllCandidateProcessor.strato:438-440, 447;
           eventProcessing.strato:246-265)

WHAT FILES IT, AND FOR HOW LONG

                                              written    searchable
                                              and kept   on For You
BLOCKED     Publish-time file (post_creation)  n/a        n/a
            Replies are skipped before any of these files are written.
            (strato:437, 443-444)
BLOCKED     One-like file (1fav)               n/a        n/a
            (strato:437, 443-444)
BLOCKED     Thirty-two-like file (32fav)       n/a        n/a
            (strato:437, 443-444)
n/a         No video, so the video files do not apply: video, nsfw_video,
            evergreen video.

ONCE IT IS IN THE RUNNING
Served at three quarters weight even to people who follow you.
(param.rs:246-251; ranking_scorer.rs:747-754)

Judgment: J-ENGAGEMENT-BAIT.

The one edit: Post this as an original on your timeline, not a reply. Opens a path to more reach (Phoenix retrieval).

Rewrite: posted as an original; dropped the tag-and-like closer.

{the rewritten original, paste-ready}

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

Do not stack a second "one edit." After rung 1, the bait closer is gone
because the rewrite is the original-post form of this draft.

---

## Worked example 3: repost with a comment the user is willing to add

**Draft:** a repost. The user is willing to add a comment and post it as a
quote.

Internal only (do not print): Phoenix CLOSED (repost); SimClusters CLOSED;
Thunder OPEN at 0.75; rung 1 convert-to-quote. Do not claim a ranking-weight
advantage for the quote. Do not print this paragraph.

Print this:

```
WHERE IT CAN SHOW UP

CLOSED    Strangers' For You (Phoenix retrieval)
          This can circulate for a moment. It has no published path to pick
          up new distribution.
          Reposts are never written to any of these files at all.
          Not a slower path, no path.
          (phoenixRankAllCandidateProcessor.strato:431, 445-446)

CLOSED    People who liked things like this (SimClusters)
          Reposts are thrown out before scoring on this path, so it never
          reaches anyone who does not already follow you.
          (oon_retweet_reply_filter.rs:13-18)

OPEN      People who follow you (Thunder)
          Goes to people who follow you, but at three quarters the weight
          because it is a repost.
          (param.rs:246-251; ranking_scorer.rs:747-754)

X's safety flags
UNKNOWN   X keeps these on their side. If one is set, none of the files
          below get written. It only shows up here if you already got a
          warning.
          (phoenixRankAllCandidateProcessor.strato:438-440, 447;
           eventProcessing.strato:246-265)

WHAT FILES IT, AND FOR HOW LONG

                                              written    searchable
                                              and kept   on For You
BLOCKED     Publish-time file (post_creation)  n/a        n/a
            Reposts are skipped before any of these files are written.
            (strato:431, 445-446)
BLOCKED     One-like file (1fav)               n/a        n/a
            (strato:431, 445-446)
BLOCKED     Thirty-two-like file (32fav)       n/a        n/a
            (strato:431, 445-446)
n/a         No video, so the video files do not apply: video, nsfw_video,
            evergreen video.

ONCE IT IS IN THE RUNNING
Served at three quarters weight even to people who follow you.
(param.rs:246-251; ranking_scorer.rs:747-754)
First arrival in source order wins, so a repost can evict the original.
(retweet_deduplication_filter.rs:19-26)

Judgment: none flagged.

The one edit: Post this as a quote with your comment, not a repost. Opens a path to more reach (Phoenix retrieval).

Rewrite: posted as a quote; the comment is now on the post itself.

{the rewritten quote, paste-ready}

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

A fourth example, NSFW-annotated original with a 30-second video under
1,000 followers, lives in
[references/how-reach-works.md](references/how-reach-works.md) and
demonstrates the two NSFW escapes.

---

## Job 2: Why did my post die

Same three layers, retrospective. Asks the same batch plus QV and QK.

Output, no analysis preface: (1) blocked, unproven and pending Layer A
paths and Layer B rows, ranked by fit with the symptom; (2) what cannot be
determined from the outside, named rather than guessed, which now
explicitly includes which corpora the For You cluster requests; (3) scope
footer.

The honesty line from Job 1 also prints whenever the symptom is about who
saw it.

| Symptom | First candidates |
|---|---|
| Almost only followers saw it | Reply, repost, or community post (exclusion block). Or an NSFW annotation. Or a stranger-only safety flag. Or simply no like yet, since one like is the first proven entry into a searched corpus |
| Nothing at all, including followers | 48-hour feed age gate; Thunder's per-request caps; a base-rule safety flag that also hides you from followers |
| Under 1,000 followers, never left your own audience | Cold-start lift needs top-85-percent pool position, which nobody can see. The small-account file is written about 3 minutes after posting, but whether the feed searches it is not published |
| Died after early traction | The feed's hard 48-hour age gate; or SimClusters' 8-hour half-life and 48-hour candidate cap; or a warning landed after publish |
| Video stopped travelling after about two days | The feed's 48-hour age gate, or a two-day video slice. The long video windows are storage, not feed reach. |
| Video never travelled beyond followers at any point | No qualifying video: under or exactly 10 seconds, or mixed media failing the forall. Or the video files are not among the corpora this feed requests, which is not published |
| Stopped reaching a topic feed | Recent posting drifted off-category and the 50-percent consistency gate stopped matching |

Name what cannot be determined from the outside rather than guessing:
whether X flagged you, which test group you were in, where this sat in
someone's scroll, and which corpora the For You cluster requests.

---

## Job 3: Am I shadowbanned

Lead with this, first, always:

`I can't see whether X labeled you. What I can do is name which published kill-switch produces exactly the way your reach died.`

Then:

`Whether any one person sees this comes down to what they have been liking and replying to lately, which is on their side and nobody can read it from here.`

Then a capped differential. Rank by: (1) the follower-versus-stranger split
the user described; (2) published duration or expiry versus their timeline;
(3) an unmentioned required trigger ranks lower; (4) contradiction last or
out.

Emit the lead line, then the top 3 branches with name, what the user would
observe, and a citation. Then one collapsed line:
`Also on the board, lower fit: {remaining names}.` Then the scope footer.
Never claim a diagnosis is confirmed. Do not walk all branches.

Branches (see
[references/creator-cheat-sheet.md](references/creator-cheat-sheet.md)).
Print the name and Observe in plain language; keep the citation.

1. **NSFW cluster (3 of last 5).** Observe: strangers vanish about 7 days
   after a cluster of NSFW posts; people who follow you may still see you.
   (`safety-label-user-agg/postToUserLabelRules.strato:396-426`)
2. **A link X later marked unsafe.** Observe: old posts with that URL die
   together when X flips the call. That hides them from strangers
   (`rtf_tweets_on_unsafe_verdict.bot:17-27`). That file walks every
   matching tweet id. A separate tweet-safeguard number lives only on the
   `NSFW_CARD_IMAGE` verdict path
   (`NSFW_Card_Image_URL_to_Tweet_Verdict.bot:20-22`), not this rule.
3. **Pinned-post trap.** Observe: strangers stop seeing you while the pin
   stays bad; it can fire again when someone follows you. Pin a BAD or
   LOW_QUALITY URL and the account can be treated as spam for 7 days
   (`PinnedLowQualityOrBadUrl.bot:8-41`;
   `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`).
   `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo; 7
   days is implied by the constant name.
4. **Four flags that also hide you from followers.** Observe: followers and
   strangers both lose the post. Published names: `FOSNR_HATEFUL_CONDUCT`,
   `FOSNR_VIOLENT_SPEECH`, `FOSNR_ABUSE`, `FOSNR_CIVIC_INTEGRITY`.
   Insults-level versions of these hide you from strangers only.
5. **Do not amplify to non-followers.** Observe: people who follow you
   still see you; strangers do not. A rule, not a safety label
   (`user_label_drops.rs:113-119`). Pair with
   `ABUSIVE_HIGH_RECALL_USER_DROP` (`:101-106`). Adjacent
   `NSFW_NEAR_PERFECT_USER_DROP` ships `false` (`:107-112`).
6. **Other of the 26 stranger-only hides.** Observe: same "only followers
   see you" pattern without the pinned-URL or NSFW-cluster timeline. Full
   list in the cheat sheet (`registry.rs:141-166`).
7. **NSFW annotation on the post.** Observe: strangers stop seeing your
   text posts while video posts with likes still travel. Index-time, a
   different mechanism from the NSFW account-label rollup
   (`strato:438-453`; `eventProcessing.strato:318-326`).
8. **NSFW author and SimClusters.** Observe: one specific stranger path
   goes quiet while others do not
   (`oon_nsfw_simclusters_filter.rs:19-23`).

---

## Last 20

Paste a handle. That is the default product. Look at the last 20. Say
what the published code could file and price, what it could not, and
what to do better. Do not write a new post. If they then paste a draft,
Rewrite runs.

The code does not like posts. It files some and prices some.

- Filed: original or quote, one like, still under 48 hours. That is the
  only stranger file For You is published to search
  (`strato:78-92`; `retrieval_dataset.py:231-235`; `model_runner.py:543`).
- Pictured: 8 likes (`Configs.scala:65`).
- Priced, and we can see the public count: like, reply, quote, repost.
  Copy-link is 40x a like and has no public count. Follow is 4.0 and has
  no public per-post count.
- Closed: reply, self-thread continuation (X stores it as a reply),
  repost, community, or older than 48 hours.
- Visible, not a reach term: `bookmarkCount`, `viewCount`. Say so when
  they show up. Do not treat a save as distribution.
- Invisible from a public scrape: who liked, who replied, who follows
  back. There is no published mutual-like term. The mutual boost is
  bidirectional follow plus a reply on an original (5 to 20 on the reply
  term only). Name that when an original has replies. Do not invent a
  mutual count.

### Ingest

Two pulls, every time. Default N = 20 each. Union by id. A
`with_replies`-only pull that hides a live original is a product bug.
A profile-only pull that hides unused replies is also a bug.

1. Handle + Apify. Run the kit wrapper. This is a bash script, not an
   MCP tool.

```bash
bash "$CLAUDE_SKILL_DIR/scripts/ingest-recent.sh" --handle "$HANDLE" --max 20 --output /tmp/x-reach-recent.json
```

It hits `https://x.com/<handle>` and `https://x.com/<handle>/with_replies`.
It searches `$X_SCRAPER`, then `~/.claude/skills/x-scraper/scripts/x-scrape.sh`,
then Codex / agents / Vault copies. If the `apify` CLI is missing it
calls the Apify HTTP API with `APIFY_TOKEN` or the token already in
`x-scrape.sh`. It does not copy that token into this repo.

Then inject, even if they would lose a recency slot: every original or
quote still inside 48 hours, and the most recent original that crossed
8 likes.

2. No scrape. Open both URLs in the in-app browser. Same fields.

3. Neither. Ask them to paste up to 10, including replies.

Required fields: `id`, `url`, `text`, `createdAt`, `isReply`,
`isRetweet`, `isQuote`, `likeCount`, `author.followers`,
`inReplyToUsername`. Use when present: `viewCount`, `bookmarkCount`,
`replyCount`, `quoteCount`, `retweetCount`, `conversationId`.

Self-thread: `isReply` and `inReplyToUsername` is the same account.
Group continuations that share an authored `conversationId` into one
tape row. Count them as content. Classify them CLOSED for filing.
Do not apply author-diversity 62.5 / 43.75 / 0.25 to those parts as if
they were 12 originals. That modifier is 2+ originals in one refresh
(`ranking_scorer.rs:614-616`; `param.rs:222-239`).

Do not infer NSFW, community, or a safety label from text. Do not run
the 10-second video gate without a duration.

### Output

Monospace-aligned plain text. No colour. No `**`. No fences in the body.
No em dashes. Nothing above block 1. Always print the handle, `DO BETTER`, `HOW THIS WORKS`, and the scope
footer. Omit empty blocks. Never print TAPE or merge.

```
@handle
6 originals   4 quotes   9 thread parts   3 reposts   36 replies

STILL OPEN

0 LIKES   [hook]
          dies [UTC] (~Nh)
          Still inside 48 hours. Followers can see it.
          For You cannot search it yet.
          [url]

FILED
Past 48 hours. Traction does not extend For You. No video exemption.

PICTURE   [hook]
          9 likes · 16 bookmarks · 1 reply · 2 quotes
          bookmarks are saves, not a published ranking term
          named system someone can send. Copy-link is 40x a like.
          [url]

TICKET    [hook]
          2 likes · 2 replies
          [url]

CLOSED

REPLY     [titled original sitting under @someone]
          [url]
          [filed post] was filed. Same topic, two fates.
          A reply cannot enter the searched file.

[one-liners: thread parts, reposts, ops, thunder expiry]

NOT THIS WEEK

107       [older winner]
          Shape contrast, not this week.

DO BETTER

[one to three instructions. No draft.]
Paste that draft and Rewrite will check it.
The first like is the published ticket into wider distribution.
Followers can see it as soon as you post. That is the floor.

HOW THIS WORKS
An original gets into wider distribution after one like. That is the
file For You is published to search. The feed drops it at 48 hours,
even if it was working. Eight likes builds a lasting picture of who
it is for.
Replies, reposts, and thread parts never enter that file. Followers
can see them for a moment. They cannot grow.
Copy-link is priced 40x a like. Bookmarks and profile taps are not
how it picks winners.
Ask about any line.

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

First line is the handle. Second line is the mix. Token padded to 8,
two spaces, hook on one line. Stats next. URL last. Never wrap a hook.
Never print `1 likes`. STILL OPEN before FILED. Repeated facts print
once on the section. Citations do not live in the body. `HOW THIS WORKS`
is the education piece. Last line invites a question.

Do not print the full weight table. Do not draft the next post. Do not
apply author-diversity 62.5 / 43.75 to self-thread replies as if they
were 12 originals. That modifier is 2+ originals in one refresh
(`ranking_scorer.rs:614-616`).

Same-pond is a reading on 2+ filed originals that share hook, step
count, closer, first-line shape, or media. Put it in DO BETTER if it
fires. No similarity score.

Punches that must fire when the tape supports them:

1. Same topic, two fates. A filed original and a closed reply on the
   same business in one line.
2. 48-hour kill after it worked. Traction does not extend For You. No
   video exemption.
3. 8-like near miss. Ticket punched, under 8, sendable list in the
   replies or self-thread.
4. Thunder expiry. Reply-heavy weeks: followers keep the last 30
   replies for 2 days. Fulfillment replies evaporate. Do not say "you
   reply too much."
5. Mentions are not a retrieval feature. Tagging a brand in a reply
   does not file you.
6. Ops vs reach. A "sent / got you / rock it" cluster is fulfillment.
   Name it as ops. Leave it a reply.
7. Ask for a follow, not a profile tap. Profile click 0. Follow 4.0.
   Copy-link 40x, unseen, so judge shape.
8. Paste-the-draft closer. DO BETTER ends by sending them to Rewrite.
   Do not write the post.

Clock on STILL OPEN is a named post and a die time, not a footer.

---

## Under the Hood

Paste text or a screenshot of `https://x.com/i/under_the_hood`. Map
their words onto published files, filters, and weights. If a string
has no published match, say so and stop. Do not invent a score. Do
not merge this into Last 20.

```
UNDER THE HOOD

MATCHED

MATCHED   NSFW_HIGH_RECALL
          account or post label
          Hidden from recommendations to people who do not follow you,
          and from underage, no-age, and logged-out viewers.
          Followers can still see you on this label.

UNMATCHED

NO FILE   visibility score
          No published match. The open code does not name this.
          Stop. Do not invent a score.

HOW THIS WORKS
Under the Hood is their words. This kit maps those words onto
published files, filters, and weights. If a string has no match,
that is the answer.
Ask about any line.

This reads the code they published, not the live knobs they can turn on you tomorrow.
```

Match only published labels and effect phrases from
[references/creator-cheat-sheet.md](references/creator-cheat-sheet.md).
`visibility score`, `ranking score`, `virality`, and a percentage have
no published match. Say that. Never turn their readout into a rank.

---

## Accuracy guards

- Weight-framed claims only: "the weight on a copy-link share is 40x the
  weight on a like," never "a share is worth 40 likes." The rarity caveat
  from `param.rs:279-281` appears in the same paragraph as any weight
  ratio.
- Mutual-follow +15 is a reply-term boost (5 to 20), not a post-level 4x.
- Diversity is per request / refresh, never per day.
- Never a per-viewer outcome. Eligibility is a property of the post.
  Delivery is a property of a viewer the tool cannot see.
- Never a probability. No trained Phoenix checkpoints ship.
- Never generative SID retrieval as live.
- Never the evergreen path as achievable. The producer is not in this repo.
- Never a default as a certainty. Any output line resting on an unanswered
  question names the assumption.
- Never infer that a corpus is served from the existence of a dump window.
- Real technical terms only after a plain-language explanation on first
  use in that surface.
- The retired v3 product noun is banned in every reader-facing surface.
  Do not coin a replacement.
- Never write a new post from a handle scan.
- Never lead with follower vs non-follower as the thing the user bought.
- Never print the full weight table on Last 20.
- Never run the 10-second video gate without a duration.
- Never scrape `with_replies` only and call that the tape. Two pulls.
  Never invent a mutual count. Bookmarks and views are not reach.
- Never print the file table on a Rewrite run unless they asked where
  it can show up.
- Never invent a score from an Under the Hood readout.

---

## Internal metadata check (not the taught interface)

`scripts/check-metadata.mjs` is an internal supplied-metadata check for
contributors. Do not present CLI flags as the user-facing path. Last 20
starts from a handle. Rewrite starts from a pasted draft. Under the Hood
starts from a pasted readout.

```bash
node "$CLAUDE_SKILL_DIR/scripts/check-metadata.mjs" --self-test
```

Deterministic D-rules only. Judgment rules for draft text are owned by
Job 1 above and defined in [references/rules.md](references/rules.md).
