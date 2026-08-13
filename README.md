# X Algorithm Audit Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Corrected against xai-org/x-algorithm](https://img.shields.io/badge/corrected%20against-xai--org%2Fx--algorithm%40a389166-000000.svg)

<!-- TODO: Add a verified terminal-demo GIF here. -->

Version 2.0.0 is a citation-first pre-publish audit and creator reference for the open-sourced X algorithm at `xai-org/x-algorithm@a389166`.

It does not predict reach or calculate a live ranking score. The published defaults multiply unpublished model probabilities, and experiment arms can differ.

## Installation (Claude Code Skill)

Clone the repository, then symlink the installed skill directory into Claude Code:

```bash
git clone https://github.com/themattberman/x-algo-skill.git
cd x-algo-skill
mkdir -p ~/.claude/skills
ln -s "$(pwd)" ~/.claude/skills/x-algo-audit
```

Once installed, ask Claude to audit an X draft, explain published X ranking mechanics, or review a post for evidence-grounded reach constraints. You can also invoke it directly with `/x-algo-audit`.

## Use the deterministic gate

```bash
node scripts/audit-post.mjs --text "Draft text"
node scripts/audit-post.mjs --text "Draft text" --reply
node scripts/audit-post.mjs --text "Draft text https://example.com" --url-verdict unsafe
node scripts/audit-post.mjs --self-test
```

The deterministic gate records structural constraints and known supplied metadata. Complete the human or LLM judgment review in [references/rules.md](references/rules.md) before publishing.

## What the published code supports

- Copy-link share has the largest synced default action weight, 20.0. Reply, quote, and DM share are 5.0; follow is 4.0; repost is 1.0; like is 0.5. These are weights on unknown predicted probabilities, not exchange rates. See [creator cheat sheet](references/creator-cheat-sheet.md).
- Originals are the right format for out-of-network discovery. Replies and reposts are excluded from out-of-network retrieval and pre-scoring OON candidates; they also receive the default 0.75 OON factor in-network. They remain useful for relationships and conversation.
- Media has no generic multiplier. Photo expand, video open, and VQV are distinct 0.05 heads. VQV requires video longer than 10,000 ms and is zeroed for viewers with more than 10,000 followers. Video has longer retrieval retention than text.
- Links are not intrinsically penalized. Link opening has a 0.2 positive default weight; unsafe URL verdicts can apply visibility labels and OON drops.
- The shipped feed age gate is 48 hours. It is not a ranking half-life. Author diversity is per request: 1.000, 0.625, 0.4375, then 0.34375 for successive posts from one author.

Every numeric statement is cited in [verified findings](references/verified-findings.md). `param.rs` mirrors production-primary feature-switch defaults last synced 2026-08-12; an experiment arm can differ, and weights multiply unpublished model probabilities. Defaults are useful published constants, not a live-score calculator.

## Repository layout

```text
SKILL.md
README.md
CHANGELOG.md
references/       cited findings, rules, pipeline, and editorial patterns
scripts/          deterministic audit gate
tests/fixtures/   six deterministic fixtures; see tests/fixtures/README.md
LICENSE           MIT
```

## License

[MIT](LICENSE)
