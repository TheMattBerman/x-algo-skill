#!/usr/bin/env node
/**
 * Rewrite renderer. Not the taught interface.
 * Paste-ready variants priced for copy-link, follow, or a real reply.
 * No file table. No score.
 */
import { FLOOR, FOOTER, TICKET } from "./evaluate-job4.mjs";

const HOW = [
  "HOW THIS WORKS",
  "An original gets into wider distribution after one like. That is the",
  "file For You is published to search. The feed drops it at 48 hours,",
  "even if it was working. Eight likes builds a lasting picture of who",
  "it is for.",
  "Replies, reposts, and thread parts never enter that file. Followers",
  "can see them for a moment. They cannot grow.",
  "Copy-link is priced 40x a like. Bookmarks and profile taps are not",
  "how it picks winners.",
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

function pushWrapped(out, text) {
  for (const line of wrap(text)) out.push(line);
}

function normalize(raw) {
  const reply = Boolean(raw.reply) || raw.postType === "reply";
  const repost = Boolean(raw.repost) || raw.postType === "repost";
  const community = Boolean(raw.community) || raw.postType === "community";
  const quote = Boolean(raw.quote) || raw.postType === "quote";
  let postType = raw.postType;
  if (!postType) {
    if (community) postType = "community";
    else if (reply) postType = "reply";
    else if (repost) postType = "repost";
    else if (quote) postType = "quote";
    else postType = "original";
  }
  return {
    text: String(raw.text || "").trim(),
    postType,
    reply: postType === "reply",
    repost: postType === "repost",
    community: postType === "community",
    quote: postType === "quote",
    nsfw: Boolean(raw.nsfw),
    vfDropped: Boolean(raw.vfDropped),
    expectedEdit: raw.expectedEdit ?? null,
    expectedSend: raw.expectedSend ?? null,
    expectedFollow: raw.expectedFollow ?? null,
    expectedReply: raw.expectedReply ?? null,
  };
}

function hasBait(text) {
  return /\b(like if you agree|tag \d+ friends|drop a . if you want|rt if|reply yes)\b/i.test(
    text,
  );
}

function hasProfileTap(text) {
  return /\b(check (out )?my profile|link in (my )?bio|tap my profile|visit my profile|click (my )?profile)\b/i.test(
    text,
  );
}

function hasFollowAsk(text) {
  return /\bfollow (me|for|if|along)\b/i.test(text);
}

function hasNamedSystem(text) {
  return /\b(\d+\s+(things|steps|ways|flows)|how to |playbook|checklist|system that)\b/i.test(
    text,
  );
}

function isSelfContained(text) {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (/^(yes|this\.|exactly|so true|agreed|the part|this point)\b/.test(t)) return false;
  if (/\bthe part about\b|\bthis point\b|\byou're right\b|\bthis\.\b/.test(t) && t.split(/\s+/).length < 16) {
    return false;
  }
  if (t.split(/\s+/).length < 8) return false;
  return true;
}

function dropBait(text) {
  return String(text)
    .replace(/[^.?\n]*\blike if you agree[^.?\n]*[.!?]*/gi, "")
    .replace(/[^.?\n]*\btag \d+ friends[^.?\n]*[.!?]*/gi, "")
    .replace(/[^.?\n]*\bdrop a . if you want[^.?\n]*[.!?]*/gi, "")
    .replace(/[^.?\n]*\brt if\b[^.?\n]*[.!?]*/gi, "")
    .replace(/[^.?\n]*\breply yes\b[^.?\n]*[.!?]*/gi, "")
    .replace(/[^.?\n]*so this blows up[^.?\n]*[.!?]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.!?])/g, "$1")
    .trim();
}

function stripReplyLead(text) {
  return String(text)
    .replace(/^(@\w+\s+)+/, "")
    .trim();
}

function dropProfileTap(text) {
  return String(text)
    .replace(/[^.?\n]*\b(check (out )?my profile|link in (my )?bio|tap my profile|visit my profile|click (my )?profile)\b[^.?\n]*[.!?]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.!?])/g, "$1")
    .trim();
}

function cleanBase(text) {
  return dropProfileTap(dropBait(stripReplyLead(text)));
}

