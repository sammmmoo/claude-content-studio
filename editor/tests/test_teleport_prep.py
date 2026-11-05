#!/usr/bin/env python3
"""teleport_prep.py on a synthetic clip: a white disc on a grey gradient, at x 300 for 30 frames, then x 800 for 30.

  python tests/test_teleport_prep.py      (or pytest tests/test_teleport_prep.py)
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ED = Path(__file__).resolve().parent.parent
TMP = ED / "tests" / "out" / "tp" / "public" / "footage"
BG = "40+X*150/1080"                       # the background's grey level at column X
DISC = "lt(hypot(X-if(lt(T,1),300,800),Y-960),150)"  # the disc: x 300, then x 800 from 1.0 s


def make_clip(d: Path = TMP, rate: int = 30):
    """syn.mp4 and syn-cutout.webm in `d` (tests/check.py also puts them in public/footage for the Teleport checks)."""
    d.mkdir(parents=True, exist_ok=True)
    src = f"color=c=gray:size=1080x1920:rate={rate}:duration=2"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                    f"{src},format=rgb24,geq=r='if({DISC},255,{BG})':g='if({DISC},255,{BG})':b='if({DISC},255,{BG})'",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "12", str(d / "syn.mp4")], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",  # the cut-out is the disc's own white, like a real one is you
                    f"{src.replace('gray', 'white')},format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='if({DISC},255,0)'",
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "1M", "-auto-alt-ref", "0", str(d / "syn-cutout.webm")], check=True)


def test_teleport_prep(rate: int = 30):
    tmp = TMP if rate == 30 else TMP.parent / f"footage{rate}"
    make_clip(tmp, rate)
    out = subprocess.run([sys.executable, str(ED / "scripts" / "teleport_prep.py"), str(tmp / "syn.mp4"),
                          "--cutout", str(tmp / "syn-cutout.webm"), "--jumps", "1.0"], check=True, capture_output=True, text=True).stdout
    got = json.loads(out)
    assert got["plate"] == f"{tmp.name}/syn-plate.png", got["plate"]
    plate = np.asarray(Image.open(tmp / "syn-plate.png").convert("RGB")).astype(int)
    bg = 40 + 300 * 150 / 1080
    assert abs(plate[960, 300].mean() - bg) <= 10, f"the plate still shows the disc at x 300: {plate[960, 300]} (want ~{bg:.0f})"
    j = got["jumps"][0]
    assert j["at"] == 1.0
    assert np.hypot(j["from"][0] - 300, j["from"][1] - 960) <= 15, f"from {j['from']}, want ~(300, 960)"
    assert np.hypot(j["to"][0] - 800, j["to"][1] - 960) <= 15, f"to {j['to']}, want ~(800, 960)"


if __name__ == "__main__":
    test_teleport_prep()
    test_teleport_prep(60)  # an iPhone 60 fps clip: the jump is still at 1.0 s, frame 60
    print("PASS teleport_prep")
