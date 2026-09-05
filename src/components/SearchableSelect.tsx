import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string | null;
  placeholder?: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  /** Called when the inline × clear control is pressed (defaults to `onSelect('')`). */
  onClear?: () => void;
  disabled?: boolean;
  /** Small monochrome label icon, e.g. `flag`, `location`, `business`. */
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Message shown when the option list is empty. */
  emptyMessage?: string;
  searchPlaceholder?: string;
};

const OPTION_HEIGHT = 48;
const LIST_MAX_HEIGHT = 320;

/**
 * Searchable single-select combobox (Modal-based, works on web + native).
 *
 * Intentionally close to the design-system form controls: same 52px trigger
 * height, thin borders, small radii and the site's navy/saffron accents.
 * Keyboard support: Type to filter, ↑/↓ to move, Enter to choose, Esc to close.
 */
export default function SearchableSelect({
  label,
  value,
  placeholder,
  options,
  onSelect,
  onClear,
  disabled,
  icon,
  error,
  hint,
  required,
  emptyMessage,
  searchPlaceholder,
}: Props) {
  const { t, fs } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        option.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const close = useCallback(() => setOpen(false), []);

  const choose = useCallback(
    (option: SelectOption) => {
      onSelect(option.value);
      setOpen(false);
    },
    [onSelect]
  );

  const clearSelection = useCallback(() => {
    if (onClear) onClear();
    else onSelect('');
  }, [onClear, onSelect]);

  /** Reset search + highlight the current pick when the panel opens. */
  const openSelect = () => {
    if (disabled) return;
    const seed = value ? options.findIndex((o) => o.value === value) : 0;
    setQuery('');
    setActiveIndex(seed >= 0 ? seed : 0);
    setOpen(true);
  };

  /** Focus the search box and keep the chosen item visible once open. */
  useEffect(() => {
    if (!open) return;
    const seed = value ? options.findIndex((o) => o.value === value) : 0;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 80);
    const scrollTimer = setTimeout(() => {
      if (seed >= 0) {
        scrollRef.current?.scrollTo({ y: seed * OPTION_HEIGHT, animated: false });
      }
    }, 120);
    return () => {
      clearTimeout(focusTimer);
      clearTimeout(scrollTimer);
    };
  }, [open, options, value]);

  /** Keep the highlighted option in view while arrow-navigating. */
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ y: activeIndex * OPTION_HEIGHT, animated: true });
  }, [activeIndex, open]);

  /** Global keyboard handling for combobox behaviour on the web. */
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === 'Enter') {
        const option = filtered[activeIndex];
        if (option) {
          event.preventDefault();
          choose(option);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, filtered, activeIndex, choose, close]);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { fontSize: fs(14) }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t('centres.openListHint')}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={openSelect}
        style={({ pressed }) => [
          styles.trigger,
          disabled && styles.triggerDisabled,
          error ? styles.triggerError : null,
          pressed && !disabled && styles.triggerPressed,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={disabled ? Colors.textMuted : Colors.primary}
            style={styles.triggerIcon}
          />
        ) : null}

        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            !selected && styles.placeholderText,
            disabled && styles.placeholderText,
            { fontSize: fs(15) },
          ]}
        >
          {selected ? selected.label : placeholder ?? t('centres.selectHint')}
        </Text>

        <View style={styles.triggerActions}>
          {value ? (
            <Pressable
              accessibilityLabel={t('common.clear')}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation?.();
                clearSelection();
              }}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
          <Ionicons
            name="chevron-down"
            size={16}
            color={disabled ? Colors.borderDark : Colors.textSecondary}
          />
        </View>
      </Pressable>

      {hint ? (
        <Text style={[styles.hint, { fontSize: fs(12) }]}>{hint}</Text>
      ) : null}
      {error ? (
        <Text style={[styles.error, { fontSize: fs(13) }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <View
            accessible
            accessibilityViewIsModal
            style={[styles.panel, wide ? styles.panelWide : styles.panelMobile]}
          >
            <View style={styles.panelHeader}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder ?? t('common.search')}
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel={searchPlaceholder ?? label}
                autoFocus
                style={[styles.searchInput, { fontSize: fs(15) }]}
              />
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { fontSize: fs(13) }]}>
                  {emptyMessage ?? t('centres.noOptions')}
                </Text>
              </View>
            ) : (
              <ScrollView
                ref={scrollRef}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                accessibilityRole="list"
              >
                {filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isFocused = index === activeIndex;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={option.label}
                      onPress={() => choose(option)}
                      style={[
                        styles.option,
                        isSelected && styles.optionActive,
                        isFocused && !isSelected && styles.optionFocused,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextActive,
                          { fontSize: fs(14) },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={16} color={Colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.panelFooter}>
              <Text style={[styles.footerText, { fontSize: fs(11) }]}>
                {filtered.length === 0
                  ? t('centres.noOptions')
                  : `${filtered.length} ${t('centres.options')}`}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
  const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  label: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.danger,
    fontWeight: '800',
  },
  trigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerDisabled: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  triggerError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  triggerPressed: {
    borderColor: Colors.primary,
  },
  triggerIcon: {
    marginRight: Spacing.sm,
  },
  triggerText: {
    flex: 1,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  triggerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: Spacing.sm,
  },
  clearBtn: {
    padding: 2,
  },
  clearBtnPressed: {
    opacity: 0.6,
  },
  hint: {
    marginTop: Spacing.xs,
    color: Colors.textMuted,
  },
  error: {
    marginTop: Spacing.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 40, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  panel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  panelWide: {
    width: 560,
    maxWidth: '100%',
    maxHeight: LIST_MAX_HEIGHT + 96,
  },
  panelMobile: {
    width: '100%',
    maxHeight: LIST_MAX_HEIGHT + 96,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    color: Colors.text,
    paddingHorizontal: Spacing.sm,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  option: {
    minHeight: OPTION_HEIGHT,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  optionActive: {
    backgroundColor: Colors.primaryLight,
  },
  optionFocused: {
    backgroundColor: Colors.surfaceMuted,
  },
  optionText: {
    flex: 1,
    color: Colors.text,
    fontWeight: '600',
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  panelFooter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  footerText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
});