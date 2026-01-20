# X Algorithm Weighted Scorer Reference

Complete technical breakdown of the WeightedScorer component—the "brain" where neural predictions become ranking decisions.

---

## The Core Formula

```
Score = Σ (w_i × P(action_i))
```

Where:
- `w_i` = configured weight for action type i (from `main.rs` or dynamic config)
- `P(action_i)` = Phoenix transformer's predicted probability of that action

The WeightedScorer takes raw probability outputs from the Grok-based ranker and computes a single scalar for sorting.

---

## Complete Engagement Hierarchy

### Tier 1: The Multipliers (w > 10.0)

High-friction actions that extend reach to new networks. The algorithm prioritizes these because they drive X's core differentiator: conversation.

| Action | Est. Weight | Mechanics | Strategic Implication |
|--------|-------------|-----------|----------------------|
| **P(reply)** | ~15-20x | Creates notification, thread, follow-on engagement | Structure content to demand response |
| **P(repost)** | ~12-15x | Content appears in reposter's followers' feeds | Make content worth sharing as-is |
| **P(quote)** | ~10-12x | High-effort—user adds their take + amplifies | Provide foundation for commentary |

**Why these weights?**
- Replies generate notifications → re-engagement → session time
- Reposts = direct network amplification (measurable reach expansion)
- Quotes = high intent signal + new content creation

### Tier 2: The Validators (w ≈ 1.0)

Lower-friction actions that validate relevance. Necessary to prove quality but insufficient alone for viral reach.

| Action | Est. Weight | Mechanics | Strategic Implication |
|--------|-------------|-----------|----------------------|
| **P(like)** | ~1.0x | Baseline positive signal, one tap | Easy to get, low differentiation |
| **P(video_view)** | ~1.2x | Watched >3 seconds (or completion) | Hook in first 3 seconds critical |
| **P(photo_expand)** | ~1.0x | Clicked to see full image | Use cropped/vertical images |
| **P(bookmark)** | ~1.5x | Saved for later—high intent | Create reference-worthy content |

**Why these weights?**
- Low friction = low signal strength
- But necessary: high P(like) with zero blocks = safe baseline
- Media actions are **additive terms**—text-only posts don't have them

### Tier 3: The Signals (w < 1.0)

Passive signals used primarily for model training and user profile refinement. Low direct scoring weight to prevent clickbait farming.

| Action | Est. Weight | Mechanics | Strategic Implication |
|--------|-------------|-----------|----------------------|
| **P(click)** | ~0.3x | Clicked through to content/link | Don't optimize—clickbait taught algorithms to discount |
| **P(dwell)** | ~0.5x | Time spent on post | Byproduct of good content, not goal |
| **P(profile_click)** | ~0.4x | Visited author's profile | Signals growth potential |
| **P(expand_details)** | ~0.2x | Clicked "Show more" on long posts | Minor signal |

**Why these weights?**
- Clickbait optimization created adversarial dynamics
- Algorithm learned to discount easy-to-game signals
- These feed the model but don't drive ranking

### Tier 4: The Destroyers (w ≈ -1000x)

Catastrophic negative weights. A single destroyer action can negate hundreds of positive signals.

| Action | Est. Weight | Mechanics | Strategic Implication |
|--------|-------------|-----------|----------------------|
| **P(block)** | ~-1000x | Never show this author again | One block ≈ -1000 likes |
| **P(mute)** | ~-500x | Suppress without blocking | Annoying but not offensive |
| **P(report)** | ~-2000x | Flagged for review | Potential shadowban trigger |
| **P(not_interested)** | ~-100x | Explicit negative feedback | Clear relevance miss |

**Why these weights?**
- "Harm reduction" philosophy over pure engagement maximization
- User satisfaction = retention = revenue
- One angry user costs more than many passive users

---

## The Math: Worked Examples

### Example 1: High-Reply Engaging Post

```
Post: "What's the one skill that 10x'd your career? I'll go first: learning to write clearly."

Phoenix predictions:
- P(reply) = 0.15 (15% reply rate—excellent)
- P(like) = 0.08
- P(repost) = 0.02
- P(quote) = 0.01
- P(block) = 0.001 (0.1%—very safe)

Score calculation:
= (15 × 0.15) + (1 × 0.08) + (12 × 0.02) + (10 × 0.01) + (-1000 × 0.001)
= 2.25 + 0.08 + 0.24 + 0.10 - 1.0
= 1.67 ✓

Verdict: Strong positive score, will rank well
```

### Example 2: Viral Thread Hook

