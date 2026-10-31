#!/usr/bin/env bash
set -eu

mkdir -p "$HOME/.local/share/vinfonette"

if curl --silent --fail http://127.0.0.1:3000/api/auth/setup-status >/dev/null; then
  exit 0
fi

nohup npm run dev > "$HOME/.local/share/vinfonette/codespaces.log" 2>&1 </dev/null &
