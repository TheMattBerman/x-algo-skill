#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export X_ALGORITHM_CLONE="${X_ALGORITHM_CLONE:-/tmp/x-algorithm}"
cd "$ROOT"
node scripts/check-language.mjs
node scripts/check-metadata.mjs --self-test
node scripts/snapshot-fixtures.mjs
node scripts/enumerate-stranger-sources.mjs
node scripts/verify-citations.mjs
echo "all gates green"
