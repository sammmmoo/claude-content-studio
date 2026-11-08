#!/usr/bin/env python3
"""Get a clip ready for the body effects (/thanos, /drop-in, /portal, /shrink, /time-stop): a clean plate (the room with you
out of it), and at each moment you name, where your feet and chest are, how tall you are, and a still of your cut-out.

  python scripts/body_prep.py public/footage/take.mp4 --cutout public/footage/take-cutout.webm --at 2.4,4.3

Film it locked off (camera on a tripod) and move around at least once (a jump cut to a new spot, or walk out of shot at the
end), so every part of the room is seen without you in front of it somewhere. Needs the cut-out from scripts/cutout.py,
numpy, pillow and FFmpeg. Writes <name>-plate.png and <name>-you-<frame>.png next to the clip and prints the props:
  {"plate": "footage/take-plate.png", "points": [{"at": 2.4, "still": "footage/take-you-72.png", "feet": [x, y],
   "chest": [x, y], "height": h}]}
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from teleport_prep import clean_plate, count_frames, frame_rate, read_frames  # noqa: E402


def measure(alpha: np.ndarray) -> dict | None:
    """Feet (the middle of your lowest rows), chest (a third of the way down from the top of your head) and height, in px."""
    ys, xs = np.nonzero(alpha > 0.5)
    if len(xs) < 50:
        return None
    top, bottom = int(ys.min()), int(ys.max())
    low = ys >= bottom - max(4, (bottom - top) // 30)
    chest_y = top + (bottom - top) // 3
    row = xs[np.abs(ys - chest_y) <= 3]
    return {"feet": [round(float(xs[low].mean())), bottom], "chest": [round(float(row.mean() if len(row) else xs.mean())), chest_y],
            "height": bottom - top}


def main() -> None:
    ap = argparse.ArgumentParser(description="Clean plate, feet points and cut-out stills for the body effects.")
    ap.add_argument("clip", type=Path)
    ap.add_argument("--cutout", type=Path, required=True, help="the WebM from scripts/cutout.py")
    ap.add_argument("--at", required=True, help="seconds to measure you at, comma-separated: 2.4,4.3")
    a = ap.parse_args()
    times = [float(s) for s in a.at.split(",") if s.strip()]
    n = min(count_frames(a.clip), count_frames(a.cutout))
    fps = frame_rate(a.clip)
    for t in times:
        if not 0 <= round(t * fps) < n:
            sys.exit(f"{t}s is outside the clip (it has {n / fps:.2f}s)")

    sample = sorted({int(i) for i in np.linspace(0, n - 1, min(24, n))})
    plate = clean_plate(read_frames(a.clip, sample, False), read_frames(a.cutout, sample, True))
    out = a.clip.with_name(f"{a.clip.stem}-plate.png")
    Image.fromarray(plate).save(out)  # PIL writes no gamma chunk, so the browser shows it at the clip's brightness
    pub = next((p for p in out.resolve().parents if p.name == "public"), None)
    rel = lambda p: str(p.resolve().relative_to(pub)) if pub else p.name

    idx = sorted({round(t * fps) for t in times})
    rgb, al = dict(zip(idx, read_frames(a.clip, idx, False))), dict(zip(idx, read_frames(a.cutout, idx, True)))
    points = []
    for t in times:
        k = round(t * fps)
        m = measure(al[k])
        if m is None:
            sys.exit(f"{t}s: you're not in the cut-out at frame {k}; is the time right?")
        still = a.clip.with_name(f"{a.clip.stem}-you-{k}.png")
        Image.fromarray(np.dstack([rgb[k], np.clip(al[k] * 255, 0, 255).astype(np.uint8)]), "RGBA").save(still)
        points.append({"at": t, "still": rel(still), **m})
    print(json.dumps({"plate": rel(out), "points": points}))


if __name__ == "__main__":
    main()
