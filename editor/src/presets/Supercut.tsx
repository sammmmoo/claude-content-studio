// PRESET 7, SUPERCUT (our own supercut Reels). One argument cut from different videos: each point can come from another
// take, another shirt, another room. Footage as filmed. One card is pinned in the upper third, clear of your head:
// a yellow hook card -> an ink card with each point's line appearing on your words, a numeral rolling 1, 2, 3 and a bar
// with one segment per point -> a checklist of every point (the rows land together) -> the call to action. Captions are
// 2-3 words and only show where the card isn't already carrying your words. Start from scripts/supercut_prep.py.
import React, {useMemo} from "react";
import {AbsoluteFill, Easing, Sequence, useCurrentFrame} from "remotion";
import {measureText} from "@remotion/layout-utils";
import {OPEN} from "./common";
import {breatheAt} from "../house/breathe";
import {Captions} from "../house/Captions";
import {ZoomOutOpener} from "../house/Opener";
import {Cut, CutGlitch, CutOverlay, cutZoom} from "../house/transitions";
import {FONT} from "../lib/fonts";
import {FULL, Footage, FootageAudio, Point, STAND_IN_FACE, scaleAbout} from "../lib/Footage";
import {clamp, sec} from "../lib/time";
import {SpokenWord, norm, toFrames} from "../lib/words";

export type SupercutProps = {
  pieces: {footage: string | null; from: number; to: number; face?: Point}[]; // seconds in each clip
  words: SpokenWord[]; // on the joined timeline (supercut_prep.py)
  jcut?: number; // seconds each next piece's sound leads its picture
  beats?: number[]; // the joins (seconds), from supercut_prep.py
  cuts?: Cut[]; // the picture cuts (seconds) and their transition
  durationInSeconds?: number;
  face?: Point; // your face centre (1080x1920 px), for the opener and the breathe; a piece's own `face` wins
  highlight?: string[]; // caption words to colour
  hook: {top: string; main: string}; // the yellow card at frame 0
  sections: {at: number; kicker?: string; line: string; accent?: string[]}[]; // one per point, `at` on its first word
  checklist?: {at: number; title: string; rows: [string, string][]} | null; // null for none (left out, the demo's shows)
  cta?: {at: number; top: string; word: string; sub: string} | null;
};

// ---------- look (SC6) ----------
const YEL = "#FFD21F", INK = "#111113", DIM = "rgba(255,255,255,0.6)", SEG0 = "rgba(255,255,255,0.16)", SEG_Y = "rgba(17,17,19,0.22)";
const CX = 65, CW = 950, CY = 286, PAD = 30, NUM = 104, TX = PAD + NUM + 26, TW = CW - PAD - TX;
const KS = 38, KLH = 48, BAR_H = 8, FOOT = 22 + BAR_H + 24, RAD = 28, QS = 70, QLH = 80;
const HOOK_K = 40, HOOK_KLH = 50, ROW_S = 38, ROW_LH = 56;
const MOVE = Easing.bezier(0.65, 0.05, 0, 1), EIN = Easing.in(Easing.cubic);
const F = FONT.inter;
const cl = (f: number, a: number, b: number, easing?: (x: number) => number) => clamp(f, a, b, 0, 1, easing);
const textW = (text: string, size: number, weight: string) => measureText({text, fontFamily: F, fontSize: size, fontWeight: weight}).width;

// ---------- words on the card: each appears on its spoken frame ----------
type Tok = {t: string; on: number; accent: boolean};
type Spoken = ReturnType<typeof toFrames>;
// Each token is matched to the next spoken word with the same text, from LOOK before `at` (a kicker is often said just
// before its section starts) to 12 words after; a word said before `at` shows at `at`, and a word whisper didn't hear (or
// spelt differently) shows at `at` too, never not at all. `used` collects the matched word indices (captions skip them).
const LOOK = 90; // frames
const timed = (text: string, at: number, spoken: Spoken, used: Set<number>, accent: string[] = []): Tok[] => {
  const acc = new Set(accent.map(norm));
  const from = (t: number) => { const k = spoken.findIndex((w) => w.on >= t); return k < 0 ? spoken.length : k; };
  const now = from(at - 2);
  let i = from(at - LOOK);
  return text.split(/\s+/).filter(Boolean).map((t) => {
    const j = spoken.findIndex((w, k) => k >= i && norm(w.w) === norm(t));
    const hit = j >= 0 && j - Math.max(i, now) < 12;
    if (hit) { used.add(j); i = j + 1; }
    return {t, on: hit ? Math.max(spoken[j].on, at) : at, accent: acc.has(norm(t))};
  });
};
// greedy wrap at `width`
const wrap = (toks: Tok[], size: number, weight: string, width: number): Tok[][] => {
  const lines: Tok[][] = [[]];
  toks.forEach((tk) => {
    const cur = lines[lines.length - 1];
    if (cur.length && textW([...cur, tk].map((x) => x.t).join(" "), size, weight) > width) lines.push([tk]);
    else cur.push(tk);
  });
  return lines;
};

