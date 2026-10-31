// A dark-mode iPhone in Messages, drawn at real proportions (402 x 874 pt screen) at N px per point, then placed by `cam`.
// Inter stands in for Apple's system font. Behaviour follows the real app: a long text grows the field to two lines, Send
// lifts the bubble out of the field, "Delivered" follows, a reply shows typing dots first and grows out of them, older
// bubbles ride up. Use it to SHOW a text being sent; tag it EXAMPLE when the conversation is made up (the Wall preset does).
import React from "react";
import {Easing} from "remotion";
import {measureText} from "@remotion/layout-utils";
import {FONT} from "../lib/fonts";
import {clamp, lin} from "../lib/time";
export const N = 2.4; // native px per pt
const u = (pt: number) => pt * N;
export const BODY = {w: 414, h: 886, r: 66};
const SCR = {x: 6, y: 6, w: 402, h: 874, r: 60};
const FS = 17, LH = 22, PADX = 12, PADY = 7, MAXW = 262;
const GREEN = "#30D158", GREY = "#262629", BLUE = "#0A84FF";

export type Msg = {side: "in" | "out"; lines: string[]; at: number; typingFrom?: number};
export type Stamp = {stamp: [string, string]; at: number};
export type Item = Msg | Stamp;
export type Cam = {s: number; fx: number; fy: number; sx: number; sy: number}; // native point (pt) fx,fy lands at screen sx,sy
export const camAt = (keys: {f: number; c: Cam}[], f: number): Cam => {
  if (f <= keys[0].f) return keys[0].c;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (f <= b.f) {
      const p = clamp(f, a.f, b.f, 0, 1, Easing.bezier(0.45, 0, 0.15, 1));
      const m = (x: number, y: number) => x + (y - x) * p;
      return {s: m(a.c.s, b.c.s), fx: m(a.c.fx, b.c.fx), fy: m(a.c.fy, b.c.fy), sx: m(a.c.sx, b.c.sx), sy: m(a.c.sy, b.c.sy)};
    }
  }
  return keys[keys.length - 1].c;
};

const textW = (t: string) => measureText({text: t, fontFamily: FONT.inter, fontWeight: "400", fontSize: u(FS)}).width / N;
const msgSize = (lines: string[]) => ({w: Math.min(MAXW, Math.max(...lines.map(textW))) + PADX * 2, h: lines.length * LH + PADY * 2});
const TYPING = {w: 56, h: 36};

const Tail: React.FC<{side: "in" | "out"; color: string}> = ({side, color}) => <svg width={u(15)} height={u(17)} viewBox="0 0 15 17"
  style={{position: "absolute", bottom: 0, [side === "out" ? "right" : "left"]: u(-6), transform: side === "in" ? "scaleX(-1)" : undefined}}>
  <path d="M0 0 L0 17 L15 17 C10 16.4 7.6 12.6 8.6 6.5 L8.6 0 Z" fill={color} />
</svg>;

const Bubble: React.FC<{side: "in" | "out"; w: number; h: number; children?: React.ReactNode; tail?: boolean}> = ({side, w, h, children, tail = true}) => {
  const color = side === "out" ? GREEN : GREY;
  const r = u(18);
  return <div style={{position: "relative", width: u(w), height: u(h)}}>
    <div style={{position: "absolute", inset: 0, backgroundColor: color, borderRadius: side === "out" ? `${r}px ${r}px ${tail ? u(5) : r}px ${r}px` : `${r}px ${r}px ${r}px ${tail ? u(5) : r}px`}} />
    {tail && <Tail side={side} color={color} />}
    {children}
  </div>;
};

const Typing: React.FC<{f: number; opacity: number}> = ({f, opacity}) => <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: u(5), opacity}}>
  {[0, 1, 2].map((i) => <div key={i} style={{width: u(8.5), height: u(8.5), borderRadius: "50%", backgroundColor: "#8E8E93", opacity: 0.35 + 0.65 * Math.max(0, Math.sin(f * 0.38 - i * 0.95))}} />)}
