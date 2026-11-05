---
description: "Clone me: two more of you step in beside you, each a beat behind. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /clone-me

You're talking about doing more, a team of you, or copying yourself.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-clone-me.json`
3. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage`.
4. **Make room:** the copies sit to one side of you, so the clip works best with you to one side of the frame. Pick the second they appear.
5. **Write the fields** into `props/<clip>-clone-me.json`, timing each to its spoken word: `enter` (seconds), `copies` (`[{"dx": 560, "delay": 0.43}, {"dx": 280, "delay": 0.23}]` by default: px to the right, negative for the left, and seconds behind you). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
6. **Render:** `npx remotion render CloneMe ../output/<clip>-clone-me.mp4 --props=props/<clip>-clone-me.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
7. **Check it** before you show it: `npx remotion still CloneMe out/check.png --frame=<n> --props=props/<clip>-clone-me.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that each copy steps in a beat behind you and moves the way you did, nobody is cut off at the frame edge, and you stay in front. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the timing you chose, in one line.
