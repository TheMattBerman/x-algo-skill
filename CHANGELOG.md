# Changelog

## [4.4.0] - 2026-08-17

Three named products. Not Job 1, Job 4, Job 5.

- **Last 20.** Handle scan. Already shipped in 4.3. DO BETTER now
  sends the next draft to Rewrite.
- **Rewrite.** Paste a draft. REWRITE, THE ONE CHANGE or NO CHANGE,
  then SEND / FOLLOW / REPLY. No file table. No score.
- **Under the Hood.** Paste the readout. Matched labels and unmatched
  strings. No invented score.
- README is the public landing: three named products, real output samples.

Why this died and the shadowban check stay. They are not the sold trio.

### Not changed

- Three-layer retrieval model, UNPROVEN vs PENDING, exclusion order,
  Last 20 status page, citation pin `a389166`.

## [4.3.0] - 2026-08-17

The product is locked. Last 20 is last 20 versus the published rulebook.

Two pulls every time: profile and with_replies. Union by id. Live-original
floor and last-picture floor. Self-threads count as content and stay
CLOSED for filing.

### Changed

- Job 4 prints handle, mix, STILL OPEN, FILED, CLOSED, NOT THIS WEEK,
  DO BETTER, HOW THIS WORKS. No TAPE. No merge. Education sits at the
  end. Ask about any line.
- Punches fire when the tape supports them: same-topic two fates,
  48-hour kill after it worked, 8-like near miss, Thunder expiry,
  mentions are not retrieval, ops vs reach, follow vs profile tap,
  paste-the-draft closer.
- Bookmarks and views are named as not reach. No mutual count. No
  mutual-like term. No new post from Job 4.
- `scripts/ingest-recent.sh` hits both URLs, then injects live originals
  still inside 48 hours and the most recent 8-like original.
- Gold tape: two-pull scan of @themattberman must not print
  "no original inside 48 hours" or "write an original on grok."

### Not changed

- Three-layer retrieval model, UNPROVEN vs PENDING, exclusion order,
  Job 1 draft pre-review, Job 5 as a fast follow, citation pin `a389166`.

## [4.2.0] - 2026-08-17

The product is reach. The retrieval model is unchanged.

Will this post get seen, and what would make it get seen more. Follower
vs non-follower is a mechanism, not the promise.

### Changed

- Front door is Job 4. Paste a handle. Default N is 20, including replies.
  Ingest waterfall: Apify `with_replies`, then in-app browser, then paste 10.
- Job 4 prints TAPE, FILED, STILL OPEN, CLOSED, DO BETTER. Two pulls:
  profile and with_replies. It does not write a new post.
- Job 1 first Phoenix line is now the published-ticket sentence. CLOSED
  reply / repost / community leads with no published path to new
  distribution.
- README, SKILL, and cheat-sheet headlines sell reach, not non-follower
  eligibility.
- Job 5 (Under the Hood) is named and left for a fast follow.

### Not changed

- Three-layer retrieval model, UNPROVEN vs PENDING, exclusion order,
  citation pin `a389166`.

## [4.0.0] - 2026-08-14

The model is wrong if you only read the writer.

v3 said the first like is what files the post. The post is written at
publish. The like is what puts it in the file the published code can be
shown to search.

An intermediate draft said the post is findable by strangers at publish.
That read the writer and not the reader. The reader is
`phoenix/xrex/data/retrieval_dataset.py`.

Followers can see it as soon as you post. For everyone else, one like
is the first point we can prove they can be shown it.

### Changed

- Three-layer model replaces the v3 six-path frame. Layer A is sources.
  Layer B is dump windows versus served corpora. Layer C is in-slate
  modifiers, printed only when they fire.
- New state `UNPROVEN`: the machinery is published, the For You config
  is not. `tail`, video slices, and imagine print this. They do not
  print OPEN.
- Safety flags default to `UNKNOWN`. `CLEAR` is retired.
- SimClusters is CLOSED for replies and reposts.
- Video dump windows are storage. The feed's 48-hour age gate has no
  video exemption. Job 1 never prints those dump hours as reach.
