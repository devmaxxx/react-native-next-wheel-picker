# react-native-next-wheel-picker

A wheel picker for React Native that picks any value — numbers, strings, enums or objects.

- **Android** — a native wheel built on [ShawnLin013/NumberPicker](https://github.com/ShawnLin013/NumberPicker).
- **iOS** — `UIPickerView` through [`@react-native-picker/picker`](https://github.com/react-native-picker/picker).
- Same props on both platforms, fully typed, generic over the value type.

## Installation

```sh
npm install react-native-next-wheel-picker @react-native-picker/picker
cd ios && pod install
```

The Android view autolinks. iOS has no native code of its own; the pod comes from
`@react-native-picker/picker`.

Requires React Native 0.73 or newer (Android builds with JDK 17).

## Usage

```tsx
import { useState } from 'react';
import { WheelPicker } from 'react-native-next-wheel-picker';

const SIZES = [
  { label: 'Small', value: 's' },
  { label: 'Medium', value: 'm' },
  { label: 'Large', value: 'l' },
] as const;

export function SizePicker() {
  const [size, setSize] = useState<'s' | 'm' | 'l'>('m');

  return (
    <WheelPicker
      items={SIZES}
      value={size}
      onValueChange={(value) => setSize(value)}
      style={{ height: 200 }}
      itemStyle={{ fontSize: 22, color: '#222' }}
    />
  );
}
```

### Object values

Values are matched with `Object.is`. For objects that are not the same reference, pass `isEqual`:

```tsx
<WheelPicker
  items={users.map((user) => ({ label: user.name, value: user }))}
  value={selectedUser}
  isEqual={(a, b) => a.id === b.id}
  onValueChange={setSelectedUser}
/>
```

## Props

| Prop                | Type                                | Platform | Description                                                        |
| ------------------- | ----------------------------------- | -------- | ------------------------------------------------------------------ |
| `items`             | `{ label: string; value: T }[]`     | both     | Rows of the wheel. **Required.**                                   |
| `onValueChange`     | `(value: T, index: number) => void` | both     | Called with the value of the row the wheel lands on. **Required.** |
| `value`             | `T`                                 | both     | Selected value. An unknown value selects the first row.            |
| `isEqual`           | `(a: T, b: T) => boolean`           | both     | Matches `value` against items. Defaults to `Object.is`.            |
| `style`             | `StyleProp<ViewStyle>`              | both     | Container style. Give the picker a height.                         |
| `itemStyle`         | `StyleProp<TextStyle>`              | both     | `fontSize` and `color`; `fontFamily` on Android.                   |
| `testID`            | `string`                            | both     |                                                                    |
| `wrapSelectorWheel` | `boolean`                           | Android  | Wrap around at the ends. Default `true`.                           |
| `dividerColor`      | `ColorValue`                        | Android  | Color of the selection dividers.                                   |
| `itemSpacing`       | `number`                            | Android  | Space between rows.                                                |

On Android, `itemStyle.fontFamily` loads `assets/fonts/<name>.otf` first and falls back to a system
font of that name.

## Migrating from `NumberPicker`

`NumberPicker` (string values in `displayedValues`) still ships, deprecated:

```tsx
// before
<NumberPicker displayedValues={['06', '07']} value={hour} onValueChange={setHour} />

// after
<WheelPicker
  items={['06', '07'].map((h) => ({ label: h, value: h }))}
  value={hour}
  onValueChange={setHour}
/>
```

## Development

```sh
npm install
npm test
npm run typecheck
npm run lint
npm run build   # writes lib/
```

## Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Commit, then tag and push: `git tag v1.2.3 && git push origin main v1.2.3`.
3. The `publish` workflow checks, builds and runs `npm publish --provenance`.

The workflow authenticates with the `NPM_TOKEN` repository secret. Once the package exists on npm,
it can switch to [trusted publishing](https://docs.npmjs.com/trusted-publishers) and the secret can go.

## License

MIT
