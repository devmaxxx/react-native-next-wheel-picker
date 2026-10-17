import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WheelPicker } from 'react-native-next-wheel-picker';
import { WebFrame } from './WebFrame';

const pad = (n: number) => String(n).padStart(2, '0');
const range = (length: number) => Array.from({ length }, (_, i) => ({ label: pad(i), value: i }));
const randomIndex = (length: number) => Math.floor(Math.random() * length);

const HOURS = range(24);
const MINUTES = range(60);

type Fruit = 'apple' | 'banana' | 'cherry' | 'grape' | 'mango' | 'peach' | 'lemon';
const FRUITS: { label: string; value: Fruit }[] = [
  { label: '🍎 Apple', value: 'apple' },
  { label: '🍌 Banana', value: 'banana' },
  { label: '🍒 Cherry', value: 'cherry' },
  { label: '🍇 Grape', value: 'grape' },
  { label: '🥭 Mango', value: 'mango' },
  { label: '🍑 Peach', value: 'peach' },
  { label: '🍋 Lemon', value: 'lemon' },
];

type City = { id: number; name: string; country: string };
const CITIES: City[] = [
  { id: 1, name: 'Lisbon', country: 'Portugal' },
  { id: 2, name: 'Oslo', country: 'Norway' },
  { id: 3, name: 'Kyoto', country: 'Japan' },
  { id: 4, name: 'Lima', country: 'Peru' },
  { id: 5, name: 'Cairo', country: 'Egypt' },
  { id: 6, name: 'Hobart', country: 'Australia' },
  { id: 7, name: 'Quebec', country: 'Canada' },
];
const CITY_ITEMS = CITIES.map((city) => ({ label: city.name, value: city }));

type Size = 'xs' | 's' | 'm' | 'l' | 'xl';
const SIZES: { label: string; value: Size }[] = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
];

const TABS = [
  { key: 'time', label: 'Time', icon: '⏰' },
  { key: 'strings', label: 'Strings', icon: '🍒' },
  { key: 'objects', label: 'Objects', icon: '🌍' },
  { key: 'styled', label: 'Styled', icon: '🎨' },
] as const;
type Tab = (typeof TABS)[number]['key'];

// The demo's screens are light except Styled, so every wheel sets its scheme instead of following a
// dark system appearance.
export default function App() {
  const [tab, setTab] = useState<Tab>('time');
  const dark = tab === 'styled';

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <WebFrame dark={dark}>
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={[styles.screen, dark && styles.screenDark]}
        >
          <View style={styles.page}>
            {tab === 'time' && <TimeDemo />}
            {tab === 'strings' && <StringsDemo />}
            {tab === 'objects' && <ObjectsDemo />}
            {tab === 'styled' && <StyledDemo />}
          </View>
          <TabBar tab={tab} onChange={setTab} dark={dark} />
        </SafeAreaView>
      </WebFrame>
    </SafeAreaProvider>
  );
}

function TimeDemo() {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(41);
  const setTime = (h: number, m: number) => {
    setHour(h);
    setMinute(m);
  };

  return (
    <Demo
      title="Time"
      caption="Two wheels with numbers. Both scroll endlessly."
      value={`${pad(hour)}:${pad(minute)}`}
      actions={[
        { title: 'Now', onPress: () => setTime(new Date().getHours(), new Date().getMinutes()) },
        { title: 'Noon', onPress: () => setTime(12, 0) },
        { title: 'Random', onPress: () => setTime(randomIndex(24), randomIndex(60)) },
      ]}
    >
      <View style={styles.row}>
        <WheelPicker
          style={styles.flex}
          items={HOURS}
          accessibilityLabel="Hour"
          value={hour}
          onValueChange={setHour}
          colorScheme="light"
          loop
        />
        <Text style={styles.colon}>:</Text>
        <WheelPicker
          style={styles.flex}
          items={MINUTES}
          accessibilityLabel="Minute"
          value={minute}
          onValueChange={setMinute}
          colorScheme="light"
          loop
        />
      </View>
    </Demo>
  );
}

