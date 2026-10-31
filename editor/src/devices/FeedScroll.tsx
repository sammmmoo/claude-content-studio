// FEED SCROLL: for when you talk about one creator. Their Reels feed (3 columns of covers) sits on a rounded card behind
// you and flicks up: each flick is a fast exponential ease-out that lands on a hold, never a constant-speed scroll. Covers
// are stills, so the scroll is the only thing moving. Without a cut-out the card sits above your head instead.
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Reel, ReelTile} from "../objects/cards";
import {Cutout, Footage, hasCutout} from "../lib/Footage";
import {FPS, clamp, sec} from "../lib/time";

export type Flick = {at: number; dist: number; tau?: number}; // at seconds, dist px; ~99% of dist after 4.6 tau seconds
export type FeedScrollProps = DeviceProps & {
  covers: Reel[];
  flicks: Flick[];
  enter: number; // seconds: the card arrives
  box?: {x: number; y: number; w: number; h: number};
  dim?: number; // darken the room behind the card
};

export const FeedScroll: React.FC<FeedScrollProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const cut = hasCutout(p.footage, p.cutout);
  const b = p.box ?? (cut ? {x: 230, y: 560, w: 620, h: 680} : {x: 290, y: 470, w: 500, h: 380});
  const gap = 4, tw = (b.w - 2 * gap) / 3, th = (tw * 16) / 9;
  const at = sec(p.enter);
  const scroll = p.flicks.reduce((a, k) => {
    const s = sec(k.at);
    return a + (f < s ? 0 : k.dist * (1 - Math.exp(-(f - s) / FPS / (k.tau ?? 0.7))));
  }, 0);
  const first = Math.max(0, Math.floor(scroll / (th + gap)) - 1);
  const last = Math.ceil((b.h + scroll) / (th + gap)) + 1;
  const tiles: React.ReactNode[] = [];
  for (let r = first; r < last; r++) {
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      tiles.push(<ReelTile key={i} reel={p.covers[i % p.covers.length]} i={i} style={{left: c * (tw + gap), top: r * (th + gap) - scroll, width: tw, height: th}} />);
    }
  }
  const u = clamp(f, at, at + 8, 0, 1, Easing.out(Easing.exp));
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} dim={clamp(f, at, at + 10, 0, p.dim ?? 0.45)} />
      {f >= at && (
        <div style={{position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 22, overflow: "hidden", backgroundColor: "#0b0b0c",
          opacity: clamp(f, at, at + 3), transform: `translateY(${(1 - u) * 60}px)`, border: "1.5px solid rgba(255,255,255,0.3)", boxShadow: "0 30px 80px rgba(0,0,0,0.55)"}}>
          {tiles}
        </div>
      )}
      {cut && <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={p.startFrom} />}
      <AbsoluteFill />
    </DeviceShell>
  );
};
