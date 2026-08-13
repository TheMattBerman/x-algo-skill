# X Reach Check

<p>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/Claude%20Code-plugin-6D28D9?style=for-the-badge" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/Codex-plugin-0F766E?style=for-the-badge" alt="Codex Plugin" />
  <img src="https://img.shields.io/badge/corrected%20against-xai--org%2Fx--algorithm%40a389166-000000?style=for-the-badge" alt="Corrected against xai-org/x-algorithm@a389166" />
</p>

**Will this post get seen? Paste it and you get the five doors that can put it in a feed, plus the kill switch that can void all five, closed ones first, plus the one edit that reopens the door that matters. Every call is a yes or no in X's published code, cited to the line.**

Every "how the algorithm works" thread sells you a score. Predicted impressions. A chore list. X did not publish a score. They published gates: this post can enter this index, or it cannot. The threads invent the rest. This kit reads the gates and stops.

Works in Claude Code and Codex. Paste a draft. Invoke `/x-reach`.

**Built by Matthew Berman.**

> **See the output first:** the six doors on [`assets/cheat-sheet/x-algorithm-cheat-sheet-p1.png`](assets/cheat-sheet/x-algorithm-cheat-sheet-p1.png), the price list on [`assets/cheat-sheet/x-algorithm-cheat-sheet-p2.png`](assets/cheat-sheet/x-algorithm-cheat-sheet-p2.png), and the six Monday moves plus what they held back on [`assets/cheat-sheet/x-algorithm-cheat-sheet-p3.png`](assets/cheat-sheet/x-algorithm-cheat-sheet-p3.png).

<p align="center"><img src="assets/demo.gif" alt="X Reach Check: paste a draft, get the doors and the one edit" /></p>

---

**draft in -> five retrieval doors -> top-50 -> kill switch -> doors + the one edit out.**

From that draft, X Reach Check:

- **Maps five retrieval doors** that can put the post in a feed: your followers, plus four stranger paths
- **Checks the kill switch** that runs after the top-50 and can void all five
- **Leads with closed doors**, then the one edit that reopens the door that matters
- **Says No edit** when nothing in the ladder applies, instead of manufacturing advice
- **Cites every call** to a file and line in `xai-org/x-algorithm@a389166`

---

## the core idea: eligibility, not prediction

A stranger's For You is not a vibe and it is not a score. It is a set of published yes/no gates.

Five retrieval doors can put a post in the candidate pool. `TopKScoreSelector` keeps 50. Visibility filtering runs after that, and a labeled post can take a slot and then vanish. The kit tells you which doors this draft is eligible for, which one it just closed, and the one change that reopens it.

That is the whole framework, and it is the part worth stealing even if you never install the kit:

```text
five retrieval doors fill a pool  ->  TopK keeps 50  ->  visibility filtering
                                                          ^
                                                 the kill switch can void all five
```

Every gate is a published yes or no in X's open-sourced code, cited to a line. The kit will not predict how many people see the post. It will not invent a score. When there is nothing to change, it says so.

---

## what it is

A Claude Code / Codex skill. You paste a draft. It runs the doors model in [references/doors.md](references/doors.md).

Four jobs, in this order:

| # | Job | When you ask | What you get |
|---|---|---|---|
| 1 | **Make this post get seen** (primary) | You paste a draft | All six doors, closed first. One judgment line. The one edit, or No edit. A rewrite only when an edit exists. |
| 2 | **Why did my post die** | A live post plus what you saw | Closed / pending / tripped doors ranked against the symptom. Names what cannot be known from the outside. |
| 3 | **Am I shadowbanned** | Sudden follower-only reach | A hard no on detecting a label, then the published kill-switches that produce exactly that pattern. |
| 4 | **Audit recent posts** (thin) | Up to 10 recent posts | One pattern line. No per-post scoring. |

Job 1 is the product. Jobs 2 and 3 are the same model in a different tense. Job 4 is a pattern read, not an audit theater.

Every Job 1 output ends with the same scope line:

`This reads the code they published, not the live knobs they can turn on you tomorrow.`

## what it is NOT

This is not another algorithm thread.

Algo threads flatten published gates into a reach prediction and a score. They take a yes/no in the code and turn it into a chore list. That is the thing this kit exists to beat.

