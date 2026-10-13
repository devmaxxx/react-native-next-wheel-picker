# Changelog

## 1.0.0

First release.

- `WheelPicker<T>` takes `items: { label, value: T }[]` and reports `T`, so values are no longer
  limited to strings. `isEqual` matches object values.
- `NumberPicker` keeps the old `displayedValues: string[]` API and is deprecated.
- The Android view is registered as `RNNextWheelPicker` in package `com.reactnativenextwheelpicker`.
- Android: a native wheel drawn like iOS's UIPickerView (3D cylinder, faded edges, rounded selection
  band, haptic tick) replaces the ShawnLin013 NumberPicker dependency.
- Android: `dividerColor` and `itemSpacing` are gone. `wrapSelectorWheel` now defaults to `false`,
  as on iOS.
- Both platforms take the same styling: `selectionColor` colors the band, `themeVariant` forces light
  or dark, and `itemStyle` sets `fontSize` (default 21), `color`, `fontFamily`, `fontWeight`,
  `fontStyle` and the wheel `height` (default 216). Android sizes rows like iOS: line height plus 20.
- Android: a parent that keeps its old `value` snaps the wheel back, as on iOS.
- Android: the native code is Kotlin.
- `wrapSelectorWheel` scrolls endlessly on iOS too.
- A value set from outside scrolls the Android wheel to it, as on iOS.
- Without `value` the wheel is uncontrolled: it keeps the user's pick instead of snapping back to
  the first row.
- Android: colors, including the ones in `itemStyle`, are resolved in JS, so `#RGB`, `rgb()`,
  `#RRGGBBAA` and `PlatformColor` work.
  `fontSize` is in sp, like everywhere else in React Native.
- iOS: without `itemStyle.color` the labels use the system color, so they follow dark mode.
- Requires React Native 0.73 or newer.
