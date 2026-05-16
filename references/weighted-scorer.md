# X Algorithm Weighted Scorer Reference

Technical breakdown of the scoring stage — where Phoenix's neural predictions become a single ranking number.

> **Updated 2026-05-15.** Re-audited against `home-mixer/scorers/weighted_scorer.rs`, `home-mixer/scorers/ranking_scorer.rs`, `home-mixer/scorers/author_diversity_scorer.rs`, `home-mixer/scorers/oon_scorer.rs`, and `phoenix/runners.py` in `xai-org/x-algorithm`. The prior version of this file invented specific weights (15/12/10/-1000) and worked-math examples (scores like -25.42). **Those were not in the codebase and have been removed.** X's real weights are runtime feature-switch params and are NOT published.

---

## The Core Formula

From `weighted_scorer.rs::compute_weighted_score` / `ranking_scorer.rs::compute_weighted_score`:

```
combined_score = Σ (weight_action × P(action))     // all actions, positive and negative
final_score    = offset_score(combined_score)
```

- `weight_action` — fetched at request time from a feature-switch `Params` system: `params.get(FavoriteWeight)`, `params.get(ReplyWeight)`, etc. **The numeric values are NOT in the open-source repo.** Anyone quoting "reply = 15" is guessing.
- `P(action)` — the Phoenix transformer's predicted probability for that action.

The score is computed **per candidate, independently** (candidate isolation — see `phoenix/README.md` attention mask). It does not depend on what else is in the batch.

---

## The 19 Action Types (confirmed)

Source: `phoenix/runners.py::ACTIONS`. These are what the Phoenix ranker predicts:

| # | Action | Class |
|---|--------|-------|
| 1 | `favorite` | positive (validator) |
| 2 | `reply` | positive (network-extending) |
| 3 | `repost` | positive (network-extending) |
| 4 | `photo_expand` | positive (media) |
| 5 | `click` | positive (passive signal) |
| 6 | `profile_click` | positive (passive signal) |
| 7 | `vqv` (video quality view) | positive (media) |
| 8 | `share` | positive (network-extending) |
| 9 | `share_via_dm` | positive (network-extending) |
| 10 | `share_via_copy_link` | positive (network-extending) |
| 11 | `dwell` | positive (passive signal) |
| 12 | `quote` | positive (network-extending) |
| 13 | `quoted_click` | positive (passive signal) |
| 14 | `follow_author` | positive (validator) |
| 15 | `not_interested` | negative |
| 16 | `block_author` | negative |
| 17 | `mute_author` | negative |
| 18 | `report` | negative |
| 19 | `dwell_time` | continuous (positive) |

`runners.py::NEGATIVE_FEEDBACK_INDICES = [14, 15, 16, 17]` (zero-indexed) confirms the four negative actions.

The Rust `RankingScorer` additionally wires in `quoted_vqv`, `click_dwell_time`, and `not_dwelled` (a fifth negative). Continuous actions (`dwell_time`, `video_watch_time`, `scroll_depth`) are listed in `runners.py::CONTINUOUS_ACTIONS`.

**There is no `bookmark` action and no `expand_details`/"Show more" action.** Earlier versions of this skill listed both — they do not exist in the model output.

---

## offset_score: How Negatives Actually Work

Verbatim logic from `ranking_scorer.rs::offset_score` (the `weighted_scorer.rs` variant is equivalent):

```rust
fn offset_score(combined_score: f64, w: &ScoringWeights) -> f64 {
    if w.total_sum == 0.0 {
        combined_score.max(0.0)
    } else if combined_score < 0.0 {
        (combined_score + w.negative_sum) / w.total_sum * NEGATIVE_SCORES_OFFSET
    } else {
        combined_score + NEGATIVE_SCORES_OFFSET
    }
}
```

Where (`ScoringWeights::from_params`):
- `positive_sum` = sum of all positive action weights
- `negative_sum` = `-(not_interested + block + mute + report + not_dwelled)` weights
- `total_sum` = `positive_sum + negative_sum`

### What this means

1. All actions are summed into `combined_score`. Positive actions add, negative actions subtract.
2. If `combined_score` is still positive, the post just gets a flat `+ NEGATIVE_SCORES_OFFSET`.
3. If `combined_score` went negative, it is **renormalized** into a bounded range: shifted by `negative_sum`, divided by `total_sum`, scaled by `NEGATIVE_SCORES_OFFSET`.

