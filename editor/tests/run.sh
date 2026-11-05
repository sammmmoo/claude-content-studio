#!/usr/bin/env bash
# One still for tests/check.py: bash tests/run.sh <name> <Composition> <frame> '<props json>' -> tests/out/<name>.png
# Bundles into tests/out/bundle the first time (check.py deletes it at the start of a run, so each run sees your changes).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p tests/out
[ -d tests/out/bundle ] || npx remotion bundle --out-dir=tests/out/bundle >/dev/null
npx remotion still tests/out/bundle "$2" "tests/out/$1.png" --frame="$3" --props="$4" --timeout=120000 --log=error >/dev/null
