---
description: "Supercut: one argument cut from different videos under one numbered card. Works on any vertical clips."
argument-hint: "[clips in footage/ or editor/public/footage/, in the order they play]"
---

# /supercut

One argument from several videos: a list where each point comes from a different take, even a different shirt or room.

Clips: $ARGUMENTS (if it's empty, ask which clips, in the order they play). Work in `editor/`.

1. **Find the clips.** If any are in `footage/`, copy them into `editor/public/footage/`. Each should be vertical 9:16. Call them `<clip1>`, `<clip2>`, ... below (file names without `.mp4`), and the finished video `<name>`.
2. **Word timings** for each clip: `python scripts/words.py public/footage/<clip1>.mp4 > props/<clip1>-words.json`, and the same for the others.
3. **Choose the pieces** from the words: one per point, plus one for the hook if it's its own take. Each is the seconds it starts and ends in its clip, on whole sentences, never inside a word. The words can start early after a pause (Whisper counts the pause as part of the next word), so find the pauses: `ffmpeg -i public/footage/<clip1>.mp4 -af silencedetect=noise=-45dB:d=0.05 -f null - 2>&1 | grep -o "silence_[a-z]*: [0-9.]*"`. Start each piece 0.1 s before the talking starts (the `silence_end` before its first word) and end it at the pause after its last word (that `silence_start`), or 0.15 s after the last word if there's no pause.
4. **Join them:** `python scripts/supercut_prep.py --piece public/footage/<clip1>.mp4:<from>:<to>:props/<clip1>-words.json --piece public/footage/<clip2>.mp4:<from>:<to>:props/<clip2>-words.json --jcut 0.1 --cut glitch > props/<name>-supercut.json` (one `--piece` per piece, in order). `--jcut 0.1` starts each next piece's sound 0.1 s before its picture, so its first word is never clipped (0 for straight cuts); `--cut` is the transition on each join: `cut`, `flash`, `zoom`, `leak` or `glitch`. It refuses a piece that runs past the end of its clip (or, before the last piece, ends less than `--jcut` before it), and names the clip. It also writes `checklist` and `cta` as `null`: keep them `null` for none, never delete them (a missing one shows the demo's).
5. **Write the card** into `props/<name>-supercut.json` in the creator's own words, timing it to the joined `words` it printed:
   - `hook`: `{"top": "<small line>", "main": "<big line>"}`, on screen from frame 0 (e.g. a small "Before you post your next video," over a big "check these 3.").
   - `sections`: one per point, `{"at": <second of the line's first word>, "kicker": "<optional small line above it>", "line": "<the words said for the point>", "accent": ["<one word>"]}`. The hook holds until the first section's `at`. The number counts up and the bar fills a segment per point. Each word shows as it's said.
   - `checklist` (or `null`): `{"at": <seconds>, "title": "<title>", "rows": [["<label>:", "<the point>"], ["<label>:", "<the point>"]]}`, a row per point; each label is a word or two ("Hook:", "Sound off:"), and the card numbers the rows itself.
   - `cta` (or `null`): `{"at": <seconds>, "top": "Comment", "word": "<their keyword>", "sub": "<what they'll send>"}`, only if the creator really has something to send for that keyword.
   - `highlight` (the words to colour in the captions) and `face` on each piece (that clip's face centre on screen, `{"x": 540, "y": 1070}` by default): set it whenever the face isn't near the middle, since the opening zoom and the breathe centre on it.
6. **Render:** `npx remotion render Supercut ../output/<name>-supercut.mp4 --props=props/<name>-supercut.json --timeout=120000`
7. **Check it** before you show it: `npx remotion still Supercut out/check.png --frame=<n> --props=props/<name>-supercut.json --timeout=120000` (frame = seconds × 30) at frame 5, each section's `at` plus 10 frames, 2 frames either side of each cut, the checklist and the CTA, and look at them. Check that the hook reads, each number and line matches what's said, every cut lands on a new clip, and the card never covers a face. Listen to the first second after each join: no first word clipped. Fix the props and render again if not.
8. **Show the creator** the file in `output/` and the pieces you chose, in one line.
