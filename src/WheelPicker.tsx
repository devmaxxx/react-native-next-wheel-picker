import { useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { Platform, PlatformColor, processColor, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeWheelPicker } from './NativeWheelPicker';
import type { WheelPickerProps } from './types';

// The platform wheels work in row indexes; WheelPicker maps them to values.
type PlatformWheelProps<T> = Omit<WheelPickerProps<T>, 'value' | 'isEqual' | 'onValueChange'> & {
  selectedIndex: number;
  onIndexChange: (index: number) => void;
};

function AndroidWheelPicker<T>(props: PlatformWheelProps<T>) {
  const {
    items,
    selectedIndex,
    onIndexChange,
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
        // Processed by the view config (the native prop is a Color); processing
        // it here as well would read the ARGB number as RRGGBBAA.
        selectionColor={selectionColor}
        style={{ height }}
        selectedIndex={selectedIndex}
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
          onIndexChange(nativeEvent.index);
        }}
      />
    </View>
  );
}

// Rows a wrapping iOS wheel holds: enough that a user never flicks to an end.
const WRAP_ROWS = 1000;

// The copy of `index` nearest the row the wheel last showed, or the middle
// copy when that would sit in the first or last copy.
function wrappedRow(index: number, count: number, copies: number, lastRow?: number) {
  const middle = Math.floor(copies / 2) * count + index;
  if (lastRow === undefined) return middle;
  let row = lastRow - (lastRow % count) + index;
  if (row - lastRow > count / 2) row -= count;
  else if (lastRow - row > count / 2) row += count;
  return row < count || row >= (copies - 1) * count ? middle : row;
}

function IOSWheelPicker<T>(props: PlatformWheelProps<T>) {
  const {
    items,
    selectedIndex,
    onIndexChange,
    style,
    itemStyle,
    testID,
    selectionColor,
    themeVariant,
    wrapSelectorWheel = false,
  } = props;
  const flatItemStyle = StyleSheet.flatten(itemStyle) ?? {};
  // Picker.Item only takes a string. Other colors (PlatformColor, DynamicColorIOS)
  // still reach the rows through the picker's itemStyle, as does the system default.
  const color = typeof flatItemStyle.color === 'string' ? flatItemStyle.color : undefined;

  // UIPickerView cannot wrap, so a wrapping wheel repeats the items and stays
  // on whichever copy the user scrolled to.
  const count = items.length;
  const copies = wrapSelectorWheel && count > 1 ? Math.max(3, Math.ceil(WRAP_ROWS / count)) : 1;
  const [lastRow, setLastRow] = useState<number>();
  const row = copies > 1 ? wrappedRow(selectedIndex, count, copies, lastRow) : selectedIndex;

  // UIPickerView values must be strings or numbers, so rows are keyed by
  // index and mapped back to the caller's value on change.
  const rows = useMemo(
    () =>
      Array.from({ length: count * copies }, (_, index) => (
        <Picker.Item
          key={index}
          label={items[index % count]?.label ?? ''}
          value={index}
          color={color}
        />
      )),
    [items, count, copies, color]
  );

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
      selectedValue={row}
      onValueChange={(_, index) => {
        if (copies > 1) setLastRow(index);
        onIndexChange(index % count);
      }}
    >
      {rows}
    </Picker>
  );
}

export function WheelPicker<T>({
  value,
  isEqual = Object.is,
  onValueChange,
  ...props
}: WheelPickerProps<T>) {
  const { items } = props;
  // Without `value` the wheel is uncontrolled and keeps the user's pick itself.
  const [ownIndex, setOwnIndex] = useState(0);
  const selectedIndex =
    value === undefined
      ? Math.min(ownIndex, Math.max(items.length - 1, 0))
      : Math.max(
          items.findIndex((item) => isEqual(item.value, value)),
          0
        );

  // Tracks a controlled wheel too, so dropping `value` keeps the row shown.
  if (value !== undefined && ownIndex !== selectedIndex) setOwnIndex(selectedIndex);

  const onIndexChange = (index: number) => {
    const item = items[index];
    if (!item) return;
    if (value === undefined) setOwnIndex(index);
    onValueChange(item.value, index);
  };

  const Wheel = Platform.OS === 'android' ? AndroidWheelPicker : IOSWheelPicker;
  return <Wheel {...props} selectedIndex={selectedIndex} onIndexChange={onIndexChange} />;
}

// @react-native-picker/picker's iOS default, overridden by itemStyle.height.
const WHEEL_HEIGHT = 216;

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
