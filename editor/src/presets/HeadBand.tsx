// PRESET 3, HEAD BAND (inspired by Nate Herk). You fill the lower 60-65% of the frame; a graphic band runs across the top
// 30-35%. Captions: 2-3 white capital words at the seam, the key word green, negatives red. A new screenshot, card or word
// in the band every 1.5-3 seconds by hard swap; a list item can go full screen on a white card ("#3 ..."). Full-face
// punch-ins on the point; transitions on your cuts. Busy at the top end (5-8 cuts per 10 s): start slower.
import React from "react";
import {AbsoluteFill} from "remotion";
import {OPEN, PresetProps, usePreset} from "./common";
import {Captions} from "../house/Captions";
import {HookBlock} from "../house/HookBlock";
import {ZoomOutOpener} from "../house/Opener";
import {CutGlitch, CutOverlay, cutZoom} from "../house/transitions";
import {BrowserCard, ListCard} from "../objects/cards";
import {Footage, scaleAbout, FootageAudio} from "../lib/Footage";
import {FONT} from "../lib/fonts";
import {C} from "../lib/tokens";
import {Span, inSpan, sec} from "../lib/time";

export type BandItem = {from: number; to: number; text?: string; image?: string | null; url?: string};
export type HeadBandProps = PresetProps & {
  hook: {lines: string[]; until: number};
  band: BandItem[]; // `text` = a big word or two on the band; otherwise a browser card with `image`
  listCards?: {from: number; to: number; n: number; text: string; sub?: string}[];
  punchIns?: Span[];
  red?: string[]; // negative words, shown red
  bandH?: number;
};

export const HeadBand: React.FC<HeadBandProps> = (p) => {
  const {f, face, framing, words} = usePreset(p);
  const bandH = p.bandH ?? 650;
  const cuts = p.cuts ?? [];
  const z = cutZoom(f, cuts);
  const punch = inSpan(p.punchIns, f);
  const fr = scaleAbout(framing, (punch ? 1.3 : 1) * z.s, face);
  const item = f >= sec(p.hook.until) ? p.band.find((b) => f >= sec(b.from) && f < sec(b.to)) : undefined;
  const list = (p.listCards ?? []).find((c) => f >= sec(c.from) && f < sec(c.to));
  const marks = {yellow: p.highlight, bold: p.bold, red: p.red};
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={face} frames={OPEN}>
        <AbsoluteFill style={{filter: z.blur ? `blur(${z.blur}px)` : undefined}}>
          <Footage src={p.footage} framing={fr} startFrom={p.startFrom} />
          <CutGlitch cuts={cuts} src={p.footage} startFrom={p.startFrom} />
        </AbsoluteFill>
      </ZoomOutOpener>
      {!punch && (
        <div style={{position: "absolute", left: 0, top: 0, width: 1080, height: bandH, background: C.navy,
          backgroundImage: "linear-gradient(rgba(103,150,253,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(103,150,253,0.07) 2px, transparent 2px)",
          backgroundSize: "54px 54px", boxShadow: "0 10px 40px rgba(0,0,0,0.45)"}}>
          <HookBlock f={f} lines={p.hook.lines} style="caps" until={sec(p.hook.until)} top={300} size={74} />
          {item?.text && (
            <div style={{position: "absolute", left: 60, right: 60, top: 250, height: bandH - 300, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              fontFamily: FONT.montserrat, fontWeight: 900, fontSize: 110, lineHeight: 1.02, letterSpacing: "-0.03em", color: "#fff", textTransform: "uppercase"}}>{item.text}</div>
          )}
          {item && !item.text && <BrowserCard f={f} x={110} y={250} w={860} h={bandH - 290} url={item.url} image={item.image} />}
        </div>
      )}
      {list && <ListCard n={list.n} text={list.text} sub={list.sub} />}
      {!list && <Captions f={f} words={words} style="caps" y={punch ? 1400 : bandH + 40} anchor="top" size={70} maxChars={16} {...marks} />}
      <CutOverlay f={f} cuts={cuts} />
    </AbsoluteFill>
  );
};
