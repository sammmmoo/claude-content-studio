// FILM GRADE: a before/after wipe. From `enter` a white line slides from right to left: flat on its left, the film look
// on its right (more contrast, a touch of warmth, a soft vignette), until the whole clip is graded. BEFORE and AFTER pills
// label the two sides. Needs no cut-out.
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Footage, Framing} from "../lib/Footage";
import {FONT} from "../lib/fonts";
import {W, clamp, lin, sec} from "../lib/time";

export type FilmGradeProps = DeviceProps & {
  enter: number; // seconds: the wipe starts
  wipe?: number; // seconds the line takes to cross (default 1.27)
  labelsTop?: number; // px from the top for the BEFORE / AFTER pills (default 660; keep them off your face)
};

const FLAT = "contrast(0.74) saturate(0.5) brightness(1.1)";
const FILM = "contrast(1.14) saturate(1.06) sepia(0.14) brightness(0.97)";

const Pill: React.FC<{t: string; on: boolean; style: React.CSSProperties}> = ({t, on, style}) => (
  <div style={{position: "absolute", padding: "8px 18px", borderRadius: 14, fontFamily: FONT.inter, fontWeight: 700, fontSize: 26, letterSpacing: 2,
    background: on ? "#FFC233" : "rgba(255,255,255,0.9)", color: "#101012", ...style}}>{t}</div>
);

const Graded: React.FC<{src: string | null; framing: Framing; startFrom?: number}> = ({src, framing, startFrom}) => (
  <>
    <AbsoluteFill style={{filter: FILM}}><Footage src={src} framing={framing} startFrom={startFrom} /></AbsoluteFill>
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,6,0,0.42) 100%)"}} />
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(255,150,60,0.07), rgba(0,60,80,0.08))", mixBlendMode: "overlay"}} />
  </>
);

export const FilmGrade: React.FC<FilmGradeProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const at = sec(p.enter), dur = Math.max(1, sec(p.wipe ?? 1.27)), top = p.labelsTop ?? 660;
  const x = clamp(f, at, at + dur, W - 80, 0, Easing.inOut(Easing.cubic));
  return (
    <DeviceShell p={p} words={words} face={face}>
      {f < at ? <Footage src={p.footage} framing={framing} startFrom={p.startFrom} /> : (
        <>
          <Graded src={p.footage} framing={framing} startFrom={p.startFrom} />
          <AbsoluteFill style={{clipPath: `inset(0 ${W - x}px 0 0)`}}>
            <AbsoluteFill style={{filter: FLAT}}><Footage src={p.footage} framing={framing} startFrom={p.startFrom} /></AbsoluteFill>
          </AbsoluteFill>
          {x > 2 && <div style={{position: "absolute", left: x - 2, top: 0, width: 4, height: 1920, background: "#FFFFFF", boxShadow: "0 0 14px rgba(0,0,0,0.5)"}} />}
          <Pill t="BEFORE" on={false} style={{left: 140, top, opacity: lin(x, 60, 240)}} />
          <Pill t="AFTER" on style={{right: 140, top}} />
        </>
      )}
    </DeviceShell>
  );
};
