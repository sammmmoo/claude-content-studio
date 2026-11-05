// LOGO RAIN: white rounded tiles tumble down behind you from `enter`, each holding one of your logo images (the tools you
// use, your clients' marks if they've said yes, your own brand). Only logos you have the right to show. With no images the
// tiles carry a plain dot. Without a cut-out they fall in front of you.
import React from "react";
import {AbsoluteFill, Img, random, staticFile} from "remotion";
import {DeviceProps, DeviceShell, useDevice} from "./shell";
import {Cutout, Footage, hasCutout} from "../lib/Footage";
import {ACCENT} from "../lib/tokens";
import {lin, sec} from "../lib/time";

export type LogoRainProps = DeviceProps & {
  logos: string[]; // images in public/images/ ("images/claude.svg"); any shape, each is fitted inside its tile
  enter: number; // seconds: the rain starts
  count?: number; // tiles on screen (default 30)
};

const img = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

const Tiles: React.FC<{f: number; at: number; logos: string[]; count: number}> = ({f, at, logos, count}) => {
  const t = f - at;
  return (
    <AbsoluteFill style={{opacity: lin(t, 0, 8)}}>
      {Array.from({length: count}, (_, i) => {
        const far = i % 3 === 0, sz = far ? 92 : 128, v = (far ? 9 : 14) + 6 * random(`v${i}`);
        const span = 1920 + 400, y = ((random(`y${i}`) * span + v * (t + 40)) % span) - 200;
        const x = 30 + random(`x${i}`) * 1020 - sz / 2, rot = (random(`r${i}`) - 0.5) * 70 + (random(`s${i}`) - 0.5) * 4 * t;
        return (
          <div key={i} style={{position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: sz * 0.24, background: "#FFFFFF",
            transform: `rotate(${rot}deg)`, boxShadow: "0 10px 26px rgba(0,0,0,0.35)", opacity: far ? 0.9 : 1, display: "flex",
            alignItems: "center", justifyContent: "center", filter: far ? "blur(1.2px)" : undefined}}>
            {logos.length
              ? <Img src={img(logos[i % logos.length])} style={{width: sz * 0.56, height: sz * 0.56, objectFit: "contain"}} />
              : <div style={{width: sz * 0.3, height: sz * 0.3, borderRadius: "50%", background: ACCENT}} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const LogoRain: React.FC<LogoRainProps> = (p) => {
  const {f, face, framing, words} = useDevice(p);
  const at = sec(p.enter);
  return (
    <DeviceShell p={p} words={words} face={face}>
      <Footage src={p.footage} framing={framing} startFrom={p.startFrom} />
      {f >= at && <Tiles f={f} at={at} logos={p.logos ?? []} count={p.count ?? 30} />}
      {hasCutout(p.footage, p.cutout) && <Cutout src={p.footage} cutout={p.cutout} framing={framing} startFrom={p.startFrom} />}
    </DeviceShell>
  );
};
