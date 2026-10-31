// Your footage. `src` is a file in public/ ("footage/take1.mp4") or a URL; a vertical 9:16 clip fills the frame at
// framing {s: 1, ox: 0, oy: 0}. With no src you get a drawn stand-in (a person at a desk) so every template renders before
// you've filmed anything.
//
// The devices that put things BEHIND you (reel wall, feed scroll, reel orbit) need a cut-out of you: a WebM with alpha of
// the same clip, made with any background-removal tool (for example Robust Video Matting). Pass it as `cutout`. The
// stand-in has its own cut-out, so the demos show the effect.
import React from "react";
import {AbsoluteFill, Audio, OffthreadVideo, Video, staticFile} from "remotion";
import {H, W} from "./time";

// Where the 1080x1920 clip sits on screen: scale s, then its top-left corner at (ox, oy).
export type Framing = {s: number; ox: number; oy: number};
export const FULL: Framing = {s: 1, ox: 0, oy: 0};
export type Point = {x: number; y: number};

// The stand-in's face centre in clip pixels. With your own footage, pass your face position as `face` in the props.
export const STAND_IN_FACE: Point = {x: 540, y: 1070};

const resolve = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

// Scale a framing about a screen point (punch-ins, breathe): that point stays put.
export const scaleAbout = (fr: Framing, k: number, p: Point): Framing => ({s: fr.s * k, ox: p.x - (p.x - fr.ox) * k, oy: p.y - (p.y - fr.oy) * k});
export const mixFraming = (a: Framing, b: Framing, t: number): Framing => ({s: a.s + (b.s - a.s) * t, ox: a.ox + (b.ox - a.ox) * t, oy: a.oy + (b.oy - a.oy) * t});
// A clip point (e.g. your face) in screen pixels under a framing.
export const onScreen = (fr: Framing, p: Point): Point => ({x: fr.ox + p.x * fr.s, y: fr.oy + p.y * fr.s});

const Silhouette: React.FC<{tone: string}> = ({tone}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
    <path d="M150 1920 C170 1570 300 1400 450 1360 L470 1250 C400 1210 380 1130 382 1050 C384 910 450 860 540 860 C630 860 696 910 698 1050 C700 1130 680 1210 610 1250 L630 1360 C780 1400 910 1570 930 1920 Z" fill={tone} />
  </svg>
);

export const StandIn: React.FC<{cutout?: boolean}> = ({cutout = false}) => (
  <AbsoluteFill>
    {!cutout && (
      <AbsoluteFill style={{background: "radial-gradient(ellipse 900px 1100px at 420px 700px, #3a3d44 0%, #23252a 55%, #141518 100%)"}}>
        <div style={{position: "absolute", left: 0, right: 0, top: 1700, height: 220, background: "linear-gradient(#2c2420, #1d1714)"}} />
      </AbsoluteFill>
    )}
    <Silhouette tone="#6b7180" />
    {!cutout && <div style={{position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", fontFamily: "sans-serif", fontSize: 30, letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)"}}>
      YOUR FOOTAGE
    </div>}
  </AbsoluteFill>
);

const Frame: React.FC<{fr: Framing; children: React.ReactNode}> = ({fr, children}) => (
  <div style={{position: "absolute", left: fr.ox, top: fr.oy, width: W * fr.s, height: H * fr.s, overflow: "hidden"}}>
    <div style={{width: W, height: H, transform: `scale(${fr.s})`, transformOrigin: "0 0"}}>{children}</div>
  </div>
);

// The clip as shot. `startFrom` (seconds) skips into the file.
export const Footage: React.FC<{src: string | null; framing?: Framing; startFrom?: number; dim?: number}> = ({src, framing = FULL, startFrom = 0, dim = 0}) => (
  <AbsoluteFill>
    <Frame fr={framing}>
      {src ? (
        <OffthreadVideo src={resolve(src)} trimBefore={Math.round(startFrom * 30)} muted style={{width: W, height: H, objectFit: "cover"}} />
      ) : (
        <StandIn />
      )}
    </Frame>
    {dim > 0 && <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dim})`}} />}
  </AbsoluteFill>
);

// You, cut out (alpha). Renders nothing if you passed footage but no cut-out.
export const Cutout: React.FC<{src: string | null; cutout?: string | null; framing?: Framing; startFrom?: number; style?: React.CSSProperties}> = ({
  src,
  cutout,
  framing = FULL,
  startFrom = 0,
  style,
}) => {
  if (src && !cutout) return null;
  return (
    <AbsoluteFill style={style}>
      <Frame fr={framing}>
        {cutout ? (
          <Video src={resolve(cutout)} trimBefore={Math.round(startFrom * 30)} muted style={{width: W, height: H, objectFit: "cover"}} />
        ) : (
          <StandIn cutout />
        )}
      </Frame>
    </AbsoluteFill>
  );
};

export const hasCutout = (src: string | null, cutout?: string | null) => !src || !!cutout;

// Your voice: the clip's sound, once. Every picture layer of the clip is muted so copies never double the audio.
export const FootageAudio: React.FC<{src: string | null; startFrom?: number}> = ({src, startFrom = 0}) =>
  src ? <Audio src={resolve(src)} trimBefore={Math.round(startFrom * 30)} /> : null;