```
Post: "I spent 6 months studying the X algorithm source code. Here's what actually matters (not what the gurus tell you):"

Phoenix predictions:
- P(reply) = 0.08
- P(like) = 0.12
- P(repost) = 0.06 (high shareability)
- P(quote) = 0.03 (people adding takes)
- P(bookmark) = 0.08 (reference value)
- P(profile_click) = 0.04
- P(block) = 0.002

Score calculation:
= (15 × 0.08) + (1 × 0.12) + (12 × 0.06) + (10 × 0.03) + (1.5 × 0.08) + (0.4 × 0.04) + (-1000 × 0.002)
= 1.20 + 0.12 + 0.72 + 0.30 + 0.12 + 0.016 - 2.0
= 0.476 ✓

Verdict: Positive score, good reach. Lower than Example 1 because P(reply) is lower, but strong P(repost) compensates.
```

### Example 3: Rage-Bait (High Engagement, Net Negative)

```
Post: "[Inflammatory political take]—if you disagree you're part of the problem"

Phoenix predictions:
- P(reply) = 0.25 (lots of angry replies!)
- P(like) = 0.05
- P(repost) = 0.04
- P(quote) = 0.03
- P(block) = 0.02 (2% block rate)
- P(report) = 0.005

Score calculation:
= (15 × 0.25) + (1 × 0.05) + (12 × 0.04) + (10 × 0.03) + (-1000 × 0.02) + (-2000 × 0.005)
= 3.75 + 0.05 + 0.48 + 0.30 - 20.0 - 10.0
= -25.42 ✗

Verdict: NEGATIVE SCORE despite high engagement. Demoted aggressively.
```

### Example 4: Link-Only Post (Structural Disadvantage)

```
Post: "Check out my new blog post: https://example.com/article"

Phoenix predictions:
- P(reply) = 0.01 (no reason to reply)
- P(like) = 0.02
- P(repost) = 0.005
- P(click) = 0.08 (people click links)
- P(block) = 0.003

Score calculation (note: no media terms):
= (15 × 0.01) + (1 × 0.02) + (12 × 0.005) + (0.3 × 0.08) + (-1000 × 0.003)
= 0.15 + 0.02 + 0.06 + 0.024 - 3.0
= -2.746 ✗

Verdict: NEGATIVE SCORE. Low engagement + no media terms + small block rate = underwater.
```

### Example 5: Text-Only vs. With Media

**Same content, text only:**
```
Post: "The framework that changed how I think about growth:"

- P(reply) = 0.05
- P(like) = 0.06
- P(repost) = 0.02
- P(block) = 0.001

Score = (15 × 0.05) + (1 × 0.06) + (12 × 0.02) + (-1000 × 0.001)
Score = 0.75 + 0.06 + 0.24 - 1.0 = 0.05 (barely positive)
```

**Same content, with infographic:**
```
Post: "The framework that changed how I think about growth:" + [image]

- P(reply) = 0.05
- P(like) = 0.08 (slightly higher—visual appeal)
- P(repost) = 0.03 (more shareable with visual)
- P(photo_expand) = 0.12 (people click to see framework)
- P(block) = 0.001

Score = (15 × 0.05) + (1 × 0.08) + (12 × 0.03) + (1 × 0.12) + (-1000 × 0.001)
Score = 0.75 + 0.08 + 0.36 + 0.12 - 1.0 = 0.31 (6x better!)
```

**The media bonus is structural, not optional.**

---

## Sensitivity Analysis

### How Much Does One Block Cost?

```
Baseline score: 1.5 (good performing post)
Each additional 0.1% block rate: -1.0 to score

At 0.1% blocks: 1.5 - 1.0 = 0.5 (still positive)
At 0.2% blocks: 1.5 - 2.0 = -0.5 (negative!)
At 0.5% blocks: 1.5 - 5.0 = -3.5 (severely demoted)
```

**The math is unforgiving. A 0.5% block rate can turn a good post negative.**

### Reply Weight Dominance

P(reply) at w=15 vs P(like) at w=1:

```
To match the score contribution of 15% reply rate:
- Need 225% like rate (impossible)
- Or 18.75% repost rate (exceptional)
- Or zero blocks + everything else combined
```

**P(reply) dominates. It's not optional.**

---

## Media Probability Terms Explained

### Why Text-Only Posts Are Disadvantaged

The scoring formula literally has fewer terms:

**Text-only:**
```
Score = w_reply×P(reply) + w_like×P(like) + w_repost×P(repost) + w_quote×P(quote) - w_block×P(block)
```

**With image:**
```
Score = w_reply×P(reply) + w_like×P(like) + w_repost×P(repost) + w_quote×P(quote) + w_photo×P(photo_expand) - w_block×P(block)
```

**With video:**
```
Score = w_reply×P(reply) + w_like×P(like) + w_repost×P(repost) + w_quote×P(quote) + w_video×P(video_view) - w_block×P(block)
```