- Kill switch moves above Layer B. If a flag is set, none of the files
  below get written. `search_unfiltered` can still fire on a like and
  stays reference-only.
- Quote posts are originals for the exclusion block. No ranking-weight
  claim about quotes.
- NSFW index check reads `metadata.isNsfw` only. Small-account NSFW
  video can still reach `tail`.
- Cold start stays a Layer C modifier. The two 1,000s stay separate:
  cold start `<= 1000`, tail `< 1000`.
- Topic feeds leave Job 1. They stay in Jobs 2 and 4 and the reference
  files.
- `references/doors.md` deleted. New files:
  `references/how-reach-works.md`, `references/index-map.md`,
  `references/what-is-not-published.md`.
- Reader-enumeration, citation, language, and snapshot gates added.

### Fixed

- NSFW Job 1 output: tail names the like, video row is `nsfw_video`,
  No-edit no longer denies the mark.
- Quote Thunder prints no ranking weight.
- Safety line says none of the files below get written, not "anywhere."
- Hero copy is about new people seeing the post, not "X searches."
- Demo GIF and MP4s replaced with the v4.1 take.
- `scripts/check-metadata.mjs` now flags exactly 10,000 ms and mixed
  media. Index gate is the primary cite.
- 5,000 cap moved off `rtf_tweets_on_unsafe_verdict` onto
  `NSFW_Card_Image_URL_to_Tweet_Verdict`.
- `POST_ANN_MIN_SCORE` named correctly. SimClusters 48-hour candidate
  cap added. The "only real engagement half-life" line is gone.

## [3.0.5] - 2026-08-13

Rung 1 self-contained test on `v3-output-polish`. Spec and copy only. No gate, citation,
state, or ordering changes.

### Fixed

- Rung 1 still converts a reply to an original, but only after testing whether the draft
  is self-contained. A context-dependent reply gets a distinct one-edit sentence and a
  standalone rewrite, not the reply text relabelled. A point too thin to stand alone stays
  a reply; that is not the No-edit outcome.

## [3.0.4] - 2026-08-13

Honesty pass on `v3-output-polish` from a blind usability test. Copy and spec only. Door
logic, gates, citations, ordering, and plain-language reason lines unchanged.

### Fixed

- `➡️` recommendations may not invent a derivation. Two forms only: name a real draft
  signal, or say there is no signal, name the default, and name what the assumption costs.
- Judgment receipt stays one line; arguable calls print `Judgment: {rule}, borderline.`
- Door 4 template and worked-example note both treat PENDING on 8 likes as unconditional
  (SimClusters has no draft-time lockout), matching `references/doors.md`.

## [3.0.3] - 2026-08-13

Plain-language pass on `v3-output-polish`. Copy only. Door logic, states, gates, citations, and ordering unchanged.

### Fixed

- Door reason lines are consequence sentences a creator can use; citations keep the precision.
- Door 6 CLEAR no longer says VF / supplied label / URL verdict. A flagged J-rule appends `See the flag below.`
- No-edit wording, Job 2 symptom copy, and Job 3 branch names/Observe lines use the same register.

## [3.0.2] - 2026-08-13

Second-test polish on `v3-reach-check`. No kit restructure. Manufactured-edit and Job 3 lead stay as in 3.0.1.

### Fixed

- Rung 1 length/type edit applies only when media is already in the draft; adding absent media is not a same-draft edit.
- Job 3 ranks branches with an ordered fit rubric (split, timeline, unmentioned trigger, contradiction).
- Door 6 ask is poster-facing (warning/restriction/notice); labels and URL verdicts are still never inferred from text or a domain.
- CLEAR kill-switch line carries a Judgment pointer when a J-rule flags; state stays CLEAR.
- No-edit second sentence lists absent reach costs, not actions to take.

## [3.0.1] - 2026-08-13

Usability + citation round on `v3-reach-check`. No kit restructure.

### Fixed

