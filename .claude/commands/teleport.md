---
description: "Teleport: you jump from one spot to another on each cut, with a glitch. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /teleport

The clip has jump cuts where you're standing somewhere new (camera on a tripod works best).

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-teleport.json`
3. **Find the jumps:** the second of each cut where you're in a new spot. Look at the words for the gaps, then check with `ffmpeg -i public/footage/<clip>.mp4 -vf "select='gt(scene,0.1)',showinfo" -f null - 2>&1 | grep pts_time` (each time is the first frame at the new spot; when you're small in the frame the score is low, so lower 0.1 if it finds nothing and raise it if it finds too many).
4. **Cut yourself out:** `python scripts/cutout.py public/footage/<clip>.mp4 --cuts <frames>`, where `<frames>` is each jump from step 3 as a frame number, comma-separated: its seconds times the clip's frame rate (`ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 public/footage/<clip>.mp4`, e.g. `30/1`), so the cut-out starts fresh on each new take. Add `"cutout": "footage/<clip>-cutout.webm"` to the props. If it wrote a `-sdr.mp4`, use that as `footage` from here on.
5. **Plate and jump points** (tripod clips only; skip on a hand-held clip and you get the glitch alone): `python scripts/teleport_prep.py public/footage/<clip>.mp4 --cutout public/footage/<clip>-cutout.webm --jumps 2.4,4.3` (the seconds from step 3; give it the `-sdr.mp4` instead if step 4 wrote one). It prints `plate` and `jumps`: copy both into the props.
6. **Write the fields** into `props/<clip>-teleport.json`, timing each to its spoken word: `jumps` (from step 5: `[{"at": 2.4, "from": [x, y], "to": [x, y]}]`, or just `[{"at": 2.4}]` for the glitch alone; each `at` is a jump from step 3, not a spoken word), `plate` (from step 5), `glitch` (true; false for a clean jump). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
7. **Render:** `npx remotion render Teleport ../output/<clip>-teleport.mp4 --props=props/<clip>-teleport.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
8. **Check it** before you show it: `npx remotion still Teleport out/check.png --frame=<n> --props=props/<clip>-teleport.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the cut frame glitches, you slide across the room either side of each jump (with a plate), and the picture is clean again 6 frames after. Fix the props and render again if not.
9. **Show the creator** the file in `output/` and the timing you chose, in one line.
