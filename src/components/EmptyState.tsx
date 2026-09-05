import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export default function EmptyState({
  icon = 'file-tray',
  title,
  message,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { fs } = useI18n();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={44} color={Colors.borderDark} />
      <Text style={[styles.title, { fontSize: fs(18) }]}>{title}</Text>
      {message ? <Text style={[styles.message, { fontSize: fs(14) }]}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
  },
  title: {
    marginTop: Spacing.md,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  message: {
    marginTop: Spacing.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
