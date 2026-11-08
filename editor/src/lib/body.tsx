// Shared pieces for the body effects (/thanos, /drop-in, /portal, /shrink, /time-stop, /break-out): something drawn in
// clip pixels that follows the opener zoom and the breathe, your cut-out frozen on one frame, the dust you turn into, and
// the hole you fall through. scripts/body_prep.py makes the clean plate, the still of you and the feet points they use.
import React, {useEffect, useMemo, useRef, useState} from "react";
import {Freeze, Sequence, cancelRender, continueRender, delayRender, random, useCurrentFrame} from "remotion";
import {Cutout, Footage, Framing, Point, resolve} from "./Footage";
import {H, W} from "./time";

// Children drawn in clip pixels (0-1080 x 0-1920), placed and scaled like the footage.
export const Framed: React.FC<{fr: Framing; children: React.ReactNode; style?: React.CSSProperties}> = ({fr, children, style}) => (
  <div style={{position: "absolute", left: fr.ox, top: fr.oy, width: W, height: H, transform: `scale(${fr.s})`, transformOrigin: "0 0", ...style}}>
    {children}
  </div>
);

// One source frame (seconds into the file) held still: the clip or your cut-out, frozen.
export const HeldFootage: React.FC<{src: string | null; at: number; framing: Framing}> = ({src, at, framing}) => (
  <Freeze frame={0}><Footage src={src} framing={framing} startFrom={at} /></Freeze>
);
export const HeldCutout: React.FC<{src: string | null; cutout?: string | null; at: number; framing: Framing; style?: React.CSSProperties}> = ({src, cutout, at, framing, style}) => (
  <Freeze frame={0}><Cutout src={src} cutout={cutout} framing={framing} startFrom={at} style={style} exact /></Freeze>
);

// Your cut-out playing from `at` seconds into the file, starting on this composition frame `from` (a moving copy of you).
export const CutoutFrom: React.FC<{src: string | null; cutout?: string | null; from: number; at: number; framing: Framing; style?: React.CSSProperties}> = ({src, cutout, from, at, framing, style}) => (
  <Sequence from={from} layout="none"><Cutout src={src} cutout={cutout} framing={framing} startFrom={at} style={style} exact /></Sequence>
);

const useImg = (src: string | null) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [h] = useState(() => (src ? delayRender(`image ${src}`) : null));
  useEffect(() => {
    if (!src || h === null) return;
    const i = new Image();
    i.onload = () => { setImg(i); continueRender(h); };
    i.onerror = () => cancelRender(new Error(`could not load ${src}`));
    i.src = resolve(src);
  }, [h, src]);
  return img;
};

type Grain = {x: number; y: number; u: number; r: number[]};
const GS = 6; // grain size, px

