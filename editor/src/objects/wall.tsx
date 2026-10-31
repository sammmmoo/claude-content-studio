// The wall: every scene sits on one long dark wall and the camera glides along it on the first word of each new idea,
// while the hook, captions and your window stay still. One object per station that builds in place; black, white and grey
// plus one accent; 1-3 big words at a time; at least half the wall empty; one thing moving at once.
import React from "react";
import {AbsoluteFill, Easing} from "remotion";
import {FONT} from "../lib/fonts";
import {C} from "../lib/tokens";
import {clamp, enter, lin} from "../lib/time";

// ---- the camera ----------------------------------------------------------------------------------------------------
export const TRAVEL = Easing.bezier(0.45, 0.05, 0.25, 1); // ease in-out, half the distance ~40% into the move
export type Cam = {x: number; y: number; s: number};
export type Move = {a: number; b: number; to: Cam}; // frames a..b
export const ANCHOR = {x: 540, y: 640}; // the screen point the camera looks at (centre of the graphics area)
const mixN = (a: number, b: number, p: number) => a + (b - a) * p;

// The camera pose that frames a station placed at wall position (sx, sy) at 1:1.
export const home = (sx: number, sy: number): Cam => ({x: sx + ANCHOR.x, y: sy + ANCHOR.y, s: 1});

// Moves never overlap; each starts on its trigger frame. Scale eases exponentially so a pull-out reads as one zoom.
export const camAt = (start: Cam, moves: Move[], f: number): Cam => {
  let c = start;
  for (const m of moves) {
    if (f <= m.a) break;
    const p = clamp(f, m.a, m.b, 0, 1, TRAVEL);
    c = {x: mixN(c.x, m.to.x, p), y: mixN(c.y, m.to.y, p), s: c.s * Math.pow(m.to.s / c.s, p)};
  }
  return c;
};
const offset = (c: Cam) => ({tx: ANCHOR.x - c.x * c.s, ty: ANCHOR.y - c.y * c.s});

// The wall itself: a soft lift behind the graphics, a faint line grid that moves with the camera (so travel reads as
// travel) and dots on the crossings.
const GRID = 43;
export const WallGround: React.FC<{cam: Cam}> = ({cam}) => {
  const {tx, ty} = offset(cam);
  const g = GRID * cam.s;
  const line = "rgba(255,255,255,0.06)";
  return (
    <>
      <AbsoluteFill style={{background: "radial-gradient(ellipse 820px 1000px at 540px 640px, #1C1C20 0%, #16161A 50%, #0B0B0D 100%)"}} />
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
        backgroundSize: `${g}px ${g}px`, backgroundPosition: `${tx - 1}px ${ty - 1}px`}} />
      <AbsoluteFill style={{backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 2.4px, transparent 3px)",
        backgroundSize: `${g}px ${g}px`, backgroundPosition: `${tx - g / 2}px ${ty - g / 2}px`}} />
    </>
  );
};
export const WallLayer: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => {
  const {tx, ty} = offset(cam);
  return <div style={{position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${cam.s})`}}>{children}</div>;
};
// One station: a 1080-wide panel on the wall. Children use screen coordinates as if the camera were home on it.
export const Panel: React.FC<{at: [number, number]; children: React.ReactNode}> = ({at, children}) => (
  <div style={{position: "absolute", left: at[0], top: at[1], width: 1080, height: 1080}}>{children}</div>
);

// ---- type and cards ------------------------------------------------------------------------------------------------
export const card: React.CSSProperties = {position: "absolute", backgroundColor: C.card, border: `1.5px solid ${C.line}`, borderRadius: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.55)"};
export const ui = (size: number, weight = 700, color = C.text): React.CSSProperties => ({fontFamily: FONT.inter, fontWeight: weight, fontSize: size, color, letterSpacing: "-0.015em", whiteSpace: "nowrap"});

// A headline on the wall: 1-3 big words, an optional accent word in italic serif on an accent block.
export const WallHeadline: React.FC<{f: number; at: number; text: string; accent?: string; top?: number}> = ({f, at, text, accent, top = 330}) => {
  if (f < at) return null;
  return (
    <div style={{position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
      <div style={{...ui(92, 900), letterSpacing: "-0.035em", ...enter(f, at, 7, 24, 0.92)}}>{text}</div>
      {accent && (
        <div style={{backgroundColor: C.accent, padding: "6px 30px 14px", borderRadius: 8, boxShadow: "0 10px 34px rgba(0,0,0,0.4)", ...enter(f, at + 5, 7, 14, 0.9)}}>
          <span style={{fontFamily: FONT.serif, fontStyle: "italic", fontSize: 92, color: "#fff", lineHeight: 1}}>{accent}</span>
        </div>
      )}
    </div>
  );
};

// ---- label bars with number chips ----------------------------------------------------------------------------------
// A list as stacked bars: a number chip on the left, the label on the right. Each bar lands on its own frame; the bar in
// focus lights its chip in the accent and the others dim.
export const BAR = {x: 120, w: 840, h: 104, gap: 22};
export const LabelBar: React.FC<{n: number; label: string; lit: number; style?: React.CSSProperties}> = ({n, label, lit, style}) => (
  <div style={{position: "absolute", width: BAR.w, height: BAR.h, borderRadius: 16, backgroundColor: C.card, border: `1.5px solid ${C.line}`, overflow: "hidden",
    display: "flex", alignItems: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", ...style}}>
    <div style={{width: BAR.h, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1.5px solid ${C.line}`,
      backgroundColor: `rgba(210,38,31,${lit})`}}>
      <span style={ui(38, 700)}>{String(n).padStart(2, "0")}</span>
    </div>
    <span style={{...ui(46, 600), marginLeft: 34}}>{label}</span>
  </div>
);
export type BarItem = {label: string; at: number; focus?: number}; // frames
export const LabelBars: React.FC<{f: number; items: BarItem[]; top?: number}> = ({f, items, top = 300}) => {
  const focused = items.map((it, i) => ({i, at: it.focus ?? it.at})).filter((x) => f >= x.at).map((x) => x.i).pop();
  return (
    <>
      {items.map((it, i) => {
        if (f < it.at) return null;
        const lit = focused === i ? lin(f, it.focus ?? it.at, (it.focus ?? it.at) + 6) : 0;
        const dim = focused !== undefined && focused !== i ? 0.45 : 1;
        return <LabelBar key={i} n={i + 1} label={it.label} lit={lit} style={{left: BAR.x, top: top + i * (BAR.h + BAR.gap), ...enter(f, it.at, 7, 20, 0.95), opacity: Math.min(lin(f, it.at, it.at + 4), dim)}} />;
      })}
    </>
  );
};

