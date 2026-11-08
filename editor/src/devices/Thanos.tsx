// THANOS (also /vanish): at `snap` you turn to dust and blow away, the room stays empty, and if you give `back` (the first
// frame of a take where you're somewhere else) the dust flies back in and forms you there. The dust is your own pixels: a
// still of your cut-out from scripts/body_prep.py, over the clean plate it makes. Without the still and plate (the demo,
// or a clip you haven't prepped) you fade out in a drift instead.
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Footage, FootageStill} from "../lib/Footage";
import {Dust, HeldCutout} from "../lib/body";
import {clamp, sec} from "../lib/time";

export type ThanosProps = DeviceProps & {
  snap: number; // seconds: you start turning to dust
  still?: string | null; // PNG of your cut-out at `snap` (body_prep.py)
  plate?: string | null; // the room without you (body_prep.py)
  back?: number | null; // seconds: the first frame where you're back (a new take); leave it out and you stay gone
  backStill?: string | null; // PNG of your cut-out at `back` (body_prep.py)
  dir?: 1 | -1; // the dust blows to the right (1) or the left (-1)
};

const OUT = 24, IN = 15; // frames: the dust leaving, the dust arriving

export const Thanos: React.FC<ThanosProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const from = p.startFrom ?? 0, s = sec(p.snap), b = p.back != null ? sec(p.back) : null, dir = p.dir ?? 1;
  const room = p.plate ? <FootageStill src={p.plate} framing={framing} /> : <AbsoluteFill style={{background: "#141518"}} />;
  let pic: React.ReactNode;
  if (f < s || (b !== null && f >= b)) pic = <Footage src={p.footage} framing={framing} startFrom={from} />;
  else if (b !== null && f >= b - IN) {
    pic = <>{room}{p.backStill
      ? <Dust still={p.backStill} t0={b - IN} t1={b} mode="in" dir={dir} seed="back" framing={framing} />
      : <HeldCutout src={p.footage} cutout={p.cutout} at={from + p.back!} framing={framing} style={{opacity: clamp(f, b - IN, b)}} />}</>;
  } else if (f < s + OUT) {
    const q = clamp(f, s, s + OUT, 0, 1, Easing.in(Easing.quad));
    pic = <>{room}{p.still
      ? <Dust still={p.still} t0={s} t1={s + OUT} mode="out" dir={dir} seed="snap" framing={framing} />
      : <HeldCutout src={p.footage} cutout={p.cutout} at={from + p.snap} framing={framing}
          style={{opacity: 1 - q, transform: `translateX(${dir * 120 * q}px)`, filter: `blur(${10 * q}px) grayscale(${q})`}} />}</>;
  } else pic = room;
  return (
    <DeviceShell p={p} words={words} face={face}>
      {pic}
    </DeviceShell>
  );
};
