import { router, type Href } from 'expo-router';

import { AppIcon } from './AppIcon';
import type { ButtonVariant, ButtonProps } from './Button';

/**
 * Bootstrap classes per variant. These are the *only* styles applied to
 * buttons on the website — no bespoke button CSS, so hover, active, focus,
 * disabled and sizing behaviour all come from Bootstrap.
 */
const BOOTSTRAP_VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  'outline-primary': 'btn btn-outline-primary',
  'outline-secondary': 'btn btn-outline-secondary',
  success: 'btn btn-success',
  danger: 'btn btn-danger',
  link: 'btn btn-link',
  ghost: 'btn btn-light border',
  nav: 'nav-link p-0',
};

type Props = ButtonProps;

/**
 * Web button: a real `<button class="btn …">` (or `<a class="nav-link">` for
 * navigation) so Bootstrap supplies every visual state. Metro resolves this
 * file instead of Button.tsx on web.
 */
export default function Button({
  label,
  children,
  description,
  onPress,
  variant = 'primary',
  href,
  active = false,
  disabled = false,
  loading = false,
  small = false,
  icon,
  leading,
  iconOnly = false,
  after,
  className = '',
  expanded,
  haspopup,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const showLabel = !iconOnly;
  const inactive = disabled || loading;

  const classes = [
    BOOTSTRAP_VARIANT[variant],
    active && 'active',
    small && 'btn-sm',
    loading && 'disabled',
    'd-inline-flex align-items-center justify-content-center gap-2 text-start',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (event: React.MouseEvent) => {
    if (inactive) {
      event.preventDefault();
      return;
    }
    if (href) event.preventDefault();
    onPress?.();
    if (!onPress && href) router.push(href as Href);
  };

  const content = (
    <>
      {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
      {leading}
      {icon ? <AppIcon name={icon} size={small ? 14 : 18} /> : null}
      {showLabel ? (
        <span>
          {label ?? children}
          {description ? <small className="d-block fw-normal">{description}</small> : null}
        </span>
      ) : null}
      {after}
    </>
  );

  // Navigation control: an anchor so the target is visible in the status bar,
  // openable in a new tab, and handled by the router on plain clicks.
  if (href) {
    return (
      <a
        href={typeof href === 'string' ? href : String(href)}
        className={classes}
        onClick={handleClick}
        aria-current={active ? 'page' : undefined}
        aria-label={accessibilityLabel}
        aria-disabled={inactive || undefined}
        tabIndex={inactive ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={inactive}
      aria-current={active ? 'page' : undefined}
      aria-expanded={expanded}
      aria-haspopup={haspopup ? 'true' : undefined}
      aria-busy={loading || undefined}
      aria-label={accessibilityLabel}
      aria-description={accessibilityHint}
      title={iconOnly ? accessibilityLabel ?? label : undefined}
      onClick={handleClick}
      style={iconOnly ? { minWidth: 40 } : undefined}
    >
      {content}
    </button>
  );
}
