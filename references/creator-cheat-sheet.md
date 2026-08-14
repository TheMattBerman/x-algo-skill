# Discovery gates, kill switches, and shadowban surface

Canonical creator reference for Jobs 1–3. Every number is a `file:line` in
[github.com/xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) @ `a389166`.
Doors model: [doors.md](doors.md). Full arbitration: [verified-findings.md](verified-findings.md).

Stop optimizing for likes. The ranking code does not.

## six things to change

1. **Write the post someone would copy and send.** the weight on a copy-link share is 40x the weight on a like (20.0 / 0.5). follow weight is 8x like weight (4.0 / 0.5). each weight multiplies an unpublished predicted probability; the file comment says the sizes reflect rarity as well as value (`param.rs:279-281`). `param.rs:282, 325-330, 345-350`

2. **Write originals that a mutual would actually reply to.** on originals shown to mutuals, reply weight jumps 5 → 20. reply term only, not the whole post. replies and reposts get none of it. `param.rs:284-289` · `ranking_scorer.rs:180-193`

3. **If you want strangers, post an original.** replies, reposts, and community posts never enter the out-of-network index. OON replies drop pre-scoring. even followers see a reply or repost at 0.75. `phoenixRankAllCandidateProcessor.strato:441-446` · `oon_retweet_reply_filter.rs:13-18` · `param.rs:246-265`

4. **Don't drop three posts into one scroll.** second post in the same refresh keeps 62.5%; third keeps 43.75%; floors at 0.25. per request / per refresh, not per day. `ranking_scorer.rs:614-616` · `param.rs:222-239`

5. **If it needs to live past Tuesday, make it video. Longer than 10 seconds.** text is 24–48h. `video` windows: 48 / 96 / 168 / 336 / 720h. `nsfw_video` windows: **only** 48h and 168h (`phoenix-rankall/src/config/mod.rs:146-152`). both require duration **strictly >** 10,000 ms (`eventProcessing.strato:24, 389-405`). evergreen can sit 5 years; published evergreen writers check media type only (no duration test; promotion job not in repo) (`phoenix-rankall/src/config/mod.rs:139-156`). VQV **weight** credit is a separate >10,000 ms gate (`param.rs:677-682`).

