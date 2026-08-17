#!/usr/bin/env node
/**
 * Reader-enumeration test (spec 12.1).
 *
 * Parses the For You sources vec, the RetrievalDataset enum, and this
 * kit's index map. Fails if the kit asserts a positive searchable value
 * for an index whose artifact is not in the launched default.
 *
 * This test proves which corpora are searched. The arm-boundary check
 * below proves only which windows exist. Do not conflate the two.
 *
 * Usage:
 *   X_ALGORITHM_CLONE=/tmp/x-algorithm node scripts/enumerate-stranger-sources.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CLONE = resolve(process.env.X_ALGORITHM_CLONE || "/tmp/x-algorithm");

function mustRead(rel) {
  const abs = join(CLONE, rel);
  if (!existsSync(abs)) throw new Error(`missing ${rel} in ${CLONE}`);
  return readFileSync(abs, "utf8");
}

function parseSources(text) {
  const start = text.indexOf("let sources:");
  if (start === -1) throw new Error("sources vec not found");
  const block = text.slice(start, text.indexOf("];", start) + 2);
  const names = [...block.matchAll(/([a-z_]+_source),/g)].map((m) => m[1]);
  return names;
}

function parseDataset(text) {
  const members = [];
  const re = /(\w+)\s*=\s*\(\s*(\d+)\s*,\s*([^,\n]+)/g;
  let match;
  while ((match = re.exec(text))) {
    members.push({
      name: match[1],
      value: Number(match[2]),
      raw: match[3].trim(),
    });
  }
  return members;
}

function parseDefault(text) {
  const match = text.match(
    /retrieval_dataset_types:\s*tuple\[RetrievalDataset,\s*\.\.\.\]\s*=\s*\(([^)]+)\)/,
  );
  if (!match) throw new Error("model_runner default not found");
  return [...match[1].matchAll(/RetrievalDataset\.(\w+)/g)].map((m) => m[1]);
}

function parseArmBoundaries(text) {
  const fn = text.indexOf("pub fn window_configs");
  if (fn === -1) throw new Error("window_configs not found");
  const body = text.slice(fn);
  const lines = body.split("\n");
  const hits = {};
  lines.forEach((line, i) => {
    const abs = text.slice(0, fn).split("\n").length + i;
    if (line.includes('Self::Main')) hits.Main = hits.Main || abs;
    if (line.includes('Self::Topic')) hits.Topic = hits.Topic || abs;
    if (line.includes('Self::Metadata')) hits.Metadata = hits.Metadata || abs;
    if (line.includes('Self::MmMetadata')) hits.MmMetadata = hits.MmMetadata || abs;
    if (line.includes('Self::SidTail')) hits.SidTail = hits.SidTail || abs;
    if (line.includes('Self::Sid =>')) hits.Sid = hits.Sid || abs;
    if (line.includes('"tail"')) hits.tailWindow = abs;
    if (line.includes('"post_creation"')) hits.postCreation = abs;
  });
  return hits;
}

function main() {
  if (!existsSync(join(CLONE, "home-mixer"))) {
    console.error(`clone missing at ${CLONE}. Set X_ALGORITHM_CLONE.`);
    process.exit(2);
  }

  let fail = 0;
  const note = (ok, msg) => {
    console.log(`${ok ? "ok   " : "FAIL "} ${msg}`);
    if (!ok) fail += 1;
  };

  const pipeline = mustRead("home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs");
  const sources = parseSources(pipeline);
  note(sources.includes("thunder_source"), `ThunderSource in sources vec (${sources.join(", ")})`);
  note(sources.includes("simclusters_source"), "SimclustersSource in sources vec");
  note(sources.includes("phoenix_source"), "PhoenixSource in sources vec");
  note(sources.includes("phoenix_topics_source"), "PhoenixTopicsSource in sources vec");
  note(sources.includes("tweet_mixer_source"), "TweetMixerSource in sources vec");
  note(sources.includes("phoenix_moe_source"), "PhoenixMOESource in sources vec");
  note(sources.includes("cached_posts_source"), "CachedPostsSource in sources vec");
  note(sources.length === 7, `seven sources (got ${sources.length})`);

  const datasetText = mustRead("phoenix/xrex/data/retrieval_dataset.py");
  const enumStart = datasetText.indexOf("class RetrievalDataset");
  const enumBlock = datasetText.slice(enumStart, enumStart + 2500);
  const members = parseDataset(enumBlock);
  const names = new Set(members.map((m) => m.name));
  note(names.has("HOME"), "HOME member exists");
  note(names.has("TAIL"), "TAIL member exists");
  note(!names.has("post_creation") && !names.has("POST_CREATION"), "no post_creation member");
  note(enumBlock.includes("1fav_1day.parquet"), "HOME artifact is 1fav_1day");
  note(enumBlock.includes("tail_1day.parquet"), "TAIL artifact is tail_1day");

  const runner = mustRead("phoenix/xrex/inference/model_runner.py");
  const defaults = parseDefault(runner);
  note(defaults.length === 1 && defaults[0] === "HOME", `default is HOME alone (${defaults.join(",")})`);

  const map = JSON.parse(readFileSync(join(ROOT, "references/index-map.json"), "utf8"));
  note(JSON.stringify(map.published_default_datasets) === '["HOME"]', "kit default list is HOME alone");

  const artifactByIndex = new Map();
  for (const ds of map.retrieval_dataset) {
    for (const index of ds.index_names || []) {
      artifactByIndex.set(index, { member: ds.member, artifact: ds.artifact, def: ds.default });
    }
  }

  for (const index of map.indexes) {
    const searchable = index.searchable_on_for_you;
    if (!searchable || searchable === "not published") continue;
    const hit = artifactByIndex.get(index.name);
    if (!hit) {
      note(false, `${index.name} claims "${searchable}" but has no RetrievalDataset artifact`);
      continue;
    }
    if (!hit.def) {
      note(false, `${index.name} claims "${searchable}" but ${hit.member} is not in the launched default`);
      continue;
    }
    note(searchable === "up to 48 h", `${index.name} searchable value is "up to 48 h" via ${hit.member}`);
  }

  const postCreation = map.indexes.find((i) => i.name === "post_creation");
  note(postCreation.searchable_on_for_you === "not published", "post_creation is not published as searchable");

  const tail = map.indexes.find((i) => i.name === "tail");
  note(tail.searchable_on_for_you === "not published", "tail is not published as searchable");

  const cfg = mustRead("phoenix-rankall/src/config/mod.rs");
  const arms = parseArmBoundaries(cfg);
  // Arm-boundary regression. Proves which windows exist. Proves nothing
  // about which corpora are searched. That is the enum + default check above.
  note(arms.Main && arms.Main < arms.Topic, `Main arm starts before Topic (${arms.Main} < ${arms.Topic})`);
  note(arms.Metadata && arms.Metadata > (arms.Topic || 0), "Metadata is not inside the Main/Topic range cited as 139-156");
  note(arms.SidTail && arms.tailWindow, `SidTail window "tail" exists at ${arms.tailWindow}`);
  note(arms.postCreation && arms.postCreation < arms.Topic, "post_creation sits inside Main");

  if (fail) {
    console.error(`enumerate-stranger-sources: FAIL (${fail})`);
    process.exit(1);
  }
  console.log("enumerate-stranger-sources: PASS");
}

main();
