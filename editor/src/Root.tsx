// Every template, 1080x1920 at 30 fps. Length follows your words (last word + 0.4 s) unless you set durationInSeconds.
import React from "react";
import {CalculateMetadataFunction, Composition, Folder} from "remotion";
import * as demo from "./demo";
import {FeedScroll} from "./devices/FeedScroll";
import {Pyramid} from "./devices/Pyramid";
import {ReelOrbit} from "./devices/ReelOrbit";
import {ReelWall} from "./devices/ReelWall";
import {CleanWide} from "./presets/CleanWide";
import {HeadBand} from "./presets/HeadBand";
import {RedBox} from "./presets/RedBox";
import {TopCard} from "./presets/TopCard";
import {WalkShow} from "./presets/WalkShow";
import {Wall} from "./presets/Wall";
import {FPS, H, W} from "./lib/time";
import {SpokenWord, durationFromWords} from "./lib/words";
import "./lib/fonts";

type Timed = {words: SpokenWord[]; durationInSeconds?: number};
const fit: CalculateMetadataFunction<Timed> = ({props}) => ({
  durationInFrames: props.durationInSeconds ? Math.round(props.durationInSeconds * FPS) : durationFromWords(props.words),
});

// One composition per template. Props are loosely typed here so you can pass JSON with --props.
const comp = <P extends Timed>(id: string, component: React.FC<P>, defaultProps: P) => (
  <Composition
    id={id}
    component={component as unknown as React.FC<Record<string, unknown>>}
    defaultProps={defaultProps as unknown as Record<string, unknown>}
    calculateMetadata={fit as unknown as CalculateMetadataFunction<Record<string, unknown>>}
    durationInFrames={300}
    fps={FPS}
    width={W}
    height={H}
  />
);

export const Root: React.FC = () => (
  <>
    <Folder name="Presets">
      {comp("Wall", Wall, demo.wall)}
      {comp("TopCard", TopCard, demo.topCard)}
      {comp("HeadBand", HeadBand, demo.headBand)}
      {comp("RedBox", RedBox, demo.redBox)}
      {comp("WalkShow", WalkShow, demo.walkShow)}
      {comp("CleanWide", CleanWide, demo.cleanWide)}
    </Folder>
    <Folder name="Devices">
      {comp("ReelWall", ReelWall, demo.reelWall)}
      {comp("FeedScroll", FeedScroll, demo.feedScroll)}
      {comp("ReelOrbit", ReelOrbit, demo.reelOrbit)}
      {comp("Pyramid", Pyramid, demo.pyramid)}
    </Folder>
  </>
);
