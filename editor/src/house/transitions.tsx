// Cut transitions: one entry per cut, the same look and timing every time.
//   flash   a warm white frame on the cut, falling off over 3 frames
//   zoom    punch into a blur over 3 frames, land on the new shot, settle over 3
//   leak    a warm light leak swept across the frame, 7 frames in and 9 out
//   glitch  four shifted, hue-turned slices of the footage for 5 frames
//   cut     a clean cut (use it when a transition would get in the way)
//
//   const cuts = [{at: 2.4, type: "flash"}, {at: 4.5, type: "zoom"}];      // at = seconds, first frame of the new shot
//   footage layer:  scale(cutZoom(f, cuts).s) and blur(cutZoom(f, cuts).blur px), with <CutGlitch> inside it
//   top layer:      <CutOverlay f={f} cuts={cuts} />  (over captions and graphics too)
import React from "react";
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from "remotion";
import {StandIn} from "../lib/Footage";
import {lin, sec} from "../lib/time";

export type TransitionType = "flash" | "zoom" | "leak" | "glitch" | "cut";
export type Cut = {at: number; type: TransitionType};

const nearCut = (f: number, cuts: Cut[]) => {
  let best: {cut: Cut | null; d: number} = {cut: null, d: 99};
  cuts.forEach((c) => {
    const d = f - sec(c.at);
    if (Math.abs(d) < Math.abs(best.d)) best = {cut: c, d};
  });
  return best;
};

const FLASH = [[-1, 0.3], [0, 1], [1, 0.55], [2, 0.24], [3, 0.08]];
const ZOOM = [[-3, 1.05, 3], [-2, 1.11, 6], [-1, 1.18, 10], [0, 1.2, 10], [1, 1.1, 6], [2, 1.045, 3], [3, 1.015, 1]];

// Multiply into the footage layer's scale and blur.
export const cutZoom = (f: number, cuts: Cut[]) => {
  const {cut, d} = nearCut(f, cuts);
  const z = cut && cut.type === "zoom" ? ZOOM.find((r) => r[0] === d) : undefined;
  return z ? {s: z[1], blur: z[2]} : {s: 1, blur: 0};
};

// Flash and leak, drawn over everything.
export const CutOverlay: React.FC<{f: number; cuts: Cut[]}> = ({f, cuts}) => {
  const {cut, d} = nearCut(f, cuts);
  if (!cut) return null;
  if (cut.type === "flash") {
    const r = FLASH.find((x) => x[0] === d);
    return r ? <AbsoluteFill style={{background: "#fffaf2", opacity: r[1]}} /> : null;
  }
  if (cut.type === "leak") {
    if (d < -7 || d > 9) return null;
    const e = d <= 0 ? lin(d, -7, 0) : 1 - lin(d, 0, 9);
    const x = -500 + 2100 * lin(d, -7, 9);
    return (
      <AbsoluteFill style={{mixBlendMode: "screen", opacity: 0.95 * e}}>
        <div style={{position: "absolute", left: x - 700, top: 300, width: 1400, height: 1500, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,214,140,1), rgba(255,122,26,0.85) 45%, rgba(255,45,122,0.35) 75%, rgba(255,45,122,0) 100%)"}} />
        <div style={{position: "absolute", left: 1080 - x - 450, top: -200, width: 900, height: 1100, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,90,60,0.9), rgba(255,40,120,0.5) 60%, rgba(255,40,120,0) 100%)"}} />
        <AbsoluteFill style={{background: "rgba(255,150,60,0.32)"}} />
      </AbsoluteFill>
    );
  }
  return null;
};

// Glitch slices, inside the footage layer. `src` = the footage (null = the stand-in); `startFrom` = seconds into the file
// at composition frame 0.
export const CutGlitch: React.FC<{cuts: Cut[]; src: string | null; startFrom?: number}> = ({cuts, src, startFrom = 0}) => (
  <>
    {cuts.filter((c) => c.type === "glitch").map((c) => (
      <Sequence key={c.at} from={sec(c.at) - 2} durationInFrames={5} layout="none">
        <GlitchSlices src={src} from={sec(c.at) - 2 + sec(startFrom)} />
      </Sequence>
    ))}
  </>
);
const GlitchSlices: React.FC<{src: string | null; from: number}> = ({src, from}) => {
  const d = useCurrentFrame() - 2;
  const bands = [[0.18, 0.27, 34, 18], [0.44, 0.5, -46, -22], [0.63, 0.74, 28, 14], [0.86, 0.9, -22, -12]];
  const amp = [0.6, 1, 0.8, 0.5, 0.2][d + 2] ?? 0;
  return (
    <>
      {bands.map(([y0, y1, dx, hue], i) => (
        <div key={i} style={{position: "absolute", inset: 0, clipPath: `inset(${y0 * 100}% 0 ${(1 - y1) * 100}% 0)`,
          transform: `translateX(${dx * amp * (d % 2 ? -1 : 1)}px)`, filter: `hue-rotate(${hue}deg) saturate(1.35) brightness(1.08)`}}>
          {src ? <OffthreadVideo src={/^https?:/.test(src) ? src : staticFile(src)} trimBefore={Math.max(0, from)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} /> : <StandIn />}
        </div>
      ))}
    </>
  );
};
