import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EFE7D4',
        card: '#FBF7EC',
        ink: '#2A2622',
        inkfaint: '#6B6355',
        spine: '#6B2737',
        spinedark: '#4E1D28',
        moss: '#3F4B3B',
        mosslight: '#5C6B54',
        brass: '#A9822F',
        brasslight: '#C9A24D',
        line: '#D9CFB6',
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