Adding media = adding positive terms to the sum. Not adding media = leaving points on the table.

### Optimizing P(photo_expand)

```
Goal: Maximize probability viewer clicks to expand image

Tactics:
1. Vertical aspect ratio (gets cropped in feed → forces expand)
2. Text in image that's partially cut off
3. Data visualization that requires inspection
4. High contrast that draws eye but detail requires zoom
```

### Optimizing P(video_view)

```
Goal: Maximize probability viewer watches >3 seconds

Tactics:
1. Hook in first 1-2 seconds (before scroll-away)
2. Visual pattern interrupt (movement, contrast)
3. Text overlay for sound-off viewing (80% watch muted)
4. Loop-worthy ending (increases replay)
```

---

## Author Diversity Penalty Deep Dive

### The Mechanism

```python
# Simplified AuthorDiversityScorer logic
selected_authors = {}
diversity_base = 0.4  # 60% penalty for repeat authors

for position in timeline_positions:
    for candidate in sorted_candidates:
        if candidate.author in selected_authors:
            times_seen = selected_authors[candidate.author]
            penalty = diversity_base ** times_seen
            candidate.adjusted_score = candidate.score * penalty

        # Select top adjusted candidate
        selected = top_candidate
        selected_authors[selected.author] = selected_authors.get(selected.author, 0) + 1
```

### Compounding Effect

```
Post 1: Score × 1.0 (full score)
Post 2: Score × 0.4 (60% penalty)
Post 3: Score × 0.16 (84% penalty)
Post 4: Score × 0.064 (94% penalty)
```

Your fourth post in someone's session has effectively 6% of its original score.

### Practical Implications

| Posting Frequency | Effective Reach |
|-------------------|-----------------|
| 1 post/day | 100% per post |
| 2 posts/day (spaced) | ~70% average per post |
| 3 posts/day | ~50% average per post |
| 5+ posts/day | <30% average per post |

**Quality over quantity is mathematically enforced.**

---

## Negative Signal Propagation

### Immediate Effects

A block immediately:
1. Removes you from that user's feed (hard filter)
2. Contributes negative score to that scoring instance
3. Signals to the model "this content should not have been shown"

### Cascading Effects

```
User A blocks you
    │
    ├──→ Your content demoted for User A (permanent)
    │
    ├──→ Your content demoted for users SIMILAR to User A
    │    (they share embedding cluster characteristics)
    │
    └──→ Your Author Health Score decreases
         │
         ├──→ Baseline score penalty for ALL future posts
         │
         └──→ If pattern continues → shadowban territory
```

### Cluster-Based Reputation

Users are grouped into semantic clusters (from Two-Tower embedding similarity). High block rate within a cluster triggers cluster-wide demotion:

```
If block_rate[author][cluster_C] > threshold:
    for user in cluster_C:
        baseline_penalty[author][user] *= 0.5
```

You can be "shadowbanned" for a specific audience segment while performing fine elsewhere.

---

## Score Thresholds (Inferred)

| Score Range | Likely Outcome |
|-------------|----------------|
| > 2.0 | Strong distribution, potential viral candidate |
| 1.0 - 2.0 | Good performance, shown to engaged followers |
| 0.3 - 1.0 | Moderate distribution, some For You exposure |
| 0.0 - 0.3 | Minimal distribution, mostly followers only |
| < 0.0 | Suppressed, may only appear with direct navigation |
| < -5.0 | Heavily suppressed, borderline filtered |

---

## Optimization Cheatsheet

### Maximize Score

```
Primary: ↑ P(reply) — worth 10-20x other signals
Secondary: ↑ P(repost), P(quote) — network amplification
Tertiary: Add media — access additional probability terms
Defensive: ↓ P(block) — one block ≈ -1000 likes
```

### Safe Zone Targets

```
Block rate: < 0.5% of impressions
Reply rate: > 5% of engaged users
Media engagement: > 10% for posts with media
```

### Red Flags

```
Block rate > 1%: Systematic demotion likely
Reply/block ratio < 10:1: Content may be problematic
Declining reach over time: Author Health degradation
```

---

## Dynamic Weight Adjustments

The WeightedScorer configuration is not static. Evidence suggests weights adjust for:

### Time-Based Shifts
- Different weights for breaking news periods
- Event-based adjustments (elections, emergencies)

### User Segment Variations
- Power users may see different weight profiles
- New user onboarding may emphasize exploration

### A/B Testing
- X likely runs experiments with weight variations
- Your content may score differently across user segments

**Implication**: The exact weights are approximations. The relative ordering (Multipliers > Validators > Signals > Destroyers) is stable.
