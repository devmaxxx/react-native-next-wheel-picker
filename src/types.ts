import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface WheelPickerItem<T> {
  label: string;
  value: T;
}

export interface WheelPickerProps<T> {
  items: readonly WheelPickerItem<T>[];
  /**
   * Selected item's value. An unknown value selects the first row. Leave it out
   * and the wheel is uncontrolled: it starts on the first row and keeps the user's pick.
   */
  value?: T;
  onValueChange: (value: T, index: number) => void;
  /**
   * Returns a value's identity. `value` selects the item whose key is the same, compared with
   * `Object.is`. Without it values are compared directly, so an object `value` must be the same
   * reference as an item's.
   *
   * @example
   * // `user` may come from a refetch, so it is a different object than the items'.
   * <WheelPicker
   *   items={users.map((u) => ({ label: u.name, value: u }))}
   *   value={user}
   *   keyExtractor={(u) => u.id}
   *   onValueChange={setUser}
   * />
   */
  keyExtractor?: (value: T) => string | number;
  /** Style of the view around the wheel. The wheel itself is `itemStyle.height` tall. */
  style?: StyleProp<ViewStyle>;
  /**
   * Row text and wheel height, as on iOS: `fontSize` (default 21), `color`,
   * `fontFamily`, `fontWeight`, `fontStyle`, and `height` (default 216).
   * Rows are the font's line height plus 20 tall.
   */
  itemStyle?: StyleProp<TextStyle>;
  /** Fill of the band behind the selected row. Defaults to the system's (quaternarySystemFill). */
  selectionColor?: ColorValue;
  /** Forces light or dark default colors. Defaults to the system appearance. */
  colorScheme?: 'light' | 'dark';
  testID?: string;
  /** What the wheel picks, read by screen readers before the value, e.g. "Hour". */
  accessibilityLabel?: string;
  /** Scroll endlessly: the first row follows the last. Default `false`. */
  loop?: boolean;
}
