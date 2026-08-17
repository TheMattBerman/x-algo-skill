# How reach works

Three layers. A writer is not a reader. Cite the reader for every claimed
path to a stranger.

Source commit: `xai-org/x-algorithm@a389166`.

Whether any one person sees this comes down to what they have been liking
and replying to lately, which is on their side and nobody can read it from
here.

## The three layers

**Layer A, retrieval sources.** Whether any request can reach the post at
all.

**Layer B, index membership.** What Layer A searches, and for how long a
row survives. A dump window is not a served corpus.

**Layer C, in-slate modifiers.** Things that change standing for a post
already in the slate. They open and close nothing.

Job 1 prints A, then safety flags, then B, then C only when a modifier
fires. See `SKILL.md` for templates and token rules.

## Layer A: the sources

The For You candidate pipeline registers seven sources
(`home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:315-323`).
Three are on by default for a For You request.

| Source | Default on For You | Reaches non-followers | Enable condition | Cite |
|---|---|---|---|---|
| Thunder | on | No. Follower graph only | `!query.has_cached_posts`; request built from `query.user_features.followed_user_ids` | `home-mixer/sources/thunder_source.rs:25-27, 30` |
| SimClusters ANN | on | Yes | `EnableSimclustersSource` (default `true`, `param.rs:48-53`) and `!in_network_only` and `!has_cached_posts` and `has_post_signals(query)` | `home-mixer/sources/simclusters_source.rs:88-93` |
| Phoenix retrieval | on | Yes | `EnablePhoenixSource` and (not a topic request, or a bulk topic request) and `!in_network_only` and `!has_cached_posts` | `home-mixer/sources/phoenix_source.rs:62-67` |
| Phoenix topics | not on a For You request | Yes, on the topics surface | `is_topic_request()` and not bulk and `!in_network_only` and `!has_cached_posts`. No enable param of its own | `home-mixer/sources/phoenix_topics_source.rs:25-30` |
| TweetMixer | off | n/a | `EnableTweetMixerSource = false` | `home-mixer/params/param.rs:41-46` |
| Phoenix MoE | off | n/a | `EnablePhoenixMOESource = false` | `param.rs:134-139` |
| CachedPostsSource | conditional | replay only | not creator-relevant | |

`PopularTopicsSource` returns hardcoded `false` and is not in the sources
vec (`home-mixer/sources/popular_topics_source.rs:55-57`).

Topics is a separate product surface (`SURFACE_TOPICS = "topics"`,
`home-mixer/scored_posts_server.rs:21, 147-155`), not a lane inside For You.
Do not print Topic feeds on a Job 1 run unless the user asked about reach
beyond For You.

Both Phoenix retrieval and SimClusters require `!in_network_only` and
`!has_cached_posts`. A For You claim is not automatically a logged-in home
timeline claim.

## Layer B: dump window vs served corpus

A dump window (`phoenix-rankall/src/config/mod.rs:139-188`) says how long
rankall keeps a row. It says nothing about whether anything reads it.

A served corpus is the fixed list of parquet artifacts named by
`RetrievalDataset` (`phoenix/xrex/data/retrieval_dataset.py:229-285`). The
Phoenix retrieval service searches those and only those.

The published default is `HOME` alone
(`phoenix/xrex/inference/model_runner.py:543`;
`phoenix/xrex/inference/launch_inference.py:496-501`). `HOME` is
`1fav_1day`. There is no `post_creation` member.

Rankall cannot merge them. `prefix_window_router` routes a record only to
windows whose `name` equals the record's `index_name`
(`phoenix-rankall/src/store/base.rs:983-991`). A row written with
`indexName = "post_creation"` can never land in a `1fav` window.

The 48-hour feed age gate (`MAX_POST_AGE = 48 * 60 * 60`,
`home-mixer/params/config.rs:36`; `age_filter.rs:16-20`) caps every For You
candidate. There is no video exemption. `VideoFilter` only runs when the
client sets `exclude_videos` (`home-mixer/filters/video_filter.rs:8-10`)
and it removes videos when it runs.

Never print a dump window as a stranger-reach duration. Full index table:
[index-map.md](index-map.md). Boundary list: [what-is-not-published.md](what-is-not-published.md).

## The exclusion block

Shared by every write in the `Main` and `Topic` pipelines
(`phoenixRankAllCandidateProcessor.strato:430-455`). Evaluated in this
order, first match wins:

1. `isCommunityPost` (`:430`, helper at `eventProcessing.strato:242-244`)
   reads `post.communities.nonEmpty`
2. `isReply` (`:437`, helper at `eventProcessing.strato:238-240`) reads
   `coreData.reply.nonEmpty`
