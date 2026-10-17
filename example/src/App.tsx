import { useRef, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WheelPicker } from 'react-native-next-wheel-picker';
import type { TextStyle } from 'react-native';
import type { WheelPickerProps } from 'react-native-next-wheel-picker';
import { Button, Row, Section, Segmented, Toggle } from './controls';
import { ITEM_SETS } from './itemSets';
import type { ItemSetKey } from './itemSets';
import { ThemeContext, themes } from './theme';

type Props = WheelPickerProps<unknown>;

const SET_OPTIONS = (Object.keys(ITEM_SETS) as ItemSetKey[]).map((key) => ({
  label: ITEM_SETS[key].label,
  value: key,
}));
const THEME_OPTIONS = [
  { label: 'System', value: undefined },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
] as const;
const BAND_OPTIONS = [
  { label: 'Default', value: undefined },
  { label: 'Blue', value: '#0a84ff33' },
  { label: 'Red', value: '#ff3b3033' },
] as const;
const COLOR_OPTIONS = [
  { label: 'Default', value: undefined },
  { label: 'Blue', value: '#0a84ff' },
  { label: 'Red', value: '#ff3b30' },
] as const;
const SIZE_OPTIONS = [17, 21, 26].map((size) => ({ label: String(size), value: size }));
const WEIGHT_OPTIONS = [
  { label: 'Regular', value: undefined },
  { label: '600', value: '600' },
  { label: 'Bold', value: 'bold' },
] as const;
const HEIGHT_OPTIONS = [160, 216, 280].map((height) => ({ label: String(height), value: height }));

type LogEntry = { id: number; text: string };

