---
description: "Reel orbit: reels circle above your head, passing behind it. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /reel-orbit

You're talking about a set of videos (your best ones, a creator's outliers).

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-reel-orbit.json`
3. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage`.
4. **The reels:** cover images in `public/images/` with their real view counts. Only reels you have the right to show, and only real numbers. No covers? Ask the creator for them, and never leave `reels` out: the demo's view counts are made up.
5. **Write the fields** into `props/<clip>-reel-orbit.json`, timing each to its spoken word: `reels` (`[{"src": "images/reel1.jpg", "views": 1240000}]`), `start` (seconds: the stack bursts into the ring), `rx`, `ry` (ring size), `lift` (px above your face centre), `cardW`, `drift` (degrees per second), `dim`. Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
6. **Render:** `npx remotion render ReelOrbit ../output/<clip>-reel-orbit.mp4 --props=props/<clip>-reel-orbit.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
7. **Check it** before you show it: `npx remotion still ReelOrbit out/check.png --frame=<n> --props=props/<clip>-reel-orbit.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the ring circles above your head, the back half passes behind you, and it doesn't cover your face. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the timing you chose, in one line.
