import type { Config } from 'tailwindcss';

// Every color comes from a CSS variable defined in src/styles/tokens.css.
// To re-brand the app, edit that one file.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        card: token('card'),
        elevated: token('elevated'),
        ink: token('ink'),
        body: token('body'),
        muted: token('muted'),
        line: token('line'),
        navy: token('navy'),
        primary: token('primary'),
        'primary-fg': token('primary-fg'),
        accent: token('accent'),
        tint: token('tint'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.06), 0 1px 3px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
