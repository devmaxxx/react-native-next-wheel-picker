# Changelog

## 0.1.0

First release.

- `WheelPicker<T>` takes `items: { label, value: T }[]` and reports `T`, so values can be numbers,
  strings, enums or objects. `keyExtractor` matches object values by an identity such as an id.
- Where the native view is missing (Expo Go, Snack, the web) the same component renders a JS
  wheel with the same props.
- `accessibilityLabel` names the wheel for screen readers.
- No native dependencies. iOS draws its own UIPickerView; Android draws a Kotlin wheel like it: a
  3D cylinder, faded edges, a capsule selection band and a haptic tick.
- Both platforms take the same styling: `selectionColor` colors the band, `colorScheme` forces light
  or dark, and `itemStyle` sets `fontSize` (default 21), `color`, `fontFamily`, `fontWeight`,
  `fontStyle` and the wheel `height` (default 216). Rows are the line height plus 20.
- `loop` scrolls endlessly on both platforms. Default `false`.
- Controlled or uncontrolled: a parent that keeps its old `value` snaps the wheel back, a value set
  from outside scrolls the wheel to it, and without `value` the wheel keeps the user's pick.
- Android: colors, including the ones in `itemStyle`, accept `#RGB`, `rgb()`, `#RRGGBBAA` and
  `PlatformColor`. `fontSize` is in sp, like everywhere else in React Native.
- iOS: without `itemStyle.color` the labels use the system color, so they follow dark mode.
- Requires React Native 0.73 or newer.
