import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';

type Item = {
  id: string;
  label: string;
  hint?: string;
};

type Props = {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
};

export default function ChoiceChips({ items, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
            {item.hint ? (
              <Text style={[styles.hint, selected && styles.hintSelected]}>{item.hint}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  labelSelected: {
    color: Colors.primary,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hintSelected: {
    color: Colors.primary,
  },
});
