// What every device shares: the zoom-out opener on your face, the 5% breathe, the red hook block (rising exit) and the
// punchy captions at chest height. A device only draws its own object.
import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Captions} from "../house/Captions";
import {HookBlock} from "../house/HookBlock";
import {ZoomOutOpener} from "../house/Opener";
import {breathe} from "../house/breathe";
import {FULL, Framing, Point, STAND_IN_FACE, scaleAbout, FootageAudio} from "../lib/Footage";
import {sec} from "../lib/time";
import {SpokenWord, Word, toFrames} from "../lib/words";

export type DeviceProps = {
  footage: string | null; // "footage/take1.mp4" in public/, or null for the stand-in
  cutout?: string | null; // a WebM with alpha of the same clip (you, cut out)
  startFrom?: number; // seconds into the clip
  words: SpokenWord[]; // faster-whisper words
  hook: {top: string; main: string; until: number}; // two-line hook block; leaves at `until` seconds
  highlight?: string[]; // words for the one highlighted word per caption line
  face?: Point; // your face centre on screen
  durationInSeconds?: number;
};

const OPEN = 12;

export const useDevice = (p: DeviceProps) => {
  const f = useCurrentFrame();
  const face = p.face ?? STAND_IN_FACE;
  const framing: Framing = scaleAbout(FULL, f < OPEN ? 1 : breathe(f, OPEN), face);
  return {f, face, framing, words: toFrames(p.words)};
};

export const DeviceShell: React.FC<{p: DeviceProps; words: Word[]; face: Point; children: React.ReactNode; hideCaption?: (text: string, f: number) => boolean}> = ({p, words, face, children}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={face} frames={OPEN}>{children}</ZoomOutOpener>
      <HookBlock f={f} style="punchy" until={sec(p.hook.until)} exit="rise" top={294} lines={[{text: p.hook.top, size: 70}, {text: p.hook.main, size: 100}]} />
      <Captions f={f} words={words} style="punchy" y={1290} yellow={p.highlight} />
    </AbsoluteFill>
  );
};
