# Claude Content Studio

The setup I use to make short-form videos with Claude, from the idea to the finished edit. I'd never edited a video in my life. Now Claude does it, in the styles of the creators I like.

It covers the whole job:

1. **Ideas**: Claude studies the creators you like, finds their outlier videos and turns those topics into ideas for your niche.
2. **Hooks**: proven hook shapes, plus a super hook and stacks to keep people watching.
3. **Script**: written to be read off a teleprompter, with a clean read copy and separate notes for the edit.
4. **The edit**: cuts, captions, zooms, sound effects and animations, in a style preset you pick.

Everything in here comes from our own research into what works on short-form video. You plug in whichever creators you like. We take inspiration from people like Kallaway, Hormozi, Mino Lee and Nate Herk for topics and styles, then move it into our niche. You do the same with yours. (None of these creators is affiliated with this repo or has endorsed it.)

## Why this doesn't make slop

Most AI editing setups give everyone the same look, so the feed fills up with videos that all feel the same. This one is built the other way round:
- **Your taste, not a template.** You pick the creators you like and the style for each video. Claude saves every "I don't like that" in `my/taste.md`, so it never comes back.
- **Your words.** The ideas, takes and scripts are yours; Claude shapes them, you say them in your own voice.
- **Your look.** Mix presets, add your own, and build a style that's yours instead of the default every other AI edit has.

## The tools it uses (all free)

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) downloads the reels and videos you want to study (YouTube, TikTok, and public Instagram reels from their link).
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) writes out every word with its timing, for the cuts and captions.
- [FFmpeg](https://ffmpeg.org) cuts and joins the video.
- [Remotion](https://www.remotion.dev) renders the captions, graphics and animations.

Claude installs them for you in the setup step.

## Quick start (about 10 minutes)

1. **Set up Claude.** On a Windows PC: [SETUP-PC.md](SETUP-PC.md). On your own server: [SETUP-VPS.md](SETUP-VPS.md).
2. **Download this folder** and open it in Claude Code.
3. **Fill in three files** in `my/` (or just tell Claude about yourself and it fills them in for you):
   - `my/business.md`: what you do and who you do it for.
   - `my/creators.md`: the creators you like, and any reels you love.
   - `my/style.md`: the edit style you want (pick from [presets/PRESETS.md](presets/PRESETS.md), or let Claude suggest one).
4. **Say to Claude:** `Research my creators.` It studies them and writes your references.
5. **Then:** `Give me 10 video ideas`, `Write the script for idea 3`, and when you've filmed it, drop the footage in `footage/` and say `Edit this`.

## What's in here

| Folder | What it does |
|---|---|
| `CLAUDE.md` | How Claude works in this folder. It reads this first. |
| `my/` | You: your business, your creators, your style. |
| `.claude/skills/` | The five steps: research-creators, topic-finder, hook-writer, script-writer, video-editor. |
| `presets/` | Edit styles, measured from real creators' outlier videos. |
| `rules/` | The rules every edit follows. |
| `references/` | Where Claude saves what it learns about your creators. |
| `footage/`, `output/` | Your raw clips in, finished videos out. |

Works with Claude Code. Codex reads `AGENTS.md`, which points to the same files.

Made by Sam at [OP Digital](https://opdigital.com.au). We're improving it all the time, so check back for new presets and animations.