6. **Treat one bad label like it can close every stranger door.** 28 + 26 VF rules. UNSAFE writes four OON drops and can relabel old posts (`rtf_tweets_on_unsafe_verdict.bot:17-27`). pin a BAD or LOW_QUALITY URL → account `SPAM_HIGH_RECALL` for 7 days; re-check on every follow (`PinnedLowQualityOrBadUrl.bot:8-41` · `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`). `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo; 7 days is implied by the constant name.

## the price list

Each weight multiplies an unpublished predicted probability. relative pricing, not an exchange rate. experiment arms can differ. this is the open-sourced code, not live production weights. `param.rs:1` · `README.md:387-391`

The weight on a copy-link share is 40x the weight on a like (20.0 / 0.5). The weights "reflect a combination of how much an action is valued in ranking and typical propensities of these actions across the X network (e.g. negative feedback is overall rare)" (`home-mixer/params/param.rs:279-281`).

the single biggest boost in the file fires when someone who follows you back sees an original post: reply weight jumps 5 → 20. that is the reply term, not the whole post. replies and reposts get none of it. the dwell half of the same experiment shipped at 0.0. `param.rs:284-295` · `ranking_scorer.rs:180-193`

| action | weight | cite |
|---|---:|---|
| copy-link share | **20.0** | `param.rs:325-330` |
| reply | 5.0 | `param.rs:283` |
| quote | 5.0 | `param.rs:332` |
| DM share | 5.0 | `param.rs:319-324` |
| follow the author | 4.0 | `param.rs:345-350` |
| generic share | 2.0 | `param.rs:318` |
| repost | 1.0 | `param.rs:296` |
| like | **0.5** | `param.rs:282` |
| click | 0.4 | `param.rs:309` |
| open a link | 0.2 | `param.rs:310` |
| photo expand | 0.05 | `param.rs:297-300` |
| video open | 0.05 | `param.rs:303-308` |
| video quality view | 0.05 | `param.rs:317` |
| unexplored in-network original (≤24h, views < 3% of followers) | 0.02 | `param.rs:351-356` · `recsys_batch.py:45-47` |
| continuous dwell | 0.004 | `param.rs:375-380` |
| binary dwell | **0.0** | `param.rs:331` |
| profile click | **0.0** | `param.rs:311-316` |

## the penalty ledger

X's code weighs one report as heavily as 468 likes (-234 / 0.5) in weight space. the file comment says negatives are huge because they are rare (`param.rs:279-281`). a predicted report of 0.01 is not 468 likes. `param.rs:442`

| action | weight | cite |
|---|---:|---|
| report | **-234.0** | `param.rs:442` |
| mute the author | **-58.8** | `param.rs:436-441` |
| not interested | -43.2 | `param.rs:424-429` |
| block the author | -31.2 | `param.rs:430-435` |
| not dwelled | -0.02 | `param.rs:443-448` |

mute is priced worse than block. these are predicted probabilities that *this viewer* takes the action, not a rap sheet. a net-negative post is not deleted. it gets squeezed into `[0, 0.001]` and sorts under everything that isn't hated. `ranking_scorer.rs:525-533` · `config.rs:40`

the report-to-like job (Agatha) only counts likes from accounts with no follow edge in either direction. likes from people you follow or who follow you do not offset blocks and reports. `agatha/.../Favs.scala:15-19, 51-68, 59-62`

## discovery gates (1 / 8 / 32 + Thunder + retention)

| gate | what it opens | cite |
|---|---|---|
| 1 like | 1-fav retrieval index | `phoenixRankAllCandidateProcessor.strato:78-92` |
| 8 likes | persistent SimClusters embedding. ANN drops below 0.5. 8h half-life — the only real engagement half-life in the release. | `Configs.scala:39, 65` · `simclusters_source.rs:35` |
| 32 likes | 32-fav retrieval index | `phoenixRankAllCandidateProcessor.strato:62-76` |
| reply / repost / community | never indexed out-of-network. dropped pre-scoring if they leak in. | `phoenixRankAllCandidateProcessor.strato:441-446` · `oon_retweet_reply_filter.rs:13-18` |
| Thunder (followers) | 50 most recent originals, 30 most recent replies, 2-day retention, 1,200 posts returned. | `thunder/config.rs:1-6` · `thunder/args.rs:48-49` |
| text | 24h and 48h retrieval | `phoenix-rankall/src/config/mod.rs:139-156` |
| video | 48 / 96 / 168 / 336 / **720h** when duration **>** 10,000 ms (`eventProcessing.strato:24, 389-405`). evergreen **5 years** (media type only in published writers; no duration test; promotion job not in repo). Grok evergreen 30 days. | `phoenix-rankall/src/config/mod.rs:139-156` · `eventProcessing.strato:24, 389-405` |
| nsfw_video | **only** 48h and 168h (not 96/336/720h). same duration gate as `video`. | `phoenix-rankall/src/config/mod.rs:151-152` · `eventProcessing.strato:24, 389-405` |
| sub-10s video | does **not** enter the `video` 48h–720h or `nsfw_video` 48h/168h indexes (strict `>`; exactly 10,000 ms also out). does **not** claim the same floor for the 5-year evergreen tail. VQV **weight** credit is a separate >10,000 ms gate. | `eventProcessing.strato:24, 389-405` · `param.rs:677-682` |
| feed age | 48h binary gate. no ranking half-life. | `config.rs:36` |

**under 1,000 followers, one original per request can get force-slotted to rank index 15.** it must already sit in the **top 85%** of the non-zero pool. bottom-15% posts are ineligible. replies and reposts are ineligible. cross 1,000 followers or 1,000 views and it is gone. the slot is deterministic at shipped defaults (`random_range(15..16)` is one value). the tail retrieval index uses the same 1,000-follower line. `author_cold_start.rs:86-91, 167-189` · `param.rs:620-663` · `phoenix-rankall/src/config/mod.rs:87-88`

in-network replies and reposts still take the 0.75 haircut, same as a stranger's post. near-duplicates get scored 0.0. a post with no embedding gets a random unit vector. retweet dedup keeps the first arrival, so a repost of your original can knock the original out. `param.rs:246-265` · `ranking_scorer.rs:747-754` · `dpp_model.rs:22-34, 90, 147-150` · `retweet_deduplication_filter.rs:19-26`

## what actually kills you (Door 6)

### followers still see you, nobody else does

visibility filtering is a separate system from ranking. it runs after the top 50. a labeled post can occupy a slot and then vanish. the 51st clean post is already gone. `phoenix_candidate_pipeline.rs:398-421` · `config.rs:17`

28 base rules run for everyone. **26 extra drop-only rules** run only for accounts the viewer does not follow. labels are set membership: score, expiry, country, and holdback are discarded. `registry.rs:101-132, 138-170` · `safety_labels.rs:21-28`

**the 26 out-of-network-only drops** (`registry.rs:141-166`):

tweet: `SPAM_HIGH_RECALL`, `NSFW_TEXT`, `NSFW_HIGH_RECALL`, `NSFW_HIGH_PRECISION`, `NSFW_CARD_IMAGE`, `GORE_AND_VIOLENCE_HIGH_PRECISION`, `DO_NOT_AMPLIFY`, `MALICIOUS_URL`, `FOSNR_ABUSE_INSULTS`

media / flags: DMCA media, geo-restricted media, NSFW user author, NSFW admin author, tweet-level NSFW user flag, tweet-level NSFW admin flag

account: `NSFW_HIGH_RECALL`, `NSFW_HIGH_PRECISION`, `SPAM_HIGH_RECALL`, `COMPROMISED`, `READ_ONLY`, `IMPERSONATION_HIGH_PRECISION`, `NSFW_AVATAR_IMAGE`, `NSFW_BANNER_IMAGE`, `NSFW_NEAR_PERFECT`, `ABUSIVE_HIGH_RECALL`, plus the rule `DoNotAmplifyNonFollowerRule` (`DO_NOT_AMPLIFY_NON_FOLLOWER_USER_DROP`) which reads account label `DO_NOT_AMPLIFY` — it is not itself a label

The "followers still see you" carve-out (`require_non_follower = true`) ships on **only two** rules: `ABUSIVE_HIGH_RECALL_USER_DROP` (`user_label_drops.rs:101-106`) and `DO_NOT_AMPLIFY_NON_FOLLOWER_USER_DROP` (`:113-119`). Adjacent `NSFW_NEAR_PERFECT_USER_DROP` ships `false` (`:107-112`) and drops for followers too.

**four FOSNR labels also hide you from followers:** hateful conduct, violent speech, abuse, civic integrity (`FOSNR_HATEFUL_CONDUCT`, `FOSNR_VIOLENT_SPEECH`, `FOSNR_ABUSE`, `FOSNR_CIVIC_INTEGRITY`) at `tweet_label_drops.rs:126-149` (base, `registry.rs:115-118`). insults-level FOSNR is out-of-network only. author self-view is exempt. Within the same file block `:47-93`, only PDNA / BOUNCE / SPAM / FOR_EMERGENCY_USE_ONLY are base (`:52-69, 88-93`; `registry.rs:111-114`). `SPAM_HIGH_RECALL_DROP`, `NSFW_TEXT_DROP`, and `NSFW_HIGH_RECALL_DROP` sit in that block (`:70-87`) but register OON-only (`registry.rs:147, 153-154`).

**NSFW 3-of-5 rollup.** 3 of your last 5 posts labeled `NSFW_HIGH_PRECISION` inside 60 days applies an account-level label for 7 days. the exclusions block sets `highPageRankOrGreyBadge: false`. Premium / high cred does not save you. more than 2 NSFW-labeled posts in one day also triggers an account-level label. `postToUserLabelRules.strato:396-426` · `ApplyNsfwUserLabel.df:35-40`

### the URL landmine (retroactive)

the algorithm does not penalize having a link. opening a link is +0.2. there is no link boolean in the model's wire format. `param.rs:310` · `recsys.proto:1105-1112`

what it penalizes is destination reputation.

- **UNSAFE** applies four out-of-network-drop labels at once: `SEARCH_BLACKLIST`, `UNSAFE_URL`, `DO_NOT_AMPLIFY`, `MALICIOUS_URL`. `Tweet_Search_Blacklist_RTF_All_UNSAFE_URL_Sources.bot:6, 35-53`
- **BAD** applies `SPAM` (exact `BAD`) or `SPAM_HIGH_RECALL` (fallback). Gate: `GetUrlVerdictForSingleChain(...) MATCHES ".*BAD"` (`Tweet_Spam_High_Recall_RTF_All_Bad_URL_Sources.bot:7, 40-46`) — this file never sees a `LOW_QUALITY` verdict. **LOW_QUALITY** is a separate rule: any hop `GetUrlVerdict == "LOW_QUALITY"` applies `SPAM_HIGH_RECALL` (`LQ_Tweets_With_LQ_URL_Verdict_At_Mention_To_NonFollower_v2.bot:9, 16`).
- verdict changes relabel old posts, capped at 5,000. a link that goes bad later takes the archive with it. `rtf_tweets_on_unsafe_verdict.bot:17-27` · `NSFW_Card_Image_URL_to_Tweet_Verdict.bot:20-22`
- full redirect chains are scored. your shortener's downstream is your reputation. `LQ_Tweets_With_LQ_URL_Verdict_At_Mention_To_NonFollower_v2.bot:9`
- pin a BAD or LOW_QUALITY URL and the *account* gets `SPAM_HIGH_RECALL` for 7 days, re-checked on every follow. `PinnedLowQualityOrBadUrl.bot:8-41` · `FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`. `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo; 7 days is implied by the constant name.

