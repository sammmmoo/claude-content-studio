// Word-by-word captions. Pages of 2-3 spoken words, swapped hard on a word (never animated in), white with a soft shadow,
// ONE highlighted word a line at most (a fully marked line keeps only its last word marked).
//
// Four looks:
//   clean    Montserrat SemiBold, lowercase, key word bold, highlight = yellow bold italic   (Red Box, Top Card, Clean Wide)
//   punchy   TikTok Sans Medium, sentence case, highlight = bright yellow, money 1.35x        (Wall, the devices)
//   caps     Montserrat ExtraBold capitals, highlight = green, negatives red                  (Head Band)
//   outline  TikTok Sans Bold, small, thin dark outline, highlight = yellow                   (Walk & Show)
// On a light ground (Top Card's paper) the line is ink and the highlighted word sits on a yellow highlighter.
import React from "react";
import {FONT} from "../lib/fonts";
import {textWidth} from "../lib/metrics";
import {C} from "../lib/tokens";
import {Page, Word, norm, pageAt, paginate} from "../lib/words";

export type CapStyle = "clean" | "punchy" | "caps" | "outline";
export type CapToken = {text: string; key?: boolean; hl?: boolean; neg?: boolean; hidden?: boolean};

type Spec = {
  family: string;
  size: number;
  weight: number;
  keyWeight: number;
  hlWeight: number;
  hlItalic: boolean;
  hlColor: string;
  kase: "lower" | "sentence" | "upper";
  shadow: string;
  stroke?: string;
  faces: {base: string; key: string; hl: string};
  moneyScale: number;
  tracking: string;
};

export const CAP: Record<CapStyle, Spec> = {
  clean: {
    family: FONT.montserrat, size: 70, weight: 600, keyWeight: 800, hlWeight: 700, hlItalic: true, hlColor: C.yellow, kase: "lower",
    shadow: "0 4px 10px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.28)",
    faces: {base: "montserrat-600", key: "montserrat-800", hl: "montserrat-700i"}, moneyScale: 1, tracking: "-0.015em",
  },
  punchy: {
    family: FONT.tiktok, size: 84, weight: 560, keyWeight: 700, hlWeight: 700, hlItalic: false, hlColor: C.yellowBright, kase: "sentence",
    shadow: "0 3px 9px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.25)",
    faces: {base: "tiktok-560", key: "tiktok-700", hl: "tiktok-700"}, moneyScale: 1.35, tracking: "-0.01em",
  },
  caps: {
    family: FONT.montserrat, size: 74, weight: 800, keyWeight: 800, hlWeight: 800, hlItalic: false, hlColor: C.green, kase: "upper",
    shadow: "0 4px 12px rgba(0,0,0,0.6), 0 0 24px rgba(0,0,0,0.3)",
    faces: {base: "montserrat-800", key: "montserrat-800", hl: "montserrat-800"}, moneyScale: 1, tracking: "-0.01em",
  },
  outline: {
    family: FONT.tiktok, size: 64, weight: 700, keyWeight: 800, hlWeight: 800, hlItalic: false, hlColor: C.yellowBright, kase: "sentence",
    shadow: "0 2px 6px rgba(0,0,0,0.45)", stroke: "rgba(0,0,0,0.85)",
    faces: {base: "tiktok-700", key: "tiktok-800", hl: "tiktok-800"}, moneyScale: 1.2, tracking: "-0.005em",
  },
};

const NEG = "#FF453A";
// Kept capitalised in lowercase mode.
const KEEP = new Set(["i", "i'm", "i'll", "i've", "i'd", "ai", "google", "chatgpt", "claude", "instagram", "tiktok", "youtube"]);

