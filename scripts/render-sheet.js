#!/usr/bin/env node
/**
 * X algorithm cheat sheet — SVG pages, zero dependencies.
 * Character-cell layout. No HTML, no Puppeteer, no color accent.
 */
const fs = require("fs");
const path = require("path");

const BG = "#111111";
const FG = "#e8e8e8";
const MID = "#a0a0a0";
const DIM = "#6b6b6b";
const LINE = "#5a5a5a";
const FONT =
  "Menlo, Monaco, 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', monospace";

const W = 1080;
const PAD = 36;
const FS = 14;
const CW = 8.4;
const LH = 20;
const TITLE_FS = 18;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function text(x, y, str, opts = {}) {
  const fill = opts.fill || FG;
  const size = opts.size || FS;
  const anchor = opts.anchor || "start";
  const extra = str.indexOf("  ") >= 0 ? ` xml:space="preserve"` : "";
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="400" fill="${fill}" text-anchor="${anchor}"${extra}>${esc(str)}</text>`;
}

function line(x1, y1, x2, y2, opts = {}) {
  const sw = opts.sw || 1;
  const dash = opts.dash ? ` stroke-dasharray="${opts.dash}"` : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${opts.stroke || LINE}" stroke-width="${sw}"${dash}/>`;
}

const BOX_TOP = 28;
const CITE_GAP = 16; // baseline-to-baseline from last body line to first cite
const CITE_LH = 16;
const BOX_BOTTOM = 10;

function stateStyle(_gate) {
  return { sw: 1, dash: null };
}

function bullets(items, maxChars) {
  const lines = [];
  for (const item of items) {
    if (typeof item === "string") {
      wrap(item, maxChars - 2).forEach((ln, i) => {
        lines.push(i === 0 ? `▸ ${ln}` : `  ${ln}`);
      });
      continue;
    }
    wrap(item.text, maxChars - 2).forEach((ln, i) => {
      lines.push(i === 0 ? `▸ ${ln}` : `  ${ln}`);
    });
    (item.kids || []).forEach((kid, ki, arr) => {
      const branch = ki === arr.length - 1 ? "└─ " : "├─ ";
      wrap(kid, maxChars - 3).forEach((ln, i) => {
        lines.push(i === 0 ? `${branch}${ln}` : `   ${ln}`);
      });
    });
  }
  return lines;
}

function wrapAll(strings, maxChars) {
  return strings.flatMap((s) => wrap(s, maxChars));
}

function measure(bodyLines, citeLines, colRows = 0) {
  const rows = colRows + bodyLines.length;
  let lastBaseline = BOX_TOP;
  if (rows > 0) lastBaseline = BOX_TOP + (rows - 1) * LH;
  if (citeLines.length) {
    const citeStart = lastBaseline + CITE_GAP;
    lastBaseline = citeStart + (citeLines.length - 1) * CITE_LH;
  }
  return lastBaseline + BOX_BOTTOM;
}

function titledBox(x, y, w, h, title, state, bodyLines, citeLines, opts = {}) {
  const st = stateStyle(state);
  const dash = st.dash ? ` stroke-dasharray="${st.dash}"` : "";
  let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${LINE}" stroke-width="${st.sw}"${dash}/>`;

  const stateStr = state ? ` ${state} ` : "";
  const stateW = stateStr.length * CW;
  const maxTitlePx = w - 28 - (state ? stateW + 8 : 0);
  let titleStr = ` ${title} `;
  const maxTitleChars = Math.max(4, Math.floor(maxTitlePx / CW));
  if (titleStr.length > maxTitleChars) {
    titleStr = ` ${title.slice(0, Math.max(1, maxTitleChars - 4))}… `;
  }
  const titleW = titleStr.length * CW;

  svg += `<rect x="${x + 10}" y="${y - 9}" width="${titleW}" height="18" fill="${BG}"/>`;
  svg += text(x + 10, y + 5, titleStr, { fill: FG });

  if (state) {
    const sx = x + w - 10 - stateW;
    svg += `<rect x="${sx}" y="${y - 9}" width="${stateW}" height="18" fill="${BG}"/>`;
    svg += text(sx, y + 5, stateStr, { fill: FG });
  }

  let yy = y + BOX_TOP;
  const leftLines = opts.leftLines || [];
  const rightLines = opts.rightLines || [];
  if (leftLines.length || rightLines.length) {
    const n = Math.max(leftLines.length, rightLines.length);
    const rightX = x + Math.floor(w / 2) + 4;
    for (let i = 0; i < n; i++) {
      if (leftLines[i]) svg += text(x + 14, yy, leftLines[i], { fill: FG });
      if (rightLines[i]) svg += text(rightX, yy, rightLines[i], { fill: FG });
      yy += LH;
    }
  }
  for (const ln of bodyLines) {
    svg += text(x + 14, yy, ln, { fill: FG });
    yy += LH;
  }
  if (citeLines.length) {
    yy = yy - LH + CITE_GAP;
    for (const ln of citeLines) {
      svg += text(x + 14, yy, ln, { fill: DIM, size: 12 });
      yy += CITE_LH;
    }
  }
  return svg;
}

