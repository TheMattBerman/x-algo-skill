#!/usr/bin/env node
/**
 * Internal renderer for fixtures. Not the taught interface.
 * Last 20, Rewrite, Under the Hood, plus the file-table regression.
 */
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { evaluateJob4, job4Assertions } from "./evaluate-job4.mjs";
import { evaluateRewrite, rewriteAssertions } from "./evaluate-rewrite.mjs";
import { evaluateHood, hoodAssertions } from "./evaluate-hood.mjs";

const FOOTER =
  "This reads the code they published, not the live knobs they can turn on you tomorrow.";
const HONESTY =
  "Whether any one person sees this comes down to what they have been liking and replying to lately, which is on their side and nobody can read it from here.";
const NO_EDIT =
  "No edit: this draft is not leaving reach on the table. None of what would have cost you reach is present: a reply, repost, or community post (would keep it out of the wider-distribution file), an NSFW mark (same), a clip already in the draft at or under 10 seconds or sitting next to a photo (would keep it off the video files), bait that asks people to like or tag, or a restriction notice from X.";

function padState(token) {
  return token.padEnd(8, " ");
}

function block(state, label, reasons, cite) {
  const lines = [`${padState(state)}  ${label}`];
  for (const reason of reasons) {
    lines.push(`          ${reason}`);
  }
  for (const line of cite) {
    lines.push(`          ${line}`);
  }
  return lines.join("\n");
}

function normalize(raw) {
  const reply = Boolean(raw.reply);
  const repost = Boolean(raw.repost);
  const quote = Boolean(raw.quote);
  const community = Boolean(raw.community);
  let postType = raw.postType;
  if (!postType) {
    if (community) postType = "community";
    else if (reply) postType = "reply";
    else if (repost) postType = "repost";
    else if (quote) postType = "quote";
    else postType = "original";
  }
  return {
    text: raw.text || "",
    postType,
    community,
    reply: postType === "reply",
    repost: postType === "repost",
    quote: postType === "quote" || postType === "original" && quote,
    followers: raw.followers ?? 5001,
    views: raw.views ?? 0,
    likes: raw.likes ?? 0,
    videoDurationMs: raw.videoDurationMs ?? null,
    mixedMedia: Boolean(raw.mixedMedia),
    media: raw.media ?? (raw.videoDurationMs != null ? "video" : null),
    nsfw: Boolean(raw.nsfw),
    vfDropped: Boolean(raw.vfDropped),
    warning: Boolean(raw.warning),
    subscriberOnly: Boolean(raw.subscriberOnly),
    stacking: Boolean(raw.stacking),
    someoneReposted: Boolean(raw.someoneReposted),
    qkAnswer: raw.qkAnswer ?? null,
    job: raw.job ?? 1,
    product: raw.product ?? raw.surface ?? null,
    readout: raw.readout ?? raw.uth ?? null,
    symptom: raw.symptom ?? null,
    expectedJudgment: raw.expectedJudgment ?? null,
    expectedEdit: raw.expectedEdit ?? null,
    posts: raw.posts ?? null,
    now: raw.now ?? null,
    ingest: raw.ingest ?? raw.ingestMode ?? null,
  };
}

function exclusionReason(ctx) {
  if (ctx.community || ctx.postType === "community") return "community";
  if (ctx.reply) return "reply";
  if (ctx.repost) return "repost";
  if (ctx.vfDropped) return "vf";
  if (ctx.nsfw) return "nsfw";
  return null;
}

function videoQualifies(ctx) {
  if (ctx.media !== "video" || ctx.videoDurationMs == null) return false;
  if (ctx.mixedMedia) return false;
  return ctx.videoDurationMs > 10000;
}

function hasAnyVideo(ctx) {
  return ctx.media === "video";
}

