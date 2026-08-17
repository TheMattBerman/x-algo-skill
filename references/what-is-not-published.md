# What is published, and what is not

This is the file a skeptic should check first. Every line is a place the
kit says: the machinery is in the published code, and the configuration
that would switch it on for this feed is not published.

Source commit: `xai-org/x-algorithm@a389166`.

Whether any one person sees this comes down to what they have been liking
and replying to lately, which is on their side and nobody can read it from
here.

## The standing test

For every claimed path to a stranger, open the reader, not the writer.
A writer proves a row was produced. Only a loader proves a row is searched.

Today exactly one Layer B row passes that test: `1fav` via `HOME`.

## Mechanism exists, launched config is not in the repo

| Claim | What is published | What is not | Reader cite |
|---|---|---|---|
| Tail is searched on For You | `TAIL` is a `RetrievalDataset` member (`tail_1day`) and `SidTail` is implemented | Whether the For You cluster passes `TAIL` in `--retrieval_dataset_types` | `retrieval_dataset.py:276-280`; `launch_inference.py:496-501`; `model_runner.py:543` |
| Video slices are searched on For You | `IMMERSIVE2Day` and `IMMERSIVE4Day` exist | Same flag. Neither is in the published default | `retrieval_dataset.py:236-240, 266-270`; `model_runner.py:543` |
| NSFW video slice is searched | `IMMERSIVENSFW` exists | Same flag | `retrieval_dataset.py:256-260` |
| Imagine slice is searched | `IMAGINE` exists | Same flag | `retrieval_dataset.py:271-275` |
| Evergreen slice is searched | `EVERGREEN` exists | Same flag, and the producer that emits `EvergreenVideo` is not in the repo | `retrieval_dataset.py:251-255` |

Job 1 prints `UNPROVEN` for all of these and never guesses.

## Written, no matching dataset type

| Claim | What is published | What is not | Reader cite |
|---|---|---|---|
| `post_creation` is searched | Rankall writes it at publish with no like, 24-hour dump window | No `RetrievalDataset` member names it | `retrieval_dataset.py:229-285`; writer at `strato:266-273, 469`; `config/mod.rs:142` |
| `32fav` is searched | Rankall writes it at 32 likes, 24-hour dump window | No `RetrievalDataset` member names it | `retrieval_dataset.py:229-285`; writer at `strato:62-76`; `config/mod.rs:145` |
| Topic indexes are searched on For You | Topic pipeline writes `1fav_topic` and option variants | Topics is a separate surface, not a For You source | `phoenix_topics_source.rs:25-30`; `scored_posts_server.rs:21, 147-155` |
| `search_unfiltered` is consumed | Written on Fav for non-community non-repost posts with a like, including replies and NSFW | No window, no dataset type, no reader found | `strato:46-60, 433-435` |
| `metadata` is searched | Written on Fav or PostCreation, and inside the NSFW escape | No dataset type | `strato:321-340`; `config/mod.rs:167-169` |
| `evergreen_nsfw_video` / `evergreen_video_grok` are searched | Dump windows exist | No dataset type; grok producer not in repo | `config/mod.rs:154-155, 185` |
| `mm_emb_metadata` is live | Window configs exist | `MmMetadata` returns false from `is_implemented()` | `config/mod.rs:127-133, 171-175` |

## Unresolved questions the kit must not close

1. Production `--retrieval_dataset_types` for the For You cluster. Not in
   the repo. (`launch_inference.py:496-501`; `model_runner.py:543`.)
2. Whether a `post_creation` row is ever served under a different corpus
   name. No published loader names it.
3. Whether a quote sets Tweetypie `source_tweet_id`. If it does,
   `retweeted_tweet_id` is set on the ranking side
   (`core_data_candidate_hydrator.rs:97`), `OONRetweetReplyFilter` drops
   out-of-network quotes (`oon_retweet_reply_filter.rs:15-16`), and
   `oon_applies` deboosts them (`ranking_scorer.rs:747-754`). No ranking
   claim about quotes until this is resolved.
4. Whether the topic 15-post history reads authored posts or engaged
   posts. The store is `recommendations/twistly/userRecentEngagedTweets`,
   sorted by a field filled from `tweet.engagedAt`
   (`eventProcessing.strato:467-505, 481, 491, 500-502`). The function is
   named `getAuthorRecentOriginalAndQuotePosts`. The producer is not in
   the repo.
5. Whether a Fav event can carry `favoriteCount == 0`.
   `build1FavIndexBackup` writes `1fav` with no fav check
   (`strato:94-101`, called at `:459`), while the main builder checks
   `>= 1` (`:81`). Nothing in the repo produces the event. Does not change
   the Job 1 line, because the event is a Fav either way.
6. What promotes a post into the evergreen indexes. No producer in the repo.
7. Whether `evergreen_video_grok` has any creator-reachable path. No producer.
8. Whether `search_unfiltered` has a consumer in this release. No window,
   no dataset type, no reader found.
