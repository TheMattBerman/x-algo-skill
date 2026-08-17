#!/usr/bin/env node
/**
 * Internal Job 4 renderer. Not the taught interface.
 * Tape versus the published rulebook: filed, still open, closed, do better.
 */
export const FOOTER =
  "This reads the code they published, not the live knobs they can turn on you tomorrow.";
export const TICKET =
  "The first like is the published ticket into wider distribution.";
export const FLOOR = "Followers can see it as soon as you post. That is the floor.";
export const PASTE_CLOSER =
  "Paste that draft and Rewrite will check it.";

const MAX_AGE_H = 48;
const WEEK_H = 168;
const MAX_AGE_MS = MAX_AGE_H * 3_600_000;

export function parseTime(value) {
  if (value == null) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function hoursBetween(later, earlier) {
  return (later - earlier) / 3_600_000;
}

function firstLine(text) {
  return String(text || "")
    .split(/\n/)
    .map((l) => l.trim())
    .find(Boolean) || "";
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

function authorHandle(post) {
  const a = post.author;
  if (a && typeof a === "object") {
    return String(a.userName || a.handle || a.username || "").replace(/^@/, "").toLowerCase();
  }
  return "";
}

function replyToHandle(post) {
  return String(post.inReplyToUsername || post.inReplyToUserName || "")
    .replace(/^@/, "")
    .toLowerCase();
}

export function classifyPost(post, accountHandle) {
  if (post.isCommunity || post.community) return "community";
  if (post.isRetweet || post.repost) return "repost";
  const mine = (accountHandle || authorHandle(post) || "").replace(/^@/, "").toLowerCase();
  const replyTo = replyToHandle(post);
  const isReply = Boolean(post.isReply || post.reply);
  const isQuote = Boolean(post.isQuote || post.quote);
  if (isReply && mine && replyTo && mine === replyTo) return "self-thread";
  if (isReply && isQuote) return "quote-reply";
  if (isReply) return "reply";
  if (isQuote) return "quote";
  return "original";
}

export function isOriginalish(kind) {
  return kind === "original" || kind === "quote";
}

function mentionsOf(text) {
  const found = [];
  const re = /@([A-Za-z0-9_]+)/g;
  let m;
  const src = String(text || "");
  while ((m = re.exec(src))) found.push(m[1].toLowerCase());
  return found;
}

function namedIdea(text) {
  return /\b(maybe we do|we should post|craziest things|\d+\s+craziest|next original)\b/i.test(
    String(text || ""),
  );
}

function ideaTitle(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  const maybe = raw.match(/maybe we do (?:a |an )?(.+?)(?: post)?$/i);
  if (maybe) {
    return maybe[1].replace(/\s+post$/i, "").trim();
  }
  const crazy = raw.match(/(\d+\s+craziest[^.]*)/i);
  if (crazy) return crazy[1].trim();
  return firstLine(raw);
}

function profileTapCta(text) {
  return /\b(bookmark this|check my profile|link in (my )?bio|subscribe to my newsletter|subscribe)\b/i.test(
    String(text || ""),
  );
}

function displayBrand(handle) {
  const h = String(handle || "").replace(/^@/, "");
  if (/coderabbit/i.test(h)) return "CodeRabbit";
  if (/firecrawl/i.test(h)) return "Firecrawl";
  if (/apify/i.test(h)) return "Apify";
  return h ? `@${h}` : null;
}

function clusterBrand(posts, handle) {
  const mine = String(handle || "").replace(/^@/, "").toLowerCase();
  const counts = {};
  for (const p of posts) {
    const skip = new Set([mine, p.inReplyToUsername].filter(Boolean));
    for (const m of p.mentions) {
      if (!m || skip.has(m)) continue;
      counts[m] = (counts[m] || 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? displayBrand(top[0]) : null;
}

function opsReply(text) {
  return /\b(got you|sent your way|sent over|just sent|rock it|sent !)\b/i.test(
    String(text || ""),
  );
}

function numberedList(text) {
  return /^\s*\d+\s*[/.)]/m.test(String(text || "")) ||
    /\b(1\/|2\/|3\/|8\/|9\/|10\/)\b/.test(String(text || ""));
}

function shortName(post) {
  const text = String(post.text || "");
  const money = text.match(/\$\d+(?:\/mo)?/i);
  if (money && /local media|brand/i.test(text)) return `${money[0]} local media`;
  if (money) return money[0];
  if (/grok/i.test(text) && /calendar/i.test(text)) return "Grok calendar";
  if (/github/i.test(text) && /a21/i.test(text)) return "GitHub/A21";
  if (/codex/i.test(text) && /\$0/.test(text)) return "Codex $0";
  if (/meta/i.test(text) && /ads cli/i.test(text)) return "Meta ads CLI";
  return oneLiner(post, 48);
}

function oneLiner(post, n = 70) {
  const line = firstLine(post.text);
  if (line.length <= n) return line;
  const cut = line.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > 24 ? cut.slice(0, sp) : cut);
}

function utcStamp(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function postUrl(p, i) {
  return p.url || p.twitterUrl || `https://x.com/i/status/${p.id || i + 1}`;
}

export function slimPost(p) {
  const author = p.author && typeof p.author === "object"
    ? {
        userName: p.author.userName || p.author.handle || p.author.username || null,
        followers: p.author.followers ?? p.author.followersCount ?? null,
      }
    : undefined;
  return {
    id: p.id,
    url: p.url || p.twitterUrl || null,
    twitterUrl: p.twitterUrl || null,
    text: p.text || p.fullText || "",
    fullText: p.fullText || p.text || "",
    createdAt: p.createdAt || null,
    isReply: Boolean(p.isReply || p.reply),
    isRetweet: Boolean(p.isRetweet || p.repost),
    isQuote: Boolean(p.isQuote || p.quote),
    likeCount: Number(p.likeCount ?? p.likes ?? 0) || 0,
    bookmarkCount: p.bookmarkCount == null ? null : Number(p.bookmarkCount) || 0,
    replyCount: Number(p.replyCount ?? 0) || 0,
    quoteCount: Number(p.quoteCount ?? 0) || 0,
    retweetCount: Number(p.retweetCount ?? 0) || 0,
    viewCount: p.viewCount == null ? null : Number(p.viewCount) || 0,
    conversationId: p.conversationId || null,
    inReplyToUsername: p.inReplyToUsername || p.inReplyToUserName || null,
    author,
  };
}

function isProfileOriginalish(post) {
  if (post.isRetweet || post.repost) return false;
  if (post.isReply || post.reply) return false;
  return true;
}

function isProfileOriginal(post) {
  return isProfileOriginalish(post) && !post.isQuote && !post.quote;
}

export function mergePulls(profilePosts, repliesPosts, opts = {}) {
  const now = parseTime(opts.now) || Date.now();
  const max = opts.max == null ? null : Number(opts.max);
  const seen = new Map();
  for (const [src, list] of [
    ["profile", profilePosts || []],
    ["with_replies", repliesPosts || []],
  ]) {
    for (const post of list) {
      const id = String(post.id || "");
      if (!id || seen.has(id)) continue;
      seen.set(id, { ...slimPost(post), _pull: src });
    }
  }

  let posts = [...seen.values()].sort((a, b) => {
    const am = parseTime(a.createdAt) || 0;
    const bm = parseTime(b.createdAt) || 0;
    return bm - am;
  });

  if (max && posts.length > max) {
    posts = posts.slice(0, max);
  }

  const keep = new Map(posts.map((p) => [String(p.id), p]));
  for (const post of profilePosts || []) {
    const created = parseTime(post.createdAt);
    if (!isProfileOriginalish(post) || created == null) continue;
    if (now - created <= MAX_AGE_MS) {
      const slim = { ...slimPost(post), _pull: "profile", _floor: "live-original" };
      if (!keep.has(String(slim.id))) keep.set(String(slim.id), slim);
    }
  }

  const pictured = (profilePosts || [])
    .filter((p) => isProfileOriginal(p) && (Number(p.likeCount ?? p.likes ?? 0) || 0) >= 8)
    .map((p) => ({ p, t: parseTime(p.createdAt) || 0 }))
    .sort((a, b) => b.t - a.t)[0];
  if (pictured) {
    const slim = { ...slimPost(pictured.p), _pull: "profile", _floor: "last-picture" };
    if (!keep.has(String(slim.id))) keep.set(String(slim.id), slim);
  }

  return {
    pulls: ["profile", "with_replies"],
    posts: [...keep.values()].sort((a, b) => {
      const am = parseTime(a.createdAt) || 0;
      const bm = parseTime(b.createdAt) || 0;
      return bm - am;
    }),
  };
}

export function normalizeSample(raw) {
  const now = parseTime(raw.now) || Date.now();
  const handle = String(raw.handle || "").replace(/^@/, "").toLowerCase();
  let sourcePosts = raw.posts || [];
  let pulls = raw.pulls || null;
  if ((!sourcePosts.length || raw.profilePosts || raw.repliesPosts) && (raw.profilePosts || raw.repliesPosts)) {
    const merged = mergePulls(raw.profilePosts, raw.repliesPosts, {
      now: raw.now,
      max: raw.max,
    });
    sourcePosts = merged.posts;
    pulls = pulls || merged.pulls;
  }
  const posts = sourcePosts.map((p, i) => {
    const created = parseTime(p.createdAt);
    const kind = classifyPost(p, handle || authorHandle(p));
    const ageH = created == null ? null : hoursBetween(now, created);
    const text = p.text || p.fullText || "";
    return {
      id: String(p.id || i + 1),
      url: postUrl(p, i),
      text,
      createdAt: p.createdAt || null,
      createdMs: created,
      ageH,
      kind,
      likeCount: Number(p.likeCount ?? p.likes ?? 0) || 0,
      bookmarkCount: p.bookmarkCount == null ? null : Number(p.bookmarkCount) || 0,
      replyCount: Number(p.replyCount ?? 0) || 0,
      quoteCount: Number(p.quoteCount ?? 0) || 0,
      retweetCount: Number(p.retweetCount ?? 0) || 0,
      viewCount: p.viewCount == null ? null : Number(p.viewCount) || 0,
      followers: p.author?.followers ?? p.followers ?? raw.followers ?? null,
      conversationId: p.conversationId ? String(p.conversationId) : null,
      inReplyToUsername: replyToHandle(p),
      mentions: mentionsOf(text),
      _pull: p._pull || null,
      _floor: p._floor || null,
    };
  });
  const ingest = raw.ingest || raw.ingestMode || null;
  if (!pulls && ingest === "apify") pulls = ["profile", "with_replies"];
  return {
    now,
    handle: raw.handle || null,
    ingest,
    pulls,
    posts,
  };
}

function padTok(token) {
  return String(token).padEnd(8, " ");
}

function hookLine(text, width = 56) {
  const line = firstLine(text).replace(/\s+/g, " ").trim();
  if (line.length <= width) return line;
  const cut = line.slice(0, width);
  const sp = cut.lastIndexOf(" ");
  return (sp > 20 ? cut.slice(0, sp) : cut);
}

function indent(text) {
  return `          ${text}`;
}

function pushIndented(out, text, width = 60) {
  for (const line of wrap(text, width)) out.push(indent(line));
}

function statsLine(p) {
  const bits = [`${p.likeCount} ${p.likeCount === 1 ? "like" : "likes"}`];
  if (p.bookmarkCount) bits.push(`${p.bookmarkCount} ${p.bookmarkCount === 1 ? "bookmark" : "bookmarks"}`);
  if (p.replyCount) bits.push(`${p.replyCount} ${p.replyCount === 1 ? "reply" : "replies"}`);
  if (p.quoteCount) bits.push(`${p.quoteCount} ${p.quoteCount === 1 ? "quote" : "quotes"}`);
  return bits.join(" · ");
}

function kindCounts(posts) {
  const bag = {};
  for (const p of posts) bag[p.kind] = (bag[p.kind] || 0) + 1;
  return bag;
}

function countLine(bag) {
  const order = ["original", "quote", "self-thread", "repost", "reply", "quote-reply", "community"];
  const parts = [];
  const noun = {
    original: ["original", "originals"],
    quote: ["quote", "quotes"],
    "self-thread": ["self-thread item", "self-thread items"],
    repost: ["repost", "reposts"],
    reply: ["reply", "replies"],
    "quote-reply": ["quote-reply", "quote-replies"],
    community: ["community post", "community posts"],
  };
  for (const k of order) {
    if (!bag[k]) continue;
    const pair = noun[k];
    parts.push(`${bag[k]} ${bag[k] === 1 ? pair[0] : pair[1]}`);
  }
  return parts.join(", ") || "no posts";
}

function mixLine(posts) {
  const bag = kindCounts(posts);
  const replyN = (bag.reply || 0) + (bag["quote-reply"] || 0);
  const parts = [];
  if (bag.original) parts.push(`${bag.original} ${bag.original === 1 ? "original" : "originals"}`);
  if (bag.quote) parts.push(`${bag.quote} ${bag.quote === 1 ? "quote" : "quotes"}`);
  if (bag["self-thread"]) parts.push(`${bag["self-thread"]} thread parts`);
  if (bag.repost) parts.push(`${bag.repost} ${bag.repost === 1 ? "repost" : "reposts"}`);
  if (replyN) parts.push(`${replyN} ${replyN === 1 ? "reply" : "replies"}`);
  if (bag.community) parts.push(`${bag.community} community`);
  return parts.join("   ");
}

function renderHeader(sample) {
  const handle = String(sample.handle || "handle").replace(/^@/, "");
  return [`@${handle}`, mixLine(sample.posts)];
}

function renderFiled(filed) {
  if (!filed.length) return null;
  const lines = ["FILED"];
  const aged = filed.some((p) => p.ageH != null && p.ageH > MAX_AGE_H);
  if (aged) {
    lines.push("Past 48 hours. Traction does not extend For You. No video exemption.");
  }
  const ranked = [...filed].sort((a, b) => {
    const ap = a.likeCount >= 8 ? 1 : 0;
    const bp = b.likeCount >= 8 ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return b.likeCount - a.likeCount;
  });
  let anyPicture = false;
  for (const p of ranked) {
    const token = p.likeCount >= 8 ? "PICTURE" : "TICKET";
    if (p.likeCount >= 8) anyPicture = true;
    lines.push(`${padTok(token)}  ${hookLine(p.text)}`);
    lines.push(indent(statsLine(p)));
    if (p.bookmarkCount) {
      lines.push(indent("bookmarks are saves, not a published ranking term"));
    }
    if (p.likeCount >= 8) {
      pushIndented(lines, "named system someone can send. Copy-link is 40x a like.");
    }
    lines.push(indent(p.url));
    lines.push("");
  }
  if (lines[lines.length - 1] === "") lines.pop();
  if (!anyPicture) {
    pushWrapped(lines, "No original in this window crossed 8 likes. No lasting picture.");
  }
  return lines;
}

function renderOpen(open) {
  if (!open.length) return null;
  const lines = ["STILL OPEN", ""];
  for (const p of open) {
    const left = p.ageH == null ? null : Math.max(0, Math.ceil(MAX_AGE_H - p.ageH));
    const dieAt = p.createdMs == null ? null : utcStamp(p.createdMs + MAX_AGE_MS);
    lines.push(`${padTok("0 LIKES")}  ${hookLine(p.text)}`);
    if (dieAt) {
      lines.push(indent(`dies ${dieAt}${left != null ? ` (~${left}h)` : ""}`));
    } else if (left != null) {
      lines.push(indent(`dies in ~${left}h`));
    }
    lines.push(indent("Still inside 48 hours. Followers can see it."));
    lines.push(indent("For You cannot search it yet."));
    lines.push(indent(p.url));
  }
  return lines;
}

function threadRoot(sample, threadPosts) {
  const ids = new Set(threadPosts.map((p) => p.conversationId).filter(Boolean));
  for (const id of ids) {
    const root = sample.posts.find((p) => p.id === id && isOriginalish(p.kind));
    if (root) return root;
  }
  return null;
}

function sameTopicPairs(filed, closed) {
  const pairs = [];
  const ideas = closed.filter((p) => (p.kind === "reply" || p.kind === "quote-reply") && namedIdea(p.text));
  for (const idea of ideas) {
    const ideaTokens = new Set([
      ...idea.mentions,
      idea.inReplyToUsername,
    ].filter(Boolean));
    const match = filed.find((f) => {
      const tokens = new Set(f.mentions);
      for (const t of ideaTokens) {
        if (t && tokens.has(t)) return true;
      }
      if (/apify/i.test(idea.text) && /apify/i.test(f.text)) return true;
      return false;
    });
    if (match) pairs.push({ filed: match, idea });
  }
  return pairs;
}

function nearMisses(filedWeek, sample) {
  const hits = [];
  for (const p of filedWeek) {
    if (p.likeCount < 1 || p.likeCount >= 8) continue;
    const kids = sample.posts.filter(
      (x) => x.kind === "self-thread" && x.conversationId && x.conversationId === p.id,
    );
    const listy = kids.some((k) => numberedList(k.text)) || numberedList(p.text);
    if (kids.length && listy) hits.push({ root: p, kids });
  }
  return hits;
}

function samePond(filed) {
  if (filed.length < 2) return false;
  const shapes = filed.map((p) => {
    const line = firstLine(p.text).toLowerCase();
    const numberedOpen = /^\d+\s+things/.test(line);
    const steal = /\bsteal this\b/i.test(p.text);
    const steps = (p.text.match(/^\s*\d+[./]/gm) || []).length;
    return { numberedOpen, steal, steps };
  });
  let shared = 0;
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i];
      const b = shapes[j];
      if (a.numberedOpen && b.numberedOpen && a.steal && b.steal) shared += 1;
      else if (a.numberedOpen && b.numberedOpen && a.steps === b.steps && a.steps >= 3) shared += 1;
    }
  }
  return shared >= 1;
}

function renderClosed(closed, ctx) {
  if (!closed.length) return null;
  const { sample, filed } = ctx;
  const lines = ["CLOSED", ""];
  const threads = closed.filter((p) => p.kind === "self-thread");
  const reposts = closed.filter((p) => p.kind === "repost");
  const replies = closed.filter((p) => p.kind === "reply" || p.kind === "quote-reply");
  const ctas = [...closed, ...sample.posts].filter((p) => profileTapCta(p.text));
  const ops = replies.filter((p) => opsReply(p.text));
  const pairs = sameTopicPairs(filed, closed);
  const misses = nearMisses(filed, sample);
  const foolViews = replies.filter((p) => p.viewCount != null && p.viewCount >= 500);

  for (const pair of pairs) {
    const under = pair.idea.inReplyToUsername ? `@${pair.idea.inReplyToUsername}` : "a reply";
    lines.push(`${padTok("REPLY")}  ${hookLine(ideaTitle(pair.idea.text))}`);
    lines.push(indent(`sitting under ${under}`));
    lines.push(indent(pair.idea.url));
    pushIndented(lines, `${shortName(pair.filed)} was filed. Same topic, two fates.`);
    pushIndented(lines, "A reply cannot enter the searched file.");
    lines.push("");
  }

  const idea = closed.find((p) => namedIdea(p.text));
  if (idea && !pairs.some((x) => x.idea.id === idea.id)) {
    pushWrapped(lines, `You already titled a next original inside a reply: ${ideaTitle(idea.text)}`);
    pushWrapped(lines, `${idea.url}`);
    pushWrapped(lines, "A reply cannot enter the searched file.");
  }

  if (idea && idea.mentions.length) {
    const tag = idea.inReplyToUsername || idea.mentions[0];
    pushWrapped(lines, `Tagging @${tag} does not file you.`);
  }

  for (const miss of misses) {
    pushWrapped(
      lines,
      `${shortName(miss.root)} punched the ticket at ${miss.root.likeCount} likes. The sendable list is ${miss.kids.length} self-thread parts under that root. They cannot be filed.`,
    );
  }

  if (threads.length && !misses.length) {
    const root = threadRoot(sample, threads);
    pushWrapped(
      lines,
      `${threads.length} thread parts${root ? ` under ${shortName(root)}` : ""}. They cannot be filed.`,
    );
  }

  if (reposts.length) {
    const rabbit = reposts.filter((r) => /coderabbit/i.test(r.text));
    if (rabbit.length) {
      pushWrapped(
        lines,
        `${rabbit.length} CodeRabbit reposts. A quote with a comment would have been writable.`,
      );
    } else {
      pushWrapped(
        lines,
        `${reposts.length} reposts. A quote with a comment would have been writable.`,
      );
    }
  }

  if (ops.length >= 3) {
    const brand = clusterBrand(ops, sample.handle);
    pushWrapped(
      lines,
      `${ops.length} sent / got you / rock it${brand ? ` under ${brand}` : ""}. Ops, not reach. Leave them.`,
    );
  }

  if (ctas.length) {
    pushWrapped(lines, "Subscribe / bookmark closer: profile tap counts 0. Ask for a follow.");
  }

  if (foolViews.length) {
    const p = [...foolViews].sort((a, b) => b.viewCount - a.viewCount)[0];
    pushWrapped(lines, `${p.viewCount} views on a reply is not the ticket.`);
  }

  if (replies.length >= 5) {
    pushWrapped(
      lines,
      `${replies.length} replies. Followers keep the last 30 for 2 days. Then they evaporate.`,
    );
  } else if (replies.length && lines.length === 2) {
    pushWrapped(
      lines,
      `${replies.length} replies. They can circulate for a moment. They have no published path to pick up new distribution.`,
    );
  }

  if (lines.length === 1) return null;
  return lines;
}

function renderNotThisWeek(old) {
  if (!old.length) return null;
  const lines = ["NOT THIS WEEK", ""];
  for (const p of old.slice(0, 2)) {
    lines.push(`${padTok(String(p.likeCount))}  ${hookLine(p.text)}`);
    lines.push(indent("Shape contrast, not this week."));
    if (p.likeCount >= 32) {
      lines.push(indent("Crossed 32. That writes a file nothing published searches."));
    }
    lines.push("");
  }
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function renderDoBetter({ open, filed, closed, stacked, pond }) {
  const lines = ["DO BETTER"];
  const idea = closed.find((p) => namedIdea(p.text));
  const shape = [...filed].sort((a, b) => b.likeCount - a.likeCount).find((p) => p.likeCount >= 8)
    || [...filed].sort((a, b) => b.likeCount - a.likeCount)[0];
  let n = 0;
  const add = (text) => {
    if (n >= 3) return;
    pushWrapped(lines, text);
    n += 1;
  };

  if (idea) {
    const title = ideaTitle(idea.text);
    if (shape) {
      add(
        `Post "${title}" as one standalone original, in the ${shortName(shape)} shape. Not as a reply. Not as a self-thread.`,
      );
    } else {
      add(`Post "${title}" as one standalone original. Not as a reply.`);
    }
  } else if (pond) {
    add("These originals share a shape. That is not more reach. Change the object, not the skeleton.");
  } else if (shape) {
    add(`Next original should look like ${shape.url}: named object, stealable system.`);
  }

  if (open.length) {
    const first = open[0];
    add(
      `One like on ${shortName(first)} files it. That is not the week's plan.`,
    );
  }

  if (stacked && n < 3) {
    add(
      "Do not drop the next original next to another original in the same refresh. Second keeps 62.5 percent, third 43.75, floor 25.",
    );
    lines.push("(ranking_scorer.rs:614-616; param.rs:222-239)");
  }

  if (n === 0) {
    add("This sample is not leaving a published reach move on the table.");
  }

  lines.push("");
  lines.push(PASTE_CLOSER);
  lines.push(TICKET);
  lines.push(FLOOR);
  return lines;
}

function renderHowThisWorks() {
  return [
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
}

function stackedOriginals(originals) {
  const timed = originals.filter((p) => p.createdMs != null).sort((a, b) => a.createdMs - b.createdMs);
  for (let i = 1; i < timed.length; i++) {
    if (Math.abs(timed[i].createdMs - timed[i - 1].createdMs) <= 15 * 60 * 1000) return true;
  }
  return false;
}

export function evaluateJob4(raw) {
  const sample = normalizeSample(raw);
  const filed = sample.posts.filter(
    (p) => isOriginalish(p.kind) && p.likeCount >= 1 && (p.ageH == null || p.ageH <= WEEK_H),
  );
  const open = sample.posts.filter(
    (p) => isOriginalish(p.kind) && p.likeCount === 0 && p.ageH != null && p.ageH <= MAX_AGE_H,
  );
  const closed = sample.posts.filter((p) => !isOriginalish(p.kind));
  const old = sample.posts
    .filter((p) => isOriginalish(p.kind) && p.likeCount >= 8 && p.ageH != null && p.ageH > WEEK_H)
    .sort((a, b) => b.likeCount - a.likeCount);
  const orig = sample.posts.filter((p) => isOriginalish(p.kind));

  const blocks = [
    renderHeader(sample),
    renderOpen(open),
    renderFiled(filed),
    renderClosed(closed, { sample, filed }),
    renderNotThisWeek(old),
    renderDoBetter({
      open,
      filed,
      closed,
      stacked: stackedOriginals(orig),
      pond: samePond(filed),
    }),
    renderHowThisWorks(),
  ].filter(Boolean);

  const out = [];
  for (const block of blocks) {
    if (out.length) out.push("");
    out.push(...block);
  }
  out.push("");
  out.push(FOOTER);
  return out.join("\n");
}

export function job4Assertions(raw, output) {
  const fails = [];
  if (/^TAPE$/m.test(output)) fails.push("Job 4 must not print TAPE");
  if (/after merge/i.test(output)) fails.push("Job 4 must not print merge");
  if (/\b1 likes\b/.test(output)) fails.push("Job 4 must not print 1 likes");
  if (!/^DO BETTER$/m.test(output)) fails.push("Job 4 must print DO BETTER");
  if (!/^HOW THIS WORKS$/m.test(output)) fails.push("Job 4 must print HOW THIS WORKS");
  if (!output.includes(FOOTER)) fails.push("Job 4 must print the scope footer");
  if (!output.includes(PASTE_CLOSER) && !/paste that draft and Rewrite/i.test(output)) {
    fails.push("Last 20 DO BETTER must send them to Rewrite");
  }
  if (/^Rewrite:/m.test(output) || /paste-ready/.test(output)) {
    fails.push("Job 4 must not write a new post");
  }
  if (/let me check/i.test(output)) fails.push("Job 4 must not narrate above the scan");
  if (output.includes("\u2014")) fails.push("Job 4 must not emit em dashes");
  if (output.includes("**")) fails.push("Job 4 must not emit markdown bold");
  if (/share via copy link[\s\S]*profile click/i.test(output)) {
    fails.push("Job 4 must not print the full weight table");
  }
  if (/no original inside 48 hours/i.test(output)) {
    fails.push("Job 4 must not print the v4.2 no-original miss");
  }
  if (/write an original on grok/i.test(output)) {
    fails.push("Job 4 must not print write-an-original-on-grok");
  }
  if (/mutual-like/i.test(output)) {
    fails.push("Job 4 must not invent a mutual-like term");
  }
  if (/\b\d+\s+mutuals\b/i.test(output)) {
    fails.push("Job 4 must not invent a mutual count");
  }
  if (raw.expectedBlocks) {
    for (const name of raw.expectedBlocks) {
      if (!new RegExp(`^${name}$`, "m").test(output)) fails.push(`expected block ${name}`);
    }
  }
  if (raw.forbiddenBlocks) {
    for (const name of raw.forbiddenBlocks) {
      if (new RegExp(`^${name}$`, "m").test(output)) fails.push(`forbidden block ${name}`);
    }
  }
  const collapsed = output.replace(/\s+/g, " ");
  if (raw.expectedPhrases) {
    for (const phrase of raw.expectedPhrases) {
      const needle = String(phrase).replace(/\s+/g, " ");
      if (!collapsed.includes(needle) && !output.includes(phrase)) {
        fails.push(`missing phrase: ${phrase}`);
      }
    }
  }
  if (raw.forbiddenPhrases) {
    for (const phrase of raw.forbiddenPhrases) {
      const needle = String(phrase).replace(/\s+/g, " ");
      if (collapsed.includes(needle) || output.includes(phrase)) {
        fails.push(`forbidden phrase: ${phrase}`);
      }
    }
  }
  const sample = normalizeSample(raw);
  const replies = sample.posts.filter((p) => p.kind === "reply" || p.kind === "self-thread" || p.kind === "quote-reply");
  if (replies.length >= 5) {
    if (!/^CLOSED$/m.test(output)) fails.push("reply-heavy sample must print CLOSED");
  }
  const bag = kindCounts(sample.posts);
  if ((bag["self-thread"] || 0) > 0 && !/thread parts/i.test(output) && !/self-thread/i.test(output)) {
    fails.push("scan with self-threads must count them");
  }
  return fails;
}