function judge(ctx) {
  if (ctx.expectedJudgment) return ctx.expectedJudgment;
  const text = ctx.text.toLowerCase();
  if (
    /\blike if you agree\b/.test(text) ||
    /\btag \d+ friends\b/.test(text) ||
    /\bdrop a . if you want\b/.test(text) ||
    /\brt if\b/.test(text)
  ) {
    return "J-ENGAGEMENT-BAIT.";
  }
  if (ctx.qkAnswer && /minority|off/.test(String(ctx.qkAnswer))) {
    return "J-OFF-CATEGORY.";
  }
  return "none flagged.";
}

function resolveLayerA(ctx, reason) {
  const rows = [];
  const small = ctx.followers < 1000;
  const isOriginalish = ctx.postType === "original" || ctx.postType === "quote";

  if (ctx.postType === "community") {
    rows.push({
      order: "note",
      text: "The kit models the For You path and the topics surface, not community timelines.\n          (thunder_source.rs:25-27, 30)",
    });
    rows.push({
      state: "CLOSED",
      kind: "phoenix",
      label: "Strangers' For You (Phoenix retrieval)",
      reasons: [
        "This can circulate for a moment. It has no published path to pick",
        "up new distribution.",
        "Community posts are never written to any of these files at all.",
        "Not a slower path, no path.",
      ],
      cite: ["(phoenixRankAllCandidateProcessor.strato:430, 441-442)"],
    });
    rows.push({
      state: "CLOSED",
      kind: "simclusters",
      label: "People who liked things like this (SimClusters)",
      reasons: [
        "Community posts are thrown out before scoring on this path, so it never",
        "reaches anyone who does not already follow you.",
      ],
      cite: ["(oon_retweet_reply_filter.rs:13-18)"],
    });
    return rows;
  }

  if (reason === "reply" || reason === "repost") {
    const noun = reason === "reply" ? "Replies" : "Reposts";
    const because = reason === "reply" ? "reply" : "repost";
    rows.push({
      state: "CLOSED",
      kind: "phoenix",
      label: "Strangers' For You (Phoenix retrieval)",
      reasons: [
        "This can circulate for a moment. It has no published path to pick",
        "up new distribution.",
        `${noun} are never written to any of these files at all.`,
        "Not a slower path, no path.",
      ],
      cite:
        reason === "reply"
          ? ["(phoenixRankAllCandidateProcessor.strato:437, 443-444)"]
          : ["(phoenixRankAllCandidateProcessor.strato:431, 445-446)"],
    });
    rows.push({
      state: "CLOSED",
      kind: "simclusters",
      label: "People who liked things like this (SimClusters)",
      reasons: [
        `${noun} are thrown out before scoring on this path, so it never`,
        "reaches anyone who does not already follow you.",
      ],
      cite: ["(oon_retweet_reply_filter.rs:13-18)"],
    });
    rows.push({
      state: "OPEN",
      kind: "thunder",
      label: "People who follow you (Thunder)",
      reasons: [
        "Goes to people who follow you, but at three quarters the weight",
        `because it is a ${because}.`,
      ],
      cite: ["(param.rs:246-251; ranking_scorer.rs:747-754)"],
    });
    return rows;
  }

  if (reason === "vf") {
    rows.push({
      state: "CLOSED",
      kind: "phoenix",
      label: "Strangers' For You (Phoenix retrieval)",
      reasons: [
        "A visibility drop keeps this out of the files below.",
        "Not a slower path, no path.",
      ],
      cite: ["(phoenixRankAllCandidateProcessor.strato:438-440, 452-453)"],
    });
    rows.push({
      state: "CLOSED",
      kind: "simclusters",
      label: "People who liked things like this (SimClusters)",
      reasons: ["A visibility drop never reaches anyone who does not already follow you."],
      cite: ["(phoenixRankAllCandidateProcessor.strato:438-440, 452-453)"],
    });
    if (small) {
      rows.push({
        state: "CLOSED",
        kind: "tail",
        label: "Small-account shelf (tail)",
        reasons: [
          "A visibility drop that is not an NSFW mark keeps this out of",
          "the files below, including the small-account file.",
        ],
        cite: ["(phoenixRankAllCandidateProcessor.strato:452-453)"],
      });
    }
    rows.push({
      state: "OPEN",
      kind: "thunder",
      label: "People who follow you (Thunder)",
      reasons: ["Goes to people who follow you."],
      cite: ["(thunder_source.rs:25-27, 30)"],
    });
    return rows;
  }

  if (reason === "nsfw" && isOriginalish) {
    rows.push({
      state: "CLOSED",
      kind: "phoenix",
      label: "Strangers' For You (Phoenix retrieval)",
      reasons: [
        "An NSFW mark keeps this out of the one-like file people who do not",
        "follow you are published to see.",
      ],
      cite: ["(phoenixRankAllCandidateProcessor.strato:438-440)"],
    });
    rows.push({
      state: "CLOSED",
      kind: "simclusters",
      label: "People who liked things like this (SimClusters)",
      reasons: [
        "An NSFW-labelled author is dropped on this path for anyone who does",
        "not already follow you.",
      ],
      cite: ["(oon_nsfw_simclusters_filter.rs:19-23)"],
    });
    if (small && hasAnyVideo(ctx) && ctx.likes >= 1) {
      rows.push({
        state: "UNPROVEN",
        kind: "tail",
        label: "Small-account shelf (tail)",
        reasons: [
          "Under 1,000 followers, a like plus any video writes this to a",
          "small-account file about three minutes after you post. There is",
          "a matching file this service knows how to load. Whether the For You",
          "feed asks for it is a setting they did not publish.",
        ],
        cite: [
          "(sid_tail_processor.rs:71-80; config/mod.rs:187;",
          " retrieval_dataset.py:276-280; launch_inference.py:496-501)",
        ],
      });
    }
    if (videoQualifies(ctx) && ctx.likes >= 1) {
      rows.push({
        state: "UNPROVEN",
        kind: "nsfw_video",
        label: "Strangers' For You (Phoenix retrieval)",
        skipPrint: true,
      });
    }
    rows.push({
      state: "OPEN",
      kind: "thunder",
      label: "People who follow you (Thunder)",
      reasons: ["Goes to people who follow you."],
      cite: ["(thunder_source.rs:25-27, 30)"],
    });
    return rows;
  }

  if (small) {
    rows.push({
      state: "UNPROVEN",
      kind: "tail",
      label: "Small-account shelf (tail)",
      reasons: [
        "Under 1,000 followers, X writes your post to a small-account file",
        "about three minutes after you post, with no likes needed. There is",
        "a matching file this service knows how to load. Whether the For You",
        "feed asks for it is a setting they did not publish.",
      ],
      cite: [
        "(sid_tail_processor.rs:71-80; config/mod.rs:187;",
        " retrieval_dataset.py:276-280; launch_inference.py:496-501)",
      ],
    });
  }

  rows.push({
    state: "PENDING",
    subtype: "signal",
    kind: "phoenix",
    label: "Strangers' For You (Phoenix retrieval)",
    reasons: [
      "The first like is the published ticket into wider distribution.",
      "Followers can see it as soon as you post. That is the floor.",
      "X writes a file when you publish. They never published that anyone",
      "looks there.",
    ],
    cite: [
      "(retrieval_dataset.py:229-235; model_runner.py:543;",
      " launch_inference.py:496-501; strato:266-273, 469)",
    ],
  });

  rows.push({
    state: "PENDING",
    subtype: "signal",
    kind: "simclusters",
    label: "People who liked things like this (SimClusters)",
    reasons: [
      "Needs 8 likes before X builds a lasting picture of who this post",
      "is for. On top of that it only runs for viewers who already like",
      "and reply to things, or who dwell and click on them, and nobody",
      "can see that from here.",
    ],
    cite: ["(Configs.scala:65; simclusters_source.rs:88-93, 139-147)"],
  });

  rows.push({
    state: "OPEN",
    kind: "thunder",
    label: "People who follow you (Thunder)",
    reasons: ["Goes to people who follow you."],
    cite: ["(thunder_source.rs:25-27, 30)"],
  });

  return rows;
}