function sectionRule(x, y, width, label) {
  const labelStr = ` ${label} `;
  const labelW = labelStr.length * CW;
  let svg = line(x, y, x + width, y);
  svg += `<rect x="${x}" y="${y - 9}" width="${labelW}" height="18" fill="${BG}"/>`;
  svg += text(x, y + 5, labelStr, { fill: FG });
  return svg;
}

function footer(y, takeaway) {
  let svg = line(PAD, y, W - PAD, y);
  svg += text(PAD, y + 24, takeaway, { fill: DIM });
  svg += text(W - PAD, y + 24, "@themattberman", { fill: DIM, anchor: "end" });
  return svg;
}

function header(title, kickerLines) {
  let svg = text(PAD, 40, title, { size: TITLE_FS, fill: FG });
  let y = 64;
  for (const ln of kickerLines) {
    svg += text(PAD, y, ln, { fill: MID });
    y += LH;
  }
  return { svg, y: y + 10 };
}

function svgDoc(h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${BG}"/>
  ${inner}
</svg>
`;
}

function padRow(action, weight, cite, actionW, weightW) {
  return `${action.padEnd(actionW)}${String(weight).padStart(weightW)}  ${cite}`;
}

function page1() {
  const innerW = W - PAD * 2;
  const maxChars = Math.floor((innerW - 28) / CW);
  const kicker = wrap(
    "will this post get seen? five retrieval sources fill a top-50. then visibility filtering can void all five. every call is a yes or no in x's published code, cited to the line.",
    Math.floor(innerW / CW)
  );

  const doors = [
    {
      title: "your followers",
      state: "always on",
      items: [
        "thunder. open by default. replies and reposts still served, at 0.75",
        "50 most recent originals, 30 most recent replies",
        "2-day retention. feed age gate is 48h",
      ],
      cites: ["thunder/config.rs:5-6 · thunder/args.rs:48-49 · config.rs:36"],
    },
    {
      title: "a bump while you're small",
      state: "under 1k only",
      items: [
        "cold start. original only. not a reply or repost",
        "author followers <= 1000. views < 1000",
        "pending: top 85% of the non-zero pool, per request. bottom 15% ineligible",
      ],
      cites: ["author_cold_start.rs:86-91, 167-189 · param.rs:620-663"],
    },
    {
      title: "strangers' for you",
      state: "originals only",
      items: [
        "phoenix retrieval. hard-closed for replies, reposts, and community posts",
        {
          text: "pending a post-publish like",
          kids: ["first like → 1fav index", "32 likes → 32fav index"],
        },
        "text retention 24h and 48h",
      ],
      cites: [
        "phoenixRankAllCandidateProcessor.strato:441-446, 62-92",
        "oon_retweet_reply_filter.rs:13-18",
      ],
    },
    {
      title: "people already into this",
      state: "8 likes",
      items: [
        "simclusters. pending 8 likes for a persistent embedding",
        "ann drops anything under 0.5",
        "8-hour half-life — the only real engagement half-life in the release",
      ],
      cites: ["Configs.scala:39, 65 · simclusters_source.rs:35"],
    },
    {
      title: "still findable next month",
      state: "video > 10s",
      items: [
        "video long tail. requires video. text falls out of retrieval in 24 to 48 hours",
        "48 / 96 / 168 / 336 / 720h windows need duration strictly > 10,000 ms (exactly 10,000 ms is excluded)",
        "evergreen video sits 5 years; those index writers check media type only, not duration",
        "VQV weight credit is a separate >10,000 ms gate",
      ],
      cites: [
        "eventProcessing.strato:24, 389-405 · phoenix-rankall/src/config/mod.rs:139-156",
        "param.rs:677-682",
      ],
    },
  ];

  const kill = {
    title: "the kill switch",
    state: "runs last",
    items: [
      "visibility filtering. not a door you open",
      "28 rules run for everyone. 26 more run for people who do not follow you",
      "runs after top-50 selection, so a labeled post can take a slot and then vanish",
      "labels are set membership only: score, expiry, country, and holdback are discarded",
    ],
    cites: [
      "phoenix_candidate_pipeline.rs:398-421 · registry.rs:101-170",
      "safety_labels.rs:21-28",
    ],
  };

  const parts = [];
  const head = header("THE SIX DOORS", kicker);
  parts.push(head.svg);
  let y = head.y;

  parts.push(sectionRule(PAD, y, innerW, "FIVE WAYS IN"));
  y += 18;
  const flow = wrap(
    "thunder → cold start → phoenix retrieval → simclusters → video long tail → TopKScoreSelector keeps 50",
    Math.floor(innerW / CW)
  );
  for (const ln of flow) {
    parts.push(text(PAD, y, ln, { fill: DIM }));
    y += LH;
  }
  y += 8;

  for (const d of doors) {
    const body = bullets(d.items, maxChars);
    const cites = wrapAll(d.cites, maxChars);
    const h = measure(body, cites);
    parts.push(titledBox(PAD, y, innerW, h, d.title, d.state, body, cites));
    y += h + 14;
  }

  y += 4;
  const cx = W / 2;
  parts.push(line(cx, y, cx, y + 18));
  parts.push(text(cx, y + 36, "▼ after the top-50 is selected", { fill: MID, anchor: "middle" }));
  y += 52;

  parts.push(sectionRule(PAD, y, innerW, "THEN ONE WAY OUT"));
  y += 20;
  {
    const body = bullets(kill.items, maxChars);
    const cites = wrapAll(kill.cites, maxChars);
    const h = measure(body, cites);
    parts.push(titledBox(PAD, y, innerW, h, kill.title, kill.state, body, cites));
    y += h + 24;
  }

  parts.push(footer(y, "five ways in. one kill switch after the fifty."));
  const h = y + 50;
  return { svg: svgDoc(h, parts.join("\n  ")), h };
}

function page2() {
  const innerW = W - PAD * 2;
  const maxChars = Math.floor((innerW - 28) / CW);
  const kicker = wrap(
    "each weight multiplies an unpublished predicted probability. relative pricing, not an exchange rate. experiment arms can differ.",
    Math.floor(innerW / CW)
  );

  const positives = [
    ["copy-link share", "20.0", "param.rs:325-330"],
    ["reply", "5.0", "param.rs:283"],
    ["quote", "5.0", "param.rs:332"],
    ["DM share", "5.0", "param.rs:319-324"],
    ["follow the author", "4.0", "param.rs:345-350"],
    ["generic share", "2.0", "param.rs:318"],
    ["repost", "1.0", "param.rs:296"],
    ["like", "0.5", "param.rs:282"],
    ["click", "0.4", "param.rs:309"],
    ["open a link", "0.2", "param.rs:310"],
    ["photo expand", "0.05", "param.rs:297-300"],
    ["video open", "0.05", "param.rs:303-308"],
    ["video quality view", "0.05", "param.rs:317"],
    ["unexplored in-network original", "0.02", "param.rs:351-356"],
    ["continuous dwell", "0.004", "param.rs:375-380"],
    ["binary dwell", "0.0", "param.rs:331"],
    ["profile click", "0.0", "param.rs:311-316"],
  ];
  const penalties = [
    ["report", "-234.0", "param.rs:442"],
    ["mute the author", "-58.8", "param.rs:436-441"],
    ["not interested", "-43.2", "param.rs:424-429"],
    ["block the author", "-31.2", "param.rs:430-435"],
    ["not dwelled", "-0.02", "param.rs:443-448"],
  ];

  const actionW = 31;
  const weightW = 7;
  const headerLine = padRow("action", "weight", "cite", actionW, weightW);
  const colChars = Math.max(24, Math.floor((innerW / 2 - 28) / CW));
  const caveatText =
    "the weight on a copy-link share is 40x the weight on a like (20.0 / 0.5). those weights multiply a predicted chance this viewer does the thing, and the file says the sizes reflect how rare the action is, not an exchange rate in real hearts. the magnitude of the report weight is 468x the like weight (|-234.0| / 0.5). a predicted report of 0.01 is not 468 likes. mute is priced worse than block.";
  const caveatCol = wrap(caveatText, colChars);
  const posLines = [
    "weights",
    headerLine,
    ...positives.map((r) => padRow(r[0], r[1], r[2], actionW, weightW)),
  ];
  const penLines = [
    "penalties",
    headerLine,
    ...penalties.map((r) => padRow(r[0], r[1], r[2], actionW, weightW)),
    "",
    ...caveatCol,
  ];
  const colRows = Math.max(posLines.length, penLines.length);
  const caveatCite = wrapAll(
    ["home-mixer/params/param.rs:279-281, 282, 325-330, 442"],
    maxChars
  );

  const parts = [];
  const head = header("WHAT X PAYS FOR", kicker);
  parts.push(head.svg);
  let y = head.y;

  parts.push(sectionRule(PAD, y, innerW, "THE PRICE LIST"));
  y += 20;

  const tableH = measure([], caveatCite, colRows);
  parts.push(
    titledBox(PAD, y, innerW, tableH, "weights and penalties", null, [], caveatCite, {
      leftLines: posLines,
      rightLines: penLines,
    })
  );
  y += tableH + 22;

  parts.push(sectionRule(PAD, y, innerW, "MODIFIERS"));
  y += 20;

  const modLines = [
    ...bullets(
      [
        "author diversity: per request / per refresh multipliers 1.0 / 0.625 / 0.4375 / 0.34375, floor 0.25. never per day",
        "dpp near-duplicate: unselected candidates scored 0.0 at theta 0.65",
        "retweet dedup: keeps first arrival in source order, not best",
        "negative compression: net-negative posts squeezed into [0, 0.001] and sort under everything that isn't hated",
      ],
      maxChars
    ),
  ];
  const modCites = wrapAll(
    [
      "ranking_scorer.rs:614-616 · param.rs:222-239 · dpp_model.rs:147-150",
      "param.rs:608-619 · retweet_deduplication_filter.rs:19-26 · ranking_scorer.rs:525-533 · config.rs:40",
    ],
    maxChars
  );
  const modH = measure(modLines, modCites);
  parts.push(titledBox(PAD, y, innerW, modH, "do not open or close a door", null, modLines, modCites));
  y += modH + 14;

  const boost = wrap(
    "when someone who follows you back sees a post you wrote, the reply term on that view jumps from 5 to 20. that is the biggest boost in the file, and it is the reply term only. it is not the whole post counting more. replies and reposts get none of it.",
    maxChars
  );
  const boostCite = wrapAll(["param.rs:284-289 · ranking_scorer.rs:180-193"], maxChars);
  const boostH = measure(boost, boostCite);
  parts.push(
    titledBox(PAD, y, innerW, boostH, "mutual-follow reply term", null, boost, boostCite)
  );
  y += boostH + 24;

  parts.push(
    footer(
      y,
      "relative pricing, not an exchange rate. the sizes reflect how rare the action is."
    )
  );
  const h = y + 50;
  return { svg: svgDoc(h, parts.join("\n  ")), h };
}

function page3() {
  const innerW = W - PAD * 2;
  const maxChars = Math.floor((innerW - 28) / CW);
  const kicker = wrap(
    "six monday changes. then the parts they kept back, which is why you can trust the rest.",
    Math.floor(innerW / CW)
  );

  const moves = [
    {
      title: "1  write the post someone would copy and send",
      items: [
        "copy-link is weighted 20.0. a follow is weighted 4.0. a like is 0.5. the weight on a copy-link share is 40x the weight on a like. those weights multiply a predicted chance this viewer does the thing, and the file says the sizes reflect how rare the action is, not an exchange rate in real hearts.",
      ],
      cites: ["param.rs:279-281, 282, 325-330, 345-350"],
    },
    {
      title: "2  write originals that a mutual would actually reply to",
      items: [
        "when someone who follows you back sees a post you wrote, the reply term on that view jumps from 5 to 20. that is the biggest boost in the file, and it is the reply term only. it is not the whole post counting more. replies and reposts get none of it.",
      ],
      cites: ["param.rs:284-289 · ranking_scorer.rs:180-193"],
    },
    {
      title: "3  if you want strangers, post an original",
      items: [
        "a reply never enters the stranger index. neither does a repost or a community post. even your own followers see a reply or a repost at 0.75 of the usual weight.",
      ],
      cites: [
        "phoenixRankAllCandidateProcessor.strato:441-446",
        "oon_retweet_reply_filter.rs:13-18 · param.rs:246-265",
      ],
    },
    {
      title: "4  don't drop three posts into one scroll",
      items: [
        "your second post in the same person's refresh starts a third weaker (keeps 62.5%). your third keeps 43.75%. keep stacking and it floors at 0.25. this is per request, per person, inside one refresh. three posts in a day, in different scrolls, do not trigger it.",
      ],
      cites: ["ranking_scorer.rs:614-616 · param.rs:222-239"],
    },
    {
      title: "5  make it video. longer than 10 seconds",
      items: [
        "if it needs to live past tuesday: text drops out of retrieval in 24 to 48 hours. the 48 / 96 / 168 / 336 / 720h video windows require duration strictly > 10,000 ms. evergreen video sits 5 years; those index writers check media type only, not duration. VQV weight credit is a separate >10,000 ms gate.",
      ],
      cites: [
        "eventProcessing.strato:24, 389-405 · phoenix-rankall/src/config/mod.rs:139-156",
        "param.rs:677-682",
      ],
    },
    {
      title: "6  treat one bad label like it can close every stranger door",
      items: [
        "28 rules run on everybody. 26 more run on people who do not follow you. a labeled post can take a top-50 slot and then vanish. an unsafe url writes four drop labels at once, and a verdict change relabels old posts. pin a bad or low-quality url and the account gets SPAM_HIGH_RECALL for 7 days; that check re-runs on every follow you perform. OneWeekInSecs is a botmaker DSL builtin not defined in the repo, so 7 days is implied by the constant name.",
      ],
      cites: [
        "registry.rs:101-170 · PinnedLowQualityOrBadUrl.bot:8-41",
        "FollowFromActorWithPinnedLowQualityOrBadUrl.bot:2,7-45",
        "rtf_tweets_on_unsafe_verdict.bot:17-27",
      ],
    },
  ];

  const parts = [];
  const head = header("SIX MOVES", kicker);
  parts.push(head.svg);
  let y = head.y + 6;

  for (const m of moves) {
    const body = bullets(m.items, maxChars);
    const cites = wrapAll(m.cites, maxChars);
    const h = measure(body, cites);
    parts.push(titledBox(PAD, y, innerW, h, m.title, null, body, cites));
    y += h + 12;
  }

  y += 8;
  parts.push(sectionRule(PAD, y, innerW, "WHAT THEY KEPT BACK"));
  y += 20;

  const held = [
    "they published the map. they kept the parts you'd use to game it.",
    ...bullets(
      [
        "no trained phoenix checkpoints ship. the published weights multiply a probability you cannot compute from the repo",
        "the follower-count skip is 12.34, and the in-file comment says it out loud: production uses a different floor, this is a mock to reduce gaming",
        "every bot-detection operating point is 9.99, a sentinel that can never fire",
        "the grok rubric prompts are withheld on purpose",
        "twenty botmaker rules made the dump. not one uses a rate-limit, captcha, or suspend code. the velocity and anti-automation rules are the ones missing",
      ],
      maxChars
    ),
    ...wrap(
      "some numbers in the dump are fake on purpose. that's why you can trust the rest.",
      maxChars
    ),
  ];
  const heldCite = wrapAll(
    [
      "README.md:32, 297, 403-406 · phoenix/README.md:59-65",
      "enforcement_user.yaml:18-20 · sink_policy.yaml:9-31",
    ],
    maxChars
  );
  const heldH = measure(held, heldCite);
  parts.push(titledBox(PAD, y, innerW, heldH, "held back", null, held, heldCite));
  y += heldH + 24;

  parts.push(
    footer(
      y,
      "this reads the code they published, not the live knobs they can turn on you tomorrow."
    )
  );
  const h = y + 50;
  return { svg: svgDoc(h, parts.join("\n  ")), h };
}

function main() {
  const outDir = path.join(__dirname, "..", "assets", "cheat-sheet");
  fs.mkdirSync(outDir, { recursive: true });
  const pages = [
    ["x-algorithm-cheat-sheet-p1.svg", page1],
    ["x-algorithm-cheat-sheet-p2.svg", page2],
    ["x-algorithm-cheat-sheet-p3.svg", page3],
  ];
  for (const [name, fn] of pages) {
    const { svg, h } = fn();
    const dest = path.join(outDir, name);
    fs.writeFileSync(dest, svg);
    process.stdout.write(`wrote ${dest} (${W}x${h})\n`);
  }
}

main();
