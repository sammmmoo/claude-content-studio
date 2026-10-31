// Bundled fonts, all under the SIL Open Font License (licence files sit next to them in public/fonts).
// Montserrat and TikTok Sans: captions and hooks. Inter: UI, cards, the phone. Instrument Serif italic: accents.
// Every composition holds its render until these are in, so frame 0 never shows a fallback font.
import {loadFont} from "@remotion/fonts";
import {continueRender, delayRender, cancelRender, staticFile} from "remotion";

export const FONT = {
  montserrat: "Studio Montserrat",
  tiktok: "Studio TikTok Sans",
  inter: "Studio Inter",
  serif: "Studio Serif",
};

let loaded: Promise<unknown> | null = null;
export const loadFonts = () => {
  loaded =
    loaded ??
    Promise.all([
      loadFont({family: FONT.montserrat, url: staticFile("fonts/Montserrat-var.ttf"), weight: "100 900", display: "block"}),
      loadFont({family: FONT.montserrat, url: staticFile("fonts/Montserrat-Italic-var.ttf"), weight: "100 900", style: "italic", display: "block"}),
      loadFont({family: FONT.tiktok, url: staticFile("fonts/TikTokSans-var.ttf"), weight: "300 900", display: "block"}),
      loadFont({family: FONT.inter, url: staticFile("fonts/Inter-Regular.ttf"), weight: "400", display: "block"}),
      loadFont({family: FONT.inter, url: staticFile("fonts/Inter-SemiBold.ttf"), weight: "600", display: "block"}),
      loadFont({family: FONT.inter, url: staticFile("fonts/Inter-Bold.ttf"), weight: "700", display: "block"}),
      loadFont({family: FONT.inter, url: staticFile("fonts/Inter-Black.ttf"), weight: "900", display: "block"}),
      loadFont({family: FONT.serif, url: staticFile("fonts/InstrumentSerif-Italic.ttf"), weight: "400", style: "italic", display: "block"}),
    ]);
  return loaded;
};

const handle = delayRender("Loading fonts");
loadFonts()
  .then(() => continueRender(handle))
  .catch((e) => cancelRender(e));
