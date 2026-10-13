# Changelog

## 1.0.0

First release.

- `WheelPicker<T>` takes `items: { label, value: T }[]` and reports `T`, so values are no longer
  limited to strings. `isEqual` matches object values.
- `NumberPicker` keeps the old `displayedValues: string[]` API and is deprecated.
- The Android view is registered as `RNNextWheelPicker` in package `com.reactnativenextwheelpicker`.
- Android: colors are resolved in JS, so `#RGB`, `rgb()`, `#RRGGBBAA` and `PlatformColor` work for
  `itemStyle.color` and `dividerColor`. `fontSize` and `itemSpacing` follow the screen density.
- Android: changing the number of `items` no longer crashes or leaves stale rows.
- iOS: without `itemStyle.color` the labels use the system color, so they follow dark mode.
- Requires React Native 0.73 or newer.
