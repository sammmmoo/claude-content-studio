// CLONE ME: from `enter`, copies of you step in beside you, each a beat behind (same depth, same moves, a little late).
// Each copy is your cut-out shifted `dx` px, appearing `delay` s after `enter` and playing `delay` s behind you; you stay
// in front. Film yourself to one side so the copies have room. Without a cut-out: three windows of the clip side by side,
// centred on your face, the outer two a beat behind.
import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, Framing, Point, hasCutout} from "../lib/Footage";
import {W, sec} from "../lib/time";

export type CloneMeProps = DeviceProps & {
  enter: number; // seconds: the copies start
  copies?: {dx: number; delay: number}[]; // px to the right (negative = left) and seconds behind you
};

const COPIES = [{dx: 560, delay: 0.43}, {dx: 280, delay: 0.23}];
const WIN = 352, GAP = 12; // three windows across 1080 px

const Window: React.FC<{i: number; src: string | null; framing: Framing; face: Point; startFrom?: number}> = ({i, src, framing, face, startFrom}) => (
  <div style={{position: "absolute", left: i * (WIN + GAP), top: 0, width: WIN, height: 1920, overflow: "hidden"}}>
    <div style={{position: "absolute", left: WIN / 2 - face.x, top: 0, width: W, height: 1920}}>
      <Footage src={src} framing={framing} startFrom={startFrom} />
    </div>
  </div>
);

export const CloneMe: React.FC<CloneMeProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const at = sec(p.enter), copies = p.copies ?? COPIES, from = p.startFrom ?? 0;
  const late = (d: number) => Math.round(at + sec(d));
  if (!hasCutout(p.footage, p.cutout)) {
    const outer = copies.length ? Math.max(...copies.map((c) => c.delay)) : 0.3;
    return (
      <DeviceShell p={p} words={words} face={face}>
        {f < at ? <Footage src={p.footage} framing={framing} startFrom={from} /> : (
          <AbsoluteFill style={{background: "#101012"}}>
            {[0, 2].map((i) => (
              <Sequence key={i} from={late(outer)} layout="none">
                <Window i={i} src={p.footage} framing={framing} face={face} startFrom={from + p.enter} />
              </Sequence>
            ))}
            <Window i={1} src={p.footage} framing={framing} face={face} startFrom={from} />
          </AbsoluteFill>
        )}
      </DeviceShell>
    );
  }
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={from} />
      {copies.map((c) => (
        <Sequence key={`${c.dx}-${c.delay}`} from={late(c.delay)} layout="none">
          <AbsoluteFill style={{transform: `translateX(${c.dx}px)`}}>
            <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={from + p.enter} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={from} />
    </DeviceShell>
  );
};
