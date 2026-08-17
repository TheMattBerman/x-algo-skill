#!/usr/bin/env node
/**
 * Opens every path:line citation in SKILL.md, README.md, AGENTS.md, and
 * references/*.md against a pinned x-algorithm clone.
 *
 * Usage:
 *   X_ALGORITHM_CLONE=/tmp/x-algorithm node scripts/verify-citations.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CLONE = resolve(process.env.X_ALGORITHM_CLONE || "/tmp/x-algorithm");

const ALIASES = {
  "retrieval_dataset.py": "phoenix/xrex/data/retrieval_dataset.py",
  "model_runner.py": "phoenix/xrex/inference/model_runner.py",
  "launch_inference.py": "phoenix/xrex/inference/launch_inference.py",
  "age_filter.rs": "home-mixer/filters/age_filter.rs",
  "config.rs": "home-mixer/params/config.rs",
  "param.rs": "home-mixer/params/param.rs",
  "thunder_source.rs": "home-mixer/sources/thunder_source.rs",
  "simclusters_source.rs": "home-mixer/sources/simclusters_source.rs",
  "phoenix_source.rs": "home-mixer/sources/phoenix_source.rs",
  "phoenix_topics_source.rs": "home-mixer/sources/phoenix_topics_source.rs",
  "phoenix_candidate_pipeline.rs": "home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs",
  "scored_posts_server.rs": "home-mixer/scored_posts_server.rs",
  "oon_retweet_reply_filter.rs": "home-mixer/filters/oon_retweet_reply_filter.rs",
  "oon_nsfw_simclusters_filter.rs": "home-mixer/filters/oon_nsfw_simclusters_filter.rs",
  "video_filter.rs": "home-mixer/filters/video_filter.rs",
  "ranking_scorer.rs": "home-mixer/scorers/ranking_scorer.rs",
  "author_cold_start.rs": "home-mixer/scorers/author_cold_start.rs",
  "core_data_candidate_hydrator.rs": "home-mixer/candidate_hydrators/core_data_candidate_hydrator.rs",
  "retweet_deduplication_filter.rs": "home-mixer/filters/retweet_deduplication_filter.rs",
  "ineligible_subscription_filter.rs": "home-mixer/filters/ineligible_subscription_filter.rs",
  "sid_tail_processor.rs": "phoenix-rankall/src/processor/sid_tail_processor.rs",
  "mod.rs": "phoenix-rankall/src/config/mod.rs",
  "config/mod.rs": "phoenix-rankall/src/config/mod.rs",
  "phoenix-rankall/src/config/mod.rs": "phoenix-rankall/src/config/mod.rs",
  "strato": "phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato",
  "phoenixRankAllCandidateProcessor.strato":
    "phoenix-rankall-strato/columns/phoenix_rank_all/phoenixRankAllCandidateProcessor.strato",
  "eventProcessing.strato": "phoenix-rankall-strato/lib/eventProcessing.strato",
  "Configs.scala": "simclusters/simclusters_v2/summingbird/common/Configs.scala",
  "recsys.proto": "phoenix/python/common/xai-proto/proto/recsys.proto",
  "recsys_batch.py": "phoenix/xrex/data/recsys/recsys_batch.py",
  "recsys_model.py": "phoenix/xrex/models/recsys_model.py",
  "feature_config.py": "phoenix/xrex/data/recsys/feature_config.py",
  "registry.rs": "visibility-filtering/rules/registry.rs",
  "safety_labels.rs": "visibility-filtering/models/safety_labels.rs",
  "user_label_drops.rs": "visibility-filtering/rules/user_label_drops.rs",
  "tweet_label_drops.rs": "visibility-filtering/rules/tweet_label_drops.rs",
  "dpp_model.rs": "vm-ranker/scoring/dpp_model.rs",
  "candidates_util.rs": "home-mixer/util/candidates_util.rs",
  "author_rules.rs": "home-mixer/util/author_rules.rs",
  "candidate_features.rs": "home-mixer/models/candidate_features.rs",
};

const SKIP_BASENAMES = new Set([
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "index-map.json",
]);

function listMarkdown() {
  const files = ["SKILL.md", "README.md", "AGENTS.md"].map((f) => join(ROOT, f));
  const refDir = join(ROOT, "references");
  for (const name of readdirSync(refDir)) {
    if (name.endsWith(".md")) files.push(join(refDir, name));
  }
  return files.filter((f) => existsSync(f));
}

function extractCites(text) {
  const cites = [];
  const re =
    /(?<![A-Za-z0-9_/.-])((?:[A-Za-z0-9_./-]+?\.(?:rs|py|strato|scala|bot|df|yaml|proto|thrift)|strato|mod\.rs|config\/mod\.rs|config\.rs|param\.rs))(?::(\d+)(?:-(\d+))?)?/g;
  let match;
  while ((match = re.exec(text))) {
    cites.push({
      raw: match[0],
      path: match[1],
      start: Number(match[2] || 0),
      end: Number(match[3] || match[2] || 0),
    });
  }
  return cites;
}

function resolvePath(cited) {
  if (ALIASES[cited]) return ALIASES[cited];
  if (cited.startsWith("home-mixer/") || cited.startsWith("phoenix/") || cited.startsWith("phoenix-rankall") || cited.startsWith("simclusters/") || cited.startsWith("visibility-") || cited.startsWith("grox/") || cited.startsWith("botmaker-") || cited.startsWith("thunder/") || cited.startsWith("vm-ranker/") || cited.startsWith("user-cred") || cited.startsWith("safety-label") || cited.startsWith("agatha/") || cited.startsWith("bdsm/") || cited.startsWith("abuse-")) {
    return cited;
  }
  if (cited.endsWith(".bot")) {
    return `botmaker-rules/scarecrow/bot/${cited}`;
  }
  if (cited.endsWith(".df")) {
    return `botmaker-rules/scarecrow/derived-feature/${cited}`;
  }
  if (cited.includes("...")) return null;
  return null;
}

function lineCount(abs) {
  return readFileSync(abs, "utf8").split(/\r?\n/).length;
}

function main() {
  if (!existsSync(join(CLONE, "home-mixer"))) {
    console.error(`clone missing at ${CLONE}. Set X_ALGORITHM_CLONE.`);
    process.exit(2);
  }

  let fail = 0;
  let checked = 0;
  const seen = new Set();

  for (const file of listMarkdown()) {
    const text = readFileSync(file, "utf8");
    for (const cite of extractCites(text)) {
      if (SKIP_BASENAMES.has(cite.path)) continue;
      if (cite.path === "README.md" || cite.path === "index-map.md" || cite.path === "how-reach-works.md") continue;
      const resolved = resolvePath(cite.path);
      if (!resolved) continue;
      const key = `${resolved}:${cite.start}-${cite.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      checked += 1;
      const abs = join(CLONE, resolved);
      if (!existsSync(abs) || !statSync(abs).isFile()) {
        console.error(`MISSING  ${cite.raw} -> ${resolved}`);
        fail += 1;
        continue;
      }
      if (!cite.start) continue;
      const lines = lineCount(abs);
      if (cite.start > lines || cite.end > lines || cite.start < 1) {
        console.error(`RANGE    ${cite.raw} -> ${resolved} has ${lines} lines`);
        fail += 1;
      }
    }
  }

  if (fail) {
    console.error(`verify-citations: FAIL (${fail} of ${checked})`);
    process.exit(1);
  }
  console.log(`verify-citations: PASS (${checked} distinct cites)`);
}

main();
