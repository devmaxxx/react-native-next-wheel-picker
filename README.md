# react-native-next-wheel-picker

A wheel picker for React Native that picks any value — numbers, strings, enums or objects.

- **Android** — a native wheel drawn to look like iOS: rows on a 3D cylinder, faded toward the edges,
  a rounded selection band, fling with snapping, a haptic tick per row, light and dark mode.
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

| Prop                | Type                                | Platform | Description                                                                                   |
| ------------------- | ----------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `items`             | `{ label: string; value: T }[]`     | both     | Rows of the wheel. **Required.**                                                              |
| `onValueChange`     | `(value: T, index: number) => void` | both     | Called with the value of the row the wheel lands on. **Required.**                            |
| `value`             | `T`                                 | both     | Selected value; an unknown one selects the first row. Leave it out for an uncontrolled wheel. |
| `isEqual`           | `(a: T, b: T) => boolean`           | both     | Matches `value` against items. Defaults to `Object.is`.                                       |
| `style`             | `StyleProp<ViewStyle>`              | both     | Style of the view around the wheel.                                                           |
| `itemStyle`         | `StyleProp<TextStyle>`              | both     | Row text and wheel height; see below.                                                         |
| `selectionColor`    | `ColorValue`                        | both     | Fill of the band behind the selected row. Defaults to the system's.                           |
| `themeVariant`      | `'light' \| 'dark'`                 | both     | Forces light or dark default colors. Defaults to the system appearance.                       |
| `testID`            | `string`                            | both     |                                                                                               |
| `wrapSelectorWheel` | `boolean`                           | both     | Scroll endlessly: the first row follows the last. Default `false`.                            |

`itemStyle` works the same on both platforms, following `@react-native-picker/picker` on iOS:

- `fontSize` (default 21), `color`, `fontFamily`, `fontWeight` and `fontStyle` style the rows.
  Android resolves the font like `<Text>` does.
- `height` is the wheel's height, default 216. Each row is the font's line height plus 20.

A parent that ignores a change, by keeping its old `value`, snaps the wheel back on both platforms.

## Development

```sh
npm install
npm test
npm run typecheck
npm run lint
npm run build   # writes lib/
```

[`example/`](example) is a playground app with toggles for every prop, the value and the item
set. It runs the library from `src/`:

```sh
cd example && npm install
npm run pods      # iOS only
npm run android   # or: npm run ios
```

## Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Commit, then tag and push: `git tag v1.2.3 && git push origin main v1.2.3`.
3. The `publish` workflow checks, builds and runs `npm publish --provenance`.

The workflow authenticates with the `NPM_TOKEN` repository secret. Once the package exists on npm,
it can switch to [trusted publishing](https://docs.npmjs.com/trusted-publishers) and the secret can go.

## License

MIT
