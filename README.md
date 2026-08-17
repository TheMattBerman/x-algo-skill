# X Reach Check

<p>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/Claude%20Code-plugin-6D28D9?style=for-the-badge" alt="Claude Code Plugin" />
  <img src="https://img.shields.io/badge/Codex-plugin-0F766E?style=for-the-badge" alt="Codex Plugin" />
  <img src="https://img.shields.io/badge/corrected%20against-xai--org%2Fx--algorithm%40a389166-000000?style=for-the-badge" alt="Corrected against xai-org/x-algorithm@a389166" />
</p>

**Will this post get seen, and what would make it get seen more.**

handle in → Last 20
draft in → Rewrite
Under the Hood readout in → Under the Hood

Works in Claude Code and Codex. Paste a handle. Invoke `/x-reach`.

**Built by Matthew Berman.**

`This reads the code they published, not the live knobs they can turn on you tomorrow.`

---

## Last 20

Paste a handle. Two pulls every time: profile and with_replies. You get a status page: handle, mix, STILL OPEN, FILED (PICTURE / TICKET), CLOSED, DO BETTER. It does not write the next post.

```text
@levelsio
1 original   10 quotes   3 thread parts   15 replies

FILED
PICTURE   I liked this chart so much I had to recreate it
          1982 likes · 1741 bookmarks · 307 replies · 73 quotes
          bookmarks are saves, not a published ranking term
          named system someone can send. Copy-link is 40x a like.
          https://x.com/levelsio/status/2089055964309671944

PICTURE   The American College of Cardiology just confirmed this:
          1905 likes · 1103 bookmarks · 90 replies · 14 quotes
          bookmarks are saves, not a published ranking term
          named system someone can send. Copy-link is 40x a like.
          https://x.com/levelsio/status/2088771151484887372

CLOSED
3 thread parts under I appreciate his honesty. They cannot be filed.
15 replies. Followers keep the last 30 for 2 days. Then they evaporate.

DO BETTER
Do not drop the next original next to another original in the same
refresh. Second keeps 62.5 percent, third 43.75, floor 25.

Paste that draft and Rewrite will check it.
The first like is the published ticket into wider distribution.
Followers can see it as soon as you post. That is the floor.

HOW THIS WORKS
An original gets into wider distribution after one like. That is the
file For You is published to search. The feed drops it at 48 hours,
even if it was working. Eight likes builds a lasting picture of who
it is for.
Replies, reposts, and thread parts never enter that file. Followers
can see them for a moment. They cannot grow.
Copy-link is priced 40x a like. Bookmarks and profile taps are not
how it picks winners.
Ask about any line.
```

## Rewrite

Paste a draft. You get the rewrite first: REWRITE, CLOSED or OPEN, THE ONE CHANGE or NO CHANGE, then paste-ready SEND / FOLLOW / REPLY. No score. A thin reply that cannot stand alone stays a reply.

```text
REWRITE

CLOSED    this is a reply
          It can circulate for a moment.
          It has no published path to pick up new distribution.

THE ONE CHANGE
Post this as an original on your timeline, not a reply. Drop the tag-and-like closer.

SEND
X retrieval only searches the one-like file for 48 hours.

FOLLOW
X retrieval only searches the one-like file for 48 hours. Follow if you want the next one.
```

## Under the Hood