// ---- the reveal list -----------------------------------------------------------------------------------------------
// A box of numbered rows on the wall, labels blurred until each is said: the accent number chips are sharp from the start,
// each label sharpens over 6 frames with a light sweep on its spoken word. `title` sits above the box.
export const RevealList: React.FC<{f: number; items: {text: string; at: number}[]; title?: string; left?: number; top?: number; width?: number; gap?: number}> = ({
  f, items, title, left = 90, top = 330, width = 900, gap = 104,
}) => {
  const height = items.length * gap + 80;
  return (
    <>
      {title && <div style={{position: "absolute", left: left + 4, top: top - 86, ...ui(60, 800), letterSpacing: "-0.02em", lineHeight: 1}}>{title}</div>}
      <div style={{...card, left, top, width, height}}>
        {items.map((it, i) => {
          const p = clamp(f, it.at, it.at + 6, 0, 1, Easing.out(Easing.quad));
          const sweep = lin(f, it.at, it.at + 12, -0.2, 1.2);
          return (
            <div key={i} style={{position: "absolute", left: 44, right: 30, top: 40 + i * gap, height: 64, display: "flex", alignItems: "center", gap: 28, overflow: "hidden"}}>
              <div style={{width: 56, height: 56, flexShrink: 0, borderRadius: 14, backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center"}}>
                <span style={ui(34, 800)}>{i + 1}</span>
              </div>
              <span style={{...ui(46, 600), filter: p < 0.99 ? `blur(${(1 - p) * 11}px)` : undefined, opacity: 0.45 + 0.55 * p}}>{it.text}</span>
              {f >= it.at && f <= it.at + 12 && (
                <div style={{position: "absolute", top: 0, bottom: 0, left: `${sweep * 100}%`, width: "24%", transform: "translateX(-50%) skewX(-18deg)",
                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)"}} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ---- big number box ------------------------------------------------------------------------------------------------
// A dark square with one big figure; lights up in the accent when it's the point.
export const NumberBox: React.FC<{f: number; at: number; x: number; y: number; n: string; size?: number; litAt?: number; caption?: string}> = ({f, at, x, y, n, size = 300, litAt, caption}) => {
  if (f < at) return null;
  const l = litAt !== undefined ? clamp(f, litAt, litAt + 6) : 0;
  return (
    <>
      <div style={{position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.08, backgroundColor: "#111112",
        border: `2px solid ${l > 0 ? C.accent : "rgba(255,255,255,0.2)"}`, boxShadow: `0 20px 50px rgba(0,0,0,0.6)${l > 0 ? `, 0 0 ${60 * l}px ${C.accent}66` : ""}`,
        display: "flex", alignItems: "center", justifyContent: "center", ...enter(f, at, 7, 26, 0.86)}}>
        <span style={{...ui(size * 0.5, 800), letterSpacing: "-0.04em"}}>{n}</span>
      </div>
      {caption && <div style={{position: "absolute", left: 0, right: 0, top: y + size / 2 + 34, textAlign: "center", ...ui(48, 600, C.muted), ...enter(f, at + 4, 7, 14, 0.95)}}>{caption}</div>}
    </>
  );
};

// A small tag pill ("EXAMPLE", a label on a graphic).
export const Tag: React.FC<{text: string; tone?: "dark" | "accent"; style?: React.CSSProperties}> = ({text, tone = "dark", style}) => (
  <div style={{position: "absolute", padding: "10px 20px", borderRadius: 8, backgroundColor: tone === "accent" ? C.accent : "#141415",
    border: `1.5px solid ${tone === "accent" ? "rgba(255,140,130,0.45)" : C.line}`, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", ...ui(30, 700, "#fff"), letterSpacing: "0.08em", ...style}}>
    {text}
  </div>
);
