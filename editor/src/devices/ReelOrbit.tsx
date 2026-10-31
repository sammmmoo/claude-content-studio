// REEL ORBIT: a few reels (6 by default) circle above your head on a ring, passing BEHIND it at the back (drawn under your
// cut-out) and coming round in front at the sides, turning slowly and never stopping. After the opener lands, one stack
// bursts into the ring with a quick sweep that eases into a slow drift. Depth: back cards smaller, softer and dimmer.
// The ring sits relative to `face`; check every frame that no front card touches your head. Without a cut-out only the
// front half of the ring shows.
import React from "react";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Reel, ReelTile} from "../objects/cards";
import {Cutout, Footage, hasCutout} from "../lib/Footage";
import {FPS, clamp, sec} from "../lib/time";

export type ReelOrbitProps = DeviceProps & {
  reels: Reel[];
  start: number; // seconds: the stack bursts into the ring
  rx?: number;
  ry?: number;
  lift?: number; // ring centre this many px above your face centre
  cardW?: number;
  drift?: number; // degrees per second once it settles
  dim?: number;
};

export const ReelOrbit: React.FC<ReelOrbitProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const rx = p.rx ?? 420, ry = p.ry ?? 250, cardW = p.cardW ?? 240, drift = p.drift ?? 24;
  const hx = face.x - 12, hy = face.y - (p.lift ?? 243);
  const start = sec(p.start);
  const t = Math.max(0, f - start) / FPS;
  const burstTau = 0.2;
  const r = 1 - Math.exp(-t / burstTau);
  const spin = 90 * (1 - Math.exp(-t / 0.5)) + drift * t;
  const cardH = (cardW * 16) / 9;
  const stack = {x: hx, y: hy - ry};
  const cards = p.reels.map((reel, i) => {
    const th = ((18 + spin) * Math.PI) / 180 + (i * 2 * Math.PI) / p.reels.length;
    const d = Math.sin(th);
    const X = hx + rx * Math.cos(th), Y = hy - ry * d;
    const px = stack.x + (X - stack.x) * r, py = stack.y + (Y - stack.y) * (1 - Math.exp(-t / (burstTau * 1.8)));
    return {reel, i, px, py, d, s: 0.62 + 0.38 * (d + 1) / 2, rot: Math.cos(th) * 35 * r};
  });
  const on = f >= start;
  const card = (c: (typeof cards)[number]) => (
    <div key={c.i} style={{position: "absolute", left: c.px - cardW / 2, top: c.py - cardH / 2, width: cardW, height: cardH,
      transform: `perspective(1400px) rotateY(${c.rot}deg) scale(${c.s})`, opacity: (0.55 + 0.45 * (c.d + 1) / 2) * clamp(f, start, start + 2),
      filter: c.d < 0 ? `blur(${(-c.d * 1.4).toFixed(2)}px) brightness(${(1 + 0.22 * c.d).toFixed(3)})` : undefined,
      borderRadius: 18, overflow: "hidden", border: "3px solid rgba(255,255,255,0.92)", boxShadow: "0 22px 50px rgba(0,0,0,0.5)"}}>
      <ReelTile reel={c.reel} i={c.i} style={{inset: 0}} />
    </div>
  );
  const cut = hasCutout(p.footage, p.cutout);
  const back = cut ? cards.filter((c) => on && c.d < 0).sort((a, b) => a.d - b.d) : [];
  const front = cards.filter((c) => on && c.d >= 0).sort((a, b) => a.d - b.d);
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} dim={on ? (p.dim ?? 0.28) * r : 0} />
      {back.map(card)}
      {cut && <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={p.startFrom} />}
      {front.map(card)}
    </DeviceShell>
  );
};
