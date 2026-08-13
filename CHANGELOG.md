# Changelog

## [3.0.0] - 2026-08-13

X Reach Check. Eligibility over prediction.

### Added

- Six-door eligibility model (`references/doors.md`) shared by four jobs: make this get seen, why it died, shadowban differential, thin recent-post pattern read.
- Skill rename to `x-reach`; Job 1 happy path is a pasted draft with no CLI flags.
- Doors diagram hero asset (`assets/doors-diagram.svg`).
- Expanded kill-switch / discovery-gates cheat sheet (26 OON-only drops, 1/8/32 gates, Thunder caps, video 720h/5y tail, Grox traction scrutiny, held-back section, URL + pinned-post trap).

### Changed

- README sells doors → behavior changes → price/penalty tables → held-back → install (install last).
- Internal metadata script renamed to `scripts/check-metadata.mjs`; README no longer teaches CLI flags as the interface.
- Cold-start copy corrected to top-85% eligibility (bottom-15% ineligible).
- Weight claims are weight-framed only, with `param.rs:279-281` rare-event caveat alongside ratios.

### Removed

- `references/post-templates.md`
- `references/pipeline.md` (creator-relevant lines folded into doors)
- `D-MEDIA-PRESENCE` (always-PASS non-check)
- Score / verdict-band / reach-prediction framing from the taught path

### Fixed

- Changelog and self-test copy: there are **six** fixtures, not five.

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
