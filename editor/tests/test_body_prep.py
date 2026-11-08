#!/usr/bin/env python3
"""body_prep.py on the synthetic clip from test_teleport_prep.py (a white disc, radius 150, at x 300 then x 800 from 1.0 s).

  python tests/test_body_prep.py      (or pytest tests/test_body_prep.py)
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ED = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ED / "tests"))
from test_teleport_prep import TMP, make_clip  # noqa: E402


def test_body_prep():
    make_clip(TMP)
    out = subprocess.run([sys.executable, str(ED / "scripts" / "body_prep.py"), str(TMP / "syn.mp4"), "--cutout", str(TMP / "syn-cutout.webm"),
                          "--at", "0.5,1.5"], check=True, capture_output=True, text=True).stdout
    got = json.loads(out)
    assert got["plate"] == "footage/syn-plate.png", got["plate"]
    a, b = got["points"]
    assert abs(a["feet"][0] - 300) <= 6 and abs(a["feet"][1] - 1110) <= 6, a["feet"]
    assert abs(b["feet"][0] - 800) <= 6, b["feet"]
    assert abs(a["height"] - 300) <= 8, a["height"]
    assert abs(a["chest"][0] - 300) <= 6 and abs(a["chest"][1] - 910) <= 8, a["chest"]
    still = np.asarray(Image.open(TMP / Path(a["still"]).name))
    assert still.shape == (1920, 1080, 4), still.shape
    assert still[960, 300, 3] > 200 and still[960, 800, 3] < 20, "the still's alpha should be the disc at x 300 only"
    assert still[960, 300, :3].min() > 220, f"the still should carry the clip's colour (white): {still[960, 300]}"
    plate = np.asarray(Image.open(TMP / "syn-plate.png").convert("RGB")).astype(int)
    assert plate[960, 300].max() < 140 and plate[960, 800].max() < 200, "the plate should be the background, with no disc"
    bad = subprocess.run([sys.executable, str(ED / "scripts" / "body_prep.py"), str(TMP / "syn.mp4"), "--cutout", str(TMP / "syn-cutout.webm"),
                          "--at", "9"], capture_output=True, text=True)
    assert bad.returncode != 0 and "outside the clip" in bad.stderr, bad.stderr


if __name__ == "__main__":
    test_body_prep()
    print("PASS body_prep")