</div>;

const StatusBar: React.FC = () => <div style={{position: "absolute", left: 0, top: 0, width: u(SCR.w), height: u(54), color: "#fff"}}>
  <div style={{position: "absolute", left: u(52), top: u(17), fontFamily: FONT.inter, fontWeight: 600, fontSize: u(17), letterSpacing: "-0.01em"}}>9:41</div>
  <div style={{position: "absolute", left: u(SCR.w / 2 - 63), top: u(11), width: u(126), height: u(37), borderRadius: u(19), backgroundColor: "#000"}} />
  <svg style={{position: "absolute", right: u(28), top: u(21)}} width={u(78)} height={u(13)} viewBox="0 0 78 13">
    {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 5} y={9 - i * 3} width={3.2} height={4 + i * 3} rx={0.9} fill="#fff" />)}
    <path d="M30 4.2a10 10 0 0 1 13.6 0M32.4 6.8a6.6 6.6 0 0 1 8.8 0M34.8 9.4a3.2 3.2 0 0 1 4 0" stroke="#fff" strokeWidth={1.9} fill="none" strokeLinecap="round" />
    <rect x={52} y={1} width={22.5} height={11.5} rx={3.4} stroke="rgba(255,255,255,0.45)" strokeWidth={1} fill="none" />
    <rect x={54} y={3} width={16.5} height={7.5} rx={1.8} fill="#fff" />
    <rect x={75.5} y={4.6} width={1.6} height={4.2} rx={0.8} fill="rgba(255,255,255,0.45)" />
  </svg>
</div>;

