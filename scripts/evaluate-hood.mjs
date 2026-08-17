#!/usr/bin/env node
/**
 * Under the Hood renderer. Not the taught interface.
 * Map their readout words onto published files, filters, and weights.
 * If a string has no published match, say so and stop. Do not invent a score.
 */
import { FOOTER } from "./evaluate-job4.mjs";

const HOW = [
  "HOW THIS WORKS",
  "Under the Hood is their words. This kit maps those words onto",
  "published files, filters, and weights. If a string has no match,",
  "that is the answer.",
  "Ask about any line.",
];

function padTok(token) {
  return String(token).padEnd(8, " ");
}

function wrap(text, width = 70) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > width && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function indentReasons(lines) {
  return lines.flatMap((line) => wrap(line).map((l) => `          ${l}`));
}

const LABELS = [
  {
    id: "NSFW_HIGH_RECALL",
    keys: ["nsfw_high_recall", "nsfwhighrecall", "nsfw high recall"],
    kind: "account or post label",
    effect: [
      "Hidden from recommendations to people who do not follow you, and from underage, no-age, and logged-out viewers.",
      "Followers can still see you on this label.",
    ],
    cite: "registry.rs:141-166; user_label_drops",
  },
  {
    id: "NSFW_HIGH_PRECISION",
    keys: ["nsfw_high_precision", "nsfwhighprecision", "nsfw high precision"],
    kind: "account or post label",
    effect: [
      "Hidden from recommendations to people who do not follow you.",
      "A precision NSFW mark. Followers can still see you.",
    ],
    cite: "registry.rs:141-166",
  },
  {
    id: "NSFW_NEAR_PERFECT",
    keys: ["nsfw_near_perfect", "nsfwnearperfect", "nsfw near perfect"],
    kind: "account label",
    effect: [
      "This one also hides you from followers. The published drop ships require_non_follower false.",
    ],
    cite: "user_label_drops.rs:107-112",
  },
  {
    id: "NSFW_TEXT",
    keys: ["nsfw_text", "nsfw text"],
    kind: "post label",
    effect: ["Stranger recommendations drop this post. Followers can still see it."],
    cite: "registry.rs:141-166",
  },
  {
    id: "NSFW_CARD_IMAGE",
    keys: ["nsfw_card_image", "nsfw card image"],
    kind: "post label",
    effect: ["Card-image NSFW. Stranger recommendations drop the post."],
    cite: "registry.rs:141-166",
  },
  {
    id: "NSFW_AVATAR_IMAGE",
    keys: ["nsfw_avatar_image", "nsfwavatarimage", "nsfw avatar"],
    kind: "account label",
    effect: ["Avatar marked NSFW. Stranger recommendations drop. Followers can still see you."],
    cite: "registry.rs:141-166",
  },
  {
    id: "NSFW_BANNER_IMAGE",
    keys: ["nsfw_banner_image", "nsfwbannerimage", "nsfw banner"],
    kind: "account label",
    effect: ["Banner marked NSFW. Stranger recommendations drop. Followers can still see you."],
    cite: "registry.rs:141-166",
  },
  {
    id: "SPAM_HIGH_RECALL",
    keys: ["spam_high_recall", "spamhighrecall", "spam high recall"],
    kind: "account or post label",
    effect: [
      "Treated as spam for stranger recommendations.",
      "A pinned BAD or LOW_QUALITY URL can put this on the account for 7 days.",
    ],
    cite: "registry.rs:141-166; PinnedLowQualityOrBadUrl.bot:8-41",
  },
  {
    id: "DO_NOT_AMPLIFY",
    keys: [
      "do_not_amplify",
      "donotamplify",
      "do not amplify",
      "do_not_amplify_non_follower",
    ],
    kind: "account label",
    effect: [
      "The account label is DO_NOT_AMPLIFY.",
      "The published drop is followers still see you, strangers do not.",
    ],
    cite: "user_label_drops.rs:113-119",
  },
  {
    id: "ABUSIVE_HIGH_RECALL",
    keys: ["abusive_high_recall", "abusivehighrecall", "abusive high recall"],
    kind: "account label",
    effect: [
      "Followers still see you. Strangers do not.",
      "One of the two published follower-carve-out account drops.",
    ],
    cite: "user_label_drops.rs:101-106",
  },
  {
    id: "COMPROMISED",
    keys: ["compromised"],
    kind: "account label",
    effect: ["Account treated as compromised. Stranger recommendations drop."],
    cite: "registry.rs:141-166",
  },
  {
    id: "READ_ONLY",
    keys: ["read_only", "readonly", "read only"],
    kind: "account label",
    effect: ["Account is read-only. Stranger recommendations drop."],
    cite: "registry.rs:141-166",
  },
  {
    id: "IMPERSONATION_HIGH_PRECISION",
    keys: [
      "impersonation_high_precision",
      "impersonationhighprecision",
      "impersonation",
    ],
    kind: "account label",
    effect: ["Impersonation mark. Stranger recommendations drop."],
    cite: "registry.rs:141-166",
  },
  {
    id: "MALICIOUS_URL",
    keys: ["malicious_url", "malicious url"],
    kind: "post label",
    effect: ["A URL X marked malicious. Stranger recommendations drop the post."],
    cite: "registry.rs:141-166",
  },
  {
    id: "GORE_AND_VIOLENCE_HIGH_PRECISION",
    keys: ["gore_and_violence_high_precision", "gore and violence"],
    kind: "post label",
    effect: ["Gore or violence precision mark. Stranger recommendations drop."],
    cite: "registry.rs:141-166",
  },
  {
    id: "FOSNR_HATEFUL_CONDUCT",
    keys: ["fosnr_hateful_conduct", "hateful conduct"],
    kind: "post label",
    effect: ["Hides the post from followers and from strangers. Author self-view is exempt."],
    cite: "tweet_label_drops.rs:126-149; registry.rs:115-118",
  },
  {
    id: "FOSNR_VIOLENT_SPEECH",
    keys: ["fosnr_violent_speech", "violent speech"],
    kind: "post label",
    effect: ["Hides the post from followers and from strangers. Author self-view is exempt."],
    cite: "tweet_label_drops.rs:126-149",
  },
  {
    id: "FOSNR_ABUSE",
    keys: ["fosnr_abuse"],
    kind: "post label",
    effect: [
      "Hides the post from followers and from strangers.",
      "Insults-level FOSNR_ABUSE_INSULTS is strangers only.",
    ],
    cite: "tweet_label_drops.rs:126-149; registry.rs:141-166",
  },
  {
    id: "FOSNR_ABUSE_INSULTS",
    keys: ["fosnr_abuse_insults", "abuse insults"],
    kind: "post label",
    effect: ["Strangers only. Followers can still see the post."],
    cite: "registry.rs:141-166",
  },
  {
    id: "FOSNR_CIVIC_INTEGRITY",
    keys: ["fosnr_civic_integrity", "civic integrity"],
    kind: "post label",
    effect: ["Hides the post from followers and from strangers. Author self-view is exempt."],
    cite: "tweet_label_drops.rs:126-149",
  },
];

