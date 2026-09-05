import type { CSSProperties } from 'react';

type WebProps = {
  /** Bootstrap Icons glyph class, e.g. 'bi-house-door'. */
  name: string;
  /** Ionicons fallback name — ignored on web but keeps props consistent. */
  fallback?: string;
  size?: number;
  color?: string;
};

/**
 * Web icon — a real `<i className="bi …">` element so Bootstrap Icons render
 * (the glyph font is declared in /public/bootstrap-icons.css linked from the
 * HTML shell). Metro resolves this file instead of BootstrapIcon.tsx on web.
 */
export default function BootstrapIcon({
  name,
  fallback: _fallback,
  size = 16,
  color,
}: WebProps) {
  const style: CSSProperties = { fontSize: size, lineHeight: 1 };
  if (color) style.color = color;
  return <i className={`bi ${name}`} style={style} aria-hidden="true" />;
}