const Word: React.FC<{tk: Tok; f: number; size: number; weight: string; color: string; space: boolean}> = ({tk, f, size, weight, color, space}) => {
  const p = cl(f, tk.on - 2, tk.on + 3);
  return <span style={{display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 10}px)`, color: tk.accent ? YEL : color, fontFamily: F,
    fontSize: size, fontWeight: weight as React.CSSProperties["fontWeight"], marginRight: space ? size * 0.26 : 0, whiteSpace: "pre"}}>{tk.t}</span>;
};
const Line: React.FC<{toks: Tok[]; f: number; size: number; weight: string; color: string; lh: number}> = ({toks, f, size, weight, color, lh}) =>
  <div style={{height: lh, lineHeight: `${lh}px`, whiteSpace: "nowrap", letterSpacing: -0.6}}>
    {toks.map((tk, m) => <Word key={m} tk={tk} f={f} size={size} weight={weight} color={color} space={m < toks.length - 1} />)}</div>;

// ---------- the card ----------
type Step = {at: number; h: number};
// Every frame and height the card needs, and which spoken words it carries (captions skip those).
const layout = (p: SupercutProps, spoken: Spoken) => {
  const used = new Set<number>();
  const big = Math.floor(Math.min(104, (104 * (CW - 2 * PAD)) / Math.max(1, textW(p.hook.main, 104, "900"))));
  const secs = p.sections.map((s) => {
    const a = sec(s.at);
    const kick = s.kicker ? timed(s.kicker, a, spoken, used) : [];
    const lines = wrap(timed(s.line, a, spoken, used, s.accent), QS, "700", TW);
    return {a, kick, lines, h: PAD + Math.max(NUM, (kick.length ? KLH + 8 : 0) + lines.length * QLH) + FOOT};
  });
  const ck = p.checklist ? sec(p.checklist.at) : null;
  const cta = p.cta ? {a: sec(p.cta.at), top: timed(p.cta.top, sec(p.cta.at), spoken, used),
    word: timed(p.cta.word, sec(p.cta.at), spoken, used), sub: timed(p.cta.sub, sec(p.cta.at), spoken, used)} : null;
  const steps: Step[] = [{at: -99, h: PAD + HOOK_KLH + 4 + Math.round(big * 1.08) + FOOT}, ...secs.map((x) => ({at: x.a, h: x.h}))];
  if (ck !== null) steps.push({at: ck, h: PAD + 44 + 10 + p.checklist!.rows.length * ROW_LH + 24});
  if (cta) steps.push({at: cta.a, h: PAD + 50 + 112 + 52 + 26});
  return {big, secs, ck, cta, steps, used};
};
type Layout = ReturnType<typeof layout>;

const Card: React.FC<{f: number; p: SupercutProps; L: Layout}> = ({f, p, L}) => {
  const {big, secs, ck, cta, steps} = L;
  const end = (k: number) => secs[k + 1]?.a ?? ck ?? cta?.a ?? 1e9; // a section holds until the next step
  const S1 = secs[0]?.a ?? 1e9, CK = ck ?? cta?.a ?? 1e9;
  let h = steps[0].h;
  for (let i = 1; i < steps.length; i++) h = h + (steps[i].h - h) * cl(f, steps[i].at - 3, steps[i].at + 5, MOVE);
  const ink = cl(f, S1 - 2, S1 + 3, MOVE);
  const bg = `rgb(${Math.round(255 + (17 - 255) * ink)}, ${Math.round(210 + (17 - 210) * ink)}, ${Math.round(31 + (19 - 31) * ink)})`;
  const n = Math.max(1, secs.length), segW = (CW - 2 * PAD - (n - 1) * 10) / n, barY = h - 24 - BAR_H;
  return (
    <div style={{position: "absolute", left: CX, top: CY, width: CW, height: h, borderRadius: RAD, background: bg, overflow: "hidden",
      boxShadow: "0 18px 50px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.18)"}}>
      {f < S1 + 2 && <Hook f={f} S1={S1} top={p.hook.top} main={p.hook.main} big={big} />}
      {secs.map((s, k) => f >= s.a - 2 && f < end(k) && (
        <div key={k} style={{position: "absolute", left: TX, top: PAD - 2, width: TW, opacity: 1 - cl(f, end(k) - 4, end(k) - 1, EIN),
          transform: `translateY(${-12 * cl(f, end(k) - 4, end(k) - 1, EIN)}px)`}}>
          {s.kick.length > 0 && <Line toks={s.kick} f={f} size={KS} weight="600" color={DIM} lh={KLH} />}
          {s.kick.length > 0 && <div style={{height: 8}} />}
          {s.lines.map((ln, j) => <Line key={j} toks={ln} f={f} size={QS} weight="700" color="#FFFFFF" lh={QLH} />)}
        </div>))}
      {f >= S1 && f < CK + 4 && <Numeral f={f} starts={secs.map((s) => s.a)} CK={CK} />}
      {ck !== null && f >= ck - 2 && f < (cta?.a ?? 1e9) + 2 && <Checklist f={f} ck={ck} until={cta?.a ?? 1e9} title={p.checklist!.title} rows={p.checklist!.rows} />}
      {cta && f >= cta.a - 2 && (
        <div style={{position: "absolute", left: PAD, top: PAD - 4, width: CW - 2 * PAD}}>
          <Line toks={cta.top} f={f} size={44} weight="700" color={DIM} lh={50} />
          <div style={{letterSpacing: -2}}><Line toks={cta.word.map((t) => ({...t, accent: true}))} f={f} size={112} weight="900" color={YEL} lh={112} /></div>
          <Line toks={cta.sub} f={f} size={40} weight="600" color="#FFFFFF" lh={52} />
        </div>)}
      {f < CK && Array.from({length: n}, (_, i) => (
        <div key={i} style={{position: "absolute", left: PAD + i * (segW + 10), top: barY, width: segW, height: BAR_H, borderRadius: 4,
          background: ink < 0.5 ? SEG_Y : SEG0, overflow: "hidden"}}>
          <div style={{width: "100%", height: "100%", background: YEL, transform: `scaleX(${secs[i] ? cl(f, secs[i].a, secs[i].a + 6) : 0})`, transformOrigin: "left"}} />
        </div>))}
    </div>
  );
};

const Hook: React.FC<{f: number; S1: number; top: string; main: string; big: number}> = ({f, S1, top, main, big}) => {
  const out = cl(f, S1 - 3, S1, EIN);
  return <div style={{position: "absolute", left: PAD, top: PAD - 4, opacity: 1 - out, transform: `translateY(${-14 * out}px)`, color: INK, whiteSpace: "nowrap"}}>
    <div style={{fontFamily: F, fontWeight: 700, fontSize: HOOK_K, lineHeight: `${HOOK_KLH}px`}}>{top}</div>
    <div style={{fontFamily: F, fontWeight: 900, fontSize: big, lineHeight: `${Math.round(big * 1.08)}px`, letterSpacing: -1.5, marginTop: 4}}>{main}</div>
  </div>;
};

const Numeral: React.FC<{f: number; starts: number[]; CK: number}> = ({f, starts, CK}) => {
  const pin = cl(f, starts[0], starts[0] + 7);
  const gone = cl(f, CK - 2, CK + 4, EIN);
  const pos = starts.slice(1).map((a) => cl(f, a - 1, a + 6, MOVE)).reduce((s, x) => s + x, 0);
  return <div style={{position: "absolute", left: PAD, top: PAD, width: NUM, height: NUM, borderRadius: 20, background: YEL, overflow: "hidden",
    opacity: pin * (1 - gone), transform: `scale(${(0.6 + 0.4 * pin) * (1 - 0.3 * gone)})`}}>
    {starts.map((_, j) => <div key={j} style={{position: "absolute", left: 0, top: (j - pos) * NUM, width: NUM, height: NUM, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 80, color: INK, letterSpacing: -2}}>{j + 1}</div>)}
  </div>;
};

const Checklist: React.FC<{f: number; ck: number; until: number; title: string; rows: [string, string][]}> = ({f, ck, until, title, rows}) => {
  const head = cl(f, ck + 2, ck + 9);
  const rowP = cl(f, ck + 6, ck + 16); // every row lands together, in one move (SC6 v4: never staggered)
  return <div style={{position: "absolute", left: PAD, top: PAD - 2, width: CW - 2 * PAD, opacity: 1 - cl(f, until - 3, until, EIN)}}>
    <div style={{height: 44, lineHeight: "44px", fontFamily: F, fontWeight: 700, fontSize: 36, letterSpacing: 0.6, color: YEL, opacity: head,
      transform: `translateY(${(1 - head) * 8}px)`}}>{title.toUpperCase()}</div>
    <div style={{height: 10}} />
    {rows.map(([a, b], i) => (
      <div key={i} style={{height: ROW_LH, display: "flex", alignItems: "center", opacity: rowP, transform: `translateX(${(1 - rowP) * -22}px)`}}>
        <span style={{width: 54, fontFamily: F, fontWeight: 900, fontSize: ROW_S, color: YEL}}>{i + 1}</span>
        <span style={{fontFamily: F, fontWeight: 700, fontSize: ROW_S, color: "#FFFFFF", marginRight: 12, whiteSpace: "nowrap"}}>{a}</span>
        <span style={{fontFamily: F, fontWeight: 600, fontSize: ROW_S, color: "rgba(255,255,255,0.86)", whiteSpace: "nowrap", letterSpacing: -0.3}}>{b}</span>
      </div>))}
  </div>;
};

// ---------- the footage: each piece as filmed; sound and picture placed separately for the J-cuts ----------
export const Supercut: React.FC<SupercutProps> = (p) => {
  const f = useCurrentFrame();
  const jc = p.jcut ?? 0;
  const joins = useMemo(() => p.pieces.reduce<number[]>((acc, pc, i) => [...acc, i ? acc[i - 1] + (p.pieces[i - 1].to - p.pieces[i - 1].from) : 0], []), [p.pieces]);
  const pic = joins.map((t, i) => sec(t + (i ? jc : 0)));           // frame each piece's picture starts
  const cuts = p.cuts ?? joins.slice(1).map((t) => ({at: t + jc, type: "cut" as const}));
  const spoken = useMemo(() => toFrames(p.words), [p.words]);
  const L = useMemo(() => layout(p, spoken), [p, spoken]);
  const total = sec(p.durationInSeconds ?? joins[joins.length - 1] + (p.pieces[p.pieces.length - 1].to - p.pieces[p.pieces.length - 1].from));
  const cur = Math.max(0, pic.filter((s) => s <= f).length - 1);
  const face = p.pieces[cur]?.face ?? p.face ?? STAND_IN_FACE;
  const z = cutZoom(f, cuts);
  const framing = scaleAbout(FULL, (f < OPEN ? 1 : breatheAt(f, [OPEN, ...pic.slice(1)])) * z.s, face);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      {p.pieces.map((pc, i) => (
        <Sequence key={`a${i}`} from={sec(joins[i])} durationInFrames={Math.max(1, sec(pc.to - pc.from))} layout="none">
          <FootageAudio src={pc.footage} startFrom={pc.from} />
        </Sequence>))}
      <ZoomOutOpener face={p.pieces[0]?.face ?? p.face ?? STAND_IN_FACE} scale={1.7} frames={10}>
        <AbsoluteFill style={{filter: z.blur ? `blur(${z.blur}px)` : undefined}}>
          {p.pieces.map((pc, i) => (
            <Sequence key={`v${i}`} from={pic[i]} durationInFrames={Math.max(1, (pic[i + 1] ?? total) - pic[i])}>
              <Footage src={pc.footage} framing={framing} startFrom={pc.from + (i ? jc : 0)} />
            </Sequence>))}
          {cuts.filter((c) => c.type === "glitch").map((c) => {
            const k = pic.findIndex((s) => s === sec(c.at));
            const pc = p.pieces[k >= 0 ? k : Math.min(p.pieces.length - 1, cur)];
            return <CutGlitch key={c.at} cuts={[c]} src={pc.footage} startFrom={pc.from + jc - c.at} />;
          })}
        </AbsoluteFill>
      </ZoomOutOpener>
      <Card f={f} p={p} L={L} />
      <Captions f={f} words={spoken} style="clean" y={1380} maxChars={14} yellow={p.highlight}
        hidePage={(pg) => pg.words.some((w) => L.used.has(spoken.findIndex((s) => s.on === w.on && s.w === w.w)))} />
      <CutOverlay f={f} cuts={cuts} />
    </AbsoluteFill>
  );
};
