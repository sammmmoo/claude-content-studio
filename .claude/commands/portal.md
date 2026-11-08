---
description: "Portal: a hole opens under you and you drop through the floor, then pop up out of another hole somewhere else. Works on a locked-off vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /portal

A hole opens under your feet and you fall through. Film it locked off; for the pop-up, cut to a take where you stand somewhere else.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-portal.json`
3. **Pick the moments** from the words: `open` (the hole opens) and, if you want to come back up, `rise`: the first frame of a take where you stand somewhere new.
4. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage` from here on.
5. **Plate and points:** `python scripts/body_prep.py public/footage/<clip>.mp4 --cutout public/footage/<clip>-cutout.webm --at <open>,<rise>` (give it the `-sdr.mp4` instead if step 4 wrote one). It writes the clean plate and a still of you at each time, and prints `plate` and one `points` entry per time (`still`, `feet`, `chest`, `height`): copy what the fields below need. The plate needs you to move at least once in the clip (a jump cut to a new spot, or walking out of shot at the end); if a patch of the room is never seen without you, it shows a smear there, so film another take.
6. **Write the fields** into the props: `open`, `feet` and `height` (the point at `open`), `plate`, `rise` and `feet2` (the point at `rise`; leave both out and you stay gone). The drop takes 0.9 s, so leave at least 1.2 s between `open` and `rise`. Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
7. **Render:** `npx remotion render Portal ../output/<clip>-portal.mp4 --props=props/<clip>-portal.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
8. **Check it** before you show it: `npx remotion still Portal out/check.png --frame=<n> --props=props/<clip>-portal.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the hole sits on the floor under your feet, you sink into it with nothing showing below the floor line, it closes over the empty room, and you rise out of the second hole on your new spot. Fix the props and render again if not.
9. **Show the creator** the file in `output/` and the timing you chose, in one line.
