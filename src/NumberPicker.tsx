import { useMemo } from 'react';
import { WheelPicker } from './WheelPicker';
import type { NumberPickerProps } from './types';

/** @deprecated Use `WheelPicker` with `items`. */
export function NumberPicker({ displayedValues, ...props }: NumberPickerProps) {
  const items = useMemo(
    () => displayedValues.map((label) => ({ label, value: label })),
    [displayedValues]
  );
  return <WheelPicker {...props} items={items} />;
}
