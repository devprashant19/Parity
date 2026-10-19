import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFDFC',
          100: '#F9F9FB',
          200: '#F4F4F6',
          300: '#E8E8ED',
          border: '#E2E2E8',
        },
        ink: {
          900: '#1A1A1E',
          800: '#2A2A30',
          700: '#404048',
          muted: '#64748B',
        },
        parity: {
          conflict: '#DC2626',
          consistent: '#16A34A',
          review: '#2563EB',
          highlight: 'rgba(250, 204, 21, 0.28)',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
