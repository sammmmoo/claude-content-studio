# editor/

A ready [Remotion](https://www.remotion.dev) project with every style and animation from `presets/PRESETS.md`: one template per preset, the four devices, and the house pieces they share. You give it your clip, your words and your text; it renders a 1080x1920, 30 fps video.

Every template renders straight after install, with a drawn stand-in where your footage goes, so you can see each one before you film.

## Install

Needs [Node.js](https://nodejs.org) 18 or newer. FFmpeg and Python only if you use the helper scripts.

```bash
cd editor
npm install
npm run studio        # opens Remotion Studio in your browser: every template, scrub and edit props live
```

## Render a preset

```bash
npx remotion still RedBox out/redbox.png --frame=30     # one frame
npx remotion render RedBox out/redbox.mp4               # the whole video
```

The compositions:

| Preset or device | Composition | What it does |
|---|---|---|
| 1 Wall | `Wall` | Dark wall the camera glides along; stations: headline, label bars with number chips, reveal list, iPhone Messages mock tagged EXAMPLE, big number. You in a window at the bottom. |
| 2 Top Card | `TopCard` | Title builds word by word on paper, key phrase boxed; browser screenshots with the key line highlighted; you in the bottom third; full-face punch-in for the CTA. |
| 3 Head Band | `HeadBand` | Graphic band across the top, you below; capital captions with the key word green and negatives red; band swaps, "#3" list cards, punch-ins, transitions. |
| 4 Red Box | `RedBox` | The viewer's question in a red box on frame 0, then small lowercase subtitles; wide and close framings. |
| 5 Walk & Show | `WalkShow` | POV hook, small outlined captions, still screen cards, transitions on every cut. |
| 6 Clean Wide | `CleanWide` | One locked wide shot, small title held, word-by-word captions, price-tag cards on your chest. |
| 7 Supercut | `Supercut` | Clips from different videos back to back (J-cut joins) under one card: yellow hook, numbered sections typed as they're said, a segment bar, checklist and comment CTA. |
| Reel wall | `ReelWall` | The background becomes a drifting wall of reels with view counts; you in front. |
| Feed scroll | `FeedScroll` | One creator's feed flicks up on a card behind you. |
| Reel orbit | `ReelOrbit` | Reels circle above your head, passing behind it. |
| Pyramid | `Pyramid` | A 3-level framework: each band lights and labels itself as you say it, the camera pushes in, a capstone completes it. |
| Text behind | `TextBehind` | One big word rises in behind your head; you stand in front of it. |
| Logo rain | `LogoRain` | White tiles with your logos tumble down behind you. |
| Film grade | `FilmGrade` | A white line wipes the clip from flat to a film look, BEFORE and AFTER pills on each side. |
| Clone me | `CloneMe` | Copies of you step in beside you, each a beat behind. |
| Teleport | `Teleport` | A glitch on every jump cut; with a clean plate (`scripts/teleport_prep.py`) you also slide across the room, ghosts trailing. |

## Your footage and words

1. **Cut your video first** (the video-editor skill does this with FFmpeg) and put the cut clip in `public/footage/`, e.g. `public/footage/take1.mp4`. Vertical 9:16.
2. **Get the word timings** with [faster-whisper](https://github.com/SYSTRAN/faster-whisper):
   ```bash
   pip install faster-whisper
   python scripts/words.py public/footage/take1.mp4 > props/take1.json
   ```
   That writes `{"footage": "footage/take1.mp4", "words": [{"word": "Here's", "start": 0.12, "end": 0.40}, ...]}`.
3. **Add the preset's own fields** to `props/take1.json` (all times are seconds, all text is yours). For Red Box:
   ```json
   {
     "footage": "footage/take1.mp4",
     "words": [...],
     "question": ["HOW DO I GET", "MORE VIEWS?"],
     "boxUntil": 1.9,
     "highlight": ["3 seconds"],
     "bold": ["wrong"],
     "close": [{"from": 4.2, "to": 7.0}]
   }
   ```
4. **Render it:**
   ```bash
   npx remotion render RedBox out/take1.mp4 --props=props/take1.json
   ```

The length follows your words (last word plus 0.4 s); set `durationInSeconds` to override. Your clip's sound is the video's sound. Anything you leave out falls back to the demo values, so set every field the preset uses. Every field is listed, with a worked example, in `src/demo.ts` and at the top of each template in `src/presets/` and `src/devices/`.

Fields every template takes: `footage`, `words`, `startFrom` (seconds into the clip), `face` (your face centre in the clip, `{"x": 540, "y": 1070}` by default), `highlight`, `bold`, `beats` (seconds where a new take starts, so the breathe restarts), `cuts` (transitions, see below).

`props/`, `public/footage/` and `public/images/` are gitignored, so your clips and words stay on your machine.

### Screenshots, reels and cut-outs

- **Screenshots and cards:** put images in `public/images/` and pass `"image": "images/name.png"`. Real screenshots only.
- **Reels for the devices:** `{"src": "images/reel1.jpg", "views": 1240000}`. Only reels you have the right to show, and only real view counts.
- **Cut-out:** Reel wall, feed scroll, reel orbit, text behind, logo rain, clone me, teleport and the Wall's head break-out put things behind you, so they need a WebM with alpha of the same clip (you with the background removed). Make it with:
  ```bash
  pip install torch torchvision numpy pillow    # once
  python scripts/cutout.py public/footage/take1.mp4                 # writes public/footage/take1-cutout.webm
  python scripts/cutout.py public/footage/take1.mp4 --cuts 212,431  # several takes joined: the frames where each new take starts
  ```
  Then pass it as `"cutout": "footage/take1-cutout.webm"`. It uses [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting), which downloads itself the first time (about 15 MB), and takes a few minutes per minute of footage on an ordinary CPU. If your clip is iPhone HDR, it writes `take1-sdr.mp4` too: use that as your `footage`, so you and your cut-out match. Without a cut-out, each device falls back to a layout that doesn't need it.
- **Teleport plate:** for `Teleport` on a tripod clip, `python scripts/teleport_prep.py public/footage/take1.mp4 --cutout public/footage/take1-cutout.webm --jumps 2.4,4.3` (the seconds of each jump cut) writes `take1-plate.png`, the room with you out of it, and prints the `plate` and `jumps` props.
- **Supercut pieces:** for `Supercut`, `python scripts/supercut_prep.py --piece public/footage/take1.mp4:2.1:9.4:props/take1-words.json --piece public/footage/take2.mp4:0.4:6.0:props/take2-words.json --jcut 0.1 --cut glitch` joins the pieces (seconds in each clip) into one timeline and prints the `pieces`, `words`, `beats` and `cuts` props; add the `hook`, `sections`, `checklist` and `cta`.

### Test on a clip before you film

```bash
npm run test-clip     # makes public/footage/test.mp4 and test-cutout.webm (needs FFmpeg)
npm run render-all -- '{"footage":"footage/test.mp4","cutout":"footage/test-cutout.webm"}'
```

`npm run render-all` with no argument renders a still and a 2-second clip of every template's demo into `out/`.

## The house pieces (`src/house/`)

Every preset uses these, so the edit rules hold everywhere:

| Piece | File | What it does |
|---|---|---|
| Word-by-word captions | `Captions.tsx` | 2-3 word pages swapped hard on a word, never one word alone; one highlighted word a line; four looks (clean, punchy, caps, outline); fitted to the width from the font's own metrics. |
| Frame-0 text hook | `HookBlock.tsx` | One red block, complete on frame 0 (the thumbnail), leaves on a cut or rises out. |
| 5% breathe | `breathe.ts` | 100% to 105% and back on face beats, below conscious notice; restarts on each beat. |
| Zoom-out opener | `Opener.tsx`, `ZoomBlur.tsx` | Frame 0 punched in on your face, pulls out in ~0.4 s with a running-average zoom blur (not CameraMotionBlur, which steps near frame 0). |
| Transitions | `transitions.tsx` | flash, zoom, leak, glitch, cut. `"cuts": [{"at": 2.4, "type": "flash"}]` |

Clean Wide is the one locked shot, so it skips the opener and breathe.

## Make it yours

- Colours: `src/lib/tokens.ts` (one accent; change `ACCENT`).
- Fonts: `src/lib/fonts.ts`. If you swap a caption font, regenerate `src/lib/metrics.ts` so lines still fit.
- A new preset: copy the closest one in `src/presets/`, register it in `src/Root.tsx`, and describe it in `presets/PRESETS.md`.

## Licences

- This code (and the rest of the repo): MIT, see `LICENSE` at the top of the repo.
- Fonts in `public/fonts/` (Montserrat, TikTok Sans, Inter, Instrument Serif): SIL Open Font License 1.1, licence files alongside.
- Remotion is free for individuals and companies of up to three people; a company of four or more people needs a paid Remotion licence: [remotion.dev/license](https://www.remotion.dev/license).
- Robust Video Matting, which `scripts/cutout.py` downloads when it runs: GPL-3.0. It isn't included in this repo.
- The presets are inspired by the creators named in `presets/PRESETS.md`; nothing here is theirs, and they aren't affiliated with it.