function orderA(rows) {
  const rank = { CLOSED: 0, UNPROVEN: 1, PENDING: 2, OPEN: 3, note: -1 };
  return rows
    .filter((r) => !r.skipPrint)
    .sort((a, b) => (rank[a.state || "note"] ?? 9) - (rank[b.state || "note"] ?? 9));
}

function resolveLayerB(ctx, reason) {
  const rows = [];
  const blocked = reason === "community" || reason === "reply" || reason === "repost" || reason === "vf" || reason === "nsfw";
  const noun =
    reason === "community"
      ? "Community posts"
      : reason === "reply"
        ? "Replies"
        : reason === "repost"
          ? "Reposts"
          : reason === "vf"
            ? "A visibility drop"
            : reason === "nsfw"
              ? "An NSFW mark"
              : null;
  const cite =
    reason === "reply"
      ? "(strato:437, 443-444)"
      : reason === "repost"
        ? "(strato:431, 445-446)"
        : reason === "community"
          ? "(strato:430, 441-442)"
          : reason === "vf"
            ? "(strato:438-440, 452-453)"
            : reason === "nsfw"
              ? "(strato:438-440)"
              : "";

  const skippedExtra = noun
    ? noun === "An NSFW mark" || noun === "A visibility drop"
      ? `${noun} skips these files before they are written.`
      : `${noun} are skipped before any of these files are written.`
    : null;

  const pushBlocked = (token, name) => {
    rows.push({
      token,
      name,
      left: "n/a",
      right: "n/a",
      extra: skippedExtra,
      cite,
    });
  };

  if (blocked && reason !== "nsfw") {
    pushBlocked("BLOCKED", "Publish-time file (post_creation)");
    pushBlocked("BLOCKED", "One-like file (1fav)");
    pushBlocked("BLOCKED", "Thirty-two-like file (32fav)");
  } else if (reason === "nsfw") {
    pushBlocked("BLOCKED", "Publish-time file (post_creation)");
    pushBlocked("BLOCKED", "One-like file (1fav)");
    pushBlocked("BLOCKED", "Thirty-two-like file (32fav)");
    if (ctx.followers < 1000 && hasAnyVideo(ctx) && ctx.likes >= 1) {
      rows.push({
        token: "UNPROVEN",
        name: "Small-account file (tail)",
        left: "24 h",
        right: "not published",
        cite: "(sid_tail_processor.rs:71-80; config/mod.rs:187; retrieval_dataset.py:276-280)",
      });
    }
  } else {
    rows.push({
      token: "WRITTEN",
      name: "Publish-time file (post_creation)",
      left: "24 h",
      right: "not published",
      cite: "(strato:266-273, 469; config/mod.rs:142; retrieval_dataset.py:229-285)",
    });
    rows.push({
      token: "ON 1 LIKE",
      name: "One-like file (1fav)",
      left: "24 + 48 h",
      right: "up to 48 h",
      cite: "(strato:78-92; config/mod.rs:143-144; retrieval_dataset.py:231-235; age_filter.rs:16-20)",
    });
    rows.push({
      token: "ON 32 LIKES",
      name: "Thirty-two-like file (32fav)",
      left: "24 h",
      right: "not published",
      cite: "(strato:62-76; config/mod.rs:145; retrieval_dataset.py:229-285)",
    });
    if (ctx.followers < 1000) {
      rows.push({
        token: "UNPROVEN",
        name: "Small-account file (tail)",
        left: "24 h",
        right: "not published",
        cite: "(sid_tail_processor.rs:71-80; config/mod.rs:187; retrieval_dataset.py:276-280)",
      });
    }
  }

  if (ctx.media === "video") {
    const excluded = reason === "reply" || reason === "repost" || reason === "community" || reason === "vf";
    const nsfwVideo = reason === "nsfw";
    const familyName = nsfwVideo ? "Video files (nsfw_video)" : "Video files (video)";
    const familyCite = nsfwVideo
      ? "(eventProcessing.strato:24, 389-404; retrieval_dataset.py:256-260; age_filter.rs:16-20)"
      : "(eventProcessing.strato:24, 389-404; retrieval_dataset.py:236-240, 266-270; age_filter.rs:16-20)";
    if (excluded) {
      rows.push({
        token: "BLOCKED",
        name: familyName,
        left: "n/a",
        right: "n/a",
        extra: skippedExtra,
        cite,
      });
    } else if (ctx.videoDurationMs == null) {
      rows.push({
        token: "PENDING",
        name: familyName,
        left: "unknown",
        right: "not published",
        extra: "Duration is unanswered, so the video files stay pending.",
        cite: "(eventProcessing.strato:24, 389-404)",
      });
    } else if (ctx.mixedMedia || ctx.videoDurationMs <= 10000) {
      rows.push({
        token: "BLOCKED",
        name: familyName,
        left: "n/a",
        right: "n/a",
        extra: ctx.mixedMedia
          ? "A photo next to the video fails the every-clip test."
          : "A clip at or under 10 seconds is kept off the video files.",
        cite: nsfwVideo
          ? "(eventProcessing.strato:24, 389-404; strato:290-305)"
          : "(eventProcessing.strato:24, 389-404)",
      });
    } else {
      rows.push({
        token: "UNPROVEN",
        name: familyName,
        left: "kept",
        right: "up to 48 h if the video files are switched on, which is not published",
        cite: familyCite,
      });
    }
  } else {
    rows.push({
      token: "n/a",
      name: "No video, so the video files do not apply: video, nsfw_video, evergreen video.",
      collapsed: true,
    });
  }

  return rows;
}

