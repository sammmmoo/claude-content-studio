// PORTAL: at `open` a black hole opens in the floor under you and you drop through it; it closes over the empty room. Give
// `rise` (the first frame of a take where you stand somewhere else) and `feet2` and you pop up out of a second hole there.
// Needs the clean plate and your cut-out (body_prep.py gives both, and the feet points).
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, FootageStill, Framing, onScreen} from "../lib/Footage";
import {HeldCutout, Hole} from "../lib/body";
import {H, clamp, sec} from "../lib/time";

export type PortalProps = DeviceProps & {
  open: number; // seconds: the hole opens under you
  feet: [number, number]; // your feet at `open`, clip px (body_prep.py)
  plate?: string | null; // the room without you (body_prep.py)
  height?: number; // your height in clip px (body_prep.py): how far you sink (default 1100)
  rise?: number | null; // seconds: the first frame where you're standing somewhere new; leave it out and you stay gone
  feet2?: [number, number] | null; // your feet at `rise`
};

const OPEN = 8, SINK = 12, CLOSE = 6; // frames

// Clip everything below the hole line (y in clip px), so you disappear into the floor.
const Above: React.FC<{y: number; framing: Framing; children: React.ReactNode}> = ({y, framing, children}) => {
  const ys = onScreen(framing, {x: 0, y}).y;
  return <AbsoluteFill style={{clipPath: `inset(0 0 ${Math.max(0, H - ys)}px 0)`}}>{children}</AbsoluteFill>;
};

export const Portal: React.FC<PortalProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const from = p.startFrom ?? 0, o = sec(p.open), ht = (p.height ?? 1100) * framing.s;
  const r = p.rise != null && p.feet2 ? sec(p.rise) : null;
  const at = {x: p.feet[0], y: p.feet[1]}, at2 = p.feet2 ? {x: p.feet2[0], y: p.feet2[1]} : at;
  const room = p.plate ? <FootageStill src={p.plate} framing={framing} /> : <AbsoluteFill style={{background: "#141518"}} />;
  let pic: React.ReactNode;
  if (f < o || (r !== null && f >= r)) {
    pic = <Footage src={p.footage} framing={framing} startFrom={from} />;
  } else if (f < o + OPEN) {
    pic = <>
      <Footage src={p.footage} framing={framing} startFrom={from} />
      <Hole at={at} open={clamp(f, o, o + OPEN, 0, 1, Easing.out(Easing.back(1.4)))} framing={framing} />
      <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={from} />
    </>;
  } else if (r !== null && f >= Math.max(r - OPEN - SINK, o + OPEN + SINK + CLOSE)) { // the second hole waits for the first to close
    const k = clamp(f, r - SINK, r, 0, 1, Easing.out(Easing.cubic));
    pic = <>
      {room}
      <Hole at={at2} open={clamp(f, r - OPEN - SINK, r - SINK, 0, 1, Easing.out(Easing.back(1.4))) * (1 - clamp(f, r - 4, r))} framing={framing} />
      {f >= r - SINK && <Above y={at2.y} framing={framing}>
        <HeldCutout src={p.footage} cutout={p.cutout} at={from + p.rise!} framing={framing} style={{transform: `translateY(${ht * (1 - k)}px)`}} />
      </Above>}
    </>;
  } else {
    const k = clamp(f, o + OPEN, o + OPEN + SINK, 0, 1, Easing.in(Easing.quad));
    pic = <>
      {room}
      <Hole at={at} open={1 - clamp(f, o + OPEN + SINK, o + OPEN + SINK + CLOSE)} framing={framing} />
      {f < o + OPEN + SINK && <Above y={at.y} framing={framing}>
        <HeldCutout src={p.footage} cutout={p.cutout} at={from + p.open + OPEN / 30} framing={framing} style={{transform: `translateY(${ht * k}px)`}} />
      </Above>}
    </>;
  }
  return <DeviceShell p={p} words={words} face={face}>{pic}</DeviceShell>;
};
