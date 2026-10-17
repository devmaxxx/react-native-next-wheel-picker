import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import QRCode from 'qrcode';

const REPO = 'https://github.com/devmaxxx/react-native-next-wheel-picker';
const NPM = 'https://www.npmjs.com/package/react-native-next-wheel-picker';
const PHONE = { width: 390, height: 844 };
const DEMO = 'https://devmaxxx.github.io/react-native-next-wheel-picker/';
// A release asset rather than the EAS artifact link, which expires after two weeks.
const APK = `${REPO}/releases/download/demo/react-native-next-wheel-picker-demo.apk`;

const FEATURES = [
  'Native UIPickerView on iOS, an iOS-style wheel on Android',
  'Typed values of any kind: numbers, unions, objects',
  'Controlled, uncontrolled, infinite scroll',
  'Falls back to a JS wheel in Expo Go and on the web',
];

/**
 * On a wide web page, shows the demo inside a phone next to a short pitch. Phones, narrow
 * windows and the native apps get the demo full screen.
 */
export function WebFrame({ dark, children }: { dark: boolean; children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 900) return children;

  // Shrinks the phone to fit short windows.
  const scale = Math.min(1, Math.max(0.5, (height - 48) / (PHONE.height + 24)));

  return (
    <View style={styles.page}>
      <View style={styles.pitch}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>10</Text>
        </View>
        <Text style={styles.title}>react-native-next-wheel-picker</Text>
        <Text style={styles.tagline}>
          A native wheel picker for React Native and Expo that picks any value.
        </Text>
        {FEATURES.map((feature) => (
          <Text key={feature} style={styles.feature}>
            <Text style={styles.check}>✓ </Text>
            {feature}
          </Text>
        ))}
        <View style={styles.code}>
          <Text style={styles.codeText}>npx expo install react-native-next-wheel-picker</Text>
        </View>
        <View style={styles.links}>
          <Link title="GitHub" url={REPO} primary />
          <Link title="npm" url={NPM} />
        </View>
        <View style={styles.qrRow}>
          <QrTile url={DEMO} title="This page" body="On any phone, JS wheel" />
          <QrTile url={APK} title="Android app" body="Native wheel, APK" />
        </View>
        <Text style={styles.note}>
          This page runs the JS wheel; the apps on iOS and Android use the native one.
        </Text>
      </View>

      <View style={[styles.phone, { transform: [{ scale }] }]}>
        <View style={[styles.screen, dark && styles.screenDark]}>
          <View style={styles.statusBar}>
            <Text style={[styles.clock, dark && styles.clockDark]}>9:41</Text>
          </View>
          <View style={styles.island} />
          {children}
        </View>
      </View>
    </View>
  );
}

function QrTile({ url, title, body }: { url: string; title: string; body: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} style={styles.qrTile}>
      <QrCode text={url} size={104} />
      <Text style={styles.qrTitle}>{title}</Text>
      <Text style={styles.qrBody}>{body}</Text>
    </Pressable>
  );
}

function QrCode({ text, size }: { text: string; size: number }) {
  const { uri, side } = useMemo(() => {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const cells: string[] = [];
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) cells.push(`M${x + 2} ${y + 2}h1v1h-1z`);
      }
    }
    const box = modules.size + 4;
    // A whole number of pixels per module keeps the modules even, which scanners need.
    const pixel = Math.max(2, Math.round(size / box));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box * pixel}" height="${box * pixel}" viewBox="0 0 ${box} ${box}" shape-rendering="crispEdges"><rect width="${box}" height="${box}" fill="#fff"/><path d="${cells.join('')}" fill="#0b0b0f"/></svg>`;
    return { uri: `data:image/svg+xml;base64,${btoa(svg)}`, side: box * pixel };
  }, [text, size]);
  return (
    <Image
      source={{ uri }}
      style={{ width: side, height: side }}
      accessibilityLabel={`QR code for ${text}`}
    />
  );
}

function Link({ title, url, primary }: { title: string; url: string; primary?: boolean }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => [
        styles.link,
        primary && styles.linkPrimary,
        pressed && styles.linkPressed,
      ]}
    >
      <Text style={[styles.linkText, primary && styles.linkTextPrimary]}>{title}</Text>
    </Pressable>
  );
}

const BLUE = '#0a84ff';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 56,
    padding: 24,
    backgroundColor: '#eef1f8',
  },
  pitch: { flexShrink: 1, maxWidth: 460 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: { color: '#ffffff', fontSize: 26, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#0b0b0f', letterSpacing: -0.5 },
  tagline: { fontSize: 18, lineHeight: 26, color: '#4a4a55', marginTop: 12, marginBottom: 24 },
  feature: { fontSize: 15, lineHeight: 26, color: '#2c2c33' },
  check: { color: BLUE, fontWeight: '700' },
  code: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#14141a',
  },
  codeText: { color: '#e6e6ef', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 },
  links: { flexDirection: 'row', gap: 12, marginTop: 20 },
  link: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c9cdd8',
    backgroundColor: '#ffffff',
  },
  linkPrimary: { backgroundColor: BLUE, borderColor: BLUE },
  linkPressed: { opacity: 0.7 },
  linkText: { fontSize: 15, fontWeight: '600', color: '#0b0b0f' },
  linkTextPrimary: { color: '#ffffff' },
  qrRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  qrTile: { alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#ffffff' },
  qrTitle: { fontSize: 14, fontWeight: '700', color: '#0b0b0f', marginTop: 8 },
  qrBody: { fontSize: 12, color: '#6a6a75', marginTop: 2 },
  note: { fontSize: 13, color: '#8a8a96', marginTop: 24 },
  phone: {
    width: PHONE.width + 24,
    height: PHONE.height + 24,
    padding: 12,
    borderRadius: 64,
    backgroundColor: '#0b0b0f',
    boxShadow: '0 30px 80px rgba(20, 30, 60, 0.25)',
  },
  screen: { flex: 1, borderRadius: 52, overflow: 'hidden', backgroundColor: '#f2f2f7' },
  screenDark: { backgroundColor: '#000000' },
  statusBar: { height: 54, justifyContent: 'center', paddingLeft: 44 },
  clock: { fontSize: 16, fontWeight: '600', color: '#000000' },
  clockDark: { color: '#ffffff' },
  island: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 120,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0b0b0f',
  },
});
