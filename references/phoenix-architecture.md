# Phoenix Architecture Deep Dive

Technical breakdown of X's neural recommendation system based on the `xai-org/x-algorithm` codebase.

> **Updated 2026-05-15.** Re-audited against the May 15, 2026 repo release (`phoenix/README.md`, `phoenix/recsys_model.py`, `phoenix/recsys_retrieval_model.py`, `phoenix/run_pipeline.py`, `home-mixer/`). Several earlier claims about the ranker "reading text", detecting sarcasm, and "soft filters with score penalty" were inference presented as fact and have been corrected. The Phoenix ranker operates on **hash-based ID embeddings**, not natural-language prose. Genuine content reading lives in the separate **Grox** service.

---

## System Overview: Thunder + Phoenix

The "For You" timeline construction bifurcates into two specialized pipelines:

```
User Request
     │
     ├──→ Thunder (In-Network)
     │         │
     │         ▼
     │    Posts from followed accounts
     │    (in-memory, <10ms latency)
     │
     └──→ Phoenix (Out-of-Network)
               │
               ├──→ Retrieval (Two-Tower)
               │         │
               │         ▼
               │    Candidate posts from global corpus
               │
               └──→ Ranking (Grok Transformer)
                         │
                         ▼
                    Scored candidates
                         │
                         ▼
              ┌──────────┴──────────┐
              │    Candidate Pool   │
              │   (merged results)  │
              └──────────┬──────────┘
                         │
                         ▼
                  WeightedScorer
                         │
                         ▼
                  Diversity Filter
                         │
                         ▼
                  Safety Filters
                         │
                         ▼
                    Final Feed
```

---

## Thunder: The In-Network Engine

Thunder solves the "Fan-Out Problem"—when a user with millions of followers posts, that content must be available to millions of timelines instantly.

### Architecture

**In-Memory Post Store**: Thunder uses RAM (likely Redis or custom Rust implementation) to store recent posts from active users. Design prioritizes read latency above all else.

**Ring Buffer Implementation**:
```
Structure: HashMap<UserId, RingBuffer<PostId>>
```
- Fixed-size buffer per user (most recent N posts)
- Old posts overwritten without garbage collection overhead
- Deterministic, bounded memory footprint

**Real-Time Kafka Ingestion**:
- Consumes `PostCreated` and `PostDeleted` events directly
- Near-instant indexing (<100ms from post to availability)
- This is the "fast path"—no inference needed for followed accounts

### Partitioning Strategy

Thunder is sharded by `UserId`:
- All data for a specific user on one shard
- Single-hop lookups for timeline construction
- Horizontal scaling by adding shards

---

## Phoenix: The Neural Core

Phoenix handles out-of-network discovery—finding relevant posts you don't explicitly follow.

### Phase 1: Two-Tower Retrieval

Standard architecture for modern deep retrieval, with X-specific optimizations.

**User Tower Neural Network**:
```
Input Features:
- Engagement history (likes, replies, reposts)
- Demographics (location, language, account age)
- Negative feedback history (blocks, mutes, reports)
- Current context (time, device, session behavior)

Output: Dense vector U of dimension d (likely 256-512)
```

**Item Tower Neural Network**:
```
Input Features:
- Text content (tokenized, embedded)
- Media metadata (type, duration, dimensions)
- Author features (follower count, engagement rate, topic clusters)
- Latent topic clusters (learned representations)

Output: Dense vector I of dimension d (same as User Tower)
```

**Similarity Computation**:
```
relevance = dot(U, I)  # or cosine similarity
```

**Approximate Nearest Neighbor (ANN)**:
- Searches billions of posts in milliseconds
- Likely uses HNSW (Hierarchical Navigable Small World) or quantization
- Returns top-K candidates (probably 500-2000) for ranking phase

### Training Dynamics

**Contrastive Loss Function (InfoNCE)**:
```
L = -log(exp(dot(U, I+)/τ) / Σ exp(dot(U, I-)/τ))
```
Where:
- I+ = posts user engaged with
- I- = random/negative posts
- τ = temperature parameter

This training forces:
- Engaged content vectors CLOSER to user vector
- Random content vectors FARTHER from user vector
- Shared manifold between User and Item embeddings

### The Echo Chamber Implication

