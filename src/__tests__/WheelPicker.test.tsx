import { PlatformColor, processColor, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { WheelPicker } from '../index';
import type { WheelPickerProps } from '../index';

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

describe('WheelPicker', () => {
  it('spans the items and starts on the selected one', async () => {
    await renderPicker();

    expect(picker().props).toMatchObject({
      selectedIndex: 1,
      displayedValues: ['Small', 'Medium', 'Large'],
    });
  });

  it('matches object values by keyExtractor', async () => {
    await renderPicker({ value: { id: 3 }, keyExtractor: (size) => size.id });

    expect(picker().props.selectedIndex).toBe(2);
  });

  it('matches object values by reference without keyExtractor', async () => {
    await renderPicker({ value: { id: 3 } });

    expect(picker().props.selectedIndex).toBe(0);
  });

  it('passes a system label color and the color scheme through', async () => {
    await renderPicker({ itemStyle: { color: PlatformColor('label') }, colorScheme: 'dark' });

    expect(picker().props).toMatchObject({
      themeVariant: 'dark',
      itemStyle: { color: processColor(PlatformColor('label')) },
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
      colorScheme: 'light',
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

    await renderPicker({ loop: true });
    expect(picker().props.wrapSelectorWheel).toBe(true);
  });

  it('ignores an index outside the items', async () => {
    const { onValueChange } = await renderPicker();

    await fireEvent(picker(), 'valueChange', { nativeEvent: { index: 7, eventCount: 1 } });

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
