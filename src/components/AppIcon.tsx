import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

/**
 * ── WHERE THE ICONS LIVE ─────────────────────────────────────────────────
 *
 * Every icon in this portal is a glyph from the **Ionicons** icon font, which
 * is bundled with the `@expo/vector-icons` package (already a dependency).
 *
 *   • Font file ......... node_modules/@expo/vector-icons/.../Fonts/Ionicons.ttf
 *   • Browse the library  https://ionic.io/ionicons (or the
 *     `Ionicons.glyphMap` import below in your editor's IntelliSense)
 *
 * Screens/components reference icons by NAME, e.g. `<Ionicons name="ticket" />`.
 * This module keeps ONE app-level map of the most-used icon names so a change
 * here updates the whole app. Prefer `APP_ICONS.*` in new code — it is
 * type-checked against real Ionicons names.
 *
 * Bookmarks/labels included below are helpers for icon-aware components.
 */
export const APP_ICONS = {
  home: 'home',
  menu: 'menu',
  close: 'close',
  search: 'search',
  download: 'download',
  documentText: 'document-text',
  ticket: 'ticket',
  calendar: 'calendar',
  grid: 'grid',
  list: 'list',
  person: 'person',
  personAdd: 'person-add',
  notifications: 'notifications',
  pulse: 'pulse',
  speedometer: 'speedometer',
  barChart: 'bar-chart',
  shieldCheckmark: 'shield-checkmark',
  logOut: 'log-out-outline',
  globe: 'globe',
  location: 'location',
  business: 'business',
  time: 'time',
  megaphone: 'megaphone',
  people: 'people',
  checkmarkCircle: 'checkmark-circle',
  checkmarkDone: 'checkmark-done',
  flag: 'flag',
  infoCircle: 'information-circle',
  receipt: 'receipt',
} as const satisfies Record<string, keyof typeof Ionicons.glyphMap>;

export type AppIconName = keyof typeof Ionicons.glyphMap;

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

/**
 * Thin, typed wrapper around Ionicons. Using `AppIcon` makes icon usage
 * discoverable and keeps the glyph font the single source of truth.
 */
export function AppIcon({ name, size = 20, color = '#0d47a1' }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Icon + label chip (used by menus and quick actions). */
export function IconLabel({ name, label }: { name: AppIconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <AppIcon name={name} size={14} />
      <Text>{label}</Text>
    </View>
  );
}