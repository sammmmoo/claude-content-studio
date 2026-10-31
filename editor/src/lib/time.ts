// Timing helpers shared by every component. Props are in seconds (the way faster-whisper writes them); components work in
// frames. Everything renders at 30 fps, 1080x1920.
import React from "react";
import {Easing, interpolate} from "remotion";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const sec = (s: number) => Math.round(s * FPS);

// Smooth settle with no overshoot: the house ease for anything arriving.
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const clamp = (f: number, a: number, b: number, from = 0, to = 1, easing: (x: number) => number = EASE) => {
  if (b <= a) return f < a ? from : to;
  return interpolate(f, [a, b], [from, to], {easing, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
};
export const lin = (f: number, a: number, b: number, from = 0, to = 1) => clamp(f, a, b, from, to, Easing.linear);
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// Entrance for graphic parts: rises a little and sharpens from a blur. Never bounces.
export const enter = (f: number, at: number, dur = 7, dy = 22, fromScale = 0.94): React.CSSProperties => {
  const k = clamp(f, at, at + dur);
  return {
    opacity: lin(f, at, at + Math.max(2, dur * 0.45)),
    transform: `translateY(${(1 - k) * dy}px) scale(${fromScale + (1 - fromScale) * k})`,
    filter: k < 0.98 ? `blur(${(1 - k) * 7}px)` : undefined,
  };
};
export const leave = (f: number, at: number, dur = 5): React.CSSProperties => {
  const k = clamp(f, at, at + dur, 0, 1, Easing.in(Easing.cubic));
  return {opacity: 1 - k, transform: `scale(${1 - 0.05 * k})`, filter: k > 0.02 ? `blur(${k * 6}px)` : undefined};
};

// A thing that is on screen from `from` to `to` seconds.
export type Span = {from: number; to: number};
export const inSpan = (spans: Span[] | undefined, f: number) => (spans ?? []).some((s) => f >= sec(s.from) && f < sec(s.to));
