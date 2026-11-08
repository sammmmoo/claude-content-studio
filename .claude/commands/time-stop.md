---
description: "Time stop: the world freezes and turns grey, and you step out of it in colour, still talking. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /time-stop

You stop time and step out of the frozen moment. Stand a little to one side so you have room to step.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-time-stop.json`
3. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage` from here on.
4. **Your chest** (optional, where the grey spreads from): `python scripts/body_prep.py public/footage/<clip>.mp4 --cutout public/footage/<clip>-cutout.webm --at <stop>` and take `chest` from the point it prints.
5. **Write the fields** into the props, timing each to its spoken word: `stop` (seconds the world freezes), `centre` (your chest), `dx` (px you step sideways: 420 by default, negative for the left; step towards the side with more room). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
6. **Render:** `npx remotion render TimeStop ../output/<clip>-time-stop.mp4 --props=props/<clip>-time-stop.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
7. **Check it** before you show it: `npx remotion still TimeStop out/check.png --frame=<n> --props=props/<clip>-time-stop.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the picture freezes on `stop`, the grey spreads out from your chest, and the coloured you steps clear of your frozen self without leaving the frame. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the timing you chose, in one line.
