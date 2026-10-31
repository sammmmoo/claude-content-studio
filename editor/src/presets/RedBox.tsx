// PRESET 4, RED BOX (inspired by Alex Hormozi). Frame 0: a red rounded box with the viewer's question in white bold
// capitals, in quotes, lower half, already complete. Then small white lowercase subtitles, bold key word, yellow italics
// for numbers and quotes. Almost no graphics. The only cuts are between a wide and a close framing of the same shot (crop
// a 4K clip). The car preset: phone on the dash, parked, one take.
import React from "react";
import {AbsoluteFill} from "remotion";
import {OPEN, PresetProps, usePreset} from "./common";
import {Captions} from "../house/Captions";
import {HookBlock} from "../house/HookBlock";
import {ZoomOutOpener} from "../house/Opener";
import {Footage, scaleAbout, FootageAudio} from "../lib/Footage";
import {sec} from "../lib/time";

export type RedBoxProps = PresetProps & {
  question: string[]; // the box's lines, capitals, no quote marks
  boxUntil: number; // seconds: the box leaves on a cut
  boxTop?: number; // px: under your chin; above your head if your face sits low
  close?: {from: number; to: number}[]; // seconds on the close framing; wide the rest of the time
  subY?: number; // px: centre of the subtitle line
};

export const RedBox: React.FC<RedBoxProps> = (p) => {
  const {f, face, framing, words} = usePreset(p);
  const close = (p.close ?? []).some((c) => f >= sec(c.from) && f < sec(c.to));
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <ZoomOutOpener face={face} frames={OPEN}>
        <Footage src={p.footage} framing={scaleAbout(framing, close ? 1.28 : 1, face)} startFrom={p.startFrom} />
      </ZoomOutOpener>
      <HookBlock f={f} lines={p.question} style="clean" until={sec(p.boxUntil)} top={p.boxTop ?? 1330} size={72} quotes />
      <Captions f={f} words={words} style="clean" y={p.subY ?? 1420} from={sec(p.boxUntil)} yellow={p.highlight} bold={p.bold} />
    </AbsoluteFill>
  );
};
