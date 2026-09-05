import { useI18n } from '../i18n';

/**
 * Web demo badge — a real `<span class="badge">` so Bootstrap's badge
 * styling applies. Metro resolves this file instead of DemoBadge.tsx on web.
 */
export default function DemoBadge({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <span
      className="badge text-bg-warning"
      style={{ fontSize: 10, letterSpacing: '0.4px', verticalAlign: 'middle' }}
    >
      {label ?? t('common.mockData')}
    </span>
  );
}