// You as dust: `still` is a PNG of your cut-out (body_prep.py). mode "out": the grains blow away from frame t0 to t1, eaten
// from the side away from `dir`; mode "in": they fly in from `dir` and settle into you by t1. dir 1 = to/from the right.
export const Dust: React.FC<{still: string; t0: number; t1: number; mode: "out" | "in"; dir?: 1 | -1; seed?: string; framing: Framing}> = ({
  still, t0, t1, mode, dir = 1, seed = "dust", framing,
}) => {
  const f = useCurrentFrame();
  const img = useImg(still);
  const ref = useRef<HTMLCanvasElement>(null);
  const grains = useMemo<Grain[]>(() => {
    if (!img) return [];
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d")!;
    x.drawImage(img, 0, 0, W, H);
    const a = x.getImageData(0, 0, W, H).data;
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    const g: {x: number; y: number}[] = [];
    for (let y = 0; y < H; y += GS) for (let xx = 0; xx < W; xx += GS) {
      if (a[((y + GS / 2) * W + xx + GS / 2) * 4 + 3] > 24) {
        g.push({x: xx, y}); x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
    return g.map((p, i) => {
      const hx0 = (p.x - x0) / Math.max(1, x1 - x0), hx = dir === 1 ? hx0 : 1 - hx0, vy = (p.y - y0) / Math.max(1, y1 - y0);
      const u = mode === "out" ? 0.62 * (1 - hx) + 0.38 * vy : 0.62 * hx + 0.38 * (1 - vy);
      return {x: p.x, y: p.y, u: Math.min(1, Math.max(0, u * 0.8 + 0.2 * random(`${seed}u${i}`))),
        r: [random(`${seed}a${i}`), random(`${seed}b${i}`), random(`${seed}c${i}`), random(`${seed}d${i}`)]};
    });
  }, [img, mode, seed, dir]);
  const ash = useMemo(() => { // the flying grains' colour, made once (a canvas filter per grain is very slow)
    if (!img) return null;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d")!;
    x.filter = "grayscale(0.55) sepia(0.25) brightness(0.92)";
    x.drawImage(img, 0, 0, W, H);
    return c;
  }, [img]);
  useEffect(() => {
    const c = ref.current;
    if (!c || !img || !ash) return;
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, W, H);
    x.drawImage(img, 0, 0, W, H);
    const life = Math.max(4, Math.round((t1 - t0) * 0.55)), spread = Math.max(1, t1 - t0 - life);
    const moving: [Grain, number][] = [];
    for (const g of grains) {
      const s = mode === "out" ? t0 + spread * g.u : t1 - life - spread * (1 - g.u);
      let p = (f - s) / life;
      if (mode === "in") p = 1 - p; // in: 1 -> 0 as it lands
      if (p <= 0) continue; // at home: drawn by the full image
      x.clearRect(g.x, g.y, GS, GS);
      if (p < 1) moving.push([g, p]);
    }
    for (const [g, p] of moving) {
      const t = p * life;
      const vx = 4 + 11 * g.r[0], vy = -(1.5 + 4.5 * g.r[1]);
      const dx = dir * (vx * t + 0.7 * (0.5 + g.r[2]) * t * t) + Math.sin(t * 0.45 + g.r[3] * 6.28) * 14 * p;
      const dy = vy * t - 0.12 * t * t + Math.cos(t * 0.38 + g.r[2] * 6.28) * 6 * p;
      const s = GS * (1 - 0.55 * p);
      x.globalAlpha = Math.max(0, 1 - Math.pow(p, 1.4));
      x.drawImage(ash, g.x, g.y, GS, GS, g.x + dx, g.y + dy, s, s);
      x.globalAlpha = 1;
    }
  }, [f, grains, img, ash, mode, t0, t1, dir]);
  return <Framed fr={framing}><canvas ref={ref} width={W} height={H} style={{position: "absolute", inset: 0}} /></Framed>;
};

// A hole in the floor at `at` (clip px, the centre of your feet), opened 0..1, as seen from a camera a little above.
export const Hole: React.FC<{at: Point; open: number; rx?: number; framing: Framing}> = ({at, open, rx = 180, framing}) => {
  if (open <= 0) return null;
  const w = rx * open, h = w * 0.3;
  return (
    <Framed fr={framing}>
      <div style={{position: "absolute", left: at.x - w - 10, top: at.y - h - 6, width: 2 * w + 20, height: 2 * h + 12, borderRadius: "50%",
        background: "rgba(0,0,0,0.35)", filter: "blur(6px)"}} />
      <div style={{position: "absolute", left: at.x - w, top: at.y - h, width: 2 * w, height: 2 * h, borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 35%, #000 55%, #141414 80%, #2a2622 100%)"}} />
    </Framed>
  );
};

// A puff of dust where you land, `p` 0..1 through it.
export const Puff: React.FC<{at: Point; p: number; framing: Framing}> = ({at, p, framing}) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <Framed fr={framing}>
      {Array.from({length: 18}, (_, i) => {
        const a = Math.PI * (0.05 + 0.9 * random(`pa${i}`)), d = (44 + 95 * random(`pd${i}`)) * Math.sqrt(p);
        const x = at.x + Math.cos(a) * d * (random(`ps${i}`) < 0.5 ? -1 : 1), y = at.y - Math.sin(a) * d * 0.35;
        const r = 18 + 26 * random(`pr${i}`) * (0.6 + p);
        return <div key={i} style={{position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
          background: "rgba(205,196,182,0.9)", opacity: 0.9 * (1 - p), filter: "blur(8px)"}} />;
      })}
    </Framed>
  );
};

// A short shake, `p` 0..1 through it: an offset for the whole picture.
export const shake = (p: number, amp = 24) => (p <= 0 || p >= 1 ? 0 : amp * (1 - p) * Math.sin(p * Math.PI * 7));
