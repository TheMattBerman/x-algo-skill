# Fixtures

Two harnesses share these files.

`scripts/check-metadata.mjs` is the internal supplied-metadata check.
`scripts/evaluate-reach.mjs` plus `scripts/snapshot-fixtures.mjs` pin
Last 20 / Rewrite / Under the Hood / file-table output. They are not a
reach prediction.

| Fixture | Metadata check | Job output |
|---|---|---|
| `clean-original.json` | PASS | (legacy metadata only) |
| `reply.json` | FLAG | (legacy metadata only) |
| `engagement-bait.json` | PASS | (legacy metadata only) |
| `link-heavy.json` | FLAG | (legacy metadata only) |
| `bare-domain-link.json` | FLAG | (legacy metadata only) |
| `tech-tokens.json` | PASS | (legacy metadata only) |
| `unsafe-verdict.json` | FAIL | (legacy metadata only) |
| `known-label.json` | FAIL | (legacy metadata only) |
| `short-video.json` | FLAG | (legacy metadata only) |
| `original-no-likes.json` | PASS | Phoenix PENDING; names and disposes of `post_creation` |
| `original-under-1000-followers.json` | PASS | tail UNPROVEN, not OPEN |
| `original-exactly-1000-followers.json` | PASS | cold start yes, tail no |
| `quote-post.json` | PASS | treated as original; no ranking-weight claim |
| `reply-with-long-video.json` | FLAG | video BLOCKED on reply |
| `reply-simclusters.json` | FLAG | SimClusters CLOSED |
| `community-and-reply.json` | FLAG | reports community, Thunder prints no state |
| `nsfw-original-with-video-small-account.json` | PASS | 1fav BLOCKED; tail not BLOCKED |
| `nsfw-original-5-second-video.json` | FLAG | nsfw_video fails duration; tail still reachable |
| `vf-drop-not-nsfw.json` | PASS | tail CLOSED |
| `video-exactly-10000ms.json` | FLAG | index gate fails at exactly 10,000 ms |
| `video-10001ms.json` | PASS | right column unpublished 48h; no 720 |
| `video-plus-photo.json` | FLAG | forall fails |
| `clean-original-no-edit.json` | PASS | No edit; Layer C heading omitted |
| `job2-video-died-at-two-days.json` | PASS | 48h gate or two-day slice, not "no qualifying video" |
| `no-qk-answer.json` | PASS | `J-OFF-CATEGORY` does not fire |
| `job4-reply-heavy.json` | (Last 20) | CLOSED on a reply-heavy mix. Thunder 30 / 2-day. |
| `job4-same-pond.json` | (Last 20) | FILED originals, 8-like picture, same-pond in DO BETTER |
| `job4-live-0-like.json` | (Last 20) | STILL OPEN 0-like original |
| `job4-paste-10.json` | (Last 20) | paste fallback, STILL OPEN + DO BETTER |
| `job4-gold-themattberman.json` | (Last 20) | two-pull gold tape. Hits spec section 7. |
| `rewrite-reply-bait.json` | (Rewrite) | reply + bait. SEND drops bait. FOLLOW asks for a follow. |
| `rewrite-thin-reply.json` | (Rewrite) | leave as reply. No variants. |
| `rewrite-clean-original.json` | (Rewrite) | NO CHANGE. SEND keeps the draft. FOLLOW adds a follow ask. |
| `rewrite-profile-tap.json` | (Rewrite) | profile tap becomes a follow ask. |
| `hood-nsfw-high-recall.json` | (Under the Hood) | NSFW_HIGH_RECALL matches. |
| `hood-unmatched-score.json` | (Under the Hood) | visibility score stays unmatched. |
| `hood-mixed.json` | (Under the Hood) | DO_NOT_AMPLIFY matches. visibility score does not. |

```bash
node scripts/check-metadata.mjs --self-test
node scripts/snapshot-fixtures.mjs
```
