// Props every preset takes, and the frame-level state they all need.
import {useCurrentFrame} from "remotion";
import {breatheAt} from "../house/breathe";
import {Cut} from "../house/transitions";
import {FULL, Framing, Point, STAND_IN_FACE, scaleAbout} from "../lib/Footage";
import {sec} from "../lib/time";
import {SpokenWord, toFrames} from "../lib/words";

export type PresetProps = {
  footage: string | null; // "footage/take1.mp4" in public/, a URL, or null for the stand-in
  startFrom?: number; // seconds into the clip
  words: SpokenWord[]; // faster-whisper words: [{word, start, end}] in seconds
  face?: Point; // your face centre in the clip (1080x1920 pixels); the stand-in's by default
  highlight?: string[]; // words or phrases for the one highlighted word per caption line
  bold?: string[];
  beats?: number[]; // seconds where a new take or point starts: the breathe restarts there
  cuts?: Cut[]; // seconds + transition type, for presets that cut
  durationInSeconds?: number; // default: last word + 0.4 s
};

export const OPEN = 12; // opener length in frames

// Your clip, full frame, breathing 5% on each beat after the opener.
export const usePreset = (p: PresetProps) => {
  const f = useCurrentFrame();
  const face = p.face ?? STAND_IN_FACE;
  const beats = [OPEN, ...(p.beats ?? []).map(sec)];
  const k = f < OPEN ? 1 : breatheAt(f, beats);
  const framing: Framing = scaleAbout(FULL, k, face);
  return {f, face, framing, words: toFrames(p.words), k};
};
