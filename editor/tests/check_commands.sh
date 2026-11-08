#!/usr/bin/env bash
# The slash commands in .claude/commands/: each exists, says what it does, renders a composition that exists, and is in
# the README. Run from anywhere: bash editor/tests/check_commands.sh
set -uo pipefail
cd "$(dirname "$0")/../.."
bad=0
for pair in teleport:Teleport text-behind:TextBehind reel-wall:ReelWall reel-orbit:ReelOrbit logo-rain:LogoRain film-grade:FilmGrade clone-me:CloneMe supercut:Supercut thanos:Thanos vanish:Thanos drop-in:DropIn tier-list:TierList time-stop:TimeStop portal:Portal shrink:Shrink break-out:BreakOut; do
  cmd=${pair%%:*} comp=${pair##*:} f=".claude/commands/$cmd.md"
  if [ ! -f "$f" ]; then echo "FAIL /$cmd: no $f"; bad=1; continue; fi
  grep -q '^description:' "$f" || { echo "FAIL /$cmd: no description"; bad=1; }
  grep -q "npx remotion render $comp " "$f" || { echo "FAIL /$cmd: doesn't render $comp"; bad=1; }
  grep -q "comp(\"$comp\"" editor/src/Root.tsx || { echo "FAIL /$cmd: no $comp composition in editor/src/Root.tsx"; bad=1; }
  grep -q "\`/$cmd\`" README.md || { echo "FAIL /$cmd: not in README.md"; bad=1; }
  grep -q '^description: ".*"$' "$f" && grep -q '^argument-hint: ".*"$' "$f" || { echo "FAIL /$cmd: frontmatter values not quoted (YAML breaks on the colon)"; bad=1; }
  grep -qi 'anything left out falls back' "$f" && { echo "FAIL /$cmd: lets a field fall back to the made-up demo values"; bad=1; }
done
# reels carry view counts: the demo's are made up, so the command must never let them through
for cmd in reel-wall reel-orbit; do
  grep -q 'never leave `reels` out' ".claude/commands/$cmd.md" || { echo "FAIL /$cmd: doesn't forbid leaving reels to the demo"; bad=1; }
done
# /teleport: the cut-out needs each jump's frame, so the jumps are found first
t=.claude/commands/teleport.md
[ "$(grep -n 'Find the jumps' $t | cut -d: -f1)" -lt "$(grep -n 'Cut yourself out' $t | cut -d: -f1)" ] 2>/dev/null || { echo "FAIL /teleport: cuts out before it finds the jumps"; bad=1; }
# /supercut: the rows are numbered for you, and no example text of ours belongs on someone else's video
s=.claude/commands/supercut.md
grep -q '"One:"' $s && { echo "FAIL /supercut: example rows number themselves (the card already does)"; bad=1; }
grep -q '"word": "EDIT"' $s && { echo "FAIL /supercut: our CTA keyword as the example"; bad=1; }
grep -q "own words" $s || { echo "FAIL /supercut: doesn't ask for the creator's own words"; bad=1; }
[ $bad = 0 ] && echo "PASS commands (16)"
exit $bad
