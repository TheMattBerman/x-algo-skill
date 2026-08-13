#!/usr/bin/env bash
# Idempotent: symlink this checkout as x-reach for Claude Code (and Codex when present).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="x-reach"
STALE_NAME="x-algo-audit"
CLAUDE_SKILLS="${HOME}/.claude/skills"
CODEX_SKILLS="${HOME}/.codex/skills"

resolve_path() {
  local path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path"
  else
    python3 -c 'import os, sys; print(os.path.realpath(sys.argv[1]))' "$path"
  fi
}

points_into_repo() {
  local path="$1"
  local resolved
  resolved="$(resolve_path "$path")"
  [[ "$resolved" == "$REPO_DIR" || "$resolved" == "$REPO_DIR"/* ]]
}

remove_stale_v2() {
  local skills_dir="$1"
  local stale="${skills_dir}/${STALE_NAME}"
  if [[ -L "$stale" ]] && points_into_repo "$stale"; then
    rm "$stale"
    echo "Removed stale v2 symlink ${stale} (it pointed into this repo)."
  fi
}

install_symlink() {
  local dest="$1"
  mkdir -p "$(dirname "$dest")"
  if [[ -L "$dest" ]]; then
    rm "$dest"
  elif [[ -e "$dest" ]]; then
    rm -rf "$dest"
  fi
  ln -s "$REPO_DIR" "$dest"
  echo "Linked ${dest} -> ${REPO_DIR}"
}

if [[ ! -f "${REPO_DIR}/SKILL.md" ]]; then
  echo "Error: SKILL.md not found next to install.sh. Run this from a full checkout." >&2
  exit 1
fi

echo "Installing ${SKILL_NAME} from ${REPO_DIR}"
echo

mkdir -p "$CLAUDE_SKILLS"
remove_stale_v2 "$CLAUDE_SKILLS"
install_symlink "${CLAUDE_SKILLS}/${SKILL_NAME}"

if [[ -d "${HOME}/.codex" ]]; then
  mkdir -p "$CODEX_SKILLS"
  remove_stale_v2 "$CODEX_SKILLS"
  install_symlink "${CODEX_SKILLS}/${SKILL_NAME}"
else
  echo "Codex skipped: ${HOME}/.codex is not present. Re-run after Codex is installed to add ~/.codex/skills/${SKILL_NAME}."
fi

cat <<EOF

Done.

Verify:
  ls -l ${CLAUDE_SKILLS}/${SKILL_NAME}
  bash "${REPO_DIR}/doctor.sh"

Restart the agent, then invoke /${SKILL_NAME} and paste a draft.
EOF