function resolveLayerC(ctx, reason) {
  const lines = [];
  const originalish = ctx.postType === "original" || ctx.postType === "quote";
  if (originalish && ctx.followers <= 1000 && ctx.views < 1000 && reason !== "vf") {
    lines.push(
      "One post per request gets pulled up to slot 15, and it has to already be in the top 85 percent of what got scored. Nobody can see that before you post.",
    );
    lines.push("(author_cold_start.rs:86-91; :130-138; :165-179; param.rs:621-656)");
  }
  if (ctx.stacking) {
    lines.push(
      "Second post in the same scroll keeps 62.5 percent, third keeps 43.75 percent, floor 25 percent. Per refresh, never per day.",
    );
    lines.push("(ranking_scorer.rs:614-616; param.rs:222-239)");
  }
  if (ctx.reply || ctx.repost) {
    lines.push("Served at three quarters weight even to people who follow you.");
    lines.push("(param.rs:246-251; ranking_scorer.rs:747-754)");
  }
  if (ctx.someoneReposted || ctx.repost) {
    lines.push("First arrival in source order wins, so a repost can evict the original.");
    lines.push("(retweet_deduplication_filter.rs:19-26)");
  }
  if (ctx.subscriberOnly) {
    lines.push("Reaches only subscribers.");
    lines.push("(ineligible_subscription_filter.rs:21-27)");
  }
  return lines;
}

