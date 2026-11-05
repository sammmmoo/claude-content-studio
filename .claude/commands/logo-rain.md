---
description: "Logo rain: tiles with your logos tumble down behind you. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /logo-rain

You're naming the tools you use, the brands you work with, or your own brand.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-logo-rain.json`
3. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage`.
4. **The logos:** images in `public/images/` (any shape: each is fitted inside its tile). Only logos you have the right to show: your own, the tools you use, clients who've said yes.
5. **Write the fields** into `props/<clip>-logo-rain.json`, timing each to its spoken word: `logos` (`["images/claude.svg", "images/remotion.png"]`; `[]` for plain tiles), `enter` (seconds), `count` (tiles on screen, 30). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
6. **Render:** `npx remotion render LogoRain ../output/<clip>-logo-rain.mp4 --props=props/<clip>-logo-rain.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
7. **Check it** before you show it: `npx remotion still LogoRain out/check.png --frame=<n> --props=props/<clip>-logo-rain.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the tiles fall behind you from `enter`, every logo is readable inside its tile, and none fall across your face. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the timing you chose, in one line.
