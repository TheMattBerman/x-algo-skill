#!/usr/bin/env bash
# Two pulls for Last 20: profile and with_replies. Union by id.
# Then inject the live-original floor and the last-picture floor.
# Shells out to the vault x-scraper. Does not vendor the Apify token.
# A with_replies-only pull that hides a live original is a product bug.
set -euo pipefail

HANDLE=""
MAX=20
OUTPUT=""

# First existing script wins. Agents often look for an MCP tool named
# x-scraper and miss the shell helper. Do not vendor a token here.
CANDIDATES=()
if [[ -n "${X_SCRAPER:-}" ]]; then
  CANDIDATES+=("$X_SCRAPER")
fi
CANDIDATES+=(
  "${HOME}/.claude/skills/x-scraper/scripts/x-scrape.sh"
  "${HOME}/.codex/skills/x-scraper/scripts/x-scrape.sh"
  "${HOME}/.agents/skills/x-scraper/scripts/x-scrape.sh"
  "${HOME}/Library/CloudStorage/SynologyDrive-EmeraldDigital/Vault/.claude/skills/x-scraper/scripts/x-scrape.sh"
  "${HOME}/Library/CloudStorage/SynologyDrive-EmeraldDigital/Vault/MatthewBerman/04-claude-code/skills/x-scraper/scripts/x-scrape.sh"
)

SCRAPER=""
for candidate in "${CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    SCRAPER="$candidate"
    break
  fi
done

usage() {
  cat <<'EOF'
usage: scripts/ingest-recent.sh --handle <name> [--max 20|100] [--output file.json]

Last 20 ingest. Two pulls every time: profile and with_replies.
Then injects live originals still inside 48 hours and the most recent
8-like original, even if they lose a recency slot.
Does not store an Apify token. If the scraper is missing, exit 2 so the
skill can fall back to the in-app browser on both URLs, then paste 10.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --handle)
      HANDLE="${2:-}"
      shift 2
      ;;
    --max)
      MAX="${2:-20}"
      shift 2
      ;;
    --output)
      OUTPUT="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

HANDLE="${HANDLE#@}"
HANDLE="${HANDLE#https://x.com/}"
HANDLE="${HANDLE#https://twitter.com/}"
HANDLE="${HANDLE%%/*}"

if [[ -z "$HANDLE" ]]; then
  echo "provide --handle" >&2
  exit 2
fi

if [[ ! "$MAX" =~ ^[0-9]+$ ]] || [[ "$MAX" -lt 1 ]]; then
  echo "--max must be a positive integer" >&2
  exit 2
fi

PROFILE_URL="https://x.com/${HANDLE}"
REPLIES_URL="https://x.com/${HANDLE}/with_replies"

if [[ -z "$SCRAPER" ]]; then
  echo "FALLBACK=browser" >&2
  echo "Apify helper not found. This is a shell script, not an MCP tool." >&2
  echo "Looked in:" >&2
  for candidate in "${CANDIDATES[@]}"; do
    echo "  $candidate" >&2
  done
  echo "Set X_SCRAPER to the x-scrape.sh path, or open both ${PROFILE_URL} and ${REPLIES_URL} and collect id,url,text,createdAt,isReply,isRetweet,isQuote,likeCount,author.followers,inReplyToUsername" >&2
  exit 2
fi
token_from_helper() {
  awk -F= '/^APIFY_TOKEN=/{gsub(/"/, "", $2); print $2; exit}' "$SCRAPER"
}

run_via_http() {
  local url="$1"
  local dest="$2"
  local token="${APIFY_TOKEN:-}"
  if [[ -z "$token" ]]; then
    token="$(token_from_helper)"
  fi
  if [[ -z "$token" ]]; then
    echo "apify CLI is not on PATH and APIFY_TOKEN is unset." >&2
    echo "Install the Apify CLI, or export APIFY_TOKEN, then rerun." >&2
    echo "FALLBACK=browser" >&2
    exit 2
  fi
  echo "using Apify HTTP API (no apify CLI on PATH) for ${url}" >&2
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(
    curl -sS -o "$tmp" -w '%{http_code}' -X POST \
      "https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${token}" \
      -H 'Content-Type: application/json' \
      -d "{\"startUrls\":[\"${url}\"],\"maxItems\":${MAX},\"sort\":\"Latest\"}"
  )"
  if [[ "$code" != "200" && "$code" != "201" ]]; then
    echo "Apify HTTP ${code}. Body:" >&2
    head -c 400 "$tmp" >&2
    echo >&2
    rm -f "$tmp"
    echo "FALLBACK=browser" >&2
    exit 2
  fi
  if [[ ! -s "$tmp" ]] || ! grep -q '"id"' "$tmp"; then
    echo "Apify returned no posts." >&2
    rm -f "$tmp"
    echo "FALLBACK=browser" >&2
    exit 2
  fi
  if [[ -n "$dest" ]]; then
    mv "$tmp" "$dest"
    echo "Output saved to: $dest" >&2
  else
    cat "$tmp"
    rm -f "$tmp"
  fi
}

