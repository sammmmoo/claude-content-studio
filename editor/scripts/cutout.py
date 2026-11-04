#!/usr/bin/env python3
"""Cut yourself out of a clip, for the devices that put things behind you (reel wall, feed scroll, reel orbit and the
Wall's head break-out).

  python scripts/cutout.py public/footage/take1.mp4
  -> public/footage/take1-cutout.webm: you on a transparent background, same size, length and frame rate as the clip.
     Pass it as "cutout": "footage/take1-cutout.webm".

  python scripts/cutout.py public/footage/take1.mp4 --cuts 212,431
     The clip is several takes joined: give the frame numbers where a new take starts, so the matte restarts there
     instead of smearing one take's outline into the next.

Uses Robust Video Matting (https://github.com/PeterL1n/RobustVideoMatting, GPL-3.0). It isn't part of this repo: PyTorch
downloads it the first time you run this (about 15 MB). Needs FFmpeg, plus `pip install torch torchvision numpy pillow`.
Runs on the CPU in a few minutes per minute of 1080p footage; uses the GPU if PyTorch can see one.

iPhone clips are HDR by default. If yours is, this also writes <name>-sdr.mp4 and cuts you out of that. Use the -sdr clip
as your "footage" too, so you and your cut-out have the same colours.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter

HDR = {"arib-std-b67", "smpte2084"}  # HLG (iPhone) and PQ
MATTE_LONG_SIDE = 1152                 # the matte runs at about this size, then scales back up to the clip's size
WARM_UP = 10                           # frames the matte sees first at each take start, so its first frames aren't soft


def probe(path: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate,color_transfer:stream_side_data=rotation",
                          "-of", "json", str(path)], capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    w, h = s["width"], s["height"]
    rot = next((int(d.get("rotation", 0)) for d in s.get("side_data_list", []) if "rotation" in d), 0)
    if abs(rot) % 180 == 90:  # phones store portrait as rotated landscape; FFmpeg turns it upright when it decodes
        w, h = h, w
    return {"w": w, "h": h, "fps": s["r_frame_rate"], "transfer": s.get("color_transfer", "")}


def to_sdr(src: Path) -> Path:
    """HDR -> SDR (Rec. 709) with a plain tone map, so skin doesn't come out grey and pale. Keeps the sound."""
    dst = src.with_name(src.stem + "-sdr.mp4")
    tin = probe(src)["transfer"]
    vf = (f"zscale=tin={tin}:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,"
          "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
    print(f"{src.name} is HDR: writing {dst.name} first (use it as your footage too)", flush=True)
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", vf, "-c:v", "libx264", "-crf", "16",
                        "-preset", "medium", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                        "-color_range", "tv", "-c:a", "copy", str(dst)])
    if r.returncode:
        sys.exit("FFmpeg couldn't convert the HDR clip. It needs the zscale filter (libzimg), which the full builds from "
                 "ffmpeg.org / gyan.dev / Homebrew include. Or turn HDR off on the phone (Settings > Camera > Formats) and refilm.")
    return dst


def main() -> None:
    ap = argparse.ArgumentParser(description="Cut yourself out of a clip (WebM with alpha) for the devices that go behind you.")
    ap.add_argument("clip", type=Path)
    ap.add_argument("out", type=Path, nargs="?", help="default: <clip>-cutout.webm next to the clip")
    ap.add_argument("--cuts", default="", help="frames where a new take starts, e.g. 212,431")
    a = ap.parse_args()

    clip = a.clip
    if probe(clip)["transfer"] in HDR:
        clip = to_sdr(clip)
    out = a.out or a.clip.with_name(a.clip.stem + "-cutout.webm")
    info = probe(clip)
    W, H = info["w"], info["h"]
    s = MATTE_LONG_SIDE / max(W, H)
    MW, MH = max(2, round(W * s / 2) * 2), max(2, round(H * s / 2) * 2)
    cuts = sorted({int(c) for c in a.cuts.split(",") if c.strip()})

    dev = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    model = torch.hub.load("PeterL1n/RobustVideoMatting", "mobilenetv3", trust_repo=True).eval().to(dev)

    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(clip), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    size = W * H * 3
    buf: dict[int, np.ndarray] = {}

    def frame(i: int) -> np.ndarray | None:
        """Frame i of the clip, or None past its end. Keeps the last few frames so a take's warm-up can re-read them."""
        while i not in buf:
            n = max(buf) + 1 if buf else 0
            b = dec.stdout.read(size)
            if len(b) < size:
                return None
            buf[n] = np.frombuffer(b, np.uint8).reshape(H, W, 3)
            for k in [k for k in buf if k < n - WARM_UP - 2]:
                del buf[k]
        return buf[i]

    def matte(img: np.ndarray, rec: list):
        small = np.array(Image.fromarray(img).resize((MW, MH), Image.BILINEAR))
        src = torch.from_numpy(small).permute(2, 0, 1).float().div_(255).unsqueeze(0).to(dev)
        with torch.no_grad():
            _, pha, *rec = model(src, *rec, downsample_ratio=0.5)
        return pha[0, 0].clamp(0, 1).cpu().numpy(), rec

    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
                            "-r", info["fps"], "-i", "-",
                            # tagged Rec. 709 like the clip: untagged, the browser draws you more saturated than your footage
                            "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuva420p",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-row-mt", "1",
                            "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0", str(out)], stdin=subprocess.PIPE)
    t0, f, rec = time.time(), 0, [None] * 4
    while (img := frame(f)) is not None:
        if f == 0 or f in cuts:  # a new take: fresh matte state, warmed up on its first frames
            rec = [None] * 4
            for k in range(f, f + WARM_UP):
                if (w := frame(k)) is None or (k > f and k in cuts):
                    break
                _, rec = matte(w, rec)
            img = frame(f)
        pha, rec = matte(img, rec)
        al = Image.fromarray((pha * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        al = al.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))  # pull the edge in a touch, soften it
        a8 = np.clip((np.asarray(al).astype(np.float32) - 38) * (255 / 217), 0, 255).astype(np.uint8)  # drop faint haze
        enc.stdin.write(np.dstack([img, a8]).tobytes())
        f += 1
        if f % 100 == 0:
            print(f"{f} frames, {time.time() - t0:.0f} s", flush=True)
    enc.stdin.close()
    enc.wait()
    dec.kill()
    if f == 0 or enc.returncode:
        sys.exit(f"Nothing written: FFmpeg couldn't read {clip} or write {out}.")
    print(f"wrote {out} ({f} frames, {time.time() - t0:.0f} s)")


if __name__ == "__main__":
    main()
