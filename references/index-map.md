# Index map

Dump windows and serving corpora are different things. This file is the
full table. Job 1 never prints a dump-window number as feed reach.

Source commit: `xai-org/x-algorithm@a389166`.
Structured twin: [index-map.json](index-map.json).

## Arm boundaries

`window_configs()` at `phoenix-rankall/src/config/mod.rs:139-188`.

| Arm | Lines | Implemented |
|---|---|---|
| Main | `:141-156` | yes |
| Topic | `:157-165` | yes |
| Metadata | `:166-170` | yes |
| MmMetadata | `:171-175` | no (`is_implemented` `:127-133`) |
| Sid | `:176-186` | yes |
| SidTail | `:187` | yes |
| Analysis / Ads | `:188` | Ads no; Analysis yes |

Do not present `MmMetadata` as live. This table proves which windows exist.
It proves nothing about which corpora are searched. That is the
`RetrievalDataset` enum plus the launched default.

Kafka topic routing (`config/mod.rs:118-124`): `Main | Sid` publish to
`phoenix_rank_all_indexing_event`, `Topic` to
`phoenix_rank_all_indexing_event_backup`, and
`Metadata | MmMetadata | SidTail` to `phoenix_rankall_metadata_event`.

## Serving corpus enum

`phoenix/xrex/data/retrieval_dataset.py:229-285`. There is no
`post_creation` member. There is no `1fav_2day`, no `video_7day`,
`video_14day` or `video_30day`, and no `nsfw_video_7day` or
`nsfw_video_14day`, even though rankall dumps those windows.

| Member | Value | Primary artifact | Line |
|---|---|---|---|
| `PAD` | 0 | none | `:230` |
| `HOME` | 1 | `post_sid_v5_256x6_snapshots/1fav_1day.parquet` | `:231-235` |
| `IMMERSIVE2Day` | 2 | `post_sid_v5_256x6_snapshots/video_2day.parquet` | `:236-240` |
| `RELEVANT_ADS` | 3 | ads | `:241-245` |
| `CAROUSEL_ADS` | 4 | ads | `:246-250` |
| `EVERGREEN` | 5 | `evergreen_video_1825day.parquet` | `:251-255` |
| `IMMERSIVENSFW` | 6 | `nsfw_video_2day.parquet` | `:256-260` |
| `ACTIVE_ADS` | 7 | ads | `:261-265` |
| `IMMERSIVE4Day` | 8 | `video_4day.parquet` | `:266-270` |
| `IMAGINE` | 9 | `imagine_4day.parquet` | `:271-275` |
| `TAIL` | 10 | `post_sid_v5_256x6_tail_snapshots/tail_1day.parquet` | `:276-280` |
| `DPA_PRODUCTS` | 11 | products | `:281-285` |

`ModelRunner.retrieval_dataset_types` defaults to `(RetrievalDataset.HOME,)`
(`phoenix/xrex/inference/model_runner.py:543`). The CLI
`--retrieval_dataset_types` defaults to `[HOME]` with `choices` restricted
to enum members that have a path
(`phoenix/xrex/inference/launch_inference.py:496-501`).

The `post_creation` parquet that exists in the tree is a training artifact:
the global negative pool (`phoenix/xrex/data/parquet_recsys.py:863-865`).
The reference world generator treats the publish-time dump and the
retrieval corpus as two separate files
(`phoenix/reference/world_snapshots.py:33-34`).

## Indexes

Right-column rule: the only positive For You value is `up to 48 h`, and
only for `1fav` via `HOME`. Every other row is `not published`.

| Index | Entry event | Gate | Dump windows (hours) | Pipeline | Serving dataset type | For You column |
|---|---|---|---|---|---|---|
| `post_creation` | PostCreation | exclusion block only, no like | 24 | Main | none | not published |
| `1fav` | Fav | `favoriteCount >= 1` | 24, 48 | Main; 24 in Topic and Sid | `HOME` (`1fav_1day`), default-on | up to 48 h |
| `1fav` (backup) | Fav | no fav check | 24 (Topic arm) | Topic | `HOME.backup_path` | up to 48 h via HOME |
| `32fav` | Fav | `favoriteCount >= 32` | 24 | Main | none | not published |
| `video` | Fav or PostCreation | `hasValidImmersiveVideo` | 48, 96, 168, 336, 720; 48, 96 in Sid | Main, Sid | `IMMERSIVE2Day`, `IMMERSIVE4Day`, not default | not published |
| `nsfw_video` | Fav | NSFW and `hasValidImmersiveVideo` | 48, 168; +336 in Sid | Main, Sid | `IMMERSIVENSFW` (`nsfw_video_2day`), not default | not published |
| `evergreen_video` | EvergreenVideo | `hasImmersiveVideo`, no duration test | 43800 | Main, Sid | `EVERGREEN`, not default | not published |
| `evergreen_nsfw_video` | EvergreenNsfwVideo | same | 43800 | Main | none | not published |
| `evergreen_video_grok` | producer not in repo | unknown | 720 | Main, Sid | none | not published |
| `1fav_topic`, `_option_1..5` | Fav | exclusion block, `>= 1` fav, non-empty filtered topic set | 24 each | Topic | none (topics surface uses its own dispatch) | not published |
| `imagine` | Fav | immersive video and a Grok `grokPostId` | 96 | Sid | `IMAGINE`, not default | not published |
| `tail` | metadata dump | `index_name == "metadata"`, followers strictly `< 1000`, no like | 24 | SidTail | `TAIL` (`tail_1day`), not default | not published |
| `metadata` | Fav or PostCreation, plus the NSFW escape | see [how-reach-works.md](how-reach-works.md) | 24, 48, 72 | Metadata | none | not published |
| `search_unfiltered` | Fav | non-community, non-repost, `>= 1` fav. Replies and NSFW allowed | none in this release | none | none | not published |
| `mm_emb_metadata` family | Fav | exclusion block | 24, 48, 96 | MmMetadata, unimplemented | none | not published |

Cites: `strato` builders as in the table; `config/mod.rs` windows;
`retrieval_dataset.py` members. `1fav` For You column also cites
`age_filter.rs:16-20`.

## Wording for the reference table

1 like: puts the post in the one file a stranger's For You request is
published to search, for 24 hours, with a second 48-hour window kept on
their side. 32 likes: adds another 24-hour file that no published
retrieval dataset type names. Publishing writes a 24-hour file that no
published retrieval dataset type names either.
