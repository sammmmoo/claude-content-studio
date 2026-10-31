// PYRAMID: for any 3-level framework. One triangle appears above your head, split into bands; each band lights up in the
// accent and labels itself as you say that step (the one before settles to light grey), and the camera pushes in slowly
// as it builds. A band with `reveal` lights as "n · ?" (an open loop) and flips to its words on the payoff. An optional
// capstone completes the shape. A caption that repeats a band's words is held back while that band lands.
import React from "react";
import {AbsoluteFill} from "remotion";
import {DeviceProps, useDevice} from "./shell";
import {Captions} from "../house/Captions";
import {HookBlock} from "../house/HookBlock";
import {ZoomOutOpener} from "../house/Opener";
import {Footage, FootageAudio} from "../lib/Footage";
import {FONT} from "../lib/fonts";
import {C} from "../lib/tokens";
import {clamp, enter, sec} from "../lib/time";
import {Page, norm} from "../lib/words";

export type Tier = {label: string; at: number; reveal?: number}; // seconds; bottom band first
export type PyramidProps = DeviceProps & {
  tiers: Tier[];
  appear: number; // seconds: the empty triangle appears
  cap?: number; // seconds: the capstone settles
  baseY?: number; // px: bottom of the base band
  push?: number; // how far the camera pushes in by the last band (0.06 = 6%)
};

const SMALL = new Set(["it", "you", "the", "a", "an", "to", "of", "and"]);
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixColor = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};

export const Pyramid: React.FC<PyramidProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const tiers = p.tiers.map((t) => ({...t, on: sec(t.at), rev: t.reveal !== undefined ? sec(t.reveal) : undefined}));
  const cx = 540, baseY = p.baseY ?? 820, baseW = 960, topW = 560, tierH = 130, gap = 10, fontSize = 60;
  const total = tiers.length * tierH + (tiers.length - 1) * gap;
  const widthAt = (y: number) => baseW - ((baseW - topW) * (baseY - y)) / total;
  const appear = sec(p.appear);
  const capAt = p.cap !== undefined ? sec(p.cap) : undefined;
  const pushK = 1 + (p.push ?? 0.06) * clamp(f, tiers[0]?.on ?? 0, capAt ?? tiers[tiers.length - 1]?.on ?? 1);
  const shownAt = (t: (typeof tiers)[number]) => t.rev ?? t.on;
  const repeatsBand = (pg: Page) => tiers.some((t) => pg.on >= shownAt(t) - 3 && pg.on <= shownAt(t) + 45 &&
    pg.words.some((w) => !SMALL.has(norm(w.w)) && t.label.split(/\s+/).map(norm).includes(norm(w.w))));
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={face} frames={12}>
        <AbsoluteFill style={{transform: `scale(${pushK})`, transformOrigin: `${cx}px ${baseY - total / 2}px`}}>
          <Footage src={p.footage} framing={framing} startFrom={p.startFrom} />
          {f >= appear && tiers.map((t, k) => {
            const bottom = baseY - k * (tierH + gap), top = bottom - tierH;
            const wb = widthAt(bottom), wt = widthAt(top), inset = (wb - wt) / 2;
            const lit = clamp(f, t.on, t.on + 4);
            const next = tiers[k + 1]?.on ?? capAt;
            const settle = next !== undefined ? clamp(f, next, next + 6) : 0;
            const fill = lit <= 0 ? "rgba(255,255,255,0.10)" : settle > 0 ? mixColor(C.accent, C.light, settle) : C.accent;
            const onAccent = lit > 0 && settle < 0.5;
            const flip = t.rev !== undefined ? Math.abs(1 - 2 * clamp(f, t.rev - 4, t.rev + 4)) : 1;
            return (
              <div key={k} style={{position: "absolute", left: cx - wb / 2, top, width: wb, height: tierH, ...enter(f, appear + k * 2, 7, 16, 0.96),
                filter: lit > 0 ? "drop-shadow(0 18px 30px rgba(0,0,0,0.45))" : undefined}}>
                <div style={{position: "absolute", inset: 0, backgroundColor: fill, clipPath: `polygon(${inset}px 0, ${wb - inset}px 0, ${wb}px 100%, 0 100%)`,
                  border: lit <= 0 ? "none" : undefined}} />
                {lit > 0 && (
                  <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.inter, fontWeight: 900,
                    fontSize, letterSpacing: "-0.03em", lineHeight: 1, whiteSpace: "nowrap", opacity: lit}}>
                    <span style={{color: onAccent ? "#fff" : C.accent}}>{k + 1}</span>
                    <span style={{color: onAccent ? "rgba(255,255,255,0.75)" : "#9B9A97", margin: "0 0.3em"}}>·</span>
                    <span style={{display: "inline-block", color: onAccent ? "#fff" : C.ink, transform: `scaleY(${flip})`}}>{t.rev !== undefined && f < t.rev ? "?" : t.label}</span>
                  </div>
                )}
              </div>
            );
          })}
          {capAt !== undefined && f >= capAt - 3 && (() => {
            const w = 360, h = 106, bottom = baseY - total - 8;
            const u = clamp(f, capAt - 3, capAt + 5);
            return <div style={{position: "absolute", left: cx - w / 2, top: bottom - h, width: w, height: h, backgroundColor: C.accent, clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              transform: `translateY(${-(1 - u) * 150}px)`, opacity: clamp(f, capAt - 3, capAt - 1), filter: "drop-shadow(0 14px 24px rgba(0,0,0,0.45))"}} />;
          })()}
        </AbsoluteFill>
      </ZoomOutOpener>
      <HookBlock f={f} style="punchy" until={sec(p.hook.until)} exit="rise" top={294} lines={[{text: p.hook.top, size: 70}, {text: p.hook.main, size: 100}]} />
      <Captions f={f} words={words} style="punchy" y={1290} yellow={p.highlight} hidePage={repeatsBand} />
    </AbsoluteFill>
  );
};
