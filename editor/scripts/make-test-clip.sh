#!/usr/bin/env bash
# Makes a short test clip (and a matching cut-out with alpha) so you can render every template on real video before you
# film anything. Needs FFmpeg. Writes public/footage/test.mp4 and public/footage/test-cutout.webm (both gitignored).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/footage
SECS=${1:-8}
# a moving test pattern with a tone, 1080x1920 at 30 fps
ffmpeg -y -loglevel error -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=${SECS}" \
  -f lavfi -i "sine=frequency=330:duration=${SECS}" -c:v libx264 -pix_fmt yuv420p -crf 23 -c:a aac -shortest public/footage/test.mp4
# a cut-out: an opaque disc where a head would be, transparent everywhere else (VP9 with alpha)
ffmpeg -y -loglevel error -f lavfi -i "color=c=0xB0B4BE:size=1080x1920:rate=30:duration=${SECS},format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='if(lt(hypot(X-540,(Y-1070)*0.8),190),255,0)'" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 1M -auto-alt-ref 0 public/footage/test-cutout.webm
echo "wrote public/footage/test.mp4 and public/footage/test-cutout.webm"
