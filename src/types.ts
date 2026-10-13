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
  /** Matches `value` against `items`. Defaults to `Object.is`; pass one for object values. */
  isEqual?: (a: T, b: T) => boolean;
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
  themeVariant?: 'light' | 'dark';
  testID?: string;
  /** Scroll endlessly: the first row follows the last. Default `false`. */
  wrapSelectorWheel?: boolean;
}

/** @deprecated Use `WheelPickerProps` with `items`. */
export interface NumberPickerProps extends Omit<WheelPickerProps<string>, 'items' | 'isEqual'> {
  displayedValues: string[];
}
