import Ionicons from '@expo/vector-icons/Ionicons';

type NativeProps = {
  /** Bootstrap Icons glyph class, e.g. 'bi-house-door' (used on web only). */
  name: string;
  /** Ionicons fallback for native platforms, e.g. 'home'. */
  fallback: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
};

/**
 * Icon component that renders a Bootstrap Icons glyph on web and an Ionicons
 * fallback on iOS/Android (Metro swaps to BootstrapIcon.web.tsx on web).
 */
export default function BootstrapIcon({
  name: _name,
  fallback,
  size = 16,
  color,
}: NativeProps) {
  return <Ionicons name={fallback} size={size} color={color} />;
}