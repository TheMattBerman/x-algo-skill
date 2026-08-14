# Changelog

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
