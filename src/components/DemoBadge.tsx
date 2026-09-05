import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius } from '../constants/theme';
import { useI18n } from '../i18n';

/** Small label marking demo/mock data, shown wherever live-looking data appears. */
export default function DemoBadge({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.badge} accessibilityElementsHidden>
      <Text style={styles.text}>{label ?? t('common.mockData')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

