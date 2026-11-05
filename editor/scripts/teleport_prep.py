#!/usr/bin/env python3
"""Get a clip ready for /teleport: a clean plate (the room with you out of it) and where you stand either side of each jump.

  python scripts/teleport_prep.py public/footage/take.mp4 --cutout public/footage/take-cutout.webm --jumps 2.4,4.3

Film it locked off (camera on a tripod), stepping to a new spot and back into position before each jump: --jumps are the
seconds where you cut from one spot to the next. Needs the cut-out from scripts/cutout.py, numpy, pillow and FFmpeg.
Writes <name>-plate.png next to the clip and prints the props for the Teleport device:
  {"plate": "footage/take-plate.png", "jumps": [{"at": 2.4, "from": [x, y], "to": [x, y]}]}
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import warnings
from pathlib import Path

import numpy as np
from PIL import Image

W, H = 1080, 1920
FIT = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"  # the same crop the devices use (object-fit: cover)


def frame_rate(path: Path) -> float:
    """The clip's frame rate (30, 60, 29.97...), the one cutout.py writes at: jump seconds become its frame numbers."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                          "-of", "csv=p=0", str(path)], check=True, capture_output=True, text=True).stdout.strip().split(",")[0]
    num, _, den = out.partition("/")
    return float(num) / float(den or 1)


def count_frames(path: Path) -> int:
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets",
                          "-of", "csv=p=0", str(path)], check=True, capture_output=True, text=True).stdout
    return int(out.strip().split(",")[0])


def read_frames(path: Path, idx: list[int], alpha: bool) -> np.ndarray:
    """Frames `idx` (sorted, unique) of `path` as (N, H, W, 3) uint8, or (N, H, W) alpha in 0..1 when `alpha`."""
    sel = "+".join(f"eq(n\\,{i})" for i in idx)
    cmd = ["ffmpeg", "-v", "error"] + (["-c:v", "libvpx-vp9"] if alpha else []) + ["-i", str(path), "-vf", f"select='{sel}',{FIT}",
           "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgba" if alpha else "rgb24", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    ch = 4 if alpha else 3
    arr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, ch)
    if len(arr) != len(idx):
        sys.exit(f"{path.name}: asked for {len(idx)} frames, got {len(arr)}")
    return arr[..., 3].astype(np.float32) / 255 if alpha else arr


def centroid(alpha: np.ndarray) -> tuple[float, float] | None:
    """Centre (x, y) of the cut-out in one alpha frame, or None if you're not in it."""
    ys, xs = np.nonzero(alpha > 0.5)
    if len(xs) < 50:
        return None
    return float(xs.mean()), float(ys.mean())


def clean_plate(frames: np.ndarray, alphas: np.ndarray) -> np.ndarray:
    """Per pixel, the median over the frames where you're not covering it (alpha < 0.1); the plain median where you always are."""
    out = np.empty(frames.shape[1:], np.uint8)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)  # all-covered pixels; filled from the plain median below
        for y0 in range(0, frames.shape[1], 160):
            f = frames[:, y0:y0 + 160].astype(np.float32)
            free = (alphas[:, y0:y0 + 160] < 0.1)[..., None]
            med = np.nanmedian(np.where(free, f, np.nan), axis=0)
            med = np.where(np.isnan(med), np.median(f, axis=0), med)
            out[y0:y0 + 160] = np.clip(np.rint(med), 0, 255).astype(np.uint8)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="Clean plate and jump points for /teleport.")
    ap.add_argument("clip", type=Path)
    ap.add_argument("--cutout", type=Path, required=True, help="the WebM from scripts/cutout.py")
    ap.add_argument("--jumps", required=True, help="seconds where you jump, comma-separated: 2.4,4.3")
    a = ap.parse_args()
    jumps = [float(s) for s in a.jumps.split(",") if s.strip()]
    n = min(count_frames(a.clip), count_frames(a.cutout))
    fps = frame_rate(a.clip)
    for t in jumps:
        if not 1 <= round(t * fps) < n:
            sys.exit(f"jump at {t}s is outside the clip (it has {n / fps:.2f}s)")

    sample = sorted({int(i) for i in np.linspace(0, n - 1, min(24, n))})
    plate = clean_plate(read_frames(a.clip, sample, False), read_frames(a.cutout, sample, True))
    out = a.clip.with_name(f"{a.clip.stem}-plate.png")
    Image.fromarray(plate).save(out)

    edges = sorted({i for t in jumps for i in (round(t * fps) - 1, round(t * fps))})
    al = dict(zip(edges, read_frames(a.cutout, edges, True)))
    res = []
    for t in jumps:
        k = round(t * fps)
        fr, to = centroid(al[k - 1]), centroid(al[k])
        if fr is None or to is None:
            sys.exit(f"jump at {t}s: no cut-out in frame {k - 1 if fr is None else k}; is the time right?")
        res.append({"at": t, "from": [round(fr[0]), round(fr[1])], "to": [round(to[0]), round(to[1])]})

    pub = next((p for p in out.resolve().parents if p.name == "public"), None)
    print(json.dumps({"plate": str(out.resolve().relative_to(pub)) if pub else out.name, "jumps": res}))


if __name__ == "__main__":
    main()
