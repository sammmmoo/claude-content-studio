---
description: "Break out: your video plays in a card and you step out of it, over its edges. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /break-out

Your video sits in a card like a post on a feed, and you step out of it.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-break-out.json`
3. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage` from here on.
4. **Write the fields** into the props, timing each to its spoken word: `step` (seconds you step out), `card` (`{"x": 108, "y": 360, "w": 864, "h": 1150}` by default, the card on screen in px), `background` (behind the card, `"#111113"` by default) and `grow` (how much bigger you get, 1.22 by default). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
5. **Render:** `npx remotion render BreakOut ../output/<clip>-break-out.mp4 --props=props/<clip>-break-out.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
6. **Check it** before you show it: `npx remotion still BreakOut out/check.png --frame=<n> --props=props/<clip>-break-out.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that before `step` you're inside the card, and after it you spill over the card's edges in front of it with the room still inside the card. Fix the props and render again if not.
7. **Show the creator** the file in `output/` and the timing you chose, in one line.
