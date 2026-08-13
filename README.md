# X Algorithm Audit Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Corrected against xai-org/x-algorithm](https://img.shields.io/badge/corrected%20against-xai--org%2Fx--algorithm%40a389166-000000.svg)

![What X actually pays for](assets/price-list.svg)

**Audit an X draft against published code.** Version 2.0.0 is a citation-first pre-publish audit and creator reference for `xai-org/x-algorithm@a389166`. It does not predict reach or calculate a live ranking score. Published defaults multiply unpublished model probabilities, and experiment arms can differ.

## See it run

![Terminal demo: an external-link draft is flagged, then all six fixtures pass](assets/demo.gif)

## Install

Clone the repository, then symlink the installed skill directory into Claude Code:

```bash
git clone https://github.com/themattberman/x-algo-skill.git
cd x-algo-skill
mkdir -p ~/.claude/skills
ln -s "$(pwd)" ~/.claude/skills/x-algo-audit
```

Ask Claude to audit an X draft, explain published X ranking mechanics, or review a post for evidence-grounded reach constraints. You can also invoke it with `/x-algo-audit`.

**Run the deterministic gate.**

```bash
node scripts/audit-post.mjs --text "Draft text"
node scripts/audit-post.mjs --text "Draft text" --reply
node scripts/audit-post.mjs --text "Draft text https://example.com" --url-verdict unsafe
node scripts/audit-post.mjs --self-test
```

The gate records structural constraints and known supplied metadata. Complete the human or LLM judgment review in [references/rules.md](references/rules.md) before publishing.

## What the code actually says

- **Shares outweigh likes.** Copy-link share is 20.0. Reply, quote, and DM share are 5.0; follow is 4.0; repost is 1.0; like is 0.5. See the [creator cheat sheet](references/creator-cheat-sheet.md).
- **Originals reach out of network.** Replies and reposts are excluded from out-of-network retrieval and pre-scoring OON candidates; they receive the default 0.75 OON factor in-network. Use them for relationships and conversation.
- **Media is specific.** There is no generic multiplier. Photo expand, video open, and VQV are distinct 0.05 heads. VQV requires video longer than 10,000 ms and is zeroed for viewers with more than 10,000 followers. Video has longer retrieval retention than text.
- **Links are not intrinsically penalized.** Link opening has a 0.2 positive default weight; unsafe URL verdicts can apply visibility labels and OON drops.
- **The feed gate is 48 hours.** It is not a ranking half-life. Author diversity is per request: 1.000, 0.625, 0.4375, then 0.34375 for successive posts from one author.

Every numeric statement is cited in [verified findings](references/verified-findings.md). `param.rs` mirrors production-primary feature-switch defaults last synced 2026-08-12; experiment arms can differ, and weights multiply unpublished model probabilities, so these defaults are not a live-score calculator.

## What this kit will not do

- Predict reach.
- Calculate a live ranking score.
- Replace the human or LLM judgment review in [references/rules.md](references/rules.md).

## License

[MIT](LICENSE)
