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
// at composition frame 0. rgb / stutter / scan switch on glitch v2 (below); with none of them set it renders as before.
export const CutGlitch: React.FC<{cuts: Cut[]; src: string | null; startFrom?: number; rgb?: boolean; stutter?: boolean; scan?: boolean}> = ({
  cuts, src, startFrom = 0, rgb = false, stutter = false, scan = false}) => (
  <>
    {cuts.filter((c) => c.type === "glitch").map((c) => rgb || stutter || scan ? (
      <GlitchV2 key={c.at} at={sec(c.at)} rgb={rgb} stutter={stutter} scan={scan}
        picture={(dd) => <SourceFrame src={src} sf={sec(c.at) + sec(startFrom) + dd} />} />
    ) : (
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

// ---------- glitch v2: built in the recipe's order, d = frames from the cut ----------
// 1. RGB split: red right, blue left, 12 px on the cut frame, halving each frame after (gone by +4).
// 2. Slices: the same four hue-turned bands as above, d -2..+2.
// 3. Stutter: frame -1 repeats frame -2, so the picture catches before the jump.
// 4. Scanlines: every 3 px at 20%, the cut frame only.
// `picture(dd)` draws the picture dd frames from the cut (any layer: the footage, or a teleport frame). Each frame is its
// own 1-frame Sequence, so whatever `picture` draws should show its exact source frame at local frame 0.
export const RGB_DX = [12, 6, 3, 1.5];
const BANDS = [[0.18, 0.27, 34, 18], [0.44, 0.5, -46, -22], [0.63, 0.74, 28, 14], [0.86, 0.9, -22, -12]];
const AMP = [0.6, 1, 0.8, 0.5, 0.2];

const SourceFrame: React.FC<{src: string | null; sf: number}> = ({src, sf}) => (
  <AbsoluteFill>
    {src ? <OffthreadVideo src={/^https?:/.test(src) ? src : staticFile(src)} trimBefore={Math.max(0, sf)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} /> : <StandIn />}
  </AbsoluteFill>
);

// Exact channel split: each copy keeps one channel, the three add back up under screen. Scaled up by the split so the
// shifted channels never leave a coloured strip at the side edges (1.024 at 12 px).
export const RgbSplit: React.FC<{dx: number; children: React.ReactNode}> = ({dx, children}) => (
  <AbsoluteFill style={{background: "#000", isolation: "isolate", transform: `scale(${1 + 2.2 * dx / 1080})`}}>
    {([["#ff0000", dx], ["#00ff00", 0], ["#0000ff", -dx]] as [string, number][]).map(([c, x]) => (
      <AbsoluteFill key={c} style={{mixBlendMode: "screen", isolation: "isolate", transform: `translateX(${x}px)`}}>
        {children}
        <AbsoluteFill style={{background: c, mixBlendMode: "multiply"}} />
      </AbsoluteFill>
    ))}
  </AbsoluteFill>
);

const Scan: React.FC<{every: number; dark: number}> = ({every, dark}) => (
  <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${dark}) 0px, rgba(0,0,0,${dark}) 1px, transparent 1px, transparent ${every}px)`}} />
);

export const GlitchV2: React.FC<{at: number /* frame of the cut */; picture: (dd: number) => React.ReactNode; rgb: boolean; stutter: boolean; scan: boolean}> = ({
  at, picture, rgb, stutter, scan}) => (
  <>
    {[-2, -1, 0, 1, 2, 3].filter((d) => at + d >= 0).map((d) => {
      const dd = stutter && d === -1 ? -2 : d;
      const split = rgb && d >= 0 ? RGB_DX[d] : 0;
      const amp = d <= 2 ? AMP[d + 2] : 0;
      const pic = () => (split > 0 ? <RgbSplit dx={split}>{picture(dd)}</RgbSplit> : picture(dd));
      return (
        <Sequence key={d} from={at + d} durationInFrames={1} layout="none">
          {(split > 0 || dd !== d) && pic()}
          {amp > 0 && BANDS.map(([y0, y1, dx, hue], i) => (
            <div key={i} style={{position: "absolute", inset: 0, clipPath: `inset(${y0 * 100}% 0 ${(1 - y1) * 100}% 0)`,
              transform: `translateX(${dx * amp * (d % 2 ? -1 : 1)}px)`, filter: `hue-rotate(${hue}deg) saturate(1.35) brightness(1.08)`}}>
              {pic()}
            </div>
          ))}
          {scan && d === 0 && <Scan every={3} dark={0.2} />}
        </Sequence>
      );
    })}
  </>
);
