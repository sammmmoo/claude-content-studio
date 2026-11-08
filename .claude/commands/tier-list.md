---
description: "Tier list: a tier board appears above your head and each thing you rank drops into its row as you say it. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /tier-list

You're ranking things: tools, ideas, options. Each one drops into its tier as you say it.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-tier-list.json`
3. **Cut yourself out** (optional, so the board sits behind you): `python scripts/cutout.py public/footage/<clip>.mp4`, then add `"cutout": "footage/<clip>-cutout.webm"` to the props. Without one the board sits in front.
4. **Write the fields** into the props, timing each to its spoken word: `title` (above the board, e.g. `"MY TOOLS, RANKED"`, or `""`), `enter` (seconds the board appears), `items` (`[{"text": "Claude", "tier": 0, "at": 2.4}]`: the creator's own words, tier 0 is the top row, `at` is when they say it; add `"image": "images/logo.png"` for a logo of theirs instead of text), `rows` (`[{"label": "S", "color": "#E8604F"}, ...]`, S A B C by default) and `top` (px from the top to the board, 330 by default; lower it if your head is high in the frame). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
5. **Render:** `npx remotion render TierList ../output/<clip>-tier-list.mp4 --props=props/<clip>-tier-list.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
6. **Check it** before you show it: `npx remotion still TierList out/check.png --frame=<n> --props=props/<clip>-tier-list.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the board clears your face, each item lands in the right row as it's said, and nothing runs off the board's right edge (shorten the text if it does). Fix the props and render again if not.
7. **Show the creator** the file in `output/` and the timing you chose, in one line.
