// Default props for every composition: a made-up line of script with placeholder timings and the drawn stand-in instead
// of footage, so each template renders straight after `npm install`. Your real props replace all of this (see README).
import {FeedScrollProps} from "./devices/FeedScroll";
import {PyramidProps} from "./devices/Pyramid";
import {ReelOrbitProps} from "./devices/ReelOrbit";
import {ReelWallProps} from "./devices/ReelWall";
import {Reel} from "./objects/cards";
import {CleanWideProps} from "./presets/CleanWide";
import {HeadBandProps} from "./presets/HeadBand";
import {RedBoxProps} from "./presets/RedBox";
import {TopCardProps} from "./presets/TopCard";
import {WalkShowProps} from "./presets/WalkShow";
import {WallProps} from "./presets/Wall";
import {SpokenWord, at, demoWords, norm} from "./lib/words";

const t = (w: SpokenWord[], word: string, nth = 1) => at(w, word, nth);
const end = (w: SpokenWord[], word: string, nth = 1) => w.filter((x) => norm(x.word) === norm(word))[nth - 1].end;

// ---- presets ----
const wallW = demoWords("Every good video has three parts. Most people only nail one. The hook, the proof and the ask. We test four hooks: a question, a number, a claim and a story. Then we show it working, like a text back in under a minute.");
export const wall: WallProps = {
  footage: null, words: wallW, highlight: ["three", "four", "minute"],
  hook: {lines: ["Every good video", "has 3 parts"], until: end(wallW, "parts")},
  stations: [
    {kind: "headline", at: end(wallW, "parts"), text: "Three parts", accent: "most nail one"},
    {kind: "reveal", at: t(wallW, "The"), title: "Every video", items: [{text: "The hook", at: t(wallW, "hook,")}, {text: "The proof", at: t(wallW, "proof")}, {text: "The ask", at: t(wallW, "ask.")}]},
    {kind: "bars", at: t(wallW, "We"), items: [{label: "A question", at: t(wallW, "question,")}, {label: "A number", at: t(wallW, "number,")}, {label: "A claim", at: t(wallW, "claim")}, {label: "A story", at: t(wallW, "story.")}]},
    {kind: "phone", at: t(wallW, "Then"), contact: "Customer", messages: [
      {side: "in", lines: ["Hi, do you have time", "for a quote this week?"], at: t(wallW, "show")},
      {side: "out", lines: ["Yes! Thursday morning?"], at: t(wallW, "text")},
    ]},
    {kind: "number", at: t(wallW, "under"), value: "<1m", caption: "to reply", litAt: t(wallW, "minute.")},
  ],
};

const topW = demoWords("This free tool writes your captions for you. Paste the script, pick a style and it times every word. Comment edit and I'll send it to you.");
export const topCard: TopCardProps = {
  footage: null, words: topW, highlight: ["every word"], bold: ["free"],
  title: {lines: ["This free tool"], box: "writes your captions", until: t(topW, "Paste")},
  cards: [
    {from: t(topW, "Paste"), to: t(topW, "pick"), url: "your-tool.com", highlight: {x: 0, y: 0.34, w: 0.9, h: 0.07}},
    {from: t(topW, "pick"), to: t(topW, "Comment"), url: "your-tool.com/styles", highlight: {x: 0, y: 0.46, w: 0.75, h: 0.07}},
  ],
  cta: {at: t(topW, "Comment") - 0.05, keyword: "edit"},
};

const bandW = demoWords("Three tools that save me hours. Number one, a caption writer. Number two, an auto cutter. Number three, the one nobody uses. Stop editing by hand.");
export const headBand: HeadBandProps = {
  footage: null, words: bandW, highlight: ["hours", "caption", "cutter"], red: ["nobody", "stop"],
  hook: {lines: ["3 TOOLS THAT", "SAVE ME HOURS"], until: t(bandW, "Number")},
  band: [
    {from: t(bandW, "Number"), to: t(bandW, "Number", 2), url: "captions.example"},
    {from: t(bandW, "Number", 2), to: t(bandW, "Number", 3), text: "auto cut"},
  ],
  listCards: [{from: t(bandW, "Number", 3), to: t(bandW, "Stop"), n: 3, text: "The one nobody uses", sub: "and it's free"}],
  punchIns: [{from: t(bandW, "Stop") - 0.05, to: 99}],
  cuts: [{at: t(bandW, "Number", 2), type: "zoom"}, {at: t(bandW, "Stop") - 0.05, type: "flash"}],
};