export function App() {
  const [setKey, setSetKey] = useState<ItemSetKey>('minutes');
  const set = ITEM_SETS[setKey];
  const [controlled, setControlled] = useState(true);
  const [value, setValue] = useState<unknown>(set.items[0]?.value);
  const [rejectThird, setRejectThird] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const nextLogId = useRef(0);

  const [colorScheme, setColorScheme] = useState<Props['colorScheme']>();
  const [selectionColor, setSelectionColor] = useState<string>();
  const [color, setColor] = useState<string>();
  const [fontSize, setFontSize] = useState(21);
  const [fontWeight, setFontWeight] = useState<TextStyle['fontWeight']>();
  const [italic, setItalic] = useState(false);
  const [height, setHeight] = useState(216);
  const [loop, setLoop] = useState(false);

  const systemScheme = useColorScheme();
  const theme = themes[colorScheme ?? (systemScheme === 'dark' ? 'dark' : 'light')];

  const pickSet = (key: ItemSetKey) => {
    setSetKey(key);
    setValue(ITEM_SETS[key].items[0]?.value);
  };

  const setAt = (index: number) => setValue(set.items[index]?.value);

  const onValueChange = (next: unknown, index: number) => {
    const rejected = rejectThird && index === 2;
    // A parent that keeps its old value: the wheel must snap back.
    if (!rejected) setValue(next);
    const text = `${set.items[index]?.label} (${index}) ${rejected ? 'rejected' : 'accepted'}`;
    const id = nextLogId.current++;
    setLog((entries) => [{ id, text }, ...entries].slice(0, 5));
  };

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar
          barStyle={theme === themes.dark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
          {/* Fixed, so the wheels stay in view while the controls scroll. */}
          <View style={styles.wheels}>
            <View style={styles.column}>
              <Text style={[styles.caption, { color: theme.secondary }]}>DEFAULT</Text>
              <View style={[styles.wheel, { backgroundColor: theme.card }]}>
                <WheelPicker
                  key={setKey}
                  items={set.items}
                  keyExtractor={'keyExtractor' in set ? set.keyExtractor : undefined}
                  value={controlled ? value : undefined}
                  onValueChange={onValueChange}
                />
              </View>
            </View>
            <View style={styles.column}>
              <Text style={[styles.caption, { color: theme.secondary }]}>CONFIGURED</Text>
              <View style={[styles.wheel, { backgroundColor: theme.card }]}>
                <WheelPicker
                  key={setKey}
                  testID="wheel"
                  items={set.items}
                  keyExtractor={'keyExtractor' in set ? set.keyExtractor : undefined}
                  value={controlled ? value : undefined}
                  onValueChange={onValueChange}
                  colorScheme={colorScheme}
                  selectionColor={selectionColor}
                  loop={loop}
                  itemStyle={{
                    fontSize,
                    color,
                    fontWeight,
                    fontStyle: italic ? 'italic' : 'normal',
                    height,
                  }}
                />
              </View>
            </View>
          </View>
          <Text style={[styles.value, { color: theme.secondary }]}>
            value: {controlled ? (JSON.stringify(value) ?? 'undefined') : 'uncontrolled'}
          </Text>

          <ScrollView
            style={[styles.controls, { borderColor: theme.separator }]}
            contentContainerStyle={styles.content}
          >
            <Section title="Items">
              <Row label="Set">
                <Segmented options={SET_OPTIONS.slice(0, 3)} value={setKey} onChange={pickSet} />
                <Segmented options={SET_OPTIONS.slice(3)} value={setKey} onChange={pickSet} />
              </Row>
            </Section>

            <Section title="Value">
              <Row label="Controlled">
                <Toggle value={controlled} onChange={setControlled} />
              </Row>
              <Row label="Reject row 3">
                <Toggle value={rejectThird} onChange={setRejectThird} />
              </Row>
              <Row label="Set from outside">
                <View style={styles.buttons}>
                  <Button title="First" onPress={() => setAt(0)} />
                  <Button title="Last" onPress={() => setAt(set.items.length - 1)} />
                  <Button
                    title="Random"
                    onPress={() => setAt(Math.floor(Math.random() * set.items.length))}
                  />
                  <Button title="Unknown" onPress={() => setValue(Symbol('unknown'))} />
                </View>
              </Row>
              <Row label="Events">
                <View>
                  {log.length === 0 ? (
                    <Text style={{ color: theme.secondary }}>none yet</Text>
                  ) : (
                    log.map((entry) => (
                      <Text key={entry.id} style={{ color: theme.secondary }}>
                        {entry.text}
                      </Text>
                    ))
                  )}
                </View>
              </Row>
            </Section>

            <Section title="Look">
              <Row label="Color scheme">
                <Segmented options={THEME_OPTIONS} value={colorScheme} onChange={setColorScheme} />
              </Row>
              <Row label="Band">
                <Segmented
                  options={BAND_OPTIONS}
                  value={selectionColor}
                  onChange={setSelectionColor}
                />
              </Row>
              <Row label="Text color">
                <Segmented options={COLOR_OPTIONS} value={color} onChange={setColor} />
              </Row>
              <Row label="Font size">
                <Segmented options={SIZE_OPTIONS} value={fontSize} onChange={setFontSize} />
              </Row>
              <Row label="Weight">
                <Segmented options={WEIGHT_OPTIONS} value={fontWeight} onChange={setFontWeight} />
              </Row>
              <Row label="Italic">
                <Toggle value={italic} onChange={setItalic} />
              </Row>
              <Row label="Height">
                <Segmented options={HEIGHT_OPTIONS} value={height} onChange={setHeight} />
              </Row>
              <Row label="Loop">
                <Toggle value={loop} onChange={setLoop} />
              </Row>
            </Section>
          </ScrollView>
        </SafeAreaView>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 32 },
  wheels: { flexDirection: 'row', gap: 8, marginTop: 8, marginHorizontal: 16 },
  column: { flex: 1 },
  caption: { fontSize: 12, marginBottom: 4, textAlign: 'center' },
  wheel: { borderRadius: 10, overflow: 'hidden' },
  value: { marginVertical: 8, textAlign: 'center', fontSize: 13 },
  controls: { flex: 1, borderTopWidth: StyleSheet.hairlineWidth },
  buttons: { flexDirection: 'row', flexWrap: 'wrap' },
});
