#!/usr/bin/env python3
"""Checks that the effects render what they promise, on the test clip (scripts/make-test-clip.sh): one still per check,
then pixel assertions. For contributors; you don't need it to make videos.

  python tests/check.py              every check
  python tests/check.py text_behind  one or more by name

Needs numpy and pillow (the same venv as cutout.py) plus FFmpeg. Exit code 1 if any check fails.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ED = Path(__file__).resolve().parent.parent
OUT = ED / "tests" / "out"
CLIP = {"footage": "footage/test.mp4", "cutout": "footage/test-cutout.webm"}
DISC = (176, 180, 190)  # the test cut-out's colour (scripts/make-test-clip.sh)
CHECKS = {}


def check(fn):
    CHECKS[fn.__name__] = fn
    return fn


def still(name: str, comp: str, frame: int, props: dict) -> np.ndarray:
    """Render one frame of `comp` with `props` to tests/out/<name>.png and return it as an RGB array."""
    subprocess.run(["bash", str(ED / "tests" / "run.sh"), name, comp, str(frame), json.dumps(props)], check=True)
    return np.asarray(Image.open(OUT / f"{name}.png").convert("RGB")).astype(np.int16)


def raw(frame: int) -> np.ndarray:
    """Frame `frame` of the test clip as filmed."""
    p = OUT / f"raw-{frame}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(ED / "public" / "footage" / "test.mp4"), "-vf", f"select=eq(n\\,{frame})",
                    "-frames:v", "1", str(p)], check=True)
    return np.asarray(Image.open(p).convert("RGB")).astype(np.int16)


def near(px, rgb, tol=40) -> bool:
    return max(abs(int(a) - int(b)) for a, b in zip(px, rgb)) <= tol


def expect(ok: bool, what: str):
    if not ok:
        raise AssertionError(what)


@check
def harness():
    im = still("harness", "HeadBand", 45, {"footage": CLIP["footage"]})
    expect(im.shape == (1920, 1080, 3), f"still is {im.shape}, want 1920x1080")


def frac(im: np.ndarray, box, rgb, tol=40) -> float:
    """Share of the pixels in box (x0, y0, x1, y1) within `tol` of `rgb`."""
    x0, y0, x1, y1 = box
    r = im[y0:y1, x0:x1]
    return float((np.abs(r - np.array(rgb)).max(axis=2) <= tol).mean())


TB = (226, 85, 43)                         # the text-behind default colour, #E2552B
TB_SIDE, TB_CORE = (0, 900, 340, 1150), (470, 960, 610, 1150)   # beside the test cut-out / inside it


@check
def text_behind():
    base = frac(raw(45), TB_SIDE, TB)
    on = still("text_behind", "TextBehind", 45, {**CLIP, "text": "CLAUDE", "enter": 1.0, "hook": {"top": "", "main": "", "until": 0}})
    expect(frac(on, TB_SIDE, TB) >= base + 0.1, f"text beside you covers {frac(on, TB_SIDE, TB):.2f} of its box (base {base:.2f})")
    expect(frac(on, TB_CORE, TB) < 0.02, f"text shows through you: {frac(on, TB_CORE, TB):.2f}")
    front = still("text_behind_nocut", "TextBehind", 45, {"footage": CLIP["footage"], "text": "CLAUDE", "enter": 1.0, "hook": {"top": "", "main": "", "until": 0}})
    expect(frac(front, TB_CORE, TB) >= 0.1, f"without a cut-out the text should sit in front: {frac(front, TB_CORE, TB):.2f}")
    still("text_behind_at0", "TextBehind", 15, {**CLIP, "text": "CLAUDE", "enter": 0, "hook": {"top": "", "main": "", "until": 0}})


WHITE = (250, 250, 250)
SIDES = [(0, 300, 340, 1700), (740, 300, 1080, 1700)]


@check
def logo_rain():
    base = np.mean([frac(raw(70), b, WHITE, 15) for b in SIDES])
    on = still("logo_rain", "LogoRain", 70, {**CLIP, "logos": [], "enter": 1.0, "hook": {"top": "", "main": "", "until": 0}})
    side = np.mean([frac(on, b, WHITE, 15) for b in SIDES])
    expect(side >= base + 0.05, f"tiles beside you cover {side:.3f} (base {base:.3f})")
    expect(frac(on, TB_CORE, WHITE, 15) < 0.02, f"tiles show through you: {frac(on, TB_CORE, WHITE, 15):.3f}")
    wide = still("logo_rain_wide", "LogoRain", 70, {**CLIP, "logos": ["images/test-wide.png"], "enter": 1.0, "hook": {"top": "", "main": "", "until": 0}})
    green = float((np.abs(wide - np.array((20, 200, 60))).max(axis=2) <= 30).mean())
    expect(green > 0.002, f"your logo image barely shows: {green:.4f} of the frame")


def sat(im: np.ndarray, box) -> float:
    """Mean HSV saturation (0-255) in box."""
    x0, y0, x1, y1 = box
    r = im[y0:y1, x0:x1].astype(np.float32)
    mx, mn = r.max(axis=2), r.min(axis=2)
    return float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1) * 255, 0).mean())


@check
def film_grade():
    mid = still("film_grade", "FilmGrade", 49, {"footage": CLIP["footage"], "enter": 1.0, "hook": {"top": "", "main": "", "until": 0}})
    left, right = sat(mid, (0, 300, 200, 1250)), sat(mid, (900, 300, 1080, 1250))
    expect(right - left >= 10, f"mid-wipe the flat side should be duller: left {left:.1f}, right {right:.1f}")


@check
def clone_me():
    hook = {"top": "", "main": "", "until": 0}
    late = still("clone_me", "CloneMe", 50, {**CLIP, "enter": 1.0, "hook": hook})
    expect(near(late[1070, 880], DISC), f"no copy of you 280 px to the right: {tuple(late[1070, 880])}")
    early = still("clone_me_early", "CloneMe", 32, {**CLIP, "enter": 1.0, "hook": hook})
    expect(not near(early[1070, 880], DISC, 25), "the copy shows before its delay")
    win = still("clone_me_nocut", "CloneMe", 50, {"footage": CLIP["footage"], "enter": 1.0, "hook": hook})
    expect(float(win[400:1500, 356:360].mean()) < 30, "without a cut-out: no gap between the three windows")


HOOK = {"top": "", "main": "", "until": 0}
TELE = {"footage": CLIP["footage"], "jumps": [{"at": 2}], "hook": HOOK}   # no cut-out, no plate: glitch-only


def diff(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.abs(a - b).mean())


@check
def teleport_glitch():
    for name, extra in (("", {}), ("_sf1", {"startFrom": 1})):
        on = lambda fr: still(f"tele{name}_{fr}", "Teleport", fr, {**TELE, **extra})
        off = lambda fr: still(f"tele{name}_{fr}_off", "Teleport", fr, {**TELE, **extra, "glitch": False})
        expect(diff(on(60), off(60)) > 12, f"{name or 'start 0'}: no glitch on the cut frame: {diff(on(60), off(60)):.1f}")
        expect(diff(on(66), off(66)) < 3, f"{name or 'start 0'}: glitch still on 6 frames after the cut: {diff(on(66), off(66)):.1f}")
    # in sync with startFrom: the jump cut at source frame 30 is where the disc moves, so a glitch frame from the wrong
    # source frame shows the disc in the wrong place (Review Focus 2)
    sync = {"footage": "footage/syn.mp4", "jumps": [{"at": 0.5}], "startFrom": 0.5, "hook": HOOK}
    a, b = still("tele_sync", "Teleport", 18, sync), still("tele_sync_off", "Teleport", 18, {**sync, "glitch": False})
    expect(diff(a, b) < 3, f"startFrom 0.5: the glitch shows the wrong source frame: {diff(a, b):.1f}")
    still("tele_early", "Teleport", 0, {**TELE, "jumps": [{"at": 0.05}]})  # a jump at the very start still renders


@check
def teleport_travel():
    j = json.loads((OUT / "syn-tele.json").read_text())
    props = {"footage": "footage/syn.mp4", "cutout": "footage/syn-cutout.webm", "plate": j["plate"], "jumps": j["jumps"],
             "glitch": False, "hook": HOOK}
    for fr in (29, 30):
        im = still(f"tele_travel_{fr}", "Teleport", fr, props)
        xs = np.nonzero((im[900:1020] >= 240).all(axis=2))[1]
        expect(len(xs) > 500 and 400 <= xs.mean() <= 700, f"frame {fr}: you should be mid-jump (x 400-700), got {xs.mean() if len(xs) else None}")
        expect(not (im[960, 300] >= 240).all(), f"frame {fr}: you're still standing at the old spot")
    gl = still("tele_travel_glitch", "Teleport", 30, {**props, "glitch": True})  # the glitch over the travel: the grey room stays grey
    expect(sat(gl, (0, 845, 200, 960)) < 40, f"the glitch over the travel turns the room a solid colour: saturation {sat(gl, (0, 845, 200, 960)):.0f}")


# Supercut: two pieces of the test clip (source 0-2 s and 3-5 s), a 0.2 s J-cut, the SC6 card. Card geometry (px): x 65,
# width 950, top 286, padding 30; numeral 104 px at (95, 316); a section card is 220 px tall, so its bar sits at y 474-482.
SPOKE = lambda *ws: [{"word": w, "start": t, "end": t + 0.25} for w, t in ws]
SC = {"pieces": [{"footage": CLIP["footage"], "from": 0, "to": 2}, {"footage": CLIP["footage"], "from": 3, "to": 5}],
      "words": SPOKE(("Before", 0.1), ("you", 0.3), ("start", 0.5), ("check", 0.9), ("the", 1.0), ("next", 2.5), ("one", 2.7),
                     ("so", 3.4), ("comment", 3.9), ("EDIT", 4.1)),
      "jcut": 0.2, "beats": [2.0], "cuts": [{"at": 2.2, "type": "cut"}], "durationInSeconds": 5,
      "hook": {"top": "Before you start,", "main": "check these 2."},
      "sections": [{"at": 0.8, "kicker": "Before you start", "line": "check the zzqx", "accent": ["zzqx"]},
                   {"at": 2.4, "line": "the next one"}],
      "checklist": {"at": 3.0, "title": "BEFORE YOU START", "rows": [["One:", "check the zzqx"], ["Two:", "the next one"]]},
      "cta": {"at": 3.9, "top": "Comment", "word": "EDIT", "sub": "for the guide"}}
YEL, INK = (255, 210, 31), (17, 17, 19)
CARD_TOP = (65, 286, 1015, 420)
BELOW = lambda im: np.asarray(Image.fromarray(im[560:1280].astype(np.uint8)).resize((54, 36), Image.BILINEAR)).astype(np.int16)  # under the card, above the captions, small so the breathe doesn't count


@check
def supercut_hook():
    im = still("sc_hook", "Supercut", 5, SC)
    expect(frac(im, CARD_TOP, YEL) >= 0.6, f"the hook card should be yellow: {frac(im, CARD_TOP, YEL):.2f}")


@check
def supercut_section():
    im = still("sc_section", "Supercut", 36, SC)  # 0.8 s + 12 frames
    expect(frac(im, CARD_TOP, INK) >= 0.5, f"the section card should be ink: {frac(im, CARD_TOP, INK):.2f}")
    expect(frac(im, (95, 316, 199, 420), YEL) >= 0.6, f"no yellow numeral: {frac(im, (95, 316, 199, 420), YEL):.2f}")
    expect(frac(im, (100, 475, 520, 481), YEL) >= 0.8, f"bar segment 1 should be full: {frac(im, (100, 475, 520, 481), YEL):.2f}")
    expect(frac(im, (550, 475, 960, 481), YEL) < 0.1, f"bar segment 2 should be empty: {frac(im, (550, 475, 960, 481), YEL):.2f}")
    line = (229, 364, 1000, 444)  # a word whisper never heard ("zzqx", the accent) still shows, in yellow (Review Focus 2)
    expect(frac(im, line, YEL) >= 0.01, f"the unheard accent word is missing: {frac(im, line, YEL):.3f}")


@check
def supercut_kicker_said_before():
    # the kicker is said just before the section starts, and the same words come again in the next piece: the card shows
    # the kicker whole when the section starts, never waits for the later "Before you".
    again = {**SC, "words": sorted(SC["words"] + SPOKE(("Before", 2.1), ("you", 2.25)), key=lambda w: w["start"])}
    im = still("sc_kicker", "Supercut", 36, again)
    box = (225, 316, 400, 364)  # "Before you" in the kicker
    expect(frac(im, box, (161, 161, 162), tol=60) >= 0.1, f"the kicker's first words are missing: {frac(im, box, (161, 161, 162), tol=60):.2f}")


@check
def supercut_jcut():
    # the jumping disc (x 300 until 1.0 s, then x 800): piece 1 = 0-0.6 s, piece 2 = 1.2-2.0 s, J-cut 0.2 s. Between the sound
    # join (0.6 s) and the picture cut (0.8 s) piece 1's picture runs on; after it, piece 2's from 1.4 s.
    jc = {**SC, "pieces": [{"footage": "footage/syn.mp4", "from": 0, "to": 0.6}, {"footage": "footage/syn.mp4", "from": 1.2, "to": 2.0}],
          "beats": [0.6], "cuts": [{"at": 0.8, "type": "cut"}], "durationInSeconds": 1.4, "sections": [], "checklist": None, "cta": None}
    jc = {k: v for k, v in jc.items() if v is not None}
    disc = lambda im, x: (im[940:980, x - 40:x + 40] >= 235).all(axis=2).mean()
    a = still("sc_jcut_sound", "Supercut", 21, jc)   # 0.7 s
    expect(disc(a, 300) > 0.8 and disc(a, 800) < 0.2, f"0.7 s should still show piece 1 (disc at x 300): {disc(a, 300):.2f} / {disc(a, 800):.2f}")
    b = still("sc_jcut_pic", "Supercut", 26, jc)     # 0.8 s + 2
    expect(disc(b, 800) > 0.8 and disc(b, 300) < 0.2, f"after the picture cut it should show piece 2 (disc at x 800): {disc(b, 800):.2f} / {disc(b, 300):.2f}")


@check
def supercut_checklist():
    im = still("sc_checklist", "Supercut", 106, SC)  # 3.0 s + 16 frames: every row has landed, the CTA is 11 frames off
    for i in range(2):
        y = 286 + 28 + 54 + i * 56
        expect(frac(im, (95, y, 149, y + 56), YEL) >= 0.05, f"checklist row {i + 1} has no yellow number: {frac(im, (95, y, 149, y + 56), YEL):.3f}")


BARE_EXTRAS = {"checklist": None, "cta": None}  # what supercut_prep writes; left out, Remotion fills in the demo's


@check
def supercut_bare():
    bare = {**{k: v for k, v in SC.items() if k not in ("checklist", "cta")}, **BARE_EXTRAS,
            "sections": SC["sections"][:1], "durationInSeconds": 16}  # one section, no checklist, no CTA
    im = still("sc_bare", "Supercut", 450, bare)  # 15 s: past where the demo's checklist would start
    expect(frac(im, CARD_TOP, INK) >= 0.5, f"with nothing after it the last section should hold: {frac(im, CARD_TOP, INK):.2f}")
    num = frac(im, (95, 316, 199, 420), YEL)
    expect(num >= 0.6, f"the last section's numeral is gone (the demo's checklist or CTA took over): {num:.2f}")


def main(names: list[str]) -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    subprocess.run(["rm", "-rf", str(OUT / "bundle")], check=True)  # rebundle once per run, so the checks see the current code
    if not (ED / "public" / "footage" / "test-cutout.webm").exists():
        subprocess.run(["bash", str(ED / "scripts" / "make-test-clip.sh")], check=True)
    Image.new("RGB", (400, 100), (20, 200, 60)).save(ED / "public" / "images" / "test-wide.png")  # a wide logo, before the bundle
    foot = ED / "public" / "footage"
    if not (foot / "syn-plate.png").exists() or not (OUT / "syn-tele.json").exists():  # the jumping disc, for the teleport checks
        sys.path.insert(0, str(ED / "tests"))
        from test_teleport_prep import make_clip
        make_clip(foot)
        out = subprocess.run([sys.executable, str(ED / "scripts" / "teleport_prep.py"), str(foot / "syn.mp4"), "--cutout",
                              str(foot / "syn-cutout.webm"), "--jumps", "1.0"], check=True, capture_output=True, text=True).stdout
        (OUT / "syn-tele.json").write_text(out)
    bad = 0
    for n in names or list(CHECKS):
        try:
            CHECKS[n]()
            print(f"PASS {n}")
        except Exception as e:  # noqa: BLE001 - report every failure, keep going
            bad += 1
            print(f"FAIL {n}: {e}")
    print(f"{len(names or CHECKS) - bad}/{len(names or CHECKS)} passed")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
