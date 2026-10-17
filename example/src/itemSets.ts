import type { WheelPickerItem } from 'react-native-next-wheel-picker';

type Size = 'S' | 'M' | 'L' | 'XL';
type Country = { code: string; name: string };

export type ItemSet = {
  label: string;
  items: readonly WheelPickerItem<unknown>[];
  // Object values need it: a fresh object is never Object.is to an item.
  keyExtractor?: (value: unknown) => string | number;
};

const range = (count: number, format: (n: number) => string) =>
  Array.from({ length: count }, (_, n) => ({ label: format(n), value: n }));

const COUNTRIES: Country[] = [
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Iceland' },
  { code: 'DE', name: 'Germany' },
];

const SIZES: Size[] = ['S', 'M', 'L', 'XL'];

export const ITEM_SETS = {
  minutes: { label: 'Numbers', items: range(60, (n) => String(n).padStart(2, '0')) },
  months: {
    label: 'Strings',
    items: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ].map((month) => ({ label: month, value: month })),
  },
  sizes: {
    label: 'Enum',
    items: SIZES.map((size) => ({ label: `Size ${size}`, value: size })),
  },
  countries: {
    label: 'Objects',
    // Copies, so only keyExtractor can match them to the items.
    items: COUNTRIES.map((country) => ({ label: country.name, value: { ...country } })),
    keyExtractor: (country) => (country as Country).code,
  },
  long: {
    label: 'Long labels',
    items: [
      'Registered nurse, intensive care',
      'Specialist physician in general medicine and family care',
      'Assistant nurse',
      'Psychologist with a licence to practise in Sweden and Norway',
    ].map((label, index) => ({ label, value: index })),
  },
  empty: { label: 'Empty', items: [] },
} satisfies Record<string, ItemSet>;

export type ItemSetKey = keyof typeof ITEM_SETS;