3. `isRepost` (`:431`, helper at `eventProcessing.strato:175-180`) reads
   `coreData.share.nonEmpty`
4. `shouldDropPost = shouldDropPostByVF || isAdultPost` (`:438-440`)

A community post that is also a reply reports community, not reply. A reply
that is also NSFW reports reply, not NSFW.

The local at `:438` is named `isAdultPost` but is bound to
`eventProcessing.isNsfwPost(...)`, which reads only `metadata.isNsfw`
(`eventProcessing.strato:318-326`). The adjacent `isAdultPost` helper
(`:308-316`) reads `isNsfw || isAdult` and is not called here.

A quote post is not a repost for this block. `isRepost` reads
`coreData.share`. The quoted post is a separate tweetypie field
(`eventProcessing.strato:418-423`). Treat a quote as an original for
Layer A and B. Do not make a ranking-weight claim about a quote: whether
tweetypie sets `source_tweet_id` on a quote is not in this repo
(`home-mixer/candidate_hydrators/core_data_candidate_hydrator.rs:97`).

## Two NSFW escapes

`search_unfiltered` is written before the block runs (`strato:433-435`),
gated on `eventSource == Fav` and not community and not repost, plus
`favoriteCount >= 1` (`:49`). Replies and NSFW posts with a like are
written. It has no window and no `RetrievalDataset` member. Reference file
only. Never Job 1 output.

Inside `shouldDropPost`, if `hasImmersiveVideo` and `eventSource == Fav`
and `isAdultPost`, the code calls `buildNsfwVideoIndex`,
`buildMetadataDump`, and `buildMMEmbMetadataDump` (`:448-451`).
`buildMetadataDump` (`:321-340`) sets no `indexName`. `SidTailProcessor`
defaults missing `index_name` to `"metadata"` (`sid_tail_processor.rs:71`)
and accepts it.

So a NSFW original with any immersive video (media type only, no duration
test), at least one like, and an author strictly under 1,000 followers can
enter `tail`. A 5-second NSFW clip can dump metadata and feed `tail` while
failing `nsfw_video` (whose builder checks `hasValidImmersiveVideo` at
`:294`).

A VF drop that is not NSFW takes the else branch at `:452-453` and is
discarded entirely. A VF drop is total.

A post flagged NSFW reaches no `post_creation`, no `1fav`, no `32fav`, no
topic index.

## Video gate

`hasValidImmersiveVideo` (`eventProcessing.strato:389-404`):

- `entities.exists { hasVideo }` AND
- `entities.forall { isAcceptedVideoType AND durationMillis > minLongVideoDurationMillis }`

`minLongVideoDurationMillis = 10 * 1000` (`eventProcessing.strato:24`).
Exactly 10,000 ms is excluded. One long video plus a photo fails the
`forall`. Call sites sit inside the else branch of the exclusion block, so
a reply with a two-minute video enters nothing.

`hasImmersiveVideo` (`:379-387`) is a media-type check with no duration
test, used for evergreen writers and the NSFW escape.

## Tail

`PipelineKind::SidTail` is implemented (`config/mod.rs:127-133`). Window
`WindowConfig::new("tail", 24)` (`:187`).

Gate (`sid_tail_processor.rs:71-92`):

- missing `index_name` becomes `"metadata"`
- skip when `followers >= tail_max_author_followers` (default 1000), so
  strictly under 1,000
- `tail_min_fav_count = 0`, so the fav check is skipped. No like required.

`SidClient` skips posts younger than `sid_min_post_age_seconds = 180.0`
(`config/mod.rs:66-67`; `phoenix-rankall/src/sid/client.rs:81-85`).

Cold start is `(followers as i64) <= 1000`. Tail skips at `followers >= 1000`.
At exactly 1,000 followers a creator has the cold-start lift and not the
tail file.

`TAIL` is a real dataset type (`retrieval_dataset.py:276-280`) and it is
not in the published default. Layer A state is `UNPROVEN`, not `OPEN`.

## SimClusters preconditions

`home-mixer/sources/simclusters_source.rs`:

- `ANN_MIN_SCORE = 0.0` (`:30`) and `POST_ANN_MIN_SCORE = 0.5` (`:35`) are
  two different constants. Use `POST_ANN_MIN_SCORE`.
- `ANN_MAX_POST_CANDIDATE_AGE_HOURS = 48` (`:33`).
- `enable()` requires `has_post_signals(query)` (`:88-93`).
- `has_post_signals` is true if either explicit or implicit engagement
  lists are non-empty (`:139-147`). Implicit means dwells and clicks, not
  only likes and replies.
- `MinFavoriteCount = 8` for a persistent embedding
  (`simclusters/simclusters_v2/summingbird/common/Configs.scala:65`).
