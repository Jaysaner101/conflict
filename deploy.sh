#!/usr/bin/env bash
# Build a versioned theme zip and push it. Shopify caches themeCreate sources by
# URL, so every upload needs a fresh filename.
set -euo pipefail
cd "$(dirname "$0")"
N=$(( $(ls dist/theme-*.zip 2>/dev/null | sed 's/.*theme-\([0-9]*\)\.zip/\1/' | sort -n | tail -1 || echo 0) + 1 ))
mkdir -p dist && rm -f dist/*.zip
zip -qr "dist/theme-$N.zip" assets config layout locales sections snippets templates -x '*.DS_Store'
git add -A
git commit -q -m "${1:-Theme build $N}

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01VC3JmHcmi5iLeSayeHxMcY" || true
git push -q origin main
echo "https://raw.githubusercontent.com/Jaysaner101/conflict/main/dist/theme-$N.zip"
