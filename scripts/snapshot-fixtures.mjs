#!/usr/bin/env node
/**
 * Render Last 20 / Rewrite / Under the Hood / file-table snapshots.
 * Usage:
 *   node scripts/snapshot-fixtures.mjs           # compare
 *   node scripts/snapshot-fixtures.mjs --write   # regenerate expected files
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { assertions, evaluate } from "./evaluate-reach.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const FIX = join(ROOT, "tests/fixtures");
const EXP = join(ROOT, "tests/expected");
const SNAPSHOT_NAMES = [
  "original-no-likes.json",
  "original-under-1000-followers.json",
  "original-exactly-1000-followers.json",
  "quote-post.json",
  "reply-with-long-video.json",
  "reply-simclusters.json",
  "community-and-reply.json",
  "nsfw-original-with-video-small-account.json",
  "nsfw-original-5-second-video.json",
  "vf-drop-not-nsfw.json",
  "video-exactly-10000ms.json",
  "video-10001ms.json",
  "video-plus-photo.json",
  "clean-original-no-edit.json",
  "job2-video-died-at-two-days.json",
  "no-qk-answer.json",
  "job4-reply-heavy.json",
  "job4-same-pond.json",
  "job4-live-0-like.json",
  "job4-paste-10.json",
  "job4-gold-themattberman.json",
  "rewrite-reply-bait.json",
  "rewrite-thin-reply.json",
  "rewrite-clean-original.json",
  "rewrite-profile-tap.json",
  "hood-nsfw-high-recall.json",
  "hood-unmatched-score.json",
  "hood-mixed.json",
];

function main() {
  const write = process.argv.includes("--write");
  mkdirSync(EXP, { recursive: true });
  let fail = 0;

  for (const name of SNAPSHOT_NAMES) {
    const raw = JSON.parse(readFileSync(join(FIX, name), "utf8"));
    const output = evaluate(raw).replace(/\s+$/, "") + "\n";
    const dest = join(EXP, name.replace(/\.json$/, ".txt"));
    const assertFails = assertions(raw, output);
    if (assertFails.length) {
      console.error(`ASSERT ${name}`);
      for (const f of assertFails) console.error(`  - ${f}`);
      fail += 1;
    }
    if (write) {
      writeFileSync(dest, output);
      console.log(`wrote ${dest}`);
      continue;
    }
    let expected;
    try {
      expected = readFileSync(dest, "utf8");
    } catch {
      console.error(`MISSING ${dest}`);
      fail += 1;
      continue;
    }
    if (expected !== output) {
      console.error(`DIFF ${name}`);
      fail += 1;
    } else {
      console.log(`ok    ${name}`);
    }
  }

  if (write) {
    console.log("snapshots written");
    process.exit(fail ? 1 : 0);
  }
  if (fail) {
    console.error(`snapshot-fixtures: FAIL (${fail})`);
    process.exit(1);
  }
  console.log("snapshot-fixtures: PASS");
}

main();
