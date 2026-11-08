// SHRINK: at `at` you shrink to action-figure size where you stand (a shadow under your feet), keep talking tiny, and pop
// back to full size at `back`. Needs the clean plate (so the room shows where you were) and your cut-out; body_prep.py gives
// both, and `feet`. Without a plate the room behind you is blurred.
import React from "react";
import {Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, FootageStill, onScreen} from "../lib/Footage";
import {Framed} from "../lib/body";
import {clamp, sec} from "../lib/time";

export type ShrinkProps = DeviceProps & {
  at: number; // seconds: you shrink
  back: number; // seconds: you pop back to full size
  feet: [number, number]; // your feet, clip px (body_prep.py); you shrink towards them
  plate?: string | null; // the room without you (body_prep.py)
  size?: number; // how small, 0-1 (default 0.25)
};

const DOWN = 9, UP = 8; // frames

export const Shrink: React.FC<ShrinkProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const from = p.startFrom ?? 0, a = sec(p.at), b = sec(p.back), size = p.size ?? 0.25;
  if (f < a || f >= b + UP) {
    return <DeviceShell p={p} words={words} face={face}><Footage src={p.footage} framing={framing} startFrom={from} /></DeviceShell>;
  }
  const k = f < b ? clamp(f, a, a + DOWN, 1, size, Easing.inOut(Easing.cubic)) : f < b + UP / 2
    ? clamp(f, b, b + UP / 2, size, 1.06, Easing.out(Easing.cubic)) : clamp(f, b + UP / 2, b + UP, 1.06, 1);
  const ft = onScreen(framing, {x: p.feet[0], y: p.feet[1]});
  const shadow = 0.55 * Math.min(1, Math.max(0, (0.8 - k) / 0.4));
  return (
    <DeviceShell p={p} words={words} face={face}>
      {p.plate ? <FootageStill src={p.plate} framing={framing} /> : <div style={{position: "absolute", inset: 0, filter: "blur(18px) brightness(0.8)"}}>
        <Footage src={p.footage} framing={framing} startFrom={from} /></div>}
      <Framed fr={framing}>
        <div style={{position: "absolute", left: p.feet[0] - 150 * k - 30, top: p.feet[1] - 22, width: 300 * k + 60, height: 44, borderRadius: "50%",
          background: "rgba(0,0,0,0.6)", filter: "blur(10px)", opacity: shadow}} />
      </Framed>
      <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={from}
        style={{transformOrigin: `${ft.x}px ${ft.y}px`, transform: `scale(${k})`}} />
    </DeviceShell>
  );
};