const Header: React.FC<{name: string; initials: string}> = ({name, initials}) => <div style={{position: "absolute", left: 0, top: 0, width: u(SCR.w), height: u(152), backgroundColor: "rgba(24,24,26,0.96)", borderBottom: `${u(0.5)}px solid #38383A`}}>
  <svg style={{position: "absolute", left: u(14), top: u(76)}} width={u(13)} height={u(22)} viewBox="0 0 13 22"><path d="M11 2 L2 11 L11 20" stroke={BLUE} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  <div style={{position: "absolute", left: u(SCR.w / 2 - 27), top: u(60), width: u(54), height: u(54), borderRadius: "50%", background: "linear-gradient(180deg,#8E8E93,#5E5E63)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.inter, fontWeight: 600, fontSize: u(22), color: "#fff"}}>{initials}</div>
  <div style={{position: "absolute", left: 0, width: u(SCR.w), top: u(120), textAlign: "center", fontFamily: FONT.inter, fontWeight: 500, fontSize: u(12.5), color: "#fff"}}>{name} <span style={{color: "#8E8E93"}}>›</span></div>
</div>;

export const IPhone: React.FC<{f: number; cam: Cam; items: Item[]; input?: {lines: string[]; sendAt: number}; lockAt?: number; name: string; initials: string}> = ({f, cam, items, input, lockAt, name, initials}) => {
  const typing = input && f < input.sendAt;
  const fieldLines = typing ? input.lines.length : 1;
  const fieldH = 36 + (fieldLines - 1) * LH;
  const inputBottom = SCR.h - 34 - 6;
  const inputTop = inputBottom - fieldH;
  const threadBottom = inputTop - 12;

  // Visible items with their size and grow progress (new items push the older ones up as they open).
  type L = {it: Item; w: number; h: number; grow: number};
  const vis: L[] = [];
  for (const it of items) {
    if ("stamp" in it) {
      if (f >= it.at) vis.push({it, w: SCR.w, h: 34, grow: clamp(f, it.at, it.at + 5, 0, 1)});
      continue;
    }
    const start = it.typingFrom ?? it.at;
    if (f < start) continue;
    const m = msgSize(it.lines);
    let w = m.w, h = m.h;
    if (it.typingFrom !== undefined) {
      const k = clamp(f, it.at, it.at + 6, 0, 1);
      w = TYPING.w + (m.w - TYPING.w) * k;
      h = TYPING.h + (m.h - TYPING.h) * k;
    }
    vis.push({it, w, h, grow: clamp(f, start, start + 6, 0, 1)});
  }
  const last = vis[vis.length - 1];
  const lastOut = last && !("stamp" in last.it) && last.it.side === "out" ? last : null;
  const delivered = lastOut ? lin(f, (lastOut.it as Msg).at + 9, (lastOut.it as Msg).at + 13) : 0;

  let y = threadBottom - (lastOut ? 18 * delivered : 0);
  const placed: {l: L; top: number}[] = [];
  for (let i = vis.length - 1; i >= 0; i--) {
    const l = vis[i];
    const prev = vis[i + 1];
    const gap = !prev ? 0 : "stamp" in l.it || "stamp" in prev.it ? 10 : (l.it as Msg).side === (prev.it as Msg).side ? 3 : 10;
    y -= gap * (prev ? prev.grow : 1);
    y -= l.h * l.grow;
    placed.push({l, top: y});
  }

  const lockK = lockAt !== undefined ? lin(f, lockAt, lockAt + 2) : 0;
  const t = `translate(${cam.sx - u(cam.fx) * cam.s}px, ${cam.sy - u(cam.fy) * cam.s}px) scale(${cam.s})`;
  return <div style={{position: "absolute", left: 0, top: 0, width: u(BODY.w), height: u(BODY.h), transform: t, transformOrigin: "0 0"}}>
    {/* shadow on the stage, then the titanium body with its buttons */}
    <div style={{position: "absolute", left: u(10), top: u(30), width: u(BODY.w - 20), height: u(BODY.h - 20), borderRadius: u(BODY.r), boxShadow: `0 ${u(40)}px ${u(90)}px rgba(0,0,0,0.85)`}} />
    {[[-1.6, 150, 26], [-1.6, 196, 46], [-1.6, 254, 46], [BODY.w - 1.4, 222, 76], [BODY.w - 1.4, 520, 40]].map(([x, top, h], i) =>
      <div key={i} style={{position: "absolute", left: u(x), top: u(top), width: u(3), height: u(h), borderRadius: u(1.5), background: "linear-gradient(90deg,#2a2a2c,#5a5a5e,#2a2a2c)"}} />)}
    <div style={{position: "absolute", inset: 0, borderRadius: u(BODY.r), background: "linear-gradient(145deg,#6a6a6f 0%,#2b2b2e 22%,#1b1b1d 50%,#3e3e42 78%,#77777c 100%)"}} />
    <div style={{position: "absolute", left: u(2.2), top: u(2.2), right: u(2.2), bottom: u(2.2), borderRadius: u(BODY.r - 2.2), backgroundColor: "#050505"}} />
    <div style={{position: "absolute", left: u(SCR.x), top: u(SCR.y), width: u(SCR.w), height: u(SCR.h), borderRadius: u(SCR.r), overflow: "hidden", backgroundColor: "#000"}}>
      <div style={{position: "absolute", inset: 0, opacity: 1 - lockK}}>
        {placed.map(({l, top}, i) => {
          if ("stamp" in l.it) {
            return <div key={i} style={{position: "absolute", left: 0, width: u(SCR.w), top: u(top), textAlign: "center", fontFamily: FONT.inter, fontSize: u(11.5), lineHeight: `${u(14)}px`, color: "#8E8E93", opacity: l.grow}}>
              <span style={{fontWeight: 600}}>{l.it.stamp[0]}</span><br />{l.it.stamp[1]}
            </div>;
          }
          const m = l.it;
          const isTyping = m.typingFrom !== undefined && f < m.at + 6;
          const reveal = m.typingFrom !== undefined ? lin(f, m.at + 2, m.at + 6) : 1;
          const x = m.side === "out" ? SCR.w - 12 - l.w : 12;
          // A sent bubble rides up out of the field; a received one opens from its tail corner.
          const enterK = clamp(f, m.typingFrom ?? m.at, (m.typingFrom ?? m.at) + 7, 0, 1);
          const motion: React.CSSProperties = m.side === "out"
            ? {transform: `translateY(${u((inputTop + 4 - top) * (1 - enterK))}px) scale(${0.94 + 0.06 * enterK})`, transformOrigin: "100% 100%"}
            : {transform: `scale(${0.55 + 0.45 * enterK})`, transformOrigin: "0% 100%", opacity: lin(f, m.typingFrom ?? m.at, (m.typingFrom ?? m.at) + 3)};
          return <div key={i} style={{position: "absolute", left: u(x), top: u(top), ...motion}}>
            <Bubble side={m.side} w={l.w} h={l.h}>
              {isTyping && <Typing f={f} opacity={1 - reveal} />}
              <div style={{position: "absolute", left: u(PADX), top: u(PADY), fontFamily: FONT.inter, fontSize: u(FS), lineHeight: `${u(LH)}px`, color: "#fff", whiteSpace: "nowrap", opacity: reveal, letterSpacing: "-0.012em"}}>
                {m.lines.map((s, k) => <div key={k}>{s}</div>)}
              </div>
            </Bubble>
            {m === lastOut?.it && <div style={{position: "absolute", right: u(4), top: u(l.h + 3), fontFamily: FONT.inter, fontWeight: 500, fontSize: u(11.5), color: "#8E8E93", opacity: delivered}}>Delivered</div>}
          </div>;
        })}
        <Header name={name} initials={initials} />
        <StatusBar />
        {/* input bar */}
        <div style={{position: "absolute", left: u(10), top: u(inputBottom - 34), width: u(34), height: u(34), borderRadius: "50%", backgroundColor: "#2C2C2E", display: "flex", alignItems: "center", justifyContent: "center"}}>
          <svg width={u(15)} height={u(15)} viewBox="0 0 15 15"><path d="M7.5 1v13M1 7.5h13" stroke="#AEAEB2" strokeWidth={2} strokeLinecap="round" /></svg>
        </div>
        <div style={{position: "absolute", left: u(52), top: u(inputTop), width: u(SCR.w - 62), height: u(fieldH), borderRadius: u(18), border: `${u(1)}px solid #3A3A3C`}}>
          <div style={{position: "absolute", left: u(13), top: u(7), fontFamily: FONT.inter, fontSize: u(FS), lineHeight: `${u(LH)}px`, color: typing ? "#fff" : "#6D6D72", whiteSpace: "nowrap", letterSpacing: "-0.012em"}}>
            {typing ? input.lines.map((s, k) => <div key={k}>{s}</div>) : "Text Message"}
          </div>
          {typing ? <div style={{position: "absolute", right: u(4), bottom: u(4), width: u(28), height: u(28), borderRadius: "50%", backgroundColor: GREEN, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <svg width={u(14)} height={u(16)} viewBox="0 0 14 16"><path d="M7 14.5V2M1.8 7 7 1.8 12.2 7" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div> : <svg style={{position: "absolute", right: u(12), top: u(8)}} width={u(14)} height={u(20)} viewBox="0 0 14 20"><rect x={4} y={1} width={6} height={11} rx={3} fill="#6D6D72" /><path d="M1.5 9a5.5 5.5 0 0 0 11 0M7 15v3.5" stroke="#6D6D72" strokeWidth={1.6} fill="none" strokeLinecap="round" /></svg>}
        </div>
        <div style={{position: "absolute", left: u(SCR.w / 2 - 67), top: u(SCR.h - 13), width: u(134), height: u(5), borderRadius: u(3), backgroundColor: "#fff"}} />
      </div>
      {/* glass */}
      <div style={{position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.02) 28%, transparent 46%)", pointerEvents: "none"}} />
    </div>
  </div>;
};
