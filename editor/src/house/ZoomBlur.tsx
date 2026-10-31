// Zoom blur for the opener. Every frame gets `samples` copies over a shutter centred on the frame; only the zoom moves
// between them (render(t) gets a fractional time for the transform, while video and graphics stay on the real frame).
//
// Why not @remotion/motion-blur's CameraMotionBlur: it caps its samples near frame 0, so the first frames get one or three
// whole copies and show stepped rings round your head. And why a running average: stacking layers at opacity 1/n bakes
// 1/n into each 8-bit layer and posterises into flat bands. Layer i at opacity 1/(i+1) over the ones below is the same mean,
// rounded once per step. Every render(t) must be an opaque full frame.
import React from "react";
import {AbsoluteFill} from "remotion";

export const ZoomBlur: React.FC<{f: number; render: (t: number) => React.ReactNode; samples?: number; shutter?: number}> = ({f, render, samples = 24, shutter = 0.75}) => (
  <AbsoluteFill>
    {Array.from({length: samples}, (_, i) => (
      <AbsoluteFill key={i} style={{opacity: 1 / (i + 1)}}>
        {render(f + shutter * ((i + 0.5) / samples - 0.5))}
      </AbsoluteFill>
    ))}
  </AbsoluteFill>
);