function endSentence(text) {
  const t = String(text).trim();
  if (!t) return t;
  if (/[.!?]$/.test(t)) return t;
  return `${t}.`;
}

function followVariant(base) {
  let t = dropProfileTap(base);
  if (!t) return null;
  if (hasFollowAsk(t)) return t;
  return `${endSentence(t)} Follow if you want the next one.`;
}

function replyVariant(base, { leaveReply, bait }) {
  if (leaveReply || bait) return null;
  if (!base) return null;
  if (/\?/.test(base)) return base;
  if (!hasNamedSystem(base)) return null;
  return `${endSentence(base)} Which step would you steal first?`;
}

function statusBlock(ctx) {
  if (ctx.community) {
    return [
      `${padTok("CLOSED")}  this is a community post`,
      "          It can circulate for a moment.",
      "          It has no published path to pick up new distribution.",
    ];
  }
  if (ctx.reply) {
    return [
      `${padTok("CLOSED")}  this is a reply`,
      "          It can circulate for a moment.",
      "          It has no published path to pick up new distribution.",
    ];
  }
  if (ctx.repost) {
    return [
      `${padTok("CLOSED")}  this is a repost`,
      "          It can circulate for a moment.",
      "          It has no published path to pick up new distribution.",
    ];
  }
  if (ctx.nsfw) {
    return [
      `${padTok("CLOSED")}  NSFW mark`,
      "          Strangers' For You cannot search it while the mark is on.",
    ];
  }
  if (ctx.vfDropped) {
    return [
      `${padTok("CLOSED")}  visibility drop`,
      "          None of the searched files get written.",
    ];
  }
  return [
    `${padTok("OPEN")}  original`,
    `          ${FLOOR}`,
    `          ${TICKET}`,
  ];
}

function oneChange(ctx, { leaveReply, bait, profileTap, base }) {
  if (ctx.expectedEdit === "leave-reply" || leaveReply) {
    return {
      kind: "leave-reply",
      lines: [
        "THE ONE CHANGE",
        "Leave this a reply. The point does not stand on its own, so it will",
        "not pick up new distribution.",
      ],
    };
  }
  if (ctx.community) {
    return {
      kind: "community",
      lines: [
        "THE ONE CHANGE",
        "Post this on your timeline, not into a community. Opens a path to",
        "more reach.",
      ],
    };
  }
  if (ctx.reply) {
    const extra = bait ? " Drop the tag-and-like closer." : "";
    return {
      kind: "original",
      lines: [
        "THE ONE CHANGE",
        `Post this as an original on your timeline, not a reply.${extra}`,
      ],
    };
  }
  if (ctx.repost) {
    return {
      kind: "quote",
      lines: [
        "THE ONE CHANGE",
        "Post this as a quote with your comment, not a repost. Opens a path",
        "to more reach.",
      ],
    };
  }
  if (ctx.nsfw) {
    return {
      kind: "nsfw",
      lines: [
        "THE ONE CHANGE",
        "If you marked this NSFW, take the mark off. Opens a path to more",
        "reach.",
      ],
    };
  }
  if (bait) {
    return {
      kind: "bait",
      lines: ["THE ONE CHANGE", "Drop the bait close. Protects X's safety flags."],
    };
  }
  if (profileTap) {
    return {
      kind: "follow",
      lines: [
        "THE ONE CHANGE",
        "Ask for a follow, not a profile tap. Profile tap is priced 0.",
        "Follow is 4.0.",
      ],
    };
  }
  if (!base) {
    return {
      kind: "empty",
      lines: ["THE ONE CHANGE", "There is no draft to rewrite."],
    };
  }
  return {
    kind: "no-change",
    lines: ["NO CHANGE", "This draft is not leaving reach on the table."],
  };
}

function whyLines({ reason, bait, profileTap, leaveReply }) {
  const lines = ["WHY"];
  if (reason === "reply" || reason === "repost" || reason === "community") {
    pushWrapped(
      lines,
      "A reply, repost, or community post never enters the searched file.",
    );
  }
  if (leaveReply) {
    pushWrapped(lines, "A fragment under someone else's post cannot be filed as yours.");
  }
  if (bait) {
    pushWrapped(lines, "Bait closers draw the inspection you do not want.");
  }
  if (profileTap) {
    pushWrapped(lines, "Profile tap is priced 0. Follow is 4.0.");
  }
  pushWrapped(
    lines,
    "Copy-link is priced 40x a like. Bookmarks are not a ranking term.",
  );
  if (!leaveReply) {
    pushWrapped(
      lines,
      "The first like is the published ticket. The feed still drops it at 48 hours.",
    );
  }
  return lines;
}

