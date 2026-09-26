import { usePathname } from 'expo-router';

import { useI18n } from '../i18n';
import { path } from '../navigation';
import type { Crumb } from './Breadcrumbs';
import Link from './Link';

/**
 * Web breadcrumb — real Bootstrap `<nav aria-label="breadcrumb"><ol>`.
 * Metro resolves this file instead of Breadcrumbs.tsx on web.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = useI18n();
  const pathname = usePathname();

  // A Home crumb is always rendered first below — screens that also pass an
  // explicit Home entry would otherwise render it twice.
  const crumbs = items.filter((crumb) => crumb.href !== path.home);

  return (
    <nav aria-label="breadcrumb" className="breadcrumb-wrap">
      <ol className="breadcrumb mb-0 px-3 py-2">
        <Link href={path.home as string} variant="breadcrumb" label={t('nav.home')} />
        {crumbs.map((crumb, index) => {
          const last = index === items.length - 1 || crumb.href === pathname;
          if (crumb.href && !last) {
            return (
              <Link
                key={`${crumb.label}-${index}`}
                href={crumb.href}
                variant="breadcrumb"
                label={crumb.label}
              />
            );
          }
          return (
            <li key={`${crumb.label}-${index}`} className="breadcrumb-item active" aria-current="page">
              <span>{crumb.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