- **Not a reach predictor.** It will not tell you how many people will see the post.
- **Not a score.** There is no published score to compute, and the kit will not invent one.
- **Not a shadowban detector.** Labels are server-side. The code shows what a label does. It cannot see whether you have one.
- **Not a Monday-advice machine.** If nothing in the lever ladder applies, the answer is No edit.

The named villain: fortune-telling dressed as research. The kit's job is to stop your agent from guessing and make it read the gates.

---

## the pipeline

Five retrieval doors fill a pool. Scoring keeps 50. The kill switch runs last.

```text
[1 THUNDER]  [2 COLD START]  [3 PHOENIX]  [4 SIMCLUSTERS]  [5 VIDEO TAIL]
 followers    under-1k bump   strangers    topic neighbors  long tail
      \            |              |              |              /
       +-----------+--------------+--------------+-------------+
                              |
                              v
                   TopKScoreSelector keeps 50
                              |
                              v
                   [6 KILL SWITCH] visibility filtering
                   28 rules + 26 stranger drops
```

Candidates arrive from Thunder, Phoenix retrieval, Phoenix topics, and SimClusters ANN. TweetMixer and Phoenix MoE are off by default (`home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:315-323`; `home-mixer/params/param.rs:11-14, 42-52, 135-138`). After scoring, `TopKScoreSelector` keeps 50 (`home-mixer/params/config.rs:17`; `phoenix_candidate_pipeline.rs:398`). Visibility filtering runs after selection (`phoenix_candidate_pipeline.rs:398-421`).

| Door | Human name | Draft-time state | Cite |
|---|---|---|---|
| 1 | **Your followers (Thunder)** | OPEN by default. Replies and reposts still served, at 0.75. Caps: 50 most recent originals, 30 most recent replies, 2-day retention. Feed age gate is 48h. | `thunder/config.rs:5-6`; `thunder/args.rs:48-49`; `home-mixer/params/config.rs:36`; `home-mixer/params/param.rs:246-251, 260-265` |
| 2 | **A bump while you're small (cold start)** | CLOSED unless original + followers <= 1000 + views < 1000. Else PENDING on top-85% of the non-zero pool (per request). Bottom 15% ineligible. Never silently dropped to render OPEN. | `home-mixer/scorers/author_cold_start.rs:86-91, 167-189`; `home-mixer/params/param.rs:620-663` |
| 3 | **Strangers' For You (Phoenix retrieval)** | CLOSED for replies, reposts, and community posts. Originals PENDING on the first like (1fav) and 32 likes (32fav). Text retention 24h and 48h. | `phoenixRankAllCandidateProcessor.strato:441-446, 62-92`; `oon_retweet_reply_filter.rs:13-18`; `phoenix-rankall/src/config/mod.rs:139-156` |
| 4 | **People already into this (SimClusters)** | PENDING on 8 likes for a persistent embedding. ANN drops under 0.5. 8-hour half-life: the only real engagement half-life in the release. | `Configs.scala:39, 65`; `simclusters_source.rs:35` |
| 5 | **Still findable next month (video long tail)** | CLOSED without video. `video` windows 48 / 96 / 168 / 336 / 720h when duration is **strictly greater than** 10,000 ms (exactly 10,000 ms is also out). `nsfw_video` has only 48h and 168h. That floor does not gate the 5-year evergreen writers (media type only; promotion job not in the repo). | `eventProcessing.strato:24, 389-405`; `phoenix-rankall/src/config/mod.rs:139-156` |
| 6 | **The kill switch (visibility filtering)** | Not a door you open. CLEAR unless a known supplied label or URL verdict applies, then TRIPPED. Never inferred from text. 28 rules run for everyone. 26 more run for people who do not follow you. | `visibility-filtering/rules/registry.rs:101-170`; `safety_labels.rs:21-28` |

Doors 1-5 resolve to **OPEN / CLOSED / PENDING**. Door 6 is **CLEAR / TRIPPED**. PENDING lines name the post-publish signal that unlocks them.

Modifiers do not open or close a door. They only report when they fire:

| Modifier | Rule | Cite |
|---|---|---|
| Author diversity | Per request / per refresh. Multipliers 1.0 / 0.625 / 0.4375 / 0.34375, floor 0.25. Never per day. | `ranking_scorer.rs:614-616`; `param.rs:222-239` |
| DPP near-duplicate | Unselected candidates scored 0.0 at theta 0.65 | `dpp_model.rs:147-150`; `param.rs:608-619` |
| Retweet dedup | Keeps first arrival in source order, not best | `retweet_deduplication_filter.rs:19-26` |
| Negative compression | Net-negative posts squeezed into `[0, 0.001]` | `ranking_scorer.rs:525-533`; `config.rs:40` |