const PHRASES = [
  {
    id: "hidden-non-followers",
    keys: [
      "hidden from recommendations to non-followers",
      "hidden from recommendations to people who do not follow you",
      "limited to followers-only",
      "followers-only reach",
    ],
    token: "STRANGER DROP",
    kind: "effect text",
    effect: [
      "Their words match a stranger-only hide.",
      "Published labels that do this include DO_NOT_AMPLIFY, ABUSIVE_HIGH_RECALL, and NSFW_HIGH_RECALL.",
      "This kit cannot see which label you have. It can only name the match.",
    ],
  },
  {
    id: "hidden-followers-too",
    keys: ["hidden from followers", "hidden from everyone", "also hidden from followers"],
    token: "BASE DROP",
    kind: "effect text",
    effect: [
      "Their words match a hide that also hits followers.",
      "Published names: FOSNR_HATEFUL_CONDUCT, FOSNR_VIOLENT_SPEECH, FOSNR_ABUSE, FOSNR_CIVIC_INTEGRITY, NSFW_NEAR_PERFECT.",
    ],
  },
];

const UNMATCHED_HINTS = [
  { re: /visibility score/i, label: "visibility score" },
  { re: /\brank(?:ing)? score\b/i, label: "ranking score" },
  { re: /\bvirality\b/i, label: "virality" },
  { re: /\bimpression/i, label: "impression prediction" },
  { re: /\b\d+(\.\d+)?\s*%/, label: "percentage" },
];

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function readoutText(raw) {
  if (raw.readout) return String(raw.readout);
  if (raw.uth) return String(raw.uth);
  if (raw.text && (raw.job === 5 || raw.product === "hood")) return String(raw.text);
  if (Array.isArray(raw.labels)) return raw.labels.join("\n");
  return String(raw.text || "");
}

function findLabel(chunk) {
  const compact = normKey(chunk);
  const lower = String(chunk).toLowerCase();
  for (const row of LABELS) {
    for (const key of row.keys) {
      if (compact.includes(normKey(key)) || lower.includes(key)) return row;
    }
  }
  return null;
}

