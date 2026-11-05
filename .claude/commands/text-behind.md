---
description: "Text behind you: one big word behind your head, you in front of it. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /text-behind

One word should land big on screen (a name, a tool, the topic).

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-text-behind.json`
3. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage`.
4. **Pick the word and the moment:** one short word in capitals (six letters fills the width), and the second you say it.
5. **Write the fields** into `props/<clip>-text-behind.json`, timing each to its spoken word: `text` (the word), `enter` (seconds), `top` (px from the top to the top of the word; put it where your head covers its lower half, 820 by default), `color` (`#E2552B` by default; white and pale colours vanish on a bright wall), `size` (318 by default). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
6. **Render:** `npx remotion render TextBehind ../output/<clip>-text-behind.mp4 --props=props/<clip>-text-behind.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
7. **Check it** before you show it: `npx remotion still TextBehind out/check.png --frame=<n> --props=props/<clip>-text-behind.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the word rises in at `enter`, sits behind your head (your head covers part of it) and reads clearly against the background. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the timing you chose, in one line.
