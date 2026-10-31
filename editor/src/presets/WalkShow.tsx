// PRESET 5, WALK & SHOW (inspired by Mino Lee). Handheld selfie, often a new spot for each point. Captions 1-3 words,
// white bold with a thin dark outline, small, centred mid-frame, yellow on money and time. A "POV:" line at the top on
// story videos (the red hook block). Very light graphics: real screen cards held 1-2 seconds, on and off on a hard frame.
// Your cuts get the house transitions (flash, zoom, leak, glitch).
import React from "react";
import {AbsoluteFill} from "remotion";
import {OPEN, PresetProps, usePreset} from "./common";
import {Captions} from "../house/Captions";
import {HookBlock} from "../house/HookBlock";
import {ZoomOutOpener} from "../house/Opener";
import {CutGlitch, CutOverlay, cutZoom} from "../house/transitions";
import {ScreenCard} from "../objects/cards";
import {Footage, scaleAbout, FootageAudio} from "../lib/Footage";
import {sec} from "../lib/time";

export type WalkShowProps = PresetProps & {
  pov?: {lines: string[]; until: number};
  cards?: {from: number; to: number; image?: string | null; title?: string; top?: number}[];
  captionY?: number;
};

export const WalkShow: React.FC<WalkShowProps> = (p) => {
  const {f, face, framing, words} = usePreset(p);
  const cuts = p.cuts ?? [];
  const z = cutZoom(f, cuts);
  const card = (p.cards ?? []).find((c) => f >= sec(c.from) && f < sec(c.to));
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={face} frames={OPEN}>
        <AbsoluteFill style={{filter: z.blur ? `blur(${z.blur}px)` : undefined}}>
          <Footage src={p.footage} framing={scaleAbout(framing, z.s, face)} startFrom={p.startFrom} />
          <CutGlitch cuts={cuts} src={p.footage} startFrom={p.startFrom} />
        </AbsoluteFill>
      </ZoomOutOpener>
      {card && <ScreenCard image={card.image} title={card.title} top={card.top ?? 420} />}
      {p.pov && <HookBlock f={f} lines={p.pov.lines} style="outline" until={sec(p.pov.until)} top={294} size={62} />}
      <Captions f={f} words={words} style="outline" y={p.captionY ?? 1180} maxChars={16} yellow={p.highlight} bold={p.bold} />
      <CutOverlay f={f} cuts={cuts} />
    </AbsoluteFill>
  );
};