---

## six behavior changes

Citations: `xai-org/x-algorithm@a389166`.

1. **Write the post someone would copy and send.**
   Copy-link is weighted 20.0. A follow is weighted 4.0. A like is 0.5. Continuous dwell is 0.004. Binary dwell is off at 0.0. Profile click is the true zero. The weight on a copy-link share is 40x the weight on a like. Those weights multiply a predicted chance this viewer does the thing, and the file says the sizes reflect how rare the action is, not an exchange rate in real hearts. (`home-mixer/params/param.rs:279-281, 282, 311-316, 325-330, 331, 345-350, 375-380`)

2. **Write originals that a mutual would actually reply to.**
   When someone who follows you back sees a post you wrote, the reply term on that view jumps from 5 to 20. That is the biggest boost in the file, and it is the reply term only. It is not the whole post counting more. Replies and reposts get none of it. (`home-mixer/params/param.rs:284-289`; `home-mixer/scorers/ranking_scorer.rs:180-193`)

3. **If you want strangers, post an original.**
   A reply never enters the stranger index. Neither does a repost or a community post. Out-of-network replies get dropped before scoring. Even your own followers see a reply or a repost at 0.75 of the usual weight. Replies keep a relationship. They do not find you a new one. (`phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:441-446`; `home-mixer/filters/oon_retweet_reply_filter.rs:13-18`; `home-mixer/params/param.rs:246-251, 260-265`)

4. **Don't drop three posts into one scroll.**
   Your second post in the same person's refresh starts a third weaker (keeps 62.5%). Your third keeps 43.75%. Keep stacking and it floors at 0.25. This is per request, per person, inside one refresh. Three posts in a day, in different scrolls, do not trigger it. Three posts into one scroll do. (`home-mixer/scorers/ranking_scorer.rs:614-616`; `home-mixer/params/param.rs:222-239`)

5. **If it needs to live past Tuesday, make it video. Longer than 10 seconds.**
   Text drops out of retrieval in 24 to 48 hours. `video` stays retrievable for 48 / 96 / 168 / 336 / 720 hours when duration is **strictly greater than** 10,000 ms. Exactly 10,000 ms is also out (`phoenix-rankall-strato/lib/eventProcessing.strato:24, 389-405`). `nsfw_video` has only two windows: 48h and 168h (`phoenix-rankall/src/config/mod.rs:151-152`). That duration floor gates those indexes only. Evergreen video can stay 5 years; the published evergreen writers check media type only (no duration test), and the job that promotes a post to evergreen is not in the repo (`phoenix-rankall/src/config/mod.rs:139-156`). Separately, video-quality-view **weight** credit also requires duration > 10,000 ms (`home-mixer/params/param.rs:677-682`). Weight credit, not the index gate.

