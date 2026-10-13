import { Platform, PlatformColor, processColor, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NumberPicker, WheelPicker } from '../index';
import type { WheelPickerProps } from '../index';

// The picker branches on Platform.OS, and jest's react-native preset resolves
// Platform to the iOS build, so the OS is set per test instead of mocked.
const setPlatformOS = (os: 'android' | 'ios') => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
};

type Size = { id: number };
const SMALL: Size = { id: 1 };
const MEDIUM: Size = { id: 2 };
const LARGE: Size = { id: 3 };
const ITEMS = [
  { label: 'Small', value: SMALL },
  { label: 'Medium', value: MEDIUM },
  { label: 'Large', value: LARGE },
];

const renderPicker = async (props: Partial<WheelPickerProps<Size>> = {}) => {
  const onValueChange = jest.fn();
  await render(
    <WheelPicker
      testID="picker"
      items={ITEMS}
      value={MEDIUM}
      onValueChange={onValueChange}
      {...props}
    />
  );
  return { onValueChange };
};

const picker = () => screen.getByTestId('picker');

describe('WheelPicker on iOS', () => {
  beforeEach(() => setPlatformOS('ios'));

  it('gives the wheel one row per item label', async () => {
    await renderPicker();

    expect(picker().props.items.map((item: { label: string }) => item.label)).toEqual([
      'Small',
      'Medium',
      'Large',
    ]);
  });

  it('starts on the selected value', async () => {
    await renderPicker();

    expect(picker().props.selectedIndex).toBe(1);
  });

  it('matches object values with isEqual', async () => {
    await renderPicker({ value: { id: 3 }, isEqual: (a, b) => a.id === b.id });

    expect(picker().props.selectedIndex).toBe(2);
  });

  it('reports the item value the wheel lands on', async () => {
    const { onValueChange } = await renderPicker();

    await fireEvent(picker(), 'change', { nativeEvent: { newValue: 2, newIndex: 2 } });

    expect(onValueChange).toHaveBeenCalledWith(LARGE, 2);
  });

  // Regression: itemStyle on Picker.Item is Android-only and left the iOS wheel blank.
  it('styles the labels through the picker itself', async () => {
    await renderPicker({ itemStyle: { fontSize: 27, color: '#495358' } });

    expect(StyleSheet.flatten(picker().props.style)).toMatchObject({
      fontSize: 27,
      color: '#495358',
    });
  });

  it('leaves the label color to the system when none is given', async () => {
    await renderPicker();

    expect(picker().props.items[0].textColor).toBeUndefined();
    expect(StyleSheet.flatten(picker().props.style).color).toEqual(PlatformColor('label'));
  });

  // UIPickerView cannot wrap: the items repeat and the wheel stays on the
  // copy the user scrolled to.
  it('wraps by repeating the items and keeps the copy the user is on', async () => {
    const { onValueChange } = await renderPicker({ wrapSelectorWheel: true });
    const rows = picker().props.items.length;
    const start = picker().props.selectedIndex;

    expect(rows).toBeGreaterThanOrEqual(1000);
    expect(start % 3).toBe(1);
    expect(start).toBeGreaterThan(rows / 3);

    // One row past the last item of this copy: the first item of the next.
    const next = start + 2;
    await fireEvent(picker(), 'change', { nativeEvent: { newIndex: next, newValue: next } });

    expect(onValueChange).toHaveBeenCalledWith(SMALL, 0);
  });

  it('passes the band color and theme to the native picker', async () => {
    await renderPicker({ selectionColor: '#ff000080', themeVariant: 'dark' });

    expect(picker().props).toMatchObject({
      selectionColor: processColor('#ff000080'),
      themeVariant: 'dark',
    });
  });
});

