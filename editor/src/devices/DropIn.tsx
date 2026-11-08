// DROP IN: the room is empty, then you fall in from above the frame and land on your spot at `land`: a dust puff at your
// feet and a short shake, and the clip plays on. Needs the clean plate (the empty room) and your cut-out; body_prep.py gives
// both, and `feet` (where you stand at `land`). Without a plate the room is dark until you land.
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Footage, FootageStill} from "../lib/Footage";
import {HeldCutout, Puff, shake} from "../lib/body";
import {clamp, lin, sec} from "../lib/time";

export type DropInProps = DeviceProps & {
  land: number; // seconds: your feet touch down (pick a frame where you're standing still)
  feet: [number, number]; // where your feet are at `land`, clip px (body_prep.py)
  plate?: string | null; // the room without you (body_prep.py)
  fall?: number; // frames the fall takes (default 12)
};

const TRAIL = [0.5, 0.25]; // trailing copies' opacity

export const DropIn: React.FC<DropInProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const from = p.startFrom ?? 0, L = sec(p.land), fall = p.fall ?? 12, [fx, fy] = p.feet;
  const room = p.plate ? <FootageStill src={p.plate} framing={framing} /> : <AbsoluteFill style={{background: "#141518"}} />;
  const dropY = (k: number) => -(fy + 160) * framing.s * (1 - Math.pow(Math.min(1, Math.max(0, k)), 2));
  const k = (f - (L - fall)) / fall;
  const jolt = shake(lin(f, L, L + 10));
  return (
    <DeviceShell p={p} words={words} face={face}>
      <AbsoluteFill style={{transform: `translateY(${jolt}px) scale(${f >= L && f < L + 10 ? 1.035 : 1})`}}>
        {f < L ? <>
          {room}
          {f >= L - fall && TRAIL.map((o, i) => (
            <HeldCutout key={i} src={p.footage} cutout={p.cutout} at={from + p.land} framing={framing}
              style={{opacity: o, transform: `translateY(${dropY(k - 0.18 * (i + 1))}px)`}} />
          ))}
          {f >= L - fall && <HeldCutout src={p.footage} cutout={p.cutout} at={from + p.land} framing={framing}
            style={{transform: `translateY(${dropY(k)}px)`}} />}
        </> : <Footage src={p.footage} framing={framing} startFrom={from} />}
        <Puff at={{x: fx, y: fy}} p={clamp(f, L, L + 18, 0, 1, Easing.out(Easing.quad))} framing={framing} />
      </AbsoluteFill>
    </DeviceShell>
  );
};
