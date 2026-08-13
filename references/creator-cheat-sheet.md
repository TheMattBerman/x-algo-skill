# X Algorithm Creator Cheat Sheet

Source: `xai-org/x-algorithm@a389166`. The file citations are in [verified findings](verified-findings.md).

## Read this first

`param.rs` mirrors production-primary feature-switch defaults last synced 2026-08-12. An experiment arm can differ, and every weight multiplies an unpublished predicted probability. These defaults are published constants, not a live-score calculator.

## Price list

**So what:** one person copying your link and sending it to a friend outweighs 40 people liking you. Likes and dwell time, the two things everyone watches, sit at the bottom of the table.

| Action | Default weight |
|---|---:|
| Share via copy link | 20.0 |
| Reply, quote, share via DM | 5.0 |
| Follow author | 4.0 |
| Generic share | 2.0 |
| Repost | 1.0 |
| Like | 0.5 |
| Click | 0.4 |
| Open link | 0.2 |
| Photo expand, video open, VQV | 0.05 |

**So what:** one report cancels 468 likes of work, and a quiet mute hurts almost 2x a block. A post that nets out negative isn't deleted. It sorts under everything else in the feed.

Negative ledger: report -234.0, mute -58.8, not interested -43.2, block -31.2, not dwelled -0.02. Mute is weighted worse than block. A predicted net-negative result sorts below every net-positive result.

## Creator implications

**So what:** an original post shown to someone who follows you back counts about 4x what the same post counts to a stranger. That is the largest single lever available to you, and replies and reposts get none of it.

- Design originals to be useful enough to earn copy-link shares or follows. A mutually followed viewer gets a +15 reply-weight boost on an original, taking reply from 5 to 20.
- Use replies and reposts for relationships and conversation, not an OON discovery strategy. They are structurally excluded from OON retrieval and take the default in-network 0.75 factor.
- A qualifying original from an author with at most 1,000 followers and fewer than 1,000 views can receive the default cold-start lift to index 15. First, eighth, and 32nd likes matter to published indexing or embedding paths.
- Text retrieval is 24 or 48 hours; video can have a longer retrieval tail. There is no generic media bonus. VQV requires video longer than 10 seconds and is unavailable to viewers over the stated follower threshold.
- A link is not a penalty. Verify the destination reputation. Unsafe verdicts can create OON-drop labels.
- Avoid overlapping refreshes if practical. Diversity is per request, not a timer: 1.000, 0.625, 0.4375, 0.34375.

**So what:** your second post of the day starts a third weaker than your first, your third starts less than half as strong, and a reply can't reach anyone who doesn't already follow you. These caps apply before any quality judgment happens.

## Myths corrected

**So what:** most of the advice you've been given about links, verified badges, media, and posting time is not in the code at all.

No generic media multiplier. No intrinsic link penalty. No Premium or verified reach multiplier. Premium's mechanical role is the PageRank seed set. No post half-life. No OON growth through replies or reposts. Block is not the largest published negative weight.
