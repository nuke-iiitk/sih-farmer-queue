import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export type DropdownOption = { value: string; label: string };

type Props = {
  label: string;
  value: string | null;
  placeholder?: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  error?: string;
};

/** Accessible select input built on RN Modal (works on web + native). */
export default function DropdownSelect({
  label,
  value,
  placeholder,
  options,
  onSelect,
  error,
}: Props) {
  const { t, fs } = useI18n();
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { fontSize: fs(14) }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => undefined}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholder, { fontSize: fs(15) }]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder ?? t('common.search')}
        </Text>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        <View style={styles.optionsRow}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelect(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive, { fontSize: fs(13) }]}>
                  {active ? <Ionicons name="checkmark" size={12} color={Colors.primary} /> : null}
                  {' '}
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {error ? <Text style={[styles.error, { fontSize: fs(13) }]}>{error}</Text> : null}
    </View>
  );
}

/**
 * Note: options are rendered as horizontally scrollable chips instead of a
 * dropdown overlay — simpler, larger touch targets, and no Modal quirks on web.
 */

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  label: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  trigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  triggerError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  triggerText: {
    color: Colors.text,
    fontWeight: '600',
  },
  placeholder: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  optionsScroll: {
    marginTop: Spacing.sm,
    flexGrow: 0,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    minHeight: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionText: {
    color: Colors.text,
    fontWeight: '700',
  },
  optionTextActive: {
    color: Colors.primary,
  },
  error: {
    marginTop: Spacing.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
});