function formatB(rows) {
  const out = ["WHAT FILES IT, AND FOR HOW LONG", "", "                                              written    searchable", "                                              and kept   on For You"];
  for (const row of rows) {
    if (row.collapsed) {
      out.push(`${padState("n/a")}  ${row.name}`);
      continue;
    }
    const left = String(row.left).padEnd(10, " ");
    out.push(`${padState(row.token)}  ${row.name.padEnd(36, " ")}${left}${row.right}`);
    if (row.extra) out.push(`            ${row.extra}`);
    if (row.cite) out.push(`            ${row.cite}`);
  }
  return out.join("\n");
}

function safety(ctx) {
  if (ctx.warning) {
    return [
      "X's safety flags",
      block(
        "TRIPPED",
        "X's safety flags",
        ["You said X sent a warning or restriction.", "If a flag is set, none of the files below get written."],
        ["(phoenixRankAllCandidateProcessor.strato:438-440, 447;", " eventProcessing.strato:246-265)"],
      ),
    ].join("\n");
  }
  return [
    "X's safety flags",
    `${padState("UNKNOWN")}  X keeps these on their side. If one is set, none of the files`,
    "          below get written. It only shows up here if you already got a",
    "          warning.",
    "          (phoenixRankAllCandidateProcessor.strato:438-440, 447;",
    "           eventProcessing.strato:246-265)",
  ].join("\n");
}

