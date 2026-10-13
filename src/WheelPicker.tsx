import { Platform, processColor, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeWheelPicker } from './NativeWheelPicker';
import type { WheelPickerProps } from './types';

function selectedIndex<T>({ items, value, isEqual = Object.is }: WheelPickerProps<T>) {
  if (value === undefined) return 0;
  return Math.max(
    items.findIndex((item) => isEqual(item.value, value)),
    0
  );
}

function AndroidWheelPicker<T>(props: WheelPickerProps<T>) {
  const {
    items,
    onValueChange,
    style,
    itemStyle,
    testID,
    wrapSelectorWheel,
    dividerColor,
    itemSpacing,
  } = props;

  const { color, ...restItemStyle } = StyleSheet.flatten(itemStyle) ?? {};

  return (
    <View style={[styles.clip, style]}>
      <NativeWheelPicker
        testID={testID}
        wrapSelectorWheel={wrapSelectorWheel}
        dividerColor={dividerColor === undefined ? undefined : processColor(dividerColor)}
        itemSpacing={itemSpacing}
        style={styles.fill}
        minValue={0}
        maxValue={Math.max(items.length - 1, 0)}
        value={selectedIndex(props)}
        itemStyle={
          color === undefined ? restItemStyle : { ...restItemStyle, color: processColor(color) }
        }
        displayedValues={items.map((item) => item.label)}
        onValueChange={({ nativeEvent: { index } }) => {
          const item = items[index];
          if (item) onValueChange(item.value, index);
        }}
      />
    </View>
  );
}

function IOSWheelPicker<T>(props: WheelPickerProps<T>) {
  const { items, onValueChange, style, itemStyle, testID } = props;
  const flatItemStyle = StyleSheet.flatten(itemStyle) ?? {};
  // Picker.Item only takes a string. Other colors (PlatformColor, DynamicColorIOS)
  // still reach the rows through the picker's itemStyle, as does the system default.
  const color = typeof flatItemStyle.color === 'string' ? flatItemStyle.color : undefined;

  // UIPickerView values must be strings or numbers, so rows are keyed by
  // index and mapped back to the caller's value on change.
  return (
    <Picker
      testID={testID}
      style={style}
      // UIPickerView takes the label font off the picker itself. A style on
      // Picker.Item is Android-only and is dropped silently, leaving the wheel blank.
      itemStyle={flatItemStyle}
      selectedValue={selectedIndex(props)}
      onValueChange={(_, index) => {
        const item = items[index];
        if (item) onValueChange(item.value, index);
      }}
    >
      {items.map((item, index) => (
        <Picker.Item key={index} label={item.label} value={index} color={color} />
      ))}
    </Picker>
  );
}

export function WheelPicker<T>(props: WheelPickerProps<T>) {
  return Platform.OS === 'android' ? (
    <AndroidWheelPicker {...props} />
  ) : (
    <IOSWheelPicker {...props} />
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  fill: { flex: 1 },
});
