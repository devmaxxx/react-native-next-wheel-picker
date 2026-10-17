import type { WheelPickerProps } from './types';

// The wheels work in row indexes; WheelPicker maps them to values.
export type WheelProps<T> = Omit<
  WheelPickerProps<T>,
  'value' | 'keyExtractor' | 'onValueChange'
> & {
  selectedIndex: number;
  onIndexChange: (index: number) => void;
};

// UIPickerView's default height, overridden by itemStyle.height.
export const WHEEL_HEIGHT = 216;