const boxW = demoWords("Most people ask how to get more views. Wrong question. Ask how you keep people for the first 3 seconds. That's the whole game.");
export const redBox: RedBoxProps = {
  footage: null, words: boxW, highlight: ["3 seconds"], bold: ["wrong", "keep"],
  question: ["HOW DO I GET", "MORE VIEWS?"], boxUntil: t(boxW, "Wrong"),
  close: [{from: t(boxW, "Ask"), to: t(boxW, "That's")}],
};

const walkW = demoWords("I used to spend six hours on one video. Now it takes me twenty minutes. Here's the whole setup. It's all free and it's all in the link.");
export const walkShow: WalkShowProps = {
  footage: null, words: walkW, highlight: ["six hours", "twenty minutes", "free"],
  pov: {lines: ["POV: you finally", "post every day"], until: t(walkW, "Now")},
  cards: [{from: t(walkW, "setup."), to: t(walkW, "setup.") + 1.4, title: "The setup"}],
  cuts: [{at: t(walkW, "Now"), type: "flash"}, {at: t(walkW, "twenty"), type: "glitch"}, {at: t(walkW, "Here's"), type: "zoom"}, {at: t(walkW, "It's"), type: "leak"}],
  beats: [t(walkW, "Now"), t(walkW, "Here's"), t(walkW, "It's")],
};

const wideW = demoWords("Editing one reel used to cost me $50. Now it costs nothing. Captions, free. Cutting, free. Music, free.");
export const cleanWide: CleanWideProps = {
  footage: null, words: wideW, highlight: ["$50", "nothing"],
  title: "what it costs to edit a reel",
  chestCards: [
    {from: t(wideW, "Captions,"), to: t(wideW, "Cutting,"), label: "Captions", value: "$0"},
    {from: t(wideW, "Cutting,"), to: t(wideW, "Music,"), label: "Cutting", value: "$0"},
    {from: t(wideW, "Music,"), to: 99, label: "Music", value: "$0"},
  ],
};

// ---- devices ----
const tiles = (n: number, views: number[]): Reel[] => Array.from({length: n}, (_, i) => ({src: null, views: views[i % views.length]}));

const reelW = demoWords("Views don't pay the bills. Work does. So here's every reel I studied this month, and what they had in common.");
export const reelWall: ReelWallProps = {
  footage: null, words: reelW, highlight: ["work"],
  hook: {top: "Bring in work,", main: "not views", until: end(reelW, "does")},
  reels: tiles(21, [1240000, 86400, 312000, 9800, 2400000, 154000, 47300]), enter: 0.67,
};

const feedW = demoWords("Most people watching aren't your buyers. Look at one creator's feed and you'll see it straight away.");
export const feedScroll: FeedScrollProps = {
  footage: null, words: feedW, highlight: ["buyers"],
  hook: {top: "Most people", main: "aren't your buyers", until: end(feedW, "buyers") + 0.3},
  covers: tiles(12, []).map((r) => ({src: r.src})), enter: t(feedW, "Look"),
  flicks: [{at: t(feedW, "Look"), dist: 820, tau: 0.8}, {at: t(feedW, "see"), dist: 460, tau: 0.6}],
};

const orbitW = demoWords("Which of these made the most money? Not the one with the most views.");
export const reelOrbit: ReelOrbitProps = {
  footage: null, words: orbitW, highlight: ["money"],
  hook: {top: "Which made the", main: "most money?", until: end(orbitW, "money?")},
  reels: tiles(6, []).map((r) => ({src: r.src})), start: 0.53,
};

const pyrW = demoWords("Software isn't step one. First, where it lands. Then, what you ask. Then, who chases. Skip that and you just lose people in nicer software.");
export const pyramid: PyramidProps = {
  footage: null, words: pyrW, highlight: ["lose"],
  hook: {top: "Software isn't", main: "step one", until: end(pyrW, "one.")},
  appear: t(pyrW, "First,"),
  tiers: [
    {label: "WHERE IT LANDS", at: t(pyrW, "where")},
    {label: "WHAT YOU ASK", at: t(pyrW, "what")},
    {label: "WHO CHASES", at: t(pyrW, "who"), reveal: t(pyrW, "Skip")},
  ],
  cap: t(pyrW, "nicer"),
};
