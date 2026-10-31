// The zoom-out opener: frame 0 is punched in tight on your face (1.4x by default), then the camera pulls out fast to the
// rest framing in ~0.4 s on an S-curve, with ZoomBlur on the move. Everything inside rides the zoom; put the hook and
// captions OUTSIDE it so they stay in screen space. `face` is your face centre on screen at the rest framing: it stays put,
// so your whole head stays in frame at every scale.
import React from "react";
import {AbsoluteFill, Easing, useCurrentFrame} from "remotion";
import {ZoomBlur} from "./ZoomBlur";
import {Point} from "../lib/Footage";
import {clamp} from "../lib/time";

export type OpenerOptions = {scale?: number; frames?: number; face: Point};
const ease = Easing.bezier(0.55, 0, 0.3, 1);
export const openerScale = (t: number, o: OpenerOptions) => 1 + ((o.scale ?? 1.4) - 1) * (1 - clamp(t, 0, o.frames ?? 12, 0, 1, ease));

export const ZoomOutOpener: React.FC<OpenerOptions & {children: React.ReactNode; background?: string}> = ({children, background = "#000", ...o}) => {
  const f = useCurrentFrame();
  const frames = o.frames ?? 12;
  const layer = (t: number) => (
    <AbsoluteFill style={{backgroundColor: background, transform: `scale(${openerScale(t, o)})`, transformOrigin: `${o.face.x}px ${o.face.y}px`}}>
      {children}
    </AbsoluteFill>
  );
  return f < frames ? <ZoomBlur f={f} render={layer} /> : layer(f);
};