6. **Treat one bad label like it can close every stranger door.**
   28 rules run on everybody. 26 more run on people who do not follow you. A labeled post can take a top-50 slot and then vanish (`visibility-filtering/rules/registry.rs:101-170`). An UNSAFE URL writes four drop labels at once, and a verdict change relabels old posts (`botmaker-rules/scarecrow/bot/rtf_tweets_on_unsafe_verdict.bot:17-27`). Pin a BAD or LOW_QUALITY link and the account gets `SPAM_HIGH_RECALL` for 7 days (`PinnedLowQualityOrBadUrl.bot:8-41`); the same check re-runs on every follow you perform (`FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`). `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo, so 7 days is implied by the constant name.

---

## the price list

Each weight multiplies an unpublished predicted probability. Relative pricing, not an exchange rate.

The weight on a copy-link share is 40x the weight on a like (20.0 / 0.5). Those weights multiply a predicted chance this viewer does the thing, and the file says the sizes reflect how rare the action is, not an exchange rate in real hearts (`home-mixer/params/param.rs:279-281, 282, 325-330`).

| Action | Weight | File:line |
|---|---:|---|
| share via copy link | **20.0** | `home-mixer/params/param.rs:325-330` |
| reply | 5.0 | `home-mixer/params/param.rs:283` |
| quote | 5.0 | `home-mixer/params/param.rs:332` |
| share via DM | 5.0 | `home-mixer/params/param.rs:319-324` |
| follow the author | 4.0 | `home-mixer/params/param.rs:345-350` |
| generic share | 2.0 | `home-mixer/params/param.rs:318` |
| repost | 1.0 | `home-mixer/params/param.rs:296` |
| like | **0.5** | `home-mixer/params/param.rs:282` |
| click | 0.4 | `home-mixer/params/param.rs:309` |
| open a link | 0.2 | `home-mixer/params/param.rs:310` |
| photo expand | 0.05 | `home-mixer/params/param.rs:297-300` |
| video open | 0.05 | `home-mixer/params/param.rs:303-308` |
| video quality view | 0.05 | `home-mixer/params/param.rs:317` |
| unexplored in-network post | 0.02 | `home-mixer/params/param.rs:351-356` |
| continuous dwell time | 0.004 | `home-mixer/params/param.rs:375-380` |
| binary dwell | **0.0** | `home-mixer/params/param.rs:331` |
| profile click | **0.0** | `home-mixer/params/param.rs:311-316` |

Mutual-follow boost: on originals shown to mutuals, reply weight goes 5 → 20 (+15). That is the reply term only, not a post-level 4x (`param.rs:284-289`; `ranking_scorer.rs:180-193`).

---

## the penalty ledger

The weight on a report is 468x the weight on a like (-234 / 0.5). The same file comment notes negatives are large because they are rare (`param.rs:279-281, 442`). A predicted report of 0.01 is not 468 likes.

| Action | Weight | File:line |
|---|---:|---|
| report | **-234.0** | `home-mixer/params/param.rs:442` |
| mute the author | **-58.8** | `home-mixer/params/param.rs:436-441` |
| not interested | -43.2 | `home-mixer/params/param.rs:424-429` |
| block the author | -31.2 | `home-mixer/params/param.rs:430-435` |
| not dwelled | -0.02 | `home-mixer/params/param.rs:443-448` |

Mute is priced worse than block. Net-negative posts are compressed into `[0, 0.001]`, not deleted (`ranking_scorer.rs:525-533`; `config.rs:40`).

---

## what they held back

They published the map. They kept the parts you'd use to game it.

- **No trained Phoenix checkpoints.** Training code and synthetic data only. Every `P(action)` comes from absent learned parameters (`README.md:32`; `phoenix/README.md:59-65`). The published weights multiply a probability you cannot compute from the repo.
- **Mock `12.34`.** Abuse-enforcement follower floor is explicitly a mock "to reduce gaming" (`enforcement_user.yaml:18-20`).
- **Sentinel `9.99`.** Every BDSM per-head operating point is out of range and cannot fire (`bdsm/runtime/sink_policy.yaml:9-31`).
- **Withheld Grox `.j2` prompts** and velocity / anti-automation botmaker rules (`README.md:297, 403-406`). Twenty BotMaker rules made the dump. Not one uses a rate-limit, captcha, or suspend code. The velocity and anti-automation rules are the ones missing.
- **Dead config.** `possibly_nsfw_account` requires 11 matches in a 10-post window and cannot fire (`postToUserLabelRules.strato:363-394`).
- **Params are a mirror.** Last synced 2026-08-12. Experiment arms can differ (`param.rs:1`; `README.md:387-391`).

Some numbers in the dump are fake on purpose. That's why you can trust the rest.

Full kill-switch list (26 OON-only drops), NSFW rollup, URL landmine, and doors detail: [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md) and [references/doors.md](references/doors.md).

---

## the four jobs

Default is Job 1 when you paste a draft. No CLI flags. Do not treat `scripts/` as the interface.

| Signal | Job |
|---|---|
| Pasted draft / "make this get seen" / pre-publish | Job 1 (primary) |
| "Why did this die" / post + observed symptoms | Job 2 |
| "Am I shadowbanned" / sudden follower-only reach | Job 3 |
| "Audit my last N posts" / pattern across recent posts | Job 4 |

**Job 1** prints the six doors (closed and tripped first), one judgment line, then either `The one edit:` or `No edit:`. The rewrite is omitted when the outcome is No edit. The one edit comes from a fixed lever ladder: reopen a closed door, remove kill-switch risk, name a reuse gap, or avoid a modifier penalty. It will not punch up a hook to fill the slot.

**Job 2** is the same doors, retrospective. It ranks closed / pending / tripped doors against what you observed, and names what cannot be determined from the outside (server-side labels, unpublished `P(action)`, experiment arm, per-request top-85% pool position).

**Job 3** leads with this, then stops burying it:

`I can't see whether X labeled you. What I can do is name which published kill-switch produces exactly the way your reach died.`

