---
name: video-editor
description: Use when the creator drops footage in footage/ and asks to edit it, cut it, add captions, graphics or sound, render it, or fix an edit. Also for setting up the editing tools on a new machine.
---

# video-editor

**Outcome:** a finished vertical video in `output/` the creator would post as is, in the preset from `my/style.md`, following `rules/edit-rules.md`.

## First time on a machine

Check and install what's missing, then do one test render of a 5-second clip:
- `ffmpeg -version`, `node -v` (18+), `python3 --version` (3.10+).
- Make a Python environment in this folder first (`python3 -m venv .venv`, then `.venv/bin/pip` on Linux/Mac or `.venv\Scripts\pip` on Windows), and install `faster-whisper` and `yt-dlp` into it. Newer Ubuntu blocks `pip install` outside one.
- Graphics and captions are rendered with the Remotion project in `editor/` (read `editor/README.md`): run `npm install` there, then `npm run test-clip` and `npm run render-all` once to prove it works. Load the official Remotion skills for Claude Code if you can (`remotion-dev/skills`). Remotion is free for individuals and small teams; bigger companies need a licence (check remotion.dev/license).

## The edit, in order

1. **Read the brief.** The script's FOR THE EDIT block if there is one (text hooks, what shows for each line), `my/style.md`, `my/taste.md`, and the preset in `presets/PRESETS.md`.
2. **Transcribe** every take with word timings (faster-whisper, `word_timestamps=True`). Save the transcript next to the footage.
3. **Pick the takes.** For each line in the script, the cleanest full read (no stumble, no restart, good energy). Note which hook take you used. Ask the creator only if two takes are equally good and different.
4. **Cut.** Join the picked words, cutting every gap over 0.1 s and every false start. Add 15 ms audio fades at each join so nothing clicks. Hide ugly jump cuts with a small punch-in.
5. **Build the graphics** with the preset's template in `editor/` (`Wall`, `TopCard`, `HeadBand`, `RedBox`, `WalkShow`, `CleanWide`; devices `ReelWall`, `FeedScroll`, `ReelOrbit`, `Pyramid`). Put the cut clip in `editor/public/footage/`, run `editor/scripts/words.py` on it, then write the template's props (hook, cards, stations, highlight words, cuts) into `editor/props/<name>.json`, timing each animation to its spoken word. Every template already has the house pieces: text hook at frame 0, word-by-word captions, the zoom-out opener, the 5% breathe and the transitions. The devices that go behind the creator need a cut-out of them (see `editor/README.md`). Real screenshots only. Ask the creator for any you can't capture yourself. Render with `npx remotion render <Template> ../output/<name>.mp4 --props=props/<name>.json`.
6. **Sound:** a whoosh on each zoom, a riser into the hook, soft pops on cards, inside the rules' budget. Use sound effects with a licence that allows commercial use (Mixkit, or a library the creator pays for), and note where each came from.
7. **Render** at 1080x1920, 30 fps, normalised to about -14 LUFS. Make two versions if they'll add music in the app: with sound effects only, and with music.
8. **Check it yourself before showing them:** watch frames at the hook, every cut and the end; re-transcribe the render and check no line repeats or is missing; check dimensions, length and loudness with `ffprobe`; scan every frame for private details.
9. **Show them**, with one line per choice you made that they might want changed (which hook take, which style). Their feedback goes in `my/taste.md`.

## Fixing an edit

Change only what they asked for, re-render, and say what changed. If they reject something ("that zoom looks bad"), write it in `my/taste.md` so it never comes back.
