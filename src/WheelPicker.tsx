import { useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { Platform, PlatformColor, processColor, StyleSheet, View } from 'react-native';
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
    wrapSelectorWheel = false,
    selectionColor,
    themeVariant,
  } = props;

  const {
    color,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    height = WHEEL_HEIGHT,
  } = StyleSheet.flatten(itemStyle) ?? {};
  const labels = useMemo(() => items.map((item) => item.label), [items]);
  // Echoed back so the wheel re-applies `value` after each change, as iOS
  // does: a parent that rejects a change snaps the wheel back.
  const [eventCount, setEventCount] = useState(0);

  return (
    <View style={[styles.clip, style]}>
      <NativeWheelPicker
        testID={testID}
        wrapSelectorWheel={wrapSelectorWheel}
        themeVariant={themeVariant}
        selectionColor={selectionColor === undefined ? undefined : processColor(selectionColor)}
        style={{ height }}
        selectedIndex={selectedIndex(props)}
        mostRecentEventCount={eventCount}
        itemStyle={{
          fontSize,
          fontFamily,
          fontWeight: fontWeight === undefined ? undefined : String(fontWeight),
          fontStyle,
          color: color === undefined ? undefined : processColor(color),
        }}
        displayedValues={labels}
        onValueChange={({ nativeEvent }) => {
          setEventCount(nativeEvent.eventCount);
          const item = items[nativeEvent.index];
          if (item) onValueChange(item.value, nativeEvent.index);
        }}
      />
    </View>
  );
}

function IOSWheelPicker<T>(props: WheelPickerProps<T>) {
  const { items, onValueChange, style, itemStyle, testID, selectionColor, themeVariant } = props;
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
      selectionColor={selectionColor}
      // Forwarded to the native picker; missing from Picker's typings.
      {...({ themeVariant } as Partial<ComponentProps<typeof Picker>>)}
      // UIPickerView takes the label font off the picker itself. A style on
      // Picker.Item is Android-only and is dropped silently, leaving the wheel blank.
      // RNCPicker defaults to black, which is unreadable in dark mode; `label`
      // follows the appearance, including a forced themeVariant.
      itemStyle={{ color: PlatformColor('label'), ...flatItemStyle }}
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

// @react-native-picker/picker's iOS default, overridden by itemStyle.height.
const WHEEL_HEIGHT = 216;

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