describe('WheelPicker on Android', () => {
  beforeEach(() => setPlatformOS('android'));

  it('spans the items and starts on the selected one', async () => {
    await renderPicker();

    expect(picker().props).toMatchObject({
      selectedIndex: 1,
      displayedValues: ['Small', 'Medium', 'Large'],
    });
  });

  it('falls back to the first row when the value is unknown', async () => {
    await renderPicker({ value: { id: 99 } });

    expect(picker().props.selectedIndex).toBe(0);
  });

  it('translates the native index back into the item value', async () => {
    const { onValueChange } = await renderPicker();

    await fireEvent(picker(), 'valueChange', { nativeEvent: { index: 2, eventCount: 1 } });

    expect(onValueChange).toHaveBeenCalledWith(LARGE, 2);
  });

  // Regression: nothing processes a color nested in itemStyle, so JS does.
  // selectionColor is a Color prop the view config already processes; doing it
  // twice turned #0a84ff33 into an opaque #330a84.
  it('resolves the item color and leaves selectionColor to the view config', async () => {
    await renderPicker({ itemStyle: { color: '#222' }, selectionColor: '#ff000080' });

    expect(picker().props.itemStyle.color).toBe(processColor('#222'));
    expect(picker().props.selectionColor).toBe('#ff000080');
  });

  it('is 216 tall like the iOS wheel unless itemStyle sets a height', async () => {
    await renderPicker();
    expect(StyleSheet.flatten(picker().props.style)).toEqual({ height: 216 });

    await renderPicker({ itemStyle: { height: 180 } });
    expect(StyleSheet.flatten(picker().props.style)).toEqual({ height: 180 });
  });

  it('passes the font like iOS: family, weight as a string, style', async () => {
    await renderPicker({
      itemStyle: { fontFamily: 'Inter', fontWeight: 600, fontStyle: 'italic' },
      themeVariant: 'light',
    });

    expect(picker().props.itemStyle).toMatchObject({
      fontFamily: 'Inter',
      fontWeight: '600',
      fontStyle: 'italic',
    });
    expect(picker().props.themeVariant).toBe('light');
  });

  // The wheel re-applies `value` once JS has seen the change, so a parent
  // that keeps its old value snaps the wheel back, as on iOS.
  it('echoes the last event count back to the wheel', async () => {
    await renderPicker();
    expect(picker().props.mostRecentEventCount).toBe(0);

    await fireEvent(picker(), 'valueChange', { nativeEvent: { index: 2, eventCount: 3 } });

    expect(picker().props).toMatchObject({ mostRecentEventCount: 3, selectedIndex: 1 });
  });

  it("keeps the user's pick without a value, and follows value once given", async () => {
    const { onValueChange } = await renderPicker({ value: undefined });
    expect(picker().props.selectedIndex).toBe(0);

    await fireEvent(picker(), 'valueChange', { nativeEvent: { index: 2, eventCount: 1 } });

    expect(onValueChange).toHaveBeenCalledWith(LARGE, 2);
    expect(picker().props.selectedIndex).toBe(2);
  });

  it('does not wrap past the last row unless asked, like iOS', async () => {
    await renderPicker();

    expect(picker().props.wrapSelectorWheel).toBe(false);
  });

  it('ignores an index outside the items', async () => {
    const { onValueChange } = await renderPicker();

    await fireEvent(picker(), 'valueChange', { nativeEvent: { index: 7, eventCount: 1 } });

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('NumberPicker', () => {
  beforeEach(() => setPlatformOS('android'));

  it('keeps the string API: displayed values in, the picked string out', async () => {
    const onValueChange = jest.fn();
    await render(
      <NumberPicker
        testID="picker"
        value="07"
        displayedValues={['06', '07', '08']}
        onValueChange={onValueChange}
      />
    );

    expect(picker().props.selectedIndex).toBe(1);

    await fireEvent(picker(), 'valueChange', { nativeEvent: { index: 2, eventCount: 1 } });

    expect(onValueChange).toHaveBeenCalledWith('08', 2);
  });
});