function findPhrase(text) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const row of PHRASES) {
    if (row.keys.some((k) => lower.includes(k))) hits.push(row);
  }
  return hits;
}

function leftoverUnmatched(text, matchedIds) {
  const found = [];
  for (const hint of UNMATCHED_HINTS) {
    if (hint.re.test(text)) found.push(hint.label);
  }
  const tokens = String(text).match(/\b[A-Z][A-Z0-9_]{3,}\b/g) || [];
  for (const tok of tokens) {
    if (matchedIds.has(tok)) continue;
    if (findLabel(tok)) continue;
    if (["NSFW", "FOSNR", "URL", "UTC", "HTML", "JSON"].includes(tok)) continue;
    found.push(tok);
  }
  return [...new Set(found)];
}

function renderMatch(token, kind, effect) {
  return [`${padTok("MATCHED")}  ${token}`, `          ${kind}`, ...indentReasons(effect)];
}

export function evaluateHood(raw) {
  const text = readoutText(raw).trim();
  const out = ["UNDER THE HOOD", ""];

  if (!text) {
    out.push(`${padTok("EMPTY")}  Paste the readout from x.com/i/under_the_hood.`);
    out.push("          Screenshot text is fine. Do not invent a score.");
    out.push("");
    out.push(...HOW);
    out.push("");
    out.push(FOOTER);
    return out.join("\n");
  }

  const matched = [];
  const seen = new Set();

  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const row = findLabel(line);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      matched.push(row);
    }
  }
  const whole = findLabel(text);
  if (whole && !seen.has(whole.id)) {
    seen.add(whole.id);
    matched.push(whole);
  }
  for (const row of LABELS) {
    if (seen.has(row.id)) continue;
    if (row.keys.some((k) => text.toLowerCase().includes(k))) {
      seen.add(row.id);
      matched.push(row);
    }
  }
  const phrases = findPhrase(text);
  const unmatched = leftoverUnmatched(text, seen);

  if (matched.length || phrases.length) {
    out.push("MATCHED");
    out.push("");
    for (const row of matched) {
      out.push(...renderMatch(row.id, row.kind, row.effect));
      out.push("");
    }
    for (const row of phrases) {
      out.push(...renderMatch(row.token, row.kind, row.effect));
      out.push("");
    }
    if (out[out.length - 1] === "") out.pop();
  }

  if (unmatched.length) {
    if (out.length > 2) out.push("");
    out.push("UNMATCHED");
    out.push("");
    for (const item of unmatched) {
      out.push(`${padTok("NO FILE")}  ${item}`);
      out.push("          No published match. The open code does not name this.");
      out.push("          Stop. Do not invent a score.");
    }
  }

  if (!matched.length && !phrases.length && !unmatched.length) {
    out.push(`${padTok("NO FILE")}  none of these strings match a published label`);
    out.push("          No published match. The open code does not name this.");
    out.push("          Stop. Do not invent a score.");
  }

  out.push("");
  out.push(...HOW);
  out.push("");
  out.push(FOOTER);
  return out.join("\n");
}

export function hoodAssertions(raw, output) {
  const fails = [];
  if (!/^UNDER THE HOOD$/m.test(output)) {
    fails.push("Under the Hood must print UNDER THE HOOD");
  }
  if (!/^HOW THIS WORKS$/m.test(output)) {
    fails.push("Under the Hood must print HOW THIS WORKS");
  }
  if (!output.includes(FOOTER)) fails.push("Under the Hood must print the scope footer");
  if (/WHERE IT CAN SHOW UP/.test(output)) {
    fails.push("Under the Hood must not print the file table");
  }
  if (output.includes("\u2014")) fails.push("Under the Hood must not emit em dashes");
  if (output.includes("**")) fails.push("Under the Hood must not emit markdown bold");
  if (/^TAPE$/m.test(output)) fails.push("Under the Hood must not print TAPE");
  const text = readoutText(raw);
  if (/visibility score/i.test(text) && !/No published match/.test(output)) {
    fails.push("visibility score must print unmatched");
  }
  if (/NSFW_HIGH_RECALL/i.test(text) && !/NSFW_HIGH_RECALL/.test(output)) {
    fails.push("NSFW_HIGH_RECALL must match");
  }
  if (raw.expectedPhrases) {
    for (const phrase of raw.expectedPhrases) {
      if (!output.includes(phrase)) fails.push(`missing phrase: ${phrase}`);
    }
  }
  if (raw.forbiddenPhrases) {
    for (const phrase of raw.forbiddenPhrases) {
      if (output.includes(phrase)) fails.push(`forbidden phrase: ${phrase}`);
    }
  }
  return fails;
}
