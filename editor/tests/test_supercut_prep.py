#!/usr/bin/env python3
"""supercut_prep.join on made-up pieces: words kept and shifted onto one timeline, joins, J-cut picture cuts, refusals.

  python tests/test_supercut_prep.py      (or pytest tests/test_supercut_prep.py)
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from supercut_prep import join  # noqa: E402

W = lambda *ts: [{"word": f"w{t}", "start": t, "end": t + 0.2} for t in ts]


def piece(footage, a, b, words, length=10.0):
    return {"footage": footage, "from": a, "to": b, "words": words, "length": length}


def test_join():
    got = join([piece("public/footage/a.mp4", 1.0, 3.0, W(0.5, 1.2, 2.9)), piece("footage/b.mp4", 4.0, 5.5, W(4.1, 5.6))], 0.2, "glitch")
    assert got["beats"] == [2.0], got["beats"]
    assert got["cuts"] == [{"at": 2.2, "type": "glitch"}], got["cuts"]
    assert got["durationInSeconds"] == 3.5, got["durationInSeconds"]
    assert [w["start"] for w in got["words"]] == [0.2, 1.9, 2.1], got["words"]
    assert [w["end"] for w in got["words"]] == [0.4, 2.1, 2.3], got["words"]
    assert got["pieces"] == [{"footage": "footage/a.mp4", "from": 1.0, "to": 3.0}, {"footage": "footage/b.mp4", "from": 4.0, "to": 5.5}], got["pieces"]
    assert got["jcut"] == 0.2 and got["sections"] == [] and got["hook"] == {"top": "", "main": ""}
    # written as null, not left out: Remotion fills a missing prop from the demo, which would put its checklist and CTA on
    # the creator's video
    assert "checklist" in got and got["checklist"] is None and "cta" in got and got["cta"] is None, got
    absolute = join([piece("/home/me/studio/editor/public/footage/c.mp4", 0.0, 1.0, [])], 0, "cut")
    assert absolute["pieces"][0]["footage"] == "footage/c.mp4", absolute["pieces"][0]


def test_stretched_words():
    # Whisper folds a pause into the start of the next word, so a word is placed by where it ends: one heard at the piece's
    # start but stretched back before `from` is kept (start clamped), one that starts before `to` but is said after the
    # cut is dropped.
    heard = {"word": "Before", "start": 0.0, "end": 0.72}      # really said from 0.57
    unheard = {"word": "because", "start": 3.56, "end": 3.96}  # really said from 3.80, after the cut at 3.71
    got = join([piece("footage/a.mp4", 0.0, 3.71, [{"word": "seconds", "start": 3.08, "end": 3.56}, unheard]),
                piece("footage/b.mp4", 0.466, 3.49, [heard])], 0.1, "cut")
    assert [w["word"] for w in got["words"]] == ["seconds", "Before"], got["words"]
    assert got["words"][1]["start"] == 3.71 and got["words"][1]["end"] == round(0.72 - 0.466 + 3.71, 3), got["words"][1]


def refuses(pieces, jcut, name):
    try:
        join(pieces, jcut, "cut")
    except SystemExit as e:
        assert name in str(e), f"message doesn't name {name}: {e}"
        return
    raise AssertionError(f"no refusal for {name}")


def test_jcut_from_zero():
    # a later piece may start at 0 with a J-cut: its picture starts jcut later, so nothing reads before the clip's start,
    # and a clip that talks from 0.02 s keeps its first word
    got = join([piece("footage/a.mp4", 1.0, 3.0, []), piece("footage/tight.mp4", 0.0, 2.0, W(0.02))], 0.1, "cut")
    assert got["pieces"][1]["from"] == 0.0 and [w["start"] for w in got["words"]] == [2.02], got


def test_refusals():
    ok = piece("footage/a.mp4", 1.0, 3.0, [])
    refuses([piece("footage/bad.mp4", 3.0, 3.0, [])], 0, "bad.mp4")          # from >= to
    refuses([ok, piece("footage/long.mp4", 2.0, 12.0, [], length=10.0)], 0, "long.mp4")   # past the clip's end
    refuses([piece("footage/tail.mp4", 1.0, 9.9, [], length=10.0), ok], 0.2, "tail.mp4")  # picture runs jcut past `to`


if __name__ == "__main__":
    test_join()
    test_stretched_words()
    test_jcut_from_zero()
    test_refusals()
    print("PASS")