Two-Tower models are efficient at clustering. If your User Tower embedding drifts toward a specific interest cluster, retrieval will efficiently return only content from that cluster.

**What Author Diversity Scorer mitigates**: WHO you see (prevents single author domination)
**What it doesn't mitigate**: WHAT viewpoints you see (semantic bubbles persist)

---

## Phase 2: Grok-Based Heavy Ranking

Once Thunder and Phoenix Retrieval provide candidates (~500-2000 posts), the Heavy Ranker scores them.

### Why Grok-derived?

Per `phoenix/README.md`: the ranking transformer is "ported from the Grok-1 open source release ... adapted for recommendation system use cases **with custom input embeddings and attention masking for candidate isolation**." So it reuses the Grok-1 transformer *architecture*, not a chat LLM that reasons about your post in language.

> **Important correction.** The ranker does NOT tokenize and "read" your post text. It consumes **hash-based ID embeddings** — `run_pipeline.py::build_hash_functions` hashes user IDs, post (item) IDs, and author IDs into embedding-table lookups. Each history item is `(post_id, author_id, actions)`. Relevance is learned from your **engagement-sequence patterns**, not from prose comprehension. Natural-language content understanding happens in the separate **Grox** service.

### Model Architecture (mini config, from `phoenix/README.md`)

| Parameter | Value (released mini model) |
|---|---|
| Embedding dimension | 128 (production is wider) |
| Transformer layers | 4 (production has more) |
| Attention heads | 4 |
| Key size | 32 |
| History sequence length | 127 |
| Candidate sequence length | 64 |
| User/Item/Author vocab | 1,000,000 each |
| Hashes per entity | 2 |
| Action types | 19 |

The released checkpoint is a **frozen snapshot** of a model normally trained continuously on real-time engagement data. The retrieval/ranking inputs are: User Embedding `[B,1]`, History Embeddings `[B,S,D]` (posts + authors + actions + product surface), Candidate Embeddings `[B,C,D]`.

### Multi-Task Prediction Head

The model outputs `[B, num_candidates, num_actions]` logits → probabilities for the **19 confirmed actions** (`runners.py::ACTIONS`): `favorite, reply, repost, photo_expand, click, profile_click, vqv, share, share_via_dm, share_via_copy_link, dwell, quote, quoted_click, follow_author, not_interested, block_author, mute_author, report, dwell_time`.

Note the real names: the video action is `vqv` (video quality view), not `P(video_view)`; there is no `bookmark`. The four negative actions are `not_interested`, `block_author`, `mute_author`, `report`.

**Advantage**: the weighted scorer can adjust feed behavior (its weights are runtime feature-switch params) without retraining the model.

### Candidate Isolation Mechanism

Critical deviation from standard transformer attention.

**Problem with naive self-attention**:
If scoring 100 candidates in a batch, Candidate A's score would be influenced by Candidate B's presence. This creates:
- "Context bleeding" between candidates
- Stochastic scoring (same post scores differently based on batch)
- Impossible to cache scores

**Solution: Attention Mask**

The attention matrix is masked so:
- Candidate token i CANNOT attend to candidate token j (where i ≠ j)
- All candidates CAN attend to User Context tokens
- Score is intrinsic to (User, Post) relationship only

```
Attention(Q, K, V) = softmax((QK^T / √d_k) + M) × V

Where M enforces:
M[candidate_i][candidate_j] = -∞  (for i ≠ j)
M[candidate_i][user_context] = 0  (allowed)
```

**Implication for creators**: Your content is judged on its merit relative to the viewer—not graded on a curve against the specific batch.

---

## Content Understanding: The Grox Service

Content understanding is NOT done by the Phoenix ranker. It is a **separate service**, `grox/`, new/expanded in the May 2026 release. Grox is a task-execution engine with classifiers and embedders. Code-confirmed tasks (`grox/tasks/`, `grox/plans/`):

| Task / Plan | What it does |
|-------------|--------------|
| `task_spam_detection.py` | Spam classification, incl. a low-follower reply-spam classifier (`SpamEapiLowFollowerClassifier`) |
| `task_safety_ptos_policy.py`, `task_safety_ptos_category.py` | PTOS safety policy + category enforcement |
| `task_post_safety_screen_deluxe.py` | Post safety screening |
| `task_banger_screen.py` | "Banger initial screen" — a content/topic quality classifier, cross-referenced against Grok topics |
| `task_multimodal_post_embedding.py`, `multimodal_post_embedder_v5.py` | Multimodal (text + image + video) post embeddings |
| `task_asr.py` | Audio transcription |
| `task_rank_replies.py`, `plan_reply_ranking.py` | Reply ranking |

