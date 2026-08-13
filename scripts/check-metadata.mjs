#!/usr/bin/env node
/**
 * Internal supplied-metadata check only.
 * Not the user-facing interface — Job 1 in SKILL.md works from a pasted draft.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FOOTER = "Scope: eligibility against open-sourced code at a389166, not live production weights.";
const OON_DROP_LABELS = new Set([
  "NSFW_HIGH_RECALL",
  "NSFW_HIGH_PRECISION",
  "GORE_AND_VIOLENCE_HIGH_PRECISION",
  "NSFW_CARD_IMAGE",
  "DO_NOT_AMPLIFY",
  "MALICIOUS_URL",
  "SPAM_HIGH_RECALL",
  "NSFW_TEXT",
  "FOSNR_ABUSE_INSULTS",
  "COMPROMISED",
  "READ_ONLY",
  "IMPERSONATION_HIGH_PRECISION",
  "NSFW_AVATAR_IMAGE",
  "NSFW_BANNER_IMAGE",
  "ABUSIVE_HIGH_RECALL",
  "NSFW_NEAR_PERFECT",
]);
const URL_RE =
  /\b(?:(?:https?:\/\/|www\.)[^\s<>()]+|(?:[a-z0-9-]+\.)+(?:com|org|net|edu|gov|mil|int|io|co|ai|app|dev|tech|info|biz|me|us|uk|ca|au|de|fr|jp|in|xyz|online|site|store|blog|cloud|agency|digital)(?:\/[^\s<>()]*)?\b)/i;

function usage() {
  console.error(
    "usage: node check-metadata.mjs --text <draft> | --file <path> [--reply] [--repost] [--media photo|video|other] [--video-duration-ms <number>] [--known-oon-drop-label <label>] [--url-verdict unsafe] | --self-test",
  );
  console.error("internal only: checks supplied metadata; does not audit a post or predict reach.");
}

function parse(argv) {
  const data = {
    labels: [],
    reply: false,
    repost: false,
    media: null,
    videoDurationMs: null,
    urlVerdict: null,
    text: null,
    file: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--reply") data.reply = true;
    else if (arg === "--repost") data.repost = true;
    else if (
      ["--text", "--file", "--media", "--video-duration-ms", "--known-oon-drop-label", "--url-verdict"].includes(
        arg,
      )
    ) {
      const value = argv[++i];
      if (value === undefined) throw new Error(`missing value for ${arg}`);
      if (arg === "--text") data.text = value;
      if (arg === "--file") data.file = value;
      if (arg === "--media") data.media = value.toLowerCase();
      if (arg === "--video-duration-ms") data.videoDurationMs = Number(value);
      if (arg === "--known-oon-drop-label") data.labels.push(value.toUpperCase());
      if (arg === "--url-verdict") data.urlVerdict = value.toLowerCase();
    } else throw new Error(`unknown argument: ${arg}`);
  }
  if (data.text !== null && data.file !== null) throw new Error("use either --text or --file, not both");
  if (data.file !== null) data.text = readFileSync(resolve(data.file), "utf8");
  if (!data.text?.trim()) throw new Error("provide non-empty --text or --file");
  if (data.media && !["photo", "video", "other"].includes(data.media)) {
    throw new Error("--media must be photo, video, or other");
  }
  if (data.videoDurationMs !== null && (!Number.isFinite(data.videoDurationMs) || data.videoDurationMs < 0)) {
    throw new Error("--video-duration-ms must be a non-negative number");
  }
  if (data.videoDurationMs !== null && data.media === null) data.media = "video";
  return data;
}

function check(data) {
  const rows = [];
  const add = (id, result, citation, finding) => rows.push({ id, result, citation, finding });

  if (data.reply || data.repost) {
    add(
      "D-REPLY-REPOST-OON",
      "FLAG",
      "param.rs:246-265; PhoenixRankAllCandidateProcessor.strato:441-446; oon_retweet_reply_filter.rs:13-18",
      "Marked reply or repost; published code structurally constrains OON reach.",
    );
  } else {
    add(
      "D-REPLY-REPOST-OON",
      "PASS",
      "param.rs:246-265; PhoenixRankAllCandidateProcessor.strato:441-446; oon_retweet_reply_filter.rs:13-18",
      "Marked as an original post.",
    );
  }

  if (data.urlVerdict === "unsafe") {
    add(
      "D-EXTERNAL-LINK-REPUTATION",
      "FAIL",
      "param.rs:310; Tweet_Search_Blacklist_RTF_All_UNSAFE_URL_Sources.bot:35-53",
      "Supplied unsafe URL verdict applies OON-drop labels.",
    );
  } else if (URL_RE.test(data.text)) {
    add(
      "D-EXTERNAL-LINK-REPUTATION",
      "FLAG",
      "param.rs:310; recsys.proto:1105-1112",
      "External URL present. Verify reputation; the link itself is not a ranking penalty.",
    );
  } else {
    add(
      "D-EXTERNAL-LINK-REPUTATION",
      "PASS",
      "param.rs:310; recsys.proto:1105-1112",
      "No external URL detected.",
    );
  }

  const known = data.labels.filter((label) => OON_DROP_LABELS.has(label));
  const unknown = data.labels.filter((label) => !OON_DROP_LABELS.has(label));
  if (known.length) {
    add(
      "D-KNOWN-OON-VISIBILITY-LABEL",
      "FAIL",
      "registry.rs:138-170; safety_labels.rs:21-28",
      `Supplied known OON-drop label(s): ${known.join(", ")}.`,
    );
  } else if (unknown.length) {
    add(
      "D-KNOWN-OON-VISIBILITY-LABEL",
      "FLAG",
      "registry.rs:138-170; safety_labels.rs:21-28",
      `Supplied unrecognized label(s): ${unknown.join(", ")}.`,
    );
  } else {
    add(
      "D-KNOWN-OON-VISIBILITY-LABEL",
      "PASS",
      "registry.rs:138-170; safety_labels.rs:21-28",
      "No known OON-drop label supplied.",
    );
  }

  if (data.media === "video" && data.videoDurationMs !== null && data.videoDurationMs < 10000) {
    add(
      "D-VIDEO-DURATION",
      "FLAG",
      "param.rs:317,677-682; candidates_util.rs:19-40",
      "Video is under 10 seconds, so VQV credit does not apply.",
    );
  } else {
    add(
      "D-VIDEO-DURATION",
      "PASS",
      "param.rs:317,677-682; candidates_util.rs:19-40",
      data.media === "video"
        ? "Video metadata does not show a sub-10-second VQV condition."
        : "Not a video post.",
    );
  }

  // D-MEDIA-PRESENCE removed in v3: a rule that cannot fail is not a check.
  return rows;
}

function verdict(rows) {
  return rows.some((row) => row.result === "FAIL")
    ? "FAIL"
    : rows.some((row) => row.result === "FLAG")
      ? "FLAG"
      : "PASS";
}

function print(rows) {
  const result = verdict(rows);
  console.log(
    "## Internal metadata check\n\n| Rule | Result | Citation | Finding |\n|---|---|---|---|",
  );
  for (const row of rows) {
    console.log(`| ${row.id} | ${row.result} | \`${row.citation}\` | ${row.finding} |`);
  }
  console.log(
    `\n### Judgment review (not run by this script)\n\nComplete J-ENGAGEMENT-BAIT, J-REPLY-BAIT, J-NEGATIVE-FEEDBACK-RISK, and J-DUPLICATE-RISK from references/rules.md when reviewing a draft via the skill.\n\n**Metadata check result: ${result}. This is not a reach prediction or a complete doors evaluation.**\n\n${FOOTER}`,
  );
  return result;
}

function selfTest() {
  const fixtures = [
    ["clean-original.json", "PASS"],
    ["reply.json", "FLAG"],
    ["engagement-bait.json", "PASS"],
    ["link-heavy.json", "FLAG"],
    ["bare-domain-link.json", "FLAG"],
    ["tech-tokens.json", "PASS"],
    ["unsafe-verdict.json", "FAIL"],
    ["known-label.json", "FAIL"],
    ["short-video.json", "FLAG"],
  ];
  let ok = true;
  for (const [file, expected] of fixtures) {
    const got = verdict(
      check(JSON.parse(readFileSync(join(HERE, "..", "tests", "fixtures", file), "utf8"))),
    );
    const pass = got === expected;
    ok &&= pass;
    console.log(`${pass ? "PASS" : "FAIL"} ${file}: expected ${expected}, got ${got}`);
  }
  console.log(ok ? "SELF-TEST PASS: 9 fixtures calibrated." : "SELF-TEST FAIL: fixture expectation mismatch.");
  process.exit(ok ? 0 : 1);
}

if (process.argv.includes("--self-test")) selfTest();

try {
  const result = print(check(parse(process.argv.slice(2))));
  process.exit(result === "PASS" ? 0 : result === "FLAG" ? 1 : 2);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  usage();
  process.exit(3);
}
