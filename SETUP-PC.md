# Setup on a Windows PC

You need Claude Code plus four free tools: Git, Python, Node and FFmpeg. Claude can do most of this for you once Claude Code is installed.

## 1. Install Claude Code

Open **PowerShell** (Start menu, type "PowerShell") and paste:

```powershell
irm https://claude.ai/install.ps1 | iex
```

Then type `claude` and log in with your Claude account. A paid plan (Pro or Max) is needed for Claude Code.

Prefer an app? The Claude desktop app has Claude Code built in. Open the app, go to the Code tab, and pick this folder.

## 2. Install the tools

Paste this into PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id Python.Python.3.12 -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Gyan.FFmpeg -e
```

Close PowerShell and open it again so the new tools are found.

## 3. Get this folder

```powershell
cd $HOME\Documents
git clone https://github.com/sammmmoo/claude-content-studio.git claude-content-studio
cd claude-content-studio
claude
```

## 4. Let Claude finish the setup

In Claude, say:

> Set up this folder for me. Install what the video-editor skill needs and check everything works.

It installs the Python and Node packages (transcription, captions, rendering) and runs a test render.

## Tips

- Keep your footage on the PC's own drive, not a synced folder, while editing. Large files sync slowly.
- An edit is heavy work. A PC with 16 GB of memory is comfortable; 8 GB works for short clips.