Paste a readout from [x.com/i/under_the_hood](https://x.com/i/under_the_hood). Their words get mapped onto published labels. Unmatched strings stay unmatched. No invented visibility score.

```text
UNDER THE HOOD

MATCHED

MATCHED   NSFW_HIGH_RECALL
          account or post label
          Hidden from recommendations to people who do not follow you, and from
          underage, no-age, and logged-out viewers.
          Followers can still see you on this label.

UNMATCHED

NO FILE   visibility score
          No published match. The open code does not name this.
          Stop. Do not invent a score.
```

A post that already died, or a sudden drop to followers only, still has a check. Why this died, and the shadowban check. Extras.

---

## what it is NOT

This is not another algorithm thread.

Algo threads flatten published checks into a reach prediction and a score. They take a yes/no in the code and turn it into a chore list. That is the thing this kit exists to beat.

- **Not a reach predictor.** It will not tell you how many people will see the post.
- **Not a score.** There is no published score to compute, and the kit will not invent one.
- **Not a shadowban detector.** Labels are server-side. The code shows what a label does. It cannot see whether you have one.
- **Not a Monday-advice machine.** If nothing in the lever ladder applies, the answer is No edit.

Follower vs non-follower is a mechanism inside the answer. It is not the product.

The named villain: fortune-telling dressed as research. The kit's job is to stop your agent from guessing and make it read the published code.

---

## six behavior changes

Citations: `xai-org/x-algorithm@a389166`.

1. **Write the post someone would copy and send.**
   The weight on a copy-link share is 40x the weight on a like (20.0 / 0.5). Those weights multiply a predicted chance this viewer does the thing, and the file says the sizes reflect how rare the action is, not an exchange rate in real hearts. Profile click is the true zero. (`home-mixer/params/param.rs:279-281, 282, 311-316, 325-330`)

2. **Write originals that a mutual would actually reply to.**
   When someone who follows you back sees a post you wrote, the reply term on that view jumps from 5 to 20. That is the biggest boost in the file, and it is the reply term only. It is not the whole post counting more. Replies and reposts get none of it. (`home-mixer/params/param.rs:284-289`; `home-mixer/scorers/ranking_scorer.rs:180-193`)

3. **If you want more reach, post an original.**
   A reply can circulate for a moment. It has no published path to pick up new distribution. Neither does a repost or a community post. Out-of-network replies get dropped before scoring. Even your own followers see a reply or a repost at 0.75 of the usual weight. Replies keep a relationship. They do not grow. (`phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato:430-446`; `home-mixer/filters/oon_retweet_reply_filter.rs:13-18`; `home-mixer/params/param.rs:246-251`)

4. **Don't drop three posts into one scroll.**
   Your second post in the same person's refresh starts a third weaker (keeps 62.5%). Your third keeps 43.75%. Keep stacking and it floors at 0.25. This is per request, per person, inside one refresh. Three posts in a day, in different scrolls, do not trigger it. Three posts into one scroll do. (`home-mixer/scorers/ranking_scorer.rs:614-616`; `home-mixer/params/param.rs:222-239`)

5. **Video longer than 10 seconds can enter extra files. The feed still drops it at 48 hours.**
   Publishing writes a 24-hour file. One like is the published ticket into the one file the default For You search loads, still capped at 48 hours by the feed. Video dump windows exist and are longer; they are storage, not feed reach. Qualifying video needs duration strictly greater than 10,000 ms, and every media entity on the post has to be an accepted video (`eventProcessing.strato:24, 389-404`). Whether the feed asks for those video files is not published. VQV weight credit is a separate greater-than-10,000 ms gate (`param.rs:677-682`).

6. **Treat one bad label like it can close every stranger path.**
   Visibility filtering runs at index time. If a flag is set, none of the files below get written (`strato:438-440`; `eventProcessing.strato:246-265`). 28 rules run on everybody. 26 more run on people who do not follow you. An UNSAFE URL writes four drop labels at once, and a verdict change relabels old posts (`botmaker-rules/scarecrow/bot/rtf_tweets_on_unsafe_verdict.bot:17-27`). Pin a BAD or LOW_QUALITY link and the account gets `SPAM_HIGH_RECALL` for 7 days (`PinnedLowQualityOrBadUrl.bot:8-41`); the same check re-runs on every follow you perform (`FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45`). `OneWeekInSecs` is a botmaker DSL builtin not defined in the repo, so 7 days is implied by the constant name.

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

Mutual-follow boost: on originals shown to mutuals, reply weight goes 5 to 20 (+15). That is the reply term only, not a post-level 4x (`param.rs:284-289`; `ranking_scorer.rs:180-193`).

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
- **Which corpora the For You cluster requests.** The published default is `HOME` alone. Production flags are not in the repo (`model_runner.py:543`; `launch_inference.py:496-501`).
- **Mock `12.34`.** Abuse-enforcement follower floor is explicitly a mock "to reduce gaming" (`enforcement_user.yaml:18-20`).
- **Sentinel `9.99`.** Every BDSM per-head operating point is out of range and cannot fire (`bdsm/runtime/sink_policy.yaml:9-31`).
- **Withheld Grox `.j2` prompts** and velocity / anti-automation botmaker rules (`README.md:297, 403-406`). Twenty BotMaker rules made the dump. Not one uses a rate-limit, captcha, or suspend code. The velocity and anti-automation rules are the ones missing.
- **Dead config.** `possibly_nsfw_account` requires 11 matches in a 10-post window and cannot fire (`postToUserLabelRules.strato:363-394`).
- **Params are a mirror.** Last synced 2026-08-12. Experiment arms can differ (`param.rs:1`; `README.md:387-391`).

Some numbers in the dump are fake on purpose. That's why you can trust the rest.

Full kill-switch list (26 OON-only drops), NSFW rollup, URL landmine, and the retrieval map: [references/creator-cheat-sheet.md](references/creator-cheat-sheet.md) and [references/how-reach-works.md](references/how-reach-works.md).

---

## what is not in the retrieval model

Verified absent from `phoenix/xrex/data/recsys/feature_config.py`: post text length, hashtags, mentions, links or URLs, post language, media presence or count, and any engagement-bait signal. Language exists only as a viewer attribute. `has_link` is absent from retrieval and from ranking. `has_media` is absent from retrieval and present on the ranking wire format (`recsys.proto:1105-1112`). Do not say "no media feature anywhere."

Images and video frames still matter: they are rendered into the embedding input that produces the semantic id (`grox/flows/mm_emb/renderer.py:76-92, 107-140`).

The kit names the boundary instead of guessing past it. Full list: [references/what-is-not-published.md](references/what-is-not-published.md).

| In the published code | Not in the published config |
|---|---|
| `1fav` / `HOME` is the default stranger corpus | Whether production For You also requests `TAIL`, video slices, imagine, or evergreen |
| A publish-time file is written at post create | Any loader that searches that file |
| `tail` is written for authors under 1,000 followers | Whether For You asks for `TAIL` |
| Video dump windows exist | Those windows as feed reach; the feed still cuts at 48 hours |

---

## honest limits

The kit refuses to fake certainty. That refusal is the credibility engine.

Whether any one person sees this comes down to what they have been liking and replying to lately, which is on their side and nobody can read it from here.

- **It cannot predict reach.** Open sources are eligibility. They are not a forecast.
- **It cannot compute a score.** No trained Phoenix checkpoints ship. The published weights multiply a `P(action)` you cannot compute from the repo (`README.md:32`; `phoenix/README.md:59-65`).
- **It cannot detect whether you are labeled.** Labels are server-side. The code only shows what a label does. The shadowban check will say this first, every time.
- **It cannot see which corpora the For You cluster requests.** The published default is `HOME` alone. Everything else is a setting they did not publish.
- **`param.rs` is a mirror.** It mirrors production-primary defaults, last synced 2026-08-12. Your experiment arm can differ (`param.rs:1`; `README.md:387-391`).
- **Some numbers in the dump are fake on purpose.** `12.34` is a mock follower floor (`enforcement_user.yaml:18-20`). `9.99` is a sentinel that cannot fire (`bdsm/runtime/sink_policy.yaml:9-31`). The kit will not treat those as live knobs.
- **Grox rubric prompts and the velocity rules are withheld.** The kit will not invent a rubric X did not publish (`README.md:297, 403-406`).
- **"No edit" is a first-class answer.** If the draft is not leaving reach on the table, the kit says so. It will not manufacture a rewrite to look useful.

Check the code yourself. Every line reference is there to make that easy.

The same numbers, as three posters: [layers](assets/cheat-sheet/x-algorithm-cheat-sheet-p1.png), [price list](assets/cheat-sheet/x-algorithm-cheat-sheet-p2.png), [six Monday moves plus what they held back](assets/cheat-sheet/x-algorithm-cheat-sheet-p3.png).

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

Restart the agent. Paste a handle. Invoke `/x-reach`. A pasted draft runs Rewrite. A pasted Under the Hood readout runs Under the Hood.

Paste a handle for Last 20. No CLI flags required. The handle scan shells out to an existing scraper if one is installed. It does not store an Apify token in this repo.

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

X Reach Check owns the reach question: will this post get seen, and what would make it get seen more.

---

## license

MIT. Fork it. No upsell, no catch.

---

Built by [Matt Berman](https://twitter.com/themattberman).

- Twitter/X: [@themattberman](https://twitter.com/themattberman)
- Newsletter: [Big Players](https://bigplayers.co)
- Agency: [Emerald Digital](https://emerald.digital)

---

Stop guessing from the like count. Check what can still pick up new distribution.
