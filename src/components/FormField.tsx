import { StyleSheet, Text, TextInput, View, TextStyle } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  maxLength?: number;
  multiline?: boolean;
  secure?: boolean;
  required?: boolean;
};

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  keyboardType = 'default',
  maxLength,
  multiline,
  secure,
  required,
}: Props) {
  const { fs } = useI18n();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { fontSize: fs(14) }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        secureTextEntry={secure}
        style={[
          styles.input,
          multiline && styles.multiline,
          { fontSize: fs(16) },
          error ? styles.inputError : null,
        ] as TextStyle[]}
      />
      {error ? (
        <Text style={[styles.error, { fontSize: fs(13) }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { fontSize: fs(12) }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
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
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    color: Colors.text,
  },
  multiline: {
    minHeight: 90,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  error: {
    marginTop: Spacing.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  hint: {
    marginTop: Spacing.xs,
    color: Colors.textMuted,
  },
});

