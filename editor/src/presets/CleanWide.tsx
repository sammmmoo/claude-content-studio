// PRESET 6, CLEAN WIDE (inspired by Jun Yuh). One tripod, one clean bright spot, one take, centred, no cuts and no camera
// moves (so no opener or breathe here). A small lowercase title from frame 0, held; word-by-word white lowercase captions
// (each word appears as you say it); small cards over your chest, like price tags.
import React from "react";
import {AbsoluteFill} from "remotion";
import {PresetProps, usePreset} from "./common";
import {Captions} from "../house/Captions";
import {ChestCard} from "../objects/cards";
import {FULL, Footage, FootageAudio} from "../lib/Footage";
import {FONT} from "../lib/fonts";
import {sec} from "../lib/time";

export type CleanWideProps = PresetProps & {
  title: string;
  titleTop?: number;
  chestCards?: {from: number; to: number; label: string; value?: string}[];
  captionY?: number;
};

export const CleanWide: React.FC<CleanWideProps> = (p) => {
  const {f, words} = usePreset(p);
  const card = (p.chestCards ?? []).find((c) => f >= sec(c.from) && f < sec(c.to));
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <FootageAudio src={p.footage} startFrom={p.startFrom} />
      <Footage src={p.footage} framing={FULL} startFrom={p.startFrom} />
      <div style={{position: "absolute", left: 60, width: 960, top: p.titleTop ?? 300, textAlign: "center", fontFamily: FONT.montserrat, fontWeight: 800, fontSize: 64,
        letterSpacing: "-0.02em", color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.45), 0 0 3px rgba(0,0,0,0.5)"}}>
        {p.title.toLowerCase()}
      </div>
      {card && <ChestCard f={f} at={sec(card.from)} label={card.label} value={card.value} top={1340} />}
      <Captions f={f} words={words} style="clean" size={64} y={p.captionY ?? 1520} progressive yellow={p.highlight} bold={p.bold} from={0} />
    </AbsoluteFill>
  );
};
