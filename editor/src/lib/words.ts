// Spoken words in, caption pages out.
// Input is faster-whisper's word list as JSON: [{"word": "Here's", "start": 0.12, "end": 0.40}, ...] in seconds
// (scripts/words.py writes exactly this). A page is 2-3 words shown together and swapped hard on a word, never one word
// alone unless it's the only word left.
import {FPS} from "./time";

export type SpokenWord = {word: string; start: number; end: number};
export type Word = {w: string; on: number; off: number}; // frames
export type Page = {words: Word[]; on: number; off: number};

export const toFrames = (words: SpokenWord[]): Word[] =>
  words.map((x) => ({w: x.word.trim(), on: Math.round(x.start * FPS), off: Math.round(x.end * FPS)})).filter((x) => x.w.length > 0);

export const norm = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'$%]/g, "");

// The first frame of the nth time `text` is spoken (1-based), for timing an animation to a word.
export const at = (words: SpokenWord[], text: string, nth = 1): number => {
  const hits = words.filter((x) => norm(x.word) === norm(text));
  if (!hits[nth - 1]) throw new Error(`"${text}" (#${nth}) is not in the words`);
  return hits[nth - 1].start;
};

const SENTENCE = /[.?!]$/;
const PAUSE = /[,;:]$/;

// 2-3 words a page: break at the end of a sentence, after a comma once the page has two words, at a pause of 0.3 s or
// more, or when the line passes `maxChars`. A single word joins the page before it (or after, if it opens a sentence).
// `breakBefore` words always start a page (a CTA keyword).
export const paginate = (words: Word[], maxChars = 18, breakBefore: string[] = []): Page[] => {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  const len = (ws: Word[]) => ws.map((x) => x.w).join(" ").length;
  words.forEach((x, i) => {
    const prev = words[i - 1];
    const gap = prev ? x.on - prev.off : 0;
    const forced = breakBefore.map(norm).includes(norm(x.w));
    if (cur.length && (forced || cur.length >= 3 || gap >= 9 || len([...cur, x]) > maxChars || (prev && SENTENCE.test(prev.w)) || (prev && PAUSE.test(prev.w) && cur.length >= 2))) {
      pages.push(cur);
      cur = [];
    }
    cur.push(x);
  });
  if (cur.length) pages.push(cur);
  // never one word alone
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].length === 1 && pages.length > 1) {
      const prevEnds = i > 0 && SENTENCE.test(pages[i - 1][pages[i - 1].length - 1].w);
      const into = i === 0 ? 1 : i === pages.length - 1 || !prevEnds || SENTENCE.test(pages[i][0].w) ? i - 1 : i + 1;
      if (into < i) pages[into].push(...pages[i]);
      else pages[into].unshift(...pages[i]);
      pages.splice(i, 1);
      i--;
    }
  }
  return pages.map((ws) => ({words: ws, on: ws[0].on, off: ws[ws.length - 1].off}));
};

// The page on screen at frame f: from 2 frames before its first word until the next page starts, or `hold` frames
// after its last word.
export const pageAt = (pages: Page[], f: number, hold = 12, lead = 2): Page | null => {
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const next = pages[i + 1];
    const end = next ? Math.min(next.on - lead, p.off + hold) : p.off + hold;
    if (f >= p.on - lead && f < end) return p;
  }
  return null;
};

// Duration from the words: last word plus a short tail. The edit rules end on the last word, never a silent tail.
export const durationFromWords = (words: SpokenWord[], tail = 0.4, min = 2) =>
  Math.max(Math.round(min * FPS), Math.round(((words.length ? words[words.length - 1].end : 0) + tail) * FPS));

// Placeholder timings for a line of text at a natural pace, so every template renders before you have real words.
// Replace with your own faster-whisper words.
export const demoWords = (text: string, startAt = 0.15, wps = 2.7): SpokenWord[] => {
  let t = startAt;
  return text.split(/\s+/).filter(Boolean).map((word) => {
    const d = Math.max(0.16, (0.12 + word.replace(/[^A-Za-z0-9]/g, "").length * 0.055) * (2.7 / wps));
    const w = {word, start: +t.toFixed(2), end: +(t + d).toFixed(2)};
    t += d + (/[.?!]$/.test(word) ? 0.32 : /[,;:]$/.test(word) ? 0.14 : 0.04);
    return w;
  });
};
