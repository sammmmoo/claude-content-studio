// TIME STOP: at `stop` the picture freezes and drains to grey from your chest outwards, then the real you (in colour, still
// talking) steps out sideways and leaves your frozen grey self behind. Needs your cut-out for the step out; without one the
// world just freezes and turns grey.
import React from "react";
import {Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Footage, hasCutout, onScreen} from "../lib/Footage";
import {CutoutFrom, HeldFootage} from "../lib/body";
import {clamp, sec} from "../lib/time";

export type TimeStopProps = DeviceProps & {
  stop: number; // seconds: the world freezes
  centre?: [number, number]; // where the grey spreads from, clip px (your chest from body_prep.py); default your face
  dx?: number; // px you step out sideways (negative = to the left; default 420, so film yourself a little to one side)
};

const GREY = 7, OUT = 8, STEP = 12; // frames: the grey spreading, then the pause before you step, then the step

export const TimeStop: React.FC<TimeStopProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const from = p.startFrom ?? 0, s = sec(p.stop), dx = p.dx ?? 420;
  const c = onScreen(framing, p.centre ? {x: p.centre[0], y: p.centre[1]} : face);
  const r = clamp(f, s, s + GREY, 0, 2300, Easing.in(Easing.quad));
  const step = clamp(f, s + OUT, s + OUT + STEP, 0, 1, Easing.inOut(Easing.cubic));
  return (
    <DeviceShell p={p} words={words} face={face}>
      {f < s ? <Footage src={p.footage} framing={framing} startFrom={from} /> : <>
        <HeldFootage src={p.footage} at={from + p.stop} framing={framing} />
        <div style={{position: "absolute", inset: 0, clipPath: `circle(${r}px at ${c.x}px ${c.y}px)`, filter: "grayscale(1) contrast(1.06) brightness(0.96)"}}>
          <HeldFootage src={p.footage} at={from + p.stop} framing={framing} />
        </div>
        {hasCutout(p.footage, p.cutout) && f >= s + OUT && (
          <CutoutFrom src={p.footage} cutout={p.cutout} from={s + OUT} at={from + p.stop + OUT / 30} framing={framing}
            style={{transform: `translateX(${dx * step}px)`, filter: `drop-shadow(0 12px 18px rgba(0,0,0,${0.35 * step}))`}} />
        )}
      </>}
    </DeviceShell>
  );
};
