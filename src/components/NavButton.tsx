import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export type NavButtonProps = {
  /** Nav label (already translated by the caller). */
  label: string;
  onPress: () => void;
  /** Active/current page → filled navy block. */
  active?: boolean;
  /** Full-width stackable variant used in the mobile drawer. */
  block?: boolean;
};

/**
 * Native nav block — rectangular Bootstrap-style outline button. Metro
 * resolves NavButton.web.tsx on web, so this file only runs on iOS/Android
 * where the Bootstrap DOM classes don't exist.
 */
export default function NavButton({ label, onPress, active, block }: NavButtonProps) {
  const { fs } = useI18n();
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (value: number, springBack = false) => {
    if (springBack) {
      Animated.spring(scale, {
        toValue: value,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: value,
        useNativeDriver: true,
        duration: 90,
      }).start();
    }
  };

  return (
    <Animated.View style={[block && styles.blockWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1, true)}
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        style={({ pressed }) => [
          styles.button,
          block && styles.buttonBlock,
          styles.buttonOutline,
          pressed && styles.buttonOutlinePressed,
        ]}
      >
        <Text
          style={[styles.label, { fontSize: fs(block ? 14 : 13) }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blockWrap: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    minHeight: 34,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  buttonBlock: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  buttonOutline: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  buttonOutlinePressed: {
    backgroundColor: Colors.primaryLight,
  },
  label: {
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: Fonts.semiBold,
  },
});