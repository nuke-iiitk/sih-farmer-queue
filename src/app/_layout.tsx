import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from '../i18n';
import { AppStoreProvider } from '../store/AppStore';

/**
 * Site-wide IBM Plex Sans is pinned by the inlined rule in app/+html.tsx, so it
 * is in place at first paint — see the TYPOGRAPHY_CSS comment there for why it
 * needs two selectors and no `!important`.
 */
export default function RootLayout() {
  return (
    <I18nProvider>
      <AppStoreProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="about" />
          <Stack.Screen name="how-it-works" />
          <Stack.Screen name="centres" />
          <Stack.Screen name="prices" />
          <Stack.Screen name="payments" />
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
          <Stack.Screen name="official/ops" />
        </Stack>
      </AppStoreProvider>
    </I18nProvider>
  );
}
