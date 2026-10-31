// PRESET 2, TOP CARD (inspired by Nick Saraev). The graphic owns the top two-thirds on paper; you sit in the bottom third,
// one locked camera. Frame 0: a title card builds word by word, the key phrase boxed in the accent. Then a new graphic
// every 2-3 seconds, mostly real browser screenshots with the key sentence highlighted. Captions 1-2 words just above your
// head, in ink on the paper. For the call to action, a hard cut to a full-face punch-in with the keyword highlighted.
import React from "react";
import {AbsoluteFill} from "remotion";
import {OPEN, PresetProps, usePreset} from "./common";
import {Captions} from "../house/Captions";
import {ZoomOutOpener} from "../house/Opener";
import {BrowserCard, Highlight, TitleCard} from "../objects/cards";
import {FULL, Footage, Framing, scaleAbout, FootageAudio} from "../lib/Footage";
import {C} from "../lib/tokens";
import {sec} from "../lib/time";

export type TopCardProps = PresetProps & {
  title: {lines: string[]; box: string; until: number}; // the frame-0 title; leaves at `until` seconds
  cards: {from: number; to: number; url?: string; image?: string | null; highlight?: Highlight; hiAt?: number}[];
  cta?: {at: number; keyword: string};
  videoTop?: number; // px: where your window starts (bottom third)
};

export const TopCard: React.FC<TopCardProps> = (p) => {
  const {f, face, words, k} = usePreset(p);
  const top = p.videoTop ?? 1280;
  // your face lands in the middle of the window, clip at 75%
  const s = 0.75;
  const faceAt = {x: 540, y: top + (1920 - top) * 0.5};
  const rest: Framing = {s, ox: faceAt.x - face.x * s, oy: faceAt.y - face.y * s};
  const marks = {yellow: p.highlight, bold: p.bold};
  if (p.cta && f >= sec(p.cta.at)) {
    return (
      <AbsoluteFill style={{backgroundColor: "#000"}}>
        <FootageAudio src={p.footage} startFrom={p.startFrom} />
        <Footage src={p.footage} framing={scaleAbout(FULL, 1.3 * k, face)} startFrom={p.startFrom} />
        <Captions f={f} words={words} style="clean" y={1440} breakBefore={[p.cta.keyword]} yellow={[...(p.highlight ?? []), p.cta.keyword]} bold={p.bold} />
      </AbsoluteFill>
    );
  }
  const card = f >= sec(p.title.until) ? p.cards.find((c) => f >= sec(c.from) && f < sec(c.to)) : undefined;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={faceAt} frames={OPEN} background={C.paper}>
        <div style={{position: "absolute", left: 0, top, width: 1080, height: 1920 - top, overflow: "hidden"}}>
          <div style={{position: "absolute", left: 0, top: -top, width: 1080, height: 1920}}>
            <Footage src={p.footage} framing={scaleAbout(rest, k, faceAt)} startFrom={p.startFrom} />
          </div>
        </div>
      </ZoomOutOpener>
      {f < sec(p.title.until) && <TitleCard f={f} lines={p.title.lines} box={p.title.box} top={470} />}
      {card && <BrowserCard f={f} x={70} y={290} w={940} h={820} url={card.url} image={card.image} highlight={card.highlight} hiAt={sec(card.hiAt ?? card.from + 0.3)} />}
      <Captions f={f} words={words} style="clean" size={64} y={1140} anchor="top" ground="light" maxChars={12} {...marks} />
    </AbsoluteFill>
  );
};