function variantBlock(name, body) {
  if (!body) return null;
  return [name, body];
}

export function evaluateRewrite(raw) {
  const ctx = normalize(raw);
  const bait = hasBait(ctx.text);
  const profileTap = hasProfileTap(ctx.text);
  const cleaned = cleanBase(ctx.text);
  const leaveReply =
    ctx.expectedEdit === "leave-reply" ||
    (ctx.reply && !isSelfContained(ctx.text));
  const change = oneChange(ctx, { leaveReply, bait, profileTap, base: cleaned });

  const send = leaveReply
    ? null
    : ctx.expectedSend || cleaned || null;
  const follow = leaveReply
    ? null
    : ctx.expectedFollow || followVariant(cleaned);
  const reply = leaveReply
    ? null
    : ctx.expectedReply || replyVariant(cleaned, { leaveReply, bait });

  const out = ["REWRITE", "", ...statusBlock(ctx), "", ...change.lines];

  if (send) {
    out.push("");
    out.push(...variantBlock("SEND", send));
  }
  if (follow && follow !== send) {
    out.push("");
    out.push(...variantBlock("FOLLOW", follow));
  } else if (follow && !send) {
    out.push("");
    out.push(...variantBlock("FOLLOW", follow));
  }
  if (reply && reply !== send && reply !== follow) {
    out.push("");
    out.push(...variantBlock("REPLY", reply));
  }

  out.push("");
  out.push(
    ...whyLines({
      reason: ctx.community
        ? "community"
        : ctx.reply
          ? "reply"
          : ctx.repost
            ? "repost"
            : null,
      bait,
      profileTap,
      leaveReply,
    }),
  );
  out.push("");
  out.push(...HOW);
  out.push("");
  out.push(FOOTER);
  return out.join("\n");
}

export function rewriteAssertions(raw, output) {
  const ctx = normalize(raw);
  const fails = [];
  if (!/^REWRITE$/m.test(output)) fails.push("Rewrite must print REWRITE");
  if (!/^HOW THIS WORKS$/m.test(output)) fails.push("Rewrite must print HOW THIS WORKS");
  if (!output.includes(FOOTER)) fails.push("Rewrite must print the scope footer");
  if (/WHERE IT CAN SHOW UP/.test(output)) {
    fails.push("Rewrite must not print the file table");
  }
  if (/WHAT FILES IT/.test(output)) fails.push("Rewrite must not print WHAT FILES IT");
  if (/^TAPE$/m.test(output)) fails.push("Rewrite must not print TAPE");
  if (output.includes("\u2014")) fails.push("Rewrite must not emit em dashes");
  if (output.includes("**")) fails.push("Rewrite must not emit markdown bold");
  if (/\b(score|band|%|impressions?)\b/i.test(output) && !/Ask about any line/.test(output)) {
    fails.push("Rewrite must not invent a score");
  }
  if (ctx.reply && ctx.expectedEdit !== "leave-reply" && isSelfContained(ctx.text)) {
    if (!/^SEND$/m.test(output)) fails.push("self-contained reply must print SEND");
    if (hasBait(ctx.text) && /like if you agree/i.test(output.split("SEND")[1] || "")) {
      fails.push("SEND must drop bait");
    }
  }
  if (ctx.expectedEdit === "leave-reply" || (ctx.reply && !isSelfContained(ctx.text))) {
    if (/^SEND$/m.test(output)) fails.push("thin reply must not print SEND");
    if (!/Leave this a reply/.test(output)) {
      fails.push("thin reply must say leave this a reply");
    }
  }
  if (hasProfileTap(ctx.text) && /^FOLLOW$/m.test(output)) {
    const followBody = output.split("FOLLOW")[1] || "";
    if (/check my profile/i.test(followBody)) {
      fails.push("FOLLOW must not ask for a profile tap");
    }
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
