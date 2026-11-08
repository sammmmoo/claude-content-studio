// TIER LIST: a tier board fades in above your head at `enter` and each item drops into its row at its own time (time
// them to the words where you say them). With a cut-out the board sits behind you; without one it sits in front. Items
// are your words on white tiles, or a logo/image of yours (`image`, a file in public/).
import React from "react";
import {Easing, Img} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, hasCutout, resolve} from "../lib/Footage";
import {clamp, sec} from "../lib/time";

export type TierItem = {text: string; tier: number; at: number; image?: string}; // tier 0 = the top row; at = seconds
export type TierListProps = DeviceProps & {
  title: string; // above the board, e.g. "AI TOOLS, RANKED" ("" for none)
  enter: number; // seconds: the board appears
  items: TierItem[];
  rows?: {label: string; color: string}[]; // top to bottom; default S, A, B, C
  top?: number; // px from the top of the screen to the board (default 330: clear of a head in the middle of the frame)
};

const ROWS = [{label: "S", color: "#E8604F"}, {label: "A", color: "#EE9A3C"}, {label: "B", color: "#EDC54A"}, {label: "C", color: "#97C26A"}];
const X = 60, BW = 960, TITLE = 66, GAP = 9, TILE = 112, FALL = 6;

export const TierList: React.FC<TierListProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const rows = p.rows ?? ROWS, top = p.top ?? 330, e = sec(p.enter);
  const rowH = rows.length > 4 ? Math.round(536 / rows.length) : 134, tile = Math.min(TILE, rowH - 22);
  const rowY = (i: number) => top + (p.title ? TITLE : 14) + 6 + i * (rowH + GAP);
  const op = clamp(f, e, e + 6, 0, 1, Easing.out(Easing.cubic));
  const board = (
    <div style={{position: "absolute", inset: 0}}>
      <div style={{position: "absolute", left: X, top, width: BW, height: rowY(rows.length) - top + 6, borderRadius: 28, opacity: op,
        background: "rgba(16,16,18,0.86)", border: "1.5px solid rgba(255,255,255,0.10)", transform: `translateY(${(1 - op) * 30}px) scale(${0.96 + 0.04 * op})`}}>
        {p.title && <div style={{position: "absolute", left: 24, top: 14, fontFamily: "Inter, Arial, sans-serif", fontWeight: 700, fontSize: 34,
          letterSpacing: 1, color: "rgba(255,255,255,0.9)"}}>{p.title}</div>}
      </div>
      {rows.map((r, i) => {
        const a = clamp(f, e + 2 + 2 * i, e + 8 + 2 * i, 0, 1, Easing.out(Easing.cubic));
        const hit = p.items.find((it) => it.tier === i && f >= sec(it.at) && f < sec(it.at) + 5);
        const pulse = hit ? 1 + 0.07 * Math.sin((Math.PI * (f - sec(hit.at))) / 5) : 1;
        return (
          <div key={i} style={{position: "absolute", left: X + 10, top: rowY(i), width: BW - 20, height: rowH, opacity: a, transform: `translateX(${(1 - a) * -60}px)`}}>
            <div style={{position: "absolute", left: 0, top: 0, width: rowH, height: rowH, borderRadius: 16, background: r.color, transform: `scale(${pulse})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, Arial, sans-serif", fontWeight: 800,
              fontSize: Math.round(rowH * 0.57), color: "#141416"}}>{r.label}</div>
            <div style={{position: "absolute", left: rowH + 8, top: 0, right: 0, height: rowH, borderRadius: 16, background: "rgba(255,255,255,0.05)"}} />
          </div>
        );
      })}
      {p.items.map((it, j) => {
        const at = sec(it.at);
        if (f < at - FALL || it.tier < 0 || it.tier >= rows.length) return null;
        const q = clamp(f, at - FALL, at, 0, 1, Easing.in(Easing.quad));
        const land = f >= at ? clamp(f, at, at + 5, 1.18, 1, Easing.out(Easing.back(2))) : 1.18;
        const w = it.image ? tile : Math.max(tile, 40 + 22 * it.text.length);
        const prev = p.items.filter((x, k) => k < j && x.tier === it.tier).reduce((s, x) => s + (x.image ? tile : Math.max(tile, 40 + 22 * x.text.length)) + 14, 0);
        return (
          <div key={j} style={{position: "absolute", left: X + 10 + rowH + 22 + prev, top: rowY(it.tier) + (rowH - tile) / 2 - (1 - q) * 300, width: w, height: tile,
            borderRadius: tile * 0.24, background: "#FFFFFF", boxShadow: "0 10px 24px rgba(0,0,0,0.4)", opacity: Math.min(1, q * 3), transform: `scale(${land})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, Arial, sans-serif", fontWeight: 800, fontSize: 34, color: "#141416",
            padding: it.image ? 0 : "0 20px", boxSizing: "border-box", whiteSpace: "nowrap"}}>
            {it.image ? <Img src={resolve(it.image)} style={{width: tile * 0.62, height: tile * 0.62, objectFit: "contain"}} /> : it.text}
          </div>
        );
      })}
    </div>
  );
  const behind = hasCutout(p.footage, p.cutout);
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} />
      {board}
      {behind && <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={p.startFrom} />}
    </DeviceShell>
  );
};
