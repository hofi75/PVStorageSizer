import { useEffect, useState } from 'react';

export type ColorScheme = 'light' | 'dark';

export function useColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return scheme;
}

// Reference palette (see dataviz skill: references/palette.md) - used unmodified.
export const TOKENS = {
  light: {
    surface: '#fcfcfb',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    muted: '#898781',
    gridline: '#e1e0d9',
    baseline: '#c3c2b7',
    good: '#0ca30c',
    diverging: { positive: '#2a78d6', negative: '#e34948', neutral: '#f0efec' },
    series: {
      production: '#2a78d6',
      consumption: '#eb6834',
      soc: '#1baf7a',
      gridImport: '#eda100',
      gridExport: '#e87ba4',
    },
  },
  dark: {
    surface: '#1a1a19',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    muted: '#898781',
    gridline: '#2c2c2a',
    baseline: '#383835',
    good: '#0ca30c',
    diverging: { positive: '#3987e5', negative: '#e66767', neutral: '#383835' },
    series: {
      production: '#3987e5',
      consumption: '#d95926',
      soc: '#199e70',
      gridImport: '#c98500',
      gridExport: '#d55181',
    },
  },
} as const;