- Half-life is 8 hours (`Configs.scala:39`). A second 8-hour half-life
  exists as a training label (`phoenix/xrex/data/recsys/recsys_batch.py:47`).
  Neither is a ranking-time decay on the post's score. Do not say "the only
  real engagement half-life."
- NSFW authors get no out-of-network SimClusters reach
  (`oon_nsfw_simclusters_filter.rs:19-23`).
- Replies and reposts are CLOSED: `OONRetweetReplyFilter` drops
  out-of-network replies and reposts, and any reply with empty ancestors
  (`oon_retweet_reply_filter.rs:13-18`). Only Thunder populates ancestors
  (`thunder_source.rs:92-97`).

## Phoenix topics (Jobs 2 and 4, and the reference files)

Entry: `build1FavTopicIndex` is called only in `case Fav` (`strato:460`),
after the full exclusion block. Write only when `topicEntityIds.nonEmpty`
(`strato:149`).

Author-consistency gate
(`eventProcessing.strato:586-604`): option 0 unfiltered; options 1 and 2 a
curated author allowlist; options 3, 4, 5 post-history analysis.

Constants (`eventProcessing.strato:461-465`): `numRecentPostsToAnalyze = 15`,
thresholds 0.90 / 0.75 / 0.50 for options 3 / 4 / 5.

Live default is `PostBased50Pct`, option 5 (`param.rs:103-108`;
`home-mixer/models/candidate_features.rs:70-84`).

A post can carry multiple categories, so percentages can sum above 1.0.
The gate is "this category appears on at least half of those 15 posts."
The denominator is the count of originals and quotes found, up to 15.
Never say "8 of 15" as a fixed number.

Serving side: a post is retrievable under a topic only if its bitmap and
the request's bitmap share at least one of 86 bits
(`phoenix/xrex/models/recsys_two_tower_serving_filters.py:104-110`);
unmatched posts get an all-zero bitmap
(`phoenix/xrex/inference/serving_filters_runner.py:161-162`); topic
filtering is off by default at the serving layer
(`enable_topic_filter: bool = False`, `serving_filters_runner.py:58`).
State the index-side gate as live and the serving-side filter as present
but default-off. Never merge them.

Two hardcoded topic injections bypass the author filter
(`strato:191-247`). Reference file only. Do not turn this into advice.

Open question: `getAuthorRecentOriginalAndQuotePosts`
(`eventProcessing.strato:467-505`) reads
`recommendations/twistly/userRecentEngagedTweets` and sorts by a field
filled from `tweet.engagedAt`. The function name says these are the
author's own posts; the store name says engaged posts. The producer is not
in this repo. State the gate with this sentence attached: the published
code reads a store of the author's recent posts; which posts that store
holds is not published.

## Layer C modifiers

Only five remain in Job 1 output, and only when they fire. See `SKILL.md`.

Cold-start constants (`param.rs:621-656`): impression threshold 1000, slot
min 15, slot max 16, follower cap 1000, max post age 86400 seconds,
position ratio 0.85. `cold_start_target` picks a uniform random index in
`lo..hi` (`author_cold_start.rs:130-139`); with min 15 and max 16 that
range holds one value. Position gate is the top 85 percent of the non-zero
pool (`:165-179`).

Dormant. Never report as live: `PreviouslySeenPostsBackupFilter` (hydrator
built as `_impressed_posts_hydrator`, never registered,
`phoenix_candidate_pipeline.rs:277-279` versus `:224-275`);
`NewUserMinEngagementFilter` (`param.rs:779-782`);
`InventoryHoldoutFilter` (`param.rs:916-937`); `EnableMpnScoring`
(`param.rs:253-258`); dwell-regret scoring (`ValueModelMode = "weighted"`,
`param.rs:450-455`); the new-viewer OON crush
(`NewUserAgeThresholdSecs = 0`, `param.rs:272-277`).

Live but reference-file only: `EnableServedFilterAllRequests` defaults
`true` (`param.rs:909-914`), so `PreviouslyServedPostsFilter` runs on every
request, excluding the last 100 served ids for 10 minutes
(`param.rs:1009-1020`). Not creator-influenceable.

Request-time visibility filtering (`phoenix_candidate_pipeline.rs:398-421`)
is a second application over posts that already survived the index-time
pass. Do not print it as a Layer C row. The safety-flag block above Layer B
is the precondition.

An in-network exploration term exists at serving time
(`ranking_scorer.rs:176-177, 465-466`;
`PostUnexploredWeightInNetworkOnly` default `true`, `param.rs:370-374`).
There is no serving check of age or view-to-follower ratio. The size of
the term is `P(unexplored)` from a checkpoint that does not ship. Do not
print this from draft metadata.

