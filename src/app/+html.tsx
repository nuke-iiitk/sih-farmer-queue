import Constants from 'expo-constants';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only HTML shell.
 * Loads Bootstrap 5 + Bootstrap Icons + the portal brand theme from /public
 * (never bundled into JS). Arial is a system font, so no font downloads are
 * needed — the head stays lean and paints immediately.
 *
 * On GitHub Pages the site is served under the repo path (experiments.baseUrl
 * in app.json, e.g. /sih-farmer-queue), so the asset hrefs must be prefixed
 * with that path — otherwise the root-absolute URLs would 404.
 */
const IS_DEV = process.env.NODE_ENV === 'development';
const BASE_URL = IS_DEV ? '' : (Constants.expoConfig?.experiments?.baseUrl ?? '');

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0d47a1" />
        <ScrollViewStyleReset />
        <link rel="stylesheet" href={`${BASE_URL}/bootstrap.min.css`} />
        <link rel="stylesheet" href={`${BASE_URL}/bootstrap-icons.css`} />
        <link rel="stylesheet" href={`${BASE_URL}/bootstrap-theme.css`} />
      </head>
      <body>{children}</body>
    </html>
  );
}