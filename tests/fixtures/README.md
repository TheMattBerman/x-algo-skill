# Fixtures

These fixtures pin the internal supplied-metadata check only
(`scripts/check-metadata.mjs`). They are not a reach audit.

| Fixture | Expected result | Reason |
|---|---|---|
| `clean-original.json` | PASS | Original with no supplied visibility risk. |
| `reply.json` | FLAG | Reply metadata triggers the OON constraint. |
| `engagement-bait.json` | PASS | Engagement bait is a judgment, not a regex claim. |
| `link-heavy.json` | FLAG | URLs need reputation verification. |
| `bare-domain-link.json` | FLAG | A bare domain is an external URL. |
| `tech-tokens.json` | PASS | Bare tech tokens such as `Node.js`, `Next.js`, and `vite.config.ts` are not URLs. |
| `unsafe-verdict.json` | FAIL | Supplied unsafe URL verdict. |
| `known-label.json` | FAIL | Supplied known OON-drop label. |
| `short-video.json` | FLAG | Video under 10,000 ms (VQV / short-clip flag). |

```bash
node scripts/check-metadata.mjs --self-test
```