## grox: traction buys scrutiny

Grox is the publish-time judge. named bait policies: `SpamEngagementBaiting`, `SpamEngagementFarming`, `SpamEngagementTrading`, `SpamHashTagAbuse`, `SpamMentionAbuse`. `grox/flows/ptos/state.py:24-70`

traction buys a more expensive trial. deluxe pass at 64 likes. heavier safety pass at 128 likes. `grox/config/config.py:112` · `grox/flows/ptos/constants.py:25`

there is a literal `slop_score` field. `llm_slop_user` becomes a 30-day `SpamHighRecall` user label (out-of-network drop). a reply score >= 0.97 applies `RISKY_HIGH_VIZ_REPLY` for 14 days. `classifier_banger_initial_screen_gemma.py:44-51` · `enforcement_user.yaml:51-56` · `GroxTweetProcessor.bot:8, 24-29`

the rubric prompts are withheld on purpose. "excluded to reduce gameability of the system." do not write "like if you agree / tag 3 friends." that is a named policy, judged by a model you cannot read. `README.md:297, 403-406` · `grox/flows/upa/prompts.py:12`

## myths, and the move

**"links get downranked."** no. opening a link is +0.2. check the destination and do not pin a bad URL.

**"verified boosts your reach."** no ranking multiplier. Premium seeds PageRank, which skips some spam labelers. it is an enforcement skip, not a ranking boost, and it will not save you from the NSFW 3-of-5 rollup. `UserCredV2App.scala:174` · `enforcement_user.yaml:25-31` · `postToUserLabelRules.strato:423`

