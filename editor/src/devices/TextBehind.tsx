// TEXT BEHIND YOU: one big word set behind your head, so you stand in front of it. It rises in at `enter` and stays.
// Orange-red on purpose: white and pale colours vanish against a bright wall or sky. Without a cut-out the word sits in
// front of you instead (still readable, just not behind).
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, hasCutout} from "../lib/Footage";
import {FONT} from "../lib/fonts";
import {W, clamp, sec} from "../lib/time";

export type TextBehindProps = DeviceProps & {
  text: string; // one short word works best ("CLAUDE")
  enter: number; // seconds: the word rises in
  color?: string; // default #E2552B
  top?: number; // px from the top of the frame to the top of the word; put it where your head overlaps its lower half
  size?: number; // font size in px before the tall stretch (default 318, about full width for six capitals)
};

export const TextBehind: React.FC<TextBehindProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const at = sec(p.enter), size = p.size ?? 318;
  const u = clamp(f, at, at + 8, 0, 1, Easing.out(Easing.cubic));
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} />
      {f >= at && (
        <AbsoluteFill style={{opacity: u}}>
          <div style={{position: "absolute", left: 0, top: (p.top ?? 820) + 40 * (1 - u), width: W, display: "flex", justifyContent: "center"}}>
            <div style={{fontFamily: FONT.inter, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -0.019 * size, color: p.color ?? "#E2552B",
              transform: "scale(0.86, 1.32)", transformOrigin: "50% 0%", whiteSpace: "nowrap"}}>{p.text}</div>
          </div>
        </AbsoluteFill>
      )}
      {hasCutout(p.footage, p.cutout) && <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={p.startFrom} />}
    </DeviceShell>
  );
};
