#!/usr/bin/env python3
"""Word timings for the editor, from faster-whisper.

    pip install faster-whisper
    python scripts/words.py public/footage/take1.mp4 > props/take1.json

Writes {"footage": "footage/take1.mp4", "words": [{"word", "start", "end"}, ...]} with times in seconds. Add the preset's
own fields (hook, cards, stations...) to that file, then render with --props=props/take1.json.
"""
import argparse
import json
import os
import sys

from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("clip", help="your clip, ideally inside public/footage/")
ap.add_argument("--model", default="small", help="tiny, base, small, medium, large-v3 (bigger = slower, more accurate)")
ap.add_argument("--language", default=None, help="e.g. en; detected if left out")
args = ap.parse_args()

model = WhisperModel(args.model, device="auto", compute_type="auto")
segments, _ = model.transcribe(args.clip, word_timestamps=True, vad_filter=True, language=args.language)
words = [
    {"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)}
    for seg in segments
    for w in (seg.words or [])
    if w.word.strip()
]
rel = os.path.relpath(os.path.abspath(args.clip), os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public")))
json.dump({"footage": rel.replace(os.sep, "/"), "words": words}, sys.stdout, indent=1)
print()
