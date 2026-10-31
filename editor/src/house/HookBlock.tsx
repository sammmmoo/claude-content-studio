// The frame-0 text hook: ONE red block, white extra-bold text, top third, already complete on frame 0 (never typed or faded
// in, because frame 0 is the thumbnail). Lines can differ in size (a small kicker over a big line). It leaves on a hard
// cut (exit "cut") or rises and fades over 10 frames (exit "rise"). Yellow is never a hook colour.
import React from "react";
import {Easing} from "remotion";
import {CapStyle} from "./Captions";
import {FONT} from "../lib/fonts";
import {textWidth} from "../lib/metrics";
import {C} from "../lib/tokens";

export type HookLine = string | {text: string; size: number};
export type HookBlockProps = {
  f: number;
  lines: HookLine[];
  style?: CapStyle; // font family follows the caption look
  until: number; // frame it starts to leave
  exit?: "cut" | "rise";
  top?: number;
  size?: number;
  quotes?: boolean; // the viewer's question in quote marks (Red Box)
  maxWidth?: number;
};

const FAMILY = {
  montserrat: {family: FONT.montserrat, weight: 800, face: "montserrat-800", tracking: -0.02},
  tiktok: {family: FONT.tiktok, weight: 800, face: "tiktok-800", tracking: -0.02},
};

export const HookBlock: React.FC<HookBlockProps> = ({f, lines, style = "clean", until, exit = "cut", top = 300, size = 70, quotes = false, maxWidth = 1000}) => {
  if (exit === "cut" ? f >= until : f > until + 10) return null;
  const e = exit === "rise" ? Easing.in(Easing.cubic)(Math.min(1, Math.max(0, (f - until) / 10))) : 0;
  const fam = style === "punchy" || style === "outline" ? FAMILY.tiktok : FAMILY.montserrat;
  const items = lines.map((l, i) => {
    const raw = typeof l === "string" ? {text: l, size} : l;
    return {text: quotes ? `${i === 0 ? "“" : ""}${raw.text}${i === lines.length - 1 ? "”" : ""}` : raw.text, size: raw.size};
  });
  const padX = Math.round(Math.max(...items.map((l) => l.size)) * 0.42);
  const inner = maxWidth - padX * 2;
  return (
    <div style={{position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: 1 - e,
      transform: `translateY(${-60 * e}px)`, filter: e > 0 ? `blur(${6 * e}px)` : undefined}}>
      <div style={{background: C.hookRed, padding: `${Math.round(items[0].size * 0.22)}px ${padX}px ${Math.round(items[items.length - 1].size * 0.3)}px`,
        borderRadius: 16, boxShadow: "0 12px 34px rgba(0,0,0,0.32)", display: "flex", flexDirection: "column", alignItems: "center"}}>
        {items.map((l, i) => {
          const w = textWidth(l.text, fam.face, l.size, fam.tracking);
          const fs = w > inner ? Math.floor((l.size * inner) / w) : l.size;
          return (
            <div key={i} style={{fontFamily: fam.family, fontWeight: fam.weight, fontSize: fs, lineHeight: 1.12, letterSpacing: `${fam.tracking}em`, color: "#fff", whiteSpace: "nowrap"}}>
              {l.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};
