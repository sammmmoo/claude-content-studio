#!/usr/bin/env python3
"""Join clips from different videos into one Supercut timeline and print the props to start from.

  python scripts/supercut_prep.py --piece public/footage/a.mp4:2.1:9.4:props/a-words.json \\
      --piece public/footage/b.mp4:0.4:6.0:props/b-words.json [--jcut 0.2] [--cut glitch]

Each --piece is clip:from:to:words (seconds in that clip; words from scripts/words.py on it). The pieces' sound plays back
to back, each whole from `from` to `to`. With --jcut, each next piece's sound starts that many seconds before its picture
(a J-cut): the earlier picture keeps running, muted, under the next piece's first words. Words, joins (`beats`) and cuts
come out on the joined timeline; fill in `hook`, `sections`, `checklist` and `cta` yourself.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

EDGE = 0.1  # s: a word ending this close after `from` is the last take's tail; one ending this close after `to` is kept


def rel(footage: str) -> str:
    """The clip's path inside editor/public/, the way the preset loads it."""
    s = "/" + footage.lstrip("./")
    return s.rsplit("/public/", 1)[1] if "/public/" in s else footage


def join(pieces: list[dict], jcut: float, cut: str) -> dict:
    """pieces: [{footage, from, to, words, length}] (seconds; length = the clip's duration)."""
    t, words, beats = 0.0, [], []
    for i, p in enumerate(pieces):
        name, a, b = Path(p["footage"]).name, p["from"], p["to"]
        if a >= b:
            raise SystemExit(f"{name}: from {a} must be before to {b}")
        if b > p["length"] + 1e-6:
            raise SystemExit(f"{name}: to {b} is past the end of the clip ({p['length']:.2f} s)")
        if i < len(pieces) - 1 and b + jcut > p["length"] + 1e-6:
            raise SystemExit(f"{name}: its picture runs {jcut} s past to {b}, beyond the end of the clip ({p['length']:.2f} s)")
        if i > 0:
            beats.append(round(t, 3))
        # Whisper folds a pause into the start of the word after it, so a word belongs to the piece by where it ends.
        words += [{"word": w["word"], "start": round(max(w["start"], a) - a + t, 3), "end": round(w["end"] - a + t, 3)}
                  for w in p["words"] if a + EDGE < w["end"] <= b + EDGE + 1e-6]
        t += b - a
    return {"pieces": [{"footage": rel(p["footage"]), "from": p["from"], "to": p["to"]} for p in pieces], "words": words,
            "beats": beats, "cuts": [{"at": round(x + jcut, 3), "type": cut} for x in beats], "jcut": jcut,
            "durationInSeconds": round(t, 3), "hook": {"top": "", "main": ""}, "sections": [], "highlight": [],
            "checklist": None, "cta": None}  # null, not left out: a missing prop falls back to the demo's


def length(clip: str) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip],
                         check=True, capture_output=True, text=True).stdout
    return float(out.strip())


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--piece", action="append", required=True, help="clip:from:to:words.json")
    ap.add_argument("--jcut", type=float, default=0.0)
    ap.add_argument("--cut", default="cut", choices=["cut", "flash", "zoom", "leak", "glitch"])
    a = ap.parse_args()
    pieces = []
    for s in a.piece:
        clip, start, end, wf = s.rsplit(":", 3)
        pieces.append({"footage": clip, "from": float(start), "to": float(end), "length": length(clip),
                       "words": json.loads(Path(wf).read_text())["words"]})
    print(json.dumps(join(pieces, a.jcut, a.cut), indent=1))


if __name__ == "__main__":
    main()