Then a capped differential. Top 3 branches by fit, then one collapsed line for the rest. It will not walk all six and it will not claim a diagnosis is confirmed.

**Job 4** is a pattern read across up to 10 posts. Originals-vs-replies mix, same-refresh diversity risk, repeated-format DPP, link-reputation concentration. One next-move sentence. No scores.

---

## install

Clone, then symlink into Claude Code skills:

```bash
git clone https://github.com/TheMattBerman/x-algo-skill.git
cd x-algo-skill
mkdir -p ~/.claude/skills
ln -s "$(pwd)" ~/.claude/skills/x-reach
```

**Upgrading from v2:** remove the old skill entry or you will see both `x-algo-audit` and `x-reach` pointing at the same clone.

```bash
rm ~/.claude/skills/x-algo-audit
```

Restart the agent. Ask it to check which doors a draft can open, diagnose why a post died, or run a shadowban differential. Invoke with `/x-reach`.

Paste a draft for the primary path. No CLI flags required. No API keys.

For campaign or niche-specific drafts, first build a small packet of public
examples. The [source evidence workflow](references/source-evidence.md) records
URLs, audience language, and claims to verify. It does not change a door state
or replace evidence from the published code.

---

## honest limits

The kit refuses to fake certainty. That refusal is the credibility engine.

- **It cannot predict reach.** Five open doors are eligibility. They are not a forecast.
- **It cannot compute a score.** No trained Phoenix checkpoints ship. The published weights multiply a `P(action)` you cannot compute from the repo (`README.md:32`; `phoenix/README.md:59-65`).
- **It cannot detect whether you are labeled.** Labels are server-side. The code only shows what a label does. Job 3 will say this first, every time.
- **`param.rs` is a mirror.** It mirrors production-primary defaults, last synced 2026-08-12. Your experiment arm can differ (`param.rs:1`; `README.md:387-391`).
- **Some numbers in the dump are fake on purpose.** `12.34` is a mock follower floor (`enforcement_user.yaml:18-20`). `9.99` is a sentinel that cannot fire (`bdsm/runtime/sink_policy.yaml:9-31`). The kit will not treat those as live knobs.
- **Grox rubric prompts and the velocity rules are withheld.** The kit will not invent a rubric X did not publish (`README.md:297, 403-406`).
- **"No edit" is a first-class answer.** If the draft is not leaving reach on the table, the kit says so. It will not manufacture a rewrite to look useful.

Check the code yourself. Every line reference is there to make that easy.

---

## more operator kits

X Reach Check sits in the same family as the rest of the agent kit stack:

- [Frontrun](https://github.com/TheMattBerman/frontrun) - paste a URL, get to the angle before your competitors do
- [Loop Kit](https://github.com/TheMattBerman/loop-kit) - turn a recurring job into a supervised first-run loop
- [Slideshow Kit](https://github.com/TheMattBerman/slideshow-kit) - daily brand-DNA carousel engine
- [Creator Breakout Kit](https://github.com/TheMattBerman/creator-breakout-kit) - creator angles and concepts before you pay to produce
- [Meta Ads Kit](https://github.com/TheMattBerman/meta-ads-kit) - Ads Manager clicking into a 2-minute briefing
- [Short-Form Idea Engine](https://github.com/TheMattBerman/shortform-idea-engine) - competitor videos to ranked, brand-fit scripts
- [Brand Shoot Kit](https://github.com/TheMattBerman/brand-shoot-kit) - product URL to a full visual library
- [First 1000 Kit](https://github.com/TheMattBerman/first-1000-kit) - LinkedIn engagement to booked meetings

X Reach Check owns the eligibility lane: whether a post can enter a stranger's feed, before any of the others decide what to say.

---

## license

MIT. Fork it. No upsell, no catch.

---

Built by [Matt Berman](https://twitter.com/themattberman).

- Twitter/X: [@themattberman](https://twitter.com/themattberman)
- Newsletter: [Big Players](https://bigplayers.co)
- Agency: [Emerald Digital](https://emerald.digital)

---

Stop guessing from the like count. Check the doors.
