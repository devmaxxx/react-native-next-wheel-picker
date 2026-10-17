import type { HostComponent } from 'react-native';
import type { NativeWheelPickerProps } from './NativeWheelPicker';

// react-native-web has no requireNativeComponent; WheelPicker renders the JS wheel on the web.
export const NativeWheelPicker = (() => null) as unknown as HostComponent<NativeWheelPickerProps>;
