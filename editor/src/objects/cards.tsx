// Cards that SHOW the thing: a browser screenshot with its key sentence highlighted, a title that builds word by word,
// a plain white card for a list item, a still screen card, and a reel tile for the devices.
// Images are yours: put them in public/images and pass "images/name.png". With no image you get neutral stand-in lines.
import React from "react";
import {Img, OffthreadVideo, staticFile} from "remotion";
import {FONT} from "../lib/fonts";
import {C} from "../lib/tokens";
import {clamp, lin} from "../lib/time";

const resolve = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

// Grey text lines standing in for a screenshot you haven't added yet; line `hi` gets the highlight.
const StandInLines: React.FC<{rows?: number; hi?: number; tone?: "light" | "dark"}> = ({rows = 7, hi, tone = "light"}) => (
  <div style={{display: "flex", flexDirection: "column", gap: 22, padding: "8px 4px"}}>
    <div style={{height: 34, width: "62%", borderRadius: 8, background: tone === "light" ? "#2a2a2e" : "#e9e9ee"}} />
    {Array.from({length: rows}, (_, i) => (
      <div key={i} data-hi={i === hi ? 1 : 0} style={{height: 20, width: `${[96, 88, 92, 74, 90, 82, 68, 86][i % 8]}%`, borderRadius: 6, background: tone === "light" ? "#c9c9cf" : "#3a3a40"}} />
    ))}
  </div>
);

// A browser window with a screenshot. `highlight` is a box in the screenshot's own pixels (fractions 0-1 of its width
// and height) that a yellow marker sweeps across at frame `hiAt`.
export type Highlight = {x: number; y: number; w: number; h: number};
export const BrowserCard: React.FC<{
  f: number; x: number; y: number; w: number; h: number; url?: string; image?: string | null; highlight?: Highlight; hiAt?: number;
}> = ({f, x, y, w, h, url = "example.com", image, highlight, hiAt = 0}) => {
  const k = clamp(f, hiAt, hiAt + 8);
  const bodyH = h - 64;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 22, overflow: "hidden", background: "#fff",
      boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 0 0 1.5px rgba(0,0,0,0.08)"}}>
      <div style={{height: 64, background: "#EDEDF0", display: "flex", alignItems: "center", gap: 12, padding: "0 22px"}}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />)}
        <div style={{flex: 1, marginLeft: 18, height: 38, borderRadius: 19, background: "#fff", display: "flex", alignItems: "center", padding: "0 20px",
          fontFamily: FONT.inter, fontSize: 24, color: "#6b6b70"}}>{url}</div>
      </div>
      <div style={{position: "relative", height: bodyH, padding: image ? 0 : 36, overflow: "hidden"}}>
        {image ? <Img src={resolve(image)} style={{width: "100%", display: "block"}} /> : <StandInLines hi={3} />}
        {highlight && f >= hiAt && (
          <div style={{position: "absolute", left: `${highlight.x * 100}%`, top: `${highlight.y * 100}%`, width: `${highlight.w * 100 * k}%`, height: `${highlight.h * 100}%`,
            background: "rgba(245,227,31,0.55)", mixBlendMode: "multiply", borderRadius: 4}} />
        )}
      </div>
    </div>
  );
};

// The title card: words build one by one over `buildFrames` (first word already up on frame 0), then the key phrase lands
// in an accent box in italic serif.
export const TitleCard: React.FC<{f: number; lines: string[]; box: string; buildFrames?: number; top?: number; tone?: "ink" | "white"}> = ({
  f, lines, box, buildFrames = 15, top = 300, tone = "ink",
}) => {
  const words = lines.join(" ").split(/\s+/);
  const step = buildFrames / (words.length + 1);
  let n = 0;
  return (
    <div style={{position: "absolute", left: 60, right: 60, top, textAlign: "center"}}>
      {lines.map((line, li) => (
        <div key={li} style={{fontFamily: FONT.inter, fontWeight: 900, fontSize: 112, lineHeight: 1.05, letterSpacing: "-0.035em", color: tone === "ink" ? C.ink : "#fff"}}>
          {line.split(/\s+/).map((w, i) => {
            const shown = f >= Math.floor(n++ * step);
            return <span key={i} style={{opacity: shown ? 1 : 0}}>{i ? " " : ""}{w}</span>;
          })}
        </div>
      ))}
      <div style={{display: "inline-block", marginTop: 18, background: C.accent, borderRadius: 10, padding: "4px 28px 14px", opacity: f >= buildFrames - step ? 1 : 0,
        transform: `scale(${0.9 + 0.1 * clamp(f, buildFrames - step, buildFrames + 4)})`}}>
        <span style={{fontFamily: FONT.serif, fontStyle: "italic", fontSize: 108, color: "#fff", lineHeight: 1}}>{box}</span>
      </div>
    </div>
  );
};