What this means for creators (grounded, not inference):
- Spam-like and low-effort patterns are caught by explicit classifiers, especially for low-follower accounts replying.
- Unsafe / PTOS-violating content is screened and will be filtered.
- High-quality content gets a positive "banger" screen — closest thing to a quality score.

What is **NOT** code-confirmed (do not state as fact): tone matching, sarcasm/irony detection, hashtag-content semantic-mismatch scoring, writing-style authenticity markers, engagement-pod coordination graphs. These are plausible but inference.

---

## Data Flow Lifecycle

Complete request lifecycle for "For You" feed:

### 1. Hydration
`home-mixer` receives request, fetches:
- User's social graph (who they follow)
- Recent interaction history (what they liked/replied to)
- Negative feedback history (blocks, mutes)

### 2. Sourcing (Parallel Execution)

**Thunder path**:
- Query in-memory stores for followed accounts' recent posts
- Return top N (likely 50-100) most recent

**Phoenix Retrieval path**:
- Compute User Tower embedding
- ANN search against Item Tower embeddings
- Return top K (likely 500-2000) candidates

### 3. Candidate Merging
Combine Thunder (in-network) and Phoenix (out-of-network) candidates into single pool.

### 4. Heavy Ranking
Phoenix Transformer processes all candidates:
- Batched inference with Candidate Isolation mask
- Predicts probability vector for each candidate

### 5. Scoring
Scorers run in sequence (`home-mixer/scorers/`): `PhoenixScorer` (ML predictions) → `WeightedScorer`/`RankingScorer` (combine into one number via `Σ weight×P(action)` then `offset_score`) → `AuthorDiversityScorer` → `OONScorer`. See `weighted-scorer.md` for the exact formulas.

### 6. Filtering — two distinct stages

**Pre-scoring filters** (`home-mixer/filters/`, run BEFORE scoring — these are hard removals, not score penalties):
- `DropDuplicatesFilter`, `CoreDataHydrationFilter`, `AgeFilter` (hard binary cutoff at `max_age`), `SelfpostFilter`/`SelfTweetFilter`, `RetweetDeduplicationFilter`, `IneligibleSubscriptionFilter`, `PreviouslySeenPostsFilter`, `PreviouslyServedPostsFilter`, `MutedKeywordFilter`, `AuthorSocialgraphFilter` (blocked/muted authors), `VideoFilter`, `TopicIdsFilter`, `NewUserTopicIdsFilter`.

**Post-selection filters** (run AFTER top-K selection):
- `VFFilter` / `AncillaryVfFilter`: visibility filtering — deleted/spam/violence/gore.
- `DedupConversationFilter`: dedupe multiple branches of the same conversation thread.

> Correction: there are no "soft filters with score penalty." Filters either keep or drop a candidate. `AuthorDiversityScorer` is a *scorer* (it attenuates scores), not a filter. `AgeFilter` is a hard binary cutoff, not exponential decay.

### 7. Selection, Ads Blending, Assembly
- `TopKScoreSelector` sorts by final score and takes top K.
- `BlenderSelector` + `home-mixer/ads/` (`SafeGapAdsBlender`, `PartitionOrganicBlender`) inject ads into safe gaps with brand-safety tracking.
- Side effects cache request info; response served to client.

---

## Cold Start Problem & Solutions

### The Problem
New users/creators have weak embeddings:
- User Tower: No engagement history to encode
- Item Tower (for creators): No reputation signals

### System Solutions

**Global Popularity Fallback**:
- New users receive trending/popular content
- Global context vector augments weak User Tower

**Exploration vs. Exploitation**:
- System likely injects random candidates for new users
- Learns preferences from early engagement signals

### Creator Strategies

**Ride Trending Topics**:
- Your post embedding aligns with global context vector
- Drafts behind momentum of global conversation

**Build Niche First**:
- Concentrated topic area builds clear Item Tower embedding
- Algorithm learns "this creator = this topic cluster"
- Then expand once baseline is established

