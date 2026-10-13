import { Platform, processColor, StyleSheet } from 'react-native';
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
  });
});

describe('WheelPicker on Android', () => {
  beforeEach(() => setPlatformOS('android'));

  it('spans the items and starts on the selected one', async () => {
    await renderPicker();

    expect(picker().props).toMatchObject({
      minValue: 0,
      maxValue: 2,
      value: 1,
      displayedValues: ['Small', 'Medium', 'Large'],
    });
  });

  it('falls back to the first row when the value is unknown', async () => {
    await renderPicker({ value: { id: 99 } });

    expect(picker().props.value).toBe(0);
  });

  it('translates the native index back into the item value', async () => {
    const { onValueChange } = await renderPicker();

    await fireEvent(picker(), 'valueChange', { nativeEvent: { value: 2, index: 2 } });

    expect(onValueChange).toHaveBeenCalledWith(LARGE, 2);
  });

  // Regression: the Android parser rejects #RGB and reads #RRGGBBAA as AARRGGBB,
  // so colors are resolved in JS before they cross the bridge.
  it('resolves item and divider colors to native color values', async () => {
    await renderPicker({ itemStyle: { color: '#222' }, dividerColor: '#ff000080' });

    expect(picker().props.itemStyle.color).toBe(processColor('#222'));
    expect(picker().props.dividerColor).toBe(processColor('#ff000080'));
  });

  it('ignores an index outside the items', async () => {
    const { onValueChange } = await renderPicker();

    await fireEvent(picker(), 'valueChange', { nativeEvent: { value: 7, index: 7 } });

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

    expect(picker().props.value).toBe(1);

    await fireEvent(picker(), 'valueChange', { nativeEvent: { value: 2, index: 2 } });

    expect(onValueChange).toHaveBeenCalledWith('08', 2);
  });
});
