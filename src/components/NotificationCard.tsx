import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import type { AppNotification } from '../data/mockData';

const ICONS: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  info: 'information-circle',
  warning: 'warning',
  error: 'alert-circle',
};

const COLORS: Record<AppNotification['type'], string> = {
  success: Colors.green,
  info: Colors.info,
  warning: Colors.warning,
  error: Colors.danger,
};

export default function NotificationCard({
  notification,
  timeLabel,
}: {
  notification: AppNotification;
  timeLabel: string;
}) {
  const { fs } = useI18n();
  const color = COLORS[notification.type];

  return (
    <View style={[styles.card, !notification.read && styles.unread]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name={ICONS[notification.type]} size={22} color={color} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: fs(15) }]}>{notification.title}</Text>
          {!notification.read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={[styles.message, { fontSize: fs(13) }]}>{notification.message}</Text>
        <Text style={[styles.time, { fontSize: fs(11) }]}>{timeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.saffron,
    backgroundColor: Colors.white,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '800',
    color: Colors.text,
    flexShrink: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.saffron,
  },
  message: {
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 2,
  },
  time: {
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },
});