**Engage Authentically**:
- Your reply/engagement history shapes your User Tower
- Following and engaging in your target niche builds the right embedding
- Engagement pods backfire (the Grox spam classifier targets low-follower coordinated replies)

---

## Reputation & Health Scores

While not fully explicit in code, evidence suggests layered reputation systems:

### Per-User Reputation
Each user maintains internal score for each creator:
- Block = catastrophic penalty
- Mute = significant penalty
- Report = severe penalty + investigation flag
- Positive engagement = gradual boost

### Cluster-Based Reputation
Users grouped into semantic clusters. High block rate within a cluster → demotion for entire cluster.

### Author Health Score
Accumulated signals across all users:
- High overall block rate = baseline demotion
- Report patterns = potential shadowban
- Consistent positive engagement = baseline boost

### The Rehabilitation Problem
Once Author Health degrades, recovery is slow:
- Need extended period of low negative signals
- Positive signals compound slowly
- May need to rebuild in new topic cluster

---

## Architectural Implications for Strategy

### 1. Alignment > Metadata Gaming
The ranker learns from engagement-sequence patterns; Grox classifiers screen spam and safety. Hashtag tricks and keyword stuffing are low-effort patterns that risk Grox spam classification. Create content that genuinely matches your target audience.

### 2. Conversation is Currency
Reply / repost / quote / share are the top-tier network-extending positive actions. Design content that demands response, not just appreciation. (Exact weights are private feature-switch params — do not quote a multiplier.)

### 3. Negative Signals are Disproportionately Damaging
Enough negative actions (`not_interested`/`block`/`mute`/`report`/`not_dwelled`) flip `combined_score` negative, which renormalizes the post into the suppressed bucket. Safe content with 50% of the engagement beats polarizing content with 100% blocks. (There is NO `-1000` weight — see `weighted-scorer.md`.)

### 4. Media is Structural Advantage
Text-only posts forfeit the `photo_expand` and `vqv` terms. Videos must clear `MIN_VIDEO_DURATION_MS` for `vqv` to count.

### 5. Author Diversity is Enforced (Per Feed Response)
`AuthorDiversityScorer` attenuates repeat authors within a single feed build. It is not a cross-day timer, but flooding still means your posts compete against each other.

### 6. In-Network Reach is Favored
`OONScorer` multiplies out-of-network candidates by `OonWeightFactor` (< 1). Your followers see you more cheaply than the For You page does.

### 7. Cold Start Has Explicit System Support
New accounts get a dedicated ranker cluster (`PhoenixRankerNewUserInferenceClusterId`) and a `NewUserOonWeightFactor` that shows them more out-of-network content. Pick a niche, engage authentically — your engagement sequence is what builds your embedding.

---

## What's New in the May 2026 Release

- **`grox/` content-understanding service** — spam, PTOS safety, banger quality screen, multimodal embeddings, ASR, reply ranking.
- **Ads blending** (`home-mixer/ads/`) — `SafeGapAdsBlender` and `PartitionOrganicBlender` inject ads into safe gaps with brand-safety hydrators.
- **New candidate sources** — `ads_source`, `who_to_follow_source` (max 3 accounts), `phoenix_moe_source` (mixture-of-experts retrieval), `phoenix_topics_source`, `prompts_source`, `push_to_home_source`.
- **Expanded query hydration** — followed Grok topics, starter packs, impression bloom filters, IP, mutual-follow Jaccard graph, served history, inferred gender/demographics.
- **End-to-end pipeline** — `phoenix/run_pipeline.py` runs retrieval → ranking from exported checkpoints, replacing the separate `run_ranker.py` / `run_retrieval.py` as the entry point (both legacy scripts still ship). A ~3 GB pre-trained mini Phoenix model is distributed via Git LFS.
- **`RankingScorer`** — newer Rust scorer that folds weighted scoring + author diversity + OON into one component and reads all weights from the feature-switch `Params` system.

---

## Changelog

- **2026-05-15** — Re-audited against the `xai-org/x-algorithm` May 2026 release. Corrected: ranker does not read prose (hash-based ID embeddings); no `-1000` block weight (bounded `offset_score` renormalization); `AgeFilter` is a hard cutoff not decay; no "soft filters"; action list corrected (`vqv` not `video_view`, no `bookmark`/`expand_details`); added Grox service, ads blending, new sources, OON demotion, new-user handling.