function StringsDemo() {
  const [fruit, setFruit] = useState<Fruit>('cherry');
  return (
    <Demo
      title="Strings"
      caption="A union of string literals, typed end to end."
      value={`'${fruit}'`}
      actions={pickActions(FRUITS, setFruit)}
    >
      <WheelPicker items={FRUITS} value={fruit} onValueChange={setFruit} colorScheme="light" />
    </Demo>
  );
}

function ObjectsDemo() {
  // A copy, not an item of CITIES: keyExtractor matches it by id.
  const [city, setCity] = useState<City>({ ...CITIES[2] });
  return (
    <Demo
      title="Objects"
      caption="Object values, matched by id with keyExtractor."
      value={`${city.name}, ${city.country}`}
      actions={pickActions(CITY_ITEMS, setCity)}
    >
      <WheelPicker
        items={CITY_ITEMS}
        value={city}
        keyExtractor={(c) => c.id}
        onValueChange={setCity}
        colorScheme="light"
      />
    </Demo>
  );
}

function StyledDemo() {
  const [size, setSize] = useState<Size>('m');
  return (
    <Demo
      title="Styled"
      caption="Dark theme, a tinted band and bold 28pt rows."
      value={size.toUpperCase()}
      actions={pickActions(SIZES, setSize)}
      dark
    >
      <WheelPicker
        items={SIZES}
        value={size}
        onValueChange={setSize}
        colorScheme="dark"
        selectionColor="#0a84ff66"
        itemStyle={{ fontSize: 28, fontWeight: '700', color: '#ffffff' }}
      />
    </Demo>
  );
}

function pickActions<T>(items: { value: T }[], set: (value: T) => void) {
  return [
    { title: 'First', onPress: () => set(items[0].value) },
    { title: 'Last', onPress: () => set(items[items.length - 1].value) },
    { title: 'Random', onPress: () => set(items[randomIndex(items.length)].value) },
  ];
}

function Demo({
  title,
  caption,
  value,
  actions,
  dark,
  children,
}: {
  title: string;
  caption: string;
  value: string;
  actions: { title: string; onPress: () => void }[];
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.demo}>
      <Text style={[styles.title, dark && styles.textDark]}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
      <View style={[styles.card, dark && styles.cardDark]}>{children}</View>
      <Text style={[styles.value, dark && styles.textDark]}>{value}</Text>
      <Text style={styles.sectionTitle}>SET FROM OUTSIDE</Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.title}
            onPress={action.onPress}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <Text style={styles.chipText}>{action.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TabBar({
  tab,
  onChange,
  dark,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
  dark: boolean;
}) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, dark && styles.tabBarDark, { paddingBottom: bottom + 4 }]}>
      {TABS.map((item) => {
        const active = item.key === tab;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={styles.tab}>
            <Text style={[styles.tabIcon, !active && styles.inactive]}>{item.icon}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const BLUE = '#0a84ff';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f2f7' },
  screenDark: { backgroundColor: '#000000' },
  page: { flex: 1 },
  demo: { flex: 1, padding: 20 },
  title: { fontSize: 34, fontWeight: '700', color: '#000000', marginTop: 8 },
  textDark: { color: '#ffffff' },
  caption: { fontSize: 15, color: '#8e8e93', marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 12 },
  cardDark: { backgroundColor: '#1c1c1e' },
  value: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: { fontSize: 13, color: '#8e8e93', marginTop: 28, marginBottom: 8, marginLeft: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0a84ff1f',
  },
  pressed: { opacity: 0.6 },
  chipText: { color: BLUE, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  colon: { fontSize: 24, fontWeight: '600', marginHorizontal: 4 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c6c6c8',
    backgroundColor: '#f9f9f9',
    paddingTop: 8,
  },
  tabBarDark: { backgroundColor: '#121212', borderTopColor: '#38383a' },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { fontSize: 22 },
  inactive: { opacity: 0.4 },
  tabLabel: { fontSize: 11, color: '#8e8e93' },
  tabLabelActive: { color: BLUE, fontWeight: '600' },
});
