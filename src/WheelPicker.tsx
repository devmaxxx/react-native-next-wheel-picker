import { useMemo, useState } from 'react';
import { processColor, StyleSheet, UIManager, View } from 'react-native';
import { JsWheel } from './JsWheel';
import { NativeWheelPicker } from './NativeWheelPicker';
import type { WheelPickerProps } from './types';
import { WHEEL_HEIGHT } from './wheelProps';
import type { WheelProps } from './wheelProps';

function NativeWheel<T>(props: WheelProps<T>) {
  const {
    items,
    selectedIndex,
    onIndexChange,
    style,
    itemStyle,
    testID,
    accessibilityLabel,
    loop = false,
    selectionColor,
    colorScheme,
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
  // Echoed back so the wheel re-applies `value` after each change: a parent
  // that rejects a change snaps the wheel back.
  const [eventCount, setEventCount] = useState(0);

  return (
    <View style={[styles.clip, style]}>
      <NativeWheelPicker
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        wrapSelectorWheel={loop}
        themeVariant={colorScheme}
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

export function WheelPicker<T>({
  value,
  keyExtractor,
  onValueChange,
  ...props
}: WheelPickerProps<T>) {
  const { items } = props;
  // Without `value` the wheel is uncontrolled and keeps the user's pick itself.
  const [ownIndex, setOwnIndex] = useState(0);
  const selectedIndex =
    value === undefined
      ? Math.min(ownIndex, Math.max(items.length - 1, 0))
      : Math.max(findIndex(items, value, keyExtractor), 0);

  // Tracks a controlled wheel too, so dropping `value` keeps the row shown.
  if (value !== undefined && ownIndex !== selectedIndex) setOwnIndex(selectedIndex);

  const onIndexChange = (index: number) => {
    const item = items[index];
    if (!item) return;
    if (value === undefined) setOwnIndex(index);
    onValueChange(item.value, index);
  };

  // Expo Go, the web and other hosts built without this package's native code get the JS wheel.
  const Wheel = UIManager.hasViewManagerConfig?.('RNNextWheelPicker') ? NativeWheel : JsWheel;
  return <Wheel {...props} selectedIndex={selectedIndex} onIndexChange={onIndexChange} />;
}

function findIndex<T>(
  items: WheelPickerProps<T>['items'],
  value: T,
  keyExtractor: WheelPickerProps<T>['keyExtractor']
) {
  if (!keyExtractor) return items.findIndex((item) => Object.is(item.value, value));
  const key = keyExtractor(value);
  return items.findIndex((item) => Object.is(keyExtractor(item.value), key));
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
