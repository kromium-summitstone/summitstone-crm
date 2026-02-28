/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#0a0a0a',
        surface: '#111111',
        surface2: '#1a1a1a',
        surface3: '#222222',
        accent: '#4a9eff',
        'accent-dim': 'rgba(74,158,255,0.12)',
        cream: '#f4f2ee',
        muted: 'rgba(244,242,238,0.4)',
        green: '#2ecc8a',
        amber: '#f5a623',
        danger: '#ff4d4d',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
        sans: ['var(--font-space-grotesk)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
