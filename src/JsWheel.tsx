import { memo, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { WHEEL_HEIGHT } from './wheelProps';
import type { WheelProps } from './wheelProps';

// Rows past this distance from the band are fully faded and shrunk.
const VISIBLE_SPAN = 3;
const PAGE = 5;
const WEB = Platform.OS === 'web';

const PALETTE = {
  light: { text: '#000000', band: 'rgba(118, 118, 128, 0.12)' },
  dark: { text: '#ffffff', band: 'rgba(118, 118, 128, 0.24)' },
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * A wheel in plain JS for hosts without the native view, such as Expo Go and the web. It takes
 * the same props and imitates the native look; scrolling and snapping are the ScrollView's, or
 * CSS scroll snapping on the web.
 */
export function JsWheel<T>(props: WheelProps<T>) {
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

  const systemScheme = useColorScheme();
  const palette = PALETTE[colorScheme ?? (systemScheme === 'dark' ? 'dark' : 'light')];
  const { height = WHEEL_HEIGHT, ...textStyle } = StyleSheet.flatten(itemStyle) ?? {};
  const wheelHeight = typeof height === 'number' ? height : WHEEL_HEIGHT;
  const fontSize = textStyle.fontSize ?? 21;
  const rowHeight = Math.round(fontSize * 1.2) + 20;
  const inset = (wheelHeight - rowHeight) / 2;
  const textKey = JSON.stringify(textStyle);
  // Keyed on the content, so an inline itemStyle does not re-render every row.
  const labelStyle = useMemo(
    () => [styles.label, { fontSize, color: palette.text }, JSON.parse(textKey) as TextStyle],
    [fontSize, palette.text, textKey]
  );

  const count = items.length;
  // A looping wheel repeats the items and jumps back to the middle copy after each settle, so
  // the user never reaches an end.
  const copies = loop && count > 0 ? Math.max(3, 2 * Math.ceil(15 / count) + 1) : 1;
  const middle = Math.floor(copies / 2) * count;
  const rows = useMemo(
    () => Array.from({ length: count * copies }, (_, row) => items[row % count]!.label),
    [items, count, copies]
  );

  const reduceMotion = useReduceMotion();
  const scrollRef = useRef<ScrollView>(null);
  const [initialOffset] = useState(() => (middle + selectedIndex) * rowHeight);
  // Starts at the initial offset: a ScrollView sends no scroll event for its contentOffset.
  const [scrollY] = useState(() => new Animated.Value(initialOffset));
  // The row the wheel rests on, so a settle that lands on the selected row reports nothing.
  const restingRow = useRef(middle + selectedIndex);
  const dragging = useRef(false);
  // A controlled parent that keeps its old value after a change does not re-render the wheel, so
  // each change forces one for the effect below to snap the wheel back.
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const layout = `${count}:${loop}:${rowHeight}`;
  const laidOut = useRef(layout);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // react-native-web ignores contentOffset.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: initialOffset, animated: false });
  }, [initialOffset]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    []
  );

  const scrollToRow = (row: number, animated: boolean) => {
    restingRow.current = row;
    scrollRef.current?.scrollTo({ y: row * rowHeight, animated: animated && !reduceMotion });
  };

  // The row `delta` rows from where the wheel rests. A looping wheel near the end of its copies
  // first jumps to the same item in the middle copy, so it never runs out of rows.
  const rowAfter = (delta: number) => {
    const from = restingRow.current;
    if (!loop) return Math.min(Math.max(from + delta, 0), count - 1);
    if (from + delta >= count && from + delta < rows.length - count) return from + delta;
    const start = middle + mod(from, count);
    scrollToRow(start, false);
    return start + delta;
  };

  // Follows `value`, and snaps back when the parent keeps its old value after a change.
  useEffect(() => {
    if (dragging.current || count === 0) return;
    // The rows were rebuilt (items, loop or font size changed), so the offset points at another row.
    if (laidOut.current !== layout) {
      laidOut.current = layout;
      scrollToRow(middle + selectedIndex, false);
      return;
    }
    const shown = mod(restingRow.current, count);
    if (shown === selectedIndex) return;
    // A looping wheel turns the short way round: 59 to 00 is one row forward.
    let delta = selectedIndex - shown;
    if (loop) {
      delta = mod(delta, count);
      if (delta > count / 2) delta -= count;
    }
    scrollToRow(rowAfter(delta), true);
  });

  const report = (index: number) => {
    if (index === selectedIndex) return;
    onIndexChange(index);
    rerender();
  };

  const settle = (offsetY: number) => {
    if (count === 0) return;
    const row = Math.min(Math.max(Math.round(offsetY / rowHeight), 0), rows.length - 1);
    restingRow.current = row;
    if (loop && Math.floor(row / count) !== Math.floor(middle / count)) {
      scrollToRow(middle + (row % count), false);
    } else if (Math.abs(offsetY - row * rowHeight) > 1) {
      // Off a row when nothing snapped it, such as a browser without CSS scroll snapping.
      scrollToRow(row, true);
    }
    report(row % count);
  };

  const onEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false;
    settle(event.nativeEvent.contentOffset.y);
  };

  // Not made on the web, where the native driver is missing and Animated warns about it.
  const [onNativeScroll] = useState(() =>
    WEB
      ? undefined
      : Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })
  );

  // The web has no momentum events, so the wheel settles once scrolling and snapping go quiet.
  const onWebScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      // No end-of-drag event reaches here on the web, so quiet scrolling is the only release signal.
      dragging.current = false;
      settle(offsetY);
    }, 120);
  };

  const moveTo = (row: number) => {
    if (count === 0 || row === restingRow.current) return;
    scrollToRow(row, true);
    report(mod(row, count));
  };

  const step = (delta: number) => {
    if (count > 0) moveTo(rowAfter(delta));
  };

  // Rows are memoized, so their press handler stays put and calls the latest render's moveTo.
  const latestMoveTo = useRef(moveTo);
  useEffect(() => {
    latestMoveTo.current = moveTo;
  });
  const [onRowPress] = useState(() => (row: number) => latestMoveTo.current(row));

  const onKeyDown = (event: { key: string; preventDefault: () => void }) => {
    const shown = mod(restingRow.current, Math.max(count, 1));
    const delta = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -PAGE,
      PageDown: PAGE,
      Home: -shown,
      End: count - 1 - shown,
    }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    step(delta);
  };

  return (
    <View
      testID={testID}
      style={[styles.clip, style, { height: wheelHeight }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      // react-native-web reads the aria props, not accessibilityValue.
      aria-valuemin={0}
      aria-valuemax={Math.max(count - 1, 0)}
      aria-valuenow={selectedIndex}
      aria-valuetext={items[selectedIndex]?.label}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) =>
        step(nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      // On the web the outer view is the focusable slider, turned with the keyboard.
      {...(WEB ? { tabIndex: 0, onKeyDown } : {})}
    >
      <View
        pointerEvents="none"
        style={[
          styles.band,
          { top: inset, height: rowHeight, backgroundColor: selectionColor ?? palette.band },
        ]}
      />
      <Animated.ScrollView
        ref={scrollRef}
        testID={testID && `${testID}.scroll`}
        // The outer view speaks for the wheel; the rows would read out every label.
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        showsVerticalScrollIndicator={false}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialOffset }}
        contentContainerStyle={{ paddingVertical: inset }}
        style={WEB && webStyles.scroll}
        scrollEventThrottle={16}
        onScroll={WEB ? onWebScroll : onNativeScroll}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onScrollEndDrag={(event) => {
          // Without velocity there is no momentum phase, so this is the last event. The web
          // reports no velocity even mid-fling, so it settles on the idle timer instead.
          if (!WEB && (event.nativeEvent.velocity?.y ?? 0) === 0) onEnd(event);
        }}
        onMomentumScrollEnd={onEnd}
      >
        {rows.map((label, row) => (
          <Row
            key={row}
            row={row}
            label={label}
            rowHeight={rowHeight}
            scrollY={scrollY}
            labelStyle={labelStyle}
            onPress={onRowPress}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const Row = memo(function Row({
  row,
  label,
  rowHeight,
  scrollY,
  labelStyle,
  onPress,
}: {
  row: number;
  label: string;
  rowHeight: number;
  scrollY: Animated.Value;
  labelStyle: TextStyle[];
  onPress: (row: number) => void;
}) {
  const animatedStyle = useMemo(() => {
    const center = row * rowHeight;
    const inputRange = [
      center - VISIBLE_SPAN * rowHeight,
      center,
      center + VISIBLE_SPAN * rowHeight,
    ];
    const towardEdges = (edge: number) =>
      scrollY.interpolate({ inputRange, outputRange: [edge, 1, edge], extrapolate: 'clamp' });
    return {
      height: rowHeight,
      opacity: towardEdges(0.2),
      // Shrinks rows toward the edges like a cylinder; a rotateX tilt hid every row on Android.
      transform: [{ scaleY: towardEdges(0.6) }],
    };
  }, [row, rowHeight, scrollY]);

  return (
    <Animated.View style={[styles.row, WEB && webStyles.row, animatedStyle]}>
      {/* Tapping a row turns the wheel to it, as on UIPickerView. */}
      <Pressable
        style={styles.press}
        accessible={false}
        focusable={false}
        onPress={() => onPress(row)}
      >
        <Text numberOfLines={1} style={labelStyle}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => live && setReduce(value));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      live = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  band: { position: 'absolute', left: 8, right: 8, borderRadius: 8 },
  row: { justifyContent: 'center' },
  press: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  label: { textAlign: 'center' },
});

// CSS scroll snapping gives the web the row-by-row stops snapToInterval gives native, and
// overscroll containment keeps a wheel at its end from scrolling the page.
const webStyles = {
  scroll: { scrollSnapType: 'y mandatory', overscrollBehavior: 'contain' } as ViewStyle,
  row: { scrollSnapAlign: 'center' } as ViewStyle,
};
