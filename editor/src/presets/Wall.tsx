// PRESET 1, WALL (inspired by Kallaway). Graphics live on a long dark wall; you sit in a rounded window at the bottom with
// your head breaking over its top edge (needs a cut-out; without one the window just shows your clip). On the first word
// of each new idea the camera glides to the next station. One object per station builds in place:
//   headline  1-3 big words, an accent word on a block
//   bars      label bars with number chips; the bar in focus lights its chip
//   reveal    a numbered list, labels blurred until each is said
//   phone     an iPhone in Messages sending a text, tagged EXAMPLE (the conversation is made up)
//   number    one big figure in a box that lights up
import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {OPEN, PresetProps, usePreset} from "./common";
import {Captions} from "../house/Captions";
import {HookBlock} from "../house/HookBlock";
import {ZoomOutOpener} from "../house/Opener";
import {IPhone, Item} from "../objects/IPhone";
import {Cam, LabelBars, Move, NumberBox, Panel, RevealList, Tag, WallGround, WallHeadline, WallLayer, camAt, home} from "../objects/wall";
import {Cutout, Footage, Framing, hasCutout, scaleAbout, FootageAudio} from "../lib/Footage";
import {sec} from "../lib/time";

export type Station =
  | {kind: "headline"; at: number; text: string; accent?: string}
  | {kind: "bars"; at: number; items: {label: string; at: number; focus?: number}[]}
  | {kind: "reveal"; at: number; title?: string; items: {text: string; at: number}[]}
  | {kind: "phone"; at: number; contact?: string; messages: {side: "in" | "out"; lines: string[]; at: number; typingFrom?: number}[]; example?: boolean}
  | {kind: "number"; at: number; value: string; caption?: string; litAt?: number};

export type WallProps = PresetProps & {
  cutout?: string | null;
  hook: {lines: string[]; until: number};
  stations: Station[]; // `at` = seconds the camera starts gliding there (the first station is where it starts)
};

const WIN = {x: 60, y: 1190, w: 960, h: 690, r: 34};
const GLIDE = 18; // frames
const spot = (i: number): [number, number] => [i * 1240, i % 2 ? -360 : 0];

const StationView: React.FC<{s: Station; f: number}> = ({s, f}) => {
  const a = sec(s.at) + (s.kind === "headline" ? 4 : 10);
  if (s.kind === "headline") return <WallHeadline f={f} at={a} text={s.text} accent={s.accent} />;
  if (s.kind === "bars") return <LabelBars f={f} top={330} items={s.items.map((it) => ({label: it.label, at: sec(it.at), focus: it.focus !== undefined ? sec(it.focus) : undefined}))} />;
  if (s.kind === "reveal") return <RevealList f={f} top={360} title={s.title} items={s.items.map((it) => ({text: it.text, at: sec(it.at)}))} />;
  if (s.kind === "number") return <NumberBox f={f} at={a} x={540} y={640} n={s.value} caption={s.caption} litAt={s.litAt !== undefined ? sec(s.litAt) : undefined} />;
  const items: Item[] = s.messages.map((m) => ({side: m.side, lines: m.lines, at: sec(m.at), typingFrom: m.typingFrom !== undefined ? sec(m.typingFrom) : undefined}));
  return (
    <>
      <IPhone f={f} cam={{s: 0.33, fx: 207, fy: 443, sx: 540, sy: 640}} items={items} name={s.contact ?? "Customer"} initials={(s.contact ?? "C").slice(0, 1).toUpperCase()} />
      {s.example !== false && <Tag text="EXAMPLE" tone="accent" style={{left: 736, top: 300}} />}
    </>
  );
};

export const Wall: React.FC<WallProps> = (p) => {
  const {face, words, k} = usePreset(p);
  const f = useCurrentFrame();
  const s = 0.92; // your clip's scale inside the window
  const headTop = face.y - 210;
  const rest: Framing = {s, ox: Math.min(WIN.x, Math.max(WIN.x + WIN.w - 1080 * s, 540 - face.x * s)), oy: WIN.y - 70 - headTop * s};
  const faceOnScreen = {x: rest.ox + face.x * s, y: rest.oy + face.y * s};
  const plate = scaleAbout(rest, k, faceOnScreen);
  const start: Cam = home(...spot(0));
  const moves: Move[] = p.stations.slice(1).map((st, i) => ({a: sec(st.at), b: sec(st.at) + GLIDE, to: home(...spot(i + 1))}));
  const cam = camAt(start, moves, f);
  const cut = hasCutout(p.footage, p.cutout);
  return (
    <AbsoluteFill style={{backgroundColor: "#0B0B0D"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={faceOnScreen} frames={OPEN} background="#0B0B0D">
        <WallGround cam={cam} />
        <WallLayer cam={cam}>
          {p.stations.map((st, i) => <Panel key={i} at={spot(i)}><StationView s={st} f={f} /></Panel>)}
        </WallLayer>
        <div style={{position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: WIN.r, overflow: "hidden", backgroundColor: "#000",
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.07), 0 -20px 60px rgba(0,0,0,0.5)"}}>
          <div style={{position: "absolute", left: -WIN.x, top: -WIN.y, width: 1080, height: 1920}}>
            <Footage src={p.footage} framing={plate} startFrom={p.startFrom} />
          </div>
        </div>
        {cut && (
          <div style={{position: "absolute", inset: 0, clipPath: `inset(0 0 ${1920 - WIN.y}px 0)`}}>
            <Cutout src={p.footage} cutout={p.cutout} framing={plate} startFrom={p.startFrom} />
          </div>
        )}
      </ZoomOutOpener>
      <HookBlock f={f} style="punchy" lines={p.hook.lines} until={sec(p.hook.until)} exit="rise" top={294} size={84} />
      <Captions f={f} words={words} style="punchy" size={66} y={1060} yellow={p.highlight} bold={p.bold} />
    </AbsoluteFill>
  );
};
