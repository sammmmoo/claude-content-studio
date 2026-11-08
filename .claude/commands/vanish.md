---
description: "Vanish: you turn to dust and blow away, then form again somewhere else. The same effect as /thanos."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /vanish

You turn to dust and disappear (the same effect as `/thanos`, under a plainer name). Film it locked off (camera on a tripod); for the come-back, cut to a take where you stand somewhere else.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-vanish.json`
3. **Pick the moments** from the words: `snap` (the second you snap or say the word) and, if you want to come back, `back`: the first frame of a take where you stand somewhere else (a jump cut). Check the cut with `ffmpeg -i public/footage/<clip>.mp4 -vf "select='gt(scene,0.1)',showinfo" -f null - 2>&1 | grep pts_time`.
4. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4` (several takes joined: add `--cuts` with the frame where each new take starts). Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage` from here on.
5. **Plate and points:** `python scripts/body_prep.py public/footage/<clip>.mp4 --cutout public/footage/<clip>-cutout.webm --at <snap>,<back>` (give it the `-sdr.mp4` instead if step 4 wrote one). It writes the clean plate and a still of you at each time, and prints `plate` and one `points` entry per time (`still`, `feet`, `chest`, `height`): copy what the fields below need. The plate needs you to move at least once in the clip (a jump cut to a new spot, or walking out of shot at the end); if a patch of the room is never seen without you, it shows a smear there, so film another take.
6. **Write the fields** into the props, timing each to its spoken word: `snap`, `still` (the point at `snap`), `plate`, `back` and `backStill` (the point at `back`; leave both out and you stay gone), `dir` (1: the dust blows right; -1: left, towards the side with more room). The dust takes 0.8 s and coming back 0.5 s, so leave at least 1.3 s between `snap` and `back`. Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
7. **Render:** `npx remotion render Thanos ../output/<clip>-vanish.mp4 --props=props/<clip>-vanish.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
8. **Check it** before you show it: `npx remotion still Thanos out/check.png --frame=<n> --props=props/<clip>-vanish.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that you crumble from one side into grains that blow away, the room behind you is clean (no smear where you stood), and if you come back the grains fly in and the clip carries on from there. Fix the props and render again if not.
9. **Show the creator** the file in `output/` and the timing you chose, in one line.
