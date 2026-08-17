#!/usr/bin/env node
/**
 * Language and claim gates (spec 12.6).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if ([".git", "node_modules", "cmux-assets", "tests"].includes(name.name)) continue;
      walk(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

function fencedBlocks(text) {
  const blocks = [];
  const re = /```([\s\S]*?)```/g;
  let match;
  while ((match = re.exec(text))) blocks.push(match[1]);
  return blocks;
}

function main() {
  const files = walk(ROOT).filter((p) => {
    const rel = relative(ROOT, p);
    if (rel.startsWith("assets/") && !/\.(svg|md|tape)$/.test(rel)) return false;
    return (
      /^(SKILL|README|AGENTS)\.md$/.test(rel) ||
      rel.startsWith("references/") && rel.endsWith(".md") ||
      /door/i.test(rel)
    );
  });

  const assetNames = walk(join(ROOT, "assets")).map((p) => relative(ROOT, p));
  let fail = 0;
  const bad = (msg) => {
    console.error(`FAIL  ${msg}`);
    fail += 1;
  };

  const strippedDoors = (text) => text.replace(/front doors?/gi, "");

  for (const name of assetNames) {
    if (/\bdoors?\b/i.test(strippedDoors(name))) bad(`asset filename contains banned noun: ${name}`);
  }

  const targets = files.filter((p) => p.endsWith(".md"));
  for (const file of targets) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    const lines = text.split(/\n/);

    if (/\bdoors?\b/i.test(strippedDoors(text))) {
      lines.forEach((line, i) => {
        if (/\bdoors?\b/i.test(strippedDoors(line))) bad(`${rel}:${i + 1} banned noun`);
      });
    }

    if (text.includes("\u2014")) {
      lines.forEach((line, i) => {
        if (line.includes("\u2014")) bad(`${rel}:${i + 1} em dash`);
      });
    }

    if (/the only real engagement half-life/i.test(text)) {
      bad(`${rel} contains "the only real engagement half-life"`);
    }

    const unsafeRe = /rtf_tweets_on_unsafe_verdict/g;
    let unsafeMatch;
    while ((unsafeMatch = unsafeRe.exec(text))) {
      const window = text.slice(Math.max(0, unsafeMatch.index - 200), unsafeMatch.index + 200);
      if (/5,000|5000/.test(window)) {
        bad(`${rel} attaches 5,000/5000 to rtf_tweets_on_unsafe_verdict`);
        break;
      }
    }

    for (const block of fencedBlocks(text)) {
      const isOutput =
        /^(WHERE IT CAN SHOW UP|OPEN|CLOSED|PENDING|UNPROVEN|UNKNOWN|TRIPPED|WRITTEN|ON 1 LIKE|BLOCKED|LIVE|SAME POND|UNUSED DEMAND|WHAT TRAVELED|NEXT|TAPE|FILED|STILL OPEN|NOT THIS WEEK|DO BETTER|HOW THIS WORKS|PICTURE|TICKET|0 LIKES|REPLY|REWRITE|SEND|FOLLOW|THE ONE CHANGE|NO CHANGE|UNDER THE HOOD|MATCHED|UNMATCHED|WHY|NO FILE)\b/m.test(
          block.trimStart(),
        );
      if (!isOutput) continue;
      if (block.includes("**") || block.includes("~~")) {
        bad(`${rel} fenced output has ** or ~~`);
      }
      if (/^(LIVE|TAPE|DO BETTER)\b/m.test(block) && /^Rewrite:/m.test(block)) {
        bad(`${rel} Job 4 output template writes a new post`);
      }
      const hasDump = /\b(720|336|168|43800)\b/.test(block);
      const hasReach = /\b(stranger|strangers|For You|searchable)\b/i.test(block);
      if (hasDump && hasReach) {
        bad(`${rel} dump-window number next to stranger/For You/searchable in a fenced block`);
      }
      if (/^(PENDING|UNPROVEN)\b/m.test(block) && /\b(likely|probably|odds|chance|%)\b/.test(block)) {
        bad(`${rel} probability word in an output template`);
      }
      const pendingBlocks = block.split(/\n(?=PENDING\b)/).filter((s) => s.startsWith("PENDING"));
      for (const p of pendingBlocks) {
        const firstReason = p.split("\n").find((l) => /^\s{10}\S/.test(l) && !/^\s{10}\(/.test(l));
        if (firstReason) {
          const ok =
            /\b(\d+|one|eight|first) /i.test(firstReason) ||
            /nobody can see/i.test(firstReason) ||
            /unanswered/i.test(firstReason);
          if (!ok) bad(`${rel} PENDING line does not name a signal or say nobody can see it: ${firstReason.trim()}`);
        }
      }
      const unprovenBlocks = block.split(/\n(?=UNPROVEN\b)/).filter((s) => s.startsWith("UNPROVEN"));
      for (const u of unprovenBlocks) {
        if (!/did not publish|not published|setting they did not publish|switched on/i.test(u)) {
          bad(`${rel} UNPROVEN line does not name the missing config`);
        }
      }
    }
  }

  const skill = readFileSync(join(ROOT, "SKILL.md"), "utf8");
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const skillLead = skill.split("\n").slice(0, 40).join("\n");
  const readmeLead = readme.split("\n").slice(0, 25).join("\n");
  if (!/get seen/i.test(skillLead) || !/get seen/i.test(readmeLead)) {
    bad("SKILL.md / README.md lead must sell the reach promise");
  }
  if (/Find out if people who do not already follow you/i.test(skillLead)) {
    bad("SKILL.md lead still sells non-follower eligibility as the product");
  }
  if (/Find out if people who do not already follow you/i.test(readmeLead)) {
    bad("README.md lead still sells non-follower eligibility as the product");
  }
  if (/One like is the first point we can prove people who do not follow you/i.test(skill)) {
    bad("SKILL.md still uses the v4.1 Phoenix headline as the Job 1 first line");
  }

  if (fail) {
    console.error(`check-language: FAIL (${fail})`);
    process.exit(1);
  }
  console.log("check-language: PASS");
}

main();
