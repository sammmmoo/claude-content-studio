# Setup on your own server (VPS)

A server runs edits while your laptop is closed. This is how I run mine. Any Ubuntu server works; 4 CPU cores and 8 GB of memory is a good start.

## 1. Install the tools

SSH into the server, then:

```bash
sudo apt update && sudo apt install -y git python3 python3-pip python3-venv ffmpeg
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs
```

## 2. Install Claude Code and log in

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude
```

Log in with your Claude account when it asks.

## 3. Get this folder

```bash
git clone https://github.com/sammmmoo/claude-content-studio.git ~/claude-content-studio
cd ~/claude-content-studio
claude
```

Then say: `Set up this folder for me. Install what the video-editor skill needs and check everything works.`

## Keep the server safe

- Log in with an SSH key, not a password, and turn password login off.
- Turn on the firewall and only allow SSH: `sudo ufw allow OpenSSH && sudo ufw enable`. Nothing in this setup needs another port open.

## 4. Getting footage on and videos off

Pick whichever is easiest:
- **Google Drive or Dropbox** with `rclone` (Claude can set it up): film on your phone, it lands in a Drive folder, the server picks it up. rclone saves its login on the server in plain text, so give it access to one folder only, not your whole Drive.
- **Copy it up** from your laptop: `scp clip.mp4 you@server:~/claude-content-studio/footage/`

## 5. Keep it running when you log off

Run Claude inside `tmux` so it keeps going when you disconnect:

```bash
sudo apt install -y tmux
tmux new -s studio
claude
```

Detach with Ctrl+B then D. Come back with `tmux attach -t studio`.
