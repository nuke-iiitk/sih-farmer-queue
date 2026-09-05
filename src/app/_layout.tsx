import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { FONT_STACK } from '../constants/theme';
import { I18nProvider } from '../i18n';
import { AppStoreProvider } from '../store/AppStore';

/**
 * Apply the portal typography site-wide on web.
 *
 * Arial is a system font — no @font-face, preload or fetched asset needed on
 * any platform, so the web shell stays lean. The universal rule deliberately
 * carries NO `!important`: a stylesheet `!important` would beat the inline
 * `font-family: 'Ionicons'` that icon glyphs require (PUA codepoints), making
 * every icon invisible. Without it, unstyled DOM inherits the stack while icon
 * components keep their own font via inline styles.
 */
function useWebTypography() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('fpp-global-font')) return;

    const css = `*, *::before, *::after{font-family:${FONT_STACK};}`;

    const style = document.createElement('style');
    style.id = 'fpp-global-font';
    style.textContent = css;
    document.head.appendChild(style);
  }, []);
}

export default function RootLayout() {
  useWebTypography();

  return (
    <I18nProvider>
      <AppStoreProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="about" />
          <Stack.Screen name="how-it-works" />
          <Stack.Screen name="centres" />
          <Stack.Screen name="help" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="booking" />
          <Stack.Screen name="queue" />
          <Stack.Screen name="bookings" />
          <Stack.Screen name="status" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="official" />
        </Stack>
      </AppStoreProvider>
    </I18nProvider>
  );
}
