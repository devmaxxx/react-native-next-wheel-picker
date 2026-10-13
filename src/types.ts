import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface WheelPickerItem<T> {
  label: string;
  value: T;
}

export interface WheelPickerProps<T> {
  items: readonly WheelPickerItem<T>[];
  /** Selected item's value. An unknown value selects the first row. */
  value?: T;
  onValueChange: (value: T, index: number) => void;
  /** Matches `value` against `items`. Defaults to `Object.is`; pass one for object values. */
  isEqual?: (a: T, b: T) => boolean;
  style?: StyleProp<ViewStyle>;
  /** `fontSize`, `color` and (Android) `fontFamily` are applied. */
  itemStyle?: StyleProp<TextStyle>;
  testID?: string;
  /** @platform android */
  wrapSelectorWheel?: boolean;
  /** @platform android */
  dividerColor?: ColorValue;
  /** @platform android */
  itemSpacing?: number;
}

/** @deprecated Use `WheelPickerProps` with `items`. */
export interface NumberPickerProps extends Omit<WheelPickerProps<string>, 'items' | 'isEqual'> {
  displayedValues: string[];
}
