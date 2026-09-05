import { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export type Column<T> = {
  key: string;
  header: string;
  width?: number;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
};

/**
 * Responsive table: real table on wide screens, stacked definition cards on
 * narrow screens so nothing ever overflows horizontally.
 */
export default function DataTable<T>({ columns, rows, rowKey, emptyLabel }: Props<T>) {
  const { width } = useWindowDimensions();
  const { fs } = useI18n();
  const wide = width >= 768;

  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { fontSize: fs(14) }]}>{emptyLabel}</Text>
      </View>
    );
  }

  if (wide) {
    return (
      <View style={styles.table}>
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <View key={column.key} style={[styles.cell, column.width ? { width: column.width } : null]}>
              <Text style={[styles.headerText, { fontSize: fs(12) }]}>{column.header}</Text>
            </View>
          ))}
        </View>
        {rows.map((row) => (
          <View key={rowKey(row)} style={styles.bodyRow}>
            {columns.map((column) => (
              <View key={column.key} style={[styles.cell, column.width ? { width: column.width } : null]}>
                {column.render(row)}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.cardList}>
      {rows.map((row) => (
        <View key={rowKey(row)} style={styles.card}>
          {columns.map((column) => (
            <View key={column.key} style={styles.cardRow}>
              <Text style={[styles.cardLabel, { fontSize: fs(11) }]}>{column.header}</Text>
              <View style={styles.cardValue}>{column.render(row)}</View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
  },
  headerText: {
    color: Colors.white,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 48,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  cardList: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  cardLabel: {
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardValue: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  empty: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
  },
});