function resolveEdit(ctx, reason, judgment) {
  if (ctx.expectedEdit === "no-edit") return { kind: "no-edit", text: NO_EDIT };
  if (ctx.expectedEdit === "leave-reply") {
    return {
      kind: "leave-reply",
      text: "The one edit: Leave this a reply. The point does not stand on its own, so it will not pick up new distribution.",
    };
  }
  if (reason === "reply") {
    return {
      kind: "rung-1",
      text: "The one edit: Post this as an original on your timeline, not a reply. Opens a path to more reach (Phoenix retrieval).",
    };
  }
  if (reason === "repost") {
    return {
      kind: "rung-1-quote",
      text: "The one edit: Post this as a quote with your comment, not a repost. Opens a path to more reach (Phoenix retrieval).",
    };
  }
  if (reason === "nsfw") {
    return {
      kind: "rung-2",
      text: "The one edit: If you marked this NSFW, take the mark off. Opens a path to more reach (Phoenix retrieval).",
    };
  }
  if (judgment.startsWith("J-ENGAGEMENT-BAIT") || judgment.startsWith("J-REPLY-BAIT")) {
    return {
      kind: "rung-2",
      text: "The one edit: Drop the bait close. Protects X's safety flags.",
    };
  }
  return { kind: "no-edit", text: NO_EDIT };
}

function renderJob2(ctx) {
  const lines = [];
  if (ctx.symptom === "video-died-at-two-days") {
    lines.push("The feed's hard 48-hour age gate, or a two-day video slice.");
    lines.push("The long video windows are storage, not feed reach.");
    lines.push("(age_filter.rs:16-20; config.rs:36; retrieval_dataset.py:236-240)");
    lines.push(HONESTY);
    lines.push("Cannot tell from here which corpora the For You cluster requests.");
    lines.push(FOOTER);
    return lines.join("\n");
  }
  lines.push("Blocked, unproven, and pending paths ranked against the symptom.");
  lines.push("Cannot tell from here which corpora the For You cluster requests.");
  lines.push(FOOTER);
  return lines.join("\n");
}

function isHood(raw, ctx) {
  return (
    ctx.job === 5 ||
    ctx.product === "hood" ||
    ctx.product === "under-the-hood" ||
    raw.readout != null ||
    raw.uth != null
  );
}

function isRewrite(raw, ctx) {
  return (
    ctx.product === "rewrite" ||
    ctx.product === "Rewrite" ||
    raw.surface === "rewrite"
  );
}

