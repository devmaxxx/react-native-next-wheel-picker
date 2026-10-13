import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from './theme';

type Option<V> = { label: string; value: V };

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.secondary }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>{children}</View>
    </View>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.separator }]}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {children}
    </View>
  );
}

export function Segmented<V>({
  options,
  value,
  onChange,
}: {
  options: readonly Option<V>[];
  value: V;
  onChange: (value: V) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.fill }]}>
      {options.map((option) => {
        const selected = Object.is(option.value, value);
        return (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.selectedSegment }]}
          >
            <Text style={[styles.segmentText, { color: theme.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return <Switch value={value} onValueChange={onChange} />;
}

export function Button({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={[styles.buttonText, { color: theme.accent }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, marginHorizontal: 16 },
  sectionTitle: { fontSize: 13, marginBottom: 6, marginLeft: 16 },
  card: { borderRadius: 10, overflow: 'hidden' },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 16 },
  segmented: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  segment: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  segmentText: { fontSize: 13 },
  button: { paddingHorizontal: 8, paddingVertical: 4 },
  buttonText: { fontSize: 16 },
});
