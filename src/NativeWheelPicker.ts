import { requireNativeComponent } from 'react-native';
import type { ColorValue, processColor, TextStyle } from 'react-native';
import type { WheelPickerProps } from './types';

// itemStyle colors cross the bridge already processed (an ARGB number, or a
// PlatformColor map): nothing processes values nested in a map prop.
type NativeColor = ReturnType<typeof processColor>;

export interface NativeWheelPickerProps extends Pick<
  WheelPickerProps<unknown>,
  'testID' | 'wrapSelectorWheel' | 'themeVariant'
> {
  style?: WheelPickerProps<unknown>['style'];
  // fontWeight goes as a string: the native side parses it like <Text> does.
  itemStyle?: Omit<TextStyle, 'color' | 'fontWeight'> & {
    color?: NativeColor;
    fontWeight?: string;
  };
  selectionColor?: ColorValue;
  displayedValues: string[];
  selectedIndex: number;
  /** Count of the last change event JS has seen; the wheel ignores `selectedIndex` until it catches up. */
  mostRecentEventCount: number;
  onValueChange: (event: { nativeEvent: { index: number; eventCount: number } }) => void;
}

export const NativeWheelPicker =
  requireNativeComponent<NativeWheelPickerProps>('RNNextWheelPicker');