// A list item full screen on a white card: "#3" big, the item under it.
export const ListCard: React.FC<{n: number; text: string; sub?: string}> = ({n, text, sub}) => (
  <div style={{position: "absolute", left: 70, right: 70, top: 380, height: 760, borderRadius: 36, background: "#fff", boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 60, textAlign: "center"}}>
    <div style={{fontFamily: FONT.inter, fontWeight: 900, fontSize: 220, lineHeight: 1, color: C.accent, letterSpacing: "-0.05em"}}>#{n}</div>
    <div style={{fontFamily: FONT.inter, fontWeight: 800, fontSize: 76, lineHeight: 1.08, color: C.ink, letterSpacing: "-0.03em"}}>{text}</div>
    {sub && <div style={{fontFamily: FONT.inter, fontWeight: 600, fontSize: 40, color: "#6b6b70"}}>{sub}</div>}
  </div>
);

// A still screen card held on and off on a hard frame (no entrance): a real screenshot crop on a white card.
export const ScreenCard: React.FC<{image?: string | null; title?: string; top: number; width?: number}> = ({image, title, top, width = 760}) => (
  <div style={{position: "absolute", left: (1080 - width) / 2, top, width, padding: 26, boxSizing: "border-box", background: "#fff", borderRadius: 30,
    boxShadow: "0 18px 50px rgba(0,0,0,0.35), 0 3px 10px rgba(0,0,0,0.2)"}}>
    {title && <div style={{fontFamily: FONT.inter, fontWeight: 700, fontSize: 34, color: C.ink, marginBottom: 16}}>{title}</div>}
    {image ? <Img src={resolve(image)} style={{display: "block", width: width - 52}} /> : <div style={{padding: "6px 10px"}}><StandInLines rows={5} hi={2} tone="dark" /></div>}
  </div>
);

// A small card over your chest (Clean Wide): a label and a figure, like a price tag.
export const ChestCard: React.FC<{f: number; at: number; label: string; value?: string; top?: number}> = ({f, at, label, value, top = 1240}) => {
  const k = clamp(f, at, at + 6);
  return (
    <div style={{position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: lin(f, at, at + 3), transform: `translateY(${(1 - k) * 16}px)`}}>
      <div style={{display: "flex", alignItems: "center", gap: 18, padding: "16px 28px", borderRadius: 18, background: "rgba(255,255,255,0.94)", boxShadow: "0 12px 34px rgba(0,0,0,0.3)"}}>
        <span style={{fontFamily: FONT.inter, fontWeight: 600, fontSize: 40, color: C.ink}}>{label}</span>
        {value && <span style={{fontFamily: FONT.inter, fontWeight: 900, fontSize: 44, color: C.accent}}>{value}</span>}
      </div>
    </div>
  );
};

// A reel for the devices: your cover image or clip (9:16), with an optional view count; a numbered stand-in without one.
export type Reel = {src?: string | null; views?: number};
const one = (x: number) => {
  const v = Math.floor(x * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};
// Instagram's grid style: full figure under 10,000, then K, then M with one decimal (truncated, trailing .0 dropped).
export const viewCount = (n: number) => (n >= 1e6 ? `${one(n / 1e6)}M` : n >= 1e5 ? `${Math.floor(n / 1e3)}K` : n >= 1e4 ? `${one(n / 1e3)}K` : n.toLocaleString("en-US"));

export const ReelTile: React.FC<{reel: Reel; i: number; dim?: number; style?: React.CSSProperties; countSize?: number}> = ({reel, i, dim = 0, style, countSize = 34}) => {
  const isVideo = reel.src && /\.(mp4|webm|mov)$/i.test(reel.src);
  const shade = [["#3b3f47", "#1b1d21"], ["#4a4038", "#1f1a17"], ["#2f3a40", "#14191c"], ["#45393f", "#1d171a"], ["#393f36", "#181b16"]][i % 5];
  return (
    <div style={{position: "absolute", overflow: "hidden", backgroundColor: "#000", ...style}}>
      {reel.src ? (
        isVideo ? <OffthreadVideo src={resolve(reel.src)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
          : <Img src={resolve(reel.src)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      ) : (
        <div style={{width: "100%", height: "100%", background: `linear-gradient(160deg, ${shade[0]}, ${shade[1]})`, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <span style={{fontFamily: FONT.inter, fontWeight: 900, fontSize: 64, color: "rgba(255,255,255,0.16)", letterSpacing: "-0.03em"}}>{String(i + 1).padStart(2, "0")}</span>
        </div>
      )}
      {dim > 0 && <div style={{position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${dim})`}} />}
      {reel.views !== undefined && (
        <div style={{position: "absolute", left: 14, bottom: 14, display: "flex", alignItems: "center", gap: 7, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55)) drop-shadow(0 0 8px rgba(0,0,0,0.3))"}}>
          <svg width={countSize * 0.76} height={countSize * 0.82} viewBox="0 0 26 28">
            <path d="M5 3.6 L22 13.3 Q23.2 14 22 14.7 L5 24.4 Q3.6 25.2 3.6 23.6 V4.4 Q3.6 2.8 5 3.6 Z" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinejoin="round" />
          </svg>
          <span style={{fontFamily: FONT.inter, fontWeight: 600, fontSize: countSize, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1}}>{viewCount(reel.views)}</span>
        </div>
      )}
    </div>
  );
};