echo "using scraper ${SCRAPER}" >&2
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
PROFILE_JSON="$WORKDIR/profile.json"
REPLIES_JSON="$WORKDIR/replies.json"

if command -v apify >/dev/null 2>&1; then
  bash "$SCRAPER" --url "$PROFILE_URL" --max "$MAX" --output "$PROFILE_JSON"
  bash "$SCRAPER" --url "$REPLIES_URL" --max "$MAX" --output "$REPLIES_JSON"
else
  run_via_http "$PROFILE_URL" "$PROFILE_JSON"
  run_via_http "$REPLIES_URL" "$REPLIES_JSON"
fi

MERGED="$(python3 - "$HANDLE" "$PROFILE_JSON" "$REPLIES_JSON" "$MAX" <<'PY'
import json, sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

handle, profile_path, replies_path, max_s = sys.argv[1:5]
max_n = int(max_s)
now = datetime.now(timezone.utc)
max_age_s = 48 * 3600

def load(path):
    try:
        raw = json.load(open(path))
    except Exception:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("posts"), list):
        return raw["posts"]
    return []

def parse_time(value):
    if not value:
        return None
    try:
        dt = parsedate_to_datetime(str(value))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def is_rt(post):
    return bool(post.get("isRetweet") or post.get("repost"))

def is_reply(post):
    return bool(post.get("isReply") or post.get("reply"))

def is_quote(post):
    return bool(post.get("isQuote") or post.get("quote"))

def likes(post):
    try:
        return int(post.get("likeCount") or post.get("likes") or 0)
    except Exception:
        return 0

profile = load(profile_path)
replies = load(replies_path)

seen = {}
for src, posts in (("profile", profile), ("with_replies", replies)):
    for post in posts:
        pid = str(post.get("id") or "")
        if not pid or pid in seen:
            continue
        row = dict(post)
        row["_pull"] = src
        seen[pid] = row

def recency_key(post):
    dt = parse_time(post.get("createdAt"))
    return dt.timestamp() if dt else 0.0

ranked = sorted(seen.values(), key=recency_key, reverse=True)

# Recency window is last N after merge. Floors re-enter even if they lost a slot.
window = {}
for post in ranked[:max_n]:
    window[str(post["id"])] = post

for post in profile:
    pid = str(post.get("id") or "")
    if not pid or is_rt(post) or is_reply(post):
        continue
    dt = parse_time(post.get("createdAt"))
    if dt is None:
        continue
    age = (now - dt).total_seconds()
    if age <= max_age_s:
        row = dict(post)
        row["_pull"] = "profile"
        row["_floor"] = "live-original"
        window[pid] = row

pictured = []
for post in profile:
    if is_rt(post) or is_reply(post) or is_quote(post):
        continue
    if likes(post) < 8:
        continue
    dt = parse_time(post.get("createdAt"))
    pictured.append((dt.timestamp() if dt else 0.0, post))
pictured.sort(key=lambda x: x[0], reverse=True)
if pictured:
    post = pictured[0][1]
    pid = str(post.get("id") or "")
    if pid and pid not in window:
        row = dict(post)
        row["_pull"] = "profile"
        row["_floor"] = "last-picture"
        window[pid] = row

posts = sorted(window.values(), key=recency_key, reverse=True)
out = {
    "handle": handle,
    "ingest": "apify",
    "pulls": ["profile", "with_replies"],
    "now": now.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "posts": posts,
}
json.dump(out, sys.stdout)
PY
)"

if [[ -n "$OUTPUT" ]]; then
  printf '%s\n' "$MERGED" > "$OUTPUT"
  echo "Output saved to: $OUTPUT" >&2
else
  printf '%s\n' "$MERGED"
fi
