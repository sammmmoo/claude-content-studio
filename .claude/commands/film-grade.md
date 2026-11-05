---
description: "Film grade: a before/after wipe from the flat clip to a film look. Works on any vertical clip."
argument-hint: "[clip in footage/ or editor/public/footage/]"
---

# /film-grade

You're showing an edit or a grade, or you just want the clip to turn cinematic on a line.

Clip: $ARGUMENTS (if it's empty, ask which clip). Work in `editor/`.

1. **Find the clip.** If it's in `footage/`, copy it into `editor/public/footage/`. Call it `<clip>` below (the file name without `.mp4`). It should be vertical 9:16.
2. **Word timings:** `python scripts/words.py public/footage/<clip>.mp4 > props/<clip>-film-grade.json`
3. No cut-out needed.
4. **Pick the moment:** the second the wipe starts (on the word that sets it up).
5. **Write the fields** into `props/<clip>-film-grade.json`, timing each to its spoken word: `enter` (seconds: the line starts to cross), `wipe` (seconds it takes, 1.27), `labelsTop` (px from the top for the BEFORE and AFTER pills, 660; keep them off your face). Also `hook` (`{"top": "...", "main": "...", "until": 2.1}`, or `{"top": "", "main": "", "until": 0}` for none), `highlight` (the words to colour) and `face` (your face centre on screen, `{"x": 540, "y": 1070}` by default; set it whenever your face isn't near the middle, since the opening zoom and the breathe centre on it). Write every field: one left out takes the made-up demo value from `src/demo.ts` (its text, logos or view counts) and that would show on the video.
6. **Render:** `npx remotion render FilmGrade ../output/<clip>-film-grade.mp4 --props=props/<clip>-film-grade.json --timeout=120000` (the longer timeout stops a cut-out video timing out on a busy computer)
7. **Check it** before you show it: `npx remotion still FilmGrade out/check.png --frame=<n> --props=props/<clip>-film-grade.json --timeout=120000` (frame = seconds × 30) on a few frames around the effect and look at them. Check that the clip is flat left of the line and filmic right of it, the pills are off your face, and the whole clip is graded once the line has crossed. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the timing you chose, in one line.
