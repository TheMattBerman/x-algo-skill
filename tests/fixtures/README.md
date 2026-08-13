# Fixtures

These fixtures pin deterministic checks only.

| Fixture | Expected result | Reason |
|---|---|---|
| `clean-original.json` | PASS | Original with no supplied visibility risk. |
| `reply.json` | FLAG | Reply metadata triggers the OON constraint. |
| `engagement-bait.json` | PASS | Engagement bait is a judgment, not a regex claim. |
| `link-heavy.json` | FLAG | URLs need reputation verification. |
| `bare-domain-link.json` | FLAG | A bare domain is an external URL. |
| `tech-tokens.json` | PASS | Bare tech tokens such as `Node.js`, `Next.js`, and `vite.config.ts` are not URLs. |

Run `node scripts/audit-post.mjs --self-test` from the repository root.
