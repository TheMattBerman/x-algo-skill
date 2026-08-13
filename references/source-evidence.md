# Source Evidence Pack

Use this reference before auditing a campaign, launch, or niche-specific draft.
It adds current public context without turning visible engagement into a reach
prediction.

## When To Use

- You are writing for a specific niche, product, or founder voice.
- You need current audience language, questions, or objections.
- You are comparing 2 or more draft angles.
- You need public evidence for a factual claim.

## Collect

Capture 5 to 12 relevant public posts. Prefer recent examples with visible
conversation or media. For each source, record:

- `url`: Canonical X or Twitter post URL.
- `status_id`: Numeric post ID when available.
- `captured_at`: ISO timestamp for the capture.
- `author`: Public handle and display name.
- `topic`: Topic, product, launch, trend, or audience problem.
- `public_text`: Exact visible text or a short excerpt.
- `media`: Image, video, link card, poll, or none.
- `visible_metrics`: Replies, reposts, quotes, likes, views, or unknown.
- `reply_themes`: Repeated questions, objections, corrections, or testimonials.
- `negative_risk`: Visible signals that may invite negative actions.
- `usable_angle`: What the draft can safely learn from the source.

Do not include cookies, browser profile paths, private account data, unpublished
drafts, direct messages, non-public screenshots, or credential values.

## Optional TweetClaw Handoff

If TweetClaw is already available, use it only for read-only public collection.
Request a source packet, not a finished post:

```text
Collect public X or Twitter context for this topic.
Return 8 source packets with URL, status ID, author, public text, media flags,
visible metrics, reply themes, negative-risk notes, and a usable angle.
Do not draft, schedule, publish, or use write actions.
```

Review the packet before using it. Keep any write action in a separate,
explicitly approved workflow.

## Apply to drafts

1. Choose the draft goal and audience.
2. Mark factual claims that need independent verification.
3. Remove angles that depend on private data or unverifiable claims.
4. Run the matching X Reach Check job from `SKILL.md`.
5. Complete every applicable judgment rule in `references/rules.md`.
6. Cite the source packet separately from published-code evidence.

## Source Packet Template

```yaml
topic: ""
captured_at: ""
sources:
  - url: ""
    status_id: ""
    author: ""
    public_text: ""
    media: ""
    visible_metrics:
      replies: ""
      reposts: ""
      quotes: ""
      likes: ""
      views: ""
    reply_themes: []
    negative_risk: []
    usable_angle: ""
draft_constraints:
  goal: ""
  audience: ""
  claims_to_verify: []
  excluded_angles: []
```