export function evaluate(raw) {
  const ctx = normalize(raw);
  if (isHood(raw, ctx)) return evaluateHood(raw);
  if (ctx.job === 4 || Array.isArray(raw.posts)) return evaluateJob4(raw);
  if (ctx.job === 2) return renderJob2(ctx);
  if (isRewrite(raw, ctx)) return evaluateRewrite(raw);

  const reason = exclusionReason(ctx);
  const layerA = orderA(resolveLayerA(ctx, reason));
  const layerB = resolveLayerB(ctx, reason);
  const layerC = resolveLayerC(ctx, reason);
  const judgment = judge(ctx);
  const edit = resolveEdit(ctx, reason, judgment);

  const out = ["WHERE IT CAN SHOW UP", ""];
  let honestyPrinted = false;
  for (const row of layerA) {
    if (row.order === "note") {
      out.push(row.text);
      out.push("");
      continue;
    }
    out.push(block(row.state, row.label, row.reasons, row.cite));
    if (
      !honestyPrinted &&
      (row.kind === "phoenix" || row.kind === "simclusters" || row.kind === "tail") &&
      (row.state === "OPEN" || row.state === "PENDING" || row.state === "UNPROVEN")
    ) {
      out.push(`          ${HONESTY}`);
      honestyPrinted = true;
    }
    out.push("");
  }

  out.push(safety(ctx));
  out.push("");
  out.push(formatB(layerB));
  out.push("");

  if (layerC.length) {
    out.push("ONCE IT IS IN THE RUNNING");
    for (const line of layerC) out.push(line);
    out.push("");
  }

  out.push(`Judgment: ${judgment}`);
  out.push("");
  out.push(edit.text);
  if (edit.kind !== "no-edit" && edit.kind !== "leave-reply") {
    out.push("");
    out.push("Rewrite: see the pasted draft.");
  }
  out.push("");
  out.push(FOOTER);
  return out.join("\n");
}