// Display form of one spoken word: trailing . , ; : ! dropped ("?" kept), case per style, curly apostrophe.
export const capText = (w: string, style: CapStyle): string => {
  let t = w.replace(/[.,;:!]+$/u, "");
  const n = norm(t);
  const kase = CAP[style].kase;
  if (kase === "upper") t = t.toUpperCase();
  else if (kase === "lower") {
    if (n === "i" || n.startsWith("i'")) t = "I" + t.slice(1);
    else if (n === "ai") t = "AI";
    else if (KEEP.has(n)) t = t[0].toUpperCase() + t.slice(1);
    else if (/^[A-Z][a-z'’]*\??$/u.test(t)) t = t.toLowerCase();
  }
  return t.replace(/'/gu, "’");
};

export type Marks = {yellow?: string[]; bold?: string[]; red?: string[]};

// Tokens for a line. `yellow`, `bold` and `red` are words or phrases ("10 seconds"), matched on normalised text.
export const capTokens = (words: string[], style: CapStyle, mark: Marks = {}): CapToken[] => {
  const ns = words.map(norm);
  const hit = (phrases?: string[]) => {
    const s = new Set<number>();
    for (const ph of phrases ?? []) {
      const p = ph.split(/\s+/).map(norm);
      for (let i = 0; i + p.length <= ns.length; i++) if (p.every((x, j) => ns[i + j] === x)) p.forEach((_, j) => s.add(i + j));
    }
    return s;
  };
  const hl = hit(mark.yellow), key = hit(mark.bold), neg = hit(mark.red);
  return words.map((w, i) => ({text: capText(w, style), hl: hl.has(i), key: key.has(i), neg: neg.has(i)}));
};

const oneMark = (tokens: CapToken[]): CapToken[] =>
  tokens.length > 1 && tokens.every((t) => t.hl) ? tokens.map((t, i) => ({...t, hl: i === tokens.length - 1})) : tokens;

const isMoney = (t: string) => /^\$|^\d/.test(t);

export type CaptionLineProps = {
  tokens: CapToken[];
  style: CapStyle;
  y: number; // vertical centre of the line (or its top with anchor "top")
  anchor?: "centre" | "top";
  ground?: "dark" | "light";
  size?: number;
  x?: number;
  width?: number;
};

// One caption line, fitted to the width from the font's own advances (2-3 words always fit one line in x 60..1020).
export const CaptionLine: React.FC<CaptionLineProps> = ({tokens, style, y, anchor = "centre", ground = "dark", size, x = 60, width = 960}) => {
  const s = CAP[style];
  const toks = oneMark(tokens);
  const base = size ?? s.size;
  const tr = parseFloat(s.tracking);
  const big = (t: CapToken) => (t.hl && isMoney(t.text) ? s.moneyScale : 1);
  const lineW = toks.reduce((w, t, i) => {
    const face = t.hl ? s.faces.hl : t.key ? s.faces.key : s.faces.base;
    return w + textWidth(t.text, face, base * big(t), tr) + (i > 0 ? textWidth(" ", s.faces.base, base, tr) : 0);
  }, 0);
  const fs = lineW > width ? Math.floor((base * width) / lineW) : base;
  const lh = Math.round(fs * 1.25);
  const light = ground === "light";
  return (
    <div
      style={{
        position: "absolute", left: x, width, top: anchor === "top" ? y : y - lh / 2, height: lh, lineHeight: `${lh}px`,
        textAlign: "center", whiteSpace: "nowrap", fontFamily: s.family, fontSize: fs, fontWeight: s.weight, letterSpacing: s.tracking,
        color: light ? C.ink : "#ffffff", textShadow: light ? "none" : s.shadow,
        WebkitTextStroke: s.stroke && !light ? `${Math.max(2, Math.round(fs * 0.045))}px ${s.stroke}` : undefined,
        paintOrder: "stroke fill",
      }}
    >
      {toks.map((t, i) => {
        const css: React.CSSProperties = {opacity: t.hidden ? 0 : 1};
        if (t.hl) {
          Object.assign(css, {
            fontWeight: s.hlWeight, fontStyle: s.hlItalic ? "italic" : "normal", fontSize: Math.round(fs * big(t)),
            color: light ? C.ink : s.hlColor,
            ...(light ? {background: C.yellow, padding: "0 0.14em", borderRadius: Math.round(fs * 0.12)} : {}),
          });
        } else if (t.neg) Object.assign(css, {color: light ? NEG : NEG, fontWeight: s.keyWeight});
        else if (t.key) css.fontWeight = s.keyWeight;
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : ""}
            <span style={css}>{t.text}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export type CaptionsProps = Marks & {
  f: number;
  words: Word[];
  style: CapStyle;
  y: number;
  anchor?: "centre" | "top";
  ground?: "dark" | "light";
  size?: number;
  maxChars?: number;
  hold?: number;
  breakBefore?: string[];
  progressive?: boolean; // reveal each word on its own spoken frame inside the page (true word-by-word)
  from?: number; // first frame captions may show (frame 0 is the thumbnail: hook only)
  hidePage?: (page: Page) => boolean; // hold a page back (e.g. it repeats a graphic that is landing)
};

// Captions straight from your words: paginate, pick the page for this frame, draw it.
export const Captions: React.FC<CaptionsProps> = ({f, words, style, y, anchor, ground, size, maxChars = 18, hold = 12, breakBefore, progressive = false, from = 1, hidePage, ...marks}) => {
  if (f < from) return null;
  const page = pageAt(paginate(words, maxChars, breakBefore), f, hold);
  if (!page || hidePage?.(page)) return null;
  const tokens = capTokens(page.words.map((w) => w.w), style, marks).map((t, i) => ({...t, hidden: progressive && f < page.words[i].on - 1}));
  return <CaptionLine tokens={tokens} style={style} y={y} anchor={anchor} ground={ground} size={size} />;
};
