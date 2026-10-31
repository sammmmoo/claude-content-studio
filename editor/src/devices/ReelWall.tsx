// REEL WALL: for when you talk about views, content or creators. Your face first (the opener), then the whole background
// becomes a wall of reels with their view counts: it slides up from the bottom into place behind you and keeps drifting
// slowly, like scrolling a feed. You stay in front (your cut-out), lifted by a soft shadow and a darker halo.
// Without a cut-out you sit in a rounded window at the bottom instead.
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Reel, ReelTile} from "../objects/cards";
import {Cutout, Footage, hasCutout} from "../lib/Footage";
import {FPS, W, clamp, sec} from "../lib/time";

export type ReelWallProps = DeviceProps & {
  reels: Reel[]; // covers (images) with real view counts; use your own or ones you have the right to show
  enter: number; // seconds: the wall slides in
  cols?: number;
  speed?: number; // drift, px per second
  dim?: number; // darken the covers so you stand out
};

export const ReelWall: React.FC<ReelWallProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const cols = p.cols ?? 3, gap = 6, speed = p.speed ?? 55, dim = p.dim ?? 0.36;
  const tw = (W - (cols - 1) * gap) / cols, th = (tw * 16) / 9;
  const at = sec(p.enter);
  const u = clamp(f, at, at + 20, 0, 1, Easing.out(Easing.cubic));
  const y0 = (1 - u) * 1960 - (speed * Math.max(0, f - at)) / FPS - 40;
  const rows = Math.ceil(p.reels.length / cols);
  const cut = hasCutout(p.footage, p.cutout);
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} />
      {f >= at && (
        <AbsoluteFill>
          <div style={{position: "absolute", left: 0, width: W, top: y0 - gap, height: rows * (th + gap) + gap, backgroundColor: "#000"}} />
          {p.reels.map((r, i) => {
            const top = y0 + Math.floor(i / cols) * (th + gap);
            if (top > 1920 || top + th < -200) return null;
            return <ReelTile key={i} reel={r} i={i} dim={dim} style={{left: (i % cols) * (tw + gap), top, width: tw, height: th}} />;
          })}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{opacity: u, background: `radial-gradient(ellipse 560px 760px at ${face.x}px ${face.y + 80}px, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)`}} />
      {cut ? (
        <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={p.startFrom}
          style={{filter: u > 0 ? `drop-shadow(0 0 26px rgba(0,0,0,${(0.85 * u).toFixed(3)})) drop-shadow(0 10px 18px rgba(0,0,0,${(0.5 * u).toFixed(3)}))` : undefined}} />
      ) : (
        <div style={{position: "absolute", left: 60, top: 1190 + (1 - u) * 730, width: 960, height: 690, borderRadius: 34, overflow: "hidden", boxShadow: "0 -20px 60px rgba(0,0,0,0.5)"}}>
          <div style={{position: "absolute", left: -60, top: -1190 + 300}}><Footage src={p.footage} framing={framing} startFrom={p.startFrom} /></div>
        </div>
      )}
    </DeviceShell>
  );
};
