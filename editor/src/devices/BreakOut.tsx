// BREAK OUT: your video plays inside a card (like a post on a feed); at `step` you step out of it: you grow a little and
// spill over the card's edges in front of it, a shadow under you, while the room stays inside the card. Needs your
// cut-out; without one the card just pops forward.
import React from "react";
import {Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, Framing, hasCutout} from "../lib/Footage";
import {W, H, clamp, sec} from "../lib/time";

export type BreakOutProps = DeviceProps & {
  step: number; // seconds: you step out of the card
  card?: {x: number; y: number; w: number; h: number}; // the card on screen, px (default 864 x 1150, centred, 360 from the top)
  background?: string; // behind the card (default near-black)
  grow?: number; // how much bigger you get as you step out (default 1.22)
};

const CARD = {x: 108, y: 360, w: 864, h: 1150}, STEP = 10; // px; frames

export const BreakOut: React.FC<BreakOutProps> = (p) => {
  const {f, face, words} = useDevice(p);
  const c = p.card ?? CARD, s = sec(p.step), from = p.startFrom ?? 0, grow = p.grow ?? 1.22;
  const sc = Math.max(c.w / W, c.h / H), inCard: Framing = {s: sc, ox: c.x + (c.w - W * sc) / 2, oy: c.y + (c.h - H * sc) / 2};
  const q = clamp(f, s, s + STEP, 0, 1, Easing.inOut(Easing.cubic));
  const k = 1 + (grow - 1) * q, lift = -34 * Math.sin(Math.PI * q);
  const origin = `${c.x + c.w / 2}px ${c.y + c.h}px`; // you grow from the card's bottom edge, where your feet would be
  const cut = hasCutout(p.footage, p.cutout);
  return (
    <DeviceShell p={p} words={words} face={face}>
      <div style={{position: "absolute", inset: 0, background: p.background ?? "#111113"}} />
      <div style={{position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: 36, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)", transform: !cut && f >= s ? `scale(${1 + 0.06 * q})` : undefined}}>
        <div style={{position: "absolute", left: -c.x, top: -c.y, width: W, height: H}}>
          <Footage src={p.footage} framing={inCard} startFrom={from} />
        </div>
      </div>
      {cut && f >= s && (
        <Cutout src={p.footage} cutout={p.cutout} framing={inCard} startFrom={from}
          style={{transformOrigin: origin, transform: `translateY(${lift}px) scale(${k})`, filter: `drop-shadow(0 18px 24px rgba(0,0,0,${0.45 * q}))`}} />
      )}
    </DeviceShell>
  );
};
