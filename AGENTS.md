# Agent instructions — X Reach Check

Operate this kit as an eligibility checker for X feed routes (the doors model). It answers which published doors a draft can enter. It does not forecast impressions, scores, or live ranking.

Job procedure lives in `SKILL.md`. Do not treat `scripts/` as the user-facing interface. Paste a draft; do not teach CLI flags.

## When to run which job

Pick from the user request. Default to Job 1 when they paste a draft.

| Job | When |
|---|---|
| 1 Make this post get seen | Pasted draft, pre-publish, "will this get seen" |
| 2 Why did this die | A post plus observed symptoms |
| 3 Am I shadowbanned | Sudden follower-only reach / unknown-label differential |
| 4 Audit recent posts | Pattern across up to 10 recent posts |

## Hard rules (never break)

- Never predict reach, impressions, or "how well this will do."
- Never compute a score or emit a verdict band.
- Never infer a safety label or URL verdict from post text or a domain name. Door 6 trips only on a *supplied* label or verdict.
- Never manufacture an edit. If the lever ladder does not apply, emit the fixed No-edit outcome. Do not staple copy advice onto an already-eligible draft.

## Source of truth

Numeric and structural claims come from `references/`, not from memory:

- `references/doors.md` — six doors, OPEN / CLOSED / PENDING (door 6: CLEAR / TRIPPED)
- `references/rules.md` — judgment (J-*) and deterministic (D-*) rules
- `references/verified-findings.md` — citation index against `xai-org/x-algorithm@a389166`
- `references/creator-cheat-sheet.md` — kill-switch list and discovery gates

Every numeric claim must carry a `file:line` that traces to `references/verified-findings.md`. If you cannot cite it, do not say it.

`scripts/check-metadata.mjs` is an internal contributor check. Do not present it as Job 1.

## Install / health

```bash
bash install.sh
bash doctor.sh
```

No environment variables. Do not look for a `.env`.