- Rung 3 is a nameable reuse-gap trigger, not a catch-all; No-edit is a first-class Job 1 outcome.
- Job 2 asks reply-vs-original in one batch; video duration asked in seconds with a 10s-boundary rule.
- Judgment emits a one-line receipt; kill switch states are CLEAR / TRIPPED.
- Job 3 leads with the unknown-label line, then top 3 branches, then a collapsed remainder.
- Citation corrections: two-file BAD/LOW_QUALITY URL ladder; redirect-chain `:9`; `require_non_follower` on two rules only; `DO_NOT_AMPLIFY_NON_FOLLOWER` is a rule not a label; tweet_label_drops base vs OON split; `nsfw_video` 48h/168h only; Agatha either-direction follow edges.

## [3.0.0] - 2026-08-13

X Reach Check. Eligibility over prediction.

### Added

- Six-door eligibility model (`references/doors.md`) with **OPEN / CLOSED / PENDING** states; PENDING lines name the post-publish unlock (top-85% pool, 1/32 likes, 8 likes).
- Job 1 judgment pass + four-rung lever ladder (`references/rules.md`) so "the one edit" is derived, not improvised; worked before/after example in `SKILL.md`.
- Skill rename to `x-reach`; Job 1 happy path is a pasted draft with no CLI flags.
- Kit floor files: `VERSION` (`3.0.0`), `install.sh` (idempotent `x-reach` symlink; removes stale v2 `x-algo-audit` when it points here), `AGENTS.md`, `doctor.sh`. No `.env.example` — this kit has no env vars.
- Doors diagram hero asset (`assets/doors-diagram.svg`).
- Re-recorded `assets/demo.gif` as a Job 1 session (bait-close edit + no-edit outcome), not the internal metadata script.
- Expanded kill-switch / discovery-gates cheat sheet (26 OON-only drops, 1/8/32 gates, Thunder caps, video 720h/5y tail with corrected index vs VQV scoping, Grox traction scrutiny, held-back section, URL + pinned-post trap).
- Nine self-test fixtures, including FAIL paths (`unsafe-verdict`, `known-label`) and a short-video FLAG.

### Changed

- README sells doors → behavior changes → price/penalty tables → held-back → install (install last); Grok copy filled; v2 upgrade note to `rm ~/.claude/skills/x-algo-audit`.
- Internal metadata script renamed to `scripts/check-metadata.mjs`; README no longer teaches CLI flags as the interface.
- Cold-start copy corrected to top-85% eligibility (bottom-15% ineligible); door 2 never silently drops the pool gate.
- Weight claims are weight-framed only, with `param.rs:279-281` rare-event caveat alongside ratios.
- 48h–720h video index duration floor cited to `eventProcessing.strato:24, 389-405`; VQV weight credit kept distinct at `param.rs:677-682`.

### Removed

- `references/post-templates.md`
- `references/pipeline.md` (creator-relevant lines folded into doors)
- `D-MEDIA-PRESENCE` (always-PASS non-check)
- Score / verdict-band / reach-prediction framing from the taught path

## [2.0.0] - 2026-08-13

Corrected against `xai-org/x-algorithm@a389166`.

### Added

- Citation-first verified findings, creator cheat sheet, published pipeline reference, audit rules, deterministic audit gate, and six fixtures.
- Synced-default action and negative-weight tables, cold-start, retrieval retention, visibility, and URL-reputation guidance.

### Changed

- Made the workflow audit-first and stated the production-default and experiment caveat.
- Separated relationship replies from OON discovery, and corrected the in-network reply/repost OON factor.
- Reframed media as format-specific action heads and links as a reputation question rather than an intrinsic penalty.

### Removed

- Synthetic score prediction, invented action-probability estimates, verdict bands, and unsupported optimal-format claims.
- `scripts/analyze_x_post.py`; `assets/architecture.svg`, `assets/cheatsheet.svg`, and `assets/weighted-scorer.svg`; `references/phoenix-architecture.md`; and `references/weighted-scorer.md`.

### Fixed

- Published default action and negative weights, their ordering, the 48-hour feed age gate, diversity multipliers, video VQV conditions, and cold-start behavior.