This is a **bounded floor**, not an exploding penalty. The old claim that "one block ≈ -1000 likes" and worked examples producing scores of `-25.42` were fabricated — there is no `-1000` weight and the formula cannot produce arbitrarily large negative numbers.

### The honest strategic takeaway

Negative actions are still the thing most likely to kill a post: enough of them flip `combined_score` negative, which drops the post into the renormalized low-score bucket where it is heavily suppressed. So minimizing `not_interested` / `block` / `mute` / `report` / `not_dwelled` remains the #1 defensive priority. You just cannot compute a literal point cost without X's private weights.

---

## Score Normalization

Both scorers wrap the result in `normalize_score(candidate, raw)` from `util/score_normalizer.rs` before downstream scorers run. The normalizer's exact transform is not detailed in the open-source files; treat normalized scores as comparable-within-request, not absolute.

---

## Video Eligibility (vqv)

`weighted_scorer.rs::vqv_weight_eligibility`:

```rust
fn vqv_weight_eligibility(candidate) -> f64 {
    if candidate.video_duration_ms.is_some_and(|ms| ms > MIN_VIDEO_DURATION_MS) {
        VQV_WEIGHT
    } else {
        0.0
    }
}
```

The `vqv` (video quality view) term **only contributes if the video clears `MIN_VIDEO_DURATION_MS`**. Sub-threshold clips forfeit the entire video term. `RankingScorer` applies the same gate to `quoted_vqv` (behind `EnableQuotedVqvDurationCheck`).

---

## Author Diversity Scorer

`author_diversity_scorer.rs`. Runs **after** the weighted score, **within a single feed response**.

```rust
fn multiplier(&self, position: usize) -> f64 {
    (1.0 - self.floor) * self.decay_factor.powf(position as f64) + self.floor
}
```

- Candidates are sorted by weighted score (best first).
- For each author, the first appearance gets `position = 0` → multiplier `(1-floor)·decay^0 + floor = 1.0`.
- The Nth appearance by the same author gets `(1-floor)·decay^N + floor`, asymptotically approaching `floor`.
- `decay_factor` and `floor` come from `params.get(AuthorDiversityDecay)` / `params.get(AuthorDiversityFloor)` — **values not in the repo.**

Key correction: this deduplicates authors **inside one feed response**, not across a day or a session. It does not track "your 3rd post in an hour." It attenuates the case where multiple of one author's posts are candidates for the same feed build.

---

## OON Scorer (Out-of-Network Demotion)

`oon_scorer.rs` (and folded into `ranking_scorer.rs::effective_oon_weight`):

```rust
let updated = match c.in_network {
    Some(false) => base_score * OON_WEIGHT_FACTOR,   // out-of-network → demoted
    _ => base_score,                                  // in-network → unchanged
};
```

- Out-of-network candidates (Phoenix retrieval) are multiplied by `OonWeightFactor` (< 1) — in-network content is structurally favored.
- Topic requests use `TopicOonWeightFactor` instead.
- Eligible new users (account age below `NewUserAgeThresholdSecs` and `followed_user_ids >= NEW_USER_MIN_FOLLOWING`) get `NewUserOonWeightFactor` — X intentionally shows new users more out-of-network content to bootstrap their embedding.

---

## Pipeline Order (where scoring sits)

From `README.md` and `for_you_candidate_pipeline.rs`:

```
Query Hydration → Candidate Sources (Thunder + Phoenix) → Candidate Hydration
→ Pre-Scoring Filters → SCORING (Phoenix Scorer → Weighted/Ranking Scorer
→ Author Diversity → OON) → Selector (top-K by score) → Post-Selection Filters
(VFFilter, DedupConversation) → Ads Blending → Response
```

---

## What You Can And Cannot Claim

| Claim | Status |
|-------|--------|
| 19-action list, action names | **Code-confirmed** (`runners.py`, `weighted_scorer.rs`) |
| Negative actions subtract, then renormalize | **Code-confirmed** (`offset_score`) |
| `vqv` needs minimum video duration | **Code-confirmed** |
| OON candidates demoted by a factor < 1 | **Code-confirmed** |
| Author diversity attenuates repeat authors per-response | **Code-confirmed** |
| Specific weight numbers (reply=15, block=-1000, etc.) | **NOT in repo — never state as fact** |
| "One block = -1000 likes" math | **False — fabricated** |
| Score thresholds (>2.0 viral, <0 suppressed) | **Inference only — not in repo** |
| Per-author "health score", cluster shadowban | **Inference only — not in this release** |
| `AgeFilter` = exponential decay | **False — it is a hard binary cutoff** |
