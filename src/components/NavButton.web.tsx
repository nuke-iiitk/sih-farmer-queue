import { useState } from 'react';

import { useI18n } from '../i18n';
import type { NavButtonProps } from './NavButton';

/**
 * Web nav block — a real `<button>` with Bootstrap `.btn` classes:
 * rectangular outline buttons placed side by side with a gap. Metro resolves
 * this file instead of NavButton.tsx on web.
 */
export default function NavButton({ label, onPress, active, block }: NavButtonProps) {
  const { fs } = useI18n();
  const [pressed, setPressed] = useState(false);

  // Every item uses the same navy outline style (no filled/active variant).
  const classes = [
    'btn',
    'btn-outline-primary',
    'fpp-nav-btn',
    block && 'w-100',
    'd-inline-flex align-items-center justify-content-center text-nowrap',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      aria-current={active ? 'page' : undefined}
      onClick={onPress}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        fontSize: fs(block ? 14 : 13),
        padding: block ? '10px 14px' : '5px 13px',
        minHeight: block ? undefined : 34,
        transform: pressed ? 'scale(0.97)' : undefined,
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
    >
      <span>{label}</span>
    </button>
  );
}