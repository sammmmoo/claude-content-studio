// TELEPORT: you jump from one spot to another on a cut, with the glitch (RGB split, slices, a stutter, scanlines) on every
// jump. Film it locked off and move to a new spot between takes (or cut the walk out). Run scripts/teleport_prep.py and pass
// its plate and from/to points: then the frames either side of each jump also show you sliding across the room over the
// empty background, three ghosts trailing. Without a plate (a hand-held clip, no cut-out) each jump is the glitch alone.
import React from "react";
import {AbsoluteFill, Easing, Sequence} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, FootageStill, Framing} from "../lib/Footage";
import {GlitchV2} from "../house/transitions";
import {sec} from "../lib/time";

type XY = [number, number];
export type Jump = {at: number; from?: XY; to?: XY}; // at = seconds, the first frame at the new spot
export type TeleportProps = DeviceProps & {
  jumps: Jump[]; // one per jump cut; from/to (px, where you stand before and after) come from teleport_prep.py
  plate?: string | null; // the clean plate from teleport_prep.py ("footage/take-plate.png")
  glitch?: boolean; // the glitch on every jump (default true)
};

const GHOSTS = [0.45, 0.25, 0.12]; // trailing copies, nearest first
const TRAVEL = [-2, -1, 0, 1]; // the travel frames around each jump
const ease = Easing.inOut(Easing.quad);
const along = (dd: number) => ease(Math.min(1, Math.max(0, (dd + 3) / 5)));

// dd frames from the jump, at local frame 0 of a 1-frame Sequence: the plate, then you (the old take's cut-out before the
// cut, the new take's after) part way from `from` to `to`, ghosts behind you.
const Travel: React.FC<{p: TeleportProps; j: Required<Jump>; dd: number; sf: number; framing: Framing}> = ({p, j, dd, sf, framing}) => {
  const anchor = dd < 0 ? j.from : j.to;
  const you = (k: number, opacity: number, key: string) => {
    const x = j.from[0] + (j.to[0] - j.from[0]) * k, y = j.from[1] + (j.to[1] - j.from[1]) * k;
    return (
      <AbsoluteFill key={key} style={{opacity, transform: `translate(${(x - anchor[0]) * framing.s}px, ${(y - anchor[1]) * framing.s}px)`}}>
        <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={sf / 30} exact />
      </AbsoluteFill>
    );
  };
  return (
    <AbsoluteFill>
      <FootageStill src={p.plate as string} framing={framing} />
      {GHOSTS.map((o, i) => you(along(dd - 0.5 * (i + 1)), o, `ghost${i}`))}
      {you(along(dd), 1, "you")}
    </AbsoluteFill>
  );
};

export const Teleport: React.FC<TeleportProps> = (p) => {
  const {face, framing, words} = useDevice(p);
  const s0 = sec(p.startFrom ?? 0);
  const travels = (j: Jump): j is Required<Jump> => !!(p.plate && p.footage && p.cutout && j.from && j.to);
  const picture = (j: Jump) => (dd: number) => {
    const sf = Math.max(0, sec(j.at) + s0 + dd);
    return travels(j) && dd <= 1
      ? <Travel p={p} j={j} dd={dd} sf={sf} framing={framing} />
      : <Footage src={p.footage} framing={framing} startFrom={sf / 30} />;
  };
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} />
      {p.jumps.filter(travels).map((j) => TRAVEL.filter((dd) => sec(j.at) + dd >= 0).map((dd) => (
        <Sequence key={`${j.at}:${dd}`} from={sec(j.at) + dd} durationInFrames={1} layout="none">{picture(j)(dd)}</Sequence>
      )))}
      {p.glitch !== false && p.jumps.map((j) => <GlitchV2 key={j.at} at={sec(j.at)} picture={picture(j)} rgb stutter scan />)}
    </DeviceShell>
  );
};