**"posts have a half-life."** not in the ranker. there is a 48h feed gate. the real half-lives are SimClusters (8h) and the exploration label (8h). post while the cluster embedding is still hot. `config.rs:36` · `Configs.scala:39` · `recsys_batch.py:47`

**"media gets a boost."** no media multiplier. video's edge is retrieval memory: `video` 48h–720h and `nsfw_video` 48h/168h need duration > 10,000 ms (`eventProcessing.strato:24, 389-405`; `config/mod.rs:146-152`); evergreen is separate. VQV weight credit is also >10,000 ms and zeroed for *viewers* over 10,000 followers. `param.rs:297-317, 677-682` · `candidates_util.rs:4, 19-40`

**"X doesn't detect engagement bait."** it does, with named LLM policies. write the post.

**"follower count is a ranking factor."** not a term in the score. it gates cold start (gone at 1k), the tail index, and a cred fallback (>25k when no score exists). convert follows. do not count them. `param.rs:638-643` · `phoenix-rankall/src/config/mod.rs:87-88` · `IsHighPageRankUser.df:12`

**"reply under big accounts to grow."** replies never enter out-of-network. use a reply to earn a follow-back, then post originals those people will copy.

**"blocking hurts more than muting."** reversed. mute is -58.8, block is -31.2. do not write the post people quietly mute. `param.rs:430-441`

## what they held back

They published the map. They kept the parts you'd use to game it. some numbers in this dump are intentionally fake. don't quote `param.rs` as live gospel.

- **no trained Phoenix weights.** training code and synthetic data only. every `P(action)` comes from a model whose learned parameters are absent. `README.md:32` · `phoenix/README.md:59-65`
- **mock `12.34`.** abuse-enforcement follower floor is `12.34`, with the in-file comment: "Prod uses a different follower count floor; this is a mock value to reduce gaming." `enforcement_user.yaml:18-20`
- **sentinel `9.99`.** every bot-detection operating point is `9.99`, out of range for a probability, so it can never fire. `bdsm/runtime/sink_policy.yaml:9-31`
- **withheld Grox prompts.** every `.j2` rubric is excluded on purpose. `README.md:297, 403-406`
- **withheld velocity rules.** 20 published botmaker rules. none uses rate-limit, captcha, or suspend codes. that is the tell. copypasta thresholds live in BigQuery outside the repo. `BBQDuplicateTextProd.bot:8-11`
- **dead config.** `possibly_nsfw_account` requires 11 matches in a window of 10 and cannot fire. `EGREGIOUS_NSFW` and `RECOMMENDATIONS_BLACKLIST` have no drop rule. `postToUserLabelRules.strato:363-394`
- **params are a mirror.** last synced 2026-08-12. live experiments can carry different values. any user can sit in a different arm. `param.rs:1` · `README.md:387-391`

check the code yourself. every line reference is there to make that easy.
