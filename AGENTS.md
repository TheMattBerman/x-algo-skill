# Agent instructions for X Reach Check

Operate this kit as a reach checker against published X feed paths. It
answers whether a post can still pick up new distribution, and what would
make the next one get seen more. It does not forecast impressions, scores,
or live ranking.

Job procedure lives in `SKILL.md`. Do not treat `scripts/` as the
user-facing interface. Paste a handle for Last 20. Paste a draft
for Rewrite. Paste an Under the Hood readout for Under the Hood.
Do not teach CLI flags.

## When to run which product

Pick from the user request. Default is Last 20.

| Product | When |
|---|---|
| Last 20 | A handle, `@handle`, `/x-reach` with nothing pasted, or last-N posts |
| Rewrite | Pasted draft, "will this get seen", "help this get seen more", "rewrite this" |
| Under the Hood | Pasted UTH readout, or "translate this" plus that page |
| Why this died | A post plus observed symptoms |
| Shadowban check | Sudden follower-only reach / unknown-label differential |

## Hard rules (never break)

- Never predict reach, impressions, or "how well this will do."
- Never compute a score or emit a verdict band.
- Never infer a safety label or URL verdict from post text or a domain name.
  Safety flags trip only on a user-reported warning.
- Never manufacture an edit. If the lever ladder does not apply, emit the
  fixed No-edit outcome. Do not staple copy advice onto an already-eligible
  draft.
- Never infer that a corpus is served from the existence of a dump window.
- Never print a dump-window number as a stranger-reach duration.
- Never use the retired v3 product noun. Do not coin a replacement.
- No em dashes in user-facing output.

## The standing rule for this codebase

**For every claimed path to a stranger, open the READER, not the writer, and cite the reader.**

A writer proves a row was produced. Only a loader proves a row is searched.
The two are different services with different deploy configs. In this repo:

| Claim shape | The writer (not sufficient) | The reader (required) |
|---|---|---|
| "Phoenix retrieval can find this post" | `phoenixRankAllCandidateProcessor.strato` builders | `phoenix/xrex/data/retrieval_dataset.py:229-285` plus the default at `model_runner.py:543` and `launch_inference.py:496-501` |
| "It stays findable for N hours" | `phoenix-rankall/src/config/mod.rs:139-188` window configs | the slice name inside `retrieval_dataset.py`, then `home-mixer/filters/age_filter.rs:16-20` with `MAX_POST_AGE` at `home-mixer/params/config.rs:36` |
| "This source is on" | the source struct existing | `enable()` on that source plus the param default in `home-mixer/params/param.rs` |
| "This index row exists" | the `WindowConfig` line | `PipelineKind::is_implemented()` at `phoenix-rankall/src/config/mod.rs:127-133` |

## Source of truth

Numeric and structural claims come from `references/`, not from memory:

- `references/how-reach-works.md`: three layers, exclusion block, state tables
- `references/index-map.md`: dump windows and serving corpus columns
- `references/what-is-not-published.md`: mechanism exists, config does not
- `references/rules.md`: judgment (J-*) and deterministic (D-*) rules
- `references/verified-findings.md`: citation index against `xai-org/x-algorithm@a389166`
- `references/creator-cheat-sheet.md`: kill-switch list and discovery gates

Authority order, non-negotiable:

1. The clone at `/tmp/x-algorithm` @ `a389166`.
2. `SKILL.md` and this file.
3. `references/how-reach-works.md` (retrieval + layers), `references/verified-findings.md` (ranking, weights, visibility filtering, safety labels).

Where the kit and the code disagree, the code wins. File the disagreement
rather than shipping either side.

Every numeric claim must carry a `file:line` that traces to
`references/verified-findings.md`. If you cannot cite it, do not say it.

`scripts/check-metadata.mjs` is an internal contributor check. Do not
present it as Rewrite. `scripts/ingest-recent.sh` shells out to the vault
scraper. Do not vendor an Apify token into this repo. Two pulls every
time: profile and with_replies.

## Install / health

```bash
bash install.sh
bash doctor.sh
```

No environment variables. Do not look for a `.env`.
