import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n';
import type { BookingStatus, CentreStatus, QueueEntryStatus } from '../data/mockData';

type AnyStatus = BookingStatus | QueueEntryStatus | CentreStatus;

const TONES: Record<AnyStatus, { bg: string; fg: string }> = {
  // bookings
  Upcoming: { bg: Colors.primaryLight, fg: Colors.primary },
  Waiting: { bg: Colors.saffronLight, fg: Colors.saffronDark },
  'Your Turn': { bg: Colors.greenLight, fg: Colors.green },
  Processing: { bg: Colors.infoLight, fg: Colors.info },
  Completed: { bg: Colors.greenLight, fg: Colors.success },
  Cancelled: { bg: Colors.dangerLight, fg: Colors.danger },
  // queue entries
  Called: { bg: Colors.infoLight, fg: Colors.info },
  'On Hold': { bg: Colors.surfaceAlt, fg: Colors.textSecondary },
  // centres -> simple Open / Closed colour coding
  Open: { bg: Colors.greenLight, fg: Colors.green },
  Busy: { bg: Colors.greenLight, fg: Colors.green },
  Full: { bg: Colors.warningLight, fg: Colors.warning },
  Closed: { bg: Colors.surfaceAlt, fg: Colors.textMuted },
};

/** Centre statuses are shown as just "Open" or "Closed". */
const CENTRE_LABEL: Record<CentreStatus, TranslationKey> = {
  Open: 'status.centresOpen',
  Busy: 'status.centresOpen',
  Full: 'status.centresOpen',
  Closed: 'status.centresClosed',
};

export default function StatusBadge({
  status,
  translatedLabel,
  small,
}: {
  status: AnyStatus;
  /** Optional pre-translated label; defaults to status.translationKey lookup. */
  translatedLabel?: string;
  small?: boolean;
}) {
  const { t, fs } = useI18n();
    const tone = TONES[status] ?? TONES.Upcoming;
  // Centre statuses map to simple Open/Closed labels; other statuses use the
  // `status.<Status>` translation key (no more broken "status.Open" lookups).
  const isCentre = status === 'Open' || status === 'Busy' || status === 'Full' || status === 'Closed';
  const label = translatedLabel ?? (isCentre ? t(CENTRE_LABEL[status as CentreStatus]) : t(`status.${status}` as never));

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: tone.bg },
        small && styles.small,
      ]}
      accessibilityLabel={`${label}`}
    >
      <Text style={[styles.label, { color: tone.fg, fontSize: fs(small ? 11 : 12) }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontWeight: '700',
  },
});

