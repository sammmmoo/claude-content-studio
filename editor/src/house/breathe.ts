// The 5% breathe on face beats: 100% -> 105% over 2 s, hold 3 s, back over 2.2 s, rest, repeat. Below conscious notice,
// so a talking head never sits dead between cuts. Apply it to your footage only (never to text), restart it at every take
// change (start = the beat's first frame) so each cut also steps the framing, and multiply it with any punch-in.
import {Easing, interpolate} from "remotion";

export const BREATHE = {amp: 0.05, inS: 2.0, holdS: 3.0, outS: 2.2, restS: 0.6};
const sine = Easing.inOut(Easing.sin);

export const breathe = (f: number, start: number, fps = 30, b = BREATHE): number => {
  const a = b.inS * fps, h = a + b.holdS * fps, o = h + b.outS * fps, cyc = o + b.restS * fps;
  const t = (((f - start) % cyc) + cyc) % cyc;
  const k = t < a ? interpolate(t, [0, a], [0, 1], {easing: sine}) : t < h ? 1 : t < o ? interpolate(t, [h, o], [1, 0], {easing: sine}) : 0;
  return 1 + b.amp * k;
};

// The breathe for frame f, restarted at the latest beat start (frames) at or before f.
export const breatheAt = (f: number, beatStarts: number[], fps = 30) => {
  const start = beatStarts.filter((s) => s <= f).reduce((a, b) => Math.max(a, b), beatStarts[0] ?? 0);
  return breathe(f, start, fps);
};