export function assertions(raw, output) {
  const ctx = normalize(raw);
  const fails = [];
  const reason = exclusionReason(ctx);

  if (isHood(raw, ctx)) return hoodAssertions(raw, output);
  if (ctx.job === 4 || Array.isArray(raw.posts)) {
    return job4Assertions(raw, output);
  }
  if (isRewrite(raw, ctx)) return rewriteAssertions(raw, output);

  if (ctx.postType === "original" && ctx.likes === 0 && !ctx.nsfw && !ctx.vfDropped && !ctx.community) {
    if (/^OPEN\s+Strangers'/m.test(output) || output.includes("OPEN      Strangers' For You")) {
      fails.push("original-no-likes must not print OPEN on Phoenix retrieval");
    }
    if (!output.includes("PENDING") || !output.includes("The first like is the published ticket")) {
      fails.push("original-no-likes must print PENDING with the published-ticket sentence");
    }
    if (!output.includes("writes a file when you publish") && !output.includes("publish-time file")) {
      fails.push("original-no-likes must name the publish-time file");
    }
    if (!output.includes("never published that anyone") && !output.includes("nothing published says that file is ever searched")) {
      fails.push("original-no-likes must dispose of the publish-time file");
    }
  }

  if (ctx.followers < 1000 && (ctx.postType === "original" || ctx.postType === "quote") && !ctx.vfDropped) {
    if (output.includes("Small-account shelf (tail)")) {
      if (!output.includes("UNPROVEN") || !output.includes("setting they did not publish")) {
        fails.push("tail must print UNPROVEN and name the missing config");
      }
      if (/OPEN\s+Small-account/.test(output)) fails.push("tail must not print OPEN");
    }
  }

  if (ctx.followers === 1000 && (ctx.postType === "original" || ctx.postType === "quote")) {
    if (output.includes("Small-account shelf (tail)") && !output.includes("CLOSED")) {
      fails.push("exactly 1000 followers must not print tail as eligible");
    }
    if (!output.includes("slot 15")) {
      fails.push("exactly 1000 followers must still print cold start");
    }
  }

  if (ctx.postType === "quote") {
    if (/three quarters/.test(output) || /full weight/.test(output)) {
      fails.push("quote must not carry a ranking-weight claim");
    }
    if (output.includes("Reposts are never written")) {
      fails.push("quote must not be treated as a repost");
    }
  }

  if (ctx.reply && ctx.media === "video") {
    if (/UNPROVEN\s+Video files/.test(output) || /OPEN\s+Video files/.test(output)) {
      fails.push("reply with long video must not open video files on duration");
    }
    if (!/BLOCKED\s+Video files/.test(output) || !output.includes("Replies")) {
      fails.push("reply with long video must BLOCK video on reply");
    }
  }

  if (ctx.reply) {
    if (/PENDING\s+People who liked things like this/.test(output)) {
      fails.push("reply must not print SimClusters PENDING");
    }
    if (!output.includes("CLOSED") || !output.includes("SimClusters")) {
      fails.push("reply must print SimClusters CLOSED");
    }
  }

  if (ctx.community && ctx.reply) {
    if (output.includes("Replies are never written")) {
      fails.push("community+reply must report community, not reply");
    }
    if (!/not community timelines/.test(output)) {
      fails.push("community Thunder must print no state");
    }
  }

  if (ctx.nsfw && ctx.media === "video" && ctx.followers < 1000) {
    if (/BLOCKED\s+Small-account file/.test(output)) {
      fails.push("nsfw small-account video must not BLOCK tail");
    }
    if (!output.includes("BLOCKED") || !output.includes("One-like file")) {
      fails.push("nsfw must BLOCK 1fav");
    }
    if (output.includes("no likes needed")) {
      fails.push("nsfw tail must not say no likes needed");
    }
    if (output.includes("IMMERSIVE2Day") || /Video files \(video\)/.test(output)) {
      fails.push("nsfw video must name nsfw_video, not the regular video files");
    }
    if (output.includes("an NSFW mark (same)")) {
      fails.push("nsfw fixture must not emit the No-edit sentence that denies the mark");
    }
  }

  if (ctx.vfDropped && !ctx.nsfw) {
    if (/UNPROVEN\s+Small-account/.test(output)) {
      fails.push("VF drop that is not NSFW must CLOSE tail");
    }
  }

  if (ctx.media === "video" && ctx.videoDurationMs === 10001 && !ctx.reply) {
    if (output.includes("720")) fails.push("video-10001ms must not print 720");
    if (!output.includes("up to 48 h if the video files are switched on, which is not published")) {
      fails.push("video-10001ms must print the unpublished 48h right column");
    }
  }

  if (ctx.expectedEdit === "no-edit") {
    if (!output.includes("No edit:")) fails.push("expected No edit");
    if (output.includes("ONCE IT IS IN THE RUNNING") && ctx.followers > 1000 && !ctx.reply && !ctx.repost) {
      fails.push("clean original over 1k must omit Layer C heading");
    }
  }

  if (ctx.job === 2 && ctx.symptom === "video-died-at-two-days") {
    if (/no qualifying video/.test(output)) {
      fails.push("job2 two-day video death must not map to no qualifying video");
    }
    if (!output.includes("48-hour") && !output.includes("two-day")) {
      fails.push("job2 two-day video death must name the 48-hour gate or a two-day slice");
    }
  }

  if (!ctx.qkAnswer && /J-OFF-CATEGORY/.test(output)) {
    fails.push("J-OFF-CATEGORY must not fire without a QK answer");
  }

  if (reason === "reply" || reason === "repost") {
    if (output.includes("720")) fails.push("excluded posts must not print dump-hour reach");
  }

  return fails;
}

function main(argv) {
  if (argv.includes("--help") || argv.length === 0) {
    console.error("usage: node evaluate-reach.mjs --file <fixture.json>");
    process.exit(2);
  }
  const idx = argv.indexOf("--file");
  if (idx === -1) throw new Error("provide --file");
  const file = resolve(argv[idx + 1]);
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const output = evaluate(raw);
  process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  const fails = assertions(raw, output);
  if (fails.length) {
    console.error(`${basename(file)} assertions failed:`);
    for (const fail of fails) console.error(`  - ${fail}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }
}
