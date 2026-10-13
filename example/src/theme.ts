import { createContext, useContext } from 'react';

const light = {
  background: '#f2f2f7',
  card: '#ffffff',
  text: '#000000',
  secondary: '#6d6d72',
  separator: '#c6c6c8',
  fill: '#7676801f',
  selectedSegment: '#ffffff',
  accent: '#007aff',
};

export type Theme = typeof light;

const dark: Theme = {
  background: '#000000',
  card: '#1c1c1e',
  text: '#ffffff',
  secondary: '#8d8d93',
  separator: '#38383a',
  fill: '#7676803d',
  selectedSegment: '#636366',
  accent: '#0a84ff',
};

export const themes = { light, dark };

export const ThemeContext = createContext<Theme>(light);

export const useTheme = () => useContext(ThemeContext);
