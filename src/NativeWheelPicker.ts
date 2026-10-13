import { requireNativeComponent } from 'react-native';
import type { processColor, TextStyle } from 'react-native';
import type { WheelPickerProps } from './types';

// The Android parser only reads #RRGGBB, so colors cross the bridge already processed.
type NativeColor = ReturnType<typeof processColor>;

export interface NativeWheelPickerProps extends Pick<
  WheelPickerProps<unknown>,
  'testID' | 'wrapSelectorWheel' | 'itemSpacing'
> {
  style?: WheelPickerProps<unknown>['style'];
  itemStyle?: Omit<TextStyle, 'color'> & { color?: NativeColor };
  dividerColor?: NativeColor;
  displayedValues: string[];
  value: number;
  minValue: number;
  maxValue: number;
  onValueChange: (event: { nativeEvent: { value: number; index: number } }) => void;
}

export const NativeWheelPicker =
  requireNativeComponent<NativeWheelPickerProps>('RNNextWheelPicker');
