#!/usr/bin/env bash
# Health check for this checkout and the x-reach skill symlink.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="x-reach"
CLAUDE_LINK="${HOME}/.claude/skills/${SKILL_NAME}"
CODEX_LINK="${HOME}/.codex/skills/${SKILL_NAME}"
fail=0
warn=0

ok()   { printf "ok    %s\n" "$1"; }
bad()  { printf "FAIL  %s\n" "$1"; fail=$((fail + 1)); }
note() { printf "warn  %s\n" "$1"; warn=$((warn + 1)); }

resolve_path() {
  local path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path"
  else
    python3 -c 'import os, sys; print(os.path.realpath(sys.argv[1]))' "$path"
  fi
}

echo "x-reach doctor"
echo

if command -v node >/dev/null 2>&1; then
  ok "node $(node --version) (needed for scripts/check-metadata.mjs)"
else
  bad "node is missing. Install Node.js, then re-run: node scripts/check-metadata.mjs --self-test"
fi

echo
echo "kit files:"
for f in \
  SKILL.md \
  AGENTS.md \
  VERSION \
  LICENSE \
  CHANGELOG.md \
  install.sh \
  doctor.sh \
  references/doors.md \
  references/rules.md \
  references/verified-findings.md \
  references/creator-cheat-sheet.md \
  scripts/check-metadata.mjs
do
  if [[ -f "${ROOT}/${f}" ]]; then
    ok "$f"
  else
    bad "missing ${f} — restore it from the kit repo"
  fi
done

echo
echo "skill symlink:"
if [[ -L "$CLAUDE_LINK" ]]; then
  resolved="$(resolve_path "$CLAUDE_LINK")"
  if [[ "$resolved" == "$ROOT" ]]; then
    ok "${CLAUDE_LINK} -> this checkout"
  else
    bad "${CLAUDE_LINK} points at ${resolved}, not this checkout. Fix: bash install.sh"
  fi
elif [[ -e "$CLAUDE_LINK" ]]; then
  bad "${CLAUDE_LINK} exists but is not a symlink. Move it aside, then: bash install.sh"
else
  bad "${CLAUDE_LINK} is missing. Fix: bash install.sh"
fi

if [[ -d "${HOME}/.codex" ]]; then
  if [[ -L "$CODEX_LINK" ]]; then
    resolved="$(resolve_path "$CODEX_LINK")"
    if [[ "$resolved" == "$ROOT" ]]; then
      ok "${CODEX_LINK} -> this checkout"
    else
      bad "${CODEX_LINK} points at ${resolved}, not this checkout. Fix: bash install.sh"
    fi
  elif [[ -e "$CODEX_LINK" ]]; then
    bad "${CODEX_LINK} exists but is not a symlink. Move it aside, then: bash install.sh"
  else
    note "${CODEX_LINK} is missing. Codex is present; re-run bash install.sh to link it."
  fi
else
  note "Codex not installed (~/.codex absent). Claude-only is fine."
fi

if [[ -L "${HOME}/.claude/skills/x-algo-audit" ]]; then
  note "stale v2 name ~/.claude/skills/x-algo-audit still exists. Re-run bash install.sh to remove it if it points here."
fi

echo
if [[ "$fail" -gt 0 ]]; then
  echo "doctor: FAIL (${fail} problem(s), ${warn} warning(s))"
  exit 1
fi
echo "doctor: PASS (${warn} warning(s))"
exit 0
