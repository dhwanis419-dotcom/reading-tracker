import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F2EDE1',
        card: '#FAF7F0',
        ink: '#3A342C',
        inkfaint: '#8A7B6C',
        spine: '#D97F5B',
        spinedark: '#B85E3C',
        moss: '#7C93A6',
        mosslight: '#96AABA',
        brass: '#C9A46B',
        brasslight: '#DBC08F',
        line: '#DED3BE',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-source-serif)', 'serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(42,38,34,0.05), 0 6px 16px -8px rgba(42,38,34,0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
