import Constants from 'expo-constants';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { FONT_STACK } from '../constants/theme';

/**
 * Web-only HTML shell.
 * Loads IBM Plex Sans + Bootstrap 5 + Bootstrap Icons + the portal brand theme
 * from /public (never bundled into JS). The typeface is self-hosted: the woff2
 * files carry per-script unicode-ranges, so a browser fetches only the subsets
 * the page actually renders, and the two faces every page uses (regular body
 * text and bold headings) are preloaded to avoid a swap flash.
 *
 * On GitHub Pages the site is served under the repo path (experiments.baseUrl
 * set from EXPO_PUBLIC_BASE_PATH, e.g. /NLAMP), so the asset hrefs must be
 * prefixed with that path — otherwise the root-absolute URLs would 404.
 */
const IS_DEV = process.env.NODE_ENV === 'development';
const BASE_URL = IS_DEV ? '' : (Constants.expoConfig?.experiments?.baseUrl ?? '');

/**
 * Site-wide typography, inlined into every page's <head> at build time.
 *
 * Two rules, because two kinds of declaration have to be outranked:
 *   1. `*` covers inherited/default styling (specificity 0). Not enough alone:
 *      RN Web's component classes beat it.
 *   2. `body *[class]` outranks those single-class rules. RN Web ships its Text
 *      base style as `font: '14px System'` (react-native-web Text/index.js),
 *      which browsers expand to `-apple-system, BlinkMacSystemFont, …` and
 *      apply to every text element through one generated class — so even with
 *      the exact same typography in the style layer, text kept rendering in the
 *      system stack. A specificity tie is not enough either: RN Web appends new
 *      atomic rules as the app navigates, so the win must be by merit, not by
 *      source order.
 *
 * Neither rule uses `!important`: that would beat the inline `font-family` that
 * icon glyphs need (PUA codepoints from bootstrap-icons), turning every icon
 * into a missing-glyph box, and it would override the intentionally monospaced
 * GIS coordinate readout. Inline styles — how both of those are applied —
 * therefore keep winning.
 *
 * Living in the shell rather than in a component effect means the rule is part
 * of the first paint: no flash of the browser default serif while JS boots.
 */
const TYPOGRAPHY_CSS = [
  `*, *::before, *::after{font-family:${FONT_STACK};}`,
  `body *[class]{font-family:${FONT_STACK};}`,
].join('\n');

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0d47a1" />
        <ScrollViewStyleReset />
        {/* Self-hosted IBM Plex Sans — must precede Bootstrap so the theme layer
            and Bootstrap tokens can both reference the family. */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href={`${BASE_URL}/fonts/ibm-plex-sans-latin-400-normal.woff2`} />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href={`${BASE_URL}/fonts/ibm-plex-sans-latin-700-normal.woff2`} />
        <link rel="stylesheet" href={`${BASE_URL}/ibm-plex.css`} />
        <link rel="stylesheet" href={`${BASE_URL}/bootstrap.min.css`} />
        <link rel="stylesheet" href={`${BASE_URL}/bootstrap-icons.css`} />
        <link rel="stylesheet" href={`${BASE_URL}/bootstrap-theme.css`} />
        {/* Last, so it also outranks Bootstrap's element-level font rules. */}
        <style id="portal-typography" dangerouslySetInnerHTML={{ __html: TYPOGRAPHY_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}