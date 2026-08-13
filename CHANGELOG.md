# Changelog

## [2.0.0] - 2026-08-13

Corrected against `xai-org/x-algorithm@a389166`.

### Added

- Citation-first verified findings, creator cheat sheet, published pipeline reference, audit rules, deterministic audit gate, and five fixtures.
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
