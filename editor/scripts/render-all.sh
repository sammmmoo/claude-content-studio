#!/usr/bin/env bash
# Renders a still and a short clip of every template into out/ (gitignored), to check your setup.
#   bash scripts/render-all.sh                      the built-in demos (drawn stand-in, no footage)
#   bash scripts/render-all.sh '{"footage":"footage/test.mp4","cutout":"footage/test-cutout.webm"}'
#                                                   the same on a clip (run scripts/make-test-clip.sh first)
set -euo pipefail
cd "$(dirname "$0")/.."
PROPS=${1:-"{}"}
FRAMES=${FRAMES:-0-59}
mkdir -p out
npx remotion bundle --out-dir=out/bundle >/dev/null
for C in Wall TopCard HeadBand RedBox WalkShow CleanWide ReelWall FeedScroll ReelOrbit Pyramid; do
  npx remotion still out/bundle "$C" "out/$C.png" --frame=45 --props="$PROPS" >/dev/null
  npx remotion render out/bundle "$C" "out/$C.mp4" --frames="$FRAMES" --props="$PROPS" >/dev/null
  echo "ok  $C  out/$C.png  out/$C.mp4"
done
