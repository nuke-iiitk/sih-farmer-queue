import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';

import { useI18n } from '../i18n';
import { BOOTSTRAP_VARIANT, WEB_FG, type AppButtonProps, type ButtonVariant } from './buttonShared';

export type { ButtonVariant, AppButtonProps };

/**
 * Web button — a real `<button>` element so Bootstrap's `.btn` classes apply
 * natively (hover/active/focus states, spinner, disabled styling). Metro
 * resolves this file instead of PrimaryButton.tsx on web builds.
 */
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  icon,
}: AppButtonProps) {
  const { fs } = useI18n();
  const [pressed, setPressed] = useState(false);
  const inactive = Boolean(disabled || loading);

  const classes = [
    BOOTSTRAP_VARIANT[variant],
    small ? 'btn-sm' : '',
    inactive ? 'disabled' : '',
    'd-inline-flex align-items-center justify-content-center gap-2',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={inactive}
      aria-busy={loading || undefined}
      onClick={() => {
        if (!inactive) onPress();
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{ minHeight: small ? 40 : 48, opacity: inactive ? 0.45 : pressed ? 0.85 : 1 }}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={WEB_FG[variant]}
            />
          ) : null}
          <span style={{ fontSize: fs(small ? 14 : 16), fontWeight: 700, letterSpacing: '0.5px' }}>
            {label}
          </span>
        </>
      )}
    </button>
  );
}

export function SecondaryButton(props: AppButtonProps) {
  return <PrimaryButton {...props} variant="secondary" />;
}
