---
name: research-creators
description: Use when the creator asks to research, study or learn from the creators or reels in my/creators.md, or adds a new creator or reel to copy. Finds each creator's outlier videos and writes what makes them work to references/.
---

# research-creators

**Outcome:** for every creator in `my/creators.md`, a file `references/<handle>.md` that says what their outlier videos do, measured, so the other skills can copy it. Plus one table of every outlier in `references/OUTLIERS.md`.

## Steps

1. **List their recent videos with views.** Use `yt-dlp` (installed by the setup step): `yt-dlp --flat-playlist -J <profile url>` gives titles, links and view counts on YouTube and TikTok. **Instagram:** don't log in through the tool. Ask the creator to send a screenshot of the creator's Reels grid (it shows the view count on every video) and paste the links to the reels they like. `yt-dlp <reel link>` downloads a single public reel with no login, so every step after this one still works. Never use their browser cookies or their own account to scrape: it breaks Instagram's terms and can get their business account locked. Never guess a view count.
2. **Find the outliers.** Take their last 15-30 videos. Work out the median views. An outlier is 3x the median or more. Note the multiple for each (e.g. "12.4x").
3. **Watch each outlier.** Download it (`yt-dlp <url> -o references/clips/%(id)s.%(ext)s`). Get the words: captions if there are any, otherwise transcribe with faster-whisper. Pull frames: `ffmpeg -i clip.mp4 -vf fps=2,scale=270:-1,tile=6x4 sheet.jpg` for a contact sheet, and every 0.1 s for the first 2 seconds.
4. **Measure, don't describe.** For each outlier write down:
   - **Hook:** the first spoken line, the text on screen at frame 0 (where and how big), and what you see at frame 0.
   - **Structure:** the beats in order and what each does (hook, why-listen line, the promise, each point, the re-hook in the middle, the payoff, the call to action), with timestamps.
   - **Edit:** where the person sits in frame, caption style (words per line, colour, position), cuts per 10 seconds, how often a graphic appears and what kind (real screenshot, card, icon), zooms, sound effects, music.
   - **Length** and the **call to action**.
5. **Compare with their normal videos.** Look at 2-3 of their average videos. What do the outliers do that the normal ones don't? That difference is the thing to copy. Often it's the topic or the first 3 seconds, not the edit.
6. **Write it up.** `references/<handle>.md`: one line on who they are, their median, then each outlier (link, multiple, the measurements above), then "What to copy" (3-5 bullets) and "What not to copy" (things that only work for them: their fame, their lifestyle, a second person filming). Add each outlier as a row in `references/OUTLIERS.md`: creator, link, multiple, topic, hook line, format, edit style.

Then tell the creator, in a few lines: the 3 outliers most worth copying for their niche, and which preset in `presets/PRESETS.md` matches the style they like (or describe a new one and add it to that file).

Delete downloaded clips when you're done unless they ask to keep them. They're other people's videos, for study only. Never reuse their footage in an edit.