DPP zeroes near-duplicates inside one viewer's ranked request from
embeddings (`vm-ranker/scoring/dpp_model.rs:147-152`) and has no access to
the draft. Negative compression is a function of predicted mute and report
probabilities (`ranking_scorer.rs:525-533`). Neither is a Layer C row.
The J-rules stay; they feed the receipt line and the ladder only.

## The retrieval mechanism

Phoenix retrieval is a learned two-tower embedding retrieval with a
brute-force dense dot product, not a heuristic and not a filtered index
scan.

- The candidate index is baked into the checkpoint as `post_embeddings`
  and loaded verbatim (`phoenix/xrex/inference/model_runner.py:4336-4353`).
- Scoring is a full `[B,D] x [D,N]` matmul against every row, then a GPU
  top-k (`phoenix/xrex/models/recsys_two_tower_model.py:1362-1368`;
  top-k at `:1334-1344`).
- The query is the viewer's action sequence, built server-side from the
  gRPC `UserActionSequence`
  (`phoenix/crates/serving/xai-recsys-engine/src/util.rs:83-174`, window
  at `:96-97`).
- History post ids are hydrated into semantic ids by an external service
  (`phoenix/crates/serving/xai-recsys-engine/src/python.rs:3032-3049`).
- A user-prefix token carries country, language, state, gender, age, DMA,
  and installed apps (`phoenix/xrex/data/recsys/feature_config.py:72-100`).
  No learned per-user id embedding in production retrieval.
- The final user vector is L2-normalised
  (`recsys_two_tower_model.py:1300-1301`).

Which rows it matmuls against is the thing this kit is about. The rows are
whatever `RetrievalDataset` members the service was launched with, and the
published default is `HOME` alone.

## What is not in the retrieval model

Verified absent from `phoenix/xrex/data/recsys/feature_config.py`: post
text length, hashtags, mentions, links or URLs, post language, media
presence or count, and any engagement-bait signal. Language exists only as
a viewer attribute (`userLanguageCode`, `feature_config.py:73`). The only
link handling anywhere is `remove_tco_links` in the embedding renderer
(`grox/flows/mm_emb/renderer.py:10-11`).

The ranking wire format does carry `has_media`, `is_reply`, `is_retweet`,
and `is_quote` as booleans (`recsys.proto:1105-1112`). Those features are
absent from the retrieval feature config, and `has_media` is present on
the ranking side. `has_link` is absent from both. Do not say "no media
feature anywhere."

Images and video frames are rendered into the embedding input that
produces the semantic id (`grox/flows/mm_emb/renderer.py:76-92, 107-140`),
and quoted posts are appended (`:35-45`).

## Engagement counts are log2 bucketed

`phoenix/xrex/models/recsys_model.py:138-145`:

```
counts_f = maximum(raw_counts, 1.0)
bucket   = floor(log2(counts_f)) + 1
bucket   = clip(bucket, 0, max_bucket)
bucket   = where(raw_counts <= 0, 0, bucket)
```

Caps (`recsys_model.py:128-135`): fav 18, reply 13, repost 15, quote 13,
view 25. `ENGAGEMENT_COUNT_NUM_BUCKETS = 32` (`:128`).

1 like to 2 likes is the same size step as 128 to 256. Counts between
boundaries are invisible. Past roughly 2^18 favs and 2^25 views nothing
new is seen. Post age is linear 60-minute buckets to 4800 minutes then one
overflow bucket (`recsys_model.py:93-125`).

## Worked example 4: NSFW original, 30-second video, under 1,000 followers

Internal only: exclusion reports NSFW, not video. `post_creation`, `1fav`,
`32fav` BLOCKED. Phoenix CLOSED. SimClusters CLOSED if the author is
NSFW-labelled. Thunder OPEN. Qualifying video plus a like can write
`nsfw_video` (UNPROVEN corpus). Any video plus a like plus followers < 1000
can write `tail` via the metadata escape (UNPROVEN). `search_unfiltered`
is written (reference only). Cold start eligible if views < 1000.

Job 1 prints: Phoenix CLOSED; tail UNPROVEN (not BLOCKED), and the tail
reason names a like plus any video, not "no likes needed"; Thunder OPEN
with no ranking-weight claim; safety UNKNOWN unless a warning was
reported; Layer B BLOCKED on post_creation / 1fav / 32fav; tail UNPROVEN;
`nsfw_video` UNPROVEN citing `IMMERSIVENSFW`, not the regular video files;
right column `up to 48 h if the video files are switched on, which is not published`.
No 720 in the output. No-edit is not allowed: the mark is the lockout.

## Unresolved questions (stay unresolved)

See the list in [what-is-not-published.md](what-is-not-published.md). Where
any is load-bearing for an output line, say the mechanism is not in the
published code and stop.
