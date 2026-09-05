import Ionicons from '@expo/vector-icons/Ionicons';

import { BOOTSTRAP_TONE, TONES, type AlertBannerProps, type Tone } from './alertShared';

export type { Tone };

/**
 * Web alert — a real `<div class="alert alert-*">` so Bootstrap's alert
 * styling applies. Metro resolves this file instead of AlertBanner.tsx on web.
 */
export default function AlertBanner({
  tone = 'info',
  title,
  message,
  icon,
}: AlertBannerProps) {
  const colors = TONES[tone];
  return (
    <div
      role="alert"
      className={`${BOOTSTRAP_TONE[tone]} d-flex align-items-start gap-3`}
    >
      <Ionicons
        name={(icon ?? colors.icon) as keyof typeof Ionicons.glyphMap}
        size={20}
        color={colors.fg}
        style={{ marginTop: 2 }}
      />
      <div className="flex-grow-1">
        {title ? <div className="fw-bold" style={{ marginBottom: 2 }}>{title}</div> : null}
        <div>{message}</div>
      </div>
    </div>
  );
}
